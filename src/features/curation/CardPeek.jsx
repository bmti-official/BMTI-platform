// '일단 구경하기' — 바로플리에 담긴 동작을 옆으로 넘겨 가며 훑어본다.
// 뒤에 있는 표지는 그대로 두고, 그 위에 창만 띄운다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { withRoutineSetup } from './routineSetup';

const INK = '#1C1A17', SUB = '#8A8378';

export default function CardPeek({ cards = [], tone = 'z', bmtiCode, onClose }) {
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
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '58px 12px 12px',
        animation: 'peekIn .2s ease-out' }}>
      {/* 이전 — 플리 화면의 이전 버튼과 같은 자리·같은 모양. 창 위쪽에 따로 띄워 누르면 구경하기만 닫힌다 */}
      <button type="button" onClick={(e) => { e.stopPropagation(); if (onClose) onClose(); }} aria-label="이전"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, width: 38, height: 38, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.96)', boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
          fontSize: 20, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
        ‹
      </button>
      <style>{'@keyframes peekIn{from{opacity:0}to{opacity:1}}'
        + '@keyframes peekUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}'
        + '.peek-track{scrollbar-width:none}.peek-track::-webkit-scrollbar{display:none}'}</style>

      <div onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, height: '100%', display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
          animation: 'peekUp .24s cubic-bezier(.2,.8,.3,1)', fontFamily: "'Pretendard',-apple-system,sans-serif" }}>

        {/* 옆으로 한 장씩 착 붙게 넘어간다 */}
        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <div ref={trackRef} className="peek-track" onScroll={onScroll}
            style={{ display: 'flex', height: '100%', overflowX: 'auto', overflowY: 'hidden',
              scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {cards.map((c) => (
              <div key={c.id} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', overflow: 'hidden', padding: '10px 7px', boxSizing: 'border-box' }}>
                <FitCard>
                  <QuickCardView card={withRoutineSetup(c)} tone={tone} bmtiCode={bmtiCode} skipOpening flippable />
                </FitCard>
              </div>
            ))}
          </div>

          {/* 화살표 — 손가락이 없는 화면에서도 넘길 수 있게 */}
          {at > 0 && <Arrow dir="‹" side="left" onClick={() => go(-1)} />}
          {at < cards.length - 1 && <Arrow dir="›" side="right" onClick={() => go(1)} />}
        </div>

        {/* 발 — 점과 숫자로 어디쯤인지. 제목과 닫기(✕)는 두지 않는다(이전 버튼으로 닫는다) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '10px 0 12px' }}>
          {cards.length > 1 && (
            <span style={{ display: 'flex', gap: 5 }}>
              {cards.map((c, i) => (
                <span key={c.id} style={{ width: i === at ? 16 : 6, height: 6, borderRadius: 999,
                  background: i === at ? INK : '#DCD6CC', transition: 'width .2s, background .2s' }} />
              ))}
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 800, color: SUB, fontVariantNumeric: 'tabular-nums' }}>
            {Math.min(at + 1, cards.length)} / {cards.length}
          </span>
        </div>
      </div>
    </div>
  );
}

// 한 장이 창보다 길면 줄여 주되, 너무 작아지면 글씨가 안 보인다.
// 그래서 0.86배까지만 줄이고, 그래도 남는 만큼은 살짝 내려 보게 둔다.
// 가로세로를 같은 배율로 줄이므로 표지 비율은 그대로다.
function FitCard({ children }) {
  const boxRef = useRef(null);
  const inRef = useRef(null);
  const [size, setSize] = useState({ h: 0, room: 0 });

  useEffect(() => {
    const box = boxRef.current, inner = inRef.current;
    if (!box || !inner) return undefined;
    const read = () => {
      const h = inner.offsetHeight, room = box.clientHeight;
      if (!h || !room) return;
      setSize((p) => (p.h === h && p.room === room ? p : { h, room }));
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(inner);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

  const { h, room } = size;
  const snug = h && room ? room / h : 1;             // 딱 맞게 줄였을 때
  const loose = h && room ? (room * 1.25) / h : 1;   // 한 뼘쯤 내려 보기로 하고 덜 줄였을 때
  const k = Math.min(1, Math.max(snug, Math.min(0.86, loose)));

  return (
    <div ref={boxRef} className="peek-track" style={{ height: '100%', overflowX: 'hidden', overflowY: 'auto' }}>
      {/* 줄인 만큼만 자리를 차지하게 — 안 그러면 빈 곳까지 내려가진다 */}
      <div style={{ height: h ? Math.round(h * k) : 'auto' }}>
        <div ref={inRef} style={{ width: '100%', transform: `scale(${k})`, transformOrigin: 'top center' }}>
          {children}
        </div>
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
