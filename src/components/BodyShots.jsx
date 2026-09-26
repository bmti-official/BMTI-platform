// 허리 굽힘·옆으로 팔 들기 그림 — 가까운 각도의 3D 그림 위에 손님의 실제 각도로 선을 긋는다.
//
// 그림은 몇 장뿐이라 손님 값과 딱 맞지 않는다. 그래서 그림은 '비슷한 모습'으로 쓰고,
// 정확한 값은 그림 위에 그은 선이 보여 준다(목의 정렬 NeckShot과 같은 생각).
// 관절 자리(pts)는 그림을 올릴 때 코드가 잰 것이다. 없으면 그림만 보여 준다.
import { useImgSize } from '../lib/useImgSize';
import { bodyBox } from '../lib/bodyBox';

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const rad = (d) => (d * Math.PI) / 180;
const plain = (url, alt, flip) => (
  <img src={url} alt={alt} style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain', display: 'block',
    transform: flip ? 'scaleX(-1)' : 'none' }} />
);

/** 한 줄 — 흰 테두리를 깔아 어느 그림 위에서도 보이게 */
function Stroke({ a, b, color, w, faint = false }) {
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#fff" strokeWidth={w * 1.8} strokeLinecap="round" opacity="0.9" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={faint ? '#B3AA9C' : color} strokeWidth={w} strokeLinecap="round" />
    </g>
  );
}

function Label({ at, text, color, fs }) {
  return (
    <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="middle" fontSize={fs} fontWeight="900"
      fill={color} stroke="#fff" strokeWidth={fs * 0.2} paintOrder="stroke">{text}</text>
  );
}

/** 허리 굽힘 — 골반에서 수직선(서 있을 때)과, 손님 값만큼 숙인 몸통 선.
 *  small: 끝 화면의 작은 칸 — 선과 글씨를 굵게 */
export function TrunkShot({ url, pts, value, prev = null, accent = '#7C6BD0', small = false, frame = null, alt = '' }) {
  const size = useImgSize(url);
  const ok = size && Array.isArray(pts) && pts.length > 24 && Number.isFinite(Number(value));
  if (!ok) return plain(url, alt, false);
  const { w: W, h: H } = size;
  const px = (q) => ({ x: q.x * W, y: q.y * H });
  const hip = px(mid(pts[23], pts[24]));
  const sh = px(mid(pts[11], pts[12]));
  const ear = px(mid(pts[7], pts[8]));
  const nose = px(pts[0]);
  // 숙이는 쪽 — 그림 속 몸통이 기운 쪽. 거의 서 있으면 얼굴이 향한 쪽.
  // (숙이면 코가 귀 아래로 내려가 코·귀로는 방향을 잘못 읽는다)
  const lean = sh.x - hip.x;
  const face = Math.abs(lean) > Math.hypot(sh.x - hip.x, sh.y - hip.y) * 0.15
    ? Math.sign(lean) : (nose.x < ear.x ? -1 : 1);
  const len = Math.max(40, Math.hypot(sh.x - hip.x, sh.y - hip.y) * 1.15);
  const tip = (d, l = len) => ({ x: hip.x + face * Math.sin(rad(d)) * l, y: hip.y - Math.cos(rad(d)) * l });
  const v = Number(value);
  const p = prev != null && Number.isFinite(Number(prev)) ? Number(prev) : null;
  // frame: 전신을 그 비율의 틀에 맞춘다(각도 상자 — 세 항목이 같은 크기로 보이게)
  const bb = frame ? bodyBox(pts, W, H, frame) : { x: 0, y: 0, w: W, h: H };
  const sw = bb.h * (small ? 0.02 : 0.011);
  const fs = bb.h * (small ? 0.075 : 0.045);
  const r = len * 0.32;
  const a0 = tip(0, r), a1 = tip(v, r);
  // 숫자는 등 뒤 — 숙인 몸과 반대쪽이라 그림을 가리지 않는다
  const lab = { x: Math.max(bb.x + fs * 1.2, Math.min(bb.x + bb.w - fs * 1.2, hip.x - face * len * 0.32)), y: hip.y - len * 0.55 };
  return (
    <svg viewBox={`${bb.x} ${bb.y} ${bb.w} ${bb.h}`} role="img" aria-label={alt}
      style={{ width: '100%', aspectRatio: `${bb.w} / ${bb.h}`, display: 'block' }}>
      {frame && <rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="#fff" />}
      <image href={url} x="0" y="0" width={W} height={H} />
      <line x1={hip.x} y1={hip.y} x2={hip.x} y2={hip.y - len} stroke="#9B9489" strokeWidth={sw * 0.7}
        strokeDasharray={`${sw * 1.8} ${sw * 1.4}`} strokeLinecap="round" />
      {p != null && Math.abs(p - v) >= 1 && <Stroke a={hip} b={tip(p)} w={sw} faint />}
      <path d={`M ${a0.x} ${a0.y} A ${r} ${r} 0 ${v > 180 ? 1 : 0} ${face > 0 ? 1 : 0} ${a1.x} ${a1.y}`}
        fill="none" stroke={accent} strokeWidth={sw * 0.75} opacity="0.7" />
      <Stroke a={hip} b={tip(v)} color={accent} w={sw} />
      <circle cx={hip.x} cy={hip.y} r={sw * 1.3} fill={accent} stroke="#fff" strokeWidth={sw * 0.5} />
      <Label at={lab} text={`${Math.round(v)}°`} color={accent} fs={fs} />
    </svg>
  );
}

/** 옆으로 팔 들기 — 어깨마다 손님 값만큼 든 팔 선. 앞모습이라 손님의 오른팔은 화면 왼쪽.
 *  flip: 그림을 좌우로 뒤집어 쓴다(왼팔이 더 높은 손님에게 오른팔이 높은 그림을 쓸 때).
 *  tags: 아래 두 귀퉁이에 '오른팔 128°'·'왼팔 156°'를 붙인다 */
export function ArmShot({ url, pts, left, right, prevLeft = null, prevRight = null, flip = false,
  accent = '#7C6BD0', small = false, tags = true, frame = null, alt = '' }) {
  const size = useImgSize(url);
  const has = (v) => v != null && Number.isFinite(Number(v));
  const ok = size && Array.isArray(pts) && pts.length > 16 && (has(left) || has(right));
  if (!ok) return plain(url, alt, flip);
  const { w: W, h: H } = size;
  const px = (q) => ({ x: (flip ? 1 - q.x : q.x) * W, y: q.y * H });
  // 화면 왼쪽 어깨 = 손님의 오른팔 자리
  const sides = [[11, 13, 15], [12, 14, 16]].map(([s, e, w]) => ({ s: px(pts[s]), e: px(pts[e]), w: px(pts[w]) }))
    .sort((a, b) => a.s.x - b.s.x);
  const armLen = (x) => Math.hypot(x.e.x - x.s.x, x.e.y - x.s.y) + Math.hypot(x.w.x - x.e.x, x.w.y - x.e.y);
  const len = Math.max(40, (armLen(sides[0]) + armLen(sides[1])) / 2);
  const bb = frame ? bodyBox(pts, W, H, frame, flip) : { x: 0, y: 0, w: W, h: H };
  const sw = bb.h * (small ? 0.02 : 0.011);
  const arms = [
    { at: sides[0].s, out: -1, v: right, p: prevRight },
    { at: sides[1].s, out: 1, v: left, p: prevLeft },
  ];
  // 팔을 내린 자리(0도)에서 바깥쪽으로 돌아 올라간다
  const tip = (arm, d) => ({ x: arm.at.x + arm.out * Math.sin(rad(d)) * len, y: arm.at.y + Math.cos(rad(d)) * len });
  const fs = bb.h * (small ? 0.07 : 0.04);
  const shY = (sides[0].s.y + sides[1].s.y) / 2;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`${bb.x} ${bb.y} ${bb.w} ${bb.h}`} role="img" aria-label={alt}
        style={{ width: '100%', aspectRatio: `${bb.w} / ${bb.h}`, display: 'block' }}>
        {frame && <rect x={bb.x} y={bb.y} width={bb.w} height={bb.h} fill="#fff" />}
        <image href={url} x="0" y="0" width={W} height={H}
          transform={flip ? `translate(${W} 0) scale(-1 1)` : undefined} />
        {/* 어깨 높이(90도) */}
        <line x1={sides[0].s.x - len} y1={shY} x2={sides[1].s.x + len} y2={shY} stroke="#9B9489" strokeWidth={sw * 0.6}
          strokeDasharray={`${sw * 1.8} ${sw * 1.4}`} strokeLinecap="round" />
        {arms.map((a, i) => has(a.p) && has(a.v) && Math.abs(Number(a.p) - Number(a.v)) >= 2 && (
          <Stroke key={`p${i}`} a={a.at} b={tip(a, Number(a.p))} w={sw} faint />
        ))}
        {arms.map((a, i) => has(a.v) && <Stroke key={`v${i}`} a={a.at} b={tip(a, Number(a.v))} color={accent} w={sw} />)}
        {arms.map((a, i) => <circle key={`c${i}`} cx={a.at.x} cy={a.at.y} r={sw * 1.2} fill={accent} stroke="#fff" strokeWidth={sw * 0.5} />)}
        {!tags && arms.map((a, i) => has(a.v) && (
          <Label key={`l${i}`} color={accent} fs={fs} text={`${Math.round(Number(a.v))}°`}
            at={(() => {
              const t = tip(a, Number(a.v));
              return { x: Math.max(bb.x + fs * 1.3, Math.min(bb.x + bb.w - fs * 1.3, t.x + a.out * fs * 0.6)), y: Math.max(bb.y + fs, Math.min(bb.y + bb.h - fs, t.y)) };
            })()} />
        ))}
      </svg>
      {tags && [['left', '오른팔', right], ['right', '왼팔', left]].map(([side, lb, v]) => (
        <span key={side} style={{ position: 'absolute', [side]: 4, bottom: 6, fontSize: 10, fontWeight: 900, color: accent,
          background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '2px 7px', lineHeight: 1.3, textAlign: 'center' }}>
          {lb}<br /><span style={{ fontSize: 13 }}>{has(v) ? `${Math.round(Number(v))}°` : '—'}</span>
        </span>
      ))}
    </div>
  );
}
