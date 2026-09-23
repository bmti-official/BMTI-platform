// 바로카드·바로플리를 끝냈을 때 남기는 기록.
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

/** 오늘 몇 번 했는지 — 일기를 열 때 '오늘 두 번 하셨네요'로 쓴다. */
export async function todayFinishes() {
  const userId = me();
  if (!userId) return { count: 0, full: 0 };
  const { data, error } = await supabase.from('card_finishes')
    .select('done').eq('user_id', userId).eq('date', todayISO());
  if (error || !data) return { count: 0, full: 0 };
  return { count: data.length, full: data.filter((r) => r.done).length };
}
