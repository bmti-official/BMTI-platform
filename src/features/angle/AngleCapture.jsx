// 각도 재기 — 카메라로 몸을 보고 각도만 남긴다.
//
// **사진과 영상은 기기 밖으로 나가지 않는다.** 브라우저 안에서만 보고,
// 남기는 건 각도 숫자뿐이다. 이 말을 화면에도 적어 둔다.
//
// 두 번 찍어 값 셋을 얻는다.
//   측면 … 가만히 서기(목 숙임) → 허리 앞으로 굽히기(몸통 굽힘)
//   정면 … 팔 옆으로 들어 올리기(어깨 들림)
import { useEffect, useRef, useState } from 'react';
import {
  neckBend, trunkFlex, armRaise, distanceOk, sideOk, frontOk, kneeStraight, seenWell,
  peakOf, qualityOf, L,
} from '../../lib/poseAngles';
import { say, hush, canSpeak } from '../../lib/speak';

const INK = '#1C1A17', SUB = '#8A8378';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';
const MAX_RETRY = 3;   // 세 번 연달아 안 잡히면 가이드를 다시 보여 준다
const HOLD_MS = 1500;  // 자세가 이만큼 그대로면 저절로 시작한다

const STEPS = [
  {
    id: 'side', title: '옆으로 서 주세요', sec: 8,
    how: '몸 왼쪽이나 오른쪽이 화면을 보게 섭니다.\n가만히 선 다음, 천천히 허리를 앞으로 굽혔다 돌아옵니다.\n무릎은 편 채로요.',
    ready: '옆으로 서 주세요',
    go: '시작합니다. 가만히 서 계세요.',
    mid: '이제 천천히 허리를 굽혀 주세요.',
  },
  {
    id: 'front', title: '정면으로 서 주세요', sec: 8,
    how: '화면을 마주 봅니다.\n두 팔을 옆으로 천천히 올렸다 내립니다.',
    ready: '이번엔 정면으로 서 주세요',
    go: '시작합니다. 두 팔을 천천히 올려 주세요.',
    mid: '끝까지 올린 채로 잠깐 멈춰 주세요.',
  },
];

export default function AngleCapture({ onDone, onClose }) {
  const [step, setStep] = useState(-1);          // -1 안내 · 0 측면 · 1 정면 · 2 끝
  const [msg, setMsg] = useState('');            // 지금 무엇을 고쳐야 하는지
  const [count, setCount] = useState(0);         // 남은 초
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
  const [voice, setVoice] = useState(canSpeak());

  // 한 프레임씩 보며 자세를 검사하고, 재는 중이면 값을 모은다.
  const check = (pts) => {
    const side = step === 0;
    const dist = distanceOk(pts);
    const face = side ? sideOk(pts) : frontOk(pts);
    const seen = seenWell(pts, side
      ? [L.earL, L.earR, L.shoulderL, L.shoulderR, L.hipL, L.hipR]
      : [L.shoulderL, L.shoulderR, L.wristL, L.wristR, L.hipL, L.hipR]);

    let why = '';
    if (!dist.inFrame) why = '머리부터 골반까지 화면에 들어오게 해 주세요';
    else if (!dist.ok) why = dist.h <= 0.14 ? '조금 더 가까이 와 주세요' : '한 걸음만 뒤로 가 주세요';
    else if (!face.ok) why = side ? '몸을 옆으로 더 돌려 주세요' : '화면을 정면으로 봐 주세요';
    else if (seen < 0.5) why = '밝은 곳에서 몸이 다 보이게 서 주세요';
    setMsg(why);
    if (voice && why) say(why);

    // 자세가 그대로 이어지면 저절로 시작한다 — 버튼을 누르러 오가면 자세가 흐트러진다
    if (!runRef.current) {
      if (why) { okSinceRef.current = 0; return; }
      const t0 = performance.now();
      if (!okSinceRef.current) {
        okSinceRef.current = t0;
        if (voice) say('좋아요. 그대로 계세요.', { force: true });
      } else if (t0 - okSinceRef.current > HOLD_MS) {
        okSinceRef.current = 0;
        startRef.current?.();
      }
      return;
    }

    const run = runRef.current;
    if (!run || why) return;                       // 자세가 어긋나면 그 프레임은 안 센다
    const t = performance.now();
    if (side) {
      run.neck.push({ t, v: neckBend(pts) });
      if (kneeStraight(pts)) run.trunk.push({ t, v: trunkFlex(pts) });
      else run.kneeBad += 1;
    } else {
      run.arm.push({ t, v: armRaise(pts) });
    }
    run.seen = Math.max(run.seen, seen);
  };

  // 카메라와 미디어파이프는 이 화면에 들어올 때만 불러온다.
  // 처음부터 들고 있으면 첫 화면이 느려진다.
  useEffect(() => {
    if (step < 0 || step > 1) return undefined;
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
        if (pts) drawBones(g, pts, c.width, c.height);
      }
      if (pts) check(pts); else setMsg('몸이 다 보이게 서 주세요');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const again = () => {
    // 몇 번째 어긋남인지는 ref로 센다 — 여기서 바로 보고 판단해야 한다.
    tryRef.current += 1;
    const n = tryRef.current;
    setRetry(n);
    okSinceRef.current = 0;
    const word = n >= MAX_RETRY ? '잘 잡히지 않네요. 찍는 방법을 다시 볼게요.' : '잘 잡히지 않았어요. 한 번 더 해 볼까요?';
    setMsg(n >= MAX_RETRY ? '' : word);
    if (voice) say(word, { force: true });
    if (n >= MAX_RETRY) setStep(-1);               // 세 번 어긋나면 가이드부터 다시
  };

  const finishStep = () => {
    const run = runRef.current;
    runRef.current = null;
    if (!run) return;

    if (step === 0) {
      // 가만히 선 자세는 '가장 곧았던' 값을 쓴다. 굽히는 동안의 값이 섞이면 안 된다.
      const neck = run.neck.length ? Math.round(Math.min(...run.neck.map((s) => s.v)) * 10) / 10 : 0;
      const trunk = peakOf(run.trunk);
      if (!neck && !trunk) { again(); return; }
      gotRef.current = { ...gotRef.current, neckBend: neck, trunkFlex: trunk, seenSide: run.seen, kneeBad: run.kneeBad };
      tryRef.current = 0; setRetry(0); okSinceRef.current = 0;
      if (voice) say('옆모습 다 쟀어요. ' + STEPS[1].ready + '.', { force: true });
      setStep(1);
      return;
    }
    const arm = peakOf(run.arm);
    if (!arm) { again(); return; }
    const all = { ...gotRef.current, armRaise: arm, seenFront: run.seen };
    const quality = qualityOf({
      seen: Math.min(all.seenSide ?? 0, all.seenFront ?? 0),
      kneeOk: (all.kneeBad ?? 0) < 20,
      retries: retry,
    });
    gotRef.current = all;
    tryRef.current = 0; setRetry(0); okSinceRef.current = 0;
    if (voice) say('다 쟀어요. 수고하셨어요.', { force: true });
    setStep(2);
    if (onDone) onDone({ ...all, quality, retries: retry });
  };

  // 재기 시작 — 몇 초 동안 값을 모은다. 버튼이 아니라 자세가 맞으면 저절로 불린다.
  const start = () => {
    if (runRef.current) return;
    const s0 = STEPS[step];
    runRef.current = { neck: [], trunk: [], arm: [], seen: 0, kneeBad: 0 };
    setCount(s0.sec);
    if (voice) say(s0.go, { force: true });
    const tick = setInterval(() => {
      setCount((n) => {
        // 절반쯤 왔을 때 다음에 뭘 할지 알려 준다
        if (n === Math.ceil(s0.sec / 2) + 1 && voice) say(s0.mid, { force: true });
        if (n > 1) return n - 1;
        clearInterval(tick);
        finishStep();
        return 0;
      });
    }, 1000);
  };
  useEffect(() => { startRef.current = start; });

  // ── 화면 ────────────────────────────────────────────────
  if (step === -1) {
    return (
      <Shell onClose={onClose} title="각도기록" voice={voice} onVoice={() => { setVoice((v) => !v); hush(); }}>
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
          <ul style={{ margin: '0 0 18px', paddingLeft: 18, fontSize: 13, color: INK, fontWeight: 600, lineHeight: 2 }}>
            <li><b>머리부터 골반까지</b>만 보이면 돼요. 다리는 안 나와도 괜찮아요</li>
            <li>휴대폰을 세워서 <b>가슴 높이</b>에 두세요</li>
            <li><b>몸에 붙는 옷</b>이 좋아요. 헐렁하면 어깨선이 안 잡혀요</li>
            <li>밝은 곳에서, 뒤에 사람이 없게 해 주세요</li>
          </ul>
          <div style={{ fontSize: 12, color: SUB, fontWeight: 600, lineHeight: 1.75, marginBottom: 16 }}>
            매주 <b>같은 자리·같은 거리</b>에서 재는 게 가장 중요해요.
            거리가 달라지면 달라진 만큼이 몸이 바뀐 것처럼 보입니다.
          </div>
          <div style={{ background: YELLOW, borderRadius: 12, padding: '12px 14px', fontSize: 12.5,
            color: GOLD_INK, fontWeight: 700, lineHeight: 1.75, marginBottom: 18 }}>
            사진과 영상은 <b>이 기기 밖으로 나가지 않습니다.</b><br />남는 건 각도 숫자뿐이에요.
          </div>
          <button type="button" onClick={() => { tryRef.current = 0; setRetry(0); setStep(0); }} style={bigBtn(true)}>시작하기 →</button>
        </div>
      </Shell>
    );
  }

  if (step === 2) {
    return (
      <Shell onClose={onClose} title="각도기록" voice={voice} onVoice={() => { setVoice((v) => !v); hush(); }}>
        <div style={{ padding: '30px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 900, marginBottom: 8 }}>다 쟀어요</div>
          <div style={{ fontSize: 13, color: SUB, fontWeight: 600, lineHeight: 1.8, marginBottom: 22 }}>
            이번 주 기록을 담았어요.<br />지난주와 얼마나 달라졌는지 볼까요?
          </div>
          <button type="button" onClick={onClose} style={bigBtn(true)}>결과 보기 →</button>
        </div>
      </Shell>
    );
  }

  const s = STEPS[step];
  const ready = !msg;
  const off = count > 0 || !!err;
  return (
    <Shell onClose={onClose} title={`각도기록 — ${step + 1}/2`} voice={voice} onVoice={() => { setVoice((v) => !v); hush(); }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', borderRadius: 16,
        overflow: 'hidden', background: '#111' }}>
        <video ref={videoRef} playsInline muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <canvas ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)', pointerEvents: 'none' }} />

        {/* 서 있을 자리 — 이 안에 몸이 들어오게 */}
        {/* 머리부터 골반까지 들어갈 자리. 다리까지 넣으려고 멀리 물러설 필요가 없다. */}
        <span style={{ position: 'absolute', left: '18%', right: '18%', top: '10%', bottom: '22%',
          border: `2px dashed ${ready ? 'rgba(180,240,190,0.8)' : 'rgba(255,255,255,0.45)'}`,
          borderRadius: 999, pointerEvents: 'none', transition: 'border-color .2s' }} />
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: '15%', textAlign: 'center',
          fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.75)', pointerEvents: 'none' }}>
          이 안에 머리~골반이 들어오면 돼요
        </span>

        <div style={{ position: 'absolute', left: 12, right: 12, top: 12, textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: msg ? 'rgba(178,59,54,0.92)' : 'rgba(255,255,255,0.94)',
            color: msg ? '#fff' : INK, borderRadius: 999, padding: '7px 14px', fontSize: 12.5, fontWeight: 800 }}>
            {msg || (count > 0 ? '그대로 천천히 움직여 주세요' : '좋아요, 그대로 계세요')}
          </span>
        </div>

        {count > 0 && (
          <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
            fontSize: 72, fontWeight: 900, color: 'rgba(255,255,255,0.92)',
            textShadow: '0 2px 20px rgba(0,0,0,0.5)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
        )}
      </div>

      <div style={{ padding: '14px 4px 0' }}>
        <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 14 }}>
          {s.how}
        </div>
        {err && <div style={{ fontSize: 12.5, color: '#B23B36', fontWeight: 700, marginBottom: 12 }}>{err}</div>}
        {/* 자세가 맞으면 저절로 시작한다. 이 버튼은 기다리기 답답할 때 쓰는 자리다. */}
        <button type="button" onClick={start} disabled={off} style={bigBtn(!off)}>
          {count > 0 ? `재는 중… ${count}` : ready ? '곧 시작해요 — 눌러서 바로 시작' : '자세를 맞춰 주세요'}
        </button>
      </div>
    </Shell>
  );
}

const bigBtn = (on) => ({
  width: '100%', padding: 15, borderRadius: 14, border: 'none', cursor: on ? 'pointer' : 'default',
  fontFamily: 'inherit', fontSize: 15, fontWeight: 800, background: '#fff', color: on ? INK : SUB,
  boxShadow: on ? '0 3px 10px rgba(217,185,106,0.45)' : 'inset 0 0 0 1px #EDE9E2',
});

// 몸에 선을 그려 준다 — 잘 잡히고 있다는 걸 눈으로 알 수 있게
const BONES = [[11, 12], [11, 23], [12, 24], [23, 24], [11, 13], [13, 15], [12, 14], [14, 16], [23, 25], [25, 27], [24, 26], [26, 28]];
function drawBones(g, pts, w, h) {
  g.strokeStyle = 'rgba(180,240,190,0.85)';
  g.lineWidth = Math.max(2, w / 220);
  BONES.forEach(([a, b]) => {
    const p = pts[a], q = pts[b];
    if (!p || !q || (p.visibility ?? p.v ?? 1) < 0.4) return;
    g.beginPath(); g.moveTo(p.x * w, p.y * h); g.lineTo(q.x * w, q.y * h); g.stroke();
  });
  g.fillStyle = 'rgba(255,255,255,0.9)';
  [0, 7, 8, 11, 12, 23, 24].forEach((i) => {
    const p = pts[i]; if (!p) return;
    g.beginPath(); g.arc(p.x * w, p.y * h, Math.max(3, w / 200), 0, Math.PI * 2); g.fill();
  });
}

function Shell({ children, onClose, title, voice, onVoice }) {
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
        {canSpeak() && (
          <button type="button" onClick={onVoice} aria-label={voice ? '말 끄기' : '말 켜기'}
            style={{ flexShrink: 0, padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11.5, fontWeight: 800,
              background: voice ? '#FDF6DC' : '#F4F1EB', color: voice ? '#8A6A3A' : SUB }}>
            {voice ? '🔊 말 켬' : '🔇 말 끔'}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
