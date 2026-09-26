// 목의 정렬 그림 — 3D 그림에서 머리·어깨를 크게 잘라 보여 주고, 손님의 실제 각도로 선을 긋는다.
//
// 목은 각도 차이가 몇 도라 그림만 바꿔서는 달라진 게 눈에 안 띈다. 그래서 그림은 4장만 두고,
// 그 그림의 어깨에서 귀 쪽으로 '손님 값' 그대로 선을 긋는다. 그림이 같아도 선은 값을 따라 움직인다.
//   수평 점선 … 어깨 높이
//   진한 선   … 이번 값(CVA — 수평에서 몇 도 서 있나)
//   흐린 선   … 지난번 값
// 전신 그림에서 목은 아주 작다. 목 둘레만 잘라(SVG viewBox) 그림과 선을 함께 키운다.
// 관절 자리(pts)는 그림을 올릴 때 코드가 잰 것이다. 없으면 그림을 통째로 보여 준다.
import { useEffect, useState } from 'react';

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/** shape: 잘라 낼 칸의 가로/세로 (각도 상자 3/4, 끝 화면 작은 칸 1/2) */
export default function NeckShot({ url, pts, value, prev = null, accent = '#7C6BD0', shape = 3 / 4, alt = '' }) {
  const [size, setSize] = useState(null);       // 그림 원래 크기 — 불러온 뒤에 안다
  useEffect(() => {
    let alive = true;
    const im = new Image();
    im.onload = () => { if (alive) setSize({ w: im.naturalWidth, h: im.naturalHeight }); };
    im.src = url;
    return () => { alive = false; };
  }, [url]);

  const ok = size && Array.isArray(pts) && pts.length > 12 && Number.isFinite(Number(value));
  if (!ok) {
    return <img src={url} alt={alt} style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain', display: 'block' }} />;
  }

  const { w: W, h: H } = size;
  const px = (q) => ({ x: q.x * W, y: q.y * H });
  const ear = px(mid(pts[7], pts[8]));
  const sh = px(mid(pts[11], pts[12]));
  const nose = px(pts[0]);
  const face = nose.x < ear.x ? -1 : 1;           // 얼굴이 향한 쪽
  const neck = Math.max(20, Math.hypot(ear.x - sh.x, ear.y - sh.y));

  // 목 둘레만 잘라 낸다 — 머리 꼭대기부터 가슴 조금 아래까지
  const ch = Math.min(H, neck * 4.6);
  const cw = Math.min(W, ch * shape);
  const cx = Math.max(0, Math.min(W - cw, (ear.x + sh.x) / 2 - cw / 2 + face * cw * 0.08));
  const cy = Math.max(0, Math.min(H - ch, ear.y - ch * 0.45));

  const len = neck * 1.1;                          // 귀 근처에서 멈춘다 — 얼굴을 가로지르지 않게
  const tip = (deg, l = len) => ({
    x: sh.x + face * Math.cos((deg * Math.PI) / 180) * l,
    y: sh.y - Math.sin((deg * Math.PI) / 180) * l,
  });
  const v = Number(value);
  const p = Number.isFinite(Number(prev)) && prev !== null ? Number(prev) : null;
  const r = len * 0.34;
  const a0 = tip(0, r), a1 = tip(v, r);
  const sw = ch * 0.014;
  const fs = ch * 0.085;
  // 숫자는 어깨선 바로 위, 몸 앞쪽 — 얼굴·턱에 겹치지 않게
  const lab = {
    x: Math.max(cx + fs * 1.1, Math.min(cx + cw - fs * 1.1, sh.x + face * len * 1.05)),
    y: sh.y - fs * 0.75,
  };
  const base = { x1: sh.x - face * neck * 0.15, x2: sh.x + face * len * 1.25 };

  return (
    <svg viewBox={`${cx} ${cy} ${cw} ${ch}`} role="img" aria-label={alt}
      style={{ width: '100%', aspectRatio: `${cw} / ${ch}`, display: 'block' }}>
      <image href={url} x="0" y="0" width={W} height={H} />
      {/* 어깨 높이 */}
      <line x1={base.x1} y1={sh.y} x2={base.x2} y2={sh.y} stroke="#fff" strokeWidth={sw * 1.8} strokeLinecap="round" opacity="0.85" />
      <line x1={base.x1} y1={sh.y} x2={base.x2} y2={sh.y}
        stroke="#9B9489" strokeWidth={sw * 0.7} strokeDasharray={`${sw * 1.8} ${sw * 1.4}`} strokeLinecap="round" />
      {/* 지난번 */}
      {p != null && Math.abs(p - v) >= 1 && (
        <g>
          <line x1={sh.x} y1={sh.y} x2={tip(p).x} y2={tip(p).y} stroke="#fff" strokeWidth={sw * 1.7} strokeLinecap="round" opacity="0.9" />
          <line x1={sh.x} y1={sh.y} x2={tip(p).x} y2={tip(p).y} stroke="#B3AA9C" strokeWidth={sw} strokeLinecap="round" />
        </g>
      )}
      {/* 각의 호 */}
      <path d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 0 ${face > 0 ? 0 : 1} ${a1.x} ${a1.y}`}
        fill="none" stroke={accent} strokeWidth={sw * 0.75} opacity="0.7" />
      {/* 이번 */}
      <line x1={sh.x} y1={sh.y} x2={tip(v).x} y2={tip(v).y} stroke="#fff" strokeWidth={sw * 1.9} strokeLinecap="round" />
      <line x1={sh.x} y1={sh.y} x2={tip(v).x} y2={tip(v).y} stroke={accent} strokeWidth={sw} strokeLinecap="round" />
      <circle cx={sh.x} cy={sh.y} r={sw * 1.3} fill={accent} stroke="#fff" strokeWidth={sw * 0.5} />
      <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="middle"
        fontSize={fs} fontWeight="900" fill={accent} stroke="#fff" strokeWidth={fs * 0.2} paintOrder="stroke">
        {Math.round(v)}°
      </text>
    </svg>
  );
}
