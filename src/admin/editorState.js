// 편집 화면이 함께 쓰는 규칙과 저장 장치 — 화면 부품은 editorBits.jsx에 있다.
import { useEffect, useRef, useState } from 'react';

// AI가 '내가 준 정보에 없다'고 스스로 표시한 자리. 공개 전에 지워야 한다.
export const NEEDS_CHECK = '〔확인 필요〕';
export const countNeedsCheck = (f) =>
  Object.values(f || {}).filter((v) => typeof v === 'string' && v.includes(NEEDS_CHECK)).length;

// ── 자동 임시저장 ────────────────────────────────────────────
const key = (prefix, row) => `bmti_admin_draft_${prefix}_${row?.id || 'new'}`;

/** 편집을 시작할 때, 저장 안 하고 나간 내용이 있으면 물어보고 이어 쓴다. */
export function withDraft(base, prefix, row) {
  try {
    const raw = localStorage.getItem(key(prefix, row));
    if (raw) {
      const d = JSON.parse(raw);
      if (d?.at && d?.form && window.confirm(`저장하지 않고 나간 내용이 있어요 (${new Date(d.at).toLocaleString('ko-KR')}).\n이어서 쓸까요?\n\n취소를 누르면 그 내용은 버립니다.`)) {
        return { ...base, ...d.form };
      }
      localStorage.removeItem(key(prefix, row));
    }
  } catch { /* 브라우저가 막아 두었으면 그냥 넘어간다 */ }
  return base;
}

/** 고칠 때마다 1.5초 뒤에 브라우저에 조용히 담아 둔다. */
export function useAutoDraft(prefix, row, f) {
  const [at, setAt] = useState(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => {
      try {
        const now = Date.now();
        localStorage.setItem(key(prefix, row), JSON.stringify({ at: now, form: f }));
        setAt(now);
      } catch { /* 담아 둘 수 없으면 그냥 넘어간다 */ }
    }, 1500);
    return () => clearTimeout(t);
  }, [prefix, row, f]);
  return at;
}

export function dropDraft(prefix, id) {
  try { localStorage.removeItem(`bmti_admin_draft_${prefix}_${id || 'new'}`); } catch { /* 무시 */ }
}

