import { supabase } from './supabaseClient';

// v1.1 (2026-10-01) — 오늘의 태그(생리 중·진통제 등)와 각도기록(관절 각도·좌표)을 동의 항목에 더했다.
// 버전이 바뀌면 예전 동의(v1.0)는 인정하지 않아, 기존 회원도 다음 기록 전에 다시 동의한다.
export const CONSENT_VERSION = 'v1.1';

// 빠른 게이팅용 로컬 플래그(게스트·로그인 공통). 서버 저장과 별개로, 첫 기록 전 강제 게이트에 쓴다.
const LOCAL_KEY = 'bmti_health_consent';
export function hasLocalHealthConsent() {
  try { return (localStorage.getItem(LOCAL_KEY) || '').startsWith(CONSENT_VERSION); } catch { return false; }
}
export function setLocalHealthConsent(optional) {
  try { localStorage.setItem(LOCAL_KEY, `${CONSENT_VERSION}${optional ? ':opt' : ''}`); } catch {}
}
// 선택(가명처리 후 통계·연구·서비스 개선) 동의 여부 — 기록·발견 열람 게이팅에 쓴다.
export function hasOptionalHealthConsent() {
  try { const v = localStorage.getItem(LOCAL_KEY) || ''; return v.startsWith(CONSENT_VERSION) && v.includes(':opt'); } catch { return false; }
}
/** 예전 판에 동의했던 사람인가 — 다시 동의를 받는 까닭을 알려 주려고 본다 */
export function hadOldHealthConsent() {
  try { const v = localStorage.getItem(LOCAL_KEY) || ''; return !!v && !v.startsWith(CONSENT_VERSION); } catch { return false; }
}

// 동의 문구 — 다이어리 첫 게이트·마이페이지·발견 동의 창이 같은 말을 쓴다
export const CONSENT_ITEMS = '기분·통증·수면, 오늘의 태그(생리 중·진통제·두통 등), 각도기록(관절 각도·위치 점)';
export const CONSENT_WITHDRAW_NOTE = '동의는 마이페이지 › 건강 기록 동의에서 언제든 철회할 수 있고, 철회하면 다이어리 기록과 각도기록이 지워져요.';

/** 필수 동의 철회 — 서버에서 다이어리·각도기록을 지우고, 이 기기의 기록도 비운다 */
export async function withdrawHealthConsent() {
  const { error } = await supabase.rpc('withdraw_health_consent');
  if (error) return { ok: false, why: /로그인/.test(error.message) ? '다시 로그인한 뒤에 해 주세요.' : '처리하지 못했어요. 잠시 후 다시 해 주세요.' };
  try {
    ['bmti_health_consent', 'bmti_diary_history', 'last_chat_date'].forEach((k) => localStorage.removeItem(k));
  } catch { /* 무시 */ }
  return { ok: true };
}

/** 회원 탈퇴 — 서버에서 회원과 딸린 기록을 모두 지운다. 이 기기의 로그인·기록 정리는 부르는 쪽이 한다 */
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) return { ok: false, why: /로그인/.test(error.message) ? '다시 로그인한 뒤에 해 주세요.' : '처리하지 못했어요. 잠시 후 다시 해 주세요.' };
  try {
    Object.keys(localStorage).filter((k) => k.startsWith('bmti_') && k !== 'bmti_anon_id').forEach((k) => localStorage.removeItem(k));
    localStorage.removeItem('last_chat_date');
  } catch { /* 무시 */ }
  return { ok: true };
}

/**
 * 서버에 저장된 유저의 건강 기록 동의 상태를 가져옵니다.
 * @param {string} userId 
 * @returns {Promise<{agreed: boolean, version: string, agreed_at: string, optional_consent: boolean} | null>}
 */
export async function getHealthRecordConsent(userId) {
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('health_record_consents')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116: no rows returned
      console.error('[HealthConsent] 조회 실패:', error);
    }
    return null;
  }
  
  return data;
}

/**
 * 유저의 건강 기록 동의 상태를 서버에 저장/업데이트합니다.
 * @param {string} userId 
 * @param {boolean} agreed 동의 여부 (true/false)
 * @param {boolean} optionalConsent 선택 항목 동의 여부
 * @returns {Promise<boolean>} 성공 여부
 */
export async function updateHealthRecordConsent(userId, agreed, optionalConsent = false) {
  if (!userId) return false;
  
  const { error } = await supabase
    .from('health_record_consents')
    .upsert({
      user_id: userId,
      agreed: agreed,
      version: CONSENT_VERSION,
      optional_consent: optionalConsent,
      updated_at: new Date().toISOString()
    });
    
  if (error) {
    console.error('[HealthConsent] 업데이트 실패:', error);
    return false;
  }
  
  return true;
}
