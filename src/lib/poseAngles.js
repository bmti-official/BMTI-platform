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

/** 어깨에서 골반까지의 길이 — 몸 크기의 잣대. 거리가 달라도 이 길이로 나누면 견줄 수 있다.
 *
 *  **세로 차이가 아니라 실제 길이로 잰다.** 세로만 보면 허리를 굽힐 때
 *  어깨와 골반이 같은 높이로 와서 길이가 0에 가까워진다. 그러면
 *  '몸이 너무 작다', '옆으로 안 섰다'로 잘못 읽혀 굽히는 동안 내내 측정이 막힌다. */
export const torsoLen = (pts) => {
  const a = mid(pts[L.shoulderL], pts[L.shoulderR]);
  const b = mid(pts[L.hipL], pts[L.hipR]);
  return Math.hypot(a.x - b.x, a.y - b.y);
};

export const vis = (p) => p?.v ?? p?.visibility ?? 0;

/** 거리 — 재는 데 필요한 건 머리부터 골반까지다. 무릎·발목은 없어도 된다.
 *  그래서 온몸이 다 들어오지 않아도 괜찮고, 가까이 서도 된다.
 *  너무 가까우면 렌즈가 휘어 각도가 어긋나므로 그때만 물린다.
 *
 *  화면 밖 관절도 미디어파이프는 자리를 지어내서 내놓는다. 좌표만 보면
 *  '있다'고 읽히므로 **보이는 정도(visibility)를 같이** 본다.
 *  머리는 코가 안 잡혀도 귀가 잡히면 된다 — 옆모습에선 코가 자주 가린다. */
/** 목만 잴 때 쓰는 잣대 — 귀에서 어깨까지. 골반이 없어도 몸 크기를 알 수 있다.
 *  앉아서 재면 책상에 골반이 가려 torsoLen을 못 쓴다. */
export const headLen = (pts) => {
  const ear = vis(pts[L.earR]) >= vis(pts[L.earL]) ? pts[L.earR] : pts[L.earL];
  const sh = mid(pts[L.shoulderL], pts[L.shoulderR]);
  return Math.hypot(ear.x - sh.x, ear.y - sh.y);
};

/** 앉아서 목만 잴 때 — 좌우 어깨가 겹쳐 보이는지만 본다. 골반은 안 본다. */
export function sideOkNeck(pts) {
  const t = headLen(pts) || 1;
  const shoulder = Math.abs(pts[L.shoulderL].x - pts[L.shoulderR].x) / t;
  return { ok: shoulder < 1.0, shoulder };
}

export function distanceOk(pts, { needHead = true, needHips = true } = {}) {
  const h = torsoLen(pts);
  const head = pts[L.nose];
  const hip = mid(pts[L.hipL], pts[L.hipR]);
  const headSeen = Math.max(vis(head), vis(pts[L.earL]), vis(pts[L.earR])) > 0.3;
  const hipSeen = Math.max(vis(pts[L.hipL]), vis(pts[L.hipR])) > 0.3;
  const shSeen = Math.max(vis(pts[L.shoulderL]), vis(pts[L.shoulderR])) > 0.3;
  // 허리를 굽히는 동안엔 머리가 화면 밖으로 나가기 쉽다. 그때 재는 건 어깨~골반
  // 기울기뿐이라 머리는 없어도 된다 — 없다고 막으면 굽히는 내내 못 잰다.
  const headIn = headSeen && head.y > -0.03 && head.y < 1;
  const hipIn = hipSeen && hip.y > 0 && hip.y < 1.02;
  // 목만 잴 땐 골반이 없어도 된다 — 앉아서 재면 책상에 가린다.
  const inFrame = (needHead ? headIn : shSeen) && (needHips ? hipIn : shSeen);
  // 0.62는 좁았다. 가까이 서서 상체만 담아도 잴 수 있어야 한다.
  // 몸 크기 잣대도 갈아 끼운다. 골반이 없으면 귀~어깨로 잰다.
  const size = needHips ? h : headLen(pts);
  const lo = needHips ? 0.10 : 0.05;
  const hi = needHips ? 0.80 : 0.45;
  return { ok: inFrame && size > lo && size < hi, h: size, lo, hi, inFrame, headIn, hipIn, needHead, needHips, headY: head.y, hipY: hip.y };
}

/** 측면으로 제대로 섰나. 좌우 어깨가 겹쳐 보여야 옆모습이다.
 *  가까이 서면 어깨 간격이 그냥 커지므로, 몸 크기로 나눠서 본다. */
export function sideOk(pts) {
  const t = torsoLen(pts) || 1;
  const shoulder = Math.abs(pts[L.shoulderL].x - pts[L.shoulderR].x) / t;
  const hip = Math.abs(pts[L.hipL].x - pts[L.hipR].x) / t;
  // 0.38은 빡빡했다. 옆으로 잘 서 있어도 먼 쪽 어깨를 모델이 벌려 놓는 일이 잦다.
  return { ok: shoulder < 0.52 && hip < 0.52, shoulder, hip };
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

/** 점이 얼마나 또렷하게 잡혔나(0~1). 낮으면 그 판은 버린다.
 *
 *  짝으로 묶어서 본다. 옆모습에선 **먼 쪽 귀·어깨·골반이 몸에 가려** 늘 흐리게 잡히는데,
 *  낱개로 최솟값을 보면 제대로 서 있어도 늘 떨어진다. 짝 중 하나만 또렷하면 된다. */
export function seenWell(pts, want) {
  const score = (w) => (Array.isArray(w)
    ? Math.max(...w.map((i) => vis(pts[i])))
    : vis(pts[w]));
  const vs = want.map(score);
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

/** 어깨 들림 — 팔이 몸통에서 얼마나 벌어졌나. 정면에서 팔을 옆으로 올릴 때.
 *  한쪽만 안 올라가는 일이 흔해서 좌우를 따로 돌려준다. */
export function armRaiseSides(pts) {
  const hip = mid(pts[L.hipL], pts[L.hipR]);
  return {
    l: angleAt(pts[L.wristL], pts[L.shoulderL], hip),
    r: angleAt(pts[L.wristR], pts[L.shoulderR], hip),
  };
}
export function armRaise(pts) {
  const { l, r } = armRaiseSides(pts);
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

// ── 사람 모양인가 ────────────────────────────────────────────
// 미디어파이프는 사람이 아닌 걸 사람으로 잡기도 하고, 팔다리를 엉뚱한 데 붙이기도 한다.
// 예전엔 뼈대를 보여 주고 손님에게 '맞나요?'를 물었는데, 뼈대를 보고 판단하라는 건 무리다.
// 사람 몸이면 당연한 규칙 몇 가지를 코드가 대신 확인한다.
//
// pose는 저장해 둔 {x, y} 33개. 화면은 아래로 갈수록 y가 크다.
// 돌려주는 값: { ok, why } — why는 무엇이 어긋났는지(관리자·기록용)

const pt = (pose, i) => pose?.[i];
const midOf = (a, b) => (a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : a || b || null);
const dist = (a, b) => (a && b ? Math.hypot(a.x - b.x, a.y - b.y) : null);

/** 옆모습. sitting이면 골반을 따지지 않는다(앉으면 책상에 가린다).
 *  허리를 굽히는 판이 섞여 있으면 어깨가 골반보다 낮아질 수 있으므로,
 *  pose는 '가장 곧게 선 순간'을 넘겨받는다. */
export function sideShapeOk(pose, { sitting = false } = {}) {
  if (!Array.isArray(pose) || pose.length < 25) return { ok: false, why: 'no-pose' };
  const ear = midOf(pt(pose, L.earL), pt(pose, L.earR));
  const sh = midOf(pt(pose, L.shoulderL), pt(pose, L.shoulderR));
  const hip = midOf(pt(pose, L.hipL), pt(pose, L.hipR));
  if (!ear || !sh) return { ok: false, why: 'no-joint' };
  // 귀는 어깨보다 위에
  if (!(ear.y < sh.y)) return { ok: false, why: 'ear-below-shoulder' };
  if (sitting) {
    // 귀~어깨가 말도 안 되게 짧거나 길지 않은지 — 거의 0이면 점 두 개가 겹친 것
    const d = dist(ear, sh);
    return d > 0.03 ? { ok: true } : { ok: false, why: 'head-too-small' };
  }
  if (!hip) return { ok: false, why: 'no-hip' };
  // 어깨는 골반보다 위에
  if (!(sh.y < hip.y)) return { ok: false, why: 'shoulder-below-hip' };
  // 비율 — 귀~어깨가 어깨~골반보다 길면 사람 몸이 아니다(보통 0.3~0.6배)
  const r = dist(ear, sh) / (dist(sh, hip) || 1);
  if (r > 0.95 || r < 0.12) return { ok: false, why: 'odd-proportion' };
  return { ok: true };
}

/** 앞모습. 팔을 가장 높이 올린 순간의 pose를 넘겨받는다. */
export function frontShapeOk(pose) {
  if (!Array.isArray(pose) || pose.length < 25) return { ok: false, why: 'no-pose' };
  const sl = pt(pose, L.shoulderL), sr = pt(pose, L.shoulderR);
  const hl = pt(pose, L.hipL), hr = pt(pose, L.hipR);
  if (!sl || !sr || !hl || !hr) return { ok: false, why: 'no-joint' };
  const width = Math.abs(sl.x - sr.x);
  const torso = dist(midOf(sl, sr), midOf(hl, hr)) || 1;
  // 두 어깨 높이가 비슷해야 한다 — 어깨 너비의 40%보다 더 차이 나면 엉킨 것
  if (Math.abs(sl.y - sr.y) > width * 0.4) return { ok: false, why: 'shoulders-uneven' };
  // 어깨가 골반보다 위에
  if (!(midOf(sl, sr).y < midOf(hl, hr).y)) return { ok: false, why: 'shoulder-below-hip' };
  // 팔이 몸에 붙어 있어야 한다 — 손목이 어깨에서 몸통 길이의 1.6배 넘게 떨어져 있으면 엉뚱한 데 붙은 것
  for (const [s, w] of [[sl, pt(pose, L.wristL)], [sr, pt(pose, L.wristR)]]) {
    const d = dist(s, w);
    if (d != null && d > torso * 1.6) return { ok: false, why: 'arm-detached' };
  }
  return { ok: true };
}
