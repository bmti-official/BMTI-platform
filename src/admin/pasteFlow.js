// 동작 영상 원고를 통째로 붙여넣으면 칸마다 나눠 담는다 — 관리자 화면 전용.
// 큐레이션·바로카드 붙여넣기와 같은 방식이되, 플로우 칸에 맞췄다.

export const FLOW_TOOLS = [
  ['none', '없음', 'none'],
  ['mat', '요가매트', 'a yoga mat'],
  ['roller', '폼롤러', 'a black foam roller'],
  ['ball', '마사지볼', 'a massage ball'],
  ['band', '밴드', 'a resistance band'],
  ['chair', '의자', 'a chair'],
  ['towel', '수건', 'a rolled towel'],
  ['wall', '벽', 'a wall'],
];

// 고른 도구들을 영어 한 줄로 — '요가매트, 밴드' → 'a yoga mat and a resistance band'
export function toolPhrase(ids) {
  const list = (ids || []).filter((x) => x && x !== 'none')
    .map((id) => FLOW_TOOLS.find(([k]) => k === id)?.[2]).filter(Boolean);
  return list.length ? list.join(' and ') : 'none';
}

const bare = (s) => String(s || '').replace(/\s+/g, '');

// AI가 끼워 넣는 각주 자국을 걷어낸다 — [cite: 1] · 【1】 · [1] 같은 것들.
// 그대로 두면 영상 프롬프트에 섞여 들어가 화면에 글씨가 생기기도 한다.
export function stripCites(text) {
  return String(text || '')
    .replace(/\[\s*cite[^\]]*\]/gi, '')
    .replace(/【[^】]*】/g, '')
    .replace(/\[\s*\d+(?:\s*,\s*\d+)*\s*\]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([.,、·])/g, '$1')
    .trim();
}

// 여섯 줄은 번호(①~⑥ · 1~6)로도, 이름으로도 받는다.
const LINE_KEYS = [
  ['a', /^(①|1[.)]?|시작\s*자세)$/],
  ['b', /^(②|2[.)]?|무엇이\s*움직이나|움직이는\s*곳)$/],
  ['c', /^(③|3[.)]?|얼마나|얼마만큼)$/],
  ['d', /^(④|4[.)]?|끝\s*자세)$/],
  ['e', /^(⑤|5[.)]?|되돌아오기|돌아오기)$/],
  ['f', /^(⑥|6[.)]?|움직이지\s*않는\s*곳|고정)$/],
];

const HEAD = '캐릭터|성별|카메라\\s*각도|각도|도구|동작\\s*이름|영어\\s*이름|영문\\s*이름|시작\\s*자세|무엇이\\s*움직이나|움직이는\\s*곳|얼마나|얼마만큼|끝\\s*자세|되돌아오기|돌아오기|움직이지\\s*않는\\s*곳|고정';
const NUM = '[①②③④⑤⑥]|[1-6][.)]';

// 채팅에서 복사하면 줄바꿈이 사라져 표지가 문장 끝에 붙는다. 읽기 전에 끊어 준다.
function unglue(text) {
  return String(text || '')
    .replace(/(?<=\S)[ \t]*(?=(?:①|②|③|④|⑤|⑥))/g, '\n')
    .replace(new RegExp(`(?<=\\S)[ \\t]*(?=(?:${HEAD})\\s*[:：])`, 'g'), '\n');
}

const KEY = new RegExp(`^\\s*(?:(${NUM})\\s*)?(${HEAD})?\\s*[:：]?\\s*(.*)$`);

export function parseFlow(text) {
  const out = {};
  const filled = [];
  const put = (k, v) => { if (v) { out[k] = v; filled.push(k); } };

  const lines = unglue(stripCites(text)).replace(/\r/g, '').split('\n').map((l) => l.trim()).filter(Boolean);
  const move = {};

  for (const line of lines) {
    // '① 시작 자세: ...' / '시작 자세: ...' / '①: ...' 을 모두 받는다
    const m = line.match(KEY);
    if (!m) continue;
    const tag = bare(m[1] || m[2] || '');
    const val = (m[3] || '').trim();
    if (!tag || !val) continue;

    const hit = LINE_KEYS.find(([, re]) => re.test(tag));
    if (hit) { move[hit[0]] = val; continue; }

    if (tag === '캐릭터' || tag === '성별') {
      put('gender', /남/.test(val) ? 'male' : 'female');
      continue;
    }
    if (tag === '카메라각도' || tag === '각도') {
      const v = /뒷|뒤|back/i.test(val) ? 'back view' : /측|옆|side/i.test(val) ? 'side view' : 'front view';
      put('angle', v);
      continue;
    }
    if (tag === '도구') {
      const picked = FLOW_TOOLS.filter(([id, ko]) => id !== 'none' && val.includes(ko)).map(([id]) => id);
      put('tools', picked.length ? picked : ['none']);
      continue;
    }
    if (tag === '동작이름') { put('name', val); continue; }
    if (tag === '영어이름' || tag === '영문이름') { put('nameEn', val); continue; }
  }

  const got = Object.keys(move);
  if (got.length) { out.move = move; got.forEach((k) => filled.push(`move_${k}`)); }

  const report = [
    filled.includes('gender') ? '캐릭터' : null,
    filled.includes('angle') ? '카메라 각도' : null,
    filled.includes('tools') ? '도구' : null,
    filled.includes('name') ? '동작 이름' : null,
    filled.includes('nameEn') ? '영어 이름' : null,
    got.length ? `설명 ${got.length}줄` : null,
  ].filter(Boolean);

  return { fields: out, report, count: filled.length };
}
