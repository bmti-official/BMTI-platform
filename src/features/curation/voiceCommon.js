// 모든 바로카드가 함께 쓰는 음성 — 숫자 세기, 쉬는 시간, 마무리.
// 화면 부품이 아니라 값과 불러오기만 담는다.
import { supabase } from '../../lib/supabaseClient';

export const COUNT_MAX = 20;
export const REST_LENS = [5, 10, 15, 20];
// 우리말 셈씨 — 운동은 '하나 둘 셋'으로 셉니다.
export const COUNT_KO = ['', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열',
  '열하나', '열둘', '열셋', '열넷', '열다섯', '열여섯', '열일곱', '열여덟', '열아홉', '스물'];

// 말투를 가리지 않는 갈래 — 숫자와 방향은 성별로만 나뉜다.
export const TONE_FREE = ['count', 'side'];
export const ANY_TONE = 'a';
/** 말투를 가리는 갈래인지 보고, 안 가리면 'a'로 맞춰 준다. */
export const toneFor = (kind, tone) => (TONE_FREE.includes(kind) ? ANY_TONE : (tone === 'm' ? 'm' : 'z'));

export const voiceKey = (kind, gender, tone, n) =>
  `${kind}|${gender === 'male' ? 'male' : 'female'}|${toneFor(kind, tone)}|${n}`;

// { 'count|female|a|3': 'https://…' } 꼴로 통째로 읽어 온다.
export async function loadVoiceAssets() {
  const { data, error } = await supabase.from('voice_assets').select('kind, gender, tone, n, url');
  if (error || !data) return {};
  return Object.fromEntries(data.map((r) => [voiceKey(r.kind, r.gender, r.tone, r.n), r.url]));
}
