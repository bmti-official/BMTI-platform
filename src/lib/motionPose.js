// 동작 데이터(JSON)를 뼈대 좌표로 되돌린다.
// public/tools/motion-math.js 의 poseAt과 같은 규칙이어야 한다 — 한쪽을 고치면 다른 쪽도 고친다.

const rad = (d) => (d * Math.PI) / 180;
const step = (from, deg, len) => ({ x: from.x + Math.sin(rad(deg)) * len, y: from.y + Math.cos(rad(deg)) * len });

/** i번째 프레임의 관절 자리. 어깨 너비를 1로 본 상대 좌표다. */
export function poseAt(motion, i) {
  const a = (b) => motion.angles[b][i];
  const [rx, ry] = motion.root?.[i] || [0, 0];
  const hipC = { x: rx, y: ry };
  const shoulderC = step(hipC, a('torso'), 1.1);
  const head = step(shoulderC, a('head'), 0.7);
  const half = 0.5;
  const perp = a('torso') + 90;
  const shoulderL = step(shoulderC, perp, -half);
  const shoulderR = step(shoulderC, perp, half);
  const hipL = step(hipC, perp, -half * 0.7);
  const hipR = step(hipC, perp, half * 0.7);
  const elbowL = step(shoulderL, a('armL1'), 0.7), wristL = step(elbowL, a('armL2'), 0.65);
  const elbowR = step(shoulderR, a('armR1'), 0.7), wristR = step(elbowR, a('armR2'), 0.65);
  const kneeL = step(hipL, a('legL1'), 0.85), ankleL = step(kneeL, a('legL2'), 0.8);
  const kneeR = step(hipR, a('legR1'), 0.85), ankleR = step(kneeR, a('legR2'), 0.8);
  return { hipC, shoulderC, head, shoulderL, shoulderR, hipL, hipR, elbowL, wristL, elbowR, wristR, kneeL, ankleL, kneeR, ankleR };
}

/** 이어 그릴 뼈 목록 */
export const LINKS = [
  ['hipC', 'shoulderC'], ['shoulderL', 'shoulderR'], ['hipL', 'hipR'],
  ['shoulderL', 'elbowL'], ['elbowL', 'wristL'], ['shoulderR', 'elbowR'], ['elbowR', 'wristR'],
  ['hipL', 'kneeL'], ['kneeL', 'ankleL'], ['hipR', 'kneeR'], ['kneeR', 'ankleR'],
];

/** 동작 전체가 화면에 들어오도록 크기와 자리를 잰다. */
export function fitMotion(motion, w, h, pad = 34) {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (let i = 0; i < motion.frames; i++) {
    const q = poseAt(motion, i);
    for (const k of Object.keys(q)) {
      minX = Math.min(minX, q[k].x); maxX = Math.max(maxX, q[k].x);
      minY = Math.min(minY, q[k].y); maxY = Math.max(maxY, q[k].y);
    }
  }
  const s = Math.min((w - pad * 2) / Math.max(0.1, maxX - minX), (h - pad * 2) / Math.max(0.1, maxY - minY));
  return { s, ox: w / 2 - ((minX + maxX) / 2) * s, oy: h / 2 - ((minY + maxY) / 2) * s };
}

/** 동작 데이터가 우리가 쓰는 모양인지 확인한다. */
export function checkMotion(m) {
  if (!m || typeof m !== 'object') return '동작 데이터가 아닙니다.';
  if (!Array.isArray(m.bones) || !m.angles || !m.frames) return '동작 데이터의 모양이 다릅니다. 동작 뽑기 도구에서 받은 JSON을 넣어 주세요.';
  const need = ['torso', 'head', 'armL1', 'armL2', 'armR1', 'armR2', 'legL1', 'legL2', 'legR1', 'legR2'];
  const missing = need.filter((b) => !Array.isArray(m.angles[b]) || m.angles[b].length !== m.frames);
  if (missing.length) return `빠진 뼈대가 있습니다: ${missing.join(', ')}`;
  return null;
}
