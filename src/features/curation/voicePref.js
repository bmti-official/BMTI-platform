// 안내 음성의 켬·끔, 크기, 자막 — 이 기기에 적어 둔다.
// 바디플리는 동작마다 화면이 새로 서기 때문에, 적어 두지 않으면 동작이 바뀔 때마다 처음 값으로 돌아간다.
const KEY = 'bmti_voice';
export const VOICE_VOL = 0.85;   // 처음 크기

export function readVoicePref() {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
export function writeVoicePref(patch) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...readVoicePref(), ...patch })); } catch { /* 적지 못해도 소리는 그대로 난다 */ }
}
/** 적어 둔 크기(0~1). 바꾼 적이 없으면 null */
export function savedVoiceVol() {
  const v = readVoicePref().vol;
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : null;
}
