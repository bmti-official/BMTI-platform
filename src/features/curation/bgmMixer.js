// 배경음악의 소리 크기를 맡는 믹서.
//
// 아이폰(사파리·카카오톡 안 브라우저)은 웹페이지가 audio.volume을 바꾸지 못하게 막아 둔다 — 늘 100%다.
// 그래서 음악 크기, 멘트가 나올 때 줄이기, 도막 겹쳐 넘기기가 아이폰에서는 하나도 듣지 않았다.
// 음악을 브라우저의 믹서(Web Audio)로 흘려 거기서 크기를 조절한다. 이 길은 아이폰에서도 듣는다.
//
// 믹서는 손님이 화면을 한 번 눌러야 켜진다(브라우저의 규칙). 자기점검 층에서 누르는 모든 탭이 믹서를 깨운다.
// 믹서가 켜지지 않는 기기에서는 예전 방식(audio.volume)으로 물러난다.
// 둘 다 안 되는 기기(아이폰인데 믹서가 안 켜짐)에서는 음악을 틀지 않는다 — 음성을 덮는 음악보다 없는 편이 낫다.

let ctx = null;
const gains = new WeakMap();   // audio 태그 → 그 태그의 크기 손잡이

const Ctor = () => (typeof window === 'undefined' ? null : (window.AudioContext || window.webkitAudioContext || null));

/** 믹서를 미리 만들어 둔다(아직 잠든 채로). 만들 수 없는 브라우저면 아무 일도 하지 않는다. */
export function prepareMixer() {
  if (ctx || !Ctor()) return;
  try { ctx = new (Ctor())(); } catch { ctx = null; }
}

/** 손님이 화면을 누른 그 순간에 부른다 — 잠든 믹서를 깨운다. */
export function wakeMixer() {
  if (!ctx) return;
  if (ctx.state !== 'running') { try { ctx.resume().catch(() => {}); } catch { /* 무시 */ } }
}

/** 자기점검 층을 떠날 때 — 믹서를 재운다(배터리). 다시 들어와 누르면 깬다. */
export function restMixer() {
  if (ctx && ctx.state === 'running') { try { ctx.suspend().catch(() => {}); } catch { /* 무시 */ } }
}

export const mixerOn = () => !!ctx && ctx.state === 'running';

// audio.volume이 듣는 기기인가 — 아이폰은 값을 바꿔도 1로 남는다
let volOk = null;
export function volumeWorks() {
  if (volOk !== null) return volOk;
  try { const a = new Audio(); a.volume = 0.5; volOk = Math.abs(a.volume - 0.5) < 0.01; } catch { volOk = true; }
  return volOk;
}

/**
 * 안내 음성의 크기를 정한다. 음성은 끊기면 안 되는 소리라, 되도록 믹서를 거치지 않는다.
 *   · audio.volume이 듣는 기기(안드로이드·PC) — 그대로 audio.volume으로.
 *   · 아이폰 — 손님이 음성 크기를 직접 바꿨을 때만(viaMixer) 믹서로 흘린다. 바꾸지 않았으면 예전처럼 그대로 튼다.
 */
export function setVoiceLevel(el, v, viaMixer = false) {
  if (!el) return;
  const level = Math.max(0, Math.min(1, Number(v) || 0));
  if (volumeWorks()) { try { el.volume = level; } catch { /* 무시 */ } return; }
  if (viaMixer) setLevel(el, level);
}

/** 이 기기에서 음악 크기를 조절할 길이 있는가 — 없으면 음악을 틀지 않는다 */
export const canControl = () => mixerOn() || volumeWorks();

/**
 * 음악 태그 하나의 크기를 정한다(0~1). 믹서가 켜져 있으면 믹서로, 아니면 audio.volume으로.
 * 믹서로 한 번 이은 태그는 계속 믹서로 간다(브라우저가 되돌리지 못하게 한다).
 */
export function setLevel(el, v) {
  if (!el) return;
  const level = Math.max(0, Math.min(1, Number(v) || 0));
  el.dataset.level = level.toFixed(3);
  let g = gains.get(el);
  if (!g && mixerOn()) {
    try {
      const src = ctx.createMediaElementSource(el);
      g = ctx.createGain();
      g.gain.value = 0;
      src.connect(g); g.connect(ctx.destination);
      gains.set(el, g);
      el.volume = 1;
      el.dataset.mixer = '1';
      // 무음 스위치를 켜 둔 아이폰에서도 들리게 — 듣는 브라우저에서만
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* 무시 */ }
    } catch { g = null; }
  }
  if (g) {
    // 뚝뚝 끊기지 않게 살짝 미끄러지듯 옮긴다
    try { g.gain.setTargetAtTime(level, ctx.currentTime, 0.05); } catch { g.gain.value = level; }
    return;
  }
  if (Math.abs(el.volume - level) > 0.004) { try { el.volume = level; } catch { /* 무시 */ } }
}
