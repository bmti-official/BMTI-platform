// 옆으로 팔 들기 — 코드로 그린 사람. 왼팔·오른팔을 잰 각도 그대로 따로 든다.
//
// 3D 그림은 한 장에 팔이 하나의 자세뿐이라, 한쪽만 덜 올라가도 보여 줄 수 없었다.
// (그림을 반씩 잘라 붙여 봤지만 AI 그림은 장마다 몸 위치가 달라 얼굴이 어긋났다)
// 코드로 그리면 1도 단위로, 좌우를 따로 움직일 수 있다.
//
// 앞을 보고 선 사람이라 **손님의 왼팔은 화면 오른쪽**에 그린다(거울이 아니다).
// 각도: 팔을 내린 게 0, 어깨 높이가 90, 머리 위가 180.
const SKIN = '#F3C9AC', SKIN_D = '#E4AE8C', TOP = '#34302E', PANTS = '#262322', HAIR = '#7A4A2E';
const rad = (d) => (d * Math.PI) / 180;
const cap = (a, b, w, c, key) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={c} strokeWidth={w} strokeLinecap="round" />
);
// 어깨에서 팔 방향으로 len만큼 — side: -1 화면 왼쪽, +1 화면 오른쪽
const along = (p, side, deg, len) => [p[0] + side * Math.sin(rad(deg)) * len, p[1] + Math.cos(rad(deg)) * len];

export default function ArmFigure({ left, right, prevLeft = null, prevRight = null, female = true, accent = '#7C6BD0' }) {
  const W = 252, H = 330, cx = W / 2, shY = 112, sw = 29, hipY = 214;
  // 손님의 오른팔 → 화면 왼쪽(-1), 손님의 왼팔 → 화면 오른쪽(+1)
  const sides = [
    { side: -1, deg: right, prev: prevRight, name: '오른팔' },
    { side: 1, deg: left, prev: prevLeft, name: '왼팔' },
  ];
  const sh = (side) => [cx + side * sw, shY + 6];

  const arm = ({ side, deg }, ghost = false) => {
    if (deg == null) return null;
    // 수평으로 들어도 손끝이 칸 안에 들게 길이를 맞춘다(어깨 29 + 팔 82 + 손 9 < 칸 절반)
    const s = sh(side), e = along(s, side, deg, 43), h = along(e, side, deg, 39);
    const c = ghost ? '#E9E3D9' : SKIN;
    return (
      <g key={`${ghost ? 'g' : 'a'}${side}`} opacity={ghost ? 0.9 : 1}>
        {cap(s, e, 15, c)}{cap(e, h, 13, c)}
        <circle cx={h[0]} cy={h[1]} r="8.5" fill={c} />
        {!ghost && cap(s, along(s, side, deg, 15), 21, TOP)}
      </g>
    );
  };
  const tag = ({ side, deg, name }) => {
    if (deg == null) return null;
    const p = along(sh(side), side, deg, 112);
    // 팔이 수평에 가까우면 숫자가 칸 밖으로 나간다 — 가장자리 안쪽에 붙잡아 둔다
    const x = Math.max(24, Math.min(W - 24, p[0])), y = Math.max(16, Math.min(H - 30, p[1] + 5));
    return (
      <g key={`t${side}`}>
        <text x={x} y={y} textAnchor="middle" fontSize="16" fontWeight="900" fill={accent}
          stroke="#fff" strokeWidth="4" paintOrder="stroke">{Math.round(deg)}°</text>
        <text x={cx + side * 62} y={H - 6} textAnchor="middle" fontSize="12" fontWeight="800" fill="#9B9489">{name}</text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W, overflow: 'visible' }}>
      {/* 어깨 높이(90°) — 팔이 여기보다 위인지 아래인지 한눈에 */}
      <line x1={14} y1={shY + 6} x2={W - 14} y2={shY + 6} stroke="#DDD6C9" strokeWidth="1.5" strokeDasharray="4 5" />
      {/* 이름은 선 아래 몸통 옆에 — 선 위에 두면 수평으로 든 팔에 가린다 */}
      <text x={W - 12} y={shY + 22} textAnchor="end" fontSize="10" fontWeight="800" fill="#C2BBAE">어깨 높이 90°</text>

      {/* 지난번 팔 — 흐리게 먼저 */}
      {sides.map((x) => (x.prev != null && Math.abs(x.prev - x.deg) >= 2 ? arm({ ...x, deg: x.prev }, true) : null))}

      {/* 다리·바지·몸통 */}
      {cap([cx - 11, hipY], [cx - 12, 300], 17, SKIN, 'll')}{cap([cx + 11, hipY], [cx + 12, 300], 17, SKIN, 'rl')}
      <rect x={cx - 33} y={hipY - 10} width="66" height="46" rx="12" fill={PANTS} />
      <rect x={cx - sw - 8} y={shY - 6} width={(sw + 8) * 2} height={hipY - shY + 6} rx="20" fill={TOP} />

      {/* 지금 팔 */}
      {sides.map((x) => arm(x))}

      {/* 목·얼굴 */}
      {cap([cx, shY - 24], [cx, shY - 2], 15, SKIN_D, 'neck')}
      <circle cx={cx} cy={shY - 50} r="27" fill={SKIN} />
      <path d={`M${cx - 28} ${shY - 48} q0 -35 28 -33 q28 -2 28 33 q-8 -19 -28 -19 q-20 0 -28 19z`} fill={HAIR} />
      {female && <circle cx={cx + 24} cy={shY - 72} r="8.5" fill={HAIR} />}
      <circle cx={cx - 9} cy={shY - 48} r="2.3" fill="#3A2A22" />
      <circle cx={cx + 9} cy={shY - 48} r="2.3" fill="#3A2A22" />
      <path d={`M${cx - 7} ${shY - 37} q7 5 14 0`} stroke="#B9785E" strokeWidth="2" fill="none" strokeLinecap="round" />

      {sides.map((x) => tag(x))}
    </svg>
  );
}
