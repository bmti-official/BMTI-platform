// 강사–회원 연결 — 과제 링크, 연결(동의), 과제.
//
// 쓰는 일은 모두 서버 함수(68_coach_link.sql)가 맡는다. 함수가 매번 누구인지 확인하고,
// 강사에게 회원 표를 열지 않으며, 건강 정보 한 장은 회원이 고른 때에만 그 순간의 사본으로 넘어간다.
import { supabase } from './supabaseClient';

export const CONSENT_VER = 'c1';             // 동의문 판 — 문구를 고치면 올린다
const PENDING_KEY = 'bmti_coach_link';       // 카카오 로그인에 다녀오는 동안 링크를 쥐고 있는다
const CODE_RE = /^[0-9a-f]{20}$/;

/** 주소의 ?c=… 를 읽는다. 모양이 맞을 때만 */
export function codeFromUrl() {
  try {
    const c = new URLSearchParams(window.location.search).get('c') || '';
    return CODE_RE.test(c) ? c : '';
  } catch { return ''; }
}
export const pendingCode = {
  get() { try { const c = localStorage.getItem(PENDING_KEY) || ''; return CODE_RE.test(c) ? c : ''; } catch { return ''; } },
  set(c) { try { localStorage.setItem(PENDING_KEY, c); } catch { /* 무시 */ } },
  clear() { try { localStorage.removeItem(PENDING_KEY); } catch { /* 무시 */ } },
};
/** 회원에게 보낼 주소 */
export const linkUrl = (code) => `${window.location.origin}${import.meta.env.BASE_URL}?c=${code}`;

const rpc = async (name, args) => {
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { error };
  return { data };
};

/** 링크 미리 보기 — { ok, coach_name, center_name, area, title, cover_text, card_ids, note, per_week, is_me, connected, other_coach } */
export async function peekLink(code) {
  const r = await rpc('peek_coach_link', { p_code: code });
  if (r.error) return { ok: false, why: 'error' };
  return r.data || { ok: false, why: 'none' };
}

/** 링크 받기 — 처음이면 동의와 함께 연결한다. { ok, why } */
export async function acceptLink(code, shareSheet) {
  const r = await rpc('accept_coach_link', { p_code: code, p_share_sheet: !!shareSheet, p_consent_ver: CONSENT_VER });
  if (r.error) return { ok: false, why: 'error' };
  return r.data || { ok: false, why: 'error' };
}

/** 내 강사 — { coach_name, center_name, area, active, share_sheet, sheet_at, since } 또는 null */
export async function myCoach() {
  const r = await rpc('my_coach', {});
  return r.error ? null : (r.data || null);
}
export const sendSheet = async () => !(await rpc('send_sheet_to_coach', {})).error;
export const stopSharing = async () => !(await rpc('stop_sharing_sheet', {})).error;
export const leaveCoach = async () => !(await rpc('leave_coach', {})).error;

/** 내가 활동 중인 강사인가 — 강사 줄 또는 null */
export async function coachRow(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from('coaches').select('*').eq('user_id', userId).eq('active', true).maybeSingle();
  return error ? null : (data || null);
}

/** 강사: 이 플리의 링크를 만든다(있으면 고쳐 다시 쓴다). { code } 또는 { why } */
export async function makeLink(routineId, note, perWeek) {
  const r = await rpc('make_coach_link', { p_routine_id: routineId, p_note: note || '', p_per_week: perWeek || null });
  if (r.error) {
    const m = String(r.error.message || '');
    return { why: /강사만|내가 만든|동작이 담긴|쓸 수 없는 말/.test(m) ? m : '링크를 만들지 못했어요. 잠시 후 다시 해 주세요.' };
  }
  return { code: r.data };
}
export const closeLink = async (code) => !(await rpc('close_coach_link', { p_code: code })).error;

/** 강사: 이 플리의 살아 있는 링크 — 없으면 null */
export async function liveLink(routineId) {
  const { data, error } = await supabase.from('coach_links').select('*').eq('routine_id', routineId).eq('active', true)
    .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1);
  return error ? null : ((data || [])[0] || null);
}

/**
 * 내가 받은 과제 — 플리와 담긴 동작까지 붙여서. cardsById: 공개 바디카드 { id: card }
 * 동작이 하나도 안 남은 플리는 뺀다(강사가 비웠거나, 담긴 카드가 비공개가 된 경우).
 */
export async function loadTasks(userId, cardsById = {}) {
  if (!userId) return [];
  const ts = await supabase.from('coach_tasks').select('*').eq('member_id', userId).order('sent_at', { ascending: false });
  if (ts.error || !(ts.data || []).length) return [];
  const ids = ts.data.map((t) => t.routine_id);
  const [rts, links] = await Promise.all([
    supabase.from('routines').select('*').in('id', ids),
    supabase.from('routine_cards').select('*').in('routine_id', ids).order('position', { ascending: true }),
  ]);
  const byId = Object.fromEntries((rts.data || []).map((r) => [r.id, r]));
  return ts.data.map((t) => {
    const r = byId[t.routine_id];
    if (!r) return null;
    const cards = (links.data || []).filter((l) => l.routine_id === r.id)
      .map((l) => (cardsById[l.card_id]
        ? { ...cardsById[l.card_id], rc_reps: l.reps, rc_sets: l.sets, rc_rest: l.rest, rc_side: l.side || '', rc_guide: l.guide || '' }
        : null))
      .filter(Boolean);
    // task: 강사가 보낸 것 — 보관·조회 수를 세지 않고, 만든 사람 자리에 강사를 적는다
    return cards.length ? { id: t.id, note: t.note || '', perWeek: t.per_week || 0, sentAt: t.sent_at, pli: { ...r, cards, mine: true, task: true } } : null;
  }).filter(Boolean);
}
