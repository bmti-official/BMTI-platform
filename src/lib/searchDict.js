// 관리자 화면에서 직접 더한 검색 말 — 기본 사전(searchWords.js) 뒤에 이어 붙는다.
// 새 표를 만들지 않고 공용 설정 칸(app_assets)에 한 줄로 담는다. 누구나 읽고, 관리자만 고친다.
import { supabase } from './supabaseClient';

export const SEARCH_WORDS_KEY = 'search_words';

/** 직접 더한 말 목록을 읽는다. 없거나 못 읽으면 빈 목록 — 기본 사전만으로 돈다. */
export async function loadExtraWords() {
  try {
    const { data, error } = await supabase.from('app_assets').select('meta').eq('key', SEARCH_WORDS_KEY).maybeSingle();
    if (error || !data) return [];
    return Array.isArray(data.meta?.list) ? data.meta.list : [];
  } catch { return []; }
}

/** 목록을 통째로 담는다(관리자만 된다). */
export async function saveExtraWords(list) {
  const { error } = await supabase.from('app_assets')
    .upsert({ key: SEARCH_WORDS_KEY, url: null, meta: { list }, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return error ? { ok: false, why: error.message } : { ok: true };
}
