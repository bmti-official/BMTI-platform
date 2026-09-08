// 바로카드의 처음 설정 — 종류마다 다르다.
//
// 운동은 '움직였다 돌아오기'가 한 번이라 여러 번 해야 하지만,
// 마사지·스트레칭은 영상 한 바퀴가 곧 '자세를 잡고 한참 버티기' 한 판이다.
// 그래서 횟수를 적게 잡고, 고를 수 있는 폭도 좁게 둔다.

const KIND_SETUP = {
  exercise: { reps: 15, sets: 3, rest: 10, repList: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] },
  massage:  { reps: 5,  sets: 3, rest: 10, repList: [3, 4, 5, 6, 7, 8] },
  stretch:  { reps: 5,  sets: 3, rest: 10, repList: [3, 4, 5, 6, 7, 8] },
};
const FALLBACK = KIND_SETUP.exercise;

export const SET_LIST = [3, 4, 5];
export const REST_LIST = [5, 10, 15, 20];

// 고른 값이 목록에 없으면 가장 가까운 것으로 맞춰 준다.
const nearest = (list, v) => list.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), list[0]);

/** 이 카드를 처음 열었을 때 보여 줄 설정. 카드에 적어 둔 값이 있으면 그것이 먼저다. */
export function cardSetup(card = {}) {
  const base = KIND_SETUP[card.kind] || FALLBACK;
  const repList = base.repList;
  const reps = Number(card.default_reps) > 0 ? nearest(repList, Number(card.default_reps)) : base.reps;
  const sets = Number(card.default_sets) > 0 ? nearest(SET_LIST, Number(card.default_sets)) : base.sets;
  const rest = Number(card.default_rest) > 0 ? nearest(REST_LIST, Number(card.default_rest)) : base.rest;
  return { reps, sets, rest, repList };
}

/** 관리자 화면에서 '비워 두면 이렇게 됩니다'를 적어 줄 때 쓴다. */
export function kindSetup(kind) {
  return KIND_SETUP[kind] || FALLBACK;
}
