// 목록에서 차례를 바꾸거나 줄을 본떠 만드는 일 — 화면 부품이 아니라 순수 함수다.
import { supabase } from '../lib/supabaseClient';

/**
 * 목록에서 한 칸 위/아래로 옮긴다.
 * 정렬 순서가 다 0이면 자리를 가릴 수 없으니, 먼저 0·10·20…으로 매겨 놓고 맞바꾼다.
 */
export async function moveRow(table, rows, index, dir) {
  const next = index + dir;
  if (next < 0 || next >= rows.length) return null;
  const a = rows[index], b = rows[next];
  const same = rows.every((r, i) => Number(r.sort_order) === Number(rows[0].sort_order) || i === 0);
  if (same || Number(a.sort_order) === Number(b.sort_order)) {
    // 통째로 다시 매긴 다음 맞바꾼다
    const order = rows.map((r, i) => ({ id: r.id, sort_order: i * 10 }));
    const swapped = order.map((o, i) => (i === index ? { ...o, sort_order: next * 10 }
      : i === next ? { ...o, sort_order: index * 10 } : o));
    for (const o of swapped) {
      const { error } = await supabase.from(table).update({ sort_order: o.sort_order }).eq('id', o.id);
      if (error) return error.message;
    }
    return null;
  }
  const e1 = await supabase.from(table).update({ sort_order: b.sort_order }).eq('id', a.id);
  if (e1.error) return e1.error.message;
  const e2 = await supabase.from(table).update({ sort_order: a.sort_order }).eq('id', b.id);
  return e2.error ? e2.error.message : null;
}

/** 이 줄을 본떠 새 줄을 만든다. 늘 비공개로 들어간다. */
export async function duplicateRow(table, row, drop = []) {
  const copy = { ...row };
  ['id', 'created_at', 'updated_at', 'view_count', 'save_count', 'finish_count', 'start_count', ...drop]
    .forEach((k) => delete copy[k]);
  copy.published = false;
  copy.sort_order = (Number(row.sort_order) || 0) + 1;
  const { data, error } = await supabase.from(table).insert(copy).select('id').single();
  return error ? { err: error.message } : { id: data.id };
}
