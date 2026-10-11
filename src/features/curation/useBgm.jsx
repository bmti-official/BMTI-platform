// 배경음악 — 바디플리와 바디카드가 함께 쓴다.
//
// 음악은 세 도막으로 흐른다.
//   도입부 — 열 때 한 번
//   중간   — 도입부 끝자락에서 이어받아 계속 돈다
//   마무리 — 마지막 세트에서 이어받아 한 번
// 도막이 바뀔 땐 1.5초 겹쳐 넘어간다 — 앞 도막이 줄어드는 만큼 뒤 도막이 올라와, 합친 크기는 그대로다.
// 중간 도막이 되돌 때도 같은 방식으로, 끝자락에 처음을 겹쳐 잇는다(플레이어 두 대가 번갈아 튼다).
// 멘트가 흐를 땐 저절로 작아지고, 오프닝·마무리 멘트에는 아예 쉰다.
// 크기를 정하는 일은 bgmMixer가 맡는다(아이폰은 audio.volume이 듣지 않는다).
import { useEffect, useRef, useState } from 'react';
import { bgmNoFor, BGM_GROUPS, bgmSet, XFADE_SEC } from './voiceCommon';
import BgmPanel from './BgmPanel';
import { VOL_STEPS, VOL_START, hasSong } from './bgmBits';
import { setLevel, canControl } from './bgmMixer';

const DUCK_RATE = 0.35;              // 멘트가 흐를 땐 이만큼만 남긴다
const PRELOAD_SEC = 10;              // 되돌기 이만큼 전에 다음 플레이어를 미리 받아 둔다
const TICK_MS = 120;

// 켬·끔, 크기, 고른 곡은 이 브라우저에 적어 둔다 — 한 번 끄면 다음 동작에서도 꺼져 있게.
const PREF_KEY = 'bmti_bgm';
const readPref = () => {
  try { const v = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
};
const writePref = (patch) => {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...readPref(), ...patch })); } catch { /* 적지 못해도 음악은 그대로 돈다 */ }
};

const clamp01 = (v) => Math.max(0, Math.min(1, v));
// 겹쳐 넘길 때 — 나가는 쪽과 들어오는 쪽의 크기. 합친 세기가 일정하게 느껴지는 굽이다.
const fadeOut = (t) => Math.cos(clamp01(t) * Math.PI / 2);
const fadeIn = (t) => Math.sin(clamp01(t) * Math.PI / 2);
// 끝까지 간 태그는 다시 틀지 않는다 — play()는 끝난 곡을 처음부터 다시 틀어 버린다.
// (끝났다는 소식이 화면에 닿기 전 짧은 틈에 시계가 한 번 더 돌 수 있다)
const play = (a) => { if (a && a.src && a.paused && !a.ended) { try { a.play().catch(() => {}); } catch { /* 무시 */ } } };
const stop = (a) => { if (a && !a.paused) { try { a.pause(); } catch { /* 무시 */ } } };
const rewind = (a) => { if (a) { try { a.currentTime = 0; } catch { /* 무시 */ } } };
const leftOf = (a) => (a && a.duration > 0 ? a.duration - a.currentTime : 99);

/**
 * quiet  파트너가 말하는 동안(오프닝·마무리)이나 멈춰 둔 동안 — 음악을 세운다
 * pad    곡 고르는 칸의 바깥 여백
 * 돌려주는 것 { hasMusic, audios(소리 태그), panel(켬·끔·크기·곡 고르기), toOutro(마무리 도막으로) }
 */
export function useBgm({ common, bmtiCode, quiet, pad = '0 14px 26px' }) {
  const [picked, setPicked] = useState(() => {
    const p = readPref();
    return BGM_GROUPS.some((g) => g.n === p.no) ? p.no : bgmNoFor(bmtiCode);
  });
  const [musicOn, setMusicOn] = useState(() => readPref().on !== false);
  const [volNo, setVolNo] = useState(() => {
    const v = readPref().vol;
    return Number.isInteger(v) && v >= 0 && v < VOL_STEPS.length ? v : VOL_START;
  });
  const introRef = useRef(null);
  const loopARef = useRef(null);
  const loopBRef = useRef(null);
  const outroRef = useRef(null);
  // 중간 도막을 지금 트는 플레이어 — 0이면 A, 1이면 B. 되돌 때마다 바뀐다.
  const loopNo = useRef(0);

  // 골라 둔 곡이 아직 올라와 있지 않으면 올라와 있는 곡으로 물러난다
  const bgmNo = hasSong(common, picked) ? picked : (BGM_GROUPS.find((g) => hasSong(common, g.n))?.n ?? picked);
  const bgm = bgmSet(common, bgmNo);
  const hasMusic = !!(bgm.intro || bgm.loop || bgm.outro);

  const loud = VOL_STEPS[volNo];
  // 지금 어느 도막인가 — 'intro' | 'loop' | 'outro'
  const [part, setPart] = useState('intro');
  // 마무리로 넘어간 때 — 겹치는 동안 크기를 얼마나 옮겼는지 재는 데 쓴다.
  const outroFrom = useRef(0);
  // 마무리가 끝났는데 아직 하는 중이면 중간이 다시 흐른다 — 그 돌아온 때. 뚝 튀어나오지 않고 천천히 올라오게 한다.
  const backFrom = useRef(0);

  // 도입부가 없는 곡이면 처음부터 중간으로 친다 — 따로 되돌릴 일이 없다.
  const live = part === 'intro' && !bgm.intro ? 'loop' : part;

  // 틀고 세우기와 크기 맞추기 — 한 시계가 맡는다.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    const step = () => {
      const iA = introRef.current, oA = outroRef.current;
      const loops = [loopARef.current, loopBRef.current];
      const cur = loops[loopNo.current], nxt = loops[1 - loopNo.current];
      const mine = [iA, oA, ...loops].filter(Boolean);
      // 크기를 조절할 길이 없는 기기에서는 틀지 않는다(음성을 덮는다)
      const on = musicOn && !quiet && canControl();
      if (!on) { mine.forEach((a) => { stop(a); setLevel(a, 0); }); return; }

      const talking = [...document.querySelectorAll('audio')]
        .some((el) => !mine.includes(el) && !el.paused && !el.muted && el.currentTime > 0);
      const base = loud * (talking ? DUCK_RATE : 1);

      // 도막마다 곱할 값 — 겹치는 동안에만 1보다 작아진다
      let gI = 0, gO = 0, gCur = 0, gNxt = 0;
      if (live === 'intro') {
        play(iA);
        // 도입부 끝자락 — 중간을 틀어 겹쳐 넘긴다
        const t = (XFADE_SEC - leftOf(iA)) / XFADE_SEC;
        gI = fadeOut(t);
        if (t > 0 && cur) { play(cur); gCur = fadeIn(t); }
      } else if (live === 'outro') {
        play(oA);
        const t = (Date.now() - outroFrom.current) / (XFADE_SEC * 1000);
        gO = oA && oA.src ? fadeIn(t) : 0;
        // 중간(과, 아직 흐르고 있다면 도입부)은 겹치는 동안 줄어들다 선다
        const down = fadeOut(t);
        if (t >= 1) { loops.forEach(stop); stop(iA); } else { gCur = down; gNxt = nxt && !nxt.paused ? down : 0; gI = iA && !iA.paused ? down : 0; }
      } else {
        stop(iA); stop(oA);
        play(cur);
        // 되돌기 — 끝자락에 다음 플레이어를 처음부터 틀어 겹쳐 잇는다
        const left = leftOf(cur);
        if (nxt && nxt.src) {
          if (left <= PRELOAD_SEC && nxt.paused && nxt.readyState === 0) { try { nxt.load(); } catch { /* 무시 */ } }
          const t = (XFADE_SEC - left) / XFADE_SEC;
          if (t > 0) {
            if (nxt.paused) { rewind(nxt); play(nxt); }
            gCur = fadeOut(t); gNxt = fadeIn(t);
          } else { gCur = 1; if (!nxt.paused) { stop(nxt); rewind(nxt); } }
        } else gCur = 1;
        // 마무리가 끝나 다시 돌아온 참이면 1.5초에 걸쳐 올라온다
        if (backFrom.current) {
          const up = (Date.now() - backFrom.current) / (XFADE_SEC * 1000);
          if (up >= 1) backFrom.current = 0; else { gCur *= fadeIn(up); gNxt *= fadeIn(up); }
        }
      }
      setLevel(iA, base * gI);
      setLevel(oA, base * gO);
      setLevel(cur, base * gCur);
      setLevel(nxt, base * gNxt);
    };
    step();
    const tick = setInterval(step, TICK_MS);
    return () => clearInterval(tick);
  }, [musicOn, loud, quiet, live, bgm.intro, bgm.loop, bgm.outro]);

  // 중간 도막이 끝까지 가면 — 겹쳐 틀어 둔 다음 플레이어가 이어받는다
  const loopEnded = (no) => {
    if (loopNo.current !== no) return;
    const done = no === 0 ? loopARef.current : loopBRef.current;
    loopNo.current = 1 - no;
    rewind(done);
  };

  // 마지막 세트에 닿으면 마무리 도막으로 넘어간다.
  const toOutro = () => {
    if (!bgm.outro || live === 'outro') return;
    outroFrom.current = Date.now();
    rewind(outroRef.current);
    setPart('outro');
  };

  const audios = (
    <>
      {/* 배경음악 — 도입부 · 중간(두 대가 번갈아) · 마무리. 믹서로 흘리려면 crossOrigin이 있어야 한다 */}
      {bgm.intro && <audio ref={introRef} src={bgm.intro} crossOrigin="anonymous" preload="auto" data-bgm="intro" style={{ display: 'none' }}
        onEnded={() => setPart((k) => (k === 'intro' ? 'loop' : k))} />}
      {bgm.loop && <audio ref={loopARef} src={bgm.loop} crossOrigin="anonymous" preload="auto" data-bgm="loop-a" style={{ display: 'none' }}
        onEnded={() => loopEnded(0)} />}
      {bgm.loop && <audio ref={loopBRef} src={bgm.loop} crossOrigin="anonymous" preload="none" data-bgm="loop-b" style={{ display: 'none' }}
        onEnded={() => loopEnded(1)} />}
      {bgm.outro && <audio ref={outroRef} src={bgm.outro} crossOrigin="anonymous" preload="auto" data-bgm="outro" style={{ display: 'none' }}
        onEnded={() => { backFrom.current = Date.now(); setPart((k) => (k === 'outro' ? 'loop' : k)); }} />}
    </>
  );

  // 어떤 음악인지 · 바꾸기
  const panel = hasMusic ? (
    <BgmPanel pad={pad} common={common} musicOn={musicOn} volNo={volNo} bgmNo={bgmNo}
      onToggle={() => { writePref({ on: !musicOn }); setMusicOn(!musicOn); }}
      onVol={(i) => { writePref({ vol: i }); setVolNo(i); }}
      onSong={(n) => {
        writePref({ no: n }); setPicked(n);
        // 처음부터 다시 — 같은 곡을 다시 골라도 도입부부터 흐르게 모두 되감는다
        [introRef, loopARef, loopBRef, outroRef].forEach((r) => { stop(r.current); rewind(r.current); });
        setPart('intro'); outroFrom.current = 0; backFrom.current = 0; loopNo.current = 0;
      }} />
  ) : null;

  return { hasMusic, audios, panel, toOutro };
}
