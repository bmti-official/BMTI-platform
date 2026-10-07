// 바디카드를 셋씩 늘어놓을 때의 차례.
//
// 그냥 섞기만 하면 운동만 줄줄이 나오는 날이 생긴다.
// 그래서 다섯 장을 한 묶음으로 보고, 내 유형이 반길 만한 갈래를 더 많이 끼워 넣는다.
//  · O 유형(느긋한 쪽) — 마사지 2 · 스트레칭 2 · 운동 1
//  · A 유형(부지런한 쪽) — 스트레칭 2 · 운동 2 · 마사지 1
// 같은 갈래 안에서는 그때그때 섞어, 열 때마다 새로 보이게 한다.

const PATTERN = {
  O: ['massage', 'stretch', 'massage', 'stretch', 'exercise'],
  A: ['stretch', 'exercise', 'stretch', 'exercise', 'massage'],
};

/** 내 BMTI 글자에서 O 쪽인지 A 쪽인지만 본다. */
export function gridSide(code) {
  return String(code || '').split('-')[0].toUpperCase().includes('O') ? 'O' : 'A';
}

// 섞기 — 같은 seed면 같은 차례가 나와, 다시 그려도 카드가 튀지 않는다.
function shuffle(list, seed) {
  const out = [...list];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i -= 1) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** 카드를 유형에 맞는 차례로 다시 늘어놓는다. */
export function gridOrder(cards = [], code, seed = 1) {
  const list = cards.filter(Boolean);
  if (list.length < 2) return list;

  // 갈래별로 나눠 섞어 둔다
  const pile = { exercise: [], stretch: [], massage: [], etc: [] };
  list.forEach((c) => { (pile[c.kind] ? pile[c.kind] : pile.etc).push(c); });
  Object.keys(pile).forEach((k, i) => { pile[k] = shuffle(pile[k], seed + i * 7919); });

  const want = PATTERN[gridSide(code)];
  const out = [];
  let i = 0;
  while (out.length < list.length) {
    const kind = want[i % want.length];
    i += 1;
    // 바라던 갈래가 없으면 가장 많이 남은 쪽에서 한 장 가져온다
    const from = pile[kind].length > 0
      ? kind
      : Object.keys(pile).reduce((a, b) => (pile[b].length > pile[a].length ? b : a), 'exercise');
    if (pile[from].length === 0) break;
    out.push(pile[from].shift());
  }
  return out;
}
