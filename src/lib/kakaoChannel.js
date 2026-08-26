// 카카오톡 채널('자기점검 50분') 연동 — 문의 채팅과 채널 추가를 함께 다룬다.
export const KAKAO_CHANNEL_ID = "_xasxgZX";
export const KAKAO_CHANNEL_CHAT_URL = `http://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat`;
export const KAKAO_CHANNEL_ADD_URL = `http://pf.kakao.com/${KAKAO_CHANNEL_ID}/friend`;

// 채널을 이미 추가했는지는 카카오 로그인 권한(카카오톡 채널 관계)이 있어야 서버로 확인할 수 있다.
// 지금은 그 권한이 없어, 이 기기에서 추가를 눌렀는지/닫았는지만 기억해 다시 띄우지 않는다.
const ADDED_KEY = "bmti_kakao_channel_added";
const DISMISS_KEY = "bmti_kakao_channel_dismissed";

export const hasAddedKakaoChannel = () => {
  try { return localStorage.getItem(ADDED_KEY) === "1"; } catch { return false; }
};
export const markKakaoChannelAdded = () => {
  try { localStorage.setItem(ADDED_KEY, "1"); } catch { /* 저장 불가여도 동작에는 지장 없음 */ }
};
export const isKakaoChannelPromptDismissed = () => {
  try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
};
export const dismissKakaoChannelPrompt = () => {
  try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* 위와 같음 */ }
};

export function openKakaoChannelChat() {
  window.open(KAKAO_CHANNEL_CHAT_URL, "_blank", "noopener,noreferrer");
}

// 채널 추가 — SDK가 있으면 카카오 기본 추가창을, 없으면 채널 추가 페이지를 연다.
export function addKakaoChannel() {
  markKakaoChannelAdded();
  try {
    if (window.Kakao?.Channel?.addChannel) {
      window.Kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_ID });
      return;
    }
  } catch { /* SDK 호출이 막히면 아래 링크로 넘어간다 */ }
  window.open(KAKAO_CHANNEL_ADD_URL, "_blank", "noopener,noreferrer");
}
