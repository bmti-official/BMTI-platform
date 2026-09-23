// 각도 잴 때 귀로 알려 주기.
//
// 브라우저가 읽어 주는 소리는 값싸게 들리고, 되풀이되면 듣기 싫어진다.
// 그래서 사람이 읽어 담아 둔 파일(🔊 공통 음성 → 각도 잴 때 안내)을 쓴다.
// 파일이 없으면 아무 소리도 내지 않는다 — 어설픈 소리보다 조용한 편이 낫다.
//
// **같은 말을 연달아 틀지 않는다.** 자세를 고치는 동안 같은 문장이 계속 나오면
// 그것만으로 그만두고 싶어진다. 고칠 것이 '바뀌었을 때'만 한 번 말한다.
import { loadVoiceAssets, voiceKey, ANGLE_N } from '../features/curation/voiceCommon';

let bank = null;
let el = null;
let saidKey = '';      // 방금 무엇을 말했는지
let quiet = false;

/** 파일을 한 번 읽어 둔다. 화면에 들어올 때 부른다. */
export async function loadAngleVoice() {
  if (bank) return bank;
  bank = await loadVoiceAssets().catch(() => ({}));
  return bank;
}

export const hasAngleVoice = () => !!bank && Object.keys(bank).some((k) => k.startsWith('angle|'));

/** 한 마디 한다. 방금 한 말과 같으면 넘어간다. */
export function say(key, { force = false } = {}) {
  if (quiet || !bank) return;
  const n = ANGLE_N[key];
  if (!n) return;
  if (!force && key === saidKey) return;     // 같은 말을 되풀이하지 않는다
  const url = bank[voiceKey('angle', 'a', n)];
  if (!url) { saidKey = key; return; }
  saidKey = key;
  try {
    if (!el) { el = new Audio(); el.preload = 'auto'; }
    el.pause();
    el.src = url;
    el.currentTime = 0;
    el.play().catch(() => {});
  } catch { /* 소리가 안 나도 화면 안내는 그대로 있다 */ }
}

/** 자세가 맞아 고칠 것이 없어졌을 때 — 다음에 어긋나면 다시 말하게 풀어 준다. */
export const clearSaid = () => { saidKey = ''; };

/** 하던 말을 멈춘다. */
export function hush() {
  try { el?.pause(); } catch { /* 무시 */ }
  saidKey = '';
}

export const setQuiet = (v) => { quiet = v; if (v) hush(); };
export const isQuiet = () => quiet;
