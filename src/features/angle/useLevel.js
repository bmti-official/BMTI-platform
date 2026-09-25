// 휴대폰이 똑바로 서 있는지 — 기울면 각도가 통째로 틀어진다.
//
// 카메라가 5도 기울어 있으면 잰 각도도 5도 어긋난다. 주마다 기울기가 달라지면
// 그 차이가 '몸이 달라진 것'으로 읽힌다. 임상 앱들이 바닥 바를 수평에 맞추게 하는 이유다.
//
// 브라우저가 기울기를 알려 주지 않는 기기(노트북 등)에서는 조용히 넘어간다.
// 아이폰은 사람이 눌러야 허락을 물어볼 수 있어, 버튼에서 ask()를 부른다.
import { useEffect, useRef, useState } from 'react';

const TILT_OK = 6;    // 좌우 기울기 허용치(도)
const PITCH_OK = 14;  // 앞뒤로 눕힌 정도 허용치(도)

export function useLevel() {
  const [tilt, setTilt] = useState(null);     // { roll, pitch, ok } — null이면 알 수 없음
  const [asked, setAsked] = useState(false);
  const onRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.DeviceOrientationEvent) return undefined;
    // 아이폰은 허락을 받아야 값이 온다. 그 전까진 붙여 놔도 조용하다.
    const handle = (e) => {
      if (e.gamma == null && e.beta == null) return;
      onRef.current = true;
      const roll = Number(e.gamma) || 0;               // 좌우로 기운 정도
      const pitch = 90 - Math.abs(Number(e.beta) || 0); // 0이면 똑바로 세운 것
      setTilt({
        roll, pitch,
        ok: Math.abs(roll) <= TILT_OK && Math.abs(pitch) <= PITCH_OK,
      });
    };
    window.addEventListener('deviceorientation', handle);
    return () => window.removeEventListener('deviceorientation', handle);
  }, []);

  /** 아이폰에서 기울기를 쓰려면 사람이 누른 자리에서 물어야 한다. */
  const ask = async () => {
    setAsked(true);
    const D = typeof window !== 'undefined' ? window.DeviceOrientationEvent : null;
    if (D && typeof D.requestPermission === 'function') {
      try { await D.requestPermission(); } catch { /* 거절해도 그냥 넘어간다 */ }
    }
  };

  return { tilt, ask, asked, TILT_OK, PITCH_OK };
}
