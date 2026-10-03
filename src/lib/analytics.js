// 행동 기록 — 비회원 포함해 '무슨 일이 있었는지'만 남긴다.
// 개인정보를 새로 모으지 않는다. 브라우저마다 하나씩 만든 임의의 익명 ID만 쓴다.
//
// 기록이 실패해도 화면은 절대 멈추지 않는다(전부 조용히 넘어간다).
import { supabase } from "./supabaseClient";

const ANON_KEY = "bmti_anon_id";
const QUEUE_MAX = 20;

let queue = [];

// 관리자 미리보기(admin.html)에서 누른 것은 남기지 않는다 — 론칭 뒤 실측이 운영자 손으로 흐려지지 않게.
const PREVIEW = (() => { try { return /admin/.test(window.location.pathname); } catch { return false; } })();
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

/** 지금 바로 보낸다 — 탭이 가려지는 순간처럼 기다릴 틈이 없을 때. */
export function flushNow() { flush(); }

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; flush(); }, 1500);
}

/**
 * 오류는 아니지만 '이러면 안 되는데' 싶은 순간을 남긴다.
 * 앱이 멈추지 않고 조용히 잘못 도는 일을 잡으려는 것이다.
 * 예: 주소에 로그인 토큰이 붙어 왔다 · 저장된 유형 코드가 이상하다
 */
export function trackAnomaly(kind, meta = {}) {
  track("anomaly", { kind, ...meta });
}

/** 행동 한 건을 남긴다. track('quiz_done', { code: 'OLQM' }) */
export function track(name, meta = {}) {
  if (!name || PREVIEW) return;
  try {
    queue.push({ anon_id: anonId(), user_id: currentUserId(), name: String(name).slice(0, 40), meta });
    if (queue.length >= QUEUE_MAX) flush(); else scheduleFlush();
  } catch { /* 기록 실패는 무시 */ }
}

/**
 * 누가 했는지 남기지 않는 기록 — 검색어처럼 건강 정보에 가까운 말에 쓴다.
 * 회원 번호도, 브라우저 익명 번호도 붙이지 않는다. 그래서 다른 기록과 이어 볼 수 없다.
 */
export const NO_ONE = "none";
export function trackAnon(name, meta = {}) {
  if (!name || PREVIEW) return;
  try {
    queue.push({ anon_id: NO_ONE, user_id: null, name: String(name).slice(0, 40), meta });
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

    // 주간 알림(웹 푸시)을 눌러 들어왔는가 — 알림이 '/?go=angle' 로 연다
    try {
      const go = new URLSearchParams(window.location.search).get("go");
      if (go) track("push_open", { go: go.slice(0, 20) });
    } catch { /* 무시 */ }

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
