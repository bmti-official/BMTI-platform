// 모든 바로카드가 함께 쓰는 음성 — 숫자 세기, 쉬는 시간, 마무리.
// 화면 부품이 아니라 값과 불러오기만 담는다.
import { supabase } from '../../lib/supabaseClient';

export const COUNT_MAX = 20;
export const REST_LENS = [5, 10, 15, 20];
// 남은 초가 이만큼일 때 '셋, 둘, 하나, 시작!'이 나간다.
// 넷에서 시작해야 '시작!'이 남은 1초에 떨어지고, 세트가 열리는 '하나'와 한 박자 벌어진다.
export const COUNTDOWN_AT = 4;
// 우리말 셈씨 — 운동은 '하나 둘 셋'으로 셉니다.
export const COUNT_KO = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];

// 말투를 가리지 않는 갈래 — 하는 말이 정해져 있어 담백하게 읽든 다정하게 읽든 내용이 같다.
// 이 갈래는 tone을 'a'(둘 다)로 담아 한 벌만 쓴다.
export const TONE_FREE = ['count', 'side', 'countdown', 'switch', 'bgm', 'angle'];
export const ANY_TONE = 'a';
/** 말투를 가리는 갈래인지 보고, 안 가리면 'a'로 맞춰 준다. */
export const toneFor = (kind, tone) => (TONE_FREE.includes(kind) ? ANY_TONE : (tone === 'm' ? 'm' : 'z'));

export const voiceKey = (kind, tone, n) => `${kind}|${toneFor(kind, tone)}|${n}`;

// { 'count|a|3': 'https://…' } 꼴로 통째로 읽어 온다.
export async function loadVoiceAssets() {
  const { data, error } = await supabase.from('voice_assets').select('kind, tone, n, url');
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [voiceKey(r.kind, r.tone, r.n), r.url]));
}

// 캐릭터 인사 — 유형 코드마다 한 편. { ACDZ: 'https://…' }
export async function loadHello() {
  const { data, error } = await supabase.from('voice_hello').select('code, url');
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [r.code, r.url]));
}

// ── 배경음악 네 곡 ─────────────────────────────────────────
// 활력(A)이냐 이완(O)이냐로 빠르기가 갈리고,
// 확신(D)이냐 유연(Q)이냐로 박자가 또렷한지 흐르는지가 갈린다.
export const BGM_GROUPS = [
  { n: 1, label: '확신의 O 유형', hint: '이완 · 또렷', codes: 'O + D' },
  { n: 2, label: '유연한 O 유형', hint: '이완 · 흐르듯', codes: 'O + Q' },
  { n: 3, label: '유연한 A 유형', hint: '활력 · 흐르듯', codes: 'A + Q' },
  { n: 4, label: '확신의 A 유형', hint: '활력 · 또렷', codes: 'A + D' },
];

// 한 곡은 세 도막으로 나뉜다.
//   도입부 — 바로플리를 열 때 한 번
//   중간   — 도입부가 끝나면 이어받아 계속 돈다
//   마무리 — 끝나기 전에 이어받아 한 번
// 담는 자리는 곡번호 뒤에 도막번호를 붙여 쓴다. 1번 곡이면 11·12·13.
export const BGM_PARTS = [
  { p: 1, label: '도입부', hint: '시작하는 느낌' },
  { p: 2, label: '중간', hint: '계속되는 느낌' },
  { p: 3, label: '마무리', hint: '끝나는 느낌' },
];
export const bgmN = (group, part) => group * 10 + part;
/** 이 곡의 세 도막 주소를 한 번에 꺼낸다. */
export const bgmSet = (common, group) => ({
  intro: common[voiceKey('bgm', ANY_TONE, bgmN(group, 1))] || '',
  loop: common[voiceKey('bgm', ANY_TONE, bgmN(group, 2))] || '',
  outro: common[voiceKey('bgm', ANY_TONE, bgmN(group, 3))] || '',
});

/** 이 유형에게 처음 골라져 있을 곡 번호 */
export function bgmNoFor(code) {
  const a = String(code || '').split('-')[0].toUpperCase();
  const relaxed = a.includes('O');
  const flexible = a.includes('Q');
  if (relaxed) return flexible ? 2 : 1;
  return flexible ? 3 : 4;
}

// ── 음악 여닫기 ────────────────────────────────────────────────
// 곡의 처음 열 셈과 마지막 열 셈은 더 작게 튼다.
// 갑자기 커지거나 뚝 끊기지 않고, 한 바퀴 돌아 다시 시작할 때의 이음매도 덜 튄다.
export const FADE_SEC = 10;    // 여닫는 데 쓰는 시간
export const FADE_MIN = 0.35;  // 가장 작을 때 — 아주 끄지는 않는다
export const XFADE_SEC = 3;    // 도막과 도막이 겹치는 시간
export const UNDER = 0.4;      // 겹치는 동안 뒤로 물러나는 도막의 크기

/** 지금 자리에서 음량에 곱할 값. 0.35(가장자리) ~ 1(가운데) */
export function bgmFade(at, dur) {
  if (!Number.isFinite(dur) || dur <= FADE_SEC * 2) return 1;
  const opening = Math.min(1, Math.max(0, at) / FADE_SEC);
  const closing = Math.min(1, Math.max(0, dur - at) / FADE_SEC);
  return FADE_MIN + (1 - FADE_MIN) * Math.min(opening, closing);
}

// ── 각도 잴 때 나가는 안내 ────────────────────────────────────
// 재는 동안에는 화면을 볼 수 없다. 옆으로 서 있거나 허리를 굽히는 중이라
// 글씨가 눈에 안 들어온다. 그래서 귀로 알려 준다.
// 말투를 가리지 않으니 한 벌이면 된다.
export const ANGLE_LINES = [
  { n: 1, key: 'near', text: '조금 더 가까이 와 주세요' },
  { n: 2, key: 'far', text: '한 걸음만 뒤로 가 주세요' },
  { n: 3, key: 'turn', text: '몸을 옆으로 더 돌려 주세요' },
  { n: 4, key: 'face', text: '화면을 정면으로 봐 주세요' },
  { n: 5, key: 'frame', text: '머리부터 골반까지 화면에 들어오게 해 주세요' },
  { n: 6, key: 'hold', text: '좋아요. 그대로 계세요' },
  { n: 7, key: 'go1', text: '시작합니다. 가만히 서 계세요' },
  { n: 8, key: 'mid1', text: '이제 천천히 허리를 굽혀 주세요' },
  { n: 9, key: 'next', text: '옆모습 다 쟀어요. 정면으로 서 주세요' },
  { n: 10, key: 'go2', text: '시작합니다. 두 팔을 천천히 올려 주세요' },
  { n: 11, key: 'mid2', text: '끝까지 올린 채로 잠깐 멈춰 주세요' },
  { n: 12, key: 'done', text: '다 쟀어요. 수고하셨어요' },
];
export const ANGLE_N = Object.fromEntries(ANGLE_LINES.map((l) => [l.key, l.n]));
