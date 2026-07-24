// PWA — 서비스 워커 등록 + 영구 저장 요청.
// 목적: 웹사이트를 휴대폰에 캐시(설치)하고, 사용자가 남긴 일기 데이터가
// 브라우저 저장 공간 정리로 지워지지 않도록 '영구 저장'을 요청한다.
export function initPWA() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch((e) => console.warn('서비스 워커 등록 실패', e));
    });
  }
  // 저장 데이터(하루일기 등)가 지워지지 않도록 영구 저장 요청 (지원 브라우저만)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persisted().then((already) => {
      if (!already) navigator.storage.persist().catch(() => {});
    }).catch(() => {});
  }
}
