// 행동 기록 — 비회원 포함해 '무슨 일이 있었는지'만 남긴다.
// 개인정보를 새로 모으지 않는다. 브라우저마다 하나씩 만든 임의의 익명 ID만 쓴다.
//
// 기록이 실패해도 화면은 절대 멈추지 않는다(전부 조용히 넘어간다).
import { supabase } from "./supabaseClient";

const ANON_KEY = "bmti_anon_id";
const QUEUE_MAX = 20;

let queue = [];
let flushTimer = null;

function anonId() {
  try {
    let v = localStorage.getItem(ANON_KEY);
    if (!v) {
      v = (crypto?.randomUUID?.() || `a${Date.now()}${Math.random().toString(36).slice(2)}`);
      localStorage.setItem(ANON_KEY, v);
    }
    return v;
  } catch { return "unknown"; }
}

function currentUserId() {
  try { return JSON.parse(localStorage.getItem("bmti_user") || "null")?.id || null; } catch { return null; }
}

// 여러 건을 모아 한 번에 보낸다 — 페이지가 무거워지지 않게.
async function flush() {
  if (!queue.length) return;
  const rows = queue.splice(0, queue.length);
  try { await supabase.from("app_events").insert(rows); } catch { /* 기록 실패는 무시 */ }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 1500);
}

/** 행동 한 건을 남긴다. track('quiz_done', { code: 'OLQM' }) */
export function track(name, meta = {}) {
  if (!name) return;
  try {
    queue.push({ anon_id: anonId(), user_id: currentUserId(), name: String(name).slice(0, 40), meta });
    if (queue.length >= QUEUE_MAX) flush(); else scheduleFlush();
  } catch { /* 기록 실패는 무시 */ }
}

// ── 화면 체류 시간 ────────────────────────────────────────────
// 화면이 바뀌거나 탭을 벗어나면 그 화면에 머문 초를 남긴다.
let curScreen = null;
let enteredAt = 0;

function closeScreen() {
  if (!curScreen) return;
  const sec = Math.round((Date.now() - enteredAt) / 1000);
  // 0초·비정상적으로 긴 값(탭을 켜두고 자리 비움)은 버린다.
  if (sec >= 1 && sec <= 60 * 60) track("view_leave", { screen: curScreen, sec });
  curScreen = null;
}

/** 화면 진입을 알린다. 같은 화면을 다시 부르면 무시한다. */
export function trackScreen(screen) {
  if (!screen || screen === curScreen) return;
  closeScreen();
  curScreen = screen;
  enteredAt = Date.now();
  track("view_enter", { screen });
}

/** 앱 시작 시 한 번 — 세션 시작, 화면 이탈·오류를 자동으로 남긴다. */
export function initAnalytics() {
  try {
    track("session_start", {
      w: window.innerWidth,
      ref: (document.referrer || "").slice(0, 120),
      pwa: window.matchMedia?.("(display-mode: standalone)").matches || false,
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") { closeScreen(); flush(); }
      else if (curScreen) enteredAt = Date.now();
    });
    window.addEventListener("pagehide", () => { closeScreen(); flush(); });

    // 자바스크립트 오류 — 어떤 기기에서만 깨지는지 잡으려고 남긴다.
    window.addEventListener("error", (e) => {
      track("js_error", {
        msg: String(e?.message || "").slice(0, 200),
        src: String(e?.filename || "").slice(-80),
        line: e?.lineno || 0,
        ua: navigator.userAgent.slice(0, 120),
      });
    });
    window.addEventListener("unhandledrejection", (e) => {
      track("js_error", {
        msg: ("promise: " + String(e?.reason?.message || e?.reason || "")).slice(0, 200),
        ua: navigator.userAgent.slice(0, 120),
      });
    });
  } catch { /* 기록 준비 실패는 무시 */ }
}
