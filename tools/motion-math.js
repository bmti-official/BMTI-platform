// 동작 추출 도구의 계산 부분 — 화면과 떼어 놓아 따로 시험할 수 있게 한다.
// 좌표(x, y)는 화면 기준이라 y가 아래로 갈수록 커진다.

// MediaPipe Pose가 돌려주는 33개 점 중 우리가 쓰는 것들
export const LM = {
  nose: 0, earL: 7, earR: 8,
  shoulderL: 11, shoulderR: 12,
  elbowL: 13, elbowR: 14,
  wristL: 15, wristR: 16,
  hipL: 23, hipR: 24,
  kneeL: 25, kneeR: 26,
  ankleL: 27, ankleR: 28,
};

// 캐릭터에 씌울 뼈대 열 개 — [이름, 시작점, 끝점]
export const BONES = [
  ['torso', 'hipC', 'shoulderC'],   // 몸통 (골반 가운데 → 어깨 가운데)
  ['head', 'shoulderC', 'nose'],    // 머리
  ['armL1', 'shoulderL', 'elbowL'], // 왼팔 위
  ['armL2', 'elbowL', 'wristL'],    // 왼팔 아래
  ['armR1', 'shoulderR', 'elbowR'],
  ['armR2', 'elbowR', 'wristR'],
  ['legL1', 'hipL', 'kneeL'],       // 왼다리 위
  ['legL2', 'kneeL', 'ankleL'],     // 왼다리 아래
  ['legR1', 'hipR', 'kneeR'],
  ['legR2', 'kneeR', 'ankleR'],
];

export const BONE_LABEL = {
  torso: '몸통', head: '머리',
  armL1: '왼팔 위', armL2: '왼팔 아래', armR1: '오른팔 위', armR2: '오른팔 아래',
  legL1: '왼다리 위', legL2: '왼다리 아래', legR1: '오른다리 위', legR2: '오른다리 아래',
};

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/** 한 프레임의 33개 점에서 우리가 쓰는 점만 골라 이름을 붙인다. 좌우 반전도 여기서 한다. */
export function pickPoints(landmarks, mirror = false) {
  const p = {};
  for (const [name, i] of Object.entries(LM)) {
    const l = landmarks[i];
    if (!l) return null;
    p[name] = { x: mirror ? 1 - l.x : l.x, y: l.y, v: l.visibility ?? 1 };
  }
  // 좌우를 뒤집으면 왼쪽·오른쪽 이름도 서로 바꿔 준다.
  if (mirror) {
    for (const k of ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle', 'ear']) {
      const t = p[`${k}L`]; p[`${k}L`] = p[`${k}R`]; p[`${k}R`] = t;
    }
  }
  p.shoulderC = mid(p.shoulderL, p.shoulderR);
  p.hipC = mid(p.hipL, p.hipR);
  return p;
}

/**
 * 뼈 하나의 각도. 아래로 곧게 뻗으면 0도, 오른쪽이 +, 왼쪽이 −, 위로 곧게 서면 180도.
 * 캐릭터 파츠를 이 각도만큼 돌리면 된다.
 */
export function boneAngle(a, b) {
  return (Math.atan2(b.x - a.x, b.y - a.y) * 180) / Math.PI;
}

/** 한 프레임에서 뼈대 열 개의 각도와, 골반 중심 위치를 뽑는다. */
export function frameAngles(p) {
  const scale = dist(p.shoulderL, p.shoulderR) || 0.0001;   // 어깨 너비를 자로 삼는다
  const angles = {};
  for (const [name, from, to] of BONES) angles[name] = boneAngle(p[from], p[to]);
  return {
    angles,
    // 골반 중심 — 어깨 너비를 1로 봤을 때의 자리. 앉았다 일어서는 동작을 살리려고 남긴다.
    root: { x: p.hipC.x / scale, y: p.hipC.y / scale },
    scale,
  };
}

/** −180~180을 넘나들 때 각도가 튀지 않게 이어 붙인다(언랩). */
export function unwrap(series) {
  const out = [series[0]];
  for (let i = 1; i < series.length; i++) {
    let d = series[i] - out[i - 1];
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    out.push(out[i - 1] + d);
  }
  return out;
}

/** −180~180 안으로 되돌린다. */
export const wrap = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

/**
 * 앞뒤 몇 칸을 평균 내 손떨림을 없앤다. win이 0이면 그대로 둔다.
 * loop가 true면 끝과 처음을 이어 붙여 평균 내므로 이음새도 매끄러워진다.
 */
export function smooth(series, win = 2, loop = false) {
  if (win <= 0 || series.length < 3) return series.slice();
  const n = series.length;
  return series.map((_, i) => {
    let sum = 0, cnt = 0;
    for (let k = -win; k <= win; k++) {
      let j = i + k;
      if (loop) j = ((j % n) + n) % n;
      else if (j < 0 || j >= n) continue;
      sum += series[j]; cnt++;
    }
    return sum / cnt;
  });
}

/** 프레임 수를 줄이거나 늘린다(사이값은 이어서 계산). */
export function resample(series, outLen) {
  if (series.length === outLen || series.length < 2) return series.slice();
  const out = [];
  for (let i = 0; i < outLen; i++) {
    const t = (i * (series.length - 1)) / (outLen - 1 || 1);
    const a = Math.floor(t), b = Math.min(series.length - 1, a + 1), f = t - a;
    out.push(series[a] * (1 - f) + series[b] * f);
  }
  return out;
}

/**
 * 마지막 프레임 다음에 첫 프레임이 와도 튀지 않게 만든다.
 * 뒤로 갈수록 조금씩 밀어 주는 방식이라 동작 모양은 거의 그대로 남는다.
 * strength 0 = 손대지 않음, 1 = 완전히 맞춤.
 */
export function seamFix(series, strength = 1) {
  const n = series.length;
  if (n < 3 || strength <= 0) return series.slice();
  const step = (series[n - 1] - series[0]) / (n - 1);   // 한 칸당 평균 변화
  // 끝 다음에 첫 프레임이 오려면 (첫 − 끝)이 한 칸 변화와 같아야 한다.
  const err = (series[0] - series[n - 1] - step) * strength;
  return series.map((v, i) => v + (err * i) / (n - 1));
}

/**
 * 프레임별 점 목록 → 캐릭터에 씌울 동작 데이터.
 * opts: { outFps, smoothWin, seam, name, kind }
 */
export function buildMotion(points, opts = {}) {
  const { outFps = 12, smoothWin = 2, seam = 1, srcFps = 24, name = '', kind = 'stretch' } = opts;
  const good = points.filter(Boolean);
  if (good.length < 2) return null;

  const frames = Math.max(2, Math.round((good.length / srcFps) * outFps));
  const per = good.map(frameAngles);

  const angles = {};
  for (const [bone] of BONES) {
    let s = unwrap(per.map((f) => f.angles[bone]));
    s = smooth(s, smoothWin);
    s = resample(s, frames);
    s = seamFix(s, seam);
    s = smooth(s, Math.min(1, smoothWin), true);   // 이음새를 한 번 더 둥글린다
    angles[bone] = s.map((v) => Math.round(wrap(v) * 10) / 10);
  }

  const rx = seamFix(resample(smooth(per.map((f) => f.root.x), smoothWin), frames), seam);
  const ry = seamFix(resample(smooth(per.map((f) => f.root.y), smoothWin), frames), seam);
  // 골반 자리는 첫 프레임을 0으로 두고 얼마나 움직였는지만 남긴다.
  const root = rx.map((x, i) => [
    Math.round((x - rx[0]) * 1000) / 1000,
    Math.round((ry[i] - ry[0]) * 1000) / 1000,
  ]);

  return {
    name, kind, fps: outFps, frames, loop: true,
    bones: BONES.map(([b]) => b),
    angles, root,
    meta: { madeAt: new Date().toISOString(), srcFrames: good.length, srcFps, smoothWin, seam },
  };
}

/** 동작 데이터를 다시 뼈대 좌표로 — 미리보기와 나중 플레이어가 함께 쓴다. */
export function poseAt(motion, i) {
  const a = (b) => motion.angles[b][i];
  const rad = (d) => (d * Math.PI) / 180;
  const step = (from, deg, len) => ({ x: from.x + Math.sin(rad(deg)) * len, y: from.y + Math.cos(rad(deg)) * len });

  const [rx, ry] = motion.root[i] || [0, 0];
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
