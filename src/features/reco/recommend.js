// 추천 루틴 고르기 — 화면 부품이 아니라 값과 셈만 담는다.
//
// 건강 정보 한 장에 적은 불편한 부위와, 플리에 담긴 동작의 핵심 부위가 겹치는 정도로 고른다.
//   · 한 주 동안은 같은 루틴을 보여 준다(주마다 바뀌는 씨앗으로 섞는다) — 볼 때마다 달라지면 과제가 아니다.
//   · 지난주에 끝까지 한 루틴은 조금 뒤로 물린다 — 비슷하게 맞는 다른 루틴이 있으면 그쪽이 올라온다.
//   · 부위를 적지 않았으면 맞춤 없이 그 주의 차례대로 보여 준다.
const pad = (n) => String(n).padStart(2, '0');
export const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 그 날이 속한 주의 월요일부터 일요일까지 — 날짜 일곱 개 */
export function weekDays(now = new Date()) {
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
  return [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return isoOf(d); });
}

// 같은 씨앗·같은 플리면 늘 같은 값(0~1) — 한 주 동안 차례가 흔들리지 않는다
function jitter(seed, id) {
  let h = 2166136261;
  const s = `${seed}:${id}`;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * plis      공개된 공식 플리(담긴 동작 포함)
 * parts     내 불편한 부위 열쇠(neck·shoulder…)
 * seed      주마다·사람마다 다른 씨앗
 * doneLast  지난주에 끝까지 한 플리 번호 모음
 * 돌려주는 것 [{ pli, fit(0~1), hits(겹친 부위 열쇠) }] — 많아야 n개
 */
export function recommend(plis = [], parts = [], { seed = '', doneLast = new Set(), n = 3 } = {}) {
  const scored = plis.filter((p) => (p.cards || []).length > 0).map((p) => {
    const hits = new Set();
    let pts = 0;
    p.cards.forEach((c) => {
      const core = (c.core_parts || []).filter((x) => parts.includes(x));
      if (core.length) { pts += 2; core.forEach((x) => hits.add(x)); }
      else if ((c.related_parts || []).some((x) => parts.includes(x))) pts += 1;
    });
    const fit = parts.length ? pts / (p.cards.length * 2) : 0;
    return { pli: p, fit, hits: [...hits], rank: fit - (doneLast.has(p.id) ? 0.15 : 0) + jitter(seed, p.id) * 0.1 };
  });
  scored.sort((a, b) => b.rank - a.rank);
  // 맞는 것이 하나라도 있으면 그것부터, 모자라면 나머지로 채운다
  const fits = scored.filter((x) => x.fit > 0);
  const rest = scored.filter((x) => x.fit === 0);
  return [...fits, ...rest].slice(0, n).map(({ pli, fit, hits }) => ({ pli, fit, hits }));
}
