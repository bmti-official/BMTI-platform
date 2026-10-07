// 바디카드·바디플리를 끝냈을 때 남기는 기록.
//
// 일기를 저절로 만들지 않는다. 여기에만 쌓아 두고, 일기를 열 때
// "오늘 두 번 하셨네요" 하고 채워 준다. 빈 일기가 생기면 연속·월간 집계가 오염된다.
//
//   done = false  한 세트 이상 했다 (했음)
//   done = true   끝까지 다 했다 (완주)
import { supabase } from './supabaseClient';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function me() {
  try {
    const u = JSON.parse(localStorage.getItem('bmti_user') || 'null');
    // 자동 기록을 꺼 둔 사람은 남기지 않는다. 비로그인 손님도 남기지 않는다.
    if (!u?.id || u.auto_exercise === false) return null;
    return u.id;
  } catch { return null; }
}

// 같은 카드를 같은 날 여러 번 보내지 않게, 이 화면에서 보낸 것을 기억해 둔다.
// '했음'을 보낸 뒤 '완주'가 오면 그건 한 번 더 보낸다(더 나아간 기록이니까).
const sent = new Set();

/** 한 세트 이상 했거나 끝까지 다 했을 때 부른다. */
export async function markFinish({ kind = 'card', cardId = null, routineId = null, done = false, setsDone = 0 }) {
  const userId = me();
  if (!userId) return;
  const tag = `${kind}-${cardId ?? routineId}-${done ? 'full' : 'part'}`;
  if (sent.has(tag)) return;
  sent.add(tag);
  try {
    await supabase.from('card_finishes').insert({
      user_id: userId, date: todayISO(), kind,
      card_id: kind === 'card' ? cardId : null,
      routine_id: kind === 'routine' ? routineId : null,
      done, sets_done: setsDone,
    });
  } catch { /* 기록이 안 남아도 따라하는 데는 지장이 없다 */ }
}

/** 오늘 몇 번, 무엇을 했는지 — 일기를 열 때 '오늘 두 번 하셨네요 · 뒷목 스트레칭, 턱 당기기'로 쓴다.
 *  손님이 다시 적게 하지 않는다. 우리가 이미 아는 것은 우리가 채운다. */
export async function todayFinishes() {
  const userId = me();
  if (!userId) return { count: 0, full: 0, names: [] };
  const { data, error } = await supabase.from('card_finishes')
    .select('done,kind,card_id,routine_id').eq('user_id', userId).eq('date', todayISO());
  if (error || !data) return { count: 0, full: 0, names: [] };
  const out = { count: data.length, full: data.filter((r) => r.done).length, names: [] };
  // 이름은 따로 읽는다 — 못 읽어도 횟수는 그대로 보여 준다
  try {
    const cardIds = [...new Set(data.map((r) => r.card_id).filter(Boolean))];
    const pliIds = [...new Set(data.map((r) => r.routine_id).filter(Boolean))];
    const one = (t) => String(t || '').replace(/\s*\n\s*/g, ' ').trim();
    const [cards, plis] = await Promise.all([
      cardIds.length ? supabase.from('quick_cards').select('id,thumb_text,title_z').in('id', cardIds) : { data: [] },
      pliIds.length ? supabase.from('routines').select('id,thumb_text,title_z').in('id', pliIds) : { data: [] },
    ]);
    const cardName = Object.fromEntries((cards.data || []).map((c) => [c.id, one(c.thumb_text || c.title_z)]));
    const pliName = Object.fromEntries((plis.data || []).map((c) => [c.id, one(c.title_z || c.thumb_text)]));
    // 한 차례대로, 같은 이름은 한 번만. 플리는 '플리'라고 붙여 동작과 가른다.
    const seen = new Set();
    data.forEach((r) => {
      const nm = r.card_id ? cardName[r.card_id] : (pliName[r.routine_id] ? `${pliName[r.routine_id]}(플리)` : '');
      if (nm && !seen.has(nm)) { seen.add(nm); out.names.push(nm); }
    });
  } catch { /* 이름 없이 횟수만 */ }
  return out;
}

// ── 추천 루틴(플리)의 수행 표시 ─────────────────────────────────
// 따라 하면 저절로 남는 기록에 더해, 영상 없이 한 날은 손님이 '했어요'를 눌러 남긴다.
// 직접 누른 것은 '끝까지 함(done) + 마친 동작 0(sets_done 0)'으로 담아, 저절로 남은 것과 가른다.

// 자동 기록을 꺼 둔 사람도 지난 기록은 보고, 직접 누른 것은 남길 수 있어야 한다
const myId = () => { try { return JSON.parse(localStorage.getItem('bmti_user') || 'null')?.id || null; } catch { return null; } };

/** from(날짜)부터 지금까지 플리를 한 기록 — [{ date, routine_id, done, manual }] */
export async function pliFinishesSince(fromISO) {
  const userId = myId();
  if (!userId) return [];
  const { data, error } = await supabase.from('card_finishes')
    .select('date,routine_id,done,sets_done').eq('user_id', userId).eq('kind', 'routine').gte('date', fromISO);
  if (error || !data) return [];
  return data.filter((r) => r.routine_id != null)
    .map((r) => ({ date: r.date, routine_id: r.routine_id, done: !!r.done, manual: !!r.done && Number(r.sets_done) === 0 }));
}

/** 오늘 이 플리를 '했어요'로 표시하거나 푼다. 되면 true */
export async function setPliChecked(routineId, on) {
  const userId = myId();
  if (!userId) return false;
  const q = supabase.from('card_finishes');
  const { error } = on
    ? await q.insert({ user_id: userId, date: todayISO(), kind: 'routine', routine_id: routineId, card_id: null, done: true, sets_done: 0 })
    : await q.delete().eq('user_id', userId).eq('date', todayISO()).eq('kind', 'routine').eq('routine_id', routineId).eq('done', true).eq('sets_done', 0);
  return !error;
}
