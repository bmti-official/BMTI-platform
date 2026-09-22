// 격자 위 갈래 고르개 — 둘러보기와 내 보관함이 함께 쓴다.
//
// 고른 자리에 연한 옐로우 판이 미끄러져 옮겨 간다. 테두리는 두지 않는다.
// 찾기는 줄을 밀어내지 않고 오른쪽에서 펼쳐져 그 자리를 덮는다.
import { useState } from 'react';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

const Glass = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" />
  </svg>
);

export default function PickRow({ tabs, value, onPick, q, onQ, findHint = '목, 폼롤러, 어깨…' }) {
  const [open, setOpen] = useState(false);
  const at = Math.max(0, tabs.findIndex(([k]) => k === value));
  const n = tabs.length;
  const canFind = !!onQ;

  return (
    <div style={{ position: 'relative', marginBottom: 8 }}>
      <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
        {/* 갈래 — 고른 자리로 판이 미끄러진다 */}
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
          <button type="button" onClick={() => setOpen(true)} aria-label="찾기"
            style={{ flex: '0 0 38px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: q ? YELLOW : 'transparent', color: q ? GOLD_INK : SUB,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Glass />
          </button>
        )}
      </div>

      {/* 찾기 — 오른쪽 끝에서 왼쪽으로 펼쳐지며 줄을 덮는다 */}
      {canFind && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', justifyContent: 'flex-end',
          pointerEvents: open ? 'auto' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden',
            width: open ? '100%' : 38, background: '#fff', borderRadius: 9,
            boxShadow: open ? `inset 0 0 0 1px ${LINE}` : 'none', padding: open ? '0 9px' : 0,
            opacity: open ? 1 : 0, transition: 'width .28s cubic-bezier(.3,1,.4,1), opacity .18s' }}>
            <span style={{ color: SUB, display: 'flex', flexShrink: 0 }}><Glass /></span>
            <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={findHint}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 12.5, fontFamily: 'inherit', color: INK }} />
            <button type="button" onClick={() => { setOpen(false); onQ(''); }} aria-label="찾기 닫기"
              style={{ flexShrink: 0, border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 800, color: SUB, padding: '0 2px' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
