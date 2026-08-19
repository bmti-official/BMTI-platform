// 문의는 카카오톡 채널 1:1 채팅으로 유도한다 (서비스 전역 공용).
export const KAKAO_CHANNEL_CHAT_URL = "http://pf.kakao.com/_xasxgZX/chat";

export function openKakaoChannelChat() {
  window.open(KAKAO_CHANNEL_CHAT_URL, "_blank", "noopener,noreferrer");
}
