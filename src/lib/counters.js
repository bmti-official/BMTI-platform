// 조회수 — 서버의 bump_counter(01_curation.sql)로 1씩 올린다.
// 시작·완주 수는 초기엔 뜻이 없어 올리지 않는다(완주는 행동 기록 card_done·pli_done 으로 관리자 통계에서 본다).
// 저장수는 보관함(saved_items)에 담기고 빠질 때 서버가 스스로 센다(57_counts_poster.sql).
//
// 조회는 같은 창(탭)에서 같은 콘텐츠를 여러 번 봐도 서버에 한 번만 알리고,
// 서버는 같은 사람·같은 콘텐츠를 하루에 한 번만 센다.
// 관리자 미리보기에서 본 것은 세지 않는다.
import { supabase } from './supabaseClient';

const PREVIEW = (() => { try { return /admin/.test(window.location.pathname); } catch { return false; } })();
const TABLE = { card: 'quick_cards', routine: 'routines', curation: 'curation_items' };
const SEEN = 'bmti_seen_views';

/** 조회 — 이 창에서 처음 볼 때만 서버에 알린다.
 *  서버는 같은 사람·같은 콘텐츠를 하루에 한 번만 센다(61_view_once_a_day.sql).
 *  실제로 셌을 때만 onCounted 를 부른다 — 화면 숫자가 서버 숫자와 어긋나지 않게. */
export function viewOnce(type, id, onCounted) {
  const table = TABLE[type];
  if (PREVIEW || !table || id == null || !Number.isFinite(Number(id))) return;
  const k = `${type}:${id}`;
  try {
    const seen = new Set(JSON.parse(sessionStorage.getItem(SEEN) || '[]'));
    if (seen.has(k)) return;
    seen.add(k);
    sessionStorage.setItem(SEEN, JSON.stringify([...seen].slice(-300)));
  } catch { /* 저장 못 해도 서버가 하루 한 번으로 거른다 */ }
  supabase.rpc('bump_counter', { p_table: table, p_id: Number(id), p_field: 'view_count' })
    .then(({ data }) => { if (data === true && onCounted) onCounted(); }, () => {});
}
