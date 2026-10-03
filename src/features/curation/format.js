import { cardTotalSec } from './cardDefaults';
// 큐레이션·바로카드 표시용 계산 — 컴포넌트 파일과 분리해 Fast Refresh를 살린다.
export const KIND_LABEL = { massage: '마사지', stretch: '스트레칭', exercise: '운동' };

// Z 유형은 담백한 글, M 유형은 다정한 글을 본다.
export const toneOf = (bmtiCode) => (String(bmtiCode || '').toUpperCase().endsWith('M') ? 'm' : 'z');

export const pickCurationTone = (item, tone) => ({
  title: (tone === 'm' ? item.title_m : item.title_z) || item.title_z || item.title_m || '',
  body: (tone === 'm' ? item.body_m : item.body_z) || '',
});
export const pickCardTone = (c, tone) => ({
  title: (tone === 'm' ? c.title_m : c.title_z) || c.title_z || c.title_m || '',
});

export const fmtCount = (n) => (Number(n) || 0).toLocaleString('ko-KR');
export const mmss = (sec) => {
  const s = Math.max(0, Number(sec) || 0);
  return `${Math.floor(s / 60)}분 ${String(s % 60).padStart(2, '0')}초`;
};
export const pickRoutineTone = (r, tone) => ({
  title: (tone === 'm' ? r.title_m : r.title_z) || r.title_z || r.title_m || '',
});

// 루틴에 담긴 바로카드들에서 총 소요시간·도구·타겟 부위를 모아준다.
// 관리자가 따로 적지 않아도 카드만 고르면 자동으로 채워지는 값들이다.
export function routineSummary(cards) {
  const list = cards || [];
  const uniq = (arr) => [...new Set(arr.filter(Boolean))];
  const core = uniq(list.flatMap((c) => c.core_parts || []));
  return {
    count: list.length,
    // 기본 설정대로 다 했을 때 걸리는 시간을 더한다 — 영상 길이의 합이 아니다
    durationSec: list.reduce((n, c) => n + cardTotalSec(c), 0),
    tools: uniq(list.flatMap((c) => c.tools || [])),
    coreParts: core,
    // 연관 부위는 핵심과 겹치면 빼서 중복 표시를 막는다.
    relatedParts: uniq(list.flatMap((c) => c.related_parts || [])).filter((p) => !core.includes(p)),
  };
}

// 동작 이름이 다섯 글자를 넘으면 이름표 안에서 줄을 바꾼다.
// 띄어쓰기가 있으면 한가운데에 가장 가까운 띄어쓰기에서, 없으면 반으로 나눈다.
export function nameLines(text) {
  const t = String(text || '').trim();
  // 사장님이 손으로 줄을 나눠 적었으면 그대로 따른다.
  if (t.includes('\n')) return t.split('\n').map((x) => x.trim()).filter(Boolean);
  const letters = t.replace(/\s/g, '').length;
  if (letters < 5) return [t];
  const mid = t.length / 2;
  let cut = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] !== ' ') continue;
    if (cut < 0 || Math.abs(i - mid) < Math.abs(cut - mid)) cut = i;
  }
  if (cut > 0) return [t.slice(0, cut), t.slice(cut + 1)];
  const half = Math.ceil(t.length / 2);
  return [t.slice(0, half), t.slice(half)];
}

// 영상·사진을 틀 안에서 위아래 어디쯤 보여 줄지 — 0 위, 50 가운데, 100 아래.
export const clipY = (item) => {
  const v = Number(item?.clip_y);
  return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : 50;
};

/** 시작 전 그림 — 주소가 있는 것만, 세 장까지. 좌우(x)·높이(y)는 틀 크기의 %, 크기(s)는 100이 그대로. */
export function introImgs(card = {}) {
  const num = (v, d, lo, hi) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Math.min(hi, Math.max(lo, Number(v))) : d);
  return (Array.isArray(card.intro_imgs) ? card.intro_imgs : [])
    .filter((m) => m && typeof m.url === 'string' && m.url)
    .slice(0, 3)
    .map((m) => ({ url: m.url, x: num(m.x, 0, -100, 100), y: num(m.y, 0, -100, 100), s: num(m.s, 100, 30, 300) }));
}

/** 자막을 한 문장씩 끊어 준다 — 한 줄로 길게 흐르면 눈으로 따라가기 어렵다. */
export function subLines(text) {
  return String(text || '')
    .trim()
    .replace(/\s*\n\s*/g, '\n')        // 이미 넣어 둔 줄바꿈은 그대로
    .replace(/([.!?…])\s+/g, '$1\n')     // 문장이 끝나면 다음 줄로
    .replace(/\n{2,}/g, '\n');
}

/** 자막의 **밑변**이 화면 위아래 어디쯤에 놓일지. 0이 맨 위, 100이 맨 아래.
 *  가운데가 아니라 밑변을 잡아 두어야, 글이 짧아져도 자막이 위로 올라가지 않는다. */
export function subY(card = {}) {
  const v = Number(card.sub_y);
  return Number.isFinite(v) && v > 0 ? Math.min(98, Math.max(12, v)) : 92;
}
