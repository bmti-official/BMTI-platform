// 찾기 — 둘러보기·바로플리가 함께 쓰는 검색. 화면 부품이 아니라 값과 셈만 담는다.
//
// 예전에는 '적어 둔 글자와 똑같이 이어진 말'만 찾았다. 그래서 '거북목'은 0편이었고,
// '어깨 마사지'처럼 두 낱말을 치면 아무것도 안 나왔고, '운동'은 도구 '운동 매트' 때문에
// 마사지 카드까지 걸렸다. 여기서는
//   · 띄어쓰기를 무시하고('폼 롤러' = '폼롤러'),
//   · 낱말마다 따로 찾고('어깨 마사지' = 어깨 그리고 마사지),
//   · 말 사전으로 손님 말을 우리 분류에 잇고('거북목' → 목),
//   · 어디에서 걸렸는지에 따라 점수를 매겨 제목에 걸린 것을 위로 올린다.
import { KEY_TO_PART_LABEL, PART_KEY } from '../../lib/diaryEntryLabels';
import { BODY_GROUPS, GROUP_LABEL } from '../../lib/bodyGroups';
import { SEARCH_WORDS } from '../../lib/searchWords';
import { KIND_LABEL } from './format';
import { TOOL_LIST } from './tools';

// 어디에서 걸렸는지에 따른 점수 — 제목·썸네일이 가장 무겁고, 설명 글이 가장 가볍다
const W = { head: 6, core: 5, kind: 4, tool: 4, word: 4, group: 3, related: 2, desc: 1 };
const PLI_CARD = 0.8;   // 플리는 담긴 동작으로도 걸리되, 플리 이름에 걸린 것보다는 아래에 둔다

/** 견주기 좋게 다듬는다 — 소문자, 띄어쓰기·기호 없이 */
export const squash = (s) => String(s || '').toLowerCase().replace(/[\s·.,\-_/()[\]~!?'"“”‘’:;+&]/g, '');

// ── 말 사전을 찾기 좋게 펼쳐 둔다 ───────────────────────────────
function buildDict(list) {
  const by = new Map();
  (list || []).forEach((e) => {
    (e.say || []).forEach((raw) => {
      const k = squash(raw);
      if (!k) return;
      const cur = by.get(k) || { parts: [], groups: [], kinds: [], tools: [], words: [], not: [], bare: false };
      ['parts', 'groups', 'kinds', 'tools', 'words', 'not'].forEach((f) => { (e[f] || []).forEach((v) => { if (!cur[f].includes(v)) cur[f].push(v); }); });
      if (e.bare) cur.bare = true;
      by.set(k, cur);
    });
  });
  return by;
}
// 부위 이름(목·어깨…)과 부위 묶음 이름(목-머리…)은 사전에 없어도 통하게 기본으로 넣는다
const BASE_WORDS = [
  ...Object.entries(PART_KEY).filter(([, key]) => key !== 'etc').map(([ko, key]) => ({ say: [ko], parts: [key] })),
  ...BODY_GROUPS.filter((g) => g.id !== 'all').map((g) => ({ say: [g.label], groups: [g.id] })),
];
let DICT = buildDict([...BASE_WORDS, ...SEARCH_WORDS]);
let VOCAB = null;   // '혹시 이 말?'에 쓰는 낱말 모음 — 처음 쓸 때 만든다

const strs = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : []);
/** 사전 한 줄을 다듬는다 — 모양이 어긋난 값은 버린다(한 줄이 잘못돼 검색이 통째로 죽지 않게). */
export function cleanWord(e) {
  if (!e || typeof e !== 'object') return null;
  const out = { say: strs(e.say), parts: strs(e.parts), groups: strs(e.groups), kinds: strs(e.kinds),
    tools: strs(e.tools), words: strs(e.words), not: strs(e.not) };
  if (e.bare) out.bare = true;
  const means = out.parts.length + out.groups.length + out.kinds.length + out.tools.length + out.words.length + (out.bare ? 1 : 0);
  return out.say.length && means ? out : null;
}
let EXTRA = [];
/** 관리자 화면에서 직접 더한 말을 기본 사전 뒤에 이어 붙인다. */
export function setExtraWords(extra) {
  EXTRA = (Array.isArray(extra) ? extra : []).map(cleanWord).filter(Boolean);
  DICT = buildDict([...BASE_WORDS, ...SEARCH_WORDS, ...EXTRA]);
  VOCAB = null;
}

// ── 친 말을 낱말로 나눈다 ───────────────────────────────────────
function termOf(text) {
  const key = squash(text);
  const d = DICT.get(key) || null;
  return { key, text, d };
}
/** '어깨 마사지' → [어깨, 마사지] · '폼 롤러' → [폼롤러] · '거북목스트레칭' → [거북목, 스트레칭] */
export function parseQuery(q) {
  const tokens = String(q || '').trim().split(/[\s,]+/).filter(Boolean).slice(0, 6);
  const terms = [];
  let i = 0;
  while (i < tokens.length) {
    // 띄어 쓴 두세 낱말이 사전의 한 말이면 하나로 본다('폼 롤러', '마사지 공', '턱 당기기')
    let took = 0;
    for (let n = Math.min(3, tokens.length - i); n >= 2; n -= 1) {
      const joined = tokens.slice(i, i + n).join('');
      if (DICT.has(squash(joined))) { terms.push(termOf(tokens.slice(i, i + n).join(' '))); took = n; break; }
    }
    if (took) { i += took; continue; }
    const one = termOf(tokens[i]);
    // 붙여 쓴 말이 사전의 두 말로 갈라지면 나눈다('어깨마사지' → 어깨 + 마사지)
    if (!one.d && one.key.length >= 3) {
      let cut = 0;
      for (let k = one.key.length - 1; k >= 1; k -= 1) {
        if (DICT.has(one.key.slice(0, k)) && DICT.has(one.key.slice(k))) { cut = k; break; }
      }
      if (cut) { terms.push(termOf(one.key.slice(0, cut)), termOf(one.key.slice(cut))); i += 1; continue; }
    }
    if (one.key) terms.push(one);
    i += 1;
  }
  return terms;
}

// ── 콘텐츠 하나를 찾기 좋게 펼쳐 둔다 ───────────────────────────
const cache = new WeakMap();
// 글 안의 문장들만 모은다(주소는 뺀다) — 카드뉴스 장처럼 모양이 제각각인 값에 쓴다
function textsIn(v, out = []) {
  if (typeof v === 'string') { if (!/^https?:\/\//.test(v)) out.push(v); return out; }
  if (Array.isArray(v)) { v.forEach((x) => textsIn(x, out)); return out; }
  if (v && typeof v === 'object') Object.values(v).forEach((x) => textsIn(x, out));
  return out;
}
function indexOf(item, tone) {
  const hit = cache.get(item);
  if (hit && hit.tone === tone) return hit;
  const t = tone === 'm' ? 'm' : 'z';
  const sections = [1, 2, 3, 4].flatMap((n) => [item[`s${n}_h_${t}`], item[`s${n}_${t}`], item[`s${n}_key_${t}`], item[`s${n}_tip_${t}`]]);
  const ix = {
    tone,
    head: squash([item.thumb_text, item.title_z, item.title_m, ...(item.keywords || [])].filter(Boolean).join(' ')),
    desc: squash([item.good_when, item.focus_body, t === 'm' ? item.body_m : item.body_z, ...sections,
      ...textsIn(t === 'm' ? item.slides_m : item.slides_z)].filter(Boolean).join(' ')),
    core: item.core_parts || [],
    related: item.related_parts || [],
    groups: item.body_groups || [],
    kind: item.kind || '',
    kindLabel: squash(KIND_LABEL[item.kind] || ''),
    tools: (item.tools || []).map(squash),
  };
  cache.set(item, ix);
  return ix;
}

const strip = (text, nots) => (nots || []).reduce((s, n) => s.split(squash(n)).join(' '), text);

/** 낱말 하나가 이 콘텐츠에 얼마나 걸리는가 — { s: 점수(0이면 안 걸림), why: 걸린 자리들 }.
 *  가장 세게 걸린 자리의 점수를 바탕으로 하고, 다른 자리에도 걸렸으면 조금 얹는다.
 *  그래야 '거북목'으로 찾았을 때 목 카드 가운데서도 턱 당기기처럼 딱 맞는 것이 위로 온다. */
function termHit(ix, term) {
  const d = term.d;
  const key = term.key;
  let best = 0;
  const why = [];
  const up = (v, label) => { why.push(label); if (v > best) best = v; };
  const isKind = !!(d && d.kinds.length);
  const isTool = !!(d && (d.tools.length || d.bare));

  // 제목·썸네일 문구
  const head = d && d.not.length ? strip(ix.head, d.not) : ix.head;
  const inHead = !!key && head.includes(key);
  if (inHead) up(W.head, '제목·문구');
  // 분류로 이어진 것
  const wordHit = !!d && d.words.some((w) => head.includes(squash(w)));
  if (d) {
    if (d.parts.some((p) => ix.core.includes(p))) up(W.core, '핵심 부위');
    if (d.kinds.includes(ix.kind)) up(W.kind, '종류');
    if (d.tools.some((tl) => ix.tools.includes(squash(tl)))) up(W.tool, '도구');
    if (d.bare && (ix.tools.length === 0 || ix.tools.every((tl) => /매트$/.test(tl)))) up(W.tool, '도구 없이');
    if (wordHit) up(W.word, '제목 속 이어진 말');
    if (d.groups.some((g) => ix.groups.includes(g))) up(W.group, '부위 묶음');
    if (d.parts.some((p) => ix.related.includes(p))) up(W.related, '연관 부위');
  }
  // 종류 이름을 그대로 친 경우('스트레칭')
  if (key && ix.kindLabel && ix.kindLabel === key && !why.includes('종류')) up(W.kind, '종류');
  // 도구 — 사전에 없는 도구 이름도 통째로 치면 걸리게. 종류를 뜻하는 말('운동')로는 도구('운동 매트')를 찾지 않는다.
  if (key && !isKind && !why.includes('도구') && ix.tools.some((tl) => tl === key || (key.length >= 2 && tl.includes(key)))) up(W.tool, '도구');
  // 설명 글 — 한 글자 말('목', '등')과 종류·도구 말은 여기서 찾지 않는다(아무 데나 걸린다)
  let inDesc = false;
  if (key.length >= 2 && !isKind && !isTool) {
    const desc = d && d.not.length ? strip(ix.desc, d.not) : ix.desc;
    inDesc = desc.includes(key) || (!!d && d.words.some((w) => desc.includes(squash(w))));
  }
  if (inDesc) why.push('설명 글');
  if (!best) return { s: inDesc ? W.desc : 0, why };
  // 얹는 점수 — 제목에 이어진 말이 있거나, 설명 글에도 그 말이 나오면
  return { s: best + (wordHit && !inHead ? 2 : 0) + (inDesc ? 1 : 0), why };
}
const termScore = (ix, term) => termHit(ix, term).s;

// 낱말마다 점수를 낸다. 플리는 담긴 동작으로도 걸린다.
function scoresOf(item, terms, tone) {
  const own = indexOf(item, tone);
  const kids = Array.isArray(item.cards) ? item.cards.map((c) => indexOf(c, tone)) : [];
  return terms.map((t) => {
    let s = termScore(own, t);
    kids.forEach((k) => { const v = termScore(k, t) * PLI_CARD; if (v > s) s = v; });
    return s;
  });
}

/**
 * 목록에서 찾는다.
 *   get    목록의 한 칸에서 콘텐츠를 꺼내는 법(둘러보기 격자는 { kind, item } 모양)
 * 돌려주는 것 { rows, loose } — loose는 '모든 낱말에 걸린 것은 없어 하나라도 걸린 것을 보여 줌'
 */
export function searchList(list, q, tone, get = (x) => x) {
  const terms = parseQuery(q);
  if (!terms.length) return { rows: list, loose: false };
  const scored = list.map((row, i) => ({ row, i, s: scoresOf(get(row), terms, tone) }));
  const rank = (arr) => arr
    .map((x) => ({ ...x, total: x.s.reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total || a.i - b.i)
    .map((x) => x.row);
  const all = scored.filter((x) => x.s.every((v) => v > 0));
  if (all.length || terms.length < 2) return { rows: rank(all), loose: false };
  return { rows: rank(scored.filter((x) => x.s.some((v) => v > 0))), loose: true };
}

/**
 * 왜 걸렸는지 풀어 준다 — 관리자 '검색 시험'이 쓴다.
 * { total, ok(모든 낱말에 걸렸나), terms: [{ text, s, why, from }] } · from은 플리에서 그 낱말이 걸린 동작 이름
 */
export function explain(item, q, tone) {
  const terms = parseQuery(q);
  const own = indexOf(item, tone);
  const kids = Array.isArray(item.cards) ? item.cards : [];
  const rows = terms.map((t) => {
    let hit = termHit(own, t);
    let from = '';
    kids.forEach((c) => {
      const h = termHit(indexOf(c, tone), t);
      if (h.s * PLI_CARD > hit.s) { hit = { s: h.s * PLI_CARD, why: h.why }; from = String(c.thumb_text || c.title_z || '').replace(/\n/g, ' '); }
    });
    return { text: t.text, s: Math.round(hit.s * 10) / 10, why: hit.why, from };
  });
  return { total: Math.round(rows.reduce((a, r) => a + r.s, 0) * 10) / 10, ok: rows.length > 0 && rows.every((r) => r.s > 0), terms: rows };
}

/** 친 말이 사전에서 무엇으로 이어지는지 — 사전에 없으면 d가 null(글자 그대로 찾는다) */
export function readQuery(q) {
  return parseQuery(q).map((t) => ({ text: t.text, known: !!t.d, parts: t.d?.parts || [], groups: t.d?.groups || [],
    kinds: t.d?.kinds || [], tools: t.d?.tools || [], words: t.d?.words || [], bare: !!t.d?.bare }));
}

/** 부위 묶음 알약 — 그 묶음으로 분류된 콘텐츠인가(플리는 담긴 동작 가운데 하나라도) */
export function inGroup(item, g) {
  if (!g || g === 'all') return true;
  if ((item.body_groups || []).includes(g)) return true;
  return Array.isArray(item.cards) && item.cards.some((c) => (c.body_groups || []).includes(g));
}
export const GROUP_PILLS = BODY_GROUPS.map((g) => [g.id, g.label]);
export { GROUP_LABEL };

// ── 못 찾았을 때 — '혹시 이 말?' ────────────────────────────────
// 한 글자쯤 틀린 말을 사전·부위·도구 이름에서 찾는다('거복목' → '거북목').
function near(a, b) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a === b) return false;
  let i = 0, j = 0, miss = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i += 1; j += 1; continue; }
    miss += 1;
    if (miss > 1) return false;
    if (a.length > b.length) i += 1; else if (a.length < b.length) j += 1; else { i += 1; j += 1; }
  }
  return miss + (a.length - i) + (b.length - j) <= 1;
}
export function suggest(q) {
  const key = squash(q);
  if (key.length < 3) return null;
  if (!VOCAB) {
    const shown = [
      ...SEARCH_WORDS.flatMap((e) => e.say || []),
      ...Object.values(KEY_TO_PART_LABEL), ...TOOL_LIST, ...Object.values(KIND_LABEL),
    ];
    VOCAB = [...new Set(shown)].map((w) => [squash(w), w]).filter(([k]) => k.length >= 3);
  }
  const hit = VOCAB.find(([k]) => near(key, k));
  return hit ? hit[1] : null;
}
