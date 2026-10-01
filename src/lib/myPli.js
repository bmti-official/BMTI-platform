// 마이플리 — 이용자가 만든 플리를 서버(routines·routine_cards)에 담는다.
//
// owner_id 는 회원 번호(users.id)다. 권한은 52_my_pli.sql 이 지킨다
// (내 것만 쓰고, 이름에 쓸 수 없는 말은 서버에서도 막고, 공식 칸은 못 바꾼다).
// 동작마다 고른 설정(rc_*)은 routine_cards 의 reps·sets·rest·side·guide 에 담는다.
import { supabase } from './supabaseClient';

const toRow = (c, i, routineId) => ({
  routine_id: routineId, card_id: c.id, position: i,
  reps: Number(c.rc_reps) > 0 ? Number(c.rc_reps) : null,
  sets: Number(c.rc_sets) > 0 ? Number(c.rc_sets) : null,
  rest: Number(c.rc_rest) > 0 ? Number(c.rc_rest) : null,
  side: c.rc_side || null,
  guide: c.rc_guide || null,
});

/** 내 마이플리 — 담긴 동작까지 붙여서. cardsById: 공개 바로카드 { id: card } */
export async function loadMyPlis(userId, cardsById = {}) {
  if (!userId) return [];
  const rt = await supabase.from('routines').select('*').eq('owner_id', userId)
    .order('updated_at', { ascending: false });
  if (rt.error) { console.error('마이플리 불러오기 실패', rt.error); return []; }
  const ids = (rt.data || []).map((r) => r.id);
  if (!ids.length) return [];
  const links = await supabase.from('routine_cards').select('*').in('routine_id', ids).order('position', { ascending: true });
  const all = links.data || [];
  return (rt.data || []).map((r) => ({
    ...r, mine: true,
    cards: all.filter((l) => l.routine_id === r.id)
      .map((l) => (cardsById[l.card_id]
        ? { ...cardsById[l.card_id], rc_reps: l.reps, rc_sets: l.sets, rc_rest: l.rest, rc_side: l.side || '', rc_guide: l.guide || '' }
        : null))
      .filter(Boolean),
  }));
}

/** 새로 만들거나 고친다. p: { id?, title, cards, showNick }. 돌려주는 값: { ok, id, why } */
export async function saveMyPli(userId, p) {
  if (!userId) return { ok: false, why: '로그인한 뒤에 만들 수 있어요.' };
  const title = String(p.title || '').trim();
  const base = { title_z: title, title_m: title, show_nick: !!p.showNick, updated_at: new Date().toISOString() };
  // 공개(public)로 저장하면 바로플리에 올라간다. 올린 때·만든 사람(닉네임·유형)은 서버가 적는다(52_my_pli.sql).
  // 관리자가 숨긴 플리(hidden)는 상태를 건드리지 않는다.
  if (p.share === 'public' || p.share === 'private') base.share_state = p.share;
  let id = p.id;
  if (id) {
    const { error } = await supabase.from('routines').update(base).eq('id', id).eq('owner_id', userId);
    if (error) return { ok: false, why: whyOf(error) };
    const del = await supabase.from('routine_cards').delete().eq('routine_id', id);
    if (del.error) return { ok: false, why: whyOf(del.error) };
  } else {
    const { data, error } = await supabase.from('routines')
      .insert({ share_state: 'private', ...base, owner_id: userId, published: false, source_id: p.sourceId || null })
      .select('id').single();
    if (error) return { ok: false, why: whyOf(error) };
    id = data.id;
  }
  if ((p.cards || []).length) {
    const { error } = await supabase.from('routine_cards').insert(p.cards.map((c, i) => toRow(c, i, id)));
    if (error) return { ok: false, id, why: whyOf(error) };
  }
  return { ok: true, id };
}

/** 지운다 */
export async function deleteMyPli(userId, id) {
  if (!userId || !id) return false;
  const { error } = await supabase.from('routines').delete().eq('id', id).eq('owner_id', userId);
  if (error) { console.error('마이플리 지우기 실패', error); return false; }
  return true;
}

// 서버가 돌려준 말을 손님 말로
function whyOf(e) {
  const m = String(e?.message || '');
  if (/쓸 수 없는 말|숨긴 플리|숨김은/.test(m)) return m;
  if (/row-level security|42501/i.test(m + (e?.code || ''))) return '저장할 권한이 없어요. 다시 로그인해 주세요.';
  return '저장하지 못했어요. 잠시 후 다시 해 주세요.';
}
