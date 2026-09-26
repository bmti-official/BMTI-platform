// 그림에서 사람이 있는 자리 — 머리끝부터 발끝까지를 찾아, 정해 둔 비율의 틀에 맞춘다.
//
// 영상에서 뽑은 장면은 가로 영상이면 사람이 작고 옆이 텅 빈다. 그림마다 크기도 제각각이다.
// 관절 자리(pts)로 몸 둘레를 잡아 같은 비율로 잘라 보이면, 어느 항목을 눌러도 같은 크기의 전신이 나온다.
// 돌려주는 것: SVG viewBox에 넣을 { x, y, w, h } (그림 픽셀 기준). 틀이 그림 밖으로 나가도 된다(빈 곳은 배경색).
export function bodyBox(pts, W, H, ratio = 0.5, flip = false) {
  if (!Array.isArray(pts) || pts.length < 29) return { x: 0, y: 0, w: W, h: H };
  const P = pts.map((q) => ({ x: (flip ? 1 - q.x : q.x) * W, y: q.y * H }));
  const xs = P.map((q) => q.x), ys = P.map((q) => q.y);
  let left = Math.min(...xs), right = Math.max(...xs);
  let bottom = Math.max(...ys);
  // 관절은 코·귀까지라 머리 꼭대기는 그보다 위 — 코에서 어깨까지만큼 더 올린다
  const nose = P[0];
  const shY = (P[11].y + P[12].y) / 2;
  let top = Math.min(...ys, nose.y - Math.abs(shY - nose.y) * 1.1);
  // 여백
  const padX = (right - left) * 0.08 + W * 0.01;
  const padY = (bottom - top) * 0.05 + H * 0.01;
  left -= padX; right += padX; top -= padY; bottom += padY;
  let w = right - left, h = bottom - top;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  if (w / h < ratio) w = h * ratio; else h = w / ratio;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
