// 바로카드 한 장을 눌렀을 때 — 인스타처럼 화면이 커지며 펼쳐지고,
// 아래로 밀면 다음 동작이 이어진다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { withRoutineSetup } from './routineSetup';

const SUB = '#8A8378';

export default function CardFeed({ cards = [], startId, tone = 'z', bmtiCode, origin, onClose }) {
  const boxRef = useRef(null);
  const rootRef = useRef(null);
  const first = useRef(true);
  // 커지는 동안에는 누른 카드 한 장만 올려 둔다.
  // 여러 장을 한꺼번에 띄우면 영상이 같이 깨어나 움직임이 뚝뚝 끊긴다.
  const [wide, setWide] = useState(false);
  const at = Math.max(0, cards.findIndex((c) => c.id === startId));
  // 따라하기를 시작하면 그 카드 한 장만 남긴다 — 위아래로 다른 카드가 끼어들지 않게
  const [solo, setSolo] = useState(null);
  const shown = solo ? cards.filter((c) => c.id === solo) : wide ? cards : cards.slice(at, at + 1);

  // 누른 썸네일 자리에서 그대로 커지게 — 인스타처럼.
  // 누른 칸과 펼쳐진 화면의 자리를 재서 그 차이만큼만 움직인다.
  // 가로세로를 따로 늘리면 글씨가 눌린 채 끌려오므로 한 배율로만 키운다.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const open = () => setWide(true);
    if (!origin || !origin.width || !origin.height) {
      root.style.opacity = '0';
      requestAnimationFrame(() => {
        root.style.transition = 'opacity .2s ease';
        root.style.opacity = '1';
      });
      const t = setTimeout(open, 220);
      return () => clearTimeout(t);
    }
    const box = root.getBoundingClientRect();
    const s0 = origin.width / box.width;
    const tx = origin.left - box.left, ty = origin.top - box.top;
    root.style.transformOrigin = 'top left';
    root.style.willChange = 'transform, opacity';
    root.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${s0})`;
    root.style.opacity = '0';
    let timer = 0;
    // 한 박자 쉬었다 움직여야 첫 장이 다 그려진 뒤에 출발한다.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => {
      root.style.transition = 'transform .38s cubic-bezier(.22,.7,.3,1), opacity .18s ease-out';
      root.style.transform = 'translate3d(0, 0, 0) scale(1)';
      root.style.opacity = '1';
      timer = setTimeout(() => { root.style.willChange = 'auto'; open(); }, 380);
    }));
    return () => { cancelAnimationFrame(id); clearTimeout(timer); };
  }, [origin]);

  // 누른 카드부터 보여 준다 — 그 자리에서 커진 것처럼.
  useEffect(() => {
    if (!first.current) return;
    first.current = false;
    const box = boxRef.current;
    if (!box) return;
    if (!wide) return;
    first.current = false;
    const el = box.children[at];
    if (el) box.scrollTop = el.offsetTop;
  }, [wide, at]);

  // 뒤로 가기로 닫히게 — 창이 떠 있는 동안 바깥은 스크롤되지 않는다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  return (
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 70, background: '#fff', contain: 'paint' }}>

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
        {shown.map((c) => (
          <div key={c.id} style={{ scrollSnapAlign: 'start', minHeight: '100%', padding: '56px 14px 24px', boxSizing: 'border-box' }}>
            <QuickCardView card={withRoutineSetup(c)} tone={tone} bmtiCode={bmtiCode}
              flippable fullOnStart onStart={() => setSolo(c.id)} />
          </div>
        ))}
        {wide && !solo && (
          <div style={{ padding: '18px 14px 40px', textAlign: 'center', fontSize: 12.5, color: SUB, fontWeight: 700 }}>
            마지막이에요. 위로 밀면 다시 볼 수 있어요.
          </div>
        )}
      </div>
      <style>{'.card-feed{scrollbar-width:none}.card-feed::-webkit-scrollbar{display:none}'}</style>
    </div>
  );
}
