// 배경음악 — 바디플리와 바디카드가 함께 쓴다.
//
// 음악은 세 도막으로 흐른다.
//   도입부 — 열 때 한 번
//   중간   — 도입부 끝자락에서 이어받아 계속 돈다
//   마무리 — 마지막 세트에서 이어받아 한 번
// 도막이 바뀔 땐 3초 겹쳐 넘어가고, 겹치는 동안 도입부·마무리가 앞에 선다.
// 멘트가 흐를 땐 저절로 작아지고, 오프닝·마무리 멘트에는 아예 쉰다.
import { useEffect, useRef, useState } from 'react';
import { bgmNoFor, BGM_GROUPS, bgmSet, bgmFade, XFADE_SEC, UNDER } from './voiceCommon';
import BgmPanel from './BgmPanel';
import { VOL_STEPS, VOL_START, hasSong } from './bgmBits';

const DUCK_RATE = 0.35;              // 멘트가 흐를 땐 이만큼만 남긴다

// 켬·끔, 크기, 고른 곡은 이 브라우저에 적어 둔다 — 한 번 끄면 다음 동작에서도 꺼져 있게.
const PREF_KEY = 'bmti_bgm';
const readPref = () => {
  try { const v = JSON.parse(localStorage.getItem(PREF_KEY) || 'null'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
};
const writePref = (patch) => {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...readPref(), ...patch })); } catch { /* 적지 못해도 음악은 그대로 돈다 */ }
};

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
  const loopRef = useRef(null);
  const outroRef = useRef(null);

  // 골라 둔 곡이 아직 올라와 있지 않으면 올라와 있는 곡으로 물러난다
  const bgmNo = hasSong(common, picked) ? picked : (BGM_GROUPS.find((g) => hasSong(common, g.n))?.n ?? picked);
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

  // 마지막 세트에 닿으면 마무리 도막으로 넘어간다.
  const toOutro = () => {
    if (!bgm.outro || live === 'outro') return;
    outroFrom.current = Date.now();
    setPart('outro');
  };

  const audios = (
    <>
      {/* 배경음악 세 도막 — 중간만 되돈다 */}
      {bgm.intro && <audio ref={introRef} src={bgm.intro} preload="auto" style={{ display: 'none' }}
        onEnded={() => setPart((k) => (k === 'intro' ? 'loop' : k))} />}
      {bgm.loop && <audio ref={loopRef} src={bgm.loop} loop preload="auto" style={{ display: 'none' }} />}
      {bgm.outro && <audio ref={outroRef} src={bgm.outro} preload="auto" style={{ display: 'none' }}
        onEnded={() => setPart((k) => (k === 'outro' ? 'loop' : k))} />}
    </>
  );

  // 어떤 음악인지 · 바꾸기
  const panel = hasMusic ? (
    <BgmPanel pad={pad} common={common} musicOn={musicOn} volNo={volNo} bgmNo={bgmNo}
      onToggle={() => { writePref({ on: !musicOn }); setMusicOn(!musicOn); }}
      onVol={(i) => { writePref({ vol: i }); setVolNo(i); }}
      onSong={(n) => { writePref({ no: n }); setPicked(n); setPart('intro'); outroFrom.current = 0; }} />
  ) : null;

  return { hasMusic, audios, panel, toOutro };
}
