// 영상에서 각도별 장면 뽑기 — 천천히 움직이는 영상 하나에 중간 각도가 다 지나간다.
//
// 그림을 따로 뽑으면 장마다 얼굴·체형·조명이 조금씩 달라진다. 영상에서 잘라 내면
// 사람은 그대로이고 각도만 바뀐다. 0.1초마다 장면을 재 두고, 목표 각도마다
// 가장 가깝고 덜 흔들린 장면을 고른다. 영상 파일은 올리지 않고 브라우저 안에서만 연다.
import { measureSource } from './measureImage';

export const STEP = 0.1;          // 몇 초마다 잴까
const MAX_SEC = 30;               // 이보다 길면 앞부분만 본다(재는 데 너무 오래 걸린다)
const MIN_SURE = 0.6;             // 관절이 이만큼은 또렷해야 쓴다
const SHAKE = 300;                // 흔들림 벌점 — 한 번에 화면의 1%쯤 움직이면 3도 멀어진 것으로 친다

/** 파일을 열어 { video } 또는 { err } */
export function openVideo(file) {
  return new Promise((ok) => {
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.onloadeddata = async () => {
      v.onloadeddata = null;
      if (!v.videoWidth) { ok({ err: `'${file.name}'의 화면을 읽지 못했어요. mp4(H.264)로 내보내 주세요.` }); return; }
      // 일부 webm은 길이가 적혀 있지 않다(Infinity). 끝으로 한 번 보내면 브라우저가 길이를 알아낸다.
      if (!Number.isFinite(v.duration)) {
        await new Promise((done) => {
          const t = setTimeout(done, 3000);
          v.ondurationchange = () => { if (Number.isFinite(v.duration)) { clearTimeout(t); done(); } };
          v.currentTime = 1e7;
        });
        v.ondurationchange = null;
        v.currentTime = 0;
      }
      if (!Number.isFinite(v.duration)) ok({ err: `'${file.name}'의 길이를 알 수 없어요. mp4로 내보내 주세요.` });
      else ok({ video: v });
    };
    v.onerror = () => ok({ err: `'${file.name}'은 이 브라우저에서 열 수 없어요. mp4(H.264)로 내보내 주세요. (아이폰 .mov는 안 열릴 수 있어요)` });
    v.src = URL.createObjectURL(file);
  });
}

/** t초로 옮긴다 — 옮겨질 때까지 기다린다 */
export function seek(v, t) {
  return new Promise((ok) => {
    const to = Math.max(0, Math.min(t, (v.duration || 0) - 0.01));
    if (Math.abs(v.currentTime - to) < 0.001) { ok(); return; }
    const done = () => { v.removeEventListener('seeked', done); clearTimeout(timer); ok(); };
    const timer = setTimeout(done, 3000);
    v.addEventListener('seeked', done);
    v.currentTime = to;
  });
}

const canvasOf = (v) => {
  const c = document.createElement('canvas');
  c.width = v.videoWidth;
  c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  return c;
};

/** 지금 장면을 잰다 */
export async function measureAt(v, t, kind) {
  await seek(v, t);
  const m = await measureSource(canvasOf(v), v.videoWidth, v.videoHeight, kind);
  return { ...m, t: Math.round(t * 100) / 100 };
}

const moved = (a, b) => {
  if (!a?.pts || !b?.pts) return 0;
  let sum = 0;
  for (let i = 0; i < 25; i += 1) sum += Math.hypot(a.pts[i].x - b.pts[i].x, a.pts[i].y - b.pts[i].y);
  return sum / 25;
};

/** 영상 전체를 STEP초마다 잰다. onStep(한 비율 0~1) */
export async function sampleVideo(v, kind, onStep) {
  const end = Math.min(v.duration || 0, MAX_SEC);
  const out = [];
  let prev = null;
  for (let t = 0; t <= end; t += STEP) {
    const m = await measureAt(v, t, kind);
    if (!m.err) {
      out.push({ ...m, motion: moved(prev, m) });
      prev = m;
    }
    onStep?.(end ? t / end : 1);
  }
  return { samples: out, cut: (v.duration || 0) > MAX_SEC };
}

/** 목표마다 장면 하나. samples에는 vi(몇 번째 영상)가 붙어 있다.
 *  돌려주는 것: [{ target, sample }] — 목표 근처에 장면이 없으면 빠진다. */
export function chooseFrames(item, samples) {
  const ok = samples.filter((s) => s.angle != null && (s.sure ?? 0) >= MIN_SURE);
  const used = new Set();
  const out = [];
  const take = (target, scoreOf) => {
    let best = null;
    ok.forEach((s) => {
      const id = `${s.vi}:${s.t}`;
      if (used.has(id)) return;
      const d = scoreOf(s);
      if (d == null) return;
      const score = d + (s.motion || 0) * SHAKE;
      if (!best || score < best.score) best = { s, score, id };
    });
    if (best) { used.add(best.id); out.push({ target, sample: best.s }); }
  };

  if (item.pairs) {
    const half = item.step / 2;
    item.pairs.forEach(([R, L]) => take(`오 ${R}° · 왼 ${L}°`, (s) => {
      if (s.l == null || s.r == null) return null;
      // 그대로든 뒤집어서든 두 팔 모두 반 칸 안이면 쓴다
      const fits = [[s.r, s.l], [s.l, s.r]].filter(([a, b]) => Math.abs(a - R) <= half && Math.abs(b - L) <= half);
      return fits.length ? Math.min(...fits.map(([a, b]) => Math.hypot(a - R, b - L))) : null;
    }));
  } else {
    const half = (item.targets[1] - item.targets[0]) / 2;
    item.targets.forEach((t) => take(`${t}°`, (s) => (Math.abs(s.angle - t) <= half ? Math.abs(s.angle - t) : null)));
  }
  return out;
}

/** t초 장면을 jpg 파일로 */
export async function frameFile(v, t) {
  await seek(v, t);
  const c = canvasOf(v);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
  return new File([blob], `frame-${Math.round(t * 10)}.jpg`, { type: 'image/jpeg' });
}
