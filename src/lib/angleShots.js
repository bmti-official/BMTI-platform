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
  // 목은 몇 도 차이라 그림을 촘촘히 바꿔도 달라 보이지 않는다. 4장만 두고, 그림 위에
  // 손님 값대로 선을 그어 보여 준다(NeckShot).
  { short: 'neck', label: '목의 정렬', view: '옆모습', unit: 'CVA', targets: [55, 65, 75, 85], frames: 4 },
  // 무릎을 편 채 손이 바닥에 닿으면 상체가 수평을 넘어가 130도 가까이 나온다
  // (올려 준 '가벼움' 그림을 재 보니 137도). 30~100으로는 유연한 사람을 못 담는다.
  { short: 'trunk', label: '허리 굽힘', view: '옆모습', unit: '도', targets: [30, 45, 60, 75, 90, 105, 120, 135], frames: 8 },
  // 팔은 왼팔·오른팔 높이가 다를 수 있어 '짝'으로 모은다. [오른팔, 왼팔]이고 오른팔이 같거나 높은
  // 것만 만든다 — 반대쪽은 그림을 좌우로 뒤집어 쓴다. 그림에는 l(왼팔)·r(오른팔)도 적는다.
  { short: 'arm', label: '옆으로 팔 들기', view: '앞모습', unit: '도', step: 30, frames: 8,
    pairs: [[90, 90], [120, 90], [120, 120], [150, 90], [150, 120], [150, 150], [180, 90], [180, 120], [180, 150], [180, 180]] },
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

/** 팔 — 왼팔·오른팔이 둘 다 적힌 그림만 */
const pairShots = (meta) => usableShots(meta)
  .filter((s) => Number.isFinite(Number(s.l)) && Number.isFinite(Number(s.r)));

/** 팔 — 손님의 왼팔·오른팔 값과 가장 가까운 그림. 좌우로 뒤집은 것까지 견준다.
 *  { shot, flip } 또는 null. flip이면 화면에서 그림을 좌우로 뒤집어 보여 준다. */
export function nearestPair(meta, left, right) {
  const L = Number(left), R = Number(right);
  if (!Number.isFinite(L) || !Number.isFinite(R)) return null;
  let best = null;
  pairShots(meta).forEach((s) => {
    const l = Number(s.l), r = Number(s.r);
    [[false, l, r], [true, r, l]].forEach(([flip, a, b]) => {
      const d = Math.hypot(a - L, b - R);
      if (!best || d < best.d) best = { shot: s, flip, d };
    });
  });
  return best && { shot: best.shot, flip: best.flip };
}

/** 목표 각도마다 가까운 그림이 있는지 — 관리자에서 '빈 자리'를 알려 준다.
 *  간격의 절반 안쪽에 그림이 있으면 채워진 것으로 본다. */
export function coverage(item, meta) {
  if (item.pairs) {
    const list = pairShots(meta);
    const near = (a, b, R, L) => Math.abs(a - R) <= item.step / 2 && Math.abs(b - L) <= item.step / 2;
    return item.pairs.map(([R, L]) => ({
      target: `오 ${R}° · 왼 ${L}°`, pair: [R, L],
      hit: list.some((s) => near(Number(s.r), Number(s.l), R, L) || near(Number(s.l), Number(s.r), R, L)),
    }));
  }
  const list = usableShots(meta);
  const step = item.targets[1] - item.targets[0];
  return item.targets.map((t) => ({
    target: t,
    hit: list.some((s) => Math.abs(Number(s.angle) - t) <= step / 2),
  }));
}
