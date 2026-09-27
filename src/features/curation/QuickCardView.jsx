// 손님에게 보이는 바로카드 — 인스타 게시물처럼.
//  ① 종류·시간·제목·완주율  ② 추천 유형 누끼 캐릭터  ③ 4:5 표지(부위·도구를 모서리에 얹는다)
//  ④ 조회·저장 + 보관하기   ⑤ 바로 따라하기
// 관리자 미리보기에서 먼저 쓰고, 공개할 때 사용자 화면에서 그대로 import한다.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CurationThumb, CharPic } from './CurationCard';
import PartnerStage from './PartnerStage';
import FullWrap from './FullWrap';
import { partnerBtn } from './partnerBtn';
import { CHARACTER_NAMES } from '../../lib/bmtiTypes';
import { CHARACTERS } from '../../data';
import { loadVoiceAssets, loadHello, voiceKey, COUNTDOWN_AT } from './voiceCommon';
import { axisOf } from './typeTint';
import { markFinish } from '../../lib/cardFinish';
import { HELLO_LINE } from './helloLine';
import { finishLine } from './finishLine';
import { cardSetup, REST_LIST } from './cardDefaults';
import AiNote from './AiNote';
import { KEY_TO_PART_LABEL } from '../../lib/diaryEntryLabels';
import { KIND_LABEL, pickCardTone, fmtCount as fmt, mmss, clipY, subLines, subY } from './format';

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

const RESTS = REST_LIST;
// 좌우를 번갈아 못 하는 동작은, 오른쪽을 다 하고 왼쪽으로 자세를 고쳐 누워야 해서 넉넉히 쉰다.
const SWITCH_REST = 20;
// right/left  한쪽만 · both  오른쪽을 다 하고 왼쪽으로 · alt  한 번 할 때마다 좌우가 바뀐다
const SIDES = [['right', '우'], ['left', '좌'], ['both', '한쪽씩 둘 다'], ['alt', '좌우 번갈아']];
const SIDE_KO = Object.fromEntries(SIDES);
// 배속 — 영상만 빨라지거나 느려진다. 설명·멘트 음성은 늘 원래 속도(빨리 틀면 알아듣기 어렵다).
// 숫자 세기는 영상이 한 바퀴 돌 때마다 나오므로 저절로 박자를 따라간다.
// 고른 속도는 기억해 두고 바로카드·바로플리 어디서나 같이 쓴다.
const SPEEDS = [0.75, 1, 1.25, 1.5];
const SPEED_KEY = 'bmti_card_speed';
const readSpeed = () => { try { const v = Number(localStorage.getItem(SPEED_KEY)); return SPEEDS.includes(v) ? v : 1; } catch { return 1; } };

export default function QuickCardView({ card, tone = 'z', bmtiCode, onStart, onSave, onMakeRoutine, charImages, charCodes, skipOpening = true, autoStart = false, full: fullProp, onFull, onAllDone, hideFinish = true, onQuiet, onFinalStretch,
  // 하나씩 넘겨 보는 화면(CardFeed)에서만 — 카드를 뒤집어 뒷면에 알아 두기를 보여 주고,
  // '바로 따라하기'를 누르면 곧장 전체 화면으로 간다(바로플리처럼).
  flippable = false, fullOnStart = false }) {
  const { title } = pickCardTone(card, tone);
  // 표지 → 누끼 캐릭터의 오프닝 설명 → 동작. 셋 다 같은 4:5다.
  const [stage, setStage] = useState('cover');
  // 전체 화면 — 바로플리는 동작이 바뀌어도 그대로여야 해서 바깥에서 쥐어 줄 수도 있다.
  const [fullSelf, setFullSelf] = useState(false);
  const full = onFull ? !!fullProp : fullSelf;
  const setFull = (v) => (onFull ? onFull(v) : setFullSelf(v));
  const started = stage !== 'cover';
  // 몇 번, 몇 세트 할지는 손님이 정한다. 처음 값은 카드 종류에 맞춰 달라진다.
  const setup = useMemo(() => cardSetup(card), [card]);
  const [reps, setReps] = useState(setup.reps);
  const [sets, setSets] = useState(setup.sets);
  const [done, setDone] = useState(0);
  // 영상이 한 바퀴 돌 때마다 한 번씩 세고, 정한 횟수를 채우면 다음 세트로 넘어간다.
  const [rep, setRep] = useState(0);
  // 세트 사이 쉬는 시간 — 고른 초만큼 세다가 저절로 다음 세트를 시작한다.
  const [restSec, setRestSec] = useState(setup.rest);
  const [rest, setRest] = useState(0);
  // 지금 쉬는 시간이 몇 초짜리인지 — 멘트를 고를 때 쓴다(자리 바꿀 땐 20초).
  const [restLen, setRestLen] = useState(10);
  // 지금 쉬는 것이 '자리 바꾸기'인가 — 그때만 방향을 알려 주는 멘트가 나간다.
  const [switching, setSwitching] = useState(false);
  const clipRef = useRef(null);
  const resting = useRef(false);
  const [speed, setSpeedState] = useState(readSpeed);
  const [speedOpen, setSpeedOpen] = useState(false);
  const setSpeed = (v) => { setSpeedState(v); setSpeedOpen(false); try { localStorage.setItem(SPEED_KEY, String(v)); } catch { /* 무시 */ } };
  // 영상이 새로 붙어도(세트·좌우가 바뀌어도) 고른 속도를 그대로 입힌다
  useEffect(() => {
    const v = clipRef.current;
    if (v && v.playbackRate !== speed) { try { v.playbackRate = speed; v.defaultPlaybackRate = speed; } catch { /* 무시 */ } }
  });
  // 세트가 끝났는데 멘트가 아직이면, 멘트가 끝난 뒤에 넘어간다(다음 말과 겹치지 않게)
  const pendingRef = useRef(null);
  const pendingTimer = useRef(0);
  const voiceRoleRef = useRef('');
  // 좌우가 나뉘는 동작이면 어느 쪽을 할지 고른다.
  const [side, setSide] = useState(card.default_side || 'both');
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
  // 멘트가 덮고 지나간 회차 — 여기 적힌 자리는 숫자를 세지 않는다.
  const hush = useRef('');
  // 세트 멘트를 듣고 시작하니 그 길이도 예상 시간에 든다. 들어 본 것 중 가장 긴 것으로 잡는다.
  const [mentSec, setMentSec] = useState(0);
  const oneRep = clipSec > 0 ? clipSec : card.duration_sec;
  const perSet = oneRep > 0 ? Math.round((oneRep * reps) / speed) : 0;   // 배속만큼 짧아지거나 길어진다
  const rounds = sets * (twoPhase ? 2 : 1);
  const restTotal = twoPhase ? restSec * (sets - 1) * 2 + sideRest : restSec * Math.max(0, sets - 1);
  const totalSec = perSet > 0 ? perSet * rounds + restTotal + Math.round(mentSec) * rounds : 0;

  const restart = () => { pendingRef.current = null; clearTimeout(pendingTimer.current); setDone(0); setRep(0); setRest(0); setRestLen(restSec); setSwitching(false); setSecondSide(false); setAltFlip(false); setMentDone(''); setIntroDone(false); setCueDone(false); setPaused(false); };

  // 잠깐 멈추기 / 다시 하기 — 영상과 소리를 함께 세운다.
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    const v = clipRef.current, a = audioRef.current, c = countRef.current;
    [v, a, c].forEach((el) => { if (!el) return; try { if (next) el.pause(); } catch { /* 무시 */ } });
    if (next) return;
    // 이어서 — 멈췄던 설명·멘트를 그 자리부터 다시 튼다. 이걸 빼먹으면 설명이 끝나지 않아
    // 영상도 영영 '설명을 기다리는' 채로 멈춰 있다.
    if (a && voiceOn && a.src && !a.ended && a.currentTime > 0) { try { a.play().catch(() => {}); } catch { /* 무시 */ } }
    // 영상은 설명을 듣는 중이 아니고, 멘트가 끝나기를 기다리는 중도 아닐 때만
    const waiting = introOn || cueOn || !!pendingRef.current;
    if (v && rest === 0 && !allDone && !waiting) { try { v.play().catch(() => {}); } catch { /* 무시 */ } }
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
    // 설명을 듣는 동안에는 한 바퀴를 돌았어도 세지 않는다.
    // 멈추라고 했는데도 브라우저가 한두 바퀴 더 돌려 버리는 일이 있어, 여기서 한 번 더 막는다.
    if (holdRef.current) { try { v.pause(); v.currentTime = 0; } catch { /* 무시 */ } return; }
    const again = () => { try { v.currentTime = 0; v.play().catch(() => {}); } catch { /* 무시 */ } };
    // 세트를 넘길 땐 곧장 잇지 않고, 고른 만큼 쉬었다 간다.
    const breathe = (n, isSwitch = false) => {
      try { v.pause(); } catch { /* 무시 */ }
      setSwitching(isSwitch); setRestLen(n); setRest(n);
    };
    if (side === 'alt') setAltFlip((f) => !f);
    if (rep + 1 < reps) { setRep(rep + 1); again(); return; }
    const finishSet = () => {
      if (done + 1 < sets) { setRep(0); setDone(done + 1); breathe(restSec); return; }
      if (twoPhase && !secondSide) { setRep(0); setDone(0); setSecondSide(true); setAltFlip(false); breathe(sideRest, true); return; }
      setRep(reps); setDone(sets);      // 다 채웠다. 여기서 멈춘다
    };
    // 세트 멘트가 아직 흐르는 중이면 멈춰 서서 기다린다 — 빠르게(배속) 할 때 특히 잦다.
    // 소리가 끝났다는 알림이 안 올 때를 대비해 남은 길이만큼 지나면 그냥 넘어간다.
    const a = audioRef.current;
    if (voiceRoleRef.current === 'ment' && a && !a.paused && !a.ended) {
      try { v.pause(); } catch { /* 무시 */ }
      pendingRef.current = finishSet;
      const left = Number.isFinite(a.duration) ? Math.max(0, a.duration - a.currentTime) : 6;
      clearTimeout(pendingTimer.current);
      pendingTimer.current = setTimeout(() => { const f = pendingRef.current; pendingRef.current = null; if (f) f(); }, (left + 1) * 1000);
      return;
    }
    finishSet();
  };
  // AI 음성 — 오프닝이 먼저 흐르고, 끝나면 세트 멘트로 넘어간다.
  // 음성과 자막을 같은 자리끼리 짝지어 읽는다. 중간이 비어도 어긋나지 않는다.
  const setClips = (tone === 'm' ? card.voice_sets_m : card.voice_sets_z) || [];
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
  const [introDone, setIntroDone] = useState(false);   // '시작 전 설명'을 들었는가 — 카드마다 한 번
  // 방향 알림은 따라하기를 시작할 때 딱 한 번만.
  // 세트마다 '오른쪽입니다'를 되풀이하면 잔소리가 된다.
  // 반대쪽으로 넘어갈 땐 자리 바꾸기 멘트가 방향을 알려 주고,
  // 그 뒤로는 영상 왼쪽 위에 오른쪽/왼쪽이 계속 떠 있다.
  const [cueDone, setCueDone] = useState(false);
  // 모든 카드가 함께 쓰는 소리 — 숫자·쉬는 시간·마무리
  const [common, setCommon] = useState({});
  const [hello, setHello] = useState({});
  const countRef = useRef(null);
  useEffect(() => {
    let alive = true;
    loadVoiceAssets().then((m) => { if (alive) setCommon(m); });
    loadHello().then((m) => { if (alive) setHello(m); });
    return () => { alive = false; };
  }, []);
  // 목소리는 '내 BMTI 파트너' 하나뿐이다. 말투(Z/M)로만 갈린다.
  const commonAt = (kind, n) => common[voiceKey(kind, tone, n)] || '';
  // 오프닝에서 내 파트너가 먼저 자기를 소개한다.
  const helloUrl = hello[String(bmtiCode || '').split('-')[0].toUpperCase()] || '';
  // 자막 — 소리를 못 켜는 자리에서도 따라 할 수 있게 한다.
  const [subOn, setSubOn] = useState(true);
  // 지금 흐르는 멘트가 얼마나 지났는지 — 오프닝 화면의 남은 시간 막대에 쓴다.
  const [said, setSaid] = useState({ at: 0, len: 0 });
  const myCode = axisOf(bmtiCode);
  const subSets = (tone === 'm' ? card.sub_sets_m : card.sub_sets_z) || [];
  // 첫 자리는 '시작 전 설명', 그 뒤가 1세트·2세트… 한마디다.
  const introClip = setClips[0] || '';
  const introSub = subSets[0] || '';
  // 올리지 않은 세트는 바로 앞 세트의 것을 이어서 쓴다. 시작 전 설명까지 내려가지는 않는다.
  const back = (list, i) => { for (let k = Math.min(i, list.length - 1); k >= 1; k -= 1) if (list[k]) return list[k]; return ''; };
  const mentClip = back(setClips, done + 1);
  const mentSub = back(subSets, done + 1);
  // 지금 어느 쪽을 하는가 — '좌우 번갈아'는 한 번마다 바뀌니 알리지 않는다.
  const nowSide = !card.has_side || side === 'alt' ? null : (twoPhase ? (secondSide ? 2 : 1) : (side === 'left' ? 2 : 1));
  const cueUrl = nowSide ? commonAt('side', nowSide) : '';
  // 멘트가 나가는 자리는 둘이다.
  //  ① 시작 전 설명 — 첫 세트를 시작하기 전에 멈춰 서서 길게. 화살표 설명 영상이 함께 돈다.
  //  ② 세트 한마디 — 세트마다 한가운데에서 짧게. 쉬는 시간 멘트와 붙지 않게 미뤄 둔 자리다.
  const firstSet = done === 0 && !secondSide;
  const midRep = Math.max(1, Math.round(reps / 2));
  const talk = stage === 'move' && guide && rest === 0 && !allDone;
  const introOn = talk && firstSet && !introDone && !!(introClip || introSub);
  const mentOn = talk && !introOn && rep + 1 >= midRep && !!(mentClip || mentSub) && mentDone !== setKey;
  // 방향은 설명이 다 끝난 뒤, 몸을 움직이기 바로 전에 한 마디로 알린다.
  // 설명 영상이 도는 동안 '오른쪽'이 먼저 튀어나오면 설명이 묻힌다.
  const cueOn = stage === 'move' && rest === 0 && !allDone && !!cueUrl && !cueDone && !introOn;
  const hasVoice = !!(helloUrl || introClip || mentClip || Object.keys(common).length);
  // 지금 이 칸에서 낼 숫자(또는 카운트다운) 소리
  const countUrl = (rest > 0 ? commonAt('countdown', 0) : commonAt('count', rep + 1)) || '';
  // 오프닝은 한 번만 — 다시 볼 땐 곧장 동작으로 간다.
  const [heardOpening, setHeardOpening] = useState(false);
  // 지금 흐를 멘트가 무엇인지 — 끝났을 때 무엇을 표시해 둘지 알아야 해서 갈래도 함께 들고 있는다.
  const voiceRole = !started ? ''
    : stage === 'open' ? 'hello'
      : rest > 0 ? 'rest'
        : allDone ? 'finish'
          : introOn ? 'intro'
            : cueOn ? 'cue'
              : mentOn ? 'ment' : '';
  useEffect(() => { voiceRoleRef.current = voiceRole; });
  // 설명·멘트(큰 음성)가 흐르는 중인가 / 숫자·카운트다운 채널을 끄고 켜기
  function talkingNow() { const m = audioRef.current; return !!(m && !m.paused && !m.ended); }
  function muteCount(on) { const c = countRef.current; if (c) c.muted = on; }
  const nowVoice = voiceRole === 'hello' ? helloUrl
    : voiceRole === 'rest' ? ((switching && commonAt('switch', 0)) || commonAt('rest', restLen))
      : voiceRole === 'finish' ? commonAt('finish', 0)
        : voiceRole === 'intro' ? introClip
          : voiceRole === 'cue' ? cueUrl
            : voiceRole === 'ment' ? mentClip : '';

  // 음성 파일이 아직 없어도 자막만으로 오프닝을 보여 준다.
  // 소리가 없으면 읽을 만큼만 세워 두었다가 저절로 동작으로 넘어간다.
  const openText = subLines(HELLO_LINE[myCode] || '');
  const beginOpening = !skipOpening && !heardOpening && !!(helloUrl || openText);
  const [flipped, setFlipped] = useState(false);
  const start = () => {
    restart();
    setFlipped(false);
    if (fullOnStart) setFull(true);
    if (beginOpening) { setHeardOpening(true); setStage('open'); } else setStage('move');
    if (onStart) onStart();
  };

  // 마지막 세트에 들어섰다고 한 번 알린다 — 바로플리가 마무리 음악을 깔 시점이다.
  const finalStretch = started && !allDone && done + 1 >= sets && (!twoPhase || secondSide);
  useEffect(() => {
    if (finalStretch && onFinalStretch) onFinalStretch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finalStretch]);

  // 파트너가 말하는 동안에는 음악이 쉬어야 한다 — 바로플리에 알려 준다.
  const quiet = stage === 'open' || (started && allDone);
  useEffect(() => {
    if (onQuiet) onQuiet(quiet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiet]);

  // 다 끝냈다고 한 번만 알린다 — 바로플리가 이어받아 다음 동작으로 넘긴다.
  useEffect(() => {
    if (allDone && onAllDone) onAllDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  // 한 세트를 마치면 '했음', 다 채우면 '완주'로 남긴다.
  // 일기를 열 때 '오늘 몇 번 하셨네요'로 채워 주는 데 쓴다.
  useEffect(() => {
    if (stage !== 'move') return;
    if (allDone) markFinish({ kind: 'card', cardId: card.id, done: true, setsDone: sets });
    else if (done >= 1) markFinish({ kind: 'card', cardId: card.id, done: false, setsDone: done });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, allDone, stage]);

  // 전체 화면일 땐 뒤쪽이 움직이지 않고, ESC로 빠져나온다.
  useEffect(() => {
    if (!full) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', esc); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [full]);

  // 음성 없이 자막만 올린 세트 멘트 — 읽을 참을 주고 스스로 끝낸다.
  useEffect(() => {
    if (introOn && !introClip) {
      const ms = Math.min(20000, 2200 + subLines(introSub).length * 110);
      const t = setTimeout(() => setIntroDone(true), ms);
      return () => clearTimeout(t);
    }
    if (mentOn && !mentClip) {
      const ms = Math.min(16000, 2200 + subLines(mentSub).length * 110);
      const t = setTimeout(() => setMentDone(setKey), ms);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [introOn, introClip, introSub, mentOn, mentClip, mentSub, setKey]);

  // 소리가 없는 오프닝 — 글자 수에 맞춰 읽을 참을 주고 넘어간다.
  // 소리가 있어도 브라우저가 막아 버리면 영영 멈춰 있으므로, 넉넉한 끝 시각을 함께 둔다.
  useEffect(() => {
    if (stage !== 'open') return undefined;
    const ms = nowVoice ? 15000 : Math.min(9000, 2600 + openText.length * 110);
    const t = setTimeout(() => setStage('move'), ms);
    return () => clearTimeout(t);
  }, [stage, nowVoice, openText]);

  // 바로플리에서는 버튼을 누르지 않아도 바로 이어진다.
  useEffect(() => {
    if (!autoStart || stage !== 'cover') return undefined;
    // 한 박자 쉬었다 시작해야 소리와 영상이 함께 준비된 뒤에 출발한다.
    const t = setTimeout(() => start(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, card.id]);

  // 멘트가 바뀌면 처음부터 다시 틀어 준다.
  // 틀 것이 없어졌을 때 세워 두지 않으면, 앞 멘트가 남아서 계속 흐른다.
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!nowVoice) { try { a.pause(); } catch { /* 무시 */ } return; }
    a.volume = vol;
    a.muted = !voiceOn;
    if (!voiceOn) return;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
  }, [nowVoice, voiceOn, vol]);

  // 숫자 세기 — 한 바퀴마다 하나씩. 멘트가 흐르는 동안은 쉰다.
  useEffect(() => {
    if (stage !== 'move' || rest > 0 || allDone || !voiceOn) return;
    const tag = `${setKey}-${rep}`;
    // 멘트가 덮고 지나간 회차는 표시해 두고 건너뛴다.
    // 멘트가 끝난 자리에서 뒤늦게 세면 다음 숫자와 바짝 붙어 두 번 세는 것처럼 들린다.
    if (introOn || mentOn || cueOn) { hush.current = tag; return; }
    if (hush.current === tag) return;
    const url = commonAt('count', rep + 1);
    const a = countRef.current;
    if (!a || !url) return;
    a.volume = vol;
    try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep, done, secondSide, stage, rest, introOn, mentOn, cueOn, voiceOn]);

  // 멘트가 흐르는 동안에는 첫 자세로 멈춰 선다.
  // 영상이 계속 돌면 회차가 지나가 버려, 멘트가 끝난 뒤 숫자가 '넷'부터 튀어나온다.
  // 멈춰 두면 멘트가 끝나고 늘 '하나'부터 셀 수 있다.
  // 멈춰 서서 듣는 건 1세트뿐이다. 2세트부터는 하면서 듣는다.
  const holding = stage === 'move' && rest === 0 && !allDone && !paused && (introOn || cueOn);
  // 지금 멈춰 서 있어야 하는지 — 이벤트 안에서도 바로 볼 수 있게 들고 있는다.
  const holdRef = useRef(false);
  useEffect(() => {
    holdRef.current = holding;
    const v = clipRef.current;
    if (!v || stage !== 'move' || rest > 0 || allDone || paused) return;
    if (holding) { try { v.pause(); v.currentTime = 0; } catch { /* 무시 */ } }
    else { try { v.play().catch(() => {}); } catch { /* 무시 */ } }
  }, [holding, stage, rest, allDone, paused]);

  // 한 해씩 줄이다가 0이 되면 다음 세트를 저절로 시작한다.
  useEffect(() => {
    if (rest > 0) {
      resting.current = true;
      if (paused) return undefined;
      const t = setTimeout(() => {
        const next = rest - 1;
        // 4초 남으면 '셋, 둘, 하나, 시작!'이 나간다. 쉬는 멘트와 채널이 달라 서로 자르지 않는다.
        if (next === COUNTDOWN_AT && voiceOn) {
          const a = countRef.current;
          if (a && commonAt('countdown', 0)) {
            a.volume = vol;
            const m = audioRef.current;
            a.muted = !!(m && !m.paused && !m.ended);   // 쉬는 멘트와 겹치면 겹치는 동안은 소리 없이
            try { a.currentTime = 0; a.play().catch(() => {}); } catch { /* 무시 */ }
          }
        }
        setRest(next);
      }, 1000);
      return () => clearTimeout(t);
    }
    if (resting.current) {
      resting.current = false;
      const v = clipRef.current;
      if (v) { try { v.currentTime = 0; v.play().catch(() => {}); } catch { /* 무시 */ } }
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest, paused, voiceOn, vol]);

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
  const chars = (charImages || []).slice(0, 4);   // 오프닝 화면에서만 쓴다
  // 오프닝에 서는 건 '내 파트너'다. 카드에 골라 둔 캐릭터가 아니라 내 유형에서 찾는다.
  const partnerImg = CHARACTERS.find((c) => c.id === myCode)?.image || chars[0] || '';
  const partnerName = String(CHARACTER_NAMES[myCode] || CHARACTER_NAMES[(charCodes || [])[0]] || '').replace(/\n/g, ' ');
  // 지금 흐르는 소리에 딸린 자막
  const sayNow = subLines(voiceRole === 'hello' ? (HELLO_LINE[myCode] || '')
    : voiceRole === 'finish' ? finishLine(tone)
      : voiceRole === 'intro' ? introSub
        : voiceRole === 'ment' ? mentSub : '');
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
              {setup.repList.map((n) => <option key={n} value={n}>{n}회</option>)}
            </select>
            {label('세트')}
            <select value={sets} onChange={(e) => change(setSets)(Number(e.target.value))} style={dropdown}>
              {setup.setList.map((n) => <option key={n} value={n}>{n}세트</option>)}
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

  const front = (
    <article style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
      <style>{FULLSCREEN_FIX}</style>
      {stage !== 'move' && (
      <div style={{ padding: '12px 15px 10px' }}>
        {/* 동작 이름표(Z·M 공통) + 제목 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
          {/* 종류 이름표 — 글자와 색이 함께 종류를 말해 준다 */}
          <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 900, color: KIND_INK[card.kind] || PURPLE,
            background: '#fff', borderRadius: 10, padding: '5px 11px', boxShadow: `inset 0 0 0 1px ${LINE}`,
            lineHeight: 1.25, whiteSpace: 'nowrap' }}>
            {KIND_LABEL[card.kind] || card.kind}
          </span>
          <h3 style={{ flex: 1, minWidth: 0, fontSize: 15.5, fontWeight: 800, lineHeight: 1.4, margin: 0, wordBreak: 'keep-all' }}>{title}</h3>
          {flippable && !started && (
            <button type="button" onClick={() => setFlipped(true)} aria-label="설명 보기"
              style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#fff',
                borderRadius: 10, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, color: SUB, whiteSpace: 'nowrap',
                boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              설명 보기 ↻
            </button>
          )}
        </div>
      </div>
      )}

      {/* 따라하는 중 — 영상 위에 무엇을 몇 번 하는지 적고, 옆에 처음부터 다시 */}
      {stage === 'move' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 15px 10px' }}>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 800, color: INK, wordBreak: 'keep-all' }}>
            총 {reps}회 · {sets}세트{card.has_side ? ` · ${SIDE_KO[side]}` : ''}{paused ? ' · 멈춤' : ''}
          </span>
          {/* 설명을 듣는 동안에는 멈출 것도 되돌릴 것도 없다. 그 자리를 건너뛰기가 쓴다. */}
          {introOn ? (
            <button type="button" onClick={() => setIntroDone(true)}
              style={{ flexShrink: 0, padding: '6px 12px', fontSize: 11.5, fontWeight: 800, fontFamily: 'inherit',
                borderRadius: 14, border: 'none', background: NAME_BG, color: NAME_INK, cursor: 'pointer',
                lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              설명 건너뛰기 →
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {stage === 'open' ? (
        // 오프닝 — 내 파트너가 말을 건네는 자리. 이 몇 초가 자세를 잡는 시간이기도 하다.
        <FullWrap on={full}>
          <PartnerStage code={myCode} img={partnerImg} name={partnerName} say={subOn ? sayNow : ''}
            at={said.at} len={said.len} clip={card.video_url || ''}>
            <button type="button" onClick={() => setStage('move')} style={partnerBtn}>바로 동작 보기 →</button>
          </PartnerStage>
        </FullWrap>
      ) : started && allDone && !hideFinish ? (
        // 마무리 — 오프닝과 같은 자리에서 파트너가 끝인사를 한다.
        <FullWrap on={full}>
          <PartnerStage code={myCode} img={partnerImg} name={partnerName} say={subOn ? sayNow : ''}
            at={said.at} len={said.len} clip={card.video_url || ''}>
            <button type="button" onClick={() => { restart(); setStage('move'); }} style={partnerBtn}>한 번 더 하기 ↻</button>
          </PartnerStage>
        </FullWrap>
      ) : started && hasPlay ? (
        // 실제 동작 — 표지와 같은 4:5. 전체 화면에서도 이 비율 그대로 키우기만 한다.
        // 그래야 위에 얹은 글씨가 화면 꼭대기가 아니라 영상 안에 앉는다.
        <FullWrap on={full}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', background: '#F3F1EC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={clipRef} className="bmti-clip" src={card.video_url} autoPlay muted playsInline
            onLoadedMetadata={(e) => { const d = e.currentTarget.duration; if (d > 0 && Number.isFinite(d)) setClipSec(d); }}
            onEnded={onRepEnd}
            onPlay={(e) => {
              // autoplay가 뒤늦게 살아나 설명 중에 영상이 도는 일을 막는다
              if (!holdRef.current) return;
              const v = e.currentTarget;
              try { v.pause(); v.currentTime = 0; } catch { /* 무시 */ }
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `50% ${clipY(card)}%`,
              // 영상은 늘 오른쪽으로 찍는다. 왼쪽 차례엔 화면에서 좌우를 뒤집어 보여 준다.
              transform: mirrored ? 'scaleX(-1)' : 'none' }} />
          {/* 세트 전 설명 영상 — 멘트가 흐르는 동안 동작 영상 위에서 되돈다.
              화살표로 어디를 어떻게 움직이는지 짚어 주는 자리다. */}
          {holding && introOn && card.intro_url && (
            <video src={card.intro_url} muted playsInline autoPlay loop preload="auto"
              style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: `50% ${clipY(card)}%`, background: '#F3F1EC',
                transform: mirrored ? 'scaleX(-1)' : 'none' }} />
          )}

          {/* 지금 어디쯤인가 — 좌우·세트·횟수를 알약 하나에 모아 둔다 */}
          <div style={{ position: 'absolute', top: full ? 26 : 12, left: '50%', transform: 'translateX(-50%)',
            zIndex: 4, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 9,
            background: 'rgba(255,255,255,0.94)', borderRadius: 999, padding: '6px 14px',
            boxShadow: '0 2px 8px rgba(23,21,15,0.10)', whiteSpace: 'nowrap',
            fontSize: 14, fontWeight: 900, color: INK, letterSpacing: '-0.01em' }}>
            {card.has_side && !allDone && (
              <>
                <span style={{ color: PURPLE }}>{twoPhase ? (secondSide ? '왼쪽' : '오른쪽') : SIDE_KO[side]}</span>
                <span style={{ width: 1, height: 11, background: LINE }} />
              </>
            )}
            <span>
              {allDone ? '다 끝냈어요' : (<><b style={{ color: PURPLE }}>{done + 1}</b> 세트 중</>)}
            </span>
            {!allDone && (
              <>
                <span style={{ width: 1, height: 11, background: LINE }} />
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <b style={{ color: PURPLE }}>{Math.min(rep + 1, reps)}</b>/{reps}
                </span>
              </>
            )}
          </div>
          {/* 전체 화면에서는 위 버튼 줄이 보이지 않으니, 건너뛰기를 오른쪽 위에 둔다 */}
          {full && introOn && (
            <button type="button" onClick={() => setIntroDone(true)}
              style={{ position: 'absolute', top: 26, right: 12, zIndex: 7, border: 'none',
                background: NAME_BG, color: NAME_INK, borderRadius: 999, padding: '7px 14px',
                fontSize: 11.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(23,21,15,0.12)' }}>
              설명 건너뛰기 →
            </button>
          )}

          {/* 전체 화면으로 / 전체 화면에서는 아래에 설정 버튼 하나만 둔다 */}
          {!full ? (
            <button type="button" onClick={() => setFull(true)} aria-label="전체 화면으로"
              style={{ position: 'absolute', right: 10, top: 46, zIndex: 7, width: 30, height: 30, borderRadius: 9,
                border: 'none', background: '#fff', color: INK, fontSize: 13, fontWeight: 900,
                cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1, boxShadow: `inset 0 0 0 1px ${LINE}` }}>⛶</button>
          ) : (
            <div style={{ position: 'absolute', left: '50%', bottom: 'max(22px, env(safe-area-inset-bottom))',
              transform: 'translateX(-50%)', zIndex: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* 배속 — 누르면 네 단계 중에서 고른다. 보던 자리에서 속도만 바뀐다 */}
              <div style={{ position: 'relative' }}>
                {speedOpen && (
                  <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
                    background: '#fff', borderRadius: 14, padding: 4, boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
                    display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[...SPEEDS].reverse().map((x) => (
                      <button key={x} type="button" onClick={() => setSpeed(x)}
                        style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10, padding: '8px 14px',
                          fontSize: 13, fontWeight: 900, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums',
                          background: x === speed ? SET_BG : 'transparent', color: x === speed ? SET_INK : INK }}>
                        {x}×
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => setSpeedOpen((o) => !o)} aria-label="재생 속도"
                  style={{ border: 'none', background: '#fff', color: speed === 1 ? INK : SET_INK, borderRadius: 999,
                    padding: '11px 16px', fontSize: 13, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                    fontVariantNumeric: 'tabular-nums', boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
                  {speed}×
                </button>
              </div>
              {/* 설정 바꾸기 — 밑에 아주 작게 '(이전으로)'. 글씨는 버튼 줄의 높이를 흔들지 않게 띄워 둔다 */}
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setFull(false)}
                  style={{ border: 'none', background: '#fff',
                    color: INK, borderRadius: 999, padding: '11px 22px', fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
                  설정 바꾸기
                </button>
                <span style={{ position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, textAlign: 'center',
                  fontSize: 9, fontWeight: 700, color: SUB, pointerEvents: 'none', whiteSpace: 'nowrap' }}>(이전으로)</span>
              </div>
              {/* 일시정지 — 영상과 소리를 함께 세운다 */}
              <button type="button" onClick={togglePause} aria-label={paused ? '이어서 하기' : '일시정지'}
                style={{ border: 'none', background: paused ? SET_BG : '#fff', color: paused ? SET_INK : INK, borderRadius: 999,
                  width: 44, height: 42, fontSize: 15, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
                {paused ? '▶' : '❚❚'}
              </button>
            </div>
          )}

          {/* 자막 — 지금 흐르는 멘트를 영상 아래에 겹쳐 준다 */}
          {subOn && sayNow && rest === 0 && (
            <div style={{ position: 'absolute', left: 10, right: 10,
              // 아래로는 전체 화면의 '설정 바꾸기' 버튼까지만 내려간다.
              bottom: `${Math.min(76, Math.max(full ? 14 : 4, 100 - subY(card)))}%`,
              // 시작 전 설명은 알약보다 위에 둔다 — 처음 듣는 말이 가려지면 안 된다.
              // 세트 한마디는 짧게 스쳐 가니 알약(몇 세트째인지)이 위에 있는 게 낫다.
              zIndex: voiceRole === 'intro' ? 5 : 2,
              pointerEvents: 'none', display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.95)', borderRadius: 12,
                padding: '9px 11px', boxShadow: '0 2px 10px rgba(23,21,15,0.12)' }}>
                {voiceRole === 'intro' && (
                  <span style={{ display: 'inline-block', marginBottom: 4, fontSize: 10, fontWeight: 900,
                    color: NAME_INK, background: NAME_BG, borderRadius: 999, padding: '2px 8px' }}>
                    시작 전 설명
                  </span>
                )}
                <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.6,
                  wordBreak: 'keep-all', whiteSpace: 'pre-line' }}>{sayNow}</span>
              </div>
              {/* 내 파트너가 오른쪽에 서서 말해 주는 모양 */}
              {partnerImg && <CharPic src={partnerImg} code={myCode} h={54} />}
            </div>
          )}

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
        </FullWrap>
      ) : (
        // 표지 — 인스타 게시물 비율(4:5). 영상이 있으면 0~5초가 소리 없이 돌아간다.
        <div style={{ position: 'relative' }}>
          <CurationThumb item={card} radius={0} ratio="4 / 5" showRead={false} clip={card.video_url || ''} emptyText="동작 영상 없음" />
          {/* 오른쪽 아래 — 조회·저장 */}
          <div style={{ position: 'absolute', right: 10, bottom: 10, zIndex: 2, pointerEvents: 'none', color: INK,
            background: '#fff', borderRadius: 9, padding: '4px 9px',
            fontSize: 11.5, fontWeight: 800, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
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
          <audio ref={audioRef} key={nowVoice || 'none'} src={nowVoice || undefined} preload="auto"
            onLoadedMetadata={(e) => {
              const len = Number(e.currentTarget.duration) || 0;
              setSaid({ at: 0, len });
              if (voiceRole === 'ment' && len > 0) setMentSec((p) => Math.max(p, len));
            }}
            onTimeUpdate={(e) => {
              // 값은 여기서 읽어 둔다. 아래 갱신 함수는 나중에 불리는데,
              // 그때는 React가 currentTarget을 비워 버려 화면이 통째로 죽는다.
              const t = Number(e.currentTarget.currentTime) || 0;
              setSaid((p) => ({ at: t, len: p.len }));
            }}
            onEnded={() => {
              setSaid({ at: 0, len: 0 });
              if (voiceRole === 'hello') setStage('move');
              else if (voiceRole === 'intro') setIntroDone(true);
              else if (voiceRole === 'cue') setCueDone(true);
              else if (voiceRole === 'ment') {
                setMentDone(setKey);
                const f = pendingRef.current; pendingRef.current = null; clearTimeout(pendingTimer.current);
                if (f) f();
              }
              muteCount(false);   // 겹침이 끝났다 — 숫자·카운트다운을 다시 켠다
            }}
            // 설명·멘트가 나오는 동안엔 숫자·'셋, 둘, 하나, 시작!' 채널을 끈다 — 겹치는 부분은 안 들리게
            onPlay={() => muteCount(true)}
            onPause={() => muteCount(false)}
            style={{ display: 'none' }} />
          {/* 숫자 세기 · 카운트다운 — 여기도 주소를 key로 둔다.
              주소만 갈아 끼우면 브라우저가 앞 숫자를 마저 세어 버린다. */}
          <audio ref={countRef} key={countUrl || 'none'} src={countUrl || undefined}
            preload="auto" style={{ display: 'none' }}
            // 새로 붙을 때도 — 큰 음성이 흐르는 중이면 꺼 둔 채로 시작한다
            onPlay={() => muteCount(talkingNow())} />
          <button type="button" onClick={() => setVoiceOn((v) => !v)} aria-label={voiceOn ? '음성 끄기' : '음성 켜기'}
            style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15,
              background: voiceOn ? SET_BG : '#fff', boxShadow: voiceOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
            {voiceOn ? '🔊' : '🔇'}
          </button>
          <input type="range" min={0} max={100} step={5} value={Math.round(vol * 100)} aria-label="음성 크기"
            onChange={(e) => { setVol(Number(e.target.value) / 100); setVoiceOn(true); }}
            style={{ flex: 1, minWidth: 0, accentColor: '#C9A227' }} />
          <button type="button" onClick={() => setSubOn((v) => !v)} aria-label={subOn ? '자막 끄기' : '자막 켜기'}
            style={{ flexShrink: 0, height: 32, padding: '0 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, color: subOn ? SET_INK : SUB,
              background: subOn ? SET_BG : '#fff', boxShadow: subOn ? 'none' : `inset 0 0 0 1px ${LINE}` }}>
            자막
          </button>
          <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: SUB, width: 62, textAlign: 'right' }}>
            {stage === 'open' ? (voiceRole === 'hello' ? '파트너 인사' : '준비 멘트') : rest > 0 ? '쉬는 멘트' : cueOn ? '방향 알림' : mentOn ? '동작 멘트' : '숫자 세기'}
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
        {/* 하나씩 보는 화면 — 표지일 땐 뒷면에, 따라하다 '설정 바꾸기'로 나오면 아래에 펼쳐 둔다
            (전체 화면에선 영상만) */}
        {flippable ? (started && !full && <KnowAll card={card} />) : <KnowBox card={card} />}
      </div>
    </article>
  );

  // 뒤집기 — 표지일 때만. 따라하는 동안엔 3D 틀을 걷는다(틀이 있으면 전체 화면이 그 안에 갇힌다).
  if (!flippable || started) return front;
  return (
    <div style={{ perspective: 1400 }}>
      <div style={{ position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .6s cubic-bezier(.3,.7,.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'none' }}>
        <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>{front}</div>
        <div style={{ position: 'absolute', inset: 0, transform: 'rotateY(180deg)', backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16,
          overflowY: 'auto', padding: '16px 16px 20px', fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 900 }}>이 동작 알아 두기</span>
            <button type="button" onClick={() => setFlipped(false)} aria-label="앞면으로"
              style={{ flexShrink: 0, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: '#fff',
                borderRadius: 10, padding: '6px 10px', fontSize: 11.5, fontWeight: 800, color: SUB, whiteSpace: 'nowrap',
                boxShadow: `inset 0 0 0 1px ${LINE}` }}>
              앞면으로 ↺
            </button>
          </div>
          <KnowAll card={card} />
        </div>
      </div>
    </div>
  );
}

// 알아 두기 — 대본이 있던 자리를 대신한다.
//
// 대본은 어차피 귀로 듣는다. 눈으로 볼 자리에는 손이 먼저 가는 정보를 둔다.
// '피하세요'는 다치지 않게 하는 칸이라 늘 펼쳐 둔다. 나머지 둘은 접어 둔다.
const LINES = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);

function Rows({ items, color }) {
  return (
    <ul style={{ margin: '6px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
      {items.map((x) => (
        <li key={x} style={{ display: 'flex', gap: 6, fontSize: 12.5, lineHeight: 1.5, color: INK, wordBreak: 'keep-all' }}>
          <span style={{ flexShrink: 0, color, fontWeight: 900 }}>·</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );
}

// 알아 두기를 모두 펼쳐 보인다 — 카드 뒷면, 그리고 따라하는 동안 영상 아래.
// 차례: ① 이럴 때 좋습니다 ② 이럴 땐 하지 마세요 ③ 쓰는 곳
function KnowAll({ card }) {
  const good = LINES(card?.good_when);
  const avoid = LINES(card?.avoid_when);
  const focus = LINES(card?.focus_body);
  const head = (txt, color) => (
    <div style={{ fontSize: 12.5, fontWeight: 900, color, letterSpacing: '-0.01em' }}>{txt}</div>
  );
  const box = { padding: '11px 13px', borderRadius: 13, background: '#FAF7F0' };
  return (
    <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
      {good.length > 0 && <div style={box}>{head('👍 이럴 때 좋습니다', '#3F7F5B')}<Rows items={good} color="#3F7F5B" /></div>}
      {avoid.length > 0 && <div style={box}>{head('⛔ 이럴 땐 하지 마세요', '#B23B36')}<Rows items={avoid} color="#B23B36" /></div>}
      {focus.length > 0 && <div style={box}>{head('🎯 쓰는 곳', '#8A6A3A')}<Rows items={focus} color="#8A6A3A" /></div>}
    </div>
  );
}

function KnowBox({ card }) {
  const good = LINES(card?.good_when);
  const avoid = LINES(card?.avoid_when);
  const focus = LINES(card?.focus_body);
  const [open, setOpen] = useState(false);
  if (!good.length && !avoid.length && !focus.length) return null;

  const head = (txt, color) => (
    <span style={{ fontSize: 11.5, fontWeight: 900, color, letterSpacing: '-0.01em' }}>{txt}</span>
  );
  return (
    <div style={{ marginTop: 10, padding: '11px 13px', borderRadius: 13, background: '#FAF7F0' }}>
      {avoid.length > 0 && (
        <div>
          {head('⛔ 이럴 땐 하지 마세요', '#B23B36')}
          <Rows items={avoid} color="#B23B36" />
        </div>
      )}
      {(good.length > 0 || focus.length > 0) && (
        <>
          {open && (
            <div style={{ display: 'grid', gap: 10, marginTop: avoid.length ? 10 : 0 }}>
              {good.length > 0 && (
                <div>
                  {head('👍 이럴 때 좋습니다', '#3F7F5B')}
                  <Rows items={good} color="#3F7F5B" />
                </div>
              )}
              {focus.length > 0 && (
                <div>
                  {head('🎯 쓰는 곳', '#8A6A3A')}
                  <Rows items={focus} color="#8A6A3A" />
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={() => setOpen((v) => !v)}
            style={{ marginTop: 8, padding: 0, border: 'none', background: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800, color: SUB }}>
            {open ? '접기 ▲' : '이 동작 알아 두기 ▼'}
          </button>
        </>
      )}
    </div>
  );
}
