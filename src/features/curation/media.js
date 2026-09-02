// 주소만 보고 영상인지 가린다 — 화면에서 <video>로 그릴지 정할 때 쓴다.
// 관리자 화면과 손님 화면이 같은 기준을 쓰도록 한 곳에 둔다.
export const isClip = (url) => /\.(mp4|webm|mov)(\?|$)/i.test(String(url || ''));
