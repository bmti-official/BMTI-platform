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

// ── 말 차례 ──
// 새 말이 올 때마다 하던 말을 끊으면, 손님은 어느 말도 끝까지 못 듣는다.
//   · 고칠 점(골반이 화면 밖이에요 등) — 다른 말이 나오는 중이면 끼어들지 않는다.
//     말이 끝난 뒤에도 여전히 어긋나 있으면 그때 말한다(검사가 계속 부르므로).
//   · 정해진 순서의 말(force — 자리 안내, 셋·둘·하나, 시작합니다) — 끊지 않고 끝난 다음에 잇는다.
//   · cut — 카운트를 처음부터 다시 셀 때처럼, 하던 말을 끊어야 맞는 때만.
let queue = [];                 // 기다리는 말(주소)
const lengths = {};             // 주소 → 길이(초). 한 번 틀면 안다
const GUESS = 3;                // 아직 모르는 길이는 이만큼으로 친다

const play = (url) => {
  try {
    if (!el) {
      el = new Audio(); el.preload = 'auto';
      el.addEventListener('loadedmetadata', () => { if (Number.isFinite(el.duration)) lengths[el.src] = el.duration; });
      el.addEventListener('ended', () => { const next = queue.shift(); if (next) play(next); });
      el.addEventListener('error', () => { const next = queue.shift(); if (next) play(next); });
    }
    el.pause();
    el.src = url;
    el.currentTime = 0;
    el.play().catch(() => { const next = queue.shift(); if (next) play(next); });
  } catch { /* 소리가 안 나도 화면 안내는 그대로 있다 */ }
};

/** 지금 말하는 중인가(기다리는 말 포함) */
export const isSpeaking = () => !!el && ((!el.paused && !el.ended) || queue.length > 0);

/** 지금 말과 기다리는 말이 다 끝나기까지 남은 시간(ms) */
export function speakingLeft() {
  if (!isSpeaking()) return 0;
  const cur = el && !el.paused && !el.ended
    ? Math.max(0, (Number.isFinite(el.duration) ? el.duration : (lengths[el.src] || GUESS)) - el.currentTime) : 0;
  return Math.round((cur + queue.reduce((n, u) => n + (lengths[u] || GUESS), 0)) * 1000);
}

/** 한 마디 한다. 방금 한 말과 같으면 넘어간다. */
export function say(key, { force = false, cut = false } = {}) {
  if (quiet || !bank) return;
  const n = ANGLE_N[key];
  if (!n) return;
  if (!force && key === saidKey) return;     // 같은 말을 되풀이하지 않는다
  const url = bank[voiceKey('angle', 'a', n)];
  if (!url) { saidKey = key; return; }
  if (!force && isSpeaking()) return;         // 고칠 점은 끼어들지 않는다 — 끝난 뒤에 다시 불린다
  saidKey = key;
  if (cut) { queue = []; play(url); return; }
  if (isSpeaking()) { queue.push(url); return; }
  play(url);
}

/** 자세가 맞아 고칠 것이 없어졌을 때 — 다음에 어긋나면 다시 말하게 풀어 준다. */
export const clearSaid = () => { saidKey = ''; };

/** 하던 말을 멈춘다. */
export function hush() {
  queue = [];
  try { el?.pause(); } catch { /* 무시 */ }
  saidKey = '';
}

export const setQuiet = (v) => { quiet = v; if (v) hush(); };
export const isQuiet = () => quiet;
