// 화면에 쓰는 공용 이미지 — 지금은 각도기록의 옆모습 사람 그림뿐이다.
import { supabase } from './supabaseClient';

export const ANGLE_BODY = { male: 'angle_body_male', female: 'angle_body_female' };

// 그림마다 어깨·골반이 어디쯤인지(%). 이 자리를 알아야 머리를 잰 각도만큼 돌린다.
export const DEFAULT_META = { shoulderX: 46, shoulderY: 34, hipY: 58, baseNeck: 6 };

export async function loadAssets(keys = []) {
  const { data, error } = await supabase.from('app_assets').select('*').in('key', keys);
  if (error) return {};
  const out = {};
  (data || []).forEach((r) => { out[r.key] = { url: r.url || '', meta: { ...DEFAULT_META, ...(r.meta || {}) } }; });
  return out;
}

export async function saveAsset(key, url, meta) {
  const { error } = await supabase.from('app_assets')
    .upsert({ key, url: url || null, meta: meta || {}, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  return error ? { ok: false, why: error.message } : { ok: true };
}
