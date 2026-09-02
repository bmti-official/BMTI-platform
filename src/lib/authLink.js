// 카카오 로그인과 Supabase 로그인을 이어 붙인다.
//
// 지금까지는 브라우저가 "나는 이 사람이다"라고 말하면 서버가 그대로 믿었다.
// 여기서 Supabase 로그인 세션을 하나 만들어 두면, 서버가 스스로 누구인지 알 수 있어
// 남의 기록을 읽거나 지우지 못하게 막을 수 있다.
//
// 켜고 끄기: localStorage 의 'bmti_auth_mode'
//   'off'(기본) — 지금처럼 동작. 세션을 만들지 않는다.
//   'on'        — 카카오 로그인 뒤에 Supabase 로그인까지 이어 붙인다.
// 관리자 화면에서 확인이 끝나면 기본값을 'on'으로 바꾼다.
import { supabase } from "./supabaseClient";

const MODE_KEY = "bmti_auth_mode";

export function authMode() {
  try { return localStorage.getItem(MODE_KEY) || "off"; } catch { return "off"; }
}
export function setAuthMode(v) {
  try { localStorage.setItem(MODE_KEY, v === "on" ? "on" : "off"); } catch { /* 무시 */ }
}

/** 지금 Supabase 로그인 세션이 있는지 */
export async function currentAuthId() {
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id || null;
  } catch { return null; }
}

/**
 * 카카오로 Supabase 로그인을 시작한다. 페이지가 카카오로 넘어갔다가 돌아온다.
 * Supabase 대시보드에서 카카오 로그인을 켜 두지 않았으면 실패하고 false를 돌려준다.
 */
export async function startKakaoAuth(redirectTo = window.location.origin + window.location.pathname) {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo, scopes: "profile_nickname account_email" },
    });
    if (error) { console.warn("[auth] 카카오 로그인 시작 실패:", error.message); return false; }
    return true;
  } catch (e) {
    console.warn("[auth] 카카오 로그인 시작 실패:", e?.message || e);
    return false;
  }
}

/**
 * 로그인 세션이 있으면, 그 세션을 기존 회원 줄(users)에 이어 붙인다.
 * 이미 이어져 있으면 아무 일도 하지 않는다.
 * 돌려주는 값: 이어 붙인 users.id (없으면 null)
 */
export async function linkAccount(kakaoId) {
  if (!kakaoId) return null;
  const authId = await currentAuthId();
  if (!authId) return null;
  try {
    const { data, error } = await supabase.rpc("link_my_account", { p_kakao_id: String(kakaoId) });
    if (error) { console.warn("[auth] 계정 잇기 실패:", error.message); return null; }
    return data || null;
  } catch (e) {
    console.warn("[auth] 계정 잇기 실패:", e?.message || e);
    return null;
  }
}

/** 로그아웃할 때 Supabase 세션도 함께 정리한다. */
export async function endAuth() {
  try { await supabase.auth.signOut(); } catch { /* 무시 */ }
}

/**
 * 지금 상태를 한눈에 — 관리자 화면에서 확인할 때 쓴다.
 * { mode, authId, linkedUserId }
 */
export async function authStatus() {
  const authId = await currentAuthId();
  let linkedUserId = null;
  if (authId) {
    try {
      const { data } = await supabase.from("users").select("id").eq("auth_id", authId).maybeSingle();
      linkedUserId = data?.id || null;
    } catch { /* 무시 */ }
  }
  return { mode: authMode(), authId, linkedUserId };
}
