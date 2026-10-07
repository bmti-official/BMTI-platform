// 읽을거리 카드뉴스 — 사진 위에 글을 얹어 옆으로 넘겨 본다.
//
// 같은 사진에서 다음 장으로 갈 때는 **사진을 밀지 않는다.**
// 똑같은 사진이 빠지고 똑같은 사진이 들어오면 고장 난 것처럼 보인다.
// 사진은 가만히 두고 글만 바꾼다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { flatten } from './newsSlides';
import { useKeep, useViewMark } from './keep';

const INK = '#1C1A17', SUB = '#8A8378';

const KEY = (id) => `bmti_news_at_${id}`;

export default function NewsCard({ item, slides = [], tone = 'z', onClose, tail = null }) {
  const cards = useMemo(() => flatten(slides), [slides]);
  const keep = useKeep('curation', item?.id);
  const seenRef = useViewMark('curation', item?.id);
  const [at, setAt] = useState(() => {
    // 읽다 나갔으면 그 자리부터. 다 읽었으면 처음부터.
    try {
      const n = Number(localStorage.getItem(KEY(item?.id)));
      return Number.isFinite(n) && n > 0 && n < cards.length ? n : 0;
    } catch { return 0; }
  });

  useEffect(() => {
    try { localStorage.setItem(KEY(item?.id), String(at)); } catch { /* 저장 못 해도 읽는 데는 지장 없다 */ }
  }, [at, item?.id]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const key = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
      if (e.key === 'ArrowRight') setAt((n) => Math.min(cards.length - 1, n + 1));
      if (e.key === 'ArrowLeft') setAt((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [onClose, cards.length]);

  // 손가락으로 밀어 넘기기
  const swipe = useRef({ x: 0, on: false });
  const onDown = (e) => { swipe.current = { x: e.clientX, on: true }; };
  const onUp = (e) => {
    if (!swipe.current.on) return;
    const dx = e.clientX - swipe.current.x;
    swipe.current.on = false;
    if (Math.abs(dx) < 42) return;
    setAt((n) => Math.max(0, Math.min(cards.length - 1, n + (dx < 0 ? 1 : -1))));
  };

  if (cards.length === 0) return null;
  const now = cards[at];
  const last = at >= cards.length - 1;

  return (
    <div ref={seenRef} style={{ position: 'fixed', inset: 0, zIndex: 72, background: '#fff', contain: 'paint',
      display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}
      onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={() => { swipe.current.on = false; }}>

      {/* 머리 — 어디쯤 왔는지 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px' }}>
        <button type="button" onClick={onClose} aria-label="닫기"
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F4F1EB',
            fontSize: 17, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>‹</button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 800,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(tone === 'm' ? item?.title_m : item?.title_z) || item?.thumb_text || '읽을거리'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: SUB, fontVariantNumeric: 'tabular-nums' }}>
          {at + 1} / {cards.length}
        </span>
        {keep && (
          <button type="button" onClick={keep.toggle} aria-pressed={keep.saved}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit', borderRadius: 14,
              border: 'none', cursor: 'pointer', background: '#FDF2CE', color: '#6E5A1C', whiteSpace: 'nowrap' }}>
            {keep.saved ? '보관됨 ✓' : '보관'}
          </button>
        )}
      </div>

      {/* 어디까지 읽었는지 — 칸이 채워진다 */}
      <div style={{ display: 'flex', gap: 2, padding: '0 14px 10px' }}>
        {cards.map((c, i) => (
          <span key={i} style={{ flex: 1, height: 3, borderRadius: 999,
            background: i <= at ? INK : '#E6E1D8', transition: 'background .2s' }} />
        ))}
      </div>

      {/* 사진 + 글 */}
      <div style={{ flex: 1, minHeight: 0, padding: '0 14px 14px' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 16, overflow: 'hidden', background: '#EDE9E2' }}>
          {now.image
            ? <img key={now.image} src={now.image} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: SUB, fontWeight: 700 }}>사진 없음</div>}

          {/* 글 — 아래 띠에 그라데이션을 깔고 얹는다. 사진이 복잡해도 읽힌다. */}
          {now.text && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: `${Math.max(0, now.y - 46)}%`,
              background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.62) 52%, rgba(0,0,0,0.78) 100%)',
              pointerEvents: 'none' }} />
          )}
          {now.text && (
            <div style={{ position: 'absolute', left: 18, right: 18, bottom: `${100 - now.y}%`, pointerEvents: 'none' }}>
              {/* 사진이 그대로인 장은 글만 갈아 끼운다 */}
              <span key={`${now.gi}-${at}`} style={{ display: 'block', fontSize: 15.5, fontWeight: 700, color: '#fff',
                lineHeight: 1.7, letterSpacing: '-0.01em', wordBreak: 'keep-all', whiteSpace: 'pre-line',
                textShadow: '0 1px 8px rgba(0,0,0,0.4)', animation: 'newsText .28s ease-out' }}>
                {now.text}
              </span>
              <style>{'@keyframes newsText{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}'}</style>
            </div>
          )}

          {/* 좌우 화살표 — 손가락이 없는 화면에서도 */}
          {at > 0 && <Arrow dir="‹" side="left" onClick={() => setAt((n) => n - 1)} />}
          {!last && <Arrow dir="›" side="right" onClick={() => setAt((n) => n + 1)} />}
        </div>
      </div>

      {/* 마지막 장 — 함께 해 볼 바디플리 자리 */}
      {last && tail && <div style={{ padding: '0 14px 18px' }}>{tail}</div>}
    </div>
  );
}

function Arrow({ dir, side, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label={side === 'left' ? '이전 장' : '다음 장'}
      style={{ position: 'absolute', top: '50%', [side]: 10, transform: 'translateY(-50%)', width: 34, height: 34,
        borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontSize: 18, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>
      {dir}
    </button>
  );
}
