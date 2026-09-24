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
import { useEffect, useState } from 'react';
import { ITEMS, vsLastWeek, vsLastMonth, canTrend } from '../lib/angleRecord';
import { ANGLE_ITEMS } from '../lib/octFindings';
import { getTypeAccent } from '../lib/typeAccent';
import { loadAssets, ANGLE_BODY, DEFAULT_META } from '../lib/appAssets';

const C = { ink: '#1C1A17', sub: '#9B9489', line: '#EDE9E2' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';
const GOLD = '#C9975A';

const GOOD = 55;
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const r1 = (v) => Math.round(v * 10) / 10;
const md = (w) => `${Number(String(w).slice(5, 7))}월 ${Number(String(w).slice(8, 10))}일`;

// ── 옆모습 그림 ────────────────────────────────────────────
// 선 하나에 각도 하나. 목은 실제로 기울이고, 허리·어깨는 부채꼴로 범위를 보인다.
function Figure({ neck, trunk, arm, ghostNeck, t }) {
  const W = 150, H = 210;
  const shX = 70, shY = 74;          // 어깨
  const hipY = 140, kneeY = 174, ankY = 200;
  const rad = (d) => (d * Math.PI) / 180;
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
      {bent && (
        <>
          <path d={arc(shX, hipY, trunkLen * 0.82, 0, Math.min(trunk, 90), 'up')}
            stroke={GOLD} strokeWidth="1.6" fill="none" strokeDasharray="3 4" opacity="0.8" />
          <line x1={shX} y1={hipY} x2={bent[0]} y2={bent[1]} stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity="0.45" />
        </>
      )}
      {/* 어깨 들림 범위 */}
      {armEnd && (
        <>
          <path d={arc(shX, shY, armLen * 0.9, 0, Math.min(arm, 175), 'down')}
            stroke={GOLD} strokeWidth="1.6" fill="none" strokeDasharray="3 4" opacity="0.8" />
          <line x1={shX} y1={shY} x2={armEnd[0]} y2={armEnd[1]} stroke={GOLD} strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        </>
      )}

      {/* 지난주 목 — 흐리게 뒤에 */}
      {ghostNeck != null && Math.abs((ghostNeck ?? 0) - (neck ?? 0)) >= 0.5 && (
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
function PhotoFigure({ src, meta, neck, trunk, arm, ghostNeck, t }) {
  const m = { ...DEFAULT_META, ...(meta || {}) };
  const turn = (v) => (v == null ? 0 : Math.max(-25, Math.min(45, v - m.baseNeck)));
  const body = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
  const headClip = `inset(0 0 ${100 - m.shoulderY}% 0)`;
  const bodyClip = `inset(${m.shoulderY}% 0 0 0)`;
  const origin = `${m.shoulderX}% ${m.shoulderY}%`;
  const rad = (d) => (d * Math.PI) / 180;

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
      {/* 지난주 머리 — 흐리게 뒤에 */}
      {ghostNeck != null && Math.abs(turn(ghostNeck) - turn(neck)) >= 0.5 && (
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

      {/* 굽힘·들림 범위 부채꼴 */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {trunk != null && (
          <path d={arc(m.shoulderX, m.hipY, 12, trunk, 'up')} stroke={GOLD} strokeWidth="1"
            fill="none" strokeDasharray="2 2.5" vectorEffect="non-scaling-stroke" opacity="0.9" />
        )}
        {arm != null && (
          <path d={arc(m.shoulderX, m.shoulderY, 9, arm, 'down')} stroke={GOLD} strokeWidth="1"
            fill="none" strokeDasharray="2 2.5" vectorEffect="non-scaling-stroke" opacity="0.9" />
        )}
        {/* 곧게 선 기준선 */}
        <line x1={m.shoulderX} y1={m.shoulderY - 16} x2={m.shoulderX} y2={m.shoulderY}
          stroke="#C9C3B7" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* 목 각도 눈금 — 사진 위라 글씨에 흰 테를 두른다 */}
      {neck != null && (
        <span style={{ position: 'absolute', left: `${m.shoulderX + 6}%`, top: `${Math.max(2, m.shoulderY - 18)}%`,
          fontSize: 11, fontWeight: 900, color: t.accentDeep,
          textShadow: '0 0 3px #fff, 0 0 3px #fff, 0 0 3px #fff' }}>{neck}°</span>
      )}
    </div>
  );
}

export default function AngleBoxCard({ rows = [], gender = null, previewBody = null }) {
  const t = getTypeAccent();
  const [open, setOpen] = useState(null);
  const [asset, setAsset] = useState(null);
  const g = String(gender || '').toLowerCase();
  const key = g.includes('female') || g.includes('여') ? ANGLE_BODY.female : ANGLE_BODY.male;
  useEffect(() => {
    let alive = true;
    loadAssets([ANGLE_BODY.male, ANGLE_BODY.female]).then((m) => { if (alive) setAsset(m || {}); });
    return () => { alive = false; };
  }, []);
  // previewBody — 관리자에서 저장 전 값으로 바로 보려고 넘긴다. 손님 화면에선 늘 null.
  const body = previewBody?.url ? previewBody : (asset?.[key]?.url ? asset[key] : null);
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

      {/* 그림 — 목은 실제 기울기, 허리·어깨는 범위 부채꼴 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 4px' }}>
        <div style={{ flex: '0 0 132px', background: '#FAF7F0', borderRadius: 16, padding: '8px 4px', overflow: 'hidden' }}>
          {body
            ? <PhotoFigure src={body.url} meta={body.meta} neck={num(now.neck_bend)} trunk={num(now.trunk_flex)}
                arm={num(now.arm_raise)} ghostNeck={prev ? num(prev.neck_bend) : null} t={t} />
            : <Figure neck={num(now.neck_bend)} trunk={num(now.trunk_flex)} arm={num(now.arm_raise)}
                ghostNeck={prev ? num(prev.neck_bend) : null} t={t} />}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {ANGLE_ITEMS.map((it) => {
            const v = num(now[it.key]);
            const b = best.find((x) => x.key === it.key);
            return (
              <div key={it.key}>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.sub }}>{it.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 19, fontWeight: 900, color: C.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {v == null ? '—' : v}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>°</span>
                  {b && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.sub }}>최고 {b.v}°</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 11, margin: '8px 0 12px', fontSize: 10.5, fontWeight: 700, color: C.sub, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: t.accentDeep }} />지금 자세
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: '#C6BFB2' }} />지난주 목
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: GOLD }} />굽히고 올린 범위
        </span>
      </div>

      {/* 지난주와 견준 세 줄 — 각도기록 화면과 같은 말투로 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {ITEMS.map((item) => {
          const wk = vsLastWeek(ok, item.key);
          const mo = vsLastMonth(ok, item.key);
          const on = open === item.key;
          const line = ok.filter((r) => Number.isFinite(Number(r[item.key]))).slice(0, 8).reverse();
          return (
            <button key={item.key} type="button" onClick={() => setOpen(on ? null : item.key)}
              style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                background: on ? '#FAF7F0' : '#fff', borderRadius: 14, padding: '12px 13px',
                boxShadow: `inset 0 0 0 1px ${C.line}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ flex: '0 0 62px', fontSize: 12.5, fontWeight: 900, color: C.ink }}>{item.label}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700, color: C.sub, wordBreak: 'keep-all' }}>
                  {wk === null ? '지난주 기록이 없어요'
                    : wk === 0 ? <>지난주와 <b style={{ color: C.ink }}>그대로예요</b></>
                      : <>지난주보다 <b style={{ color: C.ink }}>{Math.abs(wk)}도 {wk < 0 ? item.less : item.more}</b></>}
                </span>
                <span style={{ flexShrink: 0, fontSize: 14, fontWeight: 900, color: C.sub }}>
                  {wk === null ? '' : wk === 0 ? '—' : wk < 0 ? '▼' : '▲'}
                </span>
              </div>
              {on && (
                <div style={{ marginTop: 11, paddingTop: 11, borderTop: `1px solid ${C.line}` }}>
                  {trend ? <Spark rows={line} field={item.key} /> : (
                    <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 600 }}>
                      네 번 재면 흐름을 그려 드릴게요. 지금은 {line.length}번 쟀어요.
                    </div>
                  )}
                  <div style={{ fontSize: 11.5, color: C.sub, fontWeight: 700, marginTop: 9 }}>
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
