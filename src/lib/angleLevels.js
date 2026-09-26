// 각도에 따라 그림을 바꿔 끼운다.
//
// 한 장을 돌려 쓰는 것보다 정확하다. 목은 옆에서 봐야 하고 어깨는 앞에서 봐야 하는데,
// 한 장으로는 그 둘을 같이 담을 수 없다. 항목마다 보는 방향이 따로 있다.
//
// 단계는 셋. 1 가벼움 → 3 심함. 어디서 갈릴지는 관리자에서 정한다.
export const LEVEL_ITEMS = [
  {
    // CVA — 클수록 곧다. 경계는 **우리 것**이다. 임상의 50/30은 아래 점이 C7일 때의
    // 숫자인데 미디어파이프엔 C7이 없어 어깨점을 쓰므로 15~25도쯤 크게 나온다.
    key: 'neck_bend', short: 'neck', label: '목의 정렬', view: '옆모습', better: 'high',
    cuts: [65, 75],
    // 단계마다 그림이 어떤 모습이어야 하는지 — 관리자에서 그대로 안내한다
    shots: ['귀가 어깨 위에 곧게', '고개가 조금 앞으로', '고개가 많이 앞으로(거북목)'],
  },
  {
    key: 'trunk_flex', short: 'trunk', label: '허리 굽힘', view: '옆모습', better: 'high',
    cuts: [55, 80],
    shots: ['상체가 바닥과 거의 나란히', '허리를 반쯤 숙인 자세', '조금밖에 안 숙여진 자세'],
  },
  {
    key: 'arm_raise', short: 'arm', label: '옆으로 팔 들기', view: '앞모습', better: 'high',
    cuts: [120, 160],
    shots: ['팔이 귀 옆까지', '팔이 비스듬히 위로', '팔이 어깨 높이도 안 되게'],
  },
];

export const LEVEL_NAME = ['', '가벼움', '보통', '심함'];
export const LEVELS_KEY = 'angle_levels';
export const imgKey = (short, gender, lv) => `angle_lv_${short}_${gender}_${lv}`;

export const DEFAULT_CUTS = Object.fromEntries(LEVEL_ITEMS.map((i) => [i.short, i.cuts]));

/** 저장된 경계값을 지금 기준으로 읽는다.
 *  목은 CVA로 바꾸기 전에 '수직에서 기운 정도'(작을수록 곧음)로 저장된 값이 남아 있다.
 *  그대로 읽으면 누구든 30도를 넘어 전부 '가벼움'이 된다. 두 수가 다 45 밑이면
 *  옛 값으로 보고 90에서 빼서 옮긴다 — [15, 30] → [60, 75].
 *  (CVA 경계가 45 밑일 일은 없다. 그건 머리가 어깨보다 한참 앞에 있는 자세다) */
export function readCuts(meta = {}) {
  const out = { ...DEFAULT_CUTS };
  LEVEL_ITEMS.forEach((it) => {
    const v = meta?.[it.short];
    if (!Array.isArray(v) || v.length !== 2 || !v.every((x) => Number.isFinite(Number(x)))) return;
    let [a, b] = v.map(Number);
    if (it.short === 'neck' && a < 45 && b < 45) [a, b] = [90 - b, 90 - a];
    out[it.short] = [Math.min(a, b), Math.max(a, b)];
  });
  return out;
}

/** 잰 값이 몇 단계인지. 1 가벼움 · 2 보통 · 3 심함.
 *  허리·어깨는 클수록 좋은 값이라 방향을 뒤집어 본다. */
export function levelOf(item, v, cuts) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const [a, b] = (cuts && cuts[item.short]) || item.cuts;
  if (item.better === 'low') return n < a ? 1 : n < b ? 2 : 3;
  return n >= b ? 1 : n >= a ? 2 : 3;
}

/** 관리자에서 올려 둔 그림 가운데 이 단계에 맞는 것.
 *  그 단계가 비어 있으면 가까운 단계로 물러난다 — 셋을 다 채우기 전에도 보이게. */
export function pickImage(assets, item, gender, lv) {
  if (!assets || !lv) return null;
  const order = [lv, lv === 2 ? 1 : 2, lv === 3 ? 1 : 3];
  for (const n of order) {
    const hit = assets[imgKey(item.short, gender, n)];
    if (hit?.url) return { url: hit.url, level: n, exact: n === lv };
  }
  return null;
}

/** 관리자 화면에서 한 번에 불러올 키들 */
export const allImageKeys = () => LEVEL_ITEMS.flatMap((it) =>
  ['female', 'male'].flatMap((g) => [1, 2, 3].map((lv) => imgKey(it.short, g, lv))));
