// 격자 위 갈래 고르개 — 둘러보기와 내 보관함이 함께 쓴다.
//
// 고른 자리에 연한 옐로우 판이 미끄러져 옮겨 간다. 테두리는 두지 않는다.
// 돋보기를 누르면 갈래 줄 '위'로 찾기 칸이, '아래'로 부위 묶음 버튼이 천천히 펼쳐진다.
// 갈래 줄은 그대로 남아, 갈래를 고른 채로(바꿔 가며) 찾을 수 있다.
import { useEffect, useRef, useState } from 'react';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const EASE = 'cubic-bezier(.5,.05,.3,1)';

const Glass = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
  </svg>
);

// groups: 부위 묶음 버튼 [[id, 이름]…] · group: 고른 묶음 · onGroup: 고르면 불린다
export default function PickRow({ tabs, value, onPick, q, onQ, findHint = '거북목, 폼롤러, 어깨 마사지…',
  groups = null, group = 'all', onGroup = null }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const at = Math.max(0, tabs.findIndex(([k]) => k === value));
  const n = tabs.length;
  const canFind = !!onQ;
  const hasPills = canFind && !!groups && !!onGroup;
  const filtering = !!q || (hasPills && group !== 'all');

  // 열리면 바로 칠 수 있게 — 펼쳐지는 움직임이 끝난 뒤에 커서를 둔다
  useEffect(() => {
    if (!open) return undefined;
    const t = setTimeout(() => { try { inputRef.current?.focus({ preventScroll: true }); } catch { /* 무시 */ } }, 240);
    return () => clearTimeout(t);
  }, [open]);

  // 찾기를 연 채로 화면을 아래로 내리면 찾기 칸과 부위 버튼을 접는다(갈래 줄만 남는다).
  // 찾던 말과 고른 부위는 그대로 둔다 — 내리던 목록이 갑자기 바뀌면 안 된다. 돋보기가 노랗게 남아 '찾는 중'임을 알린다.
  useEffect(() => {
    if (!open) return undefined;
    const base = new Map();   // 스크롤되는 칸마다 처음 자리
    const topOf = (t) => (t === document || t === window || !t ? (window.scrollY || 0) : (t.scrollTop || 0));
    base.set(document, window.scrollY || 0);
    const onScroll = (e) => {
      const t = e.target || document;
      const now = topOf(t);
      if (!base.has(t)) { base.set(t, now); return; }
      if (now - base.get(t) > 40) { setOpen(false); try { inputRef.current?.blur(); } catch { /* 무시 */ } }
      else if (now < base.get(t)) base.set(t, now);   // 위로 올라간 만큼은 기준을 따라 올린다
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open]);

  const close = () => { setOpen(false); onQ(''); if (onGroup) onGroup('all'); };
  const groupAt = hasPills ? Math.max(0, groups.findIndex(([id]) => id === group)) : 0;

  return (
    <div style={{ marginBottom: 8 }}>
      {/* 찾기 칸 — 갈래 줄 위로 펼쳐진다 */}
      {canFind && (
        <div aria-hidden={!open}
          style={{ overflow: 'hidden', maxHeight: open ? 36 : 0, opacity: open ? 1 : 0, marginBottom: open ? 6 : 0,
            transition: `max-height .6s ${EASE}, opacity .45s ease .06s, margin-bottom .6s ${EASE}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 34, margin: 1, background: '#fff', borderRadius: 9,
            boxShadow: `inset 0 0 0 1px ${LINE}`, padding: '0 9px' }}>
            <span style={{ color: SUB, display: 'flex', flexShrink: 0 }}><Glass /></span>
            <input ref={inputRef} value={q} onChange={(e) => onQ(e.target.value)} placeholder={findHint}
              enterKeyHint="search" tabIndex={open ? 0 : -1}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 12.5, fontFamily: 'inherit', color: INK }} />
            <button type="button" onClick={close} aria-label="찾기 닫기" tabIndex={open ? 0 : -1}
              style={{ flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: SUB, padding: '0 2px' }}>✕</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
        {/* 갈래 — 고른 자리로 판이 미끄러진다. 찾는 중에도 그대로 누를 수 있다 */}
        <div style={{ position: 'relative', flex: 1, minWidth: 0, display: 'flex' }}>
          <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${100 / n}%`,
            transform: `translateX(${at * 100}%)`, background: YELLOW, borderRadius: 9,
            transition: 'transform .26s cubic-bezier(.34,1.4,.5,1)' }} />
          {tabs.map(([k, lb]) => (
            <button key={k} type="button" onClick={() => onPick(k)}
              style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, padding: '6px 0', borderRadius: 9,
                border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
                color: value === k ? GOLD_INK : SUB, transition: 'color .2s' }}>
              {lb}
            </button>
          ))}
        </div>

        {canFind && (
          <button type="button" onClick={() => setOpen((o) => !o)} aria-label="찾기" aria-expanded={open}
            style={{ flex: '0 0 38px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: filtering || open ? YELLOW : 'transparent', color: filtering || open ? GOLD_INK : SUB,
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color .2s, color .2s' }}>
            <Glass />
          </button>
        )}
      </div>

      {/* 부위 묶음 버튼 — 찾기를 열면 아래로 천천히 내려온다 */}
      {hasPills && (
        <div aria-hidden={!open}
          style={{ overflow: 'hidden', maxHeight: open ? 32 : 0, opacity: open ? 1 : 0, marginTop: open ? 6 : 0,
            transition: `max-height .95s ${EASE}, opacity .8s ease .12s, margin-top .95s ${EASE}` }}>
          <div style={{ position: 'relative', display: 'flex', transform: open ? 'none' : 'translateY(-8px)',
            transition: `transform .95s ${EASE}` }}>
            {/* 위 갈래 줄과 같은 모양 — 고른 자리로 연한 옐로우 판이 미끄러진다 */}
            <span aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${100 / groups.length}%`,
              transform: `translateX(${groupAt * 100}%)`, background: YELLOW, borderRadius: 9,
              transition: 'transform .26s cubic-bezier(.34,1.4,.5,1)' }} />
            {groups.map(([id, lb]) => {
              const on = group === id;
              return (
                <button key={id} type="button" onClick={() => onGroup(on && id !== 'all' ? 'all' : id)} tabIndex={open ? 0 : -1}
                  aria-pressed={on}
                  style={{ position: 'relative', zIndex: 1, flex: 1, minWidth: 0, padding: '6px 0', borderRadius: 9, border: 'none',
                    background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 800,
                    whiteSpace: 'nowrap', letterSpacing: '-0.02em', color: on ? GOLD_INK : SUB, transition: 'color .2s' }}>
                  {lb}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
