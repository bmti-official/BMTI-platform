// 핵심/연관 부위 노출 규칙 — 어떤 콘텐츠를 몇 번째에 보여줄지 정하는 순서표를 만든다.
//
// 기획 규칙
//   핵심 위주(C 유형) : 핵심 부위를 부위당 3번씩 → 그 사이에 연관 1번.
//                      핵심·연관을 한 바퀴 다 돌면 2번은 아예 다른 부위(인기순).
//   연관 위주(L 유형) : 핵심 1번 · 연관 1번을 번갈아.
//                      10번에 한 번씩 아예 다른 부위를 2번 연달아(인기순).
//   전체 선택         : 규칙 없이 무작위.
//
// 순서표는 '부위 묶음 id'의 배열이다. 실제 콘텐츠는 이 순서를 따라가며 채운다.

export const CORE_PER_PART = 3;   // 핵심 위주에서 한 부위를 연달아 보여주는 횟수
export const RELATED_EVERY = 10;  // 연관 위주에서 '다른 부위'를 끼우는 주기

// 시드를 받는 간단한 난수 — 같은 사람에게는 같은 순서가 나오도록.
function seeded(seed) {
  let x = (Number(seed) || 1) >>> 0 || 1;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 100000) / 100000; };
}

const shuffle = (arr, rnd) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/**
 * 노출 순서표를 만든다.
 * @param {object} o
 * @param {string[]} o.coreGroups     이용자가 고른 핵심 부위 묶음(최대 3)
 * @param {string[]} o.relatedGroups  연관 부위 묶음(최대 6)
 * @param {string[]} o.popularGroups  인기순 부위 묶음(다른 부위로 끼울 때 씀)
 * @param {'core'|'related'} o.mode   타겟 세분화
 * @param {boolean} o.isAll           부위를 '전체'로 둔 경우
 * @param {number} o.length           만들 순서표 길이
 * @param {number} o.seed             같은 사람에게 같은 순서를 주려는 씨앗
 * @returns {string[]} 부위 묶음 id 배열
 */
export function buildRotation({
  coreGroups = [], relatedGroups = [], popularGroups = [],
  mode = 'related', isAll = false, length = 20, seed = 1,
} = {}) {
  const rnd = seeded(seed);
  const pool = [...new Set([...coreGroups, ...relatedGroups, ...popularGroups])];

  // 전체를 고르면 규칙 없이 섞어서 보여준다.
  if (isAll || (!coreGroups.length && !relatedGroups.length)) {
    if (!pool.length) return [];
    const out = [];
    while (out.length < length) out.push(...shuffle(pool, rnd));
    return out.slice(0, length);
  }

  // '아예 다른 부위' — 내가 고르지 않은 것 중 인기순. 없으면 인기순 전체에서.
  const chosen = new Set([...coreGroups, ...relatedGroups]);
  const othersBase = popularGroups.filter((g) => !chosen.has(g));
  const others = othersBase.length ? othersBase : popularGroups;
  let otherAt = 0;
  const nextOther = () => (others.length ? others[otherAt++ % others.length] : null);

  const out = [];
  const push = (g) => { if (g) out.push(g); };

  if (mode === 'core') {
    let ci = 0, ri = 0, cycles = 0;
    while (out.length < length) {
      const core = coreGroups[ci % (coreGroups.length || 1)];
      for (let k = 0; k < CORE_PER_PART && out.length < length; k++) push(core);
      if (out.length < length && relatedGroups.length) push(relatedGroups[ri++ % relatedGroups.length]);
      ci++;
      // 핵심·연관을 한 바퀴 다 돌면 다른 부위를 두 번 끼운다.
      if (ci % (coreGroups.length || 1) === 0) {
        cycles++;
        if (cycles >= 1) {
          for (let k = 0; k < 2 && out.length < length; k++) push(nextOther());
          cycles = 0;
        }
      }
    }
  } else {
    let ci = 0, ri = 0;
    while (out.length < length) {
      // 10번마다 다른 부위를 두 번 연달아.
      if (out.length > 0 && out.length % RELATED_EVERY === 0) {
        for (let k = 0; k < 2 && out.length < length; k++) push(nextOther());
        continue;
      }
      if (coreGroups.length && out.length < length) push(coreGroups[ci++ % coreGroups.length]);
      if (relatedGroups.length && out.length < length) push(relatedGroups[ri++ % relatedGroups.length]);
      if (!coreGroups.length && !relatedGroups.length) break;
    }
  }
  return out.slice(0, length);
}

// 순서표를 따라 실제 콘텐츠를 고른다. 같은 글이 연달아 나오지 않게 한 번 쓴 건 뒤로 미룬다.
export function pickByRotation(items, rotation, groupOf = (it) => it.body_groups || []) {
  const used = new Set();
  const out = [];
  for (const g of rotation) {
    const hit = items.find((it) => !used.has(it.id) && groupOf(it).includes(g))
             || items.find((it) => !used.has(it.id));
    if (!hit) break;
    used.add(hit.id);
    out.push({ item: hit, group: g });
  }
  return out;
}
