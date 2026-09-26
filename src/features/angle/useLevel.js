// 휴대폰이 얼마나 기울었는지 — 기울면 잰 각도가 통째로 그만큼 어긋난다.
//
// 세워 둔 휴대폰의 기울기는 '중력이 화면 어느 쪽을 향하나'로 잰다.
// 방향 센서(deviceorientation)의 좌우 값(gamma)은 휴대폰이 거의 수직일 때
// 값이 흔들려 쓸 수 없다(짐벌 잠김). 중력 방향은 세워 둔 휴대폰에서도 또렷하다.
//
//   roll  … 화면 안에서 좌우로 돌아간 각도. 이만큼은 계산으로 되돌릴 수 있다
//   pitch … 앞뒤로 눕힌 각도. 이건 영상 안에서 되돌릴 수 없어 말로 알린다
//
// 아이폰과 안드로이드는 중력 값의 부호가 반대다. 좌우 각도를 -90~90으로 접어서
// 부호 차이를 없앤다(둘 다 뒤집히면 180도 돌아간 값이 되므로, 접으면 같아진다).
//
// 기울기를 알려 주지 않는 기기(노트북 등)에서는 null로 두고 조용히 넘어간다.
import { useEffect, useRef, useState } from 'react';

export const ROLL_WARN = 15;   // 이보다 많이 돌아가면 보정하지 않고 세워 달라고 한다
export const PITCH_WARN = 20;  // 앞뒤로 이보다 눕히면 세워 달라고 한다
const deg = (r) => (r * 180) / Math.PI;
const fold = (a) => (a > 90 ? a - 180 : a < -90 ? a + 180 : a);

export function useLevel() {
  const [tilt, setTilt] = useState(null);   // { roll, pitch } 또는 null
  const smooth = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceMotionEvent) return undefined;
    const handle = (e) => {
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null) return;
      const x = Number(g.x) || 0, y = Number(g.y) || 0, z = Number(g.z) || 0;
      if (Math.hypot(x, y, z) < 3) return;              // 흔드는 중 — 중력이 아니다
      // 손떨림에 흔들리지 않게 조금씩만 따라간다
      const k = 0.15;
      const prev = smooth.current || { x, y, z };
      const s = { x: prev.x + (x - prev.x) * k, y: prev.y + (y - prev.y) * k, z: prev.z + (z - prev.z) * k };
      smooth.current = s;
      const roll = fold(deg(Math.atan2(s.x, s.y)));
      const pitch = deg(Math.atan2(Math.abs(s.z), Math.hypot(s.x, s.y)));
      setTilt({ roll: Math.round(roll * 10) / 10, pitch: Math.round(pitch * 10) / 10 });
    };
    window.addEventListener('devicemotion', handle);
    return () => window.removeEventListener('devicemotion', handle);
  }, []);

  /** 아이폰은 사람이 누른 자리에서만 센서 허락을 물을 수 있다. */
  const ask = async () => {
    const M = typeof window !== 'undefined' ? window.DeviceMotionEvent : null;
    if (M && typeof M.requestPermission === 'function') {
      try { await M.requestPermission(); } catch { /* 거절해도 그냥 넘어간다 */ }
    }
  };

  return { tilt, ask };
}

/** 휴대폰이 돌아간 만큼 관절 좌표를 되돌린다.
 *  좌표는 0~1이라 화면 가로세로 비율을 먼저 맞춰야 한다 — 안 그러면 돌리며 찌그러진다.
 *  sign은 실제 휴대폰으로 확인해 정한다(앞 카메라는 좌우가 뒤집혀 방향을 코드만으로 확신할 수 없다). */
export function unroll(pts, rollDeg, aspect = 0.75, sign = 1) {
  if (!pts || !rollDeg) return pts;
  const t = (sign * rollDeg * Math.PI) / 180;
  const c = Math.cos(t), s = Math.sin(t);
  return pts.map((p) => {
    if (!p) return p;
    const X = (p.x - 0.5) * aspect, Y = p.y - 0.5;
    const rx = X * c - Y * s, ry = X * s + Y * c;
    return { ...p, x: rx / aspect + 0.5, y: ry + 0.5 };
  });
}
