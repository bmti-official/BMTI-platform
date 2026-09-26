// 그림 한 장의 각도를 잰다 — 손님을 잴 때 쓰는 사람 인식을 그림에도 그대로 돌린다.
//
// AI로 만든 그림은 "20도 기울여 줘"를 정확히 지키지 못한다. 그래서 목표 각도를
// 믿지 않고, 올라온 그림을 직접 재서 실제 각도를 적어 둔다. 화면에서는 손님 값과
// 가장 가까운 그림을 고른다.
//
// 영상용(lite)보다 무거운 full 모델을 쓴다. 관리자에서 몇 장 재는 일이라 느려도 되고,
// 3D 그림처럼 실제 사람이 아닌 것도 더 잘 잡는다.
import { neckBend, trunkFlex, armRaiseSides, setFrameAspect, getFrameAspect, vis, L } from '../../lib/poseAngles';

let landmarker = null;
async function getLandmarker() {
  if (landmarker) return landmarker;
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
  const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm');
  landmarker = await PoseLandmarker.createFromOptions(files, {
    baseOptions: {
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
  });
  return landmarker;
}

const loadImg = (url) => new Promise((ok, bad) => {
  const im = new Image();
  im.crossOrigin = 'anonymous';          // 저장소 그림을 읽으려면 필요하다
  im.onload = () => ok(im);
  im.onerror = () => bad(new Error('그림을 불러오지 못했어요'));
  im.src = url;
});

const r1 = (v) => Math.round(v * 10) / 10;

/** 그림을 재서 { angle, pts, aspect, sure } 또는 { err }를 돌려준다.
 *  kind: 'neck' → 목의 정렬(CVA), 'trunk' → 허리 굽힘, 'arm' → 옆으로 팔 들기(큰 쪽, l·r에 양쪽)
 *  sure: 관절이 또렷하게 잡혔는지(0~1). 낮으면 관리자가 숫자를 확인해야 한다. */
export async function measureImage(url, kind) {
  let im;
  try { im = await loadImg(url); } catch (e) { return { err: e.message }; }
  let res;
  try {
    const lm = await getLandmarker();
    res = lm.detect(im);
  } catch (e) {
    return { err: '사람 인식을 불러오지 못했어요: ' + String(e?.message || e) };
  }
  const pts = res?.landmarks?.[0];
  if (!pts) return { err: '그림에서 사람을 찾지 못했어요. 숫자를 직접 적어 주세요.' };

  // 각도는 화면 비율을 알아야 바르게 나온다. 재는 동안만 그림 비율로 바꿨다가 돌려놓는다.
  const aspect = (im.naturalWidth || 1) / (im.naturalHeight || 1);
  const before = getFrameAspect();
  setFrameAspect(aspect);
  let angle, sure, l = null, r = null, warn = null;
  const best = (a, b) => Math.max(vis(pts[a]), vis(pts[b]));
  if (kind === 'neck') {
    angle = r1(90 - neckBend(pts));
    sure = Math.min(best(L.earL, L.earR), best(L.shoulderL, L.shoulderR));
  } else if (kind === 'trunk') {
    angle = r1(trunkFlex(pts));
    sure = Math.min(best(L.shoulderL, L.shoulderR), best(L.hipL, L.hipR));
  } else {
    const sides = armRaiseSides(pts);
    l = r1(sides.l); r = r1(sides.r);
    angle = Math.max(l, r);
    // 팔은 양쪽을 따로 보므로 두 손목·두 어깨가 모두 또렷해야 한다
    sure = Math.min(vis(pts[L.wristL]), vis(pts[L.wristR]), vis(pts[L.shoulderL]), vis(pts[L.shoulderR]));
    // 앞모습이면 그 사람의 왼어깨가 화면 오른쪽에 있다. 반대면 뒷모습이거나 좌우를 헷갈린 것
    if (pts[L.shoulderL].x < pts[L.shoulderR].x) warn = '왼팔·오른팔이 뒤바뀌어 잡혔을 수 있어요. 숫자를 확인해 주세요.';
  }
  setFrameAspect(before);
  // 그림 위에 뼈대를 그려 보여 주려고 자리만 남긴다
  const light = pts.map((q) => ({ x: r1(q.x * 1000) / 1000, y: r1(q.y * 1000) / 1000 }));
  return { angle, l, r, warn, pts: light, aspect, sure: r1(sure) };
}
