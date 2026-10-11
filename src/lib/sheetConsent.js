// 건강 정보 한 장의 동의 — 불편한 부위와 상황·기간은 건강에 관한 정보라, 저장하기 전에 따로 동의를 받는다.
// (개인정보 보호법 제23조: 건강에 관한 정보는 다른 동의와 구분해 따로 동의받는다)
// 이 기기에 한 번 적어 두고, 회원이면 서버(users.sheet_consent_ver·sheet_consent_at)에도 남긴다.
export const SHEET_CONSENT_VER = 's1';   // 동의문 판 — 문구를 고치면 올린다
const KEY = 'bmti_sheet_consent';

/** 이미 동의했는가 — 이 기기의 표시나 회원 줄의 기록 가운데 하나라도 지금 판이면 된다 */
export function hasSheetConsent(userInfo) {
  if (userInfo?.sheet_consent_ver === SHEET_CONSENT_VER) return true;
  try { return localStorage.getItem(KEY) === SHEET_CONSENT_VER; } catch { return false; }
}
export function markSheetConsent() {
  try { localStorage.setItem(KEY, SHEET_CONSENT_VER); } catch { /* 무시 */ }
}
export function clearSheetConsent() {
  try { localStorage.removeItem(KEY); } catch { /* 무시 */ }
}
