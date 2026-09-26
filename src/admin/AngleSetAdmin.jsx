// 각도별 그림 모음 — 그림을 올리면 코드가 각도를 재서 적어 둔다.
//
// AI 그림은 목표 각도를 정확히 지키지 못한다. 그래서 목표를 믿지 않고 올라온 그림을
// 직접 잰다. 손님 화면에서는 손님 값과 가장 가까운 그림이 나온다.
// 잰 값이 이상하면(뼈대가 엉뚱한 데 잡히면) 숫자를 손으로 고치면 된다.
import { useEffect, useRef, useState } from 'react';
import { INK, SUB, BG, box } from './theme';
import { uploadOne } from './upload';
import { loadAssets, saveAsset } from '../lib/appAssets';
import { SET_ITEMS, setKey, allSetKeys, coverage, nearestShot, nearestPair, usableShots, kindOf } from '../lib/angleShots';
import { measureImage } from '../features/angle/measureImage';
import NeckShot from '../components/NeckShot';
import { TrunkShot, ArmShot } from '../components/BodyShots';
import { openVideo, sampleVideo, spreadFrames, chooseGrid, frameFile, measureAt, measureNow, nowFile, STEP, MAX_SEC } from '../features/angle/videoFrames';

const GOLD = '#C9975A', GOLD_INK = '#8A6A3A', RED = '#B23B36', GREEN = '#2E7D50';
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// 그 항목을 재는 데 쓰는 관절만 이어 그린다 — 무엇을 보고 쟀는지 눈으로 확인하게
const BONES = {
  neck: [[7, 11], [8, 12], [11, 23], [12, 24]],
  trunk: [[11, 23], [12, 24], [23, 25], [24, 26], [11, 12], [23, 24]],
  arm: [[11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [11, 23], [12, 24]],
};

// 한 장을 재서 모음에 담을 모양으로 — 팔은 왼팔·오른팔도 적는다
const toShot = (url, m, from = null) => ({
  id: newId(), url, angle: m.angle ?? null, auto: m.angle != null, sure: m.sure ?? 0, pts: m.pts || null,
  ...(m.l != null ? { l: m.l, r: m.r } : {}),
  ...(from ? { from } : {}),   // 영상에서 뽑은 장면이면 { vid: 영상 이름, t: 초 }
});
const miniBtn = { border: 'none', background: '#fff', borderRadius: 7, padding: '3px 8px', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 11, fontWeight: 900, color: '#8A6A3A' };
const vidKey = (f) => `${f.name}·${f.size}`;

function Bones({ pts, kind }) {
  if (!Array.isArray(pts) || pts.length < 25) return null;
  const pairs = BONES[kind] || BONES.neck;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
      {pairs.map(([a, b]) => (pts[a] && pts[b] ? (
        <g key={`${a}-${b}`}>
          <line x1={pts[a].x * 100} y1={pts[a].y * 100} x2={pts[b].x * 100} y2={pts[b].y * 100}
            stroke="#fff" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          <line x1={pts[a].x * 100} y1={pts[a].y * 100} x2={pts[b].x * 100} y2={pts[b].y * 100}
            stroke="#7C6BD0" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </g>
      ) : null))}
    </svg>
  );
}

export default function AngleSetAdmin() {
  const [sets, setSets] = useState(null);           // { 키: { shots: [...] } }
  const [item, setItem] = useState(SET_ITEMS[0]);
  const [who, setWho] = useState('female');
  const [busy, setBusy] = useState('');             // 지금 하는 일 — 화면에 띄운다
  const [note, setNote] = useState('');
  const [over, setOver] = useState(false);
  const [probe, setProbe] = useState(70);           // 손님 값 흉내 — 어떤 그림이 나오는지
  const [probeR, setProbeR] = useState(120);        // 팔 — 오른팔
  const [probeL, setProbeL] = useState(60);         // 팔 — 왼팔
  const fileRef = useRef(null);
  // 연 영상 — 뽑은 장면을 앞뒤로 옮기거나 장면을 더할 때 다시 쓴다(저장소 영상은 필요할 때 연다)
  const videosRef = useRef(new Map());
  const [adding, setAdding] = useState(null);       // 장면을 더하는 중인 영상(vid)
  const [openSrc, setOpenSrc] = useState({});       // 이번에 연 영상의 주소 { vid: blob 주소 } — 화면에서 쓴다
  const addRef = useRef(null);                      // 장면 더하기 창의 영상
  const linkRef = useRef(null);                     // 영상 다시 연결 — 파일 고르기
  const [linking, setLinking] = useState(null);     // 다시 연결할 영상(vid)
  // 파일이 지워진 그림(id) — 파일 정리가 app_assets를 빠뜨려 통째로 지운 적이 있다.
  // 표에 각도·몇 초 장면인지는 남아 있으니, 원본 영상만 다시 연결하면 되살릴 수 있다.
  const [broken, setBroken] = useState({});
  const setsRef = useRef(null);
  useEffect(() => { setsRef.current = sets; });

  useEffect(() => {
    let alive = true;
    loadAssets(allSetKeys()).then((m) => {
      if (!alive) return;
      const out = {};
      allSetKeys().forEach((k) => { out[k] = { shots: (m[k]?.meta?.shots) || [], videos: (m[k]?.meta?.videos) || [] }; });
      setSets(out);
    });
    return () => { alive = false; };
  }, []);

  // 지금 탭의 그림 파일이 살아 있는지 — 주소마다 머리만 받아 본다
  const checkKey = sets ? setKey(item.short, who) : null;
  const checkUrls = sets ? (sets[checkKey]?.shots || []).map((x) => `${x.id} ${x.url}`).join('|') : '';
  useEffect(() => {
    if (!checkUrls) return undefined;
    let alive = true;
    const list = checkUrls.split('|').map((x) => x.split(' '));
    Promise.all(list.map(([id, url]) => fetch(url, { method: 'HEAD' })
      .then((r) => [id, !r.ok]).catch(() => [id, false])))
      .then((res) => { if (alive) setBroken(Object.fromEntries(res.filter(([, bad]) => bad))); });
    return () => { alive = false; };
  }, [checkUrls]);

  if (!sets) return <div style={{ ...box, fontSize: 13, color: SUB, marginBottom: 16 }}>불러오는 중…</div>;

  const key = setKey(item.short, who);
  const kind = kindOf(item);
  const isArm = kind === 'arm';
  // 한쪽 고정 칸은 움직이는 팔 값 순으로
  // 팔은 왼팔 → 오른팔 순(7×7 표와 같은 차례)
  const byNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 999);
  const shots = (sets[key]?.shots || []).slice().sort((a, b) => (isArm
    ? byNum(a.l) - byNum(b.l) || byNum(a.r) - byNum(b.r)
    : byNum(a.angle) - byNum(b.angle)));
  const cov = coverage(item, sets[key]);
  // 팔 — 손님 화면처럼 세 칸 전체에서 고른다
  const pair = isArm ? nearestPair(sets[key], probeL, probeR) : null;
  const pick = isArm ? pair?.shot : nearestShot(sets[key], probe);

  // 고칠 때마다 바로 담는다 — '저장'을 잊고 나가는 일이 없게
  // videos: [{ vid, name, url }] — 영상별로 묶어 보여 주고, 나중에 다시 열 때 쓴다
  const commit = async (k, nextShots, nextVideos = latestVideos(k)) => {
    setSets((p) => ({ ...p, [k]: { shots: nextShots, videos: nextVideos } }));
    const r = await saveAsset(k, null, { shots: nextShots, videos: nextVideos });
    if (!r.ok) setNote(`저장 실패: ${r.why}`);
  };
  const latest = (k) => setsRef.current?.[k]?.shots || [];
  const latestVideos = (k) => setsRef.current?.[k]?.videos || [];
  const videoInfo = (k, vid) => latestVideos(k).find((x) => x.vid === vid) || null;
  // 영상 열기 — 이번에 연 것이 있으면 그것, 없으면 저장소에서
  const getVideo = async (k, vid) => {
    if (videosRef.current.has(vid)) return videosRef.current.get(vid);
    const url = videoInfo(k, vid)?.url;
    if (!url) return null;
    const o = await openVideo(url);
    if (o.err) { setNote(o.err); return null; }
    videosRef.current.set(vid, o.video);
    return o.video;
  };
  // 화면에서 쓰는 것들은 state에서 읽는다(렌더 중에 ref를 읽지 않게)
  const shownInfo = (vid) => (sets[key]?.videos || []).find((x) => x.vid === vid) || null;
  const canOpen = (vid) => !!openSrc[vid] || !!shownInfo(vid)?.url;

  const addFiles = async (files) => {
    const all = [...files];
    const movies = all.filter((f) => /^video\//.test(f.type) || /\.(mp4|webm|mov|m4v)$/i.test(f.name));
    if (movies.length) await addVideos(movies);
    const list = all.filter((f) => /^image\//.test(f.type));
    if (!list.length) return;
    setNote('');
    const k = key;
    for (let i = 0; i < list.length; i += 1) {
      setBusy(`${i + 1}/${list.length} 올리는 중…`);
      const up = await uploadOne(list[i]);
      if (up.err) { setNote(up.err); continue; }
      setBusy(`${i + 1}/${list.length} 각도 재는 중…`);
      const m = await measureImage(up.url, kind);
      if (m.err || m.warn) setNote(m.err || m.warn);
      await commit(k, [...latest(k), toShot(up.url, m)]);
    }
    setBusy('');
  };

  // 영상 — 0.1초마다 재 두고, 목표 각도마다 가장 가깝고 덜 흔들린 장면을 뽑아 그림으로 담는다.
  // 여러 편을 한꺼번에 놓으면(팔 영상 4편) 모든 편에서 함께 고른다.
  const addVideos = async (files) => {
    const k = key, it = item;
    setNote('');
    const opened = [];
    const infos = [];
    for (const f of files) {
      const o = await openVideo(f);
      if (o.err) { setNote(o.err); continue; }
      videosRef.current.set(vidKey(f), o.video);
      setOpenSrc((p) => ({ ...p, [vidKey(f)]: o.video.src }));
      opened.push({ f, v: o.video });
      // 영상도 올려 둔다 — 새로 고친 뒤에도 영상별로 장면을 더하거나 옮길 수 있게
      setBusy(`영상 ${opened.length} 올리는 중…`);
      const up = await uploadOne(f, true);
      infos.push({ vid: vidKey(f), name: f.name, url: up.url || null });
      if (up.err) setNote(`${up.err} (이 영상은 이번에만 편집할 수 있어요)`);
    }
    if (!opened.length) { setBusy(''); return; }
    // 목·허리 — 영상마다 움직임의 처음과 끝을 찾아, 그 사이를 고르게 나눠 뽑는다(목 4장, 허리 8장)
    // 팔 — 모든 영상의 장면을 모아 7×7 칸마다 두 팔이 가장 가까운 장면을 하나씩 고른다
    const found = [];
    const report = [];
    const pool = [];
    let longOne = false;
    for (let i = 0; i < opened.length; i += 1) {
      const { f, v } = opened[i];
      const { samples, cut } = await sampleVideo(v, kindOf(it), (p) =>
        setBusy(`영상 ${i + 1}/${opened.length} 장면 재는 중… ${Math.round(p * 100)}%`));
      if (cut) longOne = true;
      if (it.grid) { samples.forEach((x) => pool.push({ ...x, vi: i, vid: vidKey(f) })); continue; }
      const { picks } = spreadFrames(kindOf(it), samples, it.frames);
      const name = opened.length > 1 ? `영상 ${i + 1}` : '영상';
      if (!picks.length) {
        report.push(`${name}: 움직임을 못 찾았어요(사람을 잡은 장면 ${samples.length}개).`);
        continue;
      }
      const span = (fn) => `${Math.round(Math.min(...picks.map(fn)))}°~${Math.round(Math.max(...picks.map(fn)))}°`;
      report.push(`${name}: ${picks.length}장 · ${span((x) => x.angle)}`);
      picks.forEach((x) => found.push({ ...x, vi: i, vid: vidKey(f) }));
    }
    if (it.grid) {
      const cells = chooseGrid(pool, it.grid);
      cells.forEach((c) => found.push(c.sample));
      report.push(`${it.grid.length * it.grid.length}칸 중 ${cells.length}칸을 채웠어요(사람을 잡은 장면 ${pool.length}개).`);
    }
    if (!found.length) {
      setBusy('');
      setNote(`${report.join(' ')} 사람이 또렷하게 보이는지, ${it.grid ? '두 팔이 잘 보이는지' : '처음과 끝 자세가 다른지'} 봐 주세요.`);
      return;
    }
    // 영상마다 따로 묶는다 — 다른 영상의 장면은 건드리지 않는다.
    // 같은 영상을 다시 올렸을 때만 그 영상의 장면을 새로 뽑은 것으로 바꾼다.
    const again = new Set(infos.map((x) => x.vid));
    const keep = latest(k).filter((x) => !again.has(x.from?.vid));
    const keepVideos = latestVideos(k);
    const added = [];
    for (let i = 0; i < found.length; i += 1) {
      const sample = found[i];
      setBusy(`장면 ${i + 1}/${found.length} 담는 중…`);
      const file = await frameFile(opened[sample.vi].v, sample.t);
      const up = await uploadOne(file);
      if (up.err) { setNote(up.err); continue; }
      added.push(toShot(up.url, sample, { vid: sample.vid, t: sample.t }));
    }
    const nextVideos = [...keepVideos.filter((x) => !infos.some((y) => y.vid === x.vid)), ...infos];
    await commit(k, [...keep, ...added], nextVideos);
    setBusy('');
    setNote([report.join(' / '), longOne ? `${MAX_SEC / 60}분이 넘는 영상은 앞 ${MAX_SEC / 60}분만 봤어요.` : ''].filter(Boolean).join(' '));
  };

  // 영상에서 뽑은 장면을 앞뒤로 옮긴다 — 흐리거나 표정이 어색할 때
  const nudge = async (id, dir) => {
    const k = key;
    const s = latest(k).find((x) => x.id === id);
    if (!s?.from) return;
    setBusy('영상 여는 중…');
    const v = await getVideo(k, s.from.vid);
    if (!v) { setBusy(''); return; }
    const t = Math.max(0, Math.round((s.from.t + dir * STEP / 2) * 100) / 100);
    setBusy('장면 옮기는 중…');
    const m = await measureAt(v, t, kind);
    const up = await uploadOne(await frameFile(v, t));
    setBusy('');
    if (up.err) { setNote(up.err); return; }
    if (m.err) setNote(m.err);
    const nx = toShot(up.url, m, { vid: s.from.vid, t });
    await commit(k, latest(k).map((x) => (x.id === id ? { ...nx, id } : x)));
  };

  // 장면 더하기 — 재생 막대로 고른 지금 장면을 재서 담는다(자동으로 빠진 각도를 채울 때)
  const addNow = async (vid) => {
    const k = key;
    const el = addRef.current;
    if (!el || !el.videoWidth) return;
    el.pause();
    setBusy('지금 장면 담는 중…');
    const m = await measureNow(el, kind);
    const up = await uploadOne(await nowFile(el));
    setBusy('');
    if (up.err) { setNote(up.err); return; }
    setNote(m.err ? `${m.err}` : `${m.t}초 장면을 담았어요${m.l != null ? ` (왼팔 ${m.l}° · 오른팔 ${m.r}°)` : ` (${m.angle}°)`}.`);
    await commit(k, [...latest(k), toShot(up.url, m, { vid, t: m.t })]);
  };
  const dropVideo = async (vid) => {
    const k = key;
    const n = latest(k).filter((x) => x.from?.vid === vid).length;
    if (!window.confirm(`이 영상에서 뽑은 ${n}장을 모두 뺄까요?`)) return;
    if (adding === vid) setAdding(null);
    await commit(k, latest(k).filter((x) => x.from?.vid !== vid), latestVideos(k).filter((x) => x.vid !== vid));
  };
  // 영상 다시 연결 — 예전에 뽑은 장면의 원본 영상을 올려 둔다(장면은 새로 뽑지 않는다)
  const linkVideo = async (vid, file) => {
    const k = key;
    if (!file) return;
    const o = await openVideo(file);
    if (o.err) { setNote(o.err); return; }
    videosRef.current.set(vid, o.video);
    setOpenSrc((p) => ({ ...p, [vid]: o.video.src }));
    setBusy('영상 올리는 중…');
    const up = await uploadOne(file, true);
    setBusy('');
    if (up.err) setNote(`${up.err} (이 영상은 이번에만 편집할 수 있어요)`);
    const info = { vid, name: videoInfo(k, vid)?.name || file.name, url: up.url || null };
    await commit(k, latest(k), [...latestVideos(k).filter((x) => x.vid !== vid), info]);
    // 파일이 지워진 장면을 되살린다 — 기록된 초에서 다시 잘라 올리고 주소만 바꾼다(각도·고친 값은 그대로)
    const lost = [];
    for (const x of latest(k).filter((y) => y.from?.vid === vid)) {
      const ok = await fetch(x.url, { method: 'HEAD' }).then((r) => r.ok).catch(() => true);
      if (!ok) lost.push(x);
    }
    // 다 자른 뒤 한 번에 담는다 — 한 장씩 담으면 앞에서 담은 것이 뒤에서 덮일 수 있다
    const fixed = {};
    for (let i = 0; i < lost.length; i += 1) {
      setBusy(`지워진 장면 되살리는 중… ${i + 1}/${lost.length}`);
      const fup = await uploadOne(await frameFile(o.video, lost[i].from.t));
      if (fup.err) { setNote(fup.err); continue; }
      fixed[lost[i].id] = fup.url;
    }
    const back = Object.keys(fixed).length;
    if (back) await commit(k, latest(k).map((y) => (fixed[y.id] ? { ...y, url: fixed[y.id] } : y)), [...latestVideos(k).filter((x) => x.vid !== vid), info]);
    setBusy('');
    if (lost.length) {
      setBroken((p) => { const n = { ...p }; lost.forEach((x) => { delete n[x.id]; }); return n; });
      setNote(`지워졌던 장면 ${back}장을 되살렸어요. 각도와 손으로 고친 값은 그대로예요.`);
    } else setAdding(vid);
  };
  // 장면 더하기 창에 띄울 영상 주소 — 이번에 연 것이면 그 주소, 아니면 저장소
  const srcOf = (vid) => openSrc[vid] || shownInfo(vid)?.url || null;

  const remeasure = async (id) => {
    const k = key;
    const s = latest(k).find((x) => x.id === id);
    if (!s) return;
    setBusy('다시 재는 중…');
    const m = await measureImage(s.url, kind);
    setBusy('');
    if (m.err) { setNote(m.err); return; }
    if (m.warn) setNote(m.warn);
    const sides = m.l != null ? { l: m.l, r: m.r } : {};
    await commit(k, latest(k).map((x) => (x.id === id ? { ...x, ...sides, angle: m.angle, auto: true, sure: m.sure, pts: m.pts } : x)));
  };
  const setAngle = (id, v) => {
    const n = v === '' ? null : Number(v);
    commit(key, latest(key).map((x) => (x.id === id ? { ...x, angle: Number.isFinite(n) ? n : null, auto: false } : x)));
  };
  // 팔 — 한쪽을 고치면 큰 쪽이 angle이 된다
  const setSide = (id, side, v) => {
    const n = v === '' ? null : Number(v);
    commit(key, latest(key).map((x) => {
      if (x.id !== id) return x;
      const nx = { ...x, [side]: Number.isFinite(n) ? n : null, auto: false };
      const both = [nx.l, nx.r].filter((q) => Number.isFinite(Number(q))).map(Number);
      return { ...nx, angle: both.length ? Math.max(...both) : null };
    }));
  };
  const drop = (id) => {
    if (!window.confirm('이 그림을 모음에서 뺄까요? (저장소 파일은 남습니다)')) return;
    commit(key, latest(key).filter((x) => x.id !== id));
  };

  const tabBtn = (on) => ({
    padding: '7px 15px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 12.5, fontWeight: 800, background: on ? GOLD : 'transparent', color: on ? '#fff' : SUB,
  });
  const pill = { display: 'inline-flex', background: '#fff', borderRadius: 999, padding: 3, boxShadow: 'inset 0 0 0 1px #EDE9E2' };

  // 모은 그림 — 영상별로 묶는다
  const card = (s) => {
    const low = s.auto && (s.sure ?? 0) < 0.5;
    const isPick = pick && pick.id === s.id;
    return (
      <div key={s.id} style={{ background: BG, borderRadius: 12, padding: 7,
        boxShadow: isPick ? `inset 0 0 0 2px ${GOLD}` : 'none' }}>
        <div style={{ position: 'relative', background: '#fff', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 2' }}>
          <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
          <Bones pts={s.pts} kind={kind} />
          {broken[s.id] && (
            <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(251,234,233,0.92)', color: RED, fontSize: 12, fontWeight: 900, textAlign: 'center', padding: 6 }}>
              파일 없음
            </span>
          )}
        </div>
        {isArm && (
          // 앞모습이라 그 사람의 오른팔이 화면 왼쪽에 있다 — 칸도 그 순서로
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[['r', '오른팔'], ['l', '왼팔']].map(([side, lb]) => (
              <label key={side} style={{ flex: 1, fontSize: 10, fontWeight: 800, color: SUB }}>
                {lb}
                <input type="number" value={s[side] ?? ''} placeholder="?"
                  onChange={(e) => setSide(s.id, side, e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 13, fontWeight: 900,
                    padding: '3px 5px', borderRadius: 8, border: `1px solid ${s[side] == null ? RED : '#EDE9E2'}` }} />
              </label>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
          {!isArm && <>
          <input type="number" value={s.angle ?? ''} placeholder="?"
            onChange={(e) => setAngle(s.id, e.target.value)}
            style={{ width: 56, fontFamily: 'inherit', fontSize: 14, fontWeight: 900, padding: '4px 6px',
              borderRadius: 8, border: `1px solid ${s.angle == null ? RED : '#EDE9E2'}` }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: INK }}>°</span>
          </>}
          {isArm && isPick && pair.flip && (
            <span style={{ fontSize: 10, fontWeight: 800, color: GOLD_INK }}>뒤집어 씀</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800,
            color: s.angle == null ? RED : s.auto ? (low ? RED : GREEN) : GOLD_INK }}>
            {s.angle == null ? '못 잼' : s.auto ? (low ? '흐림' : '자동') : '손으로'}
          </span>
        </div>
        {s.from && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 10, fontWeight: 800, color: SUB }}>
            {canOpen(s.from.vid) && (
              <button type="button" onClick={() => nudge(s.id, -1)} disabled={!!busy} style={miniBtn}>◀</button>
            )}
            <span style={{ flex: 1, textAlign: 'center' }}>영상 {s.from.t.toFixed(1)}초</span>
            {canOpen(s.from.vid) && (
              <button type="button" onClick={() => nudge(s.id, 1)} disabled={!!busy} style={miniBtn}>▶</button>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
          <button type="button" onClick={() => remeasure(s.id)} disabled={!!busy}
            style={{ flex: 1, border: 'none', background: '#fff', borderRadius: 7, padding: '4px 0', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: SUB }}>다시 재기</button>
          <button type="button" onClick={() => drop(s.id)}
            style={{ border: 'none', background: '#fff', borderRadius: 7, padding: '4px 8px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 800, color: RED }}>빼기</button>
        </div>
      </div>
    );
  };
  const groups = [];
  shots.forEach((s) => {
    const vid = s.from?.vid || null;
    let g = groups.find((x) => x.vid === vid);
    if (!g) {
      g = { vid, name: vid ? (shownInfo(vid)?.name || vid.split('·')[0]) : '그림으로 올린 것', shots: [] };
      groups.push(g);
    }
    g.shots.push(s);
  });
  // 장면을 다 뺀 영상도 목록에 남긴다 — 거기서 다시 장면을 더할 수 있게
  (sets[key]?.videos || []).forEach((v) => {
    if (!groups.some((g) => g.vid === v.vid)) groups.push({ vid: v.vid, name: v.name, shots: [] });
  });
  groups.sort((x, y) => (x.vid ? 0 : 1) - (y.vid ? 0 : 1));

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>각도별 그림 모음</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        그림을 여러 장 <b>한꺼번에 끌어다 놓으면</b> 올리고 → <b>각도를 재서</b> → 담기까지 알아서 합니다.
        <br />손님 화면에서는 손님 값과 <b>가장 가까운 그림</b>이 나옵니다. 목표 각도를 정확히 맞추지 않아도 됩니다 —
        <b> 고르게 퍼져 있는 게</b> 더 중요합니다.
        <br />보라색 선은 코드가 <b>무엇을 보고 쟀는지</b>입니다. 선이 엉뚱한 데 붙었으면 숫자를 직접 고쳐 주세요.
        <br /><b>영상</b>을 놓으면 움직임의 <b>처음과 끝</b>을 찾아, 그 사이를 고르게 나눠
        <b> 목은 4장, 허리는 8장</b>을 뽑아 담습니다(영상 한 편마다).
        팔 영상은 <b>7×7 표의 칸마다</b> 두 팔이 가장 가까운 장면을 찾아 담습니다 — 여러 편이면 한꺼번에 놓아 주세요.
        <br />그림은 <b>영상별로 묶여</b> 보입니다. 빠진 각도는 <b>＋ 장면 더하기</b>로 재생 막대에서 직접 골라 담고, 흐린 장면은 카드의 ◀ ▶로 앞뒤 장면으로 바꿉니다.
        <br /><b>옆으로 팔 들기</b>는 왼팔·오른팔을 따로 재서 <b>7×7 표</b>(0°~180°, 30° 간격)에 채웁니다.
        손님 두 팔 값과 가장 가까운 그림이 나옵니다.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={pill}>
          {SET_ITEMS.map((x) => (
            <button key={x.short} type="button" onClick={() => setItem(x)} style={tabBtn(item.short === x.short)}>{x.label}</button>
          ))}
        </div>
        <div style={pill}>
          {[['female', '여성'], ['male', '남성']].map(([k, lb]) => (
            <button key={k} type="button" onClick={() => setWho(k)} style={tabBtn(who === k)}>{lb}</button>
          ))}
        </div>
        <span style={{ alignSelf: 'center', fontSize: 12, fontWeight: 800, color: GOLD }}>
          {item.label} · {item.view} · {usableShots(sets[key]).length}장
        </span>
      </div>

      {/* 목표 각도마다 채워졌는지 — 빈 자리가 어디인지 한눈에 */}
      <div style={{ ...box, background: BG, marginBottom: 14 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: INK, marginBottom: 8 }}>
          {item.grid ? `두 팔 조합 ${cov.filter((c) => c.hit).length}/${cov.length}칸` : '목표 각도'}
          <span style={{ fontWeight: 700, color: SUB }}> — 초록은 가까운 그림이 있음, 회색은 빈 자리</span>
        </div>
        {item.grid ? (
          // 가로 = 오른팔, 세로 = 왼팔
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 11, fontWeight: 800 }}>
              <thead>
                <tr>
                  <th style={{ color: SUB, fontWeight: 800, textAlign: 'left', paddingRight: 4 }}>왼 \ 오</th>
                  {item.grid.map((R) => <th key={R} style={{ color: SUB, fontWeight: 800, width: 38 }}>{R}°</th>)}
                </tr>
              </thead>
              <tbody>
                {item.grid.map((L) => (
                  <tr key={L}>
                    <th style={{ color: SUB, fontWeight: 800, textAlign: 'left', paddingRight: 4 }}>{L}°</th>
                    {item.grid.map((R) => {
                      const hit = cov.find((c) => c.L === L && c.R === R)?.hit;
                      return (
                        <td key={R} title={`왼팔 ${L}° · 오른팔 ${R}°`}
                          style={{ height: 22, borderRadius: 6, textAlign: 'center',
                            background: hit ? '#EDF7F0' : '#F1EEE8', color: hit ? GREEN : '#C9C2B6' }}>
                          {hit ? '✓' : '·'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {cov.map((c) => (
              <span key={c.target} style={{ fontSize: 12, fontWeight: 900, borderRadius: 999, padding: '4px 10px',
                background: c.hit ? '#EDF7F0' : '#F1EEE8', color: c.hit ? GREEN : '#B4ADA2' }}>
                {c.hit ? '✓ ' : ''}{c.target}°
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 올리는 자리 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (!busy) addFiles(e.dataTransfer.files || []); }}
        onClick={() => { if (!busy) fileRef.current?.click(); }}
        style={{ borderRadius: 14, padding: '20px 14px', textAlign: 'center', cursor: busy ? 'default' : 'pointer', marginBottom: 12,
          background: over ? '#FFF6E6' : '#fff', boxShadow: `inset 0 0 0 2px ${over ? GOLD : '#EDE9E2'}`, borderStyle: 'dashed' }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: busy ? GOLD_INK : INK }}>
          {busy || `${item.label} ${who === 'female' ? '여성' : '남성'} 그림이나 영상을 여기에 끌어다 놓으세요`}
        </div>
        {!busy && <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600, marginTop: 4 }}>여러 장을 한꺼번에 놓아도 됩니다 · 눌러서 고르기</div>}
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple style={{ display: 'none' }}
          onChange={(e) => { addFiles(e.target.files || []); e.target.value = ''; }} />
      </div>
      {note && <div style={{ fontSize: 12, fontWeight: 700, color: RED, marginBottom: 14 }}>{note}</div>}

      <input ref={linkRef} type="file" accept="video/*" style={{ display: 'none' }}
        onChange={(e) => { linkVideo(linking, e.target.files?.[0]); e.target.value = ''; }} />
      {Object.keys(broken).length > 0 && (
        <div style={{ background: '#FBEAE9', borderRadius: 12, padding: '11px 13px', marginBottom: 14, fontSize: 12.5,
          fontWeight: 700, color: INK, lineHeight: 1.75 }}>
          <b style={{ color: RED }}>그림 파일이 지워진 {Object.keys(broken).length}장</b>이 있어요. 각도와 고친 값은 남아 있습니다.
          <br />영상 묶음의 <b>영상 다시 연결</b>을 눌러 <b>그 원본 영상</b>을 고르면 같은 장면을 다시 잘라 되살립니다.
          그림으로 올린 것은 빼고 다시 올려 주세요.
        </div>
      )}
      {/* 모은 그림 — 영상별로 묶는다. 영상마다 장면을 더하거나 모두 뺄 수 있다 */}
      {groups.map((g) => (
          <div key={g.vid || 'img'} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: INK }}>{g.vid ? '🎬 ' : '🖼 '}{g.name}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: SUB }}>{g.shots.length}장</span>
              {g.vid && (
                <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  {canOpen(g.vid) && (
                    <button type="button" disabled={!!busy} onClick={() => setAdding(adding === g.vid ? null : g.vid)}
                      style={{ ...miniBtn, padding: '5px 11px', fontSize: 12, background: adding === g.vid ? GOLD : '#fff',
                        color: adding === g.vid ? '#fff' : GOLD_INK, boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
                      {adding === g.vid ? '장면 더하기 닫기' : '＋ 장면 더하기'}
                    </button>
                  )}
                  {g.vid && (
                    <button type="button" disabled={!!busy} onClick={() => { setLinking(g.vid); linkRef.current?.click(); }}
                      title="예전에 뽑은 장면의 원본 영상을 골라 주면, 장면을 더하거나 옮길 수 있어요"
                      style={{ ...miniBtn, padding: '5px 11px', fontSize: 12, boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
                      영상 다시 연결
                    </button>
                  )}
                  <button type="button" disabled={!!busy} onClick={() => dropVideo(g.vid)}
                    style={{ ...miniBtn, padding: '5px 11px', fontSize: 12, color: RED, boxShadow: 'inset 0 0 0 1px #EDE9E2' }}>
                    모두 빼기
                  </button>
                </span>
              )}
            </div>
            {adding === g.vid && (
              // 재생 막대로 원하는 순간을 찾고 '지금 장면 담기' — 자동으로 빠진 각도를 채운다
              <div style={{ ...box, background: BG, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                <video ref={addRef} src={srcOf(g.vid) || undefined} crossOrigin="anonymous" controls muted playsInline
                  style={{ height: 260, borderRadius: 10, background: '#000' }} />
                <div style={{ flex: '1 1 200px', fontSize: 12, color: SUB, fontWeight: 700, lineHeight: 1.8 }}>
                  재생 막대를 움직여 담을 순간을 고른 뒤 누르세요.<br />
                  ◀ ▶는 아주 조금(한 장면)씩 옮깁니다.
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[[-1, '◀'], [1, '▶']].map(([d, lb]) => (
                      <button key={d} type="button" style={{ ...miniBtn, padding: '6px 12px', boxShadow: 'inset 0 0 0 1px #EDE9E2' }}
                        onClick={() => { const el = addRef.current; if (el) { el.pause(); el.currentTime = Math.max(0, el.currentTime + d / 30); } }}>
                        {lb}
                      </button>
                    ))}
                    <button type="button" disabled={!!busy} onClick={() => addNow(g.vid)}
                      style={{ ...miniBtn, padding: '6px 14px', fontSize: 12.5, background: GOLD, color: '#fff' }}>
                      지금 장면 담기
                    </button>
                  </div>
                </div>
              </div>
            )}
            {g.shots.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 12 }}>
                {g.shots.map(card)}
              </div>
            )}
          </div>
        ))}

      {/* 손님 값을 흉내 내 어떤 그림이 나오는지 */}
      {usableShots(sets[key]).length > 0 && !isArm && (
        <div style={{ ...box, background: BG }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: INK, marginBottom: 6 }}>
            손님 값이 <span style={{ color: GOLD }}>{probe}°</span>면
            → <span style={{ color: GOLD }}>{pick ? `${pick.angle}° 그림` : '—'}</span>이 나옵니다
            <span style={{ fontWeight: 700, color: SUB }}> (노란 테두리)</span>
          </div>
          <input type="range" min={item.short === 'neck' ? 40 : 0} max={item.short === 'neck' ? 95 : 150} value={probe}
            onChange={(e) => setProbe(Number(e.target.value))} style={{ width: '100%', accentColor: '#C9A227' }} />
          {/* 목은 손님 화면처럼 그림 위에 선을 그어 본다 — 선이 목에 제대로 붙는지 확인 */}
          {item.short === 'neck' && pick?.pts && (
            <div style={{ width: 170, marginTop: 10, background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
              <NeckShot url={pick.url} pts={pick.pts} value={probe} prev={probe - 6} />
            </div>
          )}
          {item.short === 'trunk' && pick?.pts && (
            <div style={{ width: 170, marginTop: 10, background: '#fff', borderRadius: 10, overflow: 'hidden' }}>
              <TrunkShot url={pick.url} pts={pick.pts} value={probe} prev={probe - 10} />
            </div>
          )}
          {pick?.pts && (
            <div style={{ fontSize: 11, color: SUB, fontWeight: 700, marginTop: 4 }}>진한 선은 손님 값, 흐린 선은 지난번(예시)</div>
          )}
        </div>
      )}
      {isArm && usableShots(sets[key]).length > 0 && (
        <div style={{ ...box, background: BG, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: INK, marginBottom: 6 }}>
              손님이 오른팔 <span style={{ color: GOLD }}>{probeR}°</span> · 왼팔 <span style={{ color: GOLD }}>{probeL}°</span>면
              → <span style={{ color: GOLD }}>{pick ? `오 ${pick.r}° · 왼 ${pick.l}° 그림` : '—'}</span>
              {pair?.flip && <span style={{ color: GOLD }}>을 뒤집어</span>} 보여 줍니다
              <span style={{ fontWeight: 700, color: SUB }}> (선은 손님 값)</span>
            </div>
            {[['오른팔', probeR, setProbeR], ['왼팔', probeL, setProbeL]].map(([lb, v, set]) => (
              <label key={lb} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, fontWeight: 800, color: SUB }}>
                <span style={{ width: 36 }}>{lb}</span>
                <input type="range" min={0} max={180} value={v} onChange={(e) => set(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#C9A227' }} />
              </label>
            ))}
          </div>
          {pick && (
            <div style={{ width: 130, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
              <ArmShot url={pick.url} pts={pick.pts} left={probeL} right={probeR} flip={pair.flip} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
