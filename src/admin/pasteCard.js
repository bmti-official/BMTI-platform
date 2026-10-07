// 바디카드 원고를 통째로 붙여넣으면 칸마다 나눠 담는다 — 관리자 화면 전용.
// 큐레이션 붙여넣기(pasteParse.js)와 같은 방식이되, 바디카드 칸에 맞춘다.
import { PART_KEY } from '../lib/diaryEntryLabels';
import { BODY_GROUPS, TOOL_MODES } from '../lib/bodyGroups';

const NOISE = /^(MD|\+\s*\d+|\d+\s*\/\s*\d+|-{3,}|={3,})$/;
const HEADER = /^\[\s*([^\]]+?)\s*\]\s*(.*)$/;
const KEY = /^(제목|동작\s*이름|썸네일\s*문구|썸네일|종류|소요\s*시간|도구|핵심\s*부위|연관\s*부위|부위\s*그룹|도구\s*성향|검색어|좋은\s*상황|피할\s*상황|쓰는\s*곳)\s*([ZMzm])?\s*[:：]\s*(.*)$/;

const bare = (s) => String(s || '').replace(/\s+/g, '');
const splitList = (s) => String(s || '').split(/[,、·・]|\s{2,}/).map((x) => x.trim()).filter(Boolean);

// AI가 형광펜을 **굵게** 나 <mark>로 줬어도 ==형광펜== 으로 받아들인다.
const toHilite = (s) => String(s)
  .replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==')
  .replace(/\*\*([^*\n]+)\*\*/g, '==$1==')
  .replace(/==\s*==/g, '');
const squeeze = (s) => toHilite(s).replace(/\n{3,}/g, '\n\n').trim();

const KIND_BY_LABEL = { 스트레칭: 'stretch', 운동: 'exercise', 마사지: 'massage' };
// 한 줄에 하나씩 — 앞에 붙은 글머리표만 떼고 줄은 그대로 둔다
const bullets = (s) => String(s || '').split('\n')
  .map((x) => x.replace(/^\s*(?:[-–—•·*]|\d+[.)])\s*/, '').trim()).filter(Boolean).join('\n');
const toPartKeys = (s) => splitList(s).map((ko) => PART_KEY[ko.replace(/\(.*\)/, '').trim()]).filter(Boolean);
const toGroupIds = (s) => splitList(s).map((ko) => BODY_GROUPS.find((g) => g.label === ko)?.id).filter(Boolean);
const toToolMode = (s) => TOOL_MODES.find((t) => t.label === String(s || '').trim())?.id || null;


// 채팅에서 복사하면 줄바꿈이 사라져 표지가 문장 끝에 붙는 일이 잦다.
//   ...담당합니다.본문 M: 걷기...   /   ...생기는 일[1. 문제제기]
// 그래서 읽기 전에 표지 앞에서 줄을 끊어 준다.
//
// 이름이 긴 표지는 다른 표지 안에 들어갈 일이 없어 아무 글자 뒤에서나 끊는다.
// 짧은 표지('본문' '팁' '제목' …)는 '소제목' 안의 '제목'처럼 남의 이름 속에 들어 있을 수
// 있어서, 문장이 끝난 자리(. ! ? … ])에서만 끊는다.
const LONG_LABELS = '검색어|좋은\\s*상황|피할\\s*상황|쓰는\\s*곳|동작\\s*이름|썸네일\\s*문구|종류|소제목|핵심\\s*한\\s*줄|곁다리\\s*팁\\s*질문|곁다리\\s*팁\\s*답변|곁다리\\s*팁|숫자\\s*카드|핵심\\s*부위|연관\\s*부위|부위\\s*그룹|도구\\s*성향|소요\\s*시간|그림\\s*프롬프트|사진\\s*설명';
const SHORT_LABELS = '본문|제목|도구|썸네일|팁';
const TAIL = '\\s*[ZMzm]?\\s*[:：]';

function unglue(text) {
  return String(text || '')
    .replace(/(?<=\S)[ \t]*(?=\[[^\]\n]{1,40}\])/g, '\n')
    .replace(new RegExp(`(?<=\\S)[ \\t]*(?=(?:${LONG_LABELS})${TAIL})`, 'g'), '\n')
    .replace(new RegExp(`(?<=[.!?…\\]])[ \\t]*(?=(?:${SHORT_LABELS})${TAIL})`, 'g'), '\n');
}

function tokenize(text) {
  const lines = unglue(text).replace(/\r/g, '').split('\n')
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

export function parseCard(text) {
  const out = {};
  const filled = [];
  const put = (k, v) => { if (v !== null && v !== undefined && v !== '') { out[k] = v; if (!filled.includes(k)) filled.push(k); } };

  // '쓰는 곳' 안에 '연관 부위: 큰볼기근…'처럼 검색 분류와 이름이 같은 줄이 오면
  // 검색 분류가 아니라 쓰는 곳의 한 줄로 잇는다(쓰는 곳 뒤, 다음 머리말 앞까지).
  let inFocus = false;
  for (const t of tokenize(text)) {
    const tone = t.tone === 'm' ? 'm' : 'z';
    if (inFocus && t.kind === 'key' && (t.name === '핵심부위' || t.name === '연관부위')) {
      // 그 뒤에 이어진 줄(타겟 관절·주의 신경 등)도 이 덩어리에 딸려 오므로 줄은 그대로 둔다
      const line = `${t.name === '핵심부위' ? '핵심 부위' : '연관 부위'}: ${t.value}`;
      put('focus_body', [out.focus_body, bullets(line)].filter(Boolean).join('\n'));
      continue;
    }
    inFocus = t.kind === 'key' && t.name === '쓰는곳';

    if (t.kind === 'header') {
      if (t.name.startsWith('제목')) { put(t.name.endsWith('M') ? 'title_m' : 'title_z', t.value); continue; }
      if (t.name === '동작이름' || t.name.startsWith('썸네일')) { put('thumb_text', t.value.split('\n')[0].trim()); continue; }
      // C묶음 — 음성으로 만들 글이 곧 자막이다
      // 오프닝은 이제 공통 음성의 캐릭터 인사가 맡는다. 원고에 있어도 담지 않는다.
      if (t.name.startsWith('오프닝')) continue;
      // 자막 자리는 0번이 '시작 전', 그 뒤가 1세트·2세트… 다.
      // 표지가 '1세트 · Z'이면 띄어쓰기만 지워져 '1세트·Z'로 온다 — 가운뎃점을 넘겨 읽는다
      const pre = t.name.match(/^시작전[^ZM]*([ZM])?$/i);
      const set = t.name.match(/^([1-5])세트[^ZM]*([ZM])?$/i);
      if (pre || set) {
        const mark = (pre ? pre[1] : set[2]) || '';
        const at = pre ? 0 : Number(set[1]);
        const key = mark.toUpperCase() === 'M' ? 'sub_sets_m' : 'sub_sets_z';
        const arr = out[key] ? [...out[key]] : [];
        while (arr.length <= at) arr.push('');
        arr[at] = t.value;
        put(key, arr);
        continue;
      }
      continue;
    }

    if (t.name === '제목') { put(`title_${tone}`, t.value); continue; }
    if (t.name === '동작이름' || t.name.startsWith('썸네일')) { put('thumb_text', t.value.split('\n')[0].trim()); continue; }
    if (t.name === '종류') { const v = KIND_BY_LABEL[t.value.trim()]; if (v) put('kind', v); continue; }
    if (t.name === '소요시간') {
      // '90' · '90초' · '1분 30초' 를 모두 초로 바꾼다
      const m = t.value.match(/(?:(\d+)\s*분)?\s*(?:(\d+)\s*초)?/);
      const sec = m && (m[1] || m[2]) ? (Number(m[1] || 0) * 60 + Number(m[2] || 0)) : Number(t.value.replace(/[^\d]/g, ''));
      if (sec > 0) put('duration_sec', sec);
      continue;
    }
    if (t.name === '도구') {
      // AI가 '요가 매트'·'매트'라고 써도 목록 이름인 '운동 매트'로 담는다
      const v = [...new Set(splitList(t.value).filter((x) => x !== '없음').map((x) => (/^(요가\s*)?매트$/.test(x) ? '운동 매트' : x)))];
      if (v.length) put('tools', v);
      continue;
    }
    if (t.name === '핵심부위') { put('core_parts', toPartKeys(t.value).slice(0, 3)); continue; }
    if (t.name === '연관부위') { put('related_parts', toPartKeys(t.value).slice(0, 6)); continue; }
    if (t.name === '부위그룹') { put('body_groups', toGroupIds(t.value)); continue; }
    if (t.name === '도구성향') { const v = toToolMode(t.value); if (v) put('tool_mode', v); continue; }
    if (t.name === '검색어') { const v = [...new Set(splitList(t.value).filter((x) => x !== '없음'))].slice(0, 12); if (v.length) put('keywords', v); continue; }
    // 알아 두기 세 칸 — AI가 '- ' '· ' '1. ' 같은 글머리를 붙여 주므로 떼어 낸다
    if (t.name === '좋은상황') { put('good_when', bullets(t.value)); continue; }
    if (t.name === '피할상황') { put('avoid_when', bullets(t.value)); continue; }
    if (t.name === '쓰는곳') { put('focus_body', bullets(t.value)); continue; }
  }

  const has = (re) => filled.filter((k) => re.test(k)).length;
  // 자막은 덩어리 수로 센다(시작 전·1세트… × Z·M)
  const subs = [...(out.sub_sets_z || []), ...(out.sub_sets_m || [])].filter((x) => String(x).trim()).length;
  const report = [
    has(/^title_/) ? `제목 ${has(/^title_/)}` : null,
    has(/^(good_when|avoid_when|focus_body)$/) ? `알아 두기 ${has(/^(good_when|avoid_when|focus_body)$/)}` : null,
    filled.includes('thumb_text') ? '동작 이름' : null,
    subs ? `자막 ${subs}` : null,
    filled.includes('kind') ? '종류' : null,
    filled.includes('duration_sec') ? '소요 시간' : null,
    filled.includes('tools') ? '도구' : null,
    has(/^(core_parts|related_parts|body_groups|tool_mode)$/) ? '검색 분류' : null,
    filled.includes('keywords') ? '검색어' : null,
  ].filter(Boolean);

  return { fields: out, report, count: filled.length };
}
