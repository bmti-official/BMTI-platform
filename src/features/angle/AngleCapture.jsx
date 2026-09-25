// 각도 재기 — 카메라로 몸을 보고 각도만 남긴다.
//
// **사진과 영상은 기기 밖으로 나가지 않는다.** 브라우저 안에서만 보고,
// 남기는 건 각도 숫자뿐이다. 이 말을 화면에도 적어 둔다.
//
// 두 번 찍어 값 셋을 얻는다.
//   측면 … 가만히 서기(목 숙임) → 허리 앞으로 굽히기(몸통 굽힘)
//   정면 … 팔 옆으로 들어 올리기(어깨 들림)
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  neckBend, trunkFlex, armRaiseSides, distanceOk, sideOk, sideOkNeck, frontOk, kneeStraight, seenWell,
  peakOf, qualityOf, L,
} from '../../lib/poseAngles';
import { say, hush, clearSaid, loadAngleVoice, hasAngleVoice, setQuiet } from '../../lib/speak';
import { toCVA } from '../../lib/angleView';
import { buildSteps, stepSec } from './anglePlan';
import { useLevel } from './useLevel';
import { recentChecks } from '../../lib/angleRecord';

const INK = '#1C1A17', SUB = '#8A8378';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const MAX_RETRY = 3;   // 세 번 연달아 안 잡히면 가이드를 다시 보여 준다
const HOLD_MS = 1500;  // 자세가 이만큼 그대로면 저절로 시작한다
const STUCK_MS = 6000; // 이만큼 계속 안 맞으면 '이대로 시작' 길을 연다
// 화면에 세우는 칸 — 고른 부위만 나온다
const TILE = [
  { take: 'neck', label: '목 세움', val: (g) => toCVA(g.neckBend) },
  { take: 'trunk', label: '허리 굽힘', val: (g) => g.trunkFlex },
  { take: 'arm', label: '어깨 들림', val: (g) => g.armRaise },
];
const ARM_GAP = 18;    // 좌우 팔 차이를 알릴 기준(도). 5도 안팎은 정상이라 넉넉히 둔다
const STEADY_MS = 750; // 카운트다운 중 이만큼은 자세가 그대로여야 한다

// 재는 동안 무엇을 할지를 **화면에 토막으로** 드러낸다.
// 예전엔 8초를 한 덩어리로 재면서 할 일은 음성으로만 말했다. 그래서
//   · 언제 굽혀야 하는지 몰라 가만히 있다가 허리 값이 안 잡히고
//   · 잘 되고 있나 궁금해 몸을 움직여 엉뚱한 자세가 찍혔다
// 토막마다 **그 토막에 필요한 값만** 모은다. 서 있는 동안의 목 각도와
// 굽히는 동안의 허리 각도가 섞이지 않는다.
const READY_SEC = 3;   // '셋, 둘, 하나' — 준비할 틈을 준다

// 관절 점 33개에서 자리만 꺼낸다. **사진이 아니라 좌표다** — 얼굴도 방도 남지 않는다.
// 소수점 셋째 자리까지면 화면에 그리기에 충분하고, 한 판이 1KB를 넘지 않는다.
const shapeOf = (pts) => (pts || []).map((q) => ({
  x: Math.round((q?.x ?? 0) * 1000) / 1000,
  y: Math.round((q?.y ?? 0) * 1000) / 1000,
}));

export default function AngleCapture({ onDone, onClose, want = ['neck', 'trunk', 'arm'] }) {
  const STEPS = useMemo(() => buildSteps(want), [want]);
  const [step, setStep] = useState(-1);          // -1 안내 · 0 측면 · 1 정면 · 2 끝
  const [msg, setMsg] = useState('');
  const [diag, setDiag] = useState(null);       // 무엇이 걸렸는지 — 안 될 때 볼 숫자
  const [showDiag, setShowDiag] = useState(false);
  const [stuck, setStuck] = useState(false);    // 오래 막혔나 — 빠져나갈 길을 연다
  const badSinceRef = useRef(0);
  const stuckRef = useRef(false);            // 지금 무엇을 고쳐야 하는지
  const [count, setCount] = useState(0);         // 남은 초
  const [ready, setReady] = useState(0);         // 준비 카운트(셋·둘·하나)
  const [phase, setPhase] = useState(null);      // 지금 몇 번째 토막인가
  const [got, setGot] = useState(0);             // 몇 판 잡았나 — 잘 되고 있다는 신호
  const [shook, setShook] = useState(0);         // 카운트다운이 몇 번 되감겼나
  // 저절로 시작을 끌 수 있게 — 혼자 옷을 고쳐 입거나 자리를 잡는 동안 멋대로 시작되면 곤란하다
  const [auto, setAuto] = useState(() => {
    try { return localStorage.getItem('bmti_angle_auto') !== '0'; } catch { return true; }
  });
  const autoRef = useRef(auto);
  useEffect(() => { autoRef.current = auto; }, [auto]);
  const tickRef = useRef(0);
  const [lastQuality, setLastQuality] = useState(0);   // 잘 잡혔는지 — 끝 화면에서 알려 준다
  const { tilt, ask: askLevel, TILT_OK } = useLevel();
  // 지난주 자세 — 재는 화면에 흐리게 깔아 같은 자리·같은 거리에 서기 쉽게
  const [ghost, setGhost] = useState(null);
  useEffect(() => {
    let alive = true;
    recentChecks(3).then((rows) => {
      if (!alive) return;
      const hit = (rows || []).find((r) => Array.isArray(r.pose) && r.pose.length >= 25);
      if (hit) setGhost({ pose: hit.pose, week: String(hit.week) });
    });
    return () => { alive = false; };
  }, []);
  const [ghostOn, setGhostOn] = useState(true);
  const ghostRef = useRef(null);
  const [vals, setVals] = useState({});                // 담은 값 — 화면에 보여 줄 몫(ref는 그릴 때 못 읽는다)
  const [retry, setRetry] = useState(0);
  const [err, setErr] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const rafRef = useRef(0);
  const runRef = useRef(null);                   // 지금 판의 모아 둔 값
  const gotRef = useRef({});                     // 단계마다 얻은 값
  const tryRef = useRef(0);                      // 몇 번 어긋났는지
  const okSinceRef = useRef(0);                  // 자세가 언제부터 맞았는지
  const startRef = useRef(null);                 // 저절로 시작하는 손잡이
  const stepRef = useRef(0);                     // 반복문이 읽을 최신 단계
  const checkRef = useRef(null);                 // 반복문이 읽을 최신 검사
  const [voice, setVoice] = useState(true);
  const [hasClips, setHasClips] = useState(false);
  useEffect(() => {
    let alive = true;
    loadAngleVoice().then(() => { if (alive) setHasClips(hasAngleVoice()); });
    return () => { alive = false; };
  }, []);

  // 한 프레임씩 보며 자세를 검사하고, 재는 중이면 값을 모은다.
  const check = (pts) => {
    const st = STEPS[step];
    const side = !st || st.id === 'side';
    const sitting = !!st?.sitting;
    // 허리를 굽히는 동안엔 머리가 화면 밖으로 나가기 쉽다.
    // 그때 재는 건 어깨~골반 기울기뿐이라 머리는 없어도 된다.
    const run0 = runRef.current;
    const bending = !!run0 && run0.ready === 0 && run0.take === 'trunk';
    // 앉아서 목만 잴 땐 골반이 없어도 된다. 허리·어깨는 골반을 기준으로 재므로 필요하다.
    const dist = distanceOk(pts, { needHead: !bending, needHips: !sitting });
    const face = side ? (sitting ? sideOkNeck(pts) : sideOk(pts)) : frontOk(pts);
    const seen = seenWell(pts, side
      ? (sitting
        ? [[L.earL, L.earR], [L.shoulderL, L.shoulderR]]
        : [[L.earL, L.earR], [L.shoulderL, L.shoulderR], [L.hipL, L.hipR]])
      : [L.shoulderL, L.shoulderR, L.wristL, L.wristR, L.hipL, L.hipR]);

    // 고칠 것 하나만 짚는다. 여러 개를 쏟아 내면 무엇부터 할지 모른다.
    let why = '', cue = '';
    if (!dist.inFrame) {
      // 무엇이 빠졌는지 짚어 준다. '머리부터 골반까지'만 보면 이미 다 나와 있다고 여긴다.
      why = (!dist.hipIn && dist.needHips)
        ? '골반이 화면 밖이에요. 카메라를 낮추거나 한 걸음 뒤로 가 주세요'
        : '머리와 어깨가 화면에 들어오게 해 주세요';
      cue = 'frame';
    }
    else if (!dist.ok) {
      const near = dist.h <= dist.lo * 1.4;
      why = near ? '조금 더 가까이 와 주세요' : (sitting ? '조금만 물러나 주세요' : '한 걸음만 뒤로 가 주세요');
      cue = near ? 'near' : 'far';
    } else if (!face.ok) {
      why = side ? '몸을 옆으로 더 돌려 주세요' : '화면을 정면으로 봐 주세요';
      cue = side ? 'turn' : 'face';
    } else if (seen < 0.5) { why = '밝은 곳에서 몸이 다 보이게 서 주세요'; cue = 'frame'; }
    setMsg(why);
    setDiag({
      h: dist.h, headIn: dist.headIn, hipIn: dist.hipIn,
      face: side ? face.shoulder : face.shoulder, seen, side,
    });
    // 무엇이 어긋났는지 바뀔 때만 한 번 말한다. 같은 말이 이어지면 듣기 싫어진다.
    if (why) say(cue);

    // 자세가 그대로 이어지면 저절로 시작한다 — 버튼을 누르러 오가면 자세가 흐트러진다
    if (!runRef.current) {
      if (why) {
        okSinceRef.current = 0;
        // 여섯 해를 세도 안 맞으면 빠져나갈 길을 연다
        if (!badSinceRef.current) badSinceRef.current = performance.now();
        else if (performance.now() - badSinceRef.current > STUCK_MS && !stuckRef.current) {
          stuckRef.current = true; setStuck(true);
        }
        return;
      }
      badSinceRef.current = 0;
      const t0 = performance.now();
      if (!okSinceRef.current) {
        okSinceRef.current = t0;
        clearSaid();
        say('hold');
      } else if (autoRef.current && t0 - okSinceRef.current > HOLD_MS) {
        okSinceRef.current = 0;
        startRef.current?.();
      }
      return;
    }

    const run = runRef.current;
    if (run && run.ready > 0) {
      // 카운트 중에 자세가 어긋나면 표시만 해 둔다. 되돌리는 건 타이머 쪽에서 한다.
      if (why && !run.forced) { run.badFrom = run.badFrom || performance.now(); }
      else run.badFrom = 0;
      if (run.badFrom && performance.now() - run.badFrom > STEADY_MS) run.shaken = true;
      return;
    }
    if (!run) return;
    if (why) { run.bad += 1; return; }              // 자세가 어긋나면 그 프레임은 안 센다
    const t = performance.now();
    const take = run.take;
    if (take === 'neck') {
      const nb = neckBend(pts);
      run.neck.push({ t, v: nb });
      // 옆모습 실루엣 — 목이 가장 곧았던 그 순간의 관절 좌표를 붙잡아 둔다.
      if (run.best == null || nb < run.best) { run.best = nb; run.pose = shapeOf(pts); }
    } else if (take === 'trunk') {
      if (kneeStraight(pts)) run.trunk.push({ t, v: trunkFlex(pts) });
      else run.kneeBad += 1;
    } else if (take === 'arm') {
      const { l, r } = armRaiseSides(pts);
      run.armL.push({ t, v: l });
      run.armR.push({ t, v: r });
      const top = Math.max(l, r);
      run.arm.push({ t, v: top });
      // 가장 높이 올린 그 순간의 자세 — 끝 화면에서 '이게 맞나요'를 물으려면 필요하다
      if (run.best == null || top > run.best) { run.best = top; run.pose = shapeOf(pts); }
    }
    if (take) { run.got += 1; run.seen = Math.max(run.seen, seen); }
  };

  // 카메라와 미디어파이프는 이 화면에 들어올 때만 불러온다.
  // 처음부터 들고 있으면 첫 화면이 느려진다.
  // 카메라는 재는 동안 내내 켜 둔다. step이 바뀔 때마다 껐다 켜면
  // 쉼터를 지날 때마다 미디어파이프를 다시 불러오느라 몇 초가 빈다.
  const live = step >= 0 && step < STEPS.length;
  useEffect(() => {
    if (!live) return undefined;
    let alive = true;
    let stream;
    const loop = () => {
      const v = videoRef.current, pose = poseRef.current, c = canvasRef.current;
      if (!alive) return;
      if (!v || !pose || v.readyState < 2) { rafRef.current = requestAnimationFrame(loop); return; }
      let res;
      try { res = pose.detectForVideo(v, performance.now()); } catch { res = null; }
      const pts = res?.landmarks?.[0];
      if (c) {
        const g = c.getContext('2d');
        c.width = v.videoWidth || 720; c.height = v.videoHeight || 960;
        g.clearRect(0, 0, c.width, c.height);
        // 지난주 자세를 먼저 흐리게 — 그 위에 지금 자세가 겹친다
        if (ghostRef.current) drawBones(g, ghostRef.current.pose, c.width, c.height, true);
        if (pts) drawBones(g, pts, c.width, c.height);
      }
      // 쉼터에선 보기만 한다. 검사와 판정은 최신 것을 ref로 읽는다 —
      // 효과가 다시 돌지 않으므로 여기 닫힌 값은 처음 것에 머문다.
      if (!Number.isInteger(stepRef.current)) { rafRef.current = requestAnimationFrame(loop); return; }
      if (pts) checkRef.current?.(pts); else setMsg('몸이 다 보이게 서 주세요');
      rafRef.current = requestAnimationFrame(loop);
    };
    (async () => {
      try {
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision');
        const files = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm',
        );
        const pose = await PoseLandmarker.createFromOptions(files, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
        });
        if (!alive) { pose.close?.(); return; }
        poseRef.current = pose;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } }, audio: false,
        });
        if (!alive) { stream.getTracks().forEach((t) => t.stop()); return; }
        const v = videoRef.current;
        if (v) { v.srcObject = stream; await v.play().catch(() => {}); }
        loop();
      } catch (e) {
        if (!alive) return;
        const m = String(e?.message || e);
        setErr(/permission|denied|NotAllowed/i.test(m)
          ? '카메라를 쓸 수 없어요. 브라우저에서 카메라를 허용해 주세요.'
          : '카메라를 여는 데 실패했어요: ' + m);
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      poseRef.current?.close?.();
      poseRef.current = null;
    };
  }, [live]);

  const again = (why = '잘 잡히지 않았어요. 한 번 더 해 볼까요?') => {
    // 몇 번째 어긋남인지는 ref로 센다 — 여기서 바로 보고 판단해야 한다.
    tryRef.current += 1;
    const n = tryRef.current;
    setRetry(n);
    okSinceRef.current = 0;
    badSinceRef.current = 0; stuckRef.current = false; setStuck(false);
    setCount(0); setReady(0); setPhase(null); setGot(0);
    setMsg(n >= MAX_RETRY ? '' : why);
    clearSaid();
    if (n >= MAX_RETRY) setStep(-1);               // 세 번 어긋나면 가이드부터 다시
  };

  const finishStep = () => {
    const run = runRef.current;
    runRef.current = null;
    if (!run) return;
    const st = STEPS[step];
    if (!st) return;
    const takes = st.phases.map((p) => p.take).filter(Boolean);
    const next = { ...gotRef.current };

    // 잰 토막마다 값이 나왔는지 본다. 하나라도 비면 넘어가지 않는다 —
    // 예전엔 목만 잡히면 그대로 갔고, 굽히다 화면 밖으로 나간 사람은 0이 기록됐다.
    if (takes.includes('neck')) {
      // 가만히 선 자세는 '가장 곧았던' 값을 쓴다. 굽히는 동안의 값이 섞이면 안 된다.
      const neck = run.neck.length ? Math.round(Math.min(...run.neck.map((x) => x.v)) * 10) / 10 : 0;
      if (!neck) { again('목 각도가 안 잡혔어요. 처음 4초는 가만히 계셔야 해요.'); return; }
      next.neckBend = neck;
    }
    if (takes.includes('trunk')) {
      const trunk = peakOf(run.trunk);
      if (!trunk) {
        again('허리 굽힘이 안 잡혔어요. 굽힐 때 골반이 화면에 남아 있어야 해요 — 한 걸음 뒤로 가서 다시 해 볼까요?');
        return;
      }
      next.trunkFlex = trunk;
      next.kneeBad = run.kneeBad;
    }
    if (takes.includes('arm')) {
      const arm = peakOf(run.arm);
      if (!arm) { again('어깨 들림이 안 잡혔어요. 두 팔이 화면에 다 들어와야 해요.'); return; }
      next.armRaise = arm;
      next.armRaiseL = peakOf(run.armL) || null;
      next.armRaiseR = peakOf(run.armR) || null;
    }
    if (st.id === 'side') { next.seenSide = run.seen; next.pose = run.pose || null; }
    else { next.seenFront = run.seen; next.poseFront = run.pose || null; }

    gotRef.current = next;
    setVals(next);
    tryRef.current = 0; setRetry(0); okSinceRef.current = 0;
    badSinceRef.current = 0; stuckRef.current = false; setStuck(false);
    setCount(0); setReady(0); setPhase(null); setGot(0);

    // 아직 잴 판이 남았으면 쉼터로. 몸을 돌릴 틈도 없이 다음 판이 시작되면 뒤죽박죽이 된다.
    if (step < STEPS.length - 1) {
      say('next', { force: true });
      setStep(step + 0.5);
      return;
    }

    const seen = [next.seenSide, next.seenFront].filter((v) => v != null);
    const quality = qualityOf({
      seen: seen.length ? Math.min(...seen) : 0,
      kneeOk: (next.kneeBad ?? 0) < 20,
      retries: retry,
    });
    setLastQuality(quality);
    say('done', { force: true });
    setStep(STEPS.length);
    if (onDone) onDone({ ...next, quality, retries: retry, want });
  };

  const flipVoice = () => { const v = !voice; setVoice(v); setQuiet(!v); };

  // 다시 재기 — 담은 값을 비우고 처음부터. 흔들린 판을 떠안고 가지 않아도 되게.
  const redo = () => {
    clearInterval(tickRef.current);
    runRef.current = null;
    gotRef.current = {}; setVals({});
    tryRef.current = 0; setRetry(0); okSinceRef.current = 0;
    badSinceRef.current = 0; stuckRef.current = false; setStuck(false);
    setCount(0); setReady(0); setPhase(null); setGot(0); setLastQuality(0);
    setStep(0);
  };

  // 재기 시작 — 준비 카운트를 세고, 토막마다 할 일을 화면에 띄우며 값을 모은다.
  // 버튼이 아니라 자세가 맞으면 저절로 불린다.
  const start = (forced = false) => {
    if (runRef.current) return;
    const s0 = STEPS[step];
    const total = stepSec(s0);
    runRef.current = {
      neck: [], trunk: [], arm: [], armL: [], armR: [],
      seen: 0, kneeBad: 0, best: null, pose: null,
      take: null, got: 0, bad: 0, ready: READY_SEC, shaken: false, badFrom: 0,
      // '이대로 시작'으로 들어왔으면 되감지 않는다. 안 그러면 영영 시작되지 않는다.
      forced,
    };
    setShook(0);
    setReady(READY_SEC);
    setPhase(null);
    setCount(total);
    setGot(0);

    let tenth = 0;                                  // 0.1초 단위로 센다 — 링이 부드럽게 돈다
    const tick = setInterval(() => {
      tenth += 1;
      const run = runRef.current;
      if (!run) { clearInterval(tick); return; }

      // 준비 카운트 — 이 동안은 아무것도 안 센다.
      // 자세가 흐트러지면 **처음부터 다시 센다.** 카운트 중에 몸을 움직여 놓고
      // 그대로 재기 시작하면, 그 엉뚱한 자세가 그대로 기록된다.
      if (run.ready > 0) {
        if (run.shaken) {
          run.shaken = false;
          run.ready = READY_SEC;
          setReady(READY_SEC);
          setShook((n) => n + 1);
          tenth = 0;
          return;
        }
        if (tenth % 10 === 0) {
          run.ready -= 1;
          setReady(run.ready);
          if (run.ready === 0) tenth = 0;
        }
        return;
      }

      const el = tenth / 10;
      // 지금이 몇 번째 토막인가
      let acc = 0, at = null;
      for (let i = 0; i < s0.phases.length; i += 1) {
        acc += s0.phases[i].sec;
        if (el < acc) { at = i; break; }
      }
      if (at === null) { clearInterval(tick); finishStep(); return; }
      if (run.phase !== at) {
        run.phase = at;
        run.take = s0.phases[at].take;
        setPhase(at);
        say(s0.phases[at].voice, { force: true });   // 토막이 바뀔 때만 말한다
      }
      setCount(Math.max(0, Math.ceil(total - el)));
      setGot(run.got);
    }, 100);
    tickRef.current = tick;
  };
  useEffect(() => { stepRef.current = step; });
  useEffect(() => { checkRef.current = check; });
  useEffect(() => { startRef.current = start; });
  // 지난주 자세는 옆모습 판에서만, 그리고 재기 전에만 깔아 준다.
  // (앞모습은 자리가 다르고, 재는 동안엔 지금 자세만 보여야 한다)
  useEffect(() => {
    const st = STEPS[Math.floor(step)];
    const wantGhost = ghostOn && st?.id === 'side' && count === 0 && ready === 0;
    ghostRef.current = wantGhost ? ghost : null;
  });
  useEffect(() => () => clearInterval(tickRef.current), []);

  // ── 화면 ────────────────────────────────────────────────
  if (step === -1) {
    return (
      <Shell onClose={onClose} title="각도기록" voice={voice} hasClips={hasClips} onVoice={flipVoice}>
        <div style={{ padding: '6px 4px 0' }}>
          <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 10, letterSpacing: '-0.02em' }}>1분이면 끝나요</div>
          <div style={{ fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.85, marginBottom: 16 }}>
            옆모습 한 번, 앞모습 한 번 찍습니다. 매주 같은 자리에서 재면
            지난주와 얼마나 달라졌는지 볼 수 있어요.
          </div>
          {retry >= MAX_RETRY && (
            <div style={{ background: '#FBEAE9', color: '#B23B36', borderRadius: 12, padding: '11px 13px',
              fontSize: 12.5, fontWeight: 700, lineHeight: 1.7, marginBottom: 14 }}>
              세 번 다 잘 잡히지 않았어요. 아래를 한 번만 다시 봐 주세요.
            </div>
          )}
          {/* 옷과 배경이 값을 가장 크게 흔든다. 임상 앱들도 이걸 맨 앞에 둔다. */}
          <div style={{ background: '#FBEAE9', borderRadius: 13, padding: '13px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#B23B36', marginBottom: 6 }}>옷부터 확인해 주세요</div>
            <div style={{ fontSize: 12.5, color: INK, fontWeight: 600, lineHeight: 1.85, wordBreak: 'keep-all' }}>
              <b>몸에 붙는 옷</b>이어야 해요. 후드·니트처럼 두껍거나 헐렁한 옷은 <b>어깨선을 가려서</b>
              값이 크게 어긋납니다. 겉옷은 벗고, 긴 머리는 묶어 <b>귀가 보이게</b> 해 주세요.
              <br />옷이 매주 달라지면 <b>몸이 달라진 것처럼</b> 보입니다. 가능하면 같은 옷으로요.
            </div>
          </div>
          <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13, color: INK, fontWeight: 600, lineHeight: 2 }}>
            <li><b>머리부터 골반까지</b>만 보이면 돼요. 다리는 안 나와도 괜찮아요</li>
            <li>휴대폰을 세워서 <b>가슴 높이</b>에 두세요</li>
            <li>뒤가 <b>단순하고 밝은 벽</b>이면 가장 잘 잡혀요. 뒤에 사람이 없게 해 주세요</li>
            <li>옆모습은 <b>정확히 90도</b> 돌아서세요. 비스듬하면 각도가 작게 나옵니다</li>
          </ul>
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, lineHeight: 1.75, marginBottom: 16 }}>
            매주 <b>같은 자리·같은 거리</b>에서 재는 게 가장 중요해요.
            거리가 달라지면 달라진 만큼이 몸이 바뀐 것처럼 보입니다.
          </div>
          <div style={{ background: YELLOW, borderRadius: 12, padding: '12px 14px', fontSize: 12.5,
            color: GOLD_INK, fontWeight: 700, lineHeight: 1.75, marginBottom: 18 }}>
            사진과 영상은 <b>이 기기 밖으로 나가지 않습니다.</b><br />남는 건 각도 숫자뿐이에요.
          </div>
          <button type="button" onClick={() => { askLevel(); tryRef.current = 0; setRetry(0); setStep(0); }} style={bigBtn(true)}>시작하기 →</button>
        </div>
      </Shell>
    );
  }

  // 옆모습을 마친 뒤 — 몸을 돌릴 틈을 주고, 방금 무엇을 쟀는지 보여 준다
  if (!Number.isInteger(step) && step > 0) {
    const g = vals;
    const done = STEPS[Math.floor(step)];
    const nxt = STEPS[Math.ceil(step)];
    const shown = done.phases.map((p) => p.take).filter(Boolean)
      .map((k) => TILE.find((x) => x.take === k)).filter(Boolean);
    return (
      <Shell onClose={onClose} title={`각도기록 — ${Math.floor(step) + 1}/${STEPS.length} 끝`} voice={voice} hasClips={hasClips} onVoice={flipVoice}>
        <div style={{ padding: '18px 4px 0' }}>
          <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 10 }}>
            {done.id === 'side' ? '옆모습' : '앞모습'} 다 쟀어요
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            {shown.map((x) => (
              <div key={x.take} style={{ flex: 1, background: YELLOW, borderRadius: 14, padding: '12px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: GOLD_INK }}>{x.label}</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                  {x.val(g) ? `${x.val(g)}°` : '—'}
                </div>
              </div>
            ))}
          </div>
          {/* 이 판이 제대로 잡혔는지 여기서 본다. 다 끝나고서야 알면 되돌리기가 아깝다. */}
          {g[done.id === 'side' ? 'pose' : 'poseFront'] && (
            <div style={{ background: '#FAF7F0', borderRadius: 13, padding: '12px 10px', marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: INK, marginBottom: 8 }}>이 자세로 쟀어요. 맞나요?</div>
              <div style={{ width: 120, margin: '0 auto' }}>
                <Stick pose={g[done.id === 'side' ? 'pose' : 'poseFront']} kind={done.id} />
              </div>
              <button type="button" onClick={() => setStep(Math.floor(step))}
                style={{ marginTop: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 12, fontWeight: 800, color: GOLD_INK, textDecoration: 'underline' }}>
                이 판만 다시 재기
              </button>
            </div>
          )}

          <div style={{ fontSize: 13, color: INK, fontWeight: 700, lineHeight: 1.85, marginBottom: 8 }}>
            이제 <b>{nxt.title}</b>
          </div>
          <div style={{ fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.85, whiteSpace: 'pre-line', marginBottom: 20 }}>
            {nxt.how}
            {nxt.id === 'front' && '\n팔이 잘 안 올라가는 쪽이 있어도 괜찮아요. 억지로 올리지 말고 올라가는 만큼만요 — 양쪽을 따로 담습니다.'}
          </div>
          <button type="button" onClick={() => setStep(Math.ceil(step))} style={bigBtn(true)}>준비됐어요 →</button>
        </div>
      </Shell>
    );
  }

  if (step >= STEPS.length) {
    const g = vals;
    const gap = g.armRaiseL != null && g.armRaiseR != null
      ? Math.round(Math.abs(g.armRaiseL - g.armRaiseR) * 10) / 10 : null;
    // 우세손 쪽이 5도쯤 더 올라가는 건 정상이다(일반 인구 자료).
    // 10도로 잡았더니 멀쩡한 사람에게도 경고가 떴다 — 18도로 올린다.
    const low = gap != null && gap >= ARM_GAP ? (g.armRaiseL < g.armRaiseR ? '왼쪽' : '오른쪽') : null;
    const q = lastQuality;
    return (
      <Shell onClose={onClose} title="각도기록" voice={voice} hasClips={hasClips} onVoice={flipVoice}>
        <div style={{ padding: '18px 4px 0' }}>
          <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 12 }}>다 쟀어요</div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {TILE.filter((x) => want.includes(x.take)).map((x) => (
              <div key={x.take} style={{ flex: 1, background: YELLOW, borderRadius: 14, padding: '12px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: GOLD_INK }}>{x.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                  {x.val(g) ? `${x.val(g)}°` : '—'}
                </div>
              </div>
            ))}
          </div>

          {/* 잰 자세를 눈으로 확인 — 숫자만 보면 엉뚱하게 잡힌 판을 알아챌 수 없다 */}
          {(g.pose || g.poseFront) && (
            <div style={{ background: '#FAF7F0', borderRadius: 13, padding: '12px 10px', marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 900, color: INK, marginBottom: 8, textAlign: 'center' }}>
                이 자세로 쟀어요. 맞나요?
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                {[['옆모습', g.pose, 'side'], ['앞모습', g.poseFront, 'front']].map(([lb, pose, kind]) => (pose ? (
                  <div key={kind} style={{ flex: '0 0 40%', maxWidth: 130, textAlign: 'center' }}>
                    <Stick pose={pose} kind={kind} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: SUB }}>{lb}</span>
                  </div>
                ) : null))}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: SUB, lineHeight: 1.7, marginTop: 8, textAlign: 'center', wordBreak: 'keep-all' }}>
                사람 모양이 아니거나 팔다리가 엉켜 있으면 잘못 잡힌 거예요. 다시 재 주세요.
              </div>
            </div>
          )}

          {/* 잘 잡혔는지 — 손님이 알 수 있어야 다시 잴지 정한다 */}
          <div style={{ background: q >= 70 ? '#EDF7F0' : q >= 45 ? '#FDF6DC' : '#FBEAE9', borderRadius: 13,
            padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: q >= 70 ? '#2E7D50' : q >= 45 ? GOLD_INK : '#B23B36', marginBottom: 3 }}>
              {q >= 70 ? '잘 잡혔어요' : q >= 45 ? '조금 흔들렸어요' : '많이 흔들렸어요'}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: SUB, lineHeight: 1.7, wordBreak: 'keep-all' }}>
              {q >= 70 ? '이 판은 추세에 그대로 들어갑니다.'
                : q >= 45 ? '값은 담았지만 다음엔 더 밝은 곳에서, 몸이 다 보이게 서 보세요.'
                  : '이 판은 추세에서 빠집니다. 한 번 더 재는 쪽을 권해요.'}
            </div>
          </div>

          {low && (
            <div style={{ background: '#FAF7F0', borderRadius: 13, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.75, wordBreak: 'keep-all' }}>
                <b>{low} 팔</b>이 {gap}도 덜 올라갔어요 (왼 {g.armRaiseL}° · 오른 {g.armRaiseR}°).
                자주 쓰는 쪽이 5도쯤 더 올라가는 건 흔한 일이라, {ARM_GAP}도를 넘을 때만 알려 드려요.
                추세는 잘 올라가는 쪽으로 보고, 양쪽 값은 따로 담아 둡니다.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={onClose} style={bigBtn(true)}>결과 보기 →</button>
            <button type="button" onClick={redo}
              style={{ ...bigBtn(false), width: 'auto', flexShrink: 0, padding: '15px 18px', cursor: 'pointer' }}>
              다시 재기
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  const s = STEPS[step];
  const poseOk = !msg;
  const running = count > 0 || ready > 0;
  const off = running || !!err;
  const ph = phase != null ? s.phases[phase] : null;
  const total = stepSec(s);
  const sideNow = s.id === 'side';
  const sitting = !!s.sitting;
  // 통과·실패만 보여 주면 어느 쪽으로 더 돌아야 하는지 모른다. 0~1로 바꿔 막대로 보인다.
  const squareness = (() => {
    if (!diag) return 0;
    const v = diag.face;
    if (!sideNow) return Math.max(0, Math.min(1, (v - 0.2) / 0.55));     // 클수록 정면
    const cap = sitting ? 1.0 : 0.52;
    return Math.max(0, Math.min(1, 1 - v / (cap * 1.9)));                 // 작을수록 옆모습
  })();
  return (
    <Shell onClose={onClose} title={`각도기록 — ${step + 1}/${STEPS.length}`} voice={voice} hasClips={hasClips} onVoice={flipVoice}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', borderRadius: 16,
        overflow: 'hidden', background: '#111' }}>
        <video ref={videoRef} playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

        {/* 서 있을 자리 — 임상 앱들이 쓰는 정렬 바.
            타원 하나만 두면 '어디에 맞춰야 하나'가 안 보인다.
            위·아래 바 사이에 몸을 넣고, 가운데 세로선에 몸 중심을 맞춘다. */}
        {(() => {
          const trunkNow = ph && ph.take === 'trunk';
          const top = trunkNow ? 4 : 10;
          const bot = trunkNow ? 8 : 22;
          const col = poseOk ? 'rgba(140,225,155,0.95)' : 'rgba(255,255,255,0.6)';
          const bar = { position: 'absolute', left: '12%', right: '12%', height: 3, background: col,
            borderRadius: 2, pointerEvents: 'none', transition: 'background .2s, top .3s, bottom .3s' };
          return (
            <>
              <span style={{ ...bar, top: `${top}%` }} />
              <span style={{ ...bar, bottom: `${bot}%` }} />
              <span style={{ position: 'absolute', left: '50%', top: `${top}%`, bottom: `${bot}%`, width: 1,
                marginLeft: -0.5, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
              {[['12%', 'left'], ['12%', 'right']].map(([v, side]) => (
                <span key={side} style={{ position: 'absolute', [side]: v, top: `${top}%`, bottom: `${bot}%`,
                  width: 2, background: 'rgba(255,255,255,0.28)', pointerEvents: 'none' }} />
              ))}
              <span style={{ position: 'absolute', left: 0, right: 0, bottom: `${bot - 7}%`, textAlign: 'center',
                fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.8)', pointerEvents: 'none' }}>
                {trunkNow ? '골반만 두 선 사이에 있으면 돼요'
                  : sitting ? '귀와 어깨가 두 선 사이에 들어오면 돼요'
                    : '머리~골반이 두 선 사이에 들어오면 돼요'}
              </span>
            </>
          );
        })()}

        {/* 휴대폰 수평 — 기울면 잰 각도가 통째로 그만큼 어긋난다 */}
        {tilt && !running && (
          <div style={{ position: 'absolute', right: 12, top: 56, background: tilt.ok ? 'rgba(28,26,23,0.72)' : 'rgba(178,59,54,0.88)',
            borderRadius: 12, padding: '7px 10px', pointerEvents: 'none', textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.8)', marginBottom: 5 }}>휴대폰 수평</div>
            <div style={{ position: 'relative', width: 62, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.22)' }}>
              <span style={{ position: 'absolute', left: '50%', top: -3, width: 1, height: 12, background: 'rgba(255,255,255,0.5)' }} />
              <span style={{ position: 'absolute', top: -2, width: 10, height: 10, borderRadius: '50%',
                background: tilt.ok ? '#8FD69B' : '#fff',
                left: `${Math.max(0, Math.min(52, 26 + Math.max(-26, Math.min(26, tilt.roll * 2))))}px`,
                transition: 'left .12s' }} />
            </div>
            {!tilt.ok && (
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', marginTop: 5 }}>
                {Math.abs(tilt.roll) > TILT_OK ? '좌우로 기울었어요' : '똑바로 세워 주세요'}
              </div>
            )}
          </div>
        )}

        {/* 얼마나 옆으로(정면으로) 섰는지 — 통과·실패만 알려 주면 어느 쪽으로 돌지 모른다 */}
        {diag && !running && (
          <div style={{ position: 'absolute', left: 12, bottom: 12, background: 'rgba(28,26,23,0.72)',
            borderRadius: 12, padding: '7px 10px', pointerEvents: 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>
              {sideNow ? '옆으로 선 정도' : '정면으로 선 정도'}
            </div>
            <div style={{ width: 84, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 999,
                width: `${Math.round(squareness * 100)}%`,
                background: squareness > 0.72 ? '#8FD69B' : squareness > 0.45 ? '#F3D98A' : '#E88C84',
                transition: 'width .15s, background .2s' }} />
            </div>
          </div>
        )}

        {/* 위 문구 — 재는 중엔 '지금 무엇을 할 차례인지'가 맨 앞이다 */}
        <div style={{ position: 'absolute', left: 12, right: 12, top: 12, textAlign: 'center' }}>
          {ph ? (
            <span style={{ display: 'inline-block', background: 'rgba(28,26,23,0.86)', color: '#fff',
              borderRadius: 16, padding: '9px 16px', maxWidth: '100%' }}>
              <span style={{ display: 'block', fontSize: 14.5, fontWeight: 900, lineHeight: 1.3 }}>{ph.text}</span>
              <span style={{ display: 'block', fontSize: 11, fontWeight: 700, opacity: 0.8, marginTop: 2 }}>{ph.sub}</span>
            </span>
          ) : (
            <span style={{ display: 'inline-block', background: msg ? 'rgba(178,59,54,0.92)' : 'rgba(255,255,255,0.94)',
              color: msg ? '#fff' : INK, borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 800 }}>
              {msg || (ready > 0 ? '곧 시작해요' : '좋아요, 그대로 계세요')}
            </span>
          )}
        </div>

        {/* 준비 카운트 — 갑자기 시작해 놀라는 일이 없게 */}
        {ready > 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 92, fontWeight: 900, color: 'rgba(255,255,255,0.95)',
              textShadow: '0 2px 24px rgba(0,0,0,0.55)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{ready}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginTop: 6,
              textShadow: '0 1px 10px rgba(0,0,0,0.6)' }}>
              {shook > 0 ? '자세가 흐트러져서 다시 셉니다' : '자세를 잡아 주세요'}
            </span>
          </div>
        )}

        {/* 재는 중 — 남은 시간을 고리로, 잡힌 판을 점으로. 잘 되고 있다는 걸 눈으로 알게 */}
        {count > 0 && ready === 0 && (
          <div style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(28,26,23,0.72)', borderRadius: 999, padding: '5px 11px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: got > 0 ? '#8FD69B' : '#E0554F',
                animation: 'angleBlip 1s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>
                {got > 0 ? '잡히는 중' : '안 잡히는 중'}
              </span>
            </span>
            <Ring left={count} total={total} />
          </div>
        )}
        <style>{'@keyframes angleBlip{0%,100%{opacity:1}50%{opacity:.25}}'}</style>
      </div>

      <div style={{ padding: '14px 4px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 14 }}>
          {s.how}
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#B23B36', fontWeight: 700, marginBottom: 12 }}>{err}</div>}

        {/* 오래 막히면 빠져나갈 길을 연다. 검사가 완벽할 수 없으니 막다른 길은 두지 않는다. */}
        {stuck && !off && (
          <div style={{ background: '#FDF6DC', borderRadius: 13, padding: '11px 13px', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#8A6A3A', lineHeight: 1.7, wordBreak: 'keep-all' }}>
              자세가 계속 안 맞나요? <b>이대로 시작</b>해도 됩니다. 값이 많이 흔들리면 그 판은 추세에서 빠져요.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 9, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => start(true)}
                style={{ border: 'none', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 999,
                  padding: '7px 14px', fontSize: 12, fontWeight: 800, color: '#8A6A3A', boxShadow: '0 2px 7px rgba(0,0,0,0.1)' }}>
                이대로 시작 →
              </button>
              <button type="button" onClick={() => setShowDiag((v) => !v)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 11.5, fontWeight: 800, color: SUB }}>
                {showDiag ? '숫자 접기' : '무엇이 걸렸는지 보기'}
              </button>
            </div>
            {showDiag && diag && (
              <div style={{ fontSize: 11, color: SUB, fontWeight: 700, lineHeight: 1.8, marginTop: 9,
                fontVariantNumeric: 'tabular-nums' }}>
                몸 크기 {diag.h.toFixed(2)} <span style={{ color: diag.h > 0.10 && diag.h < 0.80 ? '#2E7D50' : '#B23B36' }}>
                  (0.10~0.80이면 통과)</span>
                <br />머리 {diag.headIn ? '보임' : '화면 밖'} · 골반 {diag.hipIn ? '보임' : '화면 밖'}
                <br />{diag.side ? '옆으로 선 정도' : '정면으로 선 정도'} {diag.face.toFixed(2)}
                <span style={{ color: (diag.side ? diag.face < 0.52 : diag.face > 0.55) ? '#2E7D50' : '#B23B36' }}>
                  {diag.side ? ' (0.52 미만이면 통과)' : ' (0.55 넘으면 통과)'}</span>
                <br />또렷하게 잡힌 정도 {diag.seen.toFixed(2)}
                <span style={{ color: diag.seen >= 0.5 ? '#2E7D50' : '#B23B36' }}> (0.50 넘으면 통과)</span>
              </div>
            )}
          </div>
        )}
        {/* 자세가 맞으면 저절로 시작한다. 이 버튼은 기다리기 답답할 때 쓰는 자리다. */}
        <button type="button" onClick={() => start()} disabled={off} style={bigBtn(!off)}>
          {running ? `재는 중… ${count}초`
            : poseOk ? (auto ? '곧 시작해요 — 눌러서 바로 시작' : '눌러서 시작하기')
              : '자세를 맞춰 주세요'}
        </button>
        {ghost && sideNow && (
          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            marginTop: 11, fontSize: 12, fontWeight: 700, color: SUB, cursor: 'pointer' }}>
            <input type="checkbox" checked={ghostOn} disabled={running}
              onChange={(e) => setGhostOn(e.target.checked)} />
            지난주 자세를 흐리게 겹쳐 보기
          </label>
        )}
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          marginTop: 11, fontSize: 12, fontWeight: 700, color: SUB, cursor: 'pointer' }}>
          <input type="checkbox" checked={auto} disabled={running}
            onChange={(e) => {
              setAuto(e.target.checked);
              try { localStorage.setItem('bmti_angle_auto', e.target.checked ? '1' : '0'); } catch { /* 저장 못 해도 이번만 적용 */ }
            }} />
          자세가 맞으면 저절로 시작하기
        </label>
      </div>
    </Shell>
  );
}

// 남은 시간 고리 — 숫자만 크게 띄우면 그 숫자를 보려고 고개를 돌린다.
function Ring({ left, total }) {
  const r = 15, c = 2 * Math.PI * r;
  const done = Math.max(0, Math.min(1, 1 - left / total));
  return (
    <span style={{ position: 'relative', width: 40, height: 40, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="40" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="20" cy="20" r={r} fill="rgba(28,26,23,0.72)" stroke="rgba(255,255,255,0.25)" strokeWidth="3.5" />
        <circle cx="20" cy="20" r={r} fill="none" stroke="#F3D98A" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - done)} style={{ transition: 'stroke-dashoffset .1s linear' }} />
      </svg>
      <span style={{ position: 'relative', fontSize: 13, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{left}</span>
    </span>
  );
}


// 잰 자세를 뼈대로 그려 준다 — 숫자만 보면 엉뚱하게 잡힌 판을 알아챌 수 없다.
// 어깨~골반 길이로 크기를 맞춰, 멀리 서서 잰 판과 가까이서 잰 판이 같은 크기로 보인다.
const STICK = {
  side: [[7, 11], [11, 23], [23, 25], [25, 27]],
  front: [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16]],
};
function Stick({ pose, kind }) {
  const W = 110, H = 150;
  const at = (i) => pose?.[i];
  const sh = at(11), hip = at(23);
  if (!sh || !hip) return null;
  const torso = Math.hypot(sh.x - hip.x, sh.y - hip.y) || 0.25;
  const k = (H * 0.30) / torso;
  const cx = W / 2, cy = H * 0.30;
  const P = (i) => { const q = at(i); return q ? [cx + (q.x - sh.x) * k, cy + (q.y - sh.y) * k] : null; };
  const lines = STICK[kind] || STICK.side;
  const head = P(0) || P(7);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: W }}>
      {lines.map(([a, b], i) => {
        const p = P(a), q = P(b);
        if (!p || !q) return null;
        return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]}
          stroke="#7C6BD0" strokeWidth="5" strokeLinecap="round" />;
      })}
      {head && <circle cx={head[0]} cy={head[1]} r="10" fill="#7C6BD0" />}
    </svg>
  );
}

const bigBtn = (on) => ({
  width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: on ? 'pointer' : 'default',
  fontFamily: 'inherit', fontSize: 15, fontWeight: 800, background: '#fff', color: on ? INK : SUB,
  boxShadow: on ? '0 3px 10px rgba(217,185,106,0.45)' : 'inset 0 0 0 1px #EDE9E2',
});

// 몸에 선을 그려 준다 — 잘 잡히고 있다는 걸 눈으로 알 수 있게
const BONES = [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]];
function drawBones(g, pts, w, h, faint = false) {
  g.strokeStyle = faint ? 'rgba(255,255,255,0.32)' : 'rgba(180,240,190,0.85)';
  g.lineWidth = faint ? Math.max(2, w / 300) : Math.max(2, w / 220);
  BONES.forEach(([a, b]) => {
    const p = pts[a], q = pts[b];
    if (!p || !q || (p.visibility ?? p.v ?? 1) < 0.4) return;
    g.beginPath(); g.moveTo(p.x * w, p.y * h); g.lineTo(q.x * w, q.y * h); g.stroke();
  });
  g.fillStyle = faint ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)';
  [0, 7, 8, 11, 12, 23, 24].forEach((i) => {
    const p = pts[i]; if (!p) return;
    g.beginPath(); g.arc(p.x * w, p.y * h, Math.max(3, w / 200), 0, Math.PI * 2); g.fill();
  });
}

function Shell({ children, onClose, title, voice, hasClips, onVoice }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // 화면을 떠날 땐 하던 말을 멈춘다
    return () => { document.body.style.overflow = prev; hush(); };
  }, []);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 74, background: '#fff', overflowY: 'auto',
      fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK, padding: '14px 14px 30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={onClose} aria-label="닫기"
          style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#F4F1EB',
            fontSize: 17, fontWeight: 800, color: INK, cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1 }}>‹</button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 900 }}>{title}</span>
        {hasClips && (
          <button type="button" onClick={onVoice} aria-label={voice ? '말 끄기' : '말 켜기'}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800,
              background: voice ? '#FDF6DC' : '#F4F1EB', color: voice ? '#8A6A3A' : SUB }}>
            {voice ? '🔊 안내 켬' : '🔇 안내 끔'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
