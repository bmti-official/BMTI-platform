// 영상에서 각도별 장면 뽑기 — 천천히 움직이는 영상 하나에 중간 각도가 다 지나간다.
//
// 그림을 따로 뽑으면 장마다 얼굴·체형·조명이 조금씩 달라진다. 영상에서 잘라 내면
// 사람은 그대로이고 각도만 바뀐다. 0.1초마다 장면을 재 두고, 움직임의 처음부터 끝까지를
// 고르게 나눠 장면을 뽑는다. 영상 파일은 올리지 않고 브라우저 안에서만 연다.
import { measureSource } from './measureImage';

export const STEP = 0.1;          // 몇 초마다 잴까
export const MAX_SEC = 240;       // 이보다 길면 앞부분만 본다(팔 49자세를 한 편에 담으면 길다)
const LONG = 60;                  // 이보다 긴 영상은 0.2초마다 잰다(재는 시간을 반으로)
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

/** 영상 전체를 STEP초(긴 영상은 두 배)마다 잰다. onStep(한 비율 0~1) */
export async function sampleVideo(v, kind, onStep) {
  const end = Math.min(v.duration || 0, MAX_SEC);
  const out = [];
  let prev = null;
  const step = end > LONG ? STEP * 2 : STEP;
  for (let t = 0; t <= end; t += step) {
    const m = await measureAt(v, t, kind);
    if (!m.err) {
      out.push({ ...m, motion: moved(prev, m) });
      prev = m;
    }
    onStep?.(end ? t / end : 1);
  }
  return { samples: out, cut: (v.duration || 0) > MAX_SEC };
}

// 움직임의 정도 — 팔은 두 팔을 더한 값(한 팔만 움직여도, 두 팔이 함께 움직여도 따라간다)
const progressOf = (kind, s) => (kind === 'arm'
  ? (s.l != null && s.r != null ? s.l + s.r : null)
  : s.angle);

/** 영상 하나에서 n장면. 움직임이 시작한 각도와 끝난 각도를 찾고, 그 사이를
 *  같은 각도 간격으로 나눠 가장 가깝고 덜 흔들린 장면을 고른다. 목표 각도와는 상관없다.
 *  (시간으로 나누면 천천히 움직인 구간에 몰린다 — 그래서 각도로 나눈다)
 *  돌려주는 것: { picks: [장면...], lo, hi } — 움직임이 거의 없으면 picks가 비어 있다. */
export function spreadFrames(kind, samples, n) {
  const ok = samples.filter((s) => (s.sure ?? 0) >= MIN_SURE && progressOf(kind, s) != null);
  if (ok.length < 2) return { picks: [], lo: null, hi: null };
  // 처음·마지막 — 튀는 한두 장면에 끌려가지 않게 양 끝 2%는 버린다
  const vals = ok.map((s) => progressOf(kind, s)).sort((a, b) => a - b);
  const q = (f) => vals[Math.round(f * (vals.length - 1))];
  const lo = q(0.02), hi = q(0.98);
  if (hi - lo < 3) return { picks: [], lo, hi };
  const used = new Set();
  const picks = [];
  const gap = (hi - lo) / (n - 1);
  for (let i = 0; i < n; i += 1) {
    const want = lo + gap * i;
    let best = null;
    ok.forEach((s) => {
      if (used.has(s.t)) return;
      const score = Math.abs(progressOf(kind, s) - want) + (s.motion || 0) * SHAKE;
      if (!best || score < best.score) best = { s, score };
    });
    if (!best) break;
    // 동작이 휙 지나가 그 사이 장면이 없으면, 이미 뽑은 것과 거의 같은 자세가 잡힌다 — 건너뛴다
    const p = progressOf(kind, best.s);
    if (picks.some((x) => Math.abs(progressOf(kind, x) - p) < gap / 4)) continue;
    used.add(best.s.t);
    picks.push(best.s);
  }
  picks.sort((a, b) => progressOf(kind, a) - progressOf(kind, b));
  return { picks, lo, hi };
}

/** 팔 — 7×7 칸마다 장면 하나. 장면은 두 팔이 가장 가까운 칸 하나에만 들어간다
 *  (그 사이 자세가 없을 때 같은 자세가 옆 칸까지 채우지 않게). 칸 안에서는 가장 가깝고 덜 흔들린 것.
 *  두 팔 중 하나라도 칸에서 tol도 넘게 떨어지면 버린다.
 *  samples에는 vi(몇 번째 영상)가 붙어 있다. 돌려주는 것: [{ L, R, sample }] — 없는 칸은 빠진다. */
export function chooseGrid(samples, grid, tol = 20) {
  const near = (v) => grid.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a));
  const best = new Map();
  samples.forEach((s) => {
    if ((s.sure ?? 0) < MIN_SURE || s.l == null || s.r == null) return;
    const L = near(s.l), R = near(s.r);
    if (Math.abs(s.l - L) > tol || Math.abs(s.r - R) > tol) return;
    const score = Math.hypot(s.l - L, s.r - R) + (s.motion || 0) * SHAKE;
    const k = `${L}:${R}`;
    if (!best.has(k) || score < best.get(k).score) best.set(k, { L, R, sample: s, score });
  });
  return grid.flatMap((L) => grid.map((R) => best.get(`${L}:${R}`)).filter(Boolean))
    .map(({ L, R, sample }) => ({ L, R, sample }));
}

/** t초 장면을 jpg 파일로 */
export async function frameFile(v, t) {
  await seek(v, t);
  const c = canvasOf(v);
  const blob = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.92));
  return new File([blob], `frame-${Math.round(t * 10)}.jpg`, { type: 'image/jpeg' });
}
