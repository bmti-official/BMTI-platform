// 바로플리 한 칸을 눌렀을 때 — 한 편씩 넘겨 보며 고른다.
// 썸네일을 누르자마자 재생이 시작되면 무엇이 담겼는지 볼 새가 없다.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import RoutineView from './RoutineView';
import RoutinePlayer from './RoutinePlayer';
import { CHARACTERS } from '../../data';

const SUB = '#8A8378';
// 격자와 같은 너비 — 넓은 화면에서도 격자 폭(560 안쪽 528)을 넘지 않게 가운데에 둔다
const COL = 528, PAD = 16;

function charProps(r, tone) {
  const codes = ((tone === 'm' ? r?.chars_m : r?.chars_z) || []).filter(Boolean);
  return { charCodes: codes, charImages: codes.map((id) => CHARACTERS.find((c) => c.id === id)?.image).filter(Boolean) };
}

export default function PliFeed({ plis = [], startId, tone = 'z', bmtiCode, onClose }) {
  const boxRef = useRef(null);
  const listRef = useRef(null);
  const first = useRef(true);
  const [playing, setPlaying] = useState(null);

  // 누른 플리부터 보여 준다. 화면에 그리기 전에 옮겨, 첫 플리가 잠깐 보였다 넘어가지 않게 한다.
  useLayoutEffect(() => {
    if (!first.current) return;
    const box = boxRef.current, list = listRef.current;
    if (!box || !list) return;
    first.current = false;
    // 글은 한 겹 안쪽에 있다. 스크롤 칸의 자식이 아니라 목록의 자식을 찾아야 한다.
    const i = Math.max(0, plis.findIndex((r) => r.id === startId));
    const el = list.children[i];
    // 닫기 버튼(위 56) 아래에서 시작하게 — 버튼이 카드 왼쪽 위 글씨를 가리지 않도록
    if (el) box.scrollTop = el.offsetTop - 56;
  }, [plis, startId]);

  // 뒤로 가기로 닫히게 — 창이 떠 있는 동안 바깥은 스크롤되지 않는다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', contain: 'paint',
      fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <button type="button" onClick={onClose} aria-label="닫기"
        style={{ position: 'absolute', top: 12, left: `max(12px, calc(50% - ${COL / 2 + 4}px))`, zIndex: 3, width: 38, height: 38, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
          fontSize: 20, fontWeight: 800, color: '#1C1A17', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
        ‹
      </button>

      <div ref={boxRef} className="pli-feed"
        style={{ height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: `56px ${PAD}px 24px`, boxSizing: 'border-box' }}>
        <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: COL, margin: '0 auto' }}>
          {plis.map((r) => (
            <RoutineView key={r.id} routine={r} cards={r.cards || []} tone={tone} bmtiCode={bmtiCode}
              onStart={() => setPlaying(r)} {...charProps(r, tone)} />
          ))}
        </div>
        <div style={{ padding: '18px 0 40px', textAlign: 'center', fontSize: 12.5, color: SUB, fontWeight: 700 }}>
          마지막이에요. 위로 밀면 다시 볼 수 있어요.
        </div>
      </div>
      <style>{'.pli-feed{scrollbar-width:none}.pli-feed::-webkit-scrollbar{display:none}'}</style>

      {playing && (
        <RoutinePlayer routine={playing} cards={playing.cards || []} tone={tone} bmtiCode={bmtiCode}
          onClose={() => setPlaying(null)} />
      )}
    </div>
  );
}
