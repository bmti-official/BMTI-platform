// 손님에게 보이는 바로카드 — 인스타 게시물처럼.
//  ① 종류·시간·제목·완주율  ② 추천 유형 누끼 캐릭터  ③ 4:5 표지(부위·도구를 모서리에 얹는다)
//  ④ 조회·저장 + 보관하기   ⑤ 바로 따라하기
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { useEffect, useRef, useState } from 'react';
import { CurationThumb, CharRow, CharPic } from './CurationCard';
import { CHARACTER_NAMES } from '../../lib/bmtiTypes';
import { loadVoiceAssets, voiceKey } from './voiceCommon';
import AiNote from './AiNote';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { pickCardTone, fmtCount as fmt, mmss, nameLines } from './format';
import { BodyPreview } from './CurationCard';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const GOLD = '#B08635';                   // 타겟 부위 · 도구를 짚어 주는 골드
const PURPLE = '#8B7BD8';                 // 세트·횟수에서 앞자리를 짚어 주는 연보라
// 동작 이름표 글씨 — 종류마다 색이 다르다.
// 표지 형광펜과 같은 갈래의 색을 쓰되, 흰 바탕에서 읽히는 만큼만 진하게 잡았다.
const KIND_INK = { exercise: '#8B7BD8', massage: '#E08B57', stretch: '#6FAE6A' };
const KEEP_SHADOW = '0 3px 10px rgba(217,185,106,0.45)';   // 버튼에 깔리는 연한 옐로우 그림자
const KEEP_BG = '#FDF2CE', KEEP_INK = '#6E5A1C';           // 보관하기 버튼
// 배경 없이 얹는 글씨가 어떤 그림 위에서도 읽히게 하는 옅은 흰 그늘
const SHADE = '0 1px 3px rgba(255,255,255,0.9), 0 0 8px rgba(255,255,255,0.75)';
const NAME_BG = '#FDF2CE', NAME_INK = '#6E5A1C';           // 제목 옆 동작 이름표
const SET_BG = '#FBF4DE', SET_INK = '#6E5A1C';             // 세트 고르기 · 세트 세기
const BOX_BG = '#F7F5F0';                                  // 펼쳤을 때 머리말 바탕
// 영상 안 모서리에 붙는 글씨 — 몇 세트째 · 몇 번째. 배경 없이 글씨만 얹는다.
const corner = {
  position: 'absolute', top: 12, zIndex: 2, pointerEvents: 'none',
  fontSize: 18, fontWeight: 900, color: INK, whiteSpace: 'nowrap', letterSpacing: '-0.01em',
  textShadow: SHADE,
};
const dropdown = {
  height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 12.5, fontWeight: 800, color: SET_INK, background: SET_BG, padding: '0 8px',
};

// 전체 화면일 때는 가로에 맞추면 세로 영상이 지나치게 커진다.
// 높이에 맞춰 담기게(contain) 되돌린다.
const FULLSCREEN_FIX = `
.bmti-clip:fullscreen, .bmti-clip:-webkit-full-screen {
  object-fit: contain !important; width: 100% !important; height: 100% !important; background: #000;
}`;

const partLabels = (keys) => (keys || []).map((k) => KEY_TO_PART_LABEL[k] || k);

// 표지 모서리에 얹는 글씨 — 사진 위에서도 읽히게 끝이 둥근 반투명 연한 옐로우를 깐다.
const overlay = (side) => ({
  position: 'absolute', top: 12, [side]: 12, zIndex: 2, pointerEvents: 'none',
  fontSize: 12, fontWeight: 800, lineHeight: 1.35, letterSpacing: '-0.01em',
  textAlign: side === 'right' ? 'center' : 'left', wordBreak: 'keep-all',
  textShadow: SHADE,
});

const REPS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const SETS = [3, 4, 5];
const RESTS = [5, 10, 15, 20];
// 좌우를 번갈아 못 하는 동작은, 오른쪽을 다 하고 왼쪽으로 자세를 고쳐 누워야 해서 넉넉히 쉰다.
const SWITCH_REST = 20;
// right/left  한쪽만 · both  오른쪽을 다 하고 왼쪽으로 · alt  한 번 할 때마다 좌우가 바뀐다
const SIDES = [['right', '우'], ['left', '좌'], ['both', '한쪽씩 둘 다'], ['alt', '좌우 번갈아']];
const SIDE_KO = Object.fromEntries(SIDES);

export default function QuickCardView({ card, tone = 'z', onStart, onSave, onMakeRoutine, charImages, charCodes, skipOpening = false }) {
  const { title, script } = pickCardTone(card, tone);
  // 표지 → 누끼 캐릭터의 오프닝 설명 → 동작. 셋 다 같은 4:5다.
  const [stage, setStage] = useState('cover');
  const started = stage !== 'cover';
  // 몇 번, 몇 세트 할지는 손님이 정한다. 시작한 뒤에는 몇 세트째인지 센다.
  const [reps, setReps] = useState(15);
  const [sets, setSets] = useState(3);
  const [done, setDone] = useState(0);
  // 영상이 한 바퀴 돌 때마다 한 번씩 세고, 정한 횟수를 채우면 다음 세트로 넘어간다.
  const [rep, setRep] = useState(0);
  // 세트 사이 쉬는 시간 — 고른 초만큼 세다가 저절로 다음 세트를 시작한다.
  const [restSec, setRestSec] = useState(10);
  const [rest, setRest] = useState(0);
  // 지금 쉬는 시간이 몇 초짜리인지 — 멘트를 고를 때 쓴다(자리 바꿀 땐 20초).
  const [restLen, setRestLen] = useState(10);
  // 지금 쉬는 것이 '자리 바꾸기'인가 — 그때만 방향을 알려 주는 멘트가 나간다.
  const [switching, setSwitching] = useState(false);
  const clipRef = useRef(null);
  const resting = useRef(false);
  // 좌우가 나뉘는 동작이면 어느 쪽을 할지 고른다.
  const [side, setSide] = useState('both');
  // '한쪽씩 둘 다'는 오른쪽을 다 하고 왼쪽으로 넘어간다. 지금 왼쪽 차례인가.
  const [secondSide, setSecondSide] = useState(false);
  // '좌우 번갈아'는 영상이 한 번 돌 때마다 좌우가 바뀐다.
  const [altFlip, setAltFlip] = useState(false);
  const twoPhase = card.has_side && side === 'both';
  // 번갈아 할 수 있는 동작이면 자리를 크게 고칠 일이 없으니 평소만큼만 쉰다.
  const sideRest = card.can_alternate ? restSec : SWITCH_REST;
  // 지금이 몇 번째 세트인지 나타내는 이름표 — 멘트를 다 들었는지 이걸로 가린다.
  const setKey = `${secondSide ? 'L' : 'R'}${done}`;
  const allDone = started && done >= sets && (!twoPhase || secondSide);
  // 화면에서 영상을 좌우로 뒤집어야 하는가
  const mirrored = card.has_side && (side === 'left' || (side === 'both' && secondSide) || (side === 'alt' && altFlip));
  // 한 번 도는 데 걸리는 시간을 영상에서 직접 읽어 온다(없으면 관리자가 적은 값을 쓴다).
  const [clipSec, setClipSec] = useState(0);
  const oneRep = clipSec > 0 ? clipSec : card.duration_sec;
  const perSet = oneRep > 0 ? Math.round(oneRep * reps) : 0;
  const rounds = sets * (twoPhase ? 2 : 1);
  const restTotal = twoPhase ? restSec * (sets - 1) * 2 + sideRest : restSec * Math.max(0, sets - 1);
  const totalSec = perSet > 0 ? perSet * rounds + restTotal : 0;

  const restart = () => { setDone(0); setRep(0); setRest(0); setRestLen(restSec); setSwitching(false); setSecondSide(false); setAltFlip(false); setMentDone(''); setPaused(false); };

  // 잠깐 멈추기 / 다시 하기 — 영상과 소리를 함께 세운다.
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    const v = clipRef.current, a = audioRef.current, c = countRef.current;
    [v, a, c].forEach((el) => { if (!el) return; try { if (next) el.pause(); } catch { /* 무시 */ } });
    if (!next && v && rest === 0 && !allDone) { try { v.play().catch(() => {}); } catch { /* 무시 */ } }
  };

  // 따라하는 중에 설정을 바꾸면 처음부터 다시 시작한다 — 먼저 물어본다.
  const change = (fn) => (v) => {
    if (stage === 'move') {
      if (!window.confirm('설정을 바꾸면 처음부터 다시 시작해요. 바꿀까요?')) return;
      fn(v);
      restart();
      return;
    }
    fn(v);
  };

  // 영상 한 바퀴가 끝날 때마다 — 세고, 필요하면 세트를 넘기고, 다시 튼다.
  const onRepEnd = (e) => {
    const v = e.currentTarget;
    const again = () => { try { v.currentTime = 0; v.play().catch(() => {}); } catch { /* 무시 */ } };
    // 세트를 넘길 땐 곧장 잇지 않고, 고른 만큼 쉬었다 간다.
    const breathe = (n, isSwitch = false) => {
      try { v.pause(); } catch { /* 무시 */ }
      setSwitching(isSwitch); setRestLen(n); setRest(n);
    };
    if (side === 'alt') setAltFlip((f) => !f);
    if (rep + 1 < reps) { setRep(rep + 1); again(); return; }
    if (done + 1 < sets) { setRep(0); setDone(done + 1); breathe(restSec); return; }
    if (twoPhase && !secondSide) { setRep(0); setDone(0); setSecondSide(true); setAltFlip(false); breathe(sideRest, true); return; }
    setRep(reps); setDone(sets);      // 다 채웠다. 여기서 멈춘다
  };
  // AI 음성 — 오프닝이 먼저 흐르고, 끝나면 세트 멘트로 넘어간다.
  const openUrl = (tone === 'm' ? card.voice_open_m : card.voice_open_z) || '';
  const setClips = ((tone === 'm' ? card.voice_sets_m : card.voice_sets_z) || []).filter(Boolean);
  const [voiceOn, setVoiceOn] = useState(true);
  const [vol, setVol] = useState(0.85);
  const audioRef = useRef(null);
  // 설명을 들으며 할지, 숫자만 들을지 — 손님이 고른다.
  const [guide, setGuide] = useState(true);   // 기본은 '설명 들으며'
  // 고르는 칸은 접어 두고, 바꾸고 싶은 사람만 펼친다.
  const [optOpen, setOptOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  // 세트 멘트가 흐르는 동안에는 숫자를 세지 않는다. 멘트를 다 들은 세트를 적어 둔다.
  const [mentDone, setMentDone] = useState('');
  // 모든 카드가 함께 쓰는 소리 — 숫자·쉬는 시간·마무리
  const [common, setCommon] = useState({});
  const countRef = useRef(null);
  useEffect(() => { let alive = true; loadVoiceAssets().then((m) => { if (alive) setCommon(m); }); return () => { alive = false; }; }, []);
  const commonAt = (kind, n) => common[voiceKey(kind, tone === 'm' ? 'm' : 'z', n)] || '';
  // 지금 세트 멘트가 흐르는 중인가 — 설명 모드이고, 아직 다 듣지 않았을 때만.
  const mentOn = stage === 'move' && guide && rest === 0 && !allDone && !!setClips.length && mentDone !== setKey;
  const hasVoice = !!(openUrl || setClips.length || Object.keys(common).length);
  // 오프닝은 한 번만 — 다시 볼 땐 곧장 동작으로 간다.
  const [heardOpening, setHeardOpening] = useState(false);
  const nowVoice = !started ? ''
    : stage === 'open' ? openUrl
      : rest > 0 ? ((switching && commonAt('switch', 0)) || commonAt('rest', restLen))
        : allDone ? commonAt('finish', 0)
          : (mentOn ? (setClips[Math.min(done, setClips.length - 1)] || '') : '');

  const beginOpening = !skipOpening && !heardOpening && !!openUrl;
  const start = () => {
    restart();
    if (beginOpening) { setHeardOpening(true); setStage('open'); } else setStage('move');
    if (onStart) onStart();
  };

  // 멘트가 바뀌면 처음부터 다시 틀어 준다.
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !nowVoice) return;
    a.volume = vol;
    a.muted = !voiceOn;
    if (!voiceOn) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
  }, [nowVoice, voiceOn, vol]);

  // 숫자 세기 — 멘트가 끝난 뒤부터, 한 바퀴마다 하나씩.
  useEffect(() => {
    if (stage !== 'move' || rest > 0 || allDone || !voiceOn || mentOn) return;
    const url = commonAt('count', rep + 1);
    const a = countRef.current;
    if (!a || !url) return;
    a.volume = vol;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep, done, secondSide, stage, rest, mentOn, voiceOn]);

  // 한 해씩 줄이다가 0이 되면 다음 세트를 저절로 시작한다.
  useEffect(() => {
    if (rest > 0) {
      resting.current = true;
      if (paused) return undefined;
      const t = setTimeout(() => setRest((n) => n - 1), 1000);
      return () => clearTimeout(t);
    }
    if (resting.current) {
      resting.current = false;
      const v = clipRef.current;
      if (v) { try { v.currentTime = 0; v.play().catch(() => {}); } catch { /* 무시 */ } }
    }
    return undefined;
  }, [rest, paused]);

  // 소리가 막혀 오프닝이 끝나지 않는 경우를 대비해, 스무 해 세고는 동작으로 넘어간다.
  useEffect(() => {
    if (stage !== 'open') return undefined;
    const t = setTimeout(() => setStage('move'), 20000);
    return () => clearTimeout(t);
  }, [stage]);
  const hasPlay = !!card.video_url;
  const core = partLabels(card.core_parts);
  const related = partLabels(card.related_parts);
  const tools = card.tools || [];
  const chars = (charImages || []).slice(0, 4);
  const openName = String(CHARACTER_NAMES[(charCodes || [])[0]] || '').replace(/\n/g, ' ');
  const sideOpts = SIDES.filter(([k]) => k !== 'alt' || card.can_alternate);

  // 고르는 칸 — 표지에서도, 따라하는 중에도 같은 모양으로 쓴다.
  const pillBtn = (on) => ({
    padding: '0 10px', height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', color: on ? SET_INK : SUB,
    background: on ? SET_BG : '#fff', boxShadow: on ? 'none' : `inset 0 0 0 1px ${LINE}`,
  });
  const label = (t) => <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, color: SUB }}>{t}</span>;
  // 접혀 있을 때는 꼭 알아야 할 것만.
  const optSummary = `기본 설정: ${reps}회 · ${sets}세트`
    + (totalSec > 0 ? ` ㅣ 모두 ${mmss(totalSec)}` : '');
  const optBox = (
    <div style={{ marginBottom: 10 }}>
      <button type="button" onClick={() => setOptOpen((o) => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 8, padding: '9px 11px', borderRadius: 11,
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
          background: optOpen ? BOX_BG : '#fff', boxShadow: optOpen ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 800, lineHeight: 1.45, wordBreak: 'keep-all', color: INK }}>
          {optSummary}
        </span>
        <span style={{ flexShrink: 0, fontSize: 11.5, fontWeight: 800, paddingTop: 1, color: SUB }}>
          {optOpen ? '접기 ▴' : '바꾸기 ▾'}
        </span>
      </button>
      {optOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, padding: '9px 2px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {label('횟수')}
            <select value={reps} onChange={(e) => change(setReps)(Number(e.target.value))} style={dropdown}>
              {REPS.map((n) => <option key={n} value={n}>{n}회</option>)}
            </select>
            {label('세트')}
            <select value={sets} onChange={(e) => change(setSets)(Number(e.target.value))} style={dropdown}>
              {SETS.map((n) => <option key={n} value={n}>{n}세트</option>)}
            </select>
            {label('쉬는 시간')}
            <select value={restSec} onChange={(e) => change(setRestSec)(Number(e.target.value))} style={dropdown}>
              {RESTS.map((n) => <option key={n} value={n}>{n}초</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {label('안내')}
            {[[true, '설명 들으며'], [false, '숫자만']].map(([g, lb]) => (
              <button key={lb} type="button" onClick={() => change(setGuide)(g)} style={pillBtn(g === guide)}>{lb}</button>
            ))}
            {totalSec > 0 && (
              <span style={{ marginLeft: 'auto', fontSize: 11.5, color: SUB, fontWeight: 700, whiteSpace: 'nowrap' }}>
                모두 {mmss(totalSec)}
              </span>
            )}
          </div>
          {card.has_side && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {label('좌우')}
              {sideOpts.map(([k, lb]) => (
                <button key={k} type="button" onClick={() => change(setSide)(k)} style={pillBtn(k === side)}>{lb}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <style>{FULLSCREEN_FIX}</style>
      {stage !== 'move' && (
      <div style={{ padding: '12px 15px 10px' }}>
        {/* 추천 유형 누끼 캐릭터 */}
        {chars.length > 0 && <CharRow chars={chars} codes={charCodes || []} h={30} />}
        {/* 동작 이름표(Z·M 공통) + 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
          {card.thumb_text && (
            <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: KIND_INK[card.kind] || PURPLE,
              background: '#fff', borderRadius: 10, padding: '5px 10px', boxShadow: `inset 0 0 0 1px ${LINE}`,
              lineHeight: 1.25, textAlign: 'center', display: 'flex', flexDirection: 'column' }}>
              {nameLines(card.thumb_text).map((ln, i) => <span key={i}>{ln}</span>)}
            </span>
          )}
          <h3 style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 800, lineHeight: 1.4, margin: 0, wordBreak: 'keep-all' }}>{title}</h3>
        </div>
      </div>
      )}

      {/* 따라하는 중 — 영상 위에 무엇을 몇 번 하는지 적고, 옆에 처음부터 다시 */}
      {stage === 'move' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 15px 10px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: INK, wordBreak: 'keep-all' }}>
            총 {reps}회 · {sets}세트{card.has_side ? ` · ${SIDE_KO[side]}` : ''}{paused ? ' · 멈춤' : ''}
          </span>
          <button type="button" onClick={togglePause}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', borderRadius: 14,
              border: 'none', background: paused ? SET_BG : '#fff', color: paused ? SET_INK : SUB,
              boxShadow: paused ? 'none' : `inset 0 0 0 1px ${LINE}`, cursor: 'pointer', lineHeight: 1.2,
              display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>{paused ? '이어서' : '일시'}</span><span>{paused ? '하기' : '정지'}</span>
          </button>
          <button type="button" onClick={() => { restart(); setStage('move'); }}
            style={{ flexShrink: 0, padding: '6px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', borderRadius: 14,
              border: 'none', background: NAME_BG, color: NAME_INK, cursor: 'pointer', lineHeight: 1.2,
              display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span>처음부터</span><span>다시</span>
          </button>
        </div>
      )}

      {stage === 'open' ? (
        // 오프닝 — 누끼 캐릭터가 잠깐 설명해 준다. 소리가 끝나면 저절로 동작으로 넘어간다.
        <div style={{ width: '100%', aspectRatio: '4 / 5', background: 'linear-gradient(180deg,#FFFDF7,#FAF3E2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20, boxSizing: 'border-box' }}>
          {chars.length > 0
            ? <CharPic src={chars[0]} code={(charCodes || [])[0]} h={140} />
            : <span style={{ fontSize: 64 }}>💬</span>}
          <span style={{ fontSize: 11.5, fontWeight: 800, color: NAME_INK, background: NAME_BG, borderRadius: 999, padding: '5px 12px' }}>
            {openName ? `${openName} 설명 중` : '설명 중'}
          </span>
          <span style={{ fontSize: 14.5, fontWeight: 800, color: INK, textAlign: 'center', wordBreak: 'keep-all', lineHeight: 1.4 }}>
            {card.thumb_text || title}
          </span>
          <button type="button" onClick={() => setStage('move')}
            style={{ marginTop: 4, border: 'none', background: '#fff', color: SUB, borderRadius: 999, padding: '8px 16px',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `inset 0 0 0 1px ${LINE}` }}>
            바로 동작 보기 →
          </button>
        </div>
      ) : started && hasPlay ? (
        // 실제 동작 — 표지와 같은 4:5
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={clipRef} className="bmti-clip" src={card.video_url} autoPlay muted playsInline
            onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (d > 0 && Number.isFinite(d)) setClipSec(d); }}
            onEnded={onRepEnd}
            style={{ width: '100%', height: '100%', objectFit: 'cover',
              // 영상은 늘 오른쪽으로 찍는다. 왼쪽 차례엔 화면에서 좌우를 뒤집어 보여 준다.
              transform: mirrored ? 'scaleX(-1)' : 'none' }} />
          {/* 왼쪽 위 몇 세트째 · 오른쪽 위 몇 번째 */}
          {card.has_side && !allDone && (
            <span style={{ ...corner, left: 12, color: PURPLE }}>
              {twoPhase ? (secondSide ? '왼쪽' : '오른쪽') : SIDE_KO[side]}
            </span>
          )}
          <span style={{ ...corner, left: '50%', transform: 'translateX(-50%)' }}>
            {allDone ? '다 끝냈어요' : (<><b style={{ color: PURPLE, fontWeight: 900 }}>{done + 1}</b> 세트 중</>)}
          </span>
          <span style={{ ...corner, right: 12, fontVariantNumeric: 'tabular-nums' }}>
            <b style={{ color: PURPLE, fontWeight: 900 }}>{Math.min(rep + 1, reps)}</b>/{reps}
          </span>
          {/* 쉬는 시간 — 영상을 멈추고 남은 초를 센다 */}
          {rest > 0 && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, background: 'rgba(255,255,255,0.86)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: SUB }}>
                {switching ? '자리 바꾸는 시간' : '쉬는 시간'}
              </span>
              <span style={{ fontSize: 54, fontWeight: 900, color: PURPLE, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{rest}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: SUB }}>
                다음은 {twoPhase ? (secondSide ? '왼쪽 ' : '오른쪽 ') : ''}{done + 1}세트째예요
              </span>
              <button type="button" onClick={() => setRest(0)}
                style={{ marginTop: 6, border: 'none', background: NAME_BG, color: NAME_INK, borderRadius: 999,
                  padding: '7px 15px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                바로 시작 →
              </button>
            </div>
          )}
        </div>
      ) : (
        // 표지 — 인스타 게시물 비율(4:5). 영상이 있으면 0~5초가 소리 없이 돌아간다.
        <div style={{ position: 'relative' }}>
          <CurationThumb item={card} radius={0} ratio="4 / 5" showRead={false} clip={card.video_url || ''} emptyText="동작 영상 없음" />
          {/* 오른쪽 아래 — 조회·저장 */}
          <div style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 2, pointerEvents: 'none', color: INK,
            fontSize: 11.5, fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap', textShadow: SHADE }}>
            조회 {fmt(card.view_count)} · 저장 {fmt(card.save_count)}
          </div>
          {/* 왼쪽 위 — 타겟 부위(연보라) / 연관 부위(검정) */}
          {(core.length > 0 || related.length > 0) && (
            <div style={overlay('left')}>
              {core.length > 0 && <div style={{ color: GOLD }}>{core.join(', ')}</div>}
              {related.length > 0 && <div style={{ color: INK, fontSize: 10.5, fontWeight: 700 }}>({related.join(', ')})</div>}
            </div>
          )}
          {/* 오른쪽 위 — 도구(골드) */}
          {tools.length > 0 && (
            <div style={{ ...overlay('right'), color: GOLD }}>
              {tools.map((t, i) => <div key={i}>{t}</div>)}
            </div>
          )}
        </div>
      )}

      {/* AI 음성 — 화면에는 조절 막대만 두고, 소리는 이 태그가 낸다 */}
      {started && hasVoice && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 15px 0' }}>
          <audio ref={audioRef} src={nowVoice || undefined} preload="auto"
            onEnded={() => { if (stage === 'open') setStage('move'); else setMentDone(setKey); }} style={{ display: 'none' }} />
          <audio ref={countRef} src={commonAt('count', rep + 1) || undefined} preload="auto" style={{ display: 'none' }} />
          <button type="button" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? '음성 끄기' : '음성 켜기'}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15,
              background: voiceOn ? SET_BG : '#fff', boxShadow: voiceOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
            {voiceOn ? '🔊' : '🔇'}
          </button>
          <input type="range" min={0} max={100} step={5} value={Math.round(vol * 100)} aria-label="음성 크기"
            onChange={(e) => { setVol(Number(e.target.value) / 100); setVoiceOn(true); }}
            style={{ flex: 1, minWidth: 0, accentColor: '#C9A227' }} />
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: SUB, width: 62, textAlign: 'right' }}>
            {stage === 'open' ? '준비 멘트' : rest > 0 ? '쉬는 멘트' : mentOn ? '동작 멘트' : '숫자 세기'}
          </span>
        </div>
      )}

      <div style={{ padding: '12px 15px 15px' }}>
        {stage !== 'move' && optBox}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 8 }}>
          <button onClick={() => { if (started) { if (onMakeRoutine) onMakeRoutine(card); } else start(); }}
            style={{ flex: 1, minWidth: 0, padding: 13, borderRadius: 13, border: 'none', background: '#fff', color: INK,
              fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: KEEP_SHADOW }}>
            {started ? '플리 루틴 만들기 ＋' : '바로 따라하기 →'}
          </button>
          {!started && (
            <button type="button" onClick={(e) => { e.stopPropagation(); if (onSave) onSave(); }}
              style={{ flexShrink: 0, padding: '0 16px', borderRadius: 13, border: 'none', background: KEEP_BG, color: KEEP_INK,
                fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.25,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span>보관</span><span>하기</span>
            </button>
          )}
        </div>
        {stage === 'move' && <div style={{ marginTop: 10 }}>{optBox}</div>}
        <AiNote top={10} />
        {script && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ fontSize: 11.5, color: SUB, fontWeight: 700, cursor: 'pointer' }}>음성 안내 대본 보기</summary>
            <div style={{ fontSize: 13, margin: '8px 0 0' }}><BodyPreview text={script} /></div>
          </details>
        )}
      </div>
    </article>
  );
}
