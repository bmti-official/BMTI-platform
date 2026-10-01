// 시작 전 그림 — 설명이 흐르는 동안 동작 영상 위에 덮는 멈춘 그림(최대 두 장).
// 손님 화면과 관리자 미리보기가 같은 부품을 쓴다. 그래야 옮겨 둔 자리가 그대로 보인다.

/**
 * imgs   introImgs(card)로 다듬은 것 — [{ url, x, y, s }]
 * at     지금 보여 줄 장(0 또는 1)
 * y      동작 영상과 같은 위아래 자리(clipY) — 옮기지 않은 그림은 영상과 같은 자리에 선다
 */
export default function IntroStills({ imgs = [], at = 0, y = 50, mirrored = false, hidden = false }) {
  if (!imgs.length) return null;
  const shown = Math.min(Math.max(0, at), imgs.length - 1);
  return (
    // 그림을 옮기면 틀 밖으로 나가 빈 자리가 생긴다 — 그 자리는 늘 흰색이다
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: '#fff', overflow: 'hidden',
      display: hidden ? 'none' : 'block', transform: mirrored ? 'scaleX(-1)' : 'none' }}>
      {imgs.map((m, i) => (
        <img key={`${i}-${m.url}`} src={m.url} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            objectPosition: `50% ${y}%`, transform: `translate(${m.x}%, ${m.y}%) scale(${m.s / 100})`,
            // 두 장을 겹쳐 두고 보이는 쪽만 켠다 — 바뀌는 순간 깜빡이지 않는다
            opacity: i === shown ? 1 : 0 }} />
      ))}
    </div>
  );
}
