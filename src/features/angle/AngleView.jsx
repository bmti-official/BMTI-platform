// 각도기록 — 이번 주 상태, 항목 셋, 함께 본 것.
//
// **절대 각도를 보여 주지 않는다.** '목 숙임 18도'는 의학 측정으로 읽힌다.
// 지난주보다 얼마나 달라졌는지만 말한다.
// 좋아짐·나빠짐 색도 쓰지 않는다. 주 한 번 잰 값으로 판정하면 과하게 반응한다.
import { josa } from '../../lib/josa';
import { toView } from '../../lib/angleView';
import { useMemo, useState } from 'react';
import { ITEMS, sundayOf, vsLastWeek, vsLastMonth, canTrend, TREND_FROM } from '../../lib/angleRecord';

const INK = '#1C1A17', SUB = '#8A8378', LINE = '#EDE9E2';
const YELLOW = '#FDF6DC', GOLD_INK = '#8A6A3A';

const day = (iso) => {
  const [, m, d] = String(iso || '').split('-');
  return m ? `${Number(m)}월 ${Number(d)}일` : '';
};

export default function AngleView({ rows: raw = [], onMeasure, push = null }) {
  const [open, setOpen] = useState('');
  // 목은 담긴 값과 보여 줄 값의 기준선이 다르다. 여기서 한 번만 바꿔 둔다.
  const rows = useMemo(() => toView(raw), [raw]);
  const week = sundayOf();
  const now = rows.find((r) => r.week === week);
  const trend = canTrend(rows);
  const left = Math.max(0, TREND_FROM - rows.length);

  return (
    <div style={{ fontFamily: "'Pretendard',-apple-system,sans-serif", color: INK }}>
      {/* 이번 주 — 잰 날이 보이는 게 좋다. 일요일~토요일 아무 때나 재니까 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: now ? '#fff' : YELLOW,
        borderRadius: 14, padding: '13px 14px', marginBottom: 14,
        boxShadow: now ? `inset 0 0 0 1px ${LINE}` : 'none' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: now ? INK : GOLD_INK }}>
            {now ? '이번 주 다 쟀어요' : '이번 주 아직이에요'}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: SUB, marginTop: 2 }}>
            {now ? `${day(now.measured_at?.slice(0, 10) || now.week)}에 쟀어요` : '일요일부터 토요일 사이 아무 때나'}
          </div>
        </div>
        <button type="button" onClick={onMeasure}
          style={{ flexShrink: 0, padding: '10px 15px', borderRadius: 12, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12.5, fontWeight: 800, background: '#fff', color: INK,
            boxShadow: '0 3px 10px rgba(217,185,106,0.45)' }}>
          {now ? '다시 재기' : '재러 가기 →'}
        </button>
      </div>

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {ITEMS.map((it) => (
              <Card key={it.key} item={it} rows={rows} trend={trend}
                open={open === it.key} onToggle={() => setOpen((k) => (k === it.key ? '' : it.key))} />
            ))}
          </div>

          {!trend && (
            <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600, textAlign: 'center',
              lineHeight: 1.7, marginBottom: 14 }}>
              {left}번 더 재면 흐름을 그려 드릴게요.
            </div>
          )}

          <Together rows={rows} />
        </>
      )}

      {push}
    </div>
  );
}

function Card({ item, rows, trend, open, onToggle }) {
  const wk = vsLastWeek(rows, item.key);
  const mo = vsLastMonth(rows, item.key);
  const line = useMemo(
    () => rows.filter((r) => Number.isFinite(Number(r[item.key]))).slice(0, 8).reverse(),
    [rows, item.key],
  );

  return (
    <button type="button" onClick={onToggle}
      style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        background: '#fff', borderRadius: 14, padding: '13px 14px', boxShadow: `inset 0 0 0 1px ${LINE}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: '0 0 68px', fontSize: 13, fontWeight: 900 }}>{item.label}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: SUB }}>
          {wk === null ? '지난주 기록이 없어요'
            : wk === 0 ? <>지난주와 <b style={{ color: INK }}>그대로예요</b></>
              : <>지난주보다 <b style={{ color: INK }}>{Math.abs(wk)}도 {wk < 0 ? item.less : item.more}</b></>}
        </span>
        <span style={{ flexShrink: 0, fontSize: 15, fontWeight: 900, color: SUB }}>
          {wk === null ? '' : wk === 0 ? '—' : wk < 0 ? '▼' : '▲'}
        </span>
      </div>

      {open && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${LINE}` }}>
          {trend ? <Spark rows={line} field={item.key} /> : (
            <div style={{ fontSize: 11.5, color: SUB, fontWeight: 600 }}>
              네 번 재면 흐름을 그려 드릴게요. 지금은 {line.length}번 쟀어요.
            </div>
          )}
          <div style={{ fontSize: 11.5, color: SUB, fontWeight: 700, marginTop: 10 }}>
            {mo === null ? '지난달과 견주려면 두 달치가 필요해요.'
              : mo === 0 ? '지난달 평균과 그대로예요.'
                : `지난달 평균보다 ${Math.abs(mo)}도 ${mo < 0 ? item.less : item.more}`}
          </div>
        </div>
      )}
    </button>
  );
}

// 꺾은선 — 눈금은 적지 않는다. 절대값이 아니라 흐름만 보여 준다.
function Spark({ rows, field }) {
  const vs = rows.map((r) => Number(r[field]));
  if (vs.length < 2) return null;
  const lo = Math.min(...vs), hi = Math.max(...vs);
  const span = hi - lo || 1;
  const W = 260, H = 54;
  const pt = (v, i) => [
    (i / (vs.length - 1)) * W,
    H - ((v - lo) / span) * (H - 10) - 5,
  ];
  const d = vs.map((v, i) => `${i === 0 ? 'M' : 'L'}${pt(v, i).map((n) => n.toFixed(1)).join(' ')}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block' }}>
      <path d={d} fill="none" stroke="#C9975A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      {vs.map((v, i) => {
        const [x, y] = pt(v, i);
        return <circle key={i} cx={x} cy={y} r={i === vs.length - 1 ? 3.6 : 2.2} fill="#C9975A" />;
      })}
    </svg>
  );
}

// 함께 본 것 — 인과가 아니라 나란히 놓기만 한다.
// "A 때문에 B"가 아니라 "A한 주에 B였다".
function Together({ rows }) {
  const lines = [];
  ITEMS.forEach((it) => {
    const wk = vsLastWeek(rows, it.key);
    if (wk === null || wk === 0) return;
    lines.push(`${josa(it.label, '이')} 지난주보다 ${Math.abs(wk)}도 ${wk < 0 ? it.less : it.more}`);
  });
  if (!lines.length) return null;
  return (
    <div style={{ background: YELLOW, borderRadius: 14, padding: '13px 15px' }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: GOLD_INK, marginBottom: 7 }}>이번 주에 본 것</div>
      {lines.map((t) => (
        <div key={t} style={{ fontSize: 12.5, fontWeight: 700, color: INK, lineHeight: 1.8 }}>· {t}</div>
      ))}
      <div style={{ fontSize: 11, color: GOLD_INK, fontWeight: 600, marginTop: 8, lineHeight: 1.7 }}>
        몇 번 더 쌓이면 바로카드를 한 주와 견줘 볼 수 있어요.
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div style={{ border: `1px dashed ${LINE}`, borderRadius: 14, padding: '34px 18px', textAlign: 'center',
      fontSize: 12.5, color: SUB, fontWeight: 600, lineHeight: 1.85 }}>
      아직 잰 기록이 없어요.{'\n'}
      한 번 재 두면 다음 주부터 달라진 만큼을 알려 드려요.
    </div>
  );
}
