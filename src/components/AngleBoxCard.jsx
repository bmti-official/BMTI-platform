// 각도기록 — 이번달 기록에 서는 한 상자.
//
// 흩어져 있던 넷(이번 달 움직임 · 이번 달 최고 기록 · 가장 많이 달라진 곳 · 옆모습 견주기)을
// 여기 하나로 합쳤다. 네 상자가 같은 숫자를 돌려 말하고 있었고, 그 숫자가
// 무엇을 뜻하는지는 어느 상자도 보여 주지 못했다.
//
// 그림이 답을 맡는다.
//   목 숙임  … 가만히 섰을 때의 자세다. 사람 모형을 그 각도만큼 실제로 기울인다.
//   허리 굽힘 … '굽혔다 돌아오기'의 최댓값, 곧 가동 범위다. 자세가 아니라 부채꼴로 그린다.
//   어깨 들림 … 팔을 올린 최댓값. 이것도 부채꼴이다.
// 자세와 가동 범위를 같은 모양으로 그리면 '허리가 70도 굽은 사람'처럼 읽힌다.
import { useEffect, useMemo, useState } from 'react';
import { ITEMS, vsLastWeek, vsLastMonth, canTrend } from '../lib/angleRecord';
import { ANGLE_ITEMS } from '../lib/octFindings';
import { getTypeAccent } from '../lib/typeAccent';
import { toView } from '../lib/angleView';
import { loadAssets, ANGLE_BODY, DEFAULT_META } from '../lib/appAssets';
import { LEVEL_ITEMS, LEVEL_NAME, LEVELS_KEY, DEFAULT_CUTS, levelOf, pickImage, allImageKeys } from '../lib/angleLevels';

const C = { ink: '#1C1A17', sub: '#9B9489', line: '#EDE9E2' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';
const GOLD = '#C9975A';
const PURPLE = '#7C6BD0';   // 사진 위에서 잘 보이는 보라. 흰 테를 밑에 깔고 쓴다.

const GOOD = 55;
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const r1 = (v) => Math.round(v * 10) / 10;
const md = (w) => `${Number(String(w).slice(5, 7))}월 ${Number(String(w).slice(8, 10))}일`;

// ── 옆모습 그림 ────────────────────────────────────────────
// 선 하나에 각도 하나. 목은 실제로 기울이고, 허리·어깨는 부채꼴로 범위를 보인다.
function Figure({ neck, trunk, arm, ghostNeck, t, sel }) {
  const W = 150, H = 210;
  const shX = 70, shY = 74;          // 어깨
  const hipY = 140, kneeY = 174, ankY = 200;
  const rad = (d) => (d * Math.PI) / 180;
  // 하나를 고르면 그것만 그린다. 셋이 한꺼번에 있으면 뭐가 뭔지 모른다.
  const show = (k) => sel == null || sel === k;
  // 목 — 어깨에서 위로, 앞(오른쪽)으로 기운다
  const neckLen = 34;
  const headAt = (deg) => [shX + Math.sin(rad(deg)) * neckLen, shY - Math.cos(rad(deg)) * neckLen];
  const [hx, hy] = headAt(neck ?? 0);
  const [gx, gy] = headAt(ghostNeck ?? 0);
  // 허리 굽힘 — 골반을 축으로 몸통이 앞으로 눕는 범위
  const trunkLen = hipY - shY;
  const bent = trunk != null
    ? [shX + Math.sin(rad(trunk)) * trunkLen, hipY - Math.cos(rad(trunk)) * trunkLen]
    : null;
  // 어깨 들림 — 팔이 아래로 늘어진 데서 옆으로 올라간 범위
  const armLen = 46;
  const armEnd = arm != null
    ? [shX + Math.sin(rad(arm)) * armLen, shY + Math.cos(rad(arm)) * armLen]
    : null;
  const arc = (cx, cy, r, a0, a1, from) => {
    const p = (deg) => (from === 'up'
      ? [cx + Math.sin(rad(deg)) * r, cy - Math.cos(rad(deg)) * r]
      : [cx + Math.sin(rad(deg)) * r, cy + Math.cos(rad(deg)) * r]);
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', maxWidth: 150 }}>
      {/* 허리 굽힘 범위 — 부채꼴과 흐린 몸통 */}
      {bent && show('trunk_flex') && (
        <>
          <path d={arc(shX, hipY, trunkLen * 0.82, 0, Math.min(trunk, 90), 'up')}
            stroke={GOLD} strokeWidth="1.6" fill="none" strokeDasharray="3 4" opacity="0.8" />
          <line x1={shX} y1={hipY} x2={bent[0]} y2={bent[1]} stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
        </>
      )}
      {/* 어깨 들림 범위 */}
      {armEnd && show('arm_raise') && (
        <>
          <path d={arc(shX, shY, armLen * 0.9, 0, Math.min(arm, 175), 'down')}
            stroke={GOLD} strokeWidth="1.6" fill="none" strokeDasharray="3 4" opacity="0.8" />
          <line x1={shX} y1={shY} x2={armEnd[0]} y2={armEnd[1]} stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        </>
      )}

      {/* 지난주 목 — 흐리게 뒤에 */}
      {show('neck_bend') && ghostNeck != null && Math.abs((ghostNeck ?? 0) - (neck ?? 0)) >= 0.5 && (
        <>
          <line x1={shX} y1={shY} x2={gx} y2={gy} stroke="#C6BFB2" strokeWidth="6" strokeLinecap="round" opacity="0.55" />
          <circle cx={gx} cy={gy - 8} r="13" fill="#C6BFB2" opacity="0.4" />
        </>
      )}

      {/* 몸통·다리 — 가만히 선 자세 */}
      <line x1={shX} y1={shY} x2={shX} y2={hipY} stroke={t.accentDeep} strokeWidth="7" strokeLinecap="round" />
      <line x1={shX} y1={hipY} x2={shX - 3} y2={kneeY} stroke={t.accentDeep} strokeWidth="7" strokeLinecap="round" />
      <line x1={shX - 3} y1={kneeY} x2={shX - 1} y2={ankY} stroke={t.accentDeep} strokeWidth="7" strokeLinecap="round" />
      <line x1={shX - 1} y1={ankY} x2={shX + 13} y2={ankY} stroke={t.accentDeep} strokeWidth="6" strokeLinecap="round" />
      {/* 목·머리 — 실제 기운 만큼 */}
      <line x1={shX} y1={shY} x2={hx} y2={hy} stroke={t.accentDeep} strokeWidth="7" strokeLinecap="round" />
      <circle cx={hx} cy={hy - 8} r="13" fill={t.accentDeep} />
      {/* 곧게 선 기준선 */}
      <line x1={shX} y1={shY - 46} x2={shX} y2={shY} stroke="#DDD7CB" strokeWidth="1.4" strokeDasharray="3 4" />
    </svg>
  );
}


// 사진으로 그리는 옆모습.
//
// 한 장짜리 그림이라 관절이 움직이지 않는다. 그래서 **어깨 위쪽만 따로 떼어**
// 잰 각도만큼 돌린다. 아래는 그대로 두니 목만 앞으로 나온 모습이 된다.
// 어깨가 그림 어디쯤인지는 관리자에서 맞춰 둔다 — 그림마다 다르다.
// 사진 위에 얇은 선 하나만 두면 옷·배경에 묻힌다. 흰 테를 밑에 깔고 그 위에 보라를 얹는다.
function Halo({ d, on, purple }) {
  return (
    <>
      <path d={d} stroke="#fff" strokeWidth={on ? 5 : 3.5} fill="none" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" opacity="0.95" />
      <path d={d} stroke={purple} strokeWidth={on ? 2.4 : 1.6} fill="none" strokeLinecap="round"
        strokeDasharray="2.5 2.5" vectorEffect="non-scaling-stroke" />
    </>
  );
}
function HaloLine({ x1, y1, x2, y2, on, purple }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fff" strokeWidth={on ? 6 : 4}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.95" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={purple} strokeWidth={on ? 3 : 2}
        strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </>
  );
}

export function PhotoFigure({ src, meta, neck, trunk, arm, ghostNeck, t, sel, guide = false }) {
  const m = { ...DEFAULT_META, ...(meta || {}) };
  const turn = (v) => (v == null ? 0 : Math.max(-25, Math.min(45, v - m.baseNeck)));
  const body = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
  const headClip = `inset(0 0 ${100 - m.shoulderY}% 0)`;
  const bodyClip = `inset(${m.shoulderY}% 0 0 0)`;
  const origin = `${m.shoulderX}% ${m.shoulderY}%`;
  const rad = (d) => (d * Math.PI) / 180;
  // 하나를 고르면 그것만 진하게, 나머지는 지운다. 셋이 한꺼번에 있으면 뭐가 뭔지 모른다.
  const show = (k) => sel == null || sel === k;
  const dim = (k) => (sel === k ? 1 : 0.5);

  // 부채꼴은 그림 위에 겹쳐 그린다. 0~100 좌표를 쓰므로 그림 크기와 상관없다.
  const arc = (cx, cy, r, deg, from) => {
    const p = (d) => (from === 'up'
      ? [cx + Math.sin(rad(d)) * r, cy - Math.cos(rad(d)) * r * 1.6]
      : [cx + Math.sin(rad(d)) * r, cy + Math.cos(rad(d)) * r * 1.6]);
    const [x0, y0] = p(0), [x1, y1] = p(Math.min(deg, 170));
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${(r * 1.6).toFixed(1)} 0 ${deg > 180 ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 2', overflow: 'hidden' }}>
      {/* 지난주 머리 — 흐리게 뒤에. 목을 고른 때만 보여 준다 */}
      {(sel == null || sel === 'neck_bend') && ghostNeck != null && Math.abs(turn(ghostNeck) - turn(neck)) >= 0.5 && (
        <img src={src} alt="" aria-hidden
          style={{ ...body, clipPath: headClip, WebkitClipPath: headClip, transformOrigin: origin,
            transform: `rotate(${turn(ghostNeck).toFixed(1)}deg)`, opacity: 0.32, filter: 'grayscale(1)' }} />
      )}
      {/* 몸 — 어깨 아래 */}
      <img src={src} alt="옆모습" style={{ ...body, clipPath: bodyClip, WebkitClipPath: bodyClip }} />
      {/* 머리 — 잰 각도만큼 앞으로 */}
      <img src={src} alt="" aria-hidden
        style={{ ...body, clipPath: headClip, WebkitClipPath: headClip, transformOrigin: origin,
          transform: `rotate(${turn(neck).toFixed(1)}deg)`, transition: 'transform .4s ease' }} />

      {/* 굽힘·들림 범위 부채꼴 — 보라 선에 흰 테 */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {trunk != null && show('trunk_flex') && (
          <>
            <Halo d={arc(m.shoulderX, m.hipY, 14, trunk, 'up')} on={sel === 'trunk_flex'} purple={PURPLE} />
            <HaloLine x1={m.shoulderX} y1={m.hipY}
              x2={m.shoulderX + Math.sin(rad(Math.min(trunk, 90))) * 14}
              y2={m.hipY - Math.cos(rad(Math.min(trunk, 90))) * 14 * 1.6}
              on={sel === 'trunk_flex'} purple={PURPLE} />
          </>
        )}
        {arm != null && show('arm_raise') && (
          <>
            <Halo d={arc(m.shoulderX, m.shoulderY, 10, arm, 'down')} on={sel === 'arm_raise'} purple={PURPLE} />
            <HaloLine x1={m.shoulderX} y1={m.shoulderY}
              x2={m.shoulderX + Math.sin(rad(Math.min(arm, 175))) * 10}
              y2={m.shoulderY + Math.cos(rad(Math.min(arm, 175))) * 10 * 1.6}
              on={sel === 'arm_raise'} purple={PURPLE} />
          </>
        )}
        {/* 곧게 선 기준선 — 목을 볼 때만 */}
        {show('neck_bend') && (
          <Halo d={`M${m.shoulderX} ${m.shoulderY - 16} L${m.shoulderX} ${m.shoulderY}`}
            on={sel === 'neck_bend'} purple="#B7B0A3" />
        )}

        {/* 맞추기 안내선 — 관리자에서만 켠다 */}
        {guide && (
          <>
            <line x1="0" y1={m.shoulderY} x2="100" y2={m.shoulderY} stroke="#E0554F" strokeWidth="1.2"
              strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <line x1={m.shoulderX} y1="0" x2={m.shoulderX} y2="100" stroke="#E0554F" strokeWidth="1.2"
              strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <line x1="0" y1={m.hipY} x2="100" y2={m.hipY} stroke="#2F6FE0" strokeWidth="1.2"
              strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {guide && (
        <>
          <span style={{ position: 'absolute', left: 3, top: `${m.shoulderY}%`, transform: 'translateY(-115%)',
            fontSize: 10, fontWeight: 900, color: '#E0554F', textShadow: '0 0 3px #fff, 0 0 3px #fff' }}>어깨선</span>
          <span style={{ position: 'absolute', left: 3, top: `${m.hipY}%`, transform: 'translateY(-115%)',
            fontSize: 10, fontWeight: 900, color: '#2F6FE0', textShadow: '0 0 3px #fff, 0 0 3px #fff' }}>골반선</span>
        </>
      )}
      {/* 각도 눈금 — 사진 위라 글씨에 흰 테를 두른다 */}
      {neck != null && show('neck_bend') && (
        <span style={{ position: 'absolute', left: `${m.shoulderX + 7}%`, top: `${Math.max(2, m.shoulderY - 19)}%`,
          fontSize: 12.5, fontWeight: 900, color: t.accentDeep, opacity: dim('neck_bend'),
          textShadow: '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff' }}>{neck}°</span>
      )}
      {trunk != null && sel === 'trunk_flex' && (
        <span style={{ position: 'absolute', left: `${m.shoulderX + 16}%`, top: `${m.hipY - 12}%`,
          fontSize: 12.5, fontWeight: 900, color: PURPLE,
          textShadow: '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff' }}>{trunk}°</span>
      )}
      {arm != null && sel === 'arm_raise' && (
        <span style={{ position: 'absolute', left: `${m.shoulderX + 13}%`, top: `${m.shoulderY + 10}%`,
          fontSize: 12.5, fontWeight: 900, color: PURPLE,
          textShadow: '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff' }}>{arm}°</span>
      )}
    </div>
  );
}

export default function AngleBoxCard({ rows: raw = [], gender = null, previewBody = null, guide = false }) {
  const t = getTypeAccent();
  // 목은 담긴 값(수직 기준)과 보여 줄 값(CVA)의 기준선이 다르다.
  // 부르는 쪽마다 바꾸면 빠뜨리거나 두 번 하게 된다 — 여기 한 곳에서만 바꾼다.
  const rows = useMemo(() => toView(raw), [raw]);
  // 처음부터 한 항목을 골라 둔다. 아무것도 안 고른 채로 두면 단계 그림이 안 뜨고,
  // 무엇을 눌러야 하는지도 모른 채 숫자만 셋 보게 된다.
  // 실제로 잰 항목이 우선, 겹치면 목 숙임.
  const firstItem = (() => {
    // Number(null)은 0이라 유한수로 통과한다. 빈 칸을 '쟀다'로 읽으면 안 된다.
    const has = (k) => (rows || []).some((x) => usable(x) && x[k] != null && Number.isFinite(Number(x[k])));
    if (has('neck_bend')) return 'neck_bend';
    const hit = LEVEL_ITEMS.find((x) => has(x.key));
    return hit ? hit.key : 'neck_bend';
  })();
  const [open, setOpen] = useState(firstItem);
  const [asset, setAsset] = useState(null);
  const g = String(gender || '').toLowerCase();
  const key = g.includes('female') || g.includes('여') ? ANGLE_BODY.female : ANGLE_BODY.male;
  useEffect(() => {
    let alive = true;
    loadAssets([ANGLE_BODY.male, ANGLE_BODY.female, LEVELS_KEY, ...allImageKeys()])
      .then((m) => { if (alive) setAsset(m || {}); });
    return () => { alive = false; };
  }, []);
  // previewBody — 관리자에서 저장 전 값으로 바로 보려고 넘긴다. 손님 화면에선 늘 null.
  const body = previewBody?.url ? previewBody : (asset?.[key]?.url ? asset[key] : null);
  const who = key === ANGLE_BODY.female ? 'female' : 'male';
  const cuts = { ...DEFAULT_CUTS, ...(asset?.[LEVELS_KEY]?.meta || {}) };
  const ok = (rows || []).filter(usable);
  if (!ok.length) return null;

  const now = ok[0];
  const prev = ok[1] || null;
  const trend = canTrend(ok);

  // 이번 달 가장 좋았던 값과, 처음 잰 판에서 가장 크게 달라진 곳
  const sorted = ok.slice().sort((a, b) => String(a.week).localeCompare(String(b.week)));
  const first = sorted[0];
  const moves = ANGLE_ITEMS.map((it) => {
    const a = num(first[it.key]), b = num(now[it.key]);
    if (a == null || b == null || first === now) return null;
    const diff = r1(b - a);
    return { ...it, diff, better: it.better === 'low' ? diff < 0 : diff > 0 };
  }).filter(Boolean);
  const top = moves.length ? moves.reduce((a, b) => (Math.abs(b.diff) > Math.abs(a.diff) ? b : a)) : null;
  const best = ANGLE_ITEMS.map((it) => {
    const vs = ok.map((r) => num(r[it.key])).filter((v) => v != null);
    if (!vs.length) return null;
    return { ...it, v: r1(it.better === 'low' ? Math.min(...vs) : Math.max(...vs)) };
  }).filter(Boolean);

  // 고른 항목에 단계 그림이 올라와 있으면 그걸 쓴다. 한 장을 돌려 쓰는 것보다 정확하다 —
  // 목은 옆에서, 어깨는 앞에서 봐야 하는데 한 장으로는 둘을 같이 담을 수 없다.
  const shotItem = LEVEL_ITEMS.find((x) => x.key === open) || null;
  const shotLv = shotItem ? levelOf(shotItem, num(now[shotItem.key]), cuts) : null;
  const shot = shotItem ? pickImage(asset, shotItem, who, shotLv) : null;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: t.accentSoft, fontSize: 16 }}>📐</span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: C.ink }}>각도기록</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: C.sub }}>{md(now.week)} 잰 것</span>
      </div>

      {top && (
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.6, margin: '6px 0 2px', wordBreak: 'keep-all' }}>
          처음 잰 날보다 <b style={{ color: t.accentDeep }}>{top.label}</b>이 가장 많이 달라졌어요
          <span style={{ color: C.sub, fontWeight: 700 }}> ({top.diff > 0 ? '+' : ''}{top.diff}°)</span>
        </div>
      )}

      {/* 그림 — 목은 실제 기울기, 허리·어깨는 범위 부채꼴.
          오른쪽 항목을 누르면 그것만 강조되고, 자세한 내용도 그 자리에서 펼쳐진다. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, margin: '10px 0 4px' }}>
        <div style={{ flex: '0 0 44%', maxWidth: 190, background: '#FAF7F0', borderRadius: 16, padding: '8px 4px', overflow: 'hidden' }}>
          {shot
            ? <LevelShot shot={shot} item={shotItem} value={num(now[shotItem.key])} t={t} />
            : body
              ? <PhotoFigure src={body.url} meta={body.meta} neck={num(now.neck_bend)} trunk={num(now.trunk_flex)}
                  arm={num(now.arm_raise)} ghostNeck={prev ? num(prev.neck_bend) : null} t={t} sel={open} guide={guide} />
              : <Figure neck={num(now.neck_bend)} trunk={num(now.trunk_flex)} arm={num(now.arm_raise)}
                  ghostNeck={prev ? num(prev.neck_bend) : null} t={t} sel={open} />}
        </div>

        {/* 오른쪽 — 누르면 그림에서 강조되고, 아래로 자세한 내용이 펼쳐진다 */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ITEMS.map((item) => {
            const meta = ANGLE_ITEMS.find((x) => x.key === item.key) || {};
            const v = num(now[item.key]);
            const b = best.find((x) => x.key === item.key);
            const wk = vsLastWeek(ok, item.key);
            const mo = vsLastMonth(ok, item.key);
            const on = open === item.key;
            const line = ok.filter((r) => Number.isFinite(Number(r[item.key]))).slice(0, 8).reverse();
            return (
              <button key={item.key} type="button" onClick={() => setOpen(on ? null : item.key)}
                style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? '#FAF7F0' : '#fff', borderRadius: 13, padding: '9px 10px',
                  boxShadow: on ? `inset 0 0 0 2px ${t.accent}` : `inset 0 0 0 1px ${C.line}`, transition: 'box-shadow .15s' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 900, color: C.ink }}>{item.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 17, fontWeight: 900, color: on ? t.accentDeep : C.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {v == null ? '—' : v}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: on ? t.accentDeep : C.ink }}>°</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: C.sub, width: 11, textAlign: 'right' }}>
                    {on ? '▴' : '▾'}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, marginTop: 2, wordBreak: 'keep-all', lineHeight: 1.4 }}>
                  {wk === null ? '지난주 기록이 없어요'
                    : wk === 0 ? '지난주와 그대로예요'
                      : `지난주보다 ${Math.abs(wk)}도 ${wk < 0 ? item.less : item.more}`}
                </div>

                {on && (
                  <div style={{ marginTop: 9, paddingTop: 9, borderTop: `1px solid ${C.line}` }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: C.sub, lineHeight: 1.6, marginBottom: 8, wordBreak: 'keep-all' }}>
                      {meta.plain}
                    </div>
                    {trend ? <Spark rows={line} field={item.key} /> : (
                      <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 600 }}>
                        네 번 재면 흐름을 그려 드려요. 지금은 {line.length}번.
                      </div>
                    )}
                    <div style={{ fontSize: 10.5, color: C.sub, fontWeight: 700, marginTop: 8, lineHeight: 1.6 }}>
                      {b && <>이번 달 최고 {b.v}°<br /></>}
                      {mo === null ? '지난달과 견주려면 두 달치가 필요해요.'
                        : mo === 0 ? '지난달 평균과 그대로예요.'
                          : `지난달 평균보다 ${Math.abs(mo)}도 ${mo < 0 ? item.less : item.more}`}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 11, marginTop: 10, fontSize: 10.5, fontWeight: 700, color: C.sub, flexWrap: 'wrap' }}>
        {open === null && <span>항목을 누르면 그림에서 그것만 짚어 드려요</span>}
        {!shot && open === 'neck_bend' && (
          <>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: t.accentDeep }} />지금
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 3, borderRadius: 2, background: '#C6BFB2' }} />지난주
            </span>
          </>
        )}
        {!shot && (open === 'trunk_flex' || open === 'arm_raise') && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 3, borderRadius: 2, background: PURPLE }} />움직인 범위
          </span>
        )}
        {shot && <span>{shotItem.view}으로 본 모습이에요</span>}
      </div>
    </div>
  );
}

// 단계 그림 — 잰 값에 맞는 사진 한 장. 선을 긋지 않아도 모습 자체가 말해 준다.
function LevelShot({ shot, item, value, t }) {
  const name = LEVEL_NAME[shot.level];
  const tint = shot.level === 1 ? '#5E9463' : shot.level === 2 ? '#9A7A16' : '#B23B36';
  return (
    <div style={{ position: 'relative' }}>
      <img src={shot.url} alt={`${item.label} ${name}`}
        style={{ width: '100%', aspectRatio: '1 / 2', objectFit: 'contain', display: 'block' }} />
      <span style={{ position: 'absolute', left: 6, top: 6, fontSize: 11, fontWeight: 900, color: tint,
        background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '3px 9px' }}>
        {name}
      </span>
      {value != null && (
        <span style={{ position: 'absolute', right: 6, bottom: 6, fontSize: 14, fontWeight: 900, color: t.accentDeep,
          background: 'rgba(255,255,255,0.92)', borderRadius: 999, padding: '3px 9px' }}>
          {value}°
        </span>
      )}
      {!shot.exact && (
        <span style={{ position: 'absolute', left: 6, bottom: 6, fontSize: 9.5, fontWeight: 800, color: '#9B9489',
          background: 'rgba(255,255,255,0.9)', borderRadius: 999, padding: '2px 7px' }}>
          비슷한 단계 그림
        </span>
      )}
    </div>
  );
}

// 꺾은선 — 눈금은 적지 않는다. 절대값이 아니라 흐름만 보여 준다.
function Spark({ rows, field }) {
  const vs = rows.map((r) => Number(r[field]));
  if (vs.length < 2) return null;
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const span = hi - lo || 1;
  const W = 260, H = 54;
  const pt = (v, i) => [(i / (vs.length - 1)) * W, H - ((v - lo) / span) * (H - 10) - 5];
  const d = vs.map((v, i) => `${i === 0 ? 'M' : 'L'}${pt(v, i).map((n) => n.toFixed(1)).join(' ')}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <path d={d} fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {vs.map((v, i) => <circle key={i} cx={pt(v, i)[0]} cy={pt(v, i)[1]} r="2.6" fill={GOLD} />)}
    </svg>
  );
}
