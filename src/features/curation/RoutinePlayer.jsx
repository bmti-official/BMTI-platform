// 바로플리 재생 — 담긴 동작을 차례로 이어서 한다.
//
// 배경음악은 세 도막으로 흐른다.
//   도입부 — 열 때 한 번
//   중간   — 도입부 끝자락에서 이어받아 계속 돈다
//   마무리 — 마지막 동작의 마지막 세트에서 이어받아 한 번
// 도막이 바뀔 땐 3초 겹쳐 넘어가고, 겹치는 동안 도입부·마무리가 앞에 선다.
// 멘트가 흐를 땐 저절로 작아지고, 오프닝·마무리 멘트에는 아예 쉰다.
import { useEffect, useRef, useState } from 'react';
import QuickCardView from './QuickCardView';
import { withRoutineSetup } from './routineSetup';
import { loadVoiceAssets, voiceKey, bgmNoFor, BGM_GROUPS, BGM_PARTS, bgmN, bgmSet, bgmFade, XFADE_SEC, UNDER } from './voiceCommon';
import { pickCardTone, pickRoutineTone, subLines } from './format';
import PartnerStage from './PartnerStage';
import FullWrap from './FullWrap';
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
  // 파트너가 오프닝·마무리를 말하는 동안에는 음악을 쉬게 둔다.
  const [quiet, setQuiet] = useState(false);
  // 동작을 다 끝내면 파트너가 '다음 동작' 한마디를 건네고, 스무 셈을 센다.
  const [gap, setGap] = useState(0);        // 남은 셈. 0이면 쉬는 참이 아니다.
  const gapRef = useRef(null);
  const introRef = useRef(null);
  const loopRef = useRef(null);
  const outroRef = useRef(null);
  const card = cards[at];

  useEffect(() => { let alive = true; loadVoiceAssets().then((m) => { if (alive) setCommon(m); }); return () => { alive = false; }; }, []);
  const bgm = bgmSet(common, bgmNo);
  const hasMusic = !!(bgm.intro || bgm.loop || bgm.outro);

  const loud = VOL_STEPS[volNo];
  // 지금 어느 도막인가 — 'intro' | 'loop' | 'outro'
  const [part, setPart] = useState('intro');
  // 도막이 바뀐 때 — 겹치는 동안 크기를 얼마나 옮겼는지 재는 데 쓴다.
  const outroFrom = useRef(0);
  const loopFrom = useRef(0);

  // 도입부가 없는 곡이면 처음부터 중간으로 친다 — 따로 되돌릴 일이 없다.
  const live = part === 'intro' && !bgm.intro ? 'loop' : part;

  // 도막마다 언제 틀고 언제 세울지 — 한 군데서 정한다.
  // 중간은 도입부 끝자락에 아래 시계가 미리 깔아 주므로, 여기서는 붙잡지 않는다.
  useEffect(() => {
    const on = musicOn && !quiet;
    const put = (a, go) => {
      if (!a || !a.src) return;
      if (go) { try { a.play().catch(() => {}); } catch { /* 무시 */ } }
      else { try { a.pause(); } catch { /* 무시 */ } }
    };
    put(introRef.current, on && live === 'intro' && !!bgm.intro);
    put(outroRef.current, on && live === 'outro' && !!bgm.outro);
    const lA = loopRef.current;
    if (lA && lA.src) {
      if (!on) put(lA, false);              // 음악을 껐거나 파트너가 말할 때만 세운다
      else if (live === 'loop') put(lA, true);
    }
  }, [live, musicOn, quiet, bgm.intro, bgm.loop, bgm.outro]);

  // 크기 맞추기 — 멘트가 들리면 낮추고, 도막이 겹치는 동안에는 앞뒤를 가른다.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const tick = setInterval(() => {
      const iA = introRef.current, lA = loopRef.current, oA = outroRef.current;
      const mine = [iA, lA, oA].filter(Boolean);
      const talking = [...document.querySelectorAll('audio')]
        .some((el) => !mine.includes(el) && !el.paused && !el.muted && el.currentTime > 0);
      const base = (musicOn && !quiet ? loud : 0) * (talking ? DUCK_RATE : 1);
      const set = (a, v) => { if (a && Math.abs(a.volume - v) > 0.005) a.volume = Math.max(0, Math.min(1, v)); };

      // 도입부 — 겹치는 동안에도 앞에 선다
      set(iA, base);

      // 중간 — 도입부 끝자락에 슬며시 들어와, 도입부가 끝나면 앞으로 나온다
      if (live === 'intro') {
        const left = iA && iA.duration > 0 ? iA.duration - iA.currentTime : 99;
        const inN = Math.max(0, Math.min(1, (XFADE_SEC - left) / XFADE_SEC));
        set(lA, base * UNDER * inN);
        // 끝자락에 닿으면 미리 틀어 둔다 — 소리가 뚝 끊기지 않게
        if (left <= XFADE_SEC && lA && lA.paused && musicOn && !quiet) {
          loopFrom.current = 0;
          try { lA.play().catch(() => {}); } catch { /* 무시 */ }
        }
      } else if (live === 'outro') {
        const gone = (Date.now() - outroFrom.current) / 1000;
        set(lA, base * Math.max(0, 1 - gone / XFADE_SEC));
        if (lA && gone > XFADE_SEC && !lA.paused) { try { lA.pause(); } catch { /* 무시 */ } }
      } else {
        // 도입부에서 막 넘어왔으면 물러나 있던 자리에서 천천히 올라온다
        if (!loopFrom.current) loopFrom.current = Date.now();
        const up = Math.max(0, Math.min(1, (Date.now() - loopFrom.current) / (XFADE_SEC * 1000)));
        const room = bgm.intro ? UNDER + (1 - UNDER) * up : 1;
        set(lA, base * room * bgmFade(lA ? lA.currentTime : 0, lA ? lA.duration : 0));
      }

      // 마무리 — 한 셈 만에 앞으로 나와 중간을 덮는다
      if (live === 'outro') {
        const gone = (Date.now() - outroFrom.current) / 1000;
        set(oA, base * Math.max(0, Math.min(1, gone / 1)));
      } else set(oA, 0);

    }, 200);
    return () => clearInterval(tick);
  }, [musicOn, loud, quiet, live, bgm.intro]);

  // 마지막 동작의 마지막 세트에 닿으면 마무리 도막으로 넘어간다.
  const toOutro = () => {
    if (!bgm.outro || live === 'outro') return;
    outroFrom.current = Date.now();
    setPart('outro');
  };

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
      {/* 배경음악 세 도막 — 중간만 되돈다 */}
      {bgm.intro && <audio ref={introRef} src={bgm.intro} preload="auto" style={{ display: 'none' }}
        onEnded={() => setPart((k) => (k === 'intro' ? 'loop' : k))} />}
      {bgm.loop && <audio ref={loopRef} src={bgm.loop} loop preload="auto" style={{ display: 'none' }} />}
      {bgm.outro && <audio ref={outroRef} src={bgm.outro} preload="auto" style={{ display: 'none' }}
        onEnded={() => setPart((k) => (k === 'outro' ? 'loop' : k))} />}

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
            nextTitle={(cards[at + 1] || {}).thumb_text || ''}
            nextClip={(cards[at + 1] || {}).video_url || ''}
            voiceUrl={common[voiceKey('next', tone, 0)] || ''} audioRef={gapRef}
            onSkip={() => { setGap(0); setAt((n) => n + 1); }} />
        ) : (
          <QuickCardView key={card.id} card={withRoutineSetup(card)} tone={tone} bmtiCode={bmtiCode}
            autoStart skipOpening={at > 0} full={full} onFull={setFull}
            hideFinish={!last}
            onQuiet={setQuiet}
            onFinalStretch={() => { if (last) toOutro(); }}
            onAllDone={() => { if (!last) { setGap(GAP_SEC); setQuiet(false); } }} />
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
          {last ? '플리 끝내기 ✓' : `다음 동작 → ${(cards[at + 1] || {}).thumb_text || ''}`}
        </button>
      </div>

      {/* 어떤 음악인지 · 바꾸기 */}
      {hasMusic && (
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
              <button key={g.n} type="button" onClick={() => { setBgmNo(g.n); setPart('intro'); outroFrom.current = 0; }}
                disabled={!BGM_PARTS.some((b) => common[voiceKey('bgm', 'a', bgmN(g.n, b.p))])}
                style={{ padding: '0 10px', height: 32, borderRadius: 9, border: 'none', fontFamily: 'inherit',
                  fontSize: 11.5, fontWeight: 800, whiteSpace: 'nowrap',
                  cursor: BGM_PARTS.some((b) => common[voiceKey('bgm', 'a', bgmN(g.n, b.p))]) ? 'pointer' : 'default',
                  opacity: BGM_PARTS.some((b) => common[voiceKey('bgm', 'a', bgmN(g.n, b.p))]) ? 1 : 0.35,
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
function GapStage({ code, img, name, tone, sec, full, nextTitle, nextClip, voiceUrl, audioRef, onSkip }) {
  const stage = (
    // 뒤에는 이제 갈 동작이 흐릿하게 돈다 — 무엇을 하러 가는지 말보다 먼저 보인다.
    <PartnerStage code={code} img={img} name={name} say={subLines(nextLine(tone))}
      at={GAP_SEC - sec} len={GAP_SEC} clip={nextClip}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: SUB, textAlign: 'center', wordBreak: 'keep-all' }}>
        다음은 <b style={{ color: INK }}>{nextTitle || '다음 동작'}</b> — <b style={{ color: SET_INK }}>{sec}</b>초 뒤에 이어져요
      </span>
      <button type="button" onClick={onSkip} style={partnerBtn}>바로 시작 →</button>
      <audio ref={audioRef} src={voiceUrl || undefined} preload="auto" style={{ display: 'none' }} />
    </PartnerStage>
  );
  return <FullWrap on={full}>{stage}</FullWrap>;
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
