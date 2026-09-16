// 모든 바로카드가 함께 쓰는 음성 — 숫자 세기, 쉬는 시간, 마무리.
// 화면 부품이 아니라 값과 불러오기만 담는다.
import { supabase } from '../../lib/supabaseClient';

export const COUNT_MAX = 20;
export const REST_LENS = [5, 10, 15, 20];
export const COUNTDOWN_AT = 3;   // 남은 초가 이만큼일 때 '셋, 둘, 하나'가 나간다
// 우리말 셈씨 — 운동은 '하나 둘 셋'으로 셉니다.
export const COUNT_KO = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];

// 말투를 가리지 않는 갈래 — 하는 말이 정해져 있어 담백하게 읽든 다정하게 읽든 내용이 같다.
// 이 갈래는 tone을 'a'(둘 다)로 담아 한 벌만 쓴다.
export const TONE_FREE = ['count', 'side', 'countdown', 'switch', 'bgm'];
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

/** 이 유형에게 처음 골라져 있을 곡 번호 */
export function bgmNoFor(code) {
  const a = String(code || '').split('-')[0].toUpperCase();
  const relaxed = a.includes('O');
  const flexible = a.includes('Q');
  if (relaxed) return flexible ? 2 : 1;
  return flexible ? 3 : 4;
}
