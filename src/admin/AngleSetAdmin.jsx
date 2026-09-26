// 각도별 그림 모음 — 그림을 올리면 코드가 각도를 재서 적어 둔다.
//
// AI 그림은 목표 각도를 정확히 지키지 못한다. 그래서 목표를 믿지 않고 올라온 그림을
// 직접 잰다. 손님 화면에서는 손님 값과 가장 가까운 그림이 나온다.
// 잰 값이 이상하면(뼈대가 엉뚱한 데 잡히면) 숫자를 손으로 고치면 된다.
import { useEffect, useRef, useState } from 'react';
import { INK, SUB, BG, box, btn } from './theme';
import { uploadOne } from './upload';
import { loadAssets, saveAsset } from '../lib/appAssets';
import { SET_ITEMS, setKey, allSetKeys, coverage, nearestShot, nearestPair, usableShots } from '../lib/angleShots';
import { imgKey } from '../lib/angleLevels';
import { measureImage } from '../features/angle/measureImage';
import { openVideo, sampleVideo, chooseFrames, frameFile, measureAt, STEP } from '../features/angle/videoFrames';

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
  const [probeR, setProbeR] = useState(150);        // 팔 — 오른팔
  const [probeL, setProbeL] = useState(120);        // 팔 — 왼팔
  const fileRef = useRef(null);
  // 이번에 연 영상 — 뽑은 장면을 앞뒤로 옮길 때 다시 쓴다. 새로 고치면 사라진다.
  const videosRef = useRef(new Map());
  const [vids, setVids] = useState([]);
  const setsRef = useRef(null);
  useEffect(() => { setsRef.current = sets; });

  useEffect(() => {
    let alive = true;
    loadAssets(allSetKeys()).then((m) => {
      if (!alive) return;
      const out = {};
      allSetKeys().forEach((k) => { out[k] = { shots: (m[k]?.meta?.shots) || [] }; });
      setSets(out);
    });
    return () => { alive = false; };
  }, []);

  if (!sets) return <div style={{ ...box, fontSize: 13, color: SUB, marginBottom: 16 }}>불러오는 중…</div>;

  const key = setKey(item.short, who);
  const shots = (sets[key]?.shots || []).slice().sort((a, b) => (Number(a.angle) || 999) - (Number(b.angle) || 999)
    || (Math.min(Number(a.l), Number(a.r)) || 0) - (Math.min(Number(b.l), Number(b.r)) || 0));
  const cov = coverage(item, sets[key]);
  const isArm = item.short === 'arm';
  const pair = isArm ? nearestPair(sets[key], probeL, probeR) : null;
  const pick = isArm ? pair?.shot : nearestShot(sets[key], probe);

  // 고칠 때마다 바로 담는다 — '저장'을 잊고 나가는 일이 없게
  const commit = async (k, nextShots) => {
    setSets((p) => ({ ...p, [k]: { shots: nextShots } }));
    const r = await saveAsset(k, null, { shots: nextShots });
    if (!r.ok) setNote(`저장 실패: ${r.why}`);
  };
  const latest = (k) => setsRef.current?.[k]?.shots || [];

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
      const m = await measureImage(up.url, item.short);
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
    for (const f of files) {
      const o = await openVideo(f);
      if (o.err) { setNote(o.err); continue; }
      videosRef.current.set(vidKey(f), o.video);
      opened.push({ f, v: o.video });
    }
    if (!opened.length) return;
    setVids([...videosRef.current.keys()]);
    let samples = [];
    let longOne = false;
    for (let i = 0; i < opened.length; i += 1) {
      const { f, v } = opened[i];
      const { samples: got, cut } = await sampleVideo(v, it.short, (p) =>
        setBusy(`영상 ${i + 1}/${opened.length} 장면 재는 중… ${Math.round(p * 100)}%`));
      if (cut) longOne = true;
      samples = samples.concat(got.map((x) => ({ ...x, vi: i, vid: vidKey(f) })));
    }
    const picks = chooseFrames(it, samples);
    const want = it.pairs ? it.pairs.length : it.targets.length;
    if (!picks.length) {
      setBusy('');
      setNote(`영상에서 쓸 만한 장면을 못 찾았어요 (사람을 잡은 장면 ${samples.length}개). 사람이 또렷하게 보이는지, 목표 각도까지 움직이는지 봐 주세요.`);
      return;
    }
    let keep = latest(k);
    if (keep.length && window.confirm(
      `영상에서 ${picks.length}장을 뽑았어요 (목표 ${want}자리 중).\n\n`
      + `지금 모음에 있는 ${keep.length}장을 빼고 영상 장면으로 바꿀까요?\n`
      + '(취소를 누르면 지금 그림은 두고 옆에 더합니다)')) keep = [];
    const added = [];
    for (let i = 0; i < picks.length; i += 1) {
      const { sample } = picks[i];
      setBusy(`장면 ${i + 1}/${picks.length} 담는 중…`);
      const file = await frameFile(opened[sample.vi].v, sample.t);
      const up = await uploadOne(file);
      if (up.err) { setNote(up.err); continue; }
      added.push(toShot(up.url, sample, { vid: sample.vid, t: sample.t }));
    }
    await commit(k, [...keep, ...added]);
    setBusy('');
    const missed = coverage(it, { shots: [...keep, ...added] }).filter((c) => !c.hit).map((c) => (typeof c.target === 'number' ? `${c.target}°` : c.target));
    setNote([
      missed.length ? `아직 빈 자리: ${missed.join(', ')} — 영상이 그 각도까지 움직이지 않았어요.` : '',
      longOne ? '30초가 넘는 영상은 앞 30초만 봤어요.' : '',
    ].filter(Boolean).join(' '));
  };

  // 영상에서 뽑은 장면을 앞뒤로 옮긴다 — 흐리거나 표정이 어색할 때
  const nudge = async (id, dir) => {
    const k = key;
    const s = latest(k).find((x) => x.id === id);
    const v = s?.from && videosRef.current.get(s.from.vid);
    if (!v) return;
    const t = Math.max(0, Math.round((s.from.t + dir * STEP) * 100) / 100);
    setBusy('장면 옮기는 중…');
    const m = await measureAt(v, t, item.short);
    const up = await uploadOne(await frameFile(v, t));
    setBusy('');
    if (up.err) { setNote(up.err); return; }
    if (m.err) setNote(m.err);
    const nx = toShot(up.url, m, { vid: s.from.vid, t });
    await commit(k, latest(k).map((x) => (x.id === id ? { ...nx, id } : x)));
  };

  // 예전에 올린 단계 그림 3장을 가져와 잰다 — 버리지 않고 알맞은 자리에 끼운다
  const importLevels = async () => {
    const k = key;
    const lv = await loadAssets([1, 2, 3].map((n) => imgKey(item.short, who, n)));
    const urls = [1, 2, 3].map((n) => lv[imgKey(item.short, who, n)]?.url).filter(Boolean)
      .filter((u) => !latest(k).some((s) => s.url === u));
    if (!urls.length) { setNote('가져올 단계 그림이 없어요(이미 가져왔거나 비어 있어요).'); return; }
    for (let i = 0; i < urls.length; i += 1) {
      setBusy(`단계 그림 ${i + 1}/${urls.length} 재는 중…`);
      const m = await measureImage(urls[i], item.short);
      await commit(k, [...latest(k), toShot(urls[i], m)]);
    }
    setBusy('');
  };

  const remeasure = async (id) => {
    const k = key;
    const s = latest(k).find((x) => x.id === id);
    if (!s) return;
    setBusy('다시 재는 중…');
    const m = await measureImage(s.url, item.short);
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

  return (
    <div style={{ ...box, marginBottom: 16 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: INK, marginBottom: 4 }}>각도별 그림 모음</div>
      <div style={{ fontSize: 12, color: SUB, lineHeight: 1.8, marginBottom: 14 }}>
        그림을 여러 장 <b>한꺼번에 끌어다 놓으면</b> 올리고 → <b>각도를 재서</b> → 담기까지 알아서 합니다.
        <br />손님 화면에서는 손님 값과 <b>가장 가까운 그림</b>이 나옵니다. 목표 각도를 정확히 맞추지 않아도 됩니다 —
        <b> 고르게 퍼져 있는 게</b> 더 중요합니다.
        <br />보라색 선은 코드가 <b>무엇을 보고 쟀는지</b>입니다. 선이 엉뚱한 데 붙었으면 숫자를 직접 고쳐 주세요.
        <br /><b>영상</b>을 놓으면 0.1초마다 각도를 재서 <b>목표 각도마다 한 장면씩</b> 뽑아 담습니다.
        팔 영상은 여러 편을 한꺼번에 놓아 주세요. 뽑힌 장면이 흐리면 ◀ ▶로 앞뒤 장면으로 바꿀 수 있습니다(영상을 연 채로 있는 동안만).
        <br /><b>옆으로 팔 들기</b>는 왼팔·오른팔을 따로 잽니다. 오른팔이 높은 그림만 올려도 됩니다 —
        왼팔이 높은 손님에게는 그림을 <b>좌우로 뒤집어</b> 보여 줍니다.
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
          목표 각도 <span style={{ fontWeight: 700, color: SUB }}>— 초록은 가까운 그림이 있음, 회색은 빈 자리</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {cov.map((c) => (
            <span key={c.target} style={{ fontSize: 12, fontWeight: 900, borderRadius: 999, padding: '4px 10px',
              background: c.hit ? '#EDF7F0' : '#F1EEE8', color: c.hit ? GREEN : '#B4ADA2' }}>
              {c.hit ? '✓ ' : ''}{typeof c.target === 'number' ? `${c.target}°` : c.target}
            </span>
          ))}
        </div>
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
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
        <button type="button" onClick={importLevels} disabled={!!busy} style={btn(false)}>
          예전 단계 그림 3장 가져와 재기
        </button>
        {note && <span style={{ fontSize: 12, fontWeight: 700, color: RED }}>{note}</span>}
      </div>

      {/* 모은 그림 — 각도 순으로 */}
      {shots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))', gap: 12, marginBottom: 16 }}>
          {shots.map((s) => {
            const low = s.auto && (s.sure ?? 0) < 0.5;
            const isPick = pick && pick.id === s.id;
            return (
              <div key={s.id} style={{ background: BG, borderRadius: 12, padding: 7,
                boxShadow: isPick ? `inset 0 0 0 2px ${GOLD}` : 'none' }}>
                <div style={{ position: 'relative', background: '#fff', borderRadius: 8, overflow: 'hidden', aspectRatio: '1 / 2' }}>
                  <img src={s.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
                  <Bones pts={s.pts} kind={item.short} />
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
                    {vids.includes(s.from.vid) && (
                      <button type="button" onClick={() => nudge(s.id, -1)} disabled={!!busy} style={miniBtn}>◀</button>
                    )}
                    <span style={{ flex: 1, textAlign: 'center' }}>영상 {s.from.t.toFixed(1)}초</span>
                    {vids.includes(s.from.vid) && (
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
          })}
        </div>
      )}

      {/* 손님 값을 흉내 내 어떤 그림이 나오는지 */}
      {usableShots(sets[key]).length > 0 && !isArm && (
        <div style={{ ...box, background: BG }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: INK, marginBottom: 6 }}>
            손님 값이 <span style={{ color: GOLD }}>{probe}°</span>면
            → <span style={{ color: GOLD }}>{pick ? `${pick.angle}° 그림` : '—'}</span>이 나옵니다
            <span style={{ fontWeight: 700, color: SUB }}> (노란 테두리)</span>
          </div>
          <input type="range" min={item.short === 'neck' ? 40 : 10} max={item.short === 'neck' ? 95 : 145} value={probe}
            onChange={(e) => setProbe(Number(e.target.value))} style={{ width: '100%', accentColor: '#C9A227' }} />
        </div>
      )}
      {isArm && usableShots(sets[key]).length > 0 && (
        <div style={{ ...box, background: BG, display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 240px' }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: INK, marginBottom: 6 }}>
              손님이 오른팔 <span style={{ color: GOLD }}>{probeR}°</span> · 왼팔 <span style={{ color: GOLD }}>{probeL}°</span>면
              → <span style={{ color: GOLD }}>{pick ? `오 ${pick.r}° · 왼 ${pick.l}° 그림` : '—'}</span>
              {pair?.flip && <span style={{ color: GOLD }}>을 뒤집어</span>} 보여 줍니다
            </div>
            {[['오른팔', probeR, setProbeR], ['왼팔', probeL, setProbeL]].map(([lb, v, set]) => (
              <label key={lb} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11.5, fontWeight: 800, color: SUB }}>
                <span style={{ width: 36 }}>{lb}</span>
                <input type="range" min={40} max={185} value={v} onChange={(e) => set(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#C9A227' }} />
              </label>
            ))}
          </div>
          {pick && (
            <img src={pick.url} alt="" style={{ height: 150, borderRadius: 8, background: '#fff',
              transform: pair.flip ? 'scaleX(-1)' : 'none' }} />
          )}
        </div>
      )}
    </div>
  );
}
