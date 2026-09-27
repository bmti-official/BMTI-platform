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
  const padX = (right - left) * 0.06 + W * 0.01;
  const padY = (bottom - top) * 0.05 + H * 0.01;
  left -= padX; right += padX; top -= padY; bottom += padY;
  const cx = (left + right) / 2, cy = (top + bottom) / 2;
  // 크기는 몸 둘레가 아니라 '키'로 정한다 — 허리를 숙이면 둘레가 작아져 그림이 확대돼 보인다.
  // 키 ≈ 머리(코~어깨의 두 배쯤) + 몸통 + 넓적다리 + 정강이. 자세가 바뀌어도 거의 그대로다.
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const sh = mid(P[11], P[12]), hip = mid(P[23], P[24]), knee = mid(P[25], P[26]), ank = mid(P[27], P[28]);
  const stature = d(nose, sh) * 2 + d(sh, hip) + d(hip, knee) + d(knee, ank);
  // 몸 둘레가 다 들어가야 하므로(팔을 옆으로 벌리면 넓다) 둘 중 큰 쪽
  const h = Math.max(stature * 1.18, bottom - top, (right - left) / ratio);
  const w = h * ratio;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** 그림 전체를 자르지 않고 그 비율의 틀에 넣는다 — 남는 곳은 빈 곳(흰색)으로 */
export function wholeBox(W, H, ratio = 0.5) {
  if (W / H > ratio) { const h = W / ratio; return { x: 0, y: (H - h) / 2, w: W, h }; }
  const w = H * ratio;
  return { x: (W - w) / 2, y: 0, w, h: H };
}
