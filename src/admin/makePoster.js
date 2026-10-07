// 바디카드 영상에서 격자용 그림 한 장을 뽑는다 — 관리자 화면 전용.
//
// 둘러보기·보관함 격자에 영상을 통째로 깔면 22편에 100MB 가까이 내려받아 한참 걸린다.
// 격자에는 이 그림(40KB 안팎)만 깔고, 카드를 열었을 때 영상을 튼다.
import { uploadOne } from './upload';

const W = 540;              // 격자 칸은 폰에서 130px 남짓 — 두세 배면 충분히 또렷하다
const AT = 0.3;             // 첫 장면은 검게 시작하는 영상이 있어 살짝 뒤를 뜬다

function seek(v, t) {
  return new Promise((ok) => {
    const done = () => { v.removeEventListener('seeked', done); ok(); };
    v.addEventListener('seeked', done);
    try { v.currentTime = t; } catch { ok(); }
    setTimeout(done, 3000);
  });
}

/** 영상 주소 → 올린 그림 주소. 실패하면 { err } */
export async function makePoster(videoUrl) {
  if (!videoUrl) return { err: '영상이 없어요.' };
  const v = document.createElement('video');
  v.crossOrigin = 'anonymous'; v.muted = true; v.playsInline = true; v.preload = 'auto';
  v.src = videoUrl + (videoUrl.includes('?') ? '&' : '?') + 'poster=1';   // 캐시와 섞이지 않게
  try {
    await new Promise((ok, bad) => {
      v.onloadeddata = ok;
      v.onerror = () => bad(new Error('영상을 열지 못했어요.'));
      setTimeout(() => bad(new Error('영상을 여는 데 너무 오래 걸려요.')), 20000);
    });
    await seek(v, Math.min(AT, (v.duration || 1) / 4));
    const scale = W / (v.videoWidth || W);
    const c = document.createElement('canvas');
    c.width = W; c.height = Math.round((v.videoHeight || W) * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.78));
    if (!blob) return { err: '그림을 만들지 못했어요.' };
    return uploadOne(new File([blob], 'poster.jpg', { type: 'image/jpeg' }));
  } catch (e) {
    return { err: e.message || '그림을 만들지 못했어요.' };
  } finally {
    v.removeAttribute('src'); try { v.load(); } catch { /* 무시 */ }
  }
}
