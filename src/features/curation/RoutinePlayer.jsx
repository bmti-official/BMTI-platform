// 바로플리 재생 — 담긴 동작을 차례로 이어서 한다.
// 배경음악이 처음부터 끝까지 깔리고, 멘트가 흐를 땐 저절로 작아진다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { withRoutineSetup } from './routineSetup';
import { loadVoiceAssets, voiceKey, bgmNoFor, BGM_GROUPS } from './voiceCommon';
import { pickCardTone, pickRoutineTone, subLines } from './format';
import PartnerStage from './PartnerStage';
import { partnerBtn } from './partnerBtn';
import { nextLine } from './finishLine';
import { axisOf } from './typeTint';
import { CHARACTER_NAMES } from '../../lib/bmtiTypes';
import { CHARACTERS } from '../../data';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const SET_BG = '#FBF4DE', SET_INK = '#6E5A1C';
// 음악은 멘트를 덮지 않을 만큼만. 처음 크기는 작게 두고 손님이 올릴 수 있게 한다.
const VOL_STEPS = [0.06, 0.12, 0.18, 0.26, 0.36];
const VOL_START = 1;                 // 처음은 두 번째 칸
const GAP_SEC = 20;                  // 동작과 동작 사이 — 멘트가 끝나고 세는 셈
const DUCK_RATE = 0.35;              // 멘트가 흐를 땐 이만큼만 남긴다

export default function RoutinePlayer({ routine, cards = [], tone = 'z', bmtiCode, onClose, onDone }) {
  const [at, setAt] = useState(0);            // 몇 번째 동작인가
  const [common, setCommon] = useState({});
  const [bgmNo, setBgmNo] = useState(() => bgmNoFor(bmtiCode));
  const [musicOn, setMusicOn] = useState(true);
  const [volNo, setVolNo] = useState(VOL_START);
  // 전체 화면은 동작이 바뀌어도 그대로 — 그래서 카드가 아니라 여기가 쥐고 있는다.
  // 바로플리는 처음부터 전체 화면으로 연다. 손을 대지 않고 끝까지 갈 수 있게.
  const [full, setFull] = useState(true);
  // 동작을 다 끝내면 파트너가 '다음 동작' 한마디를 건네고, 스무 셈을 센다.
  const [gap, setGap] = useState(0);        // 남은 셈. 0이면 쉬는 참이 아니다.
  const gapRef = useRef(null);
  const musicRef = useRef(null);
  const card = cards[at];

  useEffect(() => { let alive = true; loadVoiceAssets().then((m) => { if (alive) setCommon(m); }); return () => { alive = false; }; }, []);
  const bgmUrl = common[voiceKey('bgm', 'a', bgmNo)] || '';

  const loud = VOL_STEPS[volNo];

  // 음악은 한 번 틀면 끝까지 — 동작이 바뀌어도 끊기지 않는다.
  useEffect(() => {
    const a = musicRef.current;
    if (!a) return;
    a.volume = musicOn ? loud : 0;
    if (musicOn && bgmUrl) { try { a.play().catch(() => {}); } catch { /* 무시 */ } }
    else { try { a.pause(); } catch { /* 무시 */ } }
  }, [bgmUrl, musicOn, loud]);

  // 멘트가 들리는 동안에는 음악을 낮춘다.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const tick = setInterval(() => {
      const a = musicRef.current;
      if (!a || !musicOn) return;
      const talking = [...document.querySelectorAll('audio')].some((el) => el !== a && !el.paused && !el.muted && el.currentTime > 0);
      const want = talking ? loud * DUCK_RATE : loud;
      if (Math.abs(a.volume - want) > 0.01) a.volume = want;
    }, 350);
    return () => clearInterval(tick);
  }, [musicOn, loud]);

  // 한 셈씩 줄이다가 0이 되면 저절로 다음 동작으로 넘어간다.
  useEffect(() => {
    if (gap <= 0) return undefined;
    const t = setTimeout(() => {
      if (gap === 1) { setGap(0); setAt((n) => n + 1); } else setGap((n) => n - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [gap]);

  // '다음 동작' 멘트는 한 번만 — 쉬는 참이 시작될 때.
  useEffect(() => {
    if (gap !== GAP_SEC) return;
    const a = gapRef.current;
    if (!a || !a.src) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
  }, [gap]);

  const myCode = axisOf(bmtiCode);
  const partnerImg = CHARACTERS.find((c) => c.id === myCode)?.image || '';
  const partnerName = String(CHARACTER_NAMES[myCode] || '').replace(/\n/g, ' ');

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
        {gap > 0 ? (
          <GapStage code={myCode} img={partnerImg} name={partnerName} tone={tone} sec={gap} full={full}
            nextTitle={cards[at + 1] ? pickCardTone(cards[at + 1], tone).title : ''}
            voiceUrl={common[voiceKey('next', tone, 0)] || ''} audioRef={gapRef}
            onSkip={() => { setGap(0); setAt((n) => n + 1); }} />
        ) : (
          <QuickCardView key={card.id} card={withRoutineSetup(card)} tone={tone} bmtiCode={bmtiCode}
            autoStart skipOpening={at > 0} full={full} onFull={setFull}
            hideFinish={!last}
            onAllDone={() => { if (!last) setGap(GAP_SEC); }} />
        )}
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
      </div>

      {/* 어떤 음악인지 · 바꾸기 */}
      {bgmUrl && (
        <div style={{ padding: '0 14px 26px' }}>
          {/* 켬·끔 · 이름 · 크기 — 한 줄에 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button type="button" onClick={() => setMusicOn((v) => !v)} aria-label={musicOn ? '음악 끄기' : '음악 켜기'}
              style={{ padding: '0 11px', height: 28, borderRadius: 9, border: 'none', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 800, cursor: 'pointer',
                background: musicOn ? SET_BG : '#fff', color: musicOn ? SET_INK : SUB,
                boxShadow: musicOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
              {musicOn ? '♪ 켬' : '♪ 끔'}
            </button>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: SUB }}>배경음악</span>
            <VolBar no={volNo} on={musicOn} onPick={setVolNo} />
          </div>
          {/* 곡 고르기 — 두 개씩 나란히 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {BGM_GROUPS.map((g) => (
              <button key={g.n} type="button" onClick={() => setBgmNo(g.n)}
                disabled={!common[voiceKey('bgm', 'a', g.n)]}
                style={{ padding: '0 10px', height: 32, borderRadius: 9, border: 'none', fontFamily: 'inherit',
                  fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
                  cursor: common[voiceKey('bgm', 'a', g.n)] ? 'pointer' : 'default',
                  opacity: common[voiceKey('bgm', 'a', g.n)] ? 1 : 0.35,
                  color: g.n === bgmNo ? SET_INK : SUB,
                  background: g.n === bgmNo ? SET_BG : '#fff', boxShadow: g.n === bgmNo ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
                {g.hint}
              </button>
            ))}
          </div>
        </div>
      )}
      <span style={{ display: 'none' }}>{cardTitle}</span>
    </Shell>
  );
}

// 다음 동작으로 넘어가기 전 — 오프닝과 같은 자리에 파트너가 서서 한마디를 건넨다.
function GapStage({ code, img, name, tone, sec, full, nextTitle, voiceUrl, audioRef, onSkip }) {
  const stage = (
    <PartnerStage code={code} img={img} name={name} say={subLines(nextLine(tone))} at={GAP_SEC - sec} len={GAP_SEC}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: SUB, textAlign: 'center', wordBreak: 'keep-all' }}>
        다음은 <b style={{ color: INK }}>{nextTitle || '다음 동작'}</b> — <b style={{ color: SET_INK }}>{sec}</b>초 뒤에 이어져요
      </span>
      <button type="button" onClick={onSkip} style={partnerBtn}>바로 시작 →</button>
      <audio ref={audioRef} src={voiceUrl || undefined} preload="auto" style={{ display: 'none' }} />
    </PartnerStage>
  );
  if (!full) return stage;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 'min(100%, 78vh)' }}>{stage}</div>
    </div>
  );
}

// 음악 크기 — 다섯 칸짜리 막대. 몇 칸인지 눈으로 바로 보인다.
function VolBar({ no, on, onPick }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginRight: 4 }}>
      {VOL_STEPS.map((v, i) => (
        <button key={v} type="button" onClick={() => onPick(i)} aria-label={`음악 크기 ${i + 1}칸`}
          style={{ width: 11, height: 8 + i * 4, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
            background: on && i <= no ? SET_INK : '#E6E1D8', transition: 'background .15s' }} />
      ))}
    </span>
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
