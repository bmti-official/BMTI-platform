// '일단 구경하기' — 바로플리에 담긴 동작을 옆으로 넘겨 가며 훑어본다.
// 뒤에 있는 표지는 그대로 두고, 그 위에 창만 띄운다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { withRoutineSetup } from './routineSetup';

const INK = '#1C1A17', SUB = '#8A8378';

export default function CardPeek({ title = '담긴 동작', cards = [], tone = 'z', bmtiCode, onClose }) {
  const trackRef = useRef(null);
  const [at, setAt] = useState(0);

  // 창이 떠 있는 동안 뒤쪽은 움직이지 않는다. 뒤로 가기(ESC)로도 닫힌다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  // 지금 몇 번째를 보고 있는지 — 넘긴 만큼 세어 둔다.
  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    setAt(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (d) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: (at + d) * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(23,21,15,0.46)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
        animation: 'peekIn .2s ease-out' }}>
      <style>{'@keyframes peekIn{from{opacity:0}to{opacity:1}}'
        + '@keyframes peekUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
        + '.peek-track{scrollbar-width:none}.peek-track::-webkit-scrollbar{display:none}'}</style>

      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 420, maxHeight: '90%', display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          animation: 'peekUp .24s cubic-bezier(.2,.8,.3,1)', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>

        {/* 머리 — 몇 번째인지 늘 보이게 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderBottom: '1px solid #EDE9E2' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800, color: INK,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: SUB, fontVariantNumeric: 'tabular-nums' }}>
            {Math.min(at + 1, cards.length)} / {cards.length}
          </span>
          <button type="button" onClick={onClose} aria-label="닫기"
            style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F4F1EB',
              fontSize: 15, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>✕</button>
        </div>

        {/* 옆으로 한 장씩 착 붙게 넘어간다 */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div ref={trackRef} className="peek-track" onScroll={onScroll}
            style={{ display: 'flex', height: '100%', overflowX: 'auto', overflowY: 'hidden',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {cards.map((c) => (
              <div key={c.id} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', overflowY: 'auto', padding: 14, boxSizing: 'border-box' }}>
                <QuickCardView card={withRoutineSetup(c)} tone={tone} bmtiCode={bmtiCode} skipOpening />
              </div>
            ))}
          </div>

          {/* 화살표 — 손가락이 없는 화면에서도 넘길 수 있게 */}
          {at > 0 && <Arrow dir="‹" side="left" onClick={() => go(-1)} />}
          {at < cards.length - 1 && <Arrow dir="›" side="right" onClick={() => go(1)} />}
        </div>

        {/* 발 — 점으로 어디쯤인지 */}
        {cards.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 12px' }}>
            {cards.map((c, i) => (
              <span key={c.id} style={{ width: i === at ? 16 : 6, height: 6, borderRadius: 999,
                background: i === at ? INK : '#DCD6CC', transition: 'width .2s, background .2s' }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Arrow({ dir, side, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={side === 'left' ? '이전 동작' : '다음 동작'}
      style={{ position: 'absolute', top: '50%', [side]: 8, transform: 'translateY(-50%)', width: 32, height: 32,
        borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: '0 2px 10px rgba(0,0,0,0.16)',
        fontSize: 17, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
      {dir}
    </button>
  );
}
