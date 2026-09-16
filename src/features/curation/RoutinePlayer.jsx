// 바로플리 재생 — 담긴 동작을 차례로 이어서 한다.
// 배경음악이 처음부터 끝까지 깔리고, 멘트가 흐를 땐 저절로 작아진다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { loadVoiceAssets, voiceKey, bgmNoFor, BGM_GROUPS } from './voiceCommon';
import { pickCardTone, pickRoutineTone } from './format';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const SET_BG = '#FBF4DE', SET_INK = '#6E5A1C';
const LOUD = 0.34;   // 음악 크기
const DUCK = 0.12;   // 멘트가 흐를 때 낮추는 크기

export default function RoutinePlayer({ routine, cards = [], tone = 'z', bmtiCode, onClose, onDone }) {
  const [at, setAt] = useState(0);            // 몇 번째 동작인가
  const [common, setCommon] = useState({});
  const [bgmNo, setBgmNo] = useState(() => bgmNoFor(bmtiCode));
  const [musicOn, setMusicOn] = useState(true);
  const musicRef = useRef(null);
  const card = cards[at];

  useEffect(() => { let alive = true; loadVoiceAssets().then((m) => { if (alive) setCommon(m); }); return () => { alive = false; }; }, []);
  const bgmUrl = common[voiceKey('bgm', 'a', bgmNo)] || '';

  // 음악은 한 번 틀면 끝까지 — 동작이 바뀌어도 끊기지 않는다.
  useEffect(() => {
    const a = musicRef.current;
    if (!a) return;
    a.volume = musicOn ? LOUD : 0;
    if (musicOn && bgmUrl) { try { a.play().catch(() => {}); } catch { /* 무시 */ } }
    else { try { a.pause(); } catch { /* 무시 */ } }
  }, [bgmUrl, musicOn]);

  // 멘트가 들리는 동안에는 음악을 낮춘다.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const tick = setInterval(() => {
      const a = musicRef.current;
      if (!a || !musicOn) return;
      const talking = [...document.querySelectorAll('audio')].some((el) => el !== a && !el.paused && !el.muted && el.currentTime > 0);
      const want = talking ? DUCK : LOUD;
      if (Math.abs(a.volume - want) > 0.01) a.volume = want;
    }, 350);
    return () => clearInterval(tick);
  }, [musicOn]);

  if (!card) {
    return (
      <Shell onClose={onClose}>
        <div style={{ padding: '40px 20px', textAlign: 'center', fontSize: 13.5, color: SUB, fontWeight: 700 }}>
          담긴 동작이 없어요.
        </div>
      </Shell>
    );
  }

  const last = at >= cards.length - 1;
  const { title: cardTitle } = pickCardTone(card, tone);

  return (
    <Shell onClose={onClose}>
      {bgmUrl && <audio ref={musicRef} src={bgmUrl} loop preload="auto" style={{ display: 'none' }} />}

      {/* 어디쯤 왔는지 — 늘 위에 떠 있다 */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.96)', padding: '10px 14px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 900, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pickRoutineTone(routine, tone).title}
          </span>
          <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: SET_INK, background: SET_BG, borderRadius: 999, padding: '4px 10px' }}>
            {at + 1} / {cards.length}
          </span>
        </div>
        {/* 동작 칸 — 지금 자리가 채워진다 */}
        <div style={{ display: 'flex', gap: 3 }}>
          {cards.map((c, i) => (
            <span key={c.id} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= at ? SET_INK : '#EDE9E2' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '10px 14px 0' }}>
        <QuickCardView key={card.id} card={card} tone={tone} bmtiCode={bmtiCode} skipOpening={routine?.skip_opening !== false} />
      </div>

      {/* 다음 동작 · 음악 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 22px' }}>
        <button type="button" onClick={() => setAt((n) => Math.max(0, n - 1))} disabled={at === 0}
          style={{ ...navBtn, opacity: at === 0 ? 0.35 : 1, cursor: at === 0 ? 'default' : 'pointer' }}>‹ 이전</button>
        <button type="button"
          onClick={() => { if (last) { if (onDone) onDone(); if (onClose) onClose(); } else setAt((n) => n + 1); }}
          style={{ flex: 1, padding: 13, borderRadius: 13, border: 'none', background: '#fff', color: INK,
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
          {last ? '플리 끝내기 ✓' : `다음 동작 → ${cards[at + 1] ? pickCardTone(cards[at + 1], tone).title.slice(0, 10) : ''}`}
        </button>
        <button type="button" onClick={() => setMusicOn((v) => !v)} aria-label={musicOn ? '음악 끄기' : '음악 켜기'}
          style={{ ...navBtn, background: musicOn ? SET_BG : '#fff', color: musicOn ? SET_INK : SUB, cursor: 'pointer' }}>
          {musicOn ? '♪ 켬' : '♪ 끔'}
        </button>
      </div>

      {/* 어떤 음악인지 · 바꾸기 */}
      {bgmUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px 26px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: SUB }}>배경음악</span>
          {BGM_GROUPS.map((g) => (
            <button key={g.n} type="button" onClick={() => setBgmNo(g.n)}
              disabled={!common[voiceKey('bgm', 'a', g.n)]}
              style={{ padding: '0 10px', height: 28, borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
                cursor: common[voiceKey('bgm', 'a', g.n)] ? 'pointer' : 'default',
                opacity: common[voiceKey('bgm', 'a', g.n)] ? 1 : 0.35,
                color: g.n === bgmNo ? SET_INK : SUB,
                background: g.n === bgmNo ? SET_BG : '#fff', boxShadow: g.n === bgmNo ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
              {g.hint}
            </button>
          ))}
        </div>
      )}
      <span style={{ display: 'none' }}>{cardTitle}</span>
    </Shell>
  );
}

const navBtn = {
  flexShrink: 0, padding: '0 13px', height: 46, borderRadius: 13, border: 'none',
  background: '#fff', color: SUB, fontSize: 12.5, fontWeight: 800, fontFamily: 'inherit',
  boxShadow: `inset 0 0 0 1px ${LINE}`,
};

function Shell({ children, onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
  }, [onClose]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 75, background: '#fff', overflowY: 'auto',
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, animation: 'pliGrow .26s cubic-bezier(.2,.8,.3,1)' }}>
      <style>{'@keyframes pliGrow{from{opacity:.4;transform:scale(.9)}to{opacity:1;transform:scale(1)}}'}</style>
      <button type="button" onClick={onClose} aria-label="닫기"
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, width: 36, height: 36, borderRadius: '50%',
          border: 'none', background: 'rgba(255,255,255,0.94)', boxShadow: '0 2px 10px rgba(0,0,0,0.14)',
          fontSize: 17, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>×</button>
      {children}
    </div>
  );
}
