import { supabase } from './supabaseClient';

export const CONSENT_VERSION = 'v1.0';

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
