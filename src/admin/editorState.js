// 편집 화면이 함께 쓰는 규칙과 저장 장치 — 화면 부품은 editorBits.jsx에 있다.
import { useEffect, useRef, useState } from 'react';

// 글에 칠할 수 있는 표시 두 가지
//   ==글==  연보라 형광펜  ·  __글__  연보라 글씨
export const MARKS = [
  { wrap: '==', label: '형광펜', bg: '#E7E0F7', fg: '#4A3F7A', line: '#D6CCF0' },
  { wrap: '__', label: '보라 글씨', bg: '#fff', fg: '#7E6FC9', line: '#D6CCF0' },
];

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


// ── 저장했다는 알림 ──────────────────────────────────────────
// 저장 버튼을 누르면 화면이 닫히기만 해서 "된 건가?" 싶었다.
// 목록 위에 잠깐 떴다 사라지는 한 줄을 띄운다.
export function useSavedNote(sec = 3) {
  const [note, setNote] = useState('');
  useEffect(() => {
    if (!note) return undefined;
    const t = setTimeout(() => setNote(''), sec * 1000);
    return () => clearTimeout(t);
  }, [note, sec]);
  return [note, setNote];
}

// ── 공개 전 검사 ────────────────────────────────────────────
// 알맹이가 빠진 채로 공개되면 손님 화면에 '동작 영상 없음' 같은 게 그대로 뜬다.
// 비공개로 저장하는 건 언제나 되고, 공개로 돌릴 때만 막는다.
const has = (v) => typeof v === 'string' && v.trim().length > 0;

/** 공개하기 전에 비어 있으면 안 되는 칸들. 비어 있는 것들의 이름을 돌려준다. */
export function missingForPublish(kind, f) {
  const out = [];
  if (kind === 'curation') {
    if (!has(f.cover_url)) out.push('대표 이미지');
    if (!has(f.thumb_text)) out.push('썸네일 문구');
  }
  if (kind === 'card') {
    if (!has(f.video_url)) out.push('동작 영상');
    if (!has(f.thumb_text)) out.push('동작 이름');
    if (!(Number(f.duration_sec) > 0)) out.push('동작 한 번 길이');
  }
  if (kind === 'routine') {
    if (!(Number(f.cardCount) > 0)) out.push('담긴 동작');
  }
  return out;
}
