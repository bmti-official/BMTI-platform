// 몸의 각도 — 미디어파이프가 찍어 준 점들로 재는 셈.
// 화면 부품이 아니라 값만 다룬다. 따로 두어야 눈으로 확인하며 다듬을 수 있다.
//
// 재는 것은 셋이다.
//   neckBend   목 숙임      측면 · 가만히 섰을 때 (귀가 어깨보다 얼마나 앞에 나갔나)
//   trunkFlex  몸통 굽힘    측면 · 앞으로 굽혔을 때 몸통이 눕는 정도 (가동 범위)
//   armRaise   어깨 들림    정면 · 팔을 옆으로 들어 올린 정도 (가동 범위)
//
// 절대값을 그대로 보여 주지 않는다. '거북목 18도'는 의학 측정으로 읽힌다.
// 지난주 대비 얼마나 달라졌는지만 말한다.

// 미디어파이프 Pose 랜드마크 번호
export const L = {
  nose: 0, earL: 7, earR: 8,
  shoulderL: 11, shoulderR: 12,
  elbowL: 13, elbowR: 14,
  wristL: 15, wristR: 16,
  hipL: 23, hipR: 24,
  kneeL: 25, kneeR: 26,
  ankleL: 27, ankleR: 28,
};

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v ?? 1, b.v ?? 1) });
const deg = (rad) => (rad * 180) / Math.PI;

/** 두 점을 잇는 선이 수직선에서 얼마나 기울었나(도). 0이면 곧게 선 것. */
export function tiltFromVertical(top, bottom) {
  const dx = top.x - bottom.x;
  const dy = bottom.y - top.y;                 // 화면은 아래로 갈수록 y가 커진다
  if (Math.abs(dy) < 1e-6) return 90;
  return Math.abs(deg(Math.atan2(dx, dy)));
}

/** 세 점이 이루는 각(도). 가운데가 꼭짓점. */
export function angleAt(a, center, b) {
  const v1 = { x: a.x - center.x, y: a.y - center.y };
  const v2 = { x: b.x - center.x, y: b.y - center.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const n1 = Math.hypot(v1.x, v1.y), n2 = Math.hypot(v2.x, v2.y);
  if (n1 < 1e-6 || n2 < 1e-6) return 0;
  return deg(Math.acos(Math.max(-1, Math.min(1, dot / (n1 * n2)))));
}

// ── 잘 찍혔는지 보는 눈 ─────────────────────────────────────
// 각도 자체보다 이쪽이 중요하다. 흔들림이 변화보다 크면 추세가 무의미해진다.

/** 어깨에서 골반까지의 길이 — 몸 크기의 잣대. 거리가 달라도 이 길이로 나누면 견줄 수 있다. */
export const torsoLen = (pts) =>
  Math.abs(mid(pts[L.shoulderL], pts[L.shoulderR]).y - mid(pts[L.hipL], pts[L.hipR]).y);

/** 거리 — 재는 데 필요한 건 머리부터 골반까지다. 무릎·발목은 없어도 된다.
 *  그래서 온몸이 다 들어오지 않아도 괜찮고, 가까이 서도 된다.
 *  너무 가까우면 렌즈가 휘어 각도가 어긋나므로 그때만 물린다. */
export function distanceOk(pts) {
  const h = torsoLen(pts);
  const head = pts[L.nose];
  const hip = mid(pts[L.hipL], pts[L.hipR]);
  // 머리와 골반이 화면 안에 있는지 — 이 둘만 있으면 잴 수 있다
  const inFrame = head && head.y > 0.02 && hip.y < 0.99;
  return { ok: inFrame && h > 0.14 && h < 0.62, h, inFrame };
}

/** 측면으로 제대로 섰나. 좌우 어깨가 겹쳐 보여야 옆모습이다.
 *  가까이 서면 어깨 간격이 그냥 커지므로, 몸 크기로 나눠서 본다. */
export function sideOk(pts) {
  const t = torsoLen(pts) || 1;
  const shoulder = Math.abs(pts[L.shoulderL].x - pts[L.shoulderR].x) / t;
  const hip = Math.abs(pts[L.hipL].x - pts[L.hipR].x) / t;
  return { ok: shoulder < 0.38 && hip < 0.38, shoulder, hip };
}

/** 정면으로 제대로 섰나. 좌우 어깨가 벌어져 보여야 앞모습이다. */
export function frontOk(pts) {
  const t = torsoLen(pts) || 1;
  const shoulder = Math.abs(pts[L.shoulderL].x - pts[L.shoulderR].x) / t;
  return { ok: shoulder > 0.55, shoulder };
}

/** 무릎을 폈나. 허리를 굽힐 때 무릎이 굽으면 각도가 부풀려진다.
 *  무릎이 화면에 없으면 따지지 않는다 — 가까이 서서 재는 경우다. */
export function kneeStraight(pts) {
  const seen = (i) => (pts[i]?.v ?? pts[i]?.visibility ?? 0) > 0.5;
  const pair = (h, k, a) => (seen(k) && seen(a) ? angleAt(pts[h], pts[k], pts[a]) : null);
  const vs = [pair(L.hipL, L.kneeL, L.ankleL), pair(L.hipR, L.kneeR, L.ankleR)].filter((v) => v !== null);
  if (!vs.length) return true;                   // 안 보이면 넘어간다
  return Math.max(...vs) > 150;
}

/** 점이 얼마나 또렷하게 잡혔나(0~1). 낮으면 그 판은 버린다. */
export function seenWell(pts, want) {
  const vs = want.map((i) => pts[i]?.v ?? 0);
  return vs.length ? Math.min(...vs) : 0;
}

// ── 각도 셋 ────────────────────────────────────────────────

/** 목 숙임 — 귀가 어깨보다 얼마나 앞으로 나갔나. 측면에서 가만히 섰을 때. */
export function neckBend(pts) {
  const ear = pts[L.earR].x !== undefined && (pts[L.earR].v ?? 0) >= (pts[L.earL].v ?? 0) ? pts[L.earR] : pts[L.earL];
  const sh = mid(pts[L.shoulderL], pts[L.shoulderR]);
  return tiltFromVertical(ear, sh);
}

/** 몸통 굽힘 — 어깨-골반 선이 수직에서 얼마나 눕나. 측면에서 앞으로 굽힐 때. */
export function trunkFlex(pts) {
  return tiltFromVertical(mid(pts[L.shoulderL], pts[L.shoulderR]), mid(pts[L.hipL], pts[L.hipR]));
}

/** 어깨 들림 — 팔이 몸통에서 얼마나 벌어졌나. 정면에서 팔을 옆으로 올릴 때. */
export function armRaise(pts) {
  const hip = mid(pts[L.hipL], pts[L.hipR]);
  const l = angleAt(pts[L.wristL], pts[L.shoulderL], hip);
  const r = angleAt(pts[L.wristR], pts[L.shoulderR], hip);
  return Math.max(l, r);
}

// ── 가동 범위 잡기 ──────────────────────────────────────────
// 한 프레임의 값이 아니라, 움직이는 동안의 최댓값을 잡는다.
// 다만 스쳐 지나간 값은 버린다 — 0.3초 이상 머문 자리만 인정한다.

export const HOLD_MS = 300;

/** 각도 시계열에서 '머문 최댓값'을 찾는다. */
export function peakOf(series, holdMs = HOLD_MS) {
  if (!series.length) return 0;
  const top = Math.max(...series.map((s) => s.v));
  // 최댓값 근처(2도 안쪽)에 머문 시간이 충분한지 본다
  const near = series.filter((s) => s.v >= top - 2);
  if (near.length < 2) return 0;
  const stayed = near[near.length - 1].t - near[0].t;
  return stayed >= holdMs ? Math.round(top * 10) / 10 : 0;
}

/** 이번 판이 쓸 만한가 — 0~100. 낮은 판은 추세에서 뺀다. */
export function qualityOf({ seen = 0, poseOk = true, kneeOk = true, retries = 0 }) {
  let q = Math.round(seen * 100);
  if (!poseOk) q -= 30;
  if (!kneeOk) q -= 20;
  q -= Math.min(20, retries * 5);
  return Math.max(0, Math.min(100, q));
}
