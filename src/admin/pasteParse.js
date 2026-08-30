// AI에게 받은 원고를 통째로 붙여넣으면 각 칸으로 나눠 담는다 — 관리자 화면 전용.
// 형식은 docs/큐레이션-작성-프롬프트.md 가 시키는 그대로다.
// 채팅창에서 함께 딸려오는 'MD', '+ 1' 같은 찌꺼기 줄은 알아서 버린다.
import { PART_KEY } from '../lib/diaryEntryLabels';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';

const NOISE = /^(MD|\+\s*\d+|\d+\s*\/\s*\d+|-{3,}|={3,})$/;
const HEADER = /^\[\s*([^\]]+?)\s*\]\s*(.*)$/;
const KEY = /^(소제목|본문|핵심\s*한\s*줄|숫자\s*카드|숫자|핵심\s*부위|연관\s*부위|부위\s*그룹|도구\s*성향|썸네일|[1-4]\s*번\s*마디)\s*([ZMzm])?\s*[:：]\s*(.*)$/;

const squeeze = (s) => s.replace(/\n{3,}/g, '\n\n').trim();
const bare = (s) => String(s || '').replace(/\s+/g, '');
const splitList = (s) => String(s || '').split(/[,、·・]|\s{2,}/).map((x) => x.trim()).filter(Boolean);

// 한 덩어리를 토막 낸다 — [머리말] 또는 '이름:' 을 만날 때마다 새 토막이 시작된다.
function tokenize(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .filter((l) => !NOISE.test(l.trim()));
  const out = [];
  let cur = null;
  const flush = () => { if (cur) out.push(cur); cur = null; };
  for (const line of lines) {
    const h = line.match(HEADER);
    if (h) { flush(); cur = { kind: 'header', name: bare(h[1]), buf: h[2] ? [h[2]] : [] }; continue; }
    const k = line.match(KEY);
    if (k) { flush(); cur = { kind: 'key', name: bare(k[1]), tone: (k[2] || '').toLowerCase(), buf: k[3] ? [k[3]] : [] }; continue; }
    if (cur) cur.buf.push(line);
  }
  flush();
  return out.map((t) => ({ ...t, value: squeeze(t.buf.join('\n')) }));
}

// 라벨을 저장용 코드로 바꾼다. 못 찾은 값은 버린다.
const toPartKeys = (s) => splitList(s).map((ko) => PART_KEY[ko.replace(/\(.*\)/, '').trim()]).filter(Boolean);
const toGroupIds = (s) => splitList(s).map((ko) => BODY_GROUPS.find((g) => g.label === ko)?.id).filter(Boolean);
const toToolMode = (s) => TOOL_MODES.find((t) => t.label === String(s || '').trim())?.id || null;

export function parseArticle(text) {
  const tokens = tokenize(text);
  const out = {};
  const stats = [];
  const caps = {};          // { 1: '사진 설명', … }
  let section = null;       // 1~4
  let mode = null;          // 'meta' | 'photo'
  const filled = [];

  const put = (key, v) => { if (v !== null && v !== undefined && v !== '') { out[key] = v; filled.push(key); } };

  for (const t of tokens) {
    if (t.kind === 'header') {
      const m = t.name.match(/^([1-4])[.·]/);
      if (m) { section = Number(m[1]); mode = null; continue; }
      if (t.name.includes('검색분류')) { section = null; mode = 'meta'; continue; }
      if (t.name.includes('사진제안')) { section = null; mode = 'photo'; continue; }
      if (t.name.startsWith('제목')) { put(t.name.endsWith('M') ? 'title_m' : 'title_z', t.value); continue; }
      if (t.name.includes('썸네일문구')) { put('thumb_text', t.value); continue; }
      if (t.name.startsWith('초록')) { put(t.name.endsWith('M') ? 'lead_m' : 'lead_z', t.value); continue; }
      continue;
    }

    const tone = t.tone === 'm' ? 'm' : 'z';
    if (section) {
      if (t.name === '소제목') { put(`s${section}_h_${tone}`, t.value); continue; }
      if (t.name === '본문') { put(`s${section}_${tone}`, t.value); continue; }
      if (t.name === '핵심한줄') { put(`s${section}_key_${tone}`, t.value); continue; }
      if (t.name === '숫자') {
        // '4가지 · 설명: 보행 추진…' 또는 '4가지 / 보행 추진…'
        const mm = t.value.match(/^(.*?)(?:[·・]?\s*설명\s*[:：]|\s+\/\s+)\s*(.*)$/s);
        const num = (mm ? mm[1] : t.value).replace(/[·・\s]+$/, '').trim();
        const desc = mm ? mm[2].trim() : '';
        if (num || desc) stats.push({ num, text: desc });
        continue;
      }
      continue;
    }

    if (mode === 'meta') {
      if (t.name === '핵심부위') { put('core_parts', toPartKeys(t.value).slice(0, 3)); continue; }
      if (t.name === '연관부위') { put('related_parts', toPartKeys(t.value).slice(0, 6)); continue; }
      if (t.name === '부위그룹') { put('body_groups', toGroupIds(t.value)); continue; }
      if (t.name === '도구성향') { const v = toToolMode(t.value); if (v) put('tool_mode', v); continue; }
      continue;
    }

    if (mode === 'photo') {
      const mm = t.name.match(/^([1-4])번마디$/);
      if (mm) {
        // 한 줄에 사진 한 장. '사진 내용 / 사진 설명' — 슬래시 뒤쪽이 사진 밑에 들어갈 설명이다.
        // 여러 줄이면 여러 장이고, 적은 순서가 넘겨 보는 순서가 된다.
        const list = t.value.split('\n')
          .map((line) => line.replace(/^\s*(?:[①②③④⑤]|[-•*]|\d+[.)])\s*/, ''))
          .filter((line) => line.includes('/'))
          .map((line) => { const parts = line.split('/'); return parts.slice(1).join('/').trim(); })
          .filter(Boolean);
        if (list.length) caps[Number(mm[1])] = list;
      }
      continue;
    }
  }

  if (stats.length) { out.stats = stats.slice(0, 3); filled.push('stats'); }
  Object.entries(caps).forEach(([n, list]) => { out[`s${n}_caps`] = list; filled.push(`s${n}_caps`); });

  // 무엇이 채워졌는지 한 줄로 알려 준다.
  const has = (re) => filled.filter((k) => re.test(k)).length;
  const report = [
    has(/^title_/) ? `제목 ${has(/^title_/)}` : null,
    filled.includes('thumb_text') ? '썸네일 문구' : null,
    has(/^lead_/) ? `초록 ${has(/^lead_/)}` : null,
    has(/^s\d_h_/) ? `소제목 ${has(/^s\d_h_/)}` : null,
    has(/^s\d_[zm]$/) ? `본문 ${has(/^s\d_[zm]$/)}` : null,
    has(/^s\d_key_/) ? `핵심 한 줄 ${has(/^s\d_key_/)}` : null,
    out.stats ? `숫자 카드 ${out.stats.length}` : null,
    has(/_caps$/) ? `사진 설명 ${has(/_caps$/)}` : null,
    has(/^(core_parts|related_parts|body_groups|tool_mode)$/) ? '검색 분류' : null,
  ].filter(Boolean);

  return { fields: out, report, count: filled.length };
}
