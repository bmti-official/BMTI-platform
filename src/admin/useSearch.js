// 목록에서 찾기 — 적은 말이 들어 있는 줄만 남긴다.
import { useMemo, useState } from 'react';

/** 적은 말이 들어 있는 줄만 남긴다. 여러 칸을 한꺼번에 훑는다. */
export function useSearch(rows, fields) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) => fields.some((f) => String(typeof f === 'function' ? f(r) : r[f] || '').toLowerCase().includes(k)));
  }, [rows, q, fields]);
  return [shown, q, setQ];
}
