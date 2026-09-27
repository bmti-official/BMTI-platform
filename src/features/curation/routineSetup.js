// 바로플리에 담은 동작마다 따로 정해 둔 설정을 카드에 입혀 준다.
//
// 같은 동작이라도 묶음 안에서는 가볍게 넘어가고 싶을 때가 있어서,
// 바로플리 쪽 값이 있으면 그것이 먼저다. 비어 있으면 카드에 적어 둔 기본값을 쓴다.

export const RC_SIDES = [['', '카드 그대로'], ['off', '좌우 없음'], ['both', '한쪽씩 둘 다'], ['alt', '좌우 번갈아']];

/** 바로플리에서 쓸 모습으로 카드를 바꿔 준다. */
export function withRoutineSetup(card = {}) {
  const out = { ...card };
  if (Number(card.rc_reps) > 0) out.default_reps = Number(card.rc_reps);
  if (Number(card.rc_sets) > 0) out.default_sets = Number(card.rc_sets);
  if (Number(card.rc_rest) > 0) out.default_rest = Number(card.rc_rest);
  const side = card.rc_side || '';
  if (side === 'off') { out.has_side = false; out.can_alternate = false; }
  if (side === 'both') { out.has_side = true; out.default_side = 'both'; }
  if (side === 'alt') { out.has_side = true; out.can_alternate = true; out.default_side = 'alt'; }
  if (side === 'right' || side === 'left') out.default_side = side;   // 마이플리 — 한쪽만
  if (card.rc_guide === 'count') out.default_guide = false;           // 마이플리 — 숫자만
  return out;
}
