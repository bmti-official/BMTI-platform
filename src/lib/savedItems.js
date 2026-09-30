// 내 보관함 — 보관한 바로카드·바로플리·읽을거리 목록(saved_items).
//
// 누르는 즉시 화면을 바꾸고(기다리지 않게), 서버에는 뒤따라 적는다.
// 서버에 못 적으면 화면을 되돌린다.
import { supabase } from './supabaseClient';

/** 내가 보관한 것 — [{ item_type, item_id, created_at }] 새 것부터 */
export async function loadSaved(userId) {
  if (!userId) return [];
  const { data, error } = await supabase.from('saved_items')
    .select('item_type,item_id,created_at').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { console.error('보관함 불러오기 실패', error); return []; }
  return data || [];
}

/** 담거나 뺀다. 성공하면 true */
export async function setSaved(userId, type, id, on) {
  if (!userId) return false;
  const q = on
    ? supabase.from('saved_items').upsert({ user_id: userId, item_type: type, item_id: id }, { onConflict: 'user_id,item_type,item_id' })
    : supabase.from('saved_items').delete().eq('user_id', userId).eq('item_type', type).eq('item_id', id);
  const { error } = await q;
  if (error) { console.error('보관 실패', error); return false; }
  return true;
}
