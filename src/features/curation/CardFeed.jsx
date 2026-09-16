// 바로카드 한 장을 눌렀을 때 — 인스타처럼 화면이 커지며 펼쳐지고,
// 아래로 밀면 다음 동작이 이어진다.
import { useEffect, useRef } from 'react';
import QuickCardView from './QuickCardView';

const SUB = '#8A8378';

export default function CardFeed({ cards = [], startId, tone = 'z', bmtiCode, onClose }) {
  const boxRef = useRef(null);
  const first = useRef(true);

  // 누른 카드부터 보여 준다 — 그 자리에서 커진 것처럼.
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const box = boxRef.current;
    if (!box) return;
    const i = Math.max(0, cards.findIndex((c) => c.id === startId));
    const el = box.children[i];
    if (el) box.scrollTop = el.offsetTop;
  }, [cards, startId]);

  // 뒤로 가기로 닫히게 — 창이 떠 있는 동안 바깥은 스크롤되지 않는다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', animation: 'cardGrow .26s cubic-bezier(.2,.8,.3,1)' }}>
      <style>{'@keyframes cardGrow{from{opacity:.4;transform:scale(.88)}to{opacity:1;transform:scale(1)}}'}</style>

      {/* 닫기 — 늘 같은 자리에 */}
      <button type="button" onClick={onClose} aria-label="닫기"
        style={{ position: 'absolute', top: 12, left: 12, zIndex: 3, width: 38, height: 38, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
          fontSize: 20, fontWeight: 800, color: '#1C1A17', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
        ‹
      </button>

      {/* 한 장씩 착 붙는 세로 스크롤 */}
      <div ref={boxRef} className="card-feed"
        style={{ height: '100%', overflowY: 'auto', scrollSnapType: 'y mandatory', WebkitOverflowScrolling: 'touch' }}>
        {cards.map((c) => (
          <div key={c.id} style={{ scrollSnapAlign: 'start', minHeight: '100%', padding: '56px 14px 24px', boxSizing: 'border-box' }}>
            <QuickCardView card={c} tone={tone} bmtiCode={bmtiCode} />
          </div>
        ))}
        <div style={{ padding: '18px 14px 40px', textAlign: 'center', fontSize: 12.5, color: SUB, fontWeight: 700 }}>
          마지막이에요. 위로 밀면 다시 볼 수 있어요.
        </div>
      </div>
      <style>{'.card-feed{scrollbar-width:none}.card-feed::-webkit-scrollbar{display:none}'}</style>
    </div>
  );
}
