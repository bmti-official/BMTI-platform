// 말로 알려 주기 — 각도를 재는 동안에는 화면을 볼 수 없다.
// 옆으로 서 있거나 허리를 굽히는 중이라 글씨가 눈에 안 들어온다. 그래서 귀로 알려 준다.
//
// 브라우저가 가진 목소리를 쓴다. 따로 받아 올 파일이 없다.

let last = '';
let lastAt = 0;

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** 한 마디 한다. 같은 말을 연달아 쏟아 내지 않게 텀을 둔다. */
export function say(text, { gap = 2600, force = false } = {}) {
  if (!canSpeak() || !text) return;
  const now = Date.now();
  if (!force && text === last && now - lastAt < gap) return;
  last = text; lastAt = now;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 1.05;
    u.pitch = 1.0;
    // 앞말이 길면 잘라 내고 새 말을 먼저 들려준다 — 지금 고칠 것이 더 급하다
    if (force) window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* 소리가 안 나도 화면 안내는 그대로 있다 */ }
}

/** 하던 말을 멈춘다. 화면을 떠날 때 부른다. */
export function hush() {
  if (!canSpeak()) return;
  try { window.speechSynthesis.cancel(); } catch { /* 무시 */ }
  last = ''; lastAt = 0;
}
