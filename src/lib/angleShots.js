// 각도별 그림 모음 — 항목·성별마다 여러 장을 담고, 손님 값과 가장 가까운 걸 고른다.
//
// 단계 그림 셋으로는 150도든 165도든 같은 그림이 나왔다. 각도를 촘촘히 여러 장 두고
// 가장 가까운 걸 고르면, 값이 달라질 때 그림도 따라 달라진다.
//
// app_assets 한 칸(키: angle_set_목_성별)의 meta.shots에 담는다.
//   { id, url, angle, auto, sure }
//     angle … 그림의 실제 각도(코드가 재거나 관리자가 고친 값)
//     auto  … 코드가 잰 값 그대로인가(false면 관리자가 손으로 고친 것)
//     sure  … 재는 동안 관절이 얼마나 또렷했나(0~1)
export const SET_ITEMS = [
  { short: 'neck', label: '목의 정렬', view: '옆모습', unit: 'CVA', targets: [50, 55, 60, 65, 70, 75, 80, 85] },
  // 무릎을 편 채 손이 바닥에 닿으면 상체가 수평을 넘어가 130도 가까이 나온다
  // (올려 준 '가벼움' 그림을 재 보니 137도). 30~100으로는 유연한 사람을 못 담는다.
  { short: 'trunk', label: '허리 굽힘', view: '옆모습', unit: '도', targets: [30, 45, 60, 75, 90, 105, 120, 135] },
];
export const setKey = (short, gender) => `angle_set_${short}_${gender}`;
export const allSetKeys = () => SET_ITEMS.flatMap((it) => ['female', 'male'].map((g) => setKey(it.short, g)));

/** 쓸 수 있는 그림들(각도가 적힌 것)만 */
export const usableShots = (meta) => ((meta?.shots) || [])
  .filter((s) => s && s.url && Number.isFinite(Number(s.angle)));

/** 손님 값과 가장 가까운 그림. 없으면 null */
export function nearestShot(meta, value) {
  const v = Number(value);
  const list = usableShots(meta);
  if (!list.length || !Number.isFinite(v)) return null;
  return list.reduce((a, b) => (Math.abs(Number(b.angle) - v) < Math.abs(Number(a.angle) - v) ? b : a));
}

/** 목표 각도마다 가까운 그림이 있는지 — 관리자에서 '빈 자리'를 알려 준다.
 *  간격의 절반 안쪽에 그림이 있으면 채워진 것으로 본다. */
export function coverage(item, meta) {
  const list = usableShots(meta);
  const step = item.targets[1] - item.targets[0];
  return item.targets.map((t) => ({
    target: t,
    hit: list.some((s) => Math.abs(Number(s.angle) - t) <= step / 2),
  }));
}
