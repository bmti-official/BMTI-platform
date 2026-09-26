// 이번 달 발견 — **원안** 박스 다섯. 견줘 보려고 만든 샘플이라 관리자에서만 쓴다.
//
// 원안 그대로 만들었다. 손보지 않았다.
//   각도기록  이번 달 움직임 · 가장 많이 달라진 곳 · 꾸준함
//   부담 점수  부담이 몰린 주 · 부담과 움직임
import { josa } from '../lib/josa';
import { monthMove, biggestMove, steadiness, heaviestWeek, loadAndMove } from '../lib/octFindingsDraft';
import { getTypeAccent } from '../lib/typeAccent';
import { riskBand, riskFill } from '../lib/riskBands';
import { DiaryIcon } from './DiaryIcons';

const C = { ink: '#1C1A17', sub: '#9B9489', card: '#FFFFFF' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';
const dd = (w) => `${Number(String(w).slice(5, 7))}/${Number(String(w).slice(8, 10))}`;

function Card({ icon, title, sub, children }) {
  const t = getTypeAccent();
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: '18px 18px 20px', boxShadow: SHADOW, border: '1px solid #F1EEE8' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: t.accentSoft, color: t.accentDeep, fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', color: C.ink }}>{title}</span>
      </div>
      {sub && <div style={{ fontSize: 12, color: C.sub, fontWeight: 600, marginBottom: 14, lineHeight: 1.65, wordBreak: 'keep-all' }}>{sub}</div>}
      {children}
    </div>
  );
}
function Big({ value, unit, note }) {
  const t = getTypeAccent();
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 12px', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 38, fontWeight: 900, color: t.accentDeep, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 16, fontWeight: 800, color: t.accentDeep }}>{unit}</span>
      {note && <span style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginLeft: 4 }}>{note}</span>}
    </div>
  );
}
function Row({ label, right, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', borderTop: '1px solid #F3F1EC' }}>
      <span style={{ flex: '0 0 62px', fontSize: 12, fontWeight: 800, color: C.ink }}>{label}</span>
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{children}</span>
      {right}
    </div>
  );
}

// ── 1) 이번 달 움직임 ──────────────────────────────────────
// 원안 문구: "목 숙임 3도 줄고, 허리 굽힘 5도 늘었어요"
export function MonthMoveCard({ rows }) {
  const m = monthMove(rows);
  if (!m) return null;
  const t = getTypeAccent();
  const moved = m.items.filter((x) => !x.same);
  const line = moved.length
    ? moved.slice(0, 2).map((x) => `${x.label} ${Math.abs(x.diff)}도 ${x.down ? '줄' : '늘'}`).join('고, ') + '었어요'
    : '세 항목 모두 첫 주와 비슷했어요';
  return (
    <Card icon="📐" title="이번 달 움직임"
      sub={`첫 주(${m.from})와 마지막 주(${m.to})를 견줬어요. 이번 달 ${m.weeks}번 쟀습니다.`}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1.6, margin: '2px 0 12px', wordBreak: 'keep-all' }}>
        {line}
      </div>
      {m.items.map((x) => (
        <Row key={x.key} label={x.label}
          right={<span style={{ flex: '0 0 56px', textAlign: 'right', fontSize: 12, fontWeight: 900,
            fontVariantNumeric: 'tabular-nums', color: x.same ? C.sub : t.accentDeep }}>
            {x.same ? '그대로' : `${x.diff > 0 ? '+' : ''}${x.diff}°`}
          </span>}>
          {x.first}° → {x.last}°
        </Row>
      ))}
    </Card>
  );
}

// ── 2) 가장 많이 달라진 곳 ─────────────────────────────────
// 원안 문구: 셋 중 변화 폭이 가장 큰 하나만 크게. 한 달에 하나만 기억하면 충분하다.
export function BiggestMoveCard({ rows }) {
  const b = biggestMove(rows);
  if (!b) return null;
  if (b.flat) {
    return (
      <Card icon="🔍" title="가장 많이 달라진 곳" sub="이번 달엔 크게 움직인 곳이 없었어요.">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.7 }}>
          세 항목 모두 첫 주와 비슷한 자리예요. 흔들리지 않았다는 뜻이기도 합니다.
        </div>
      </Card>
    );
  }
  return (
    <Card icon="🔍" title="가장 많이 달라진 곳" sub={`${b.from} → ${b.to}. 이번 달은 이것만 기억하셔도 됩니다.`}>
      <div style={{ fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 8 }}>{b.label}</div>
      <Big value={`${b.diff > 0 ? '+' : ''}${b.diff}`} unit="°" note={`${b.first}° → ${b.last}°`} />
    </Card>
  );
}

// ── 3) 꾸준함 ──────────────────────────────────────────────
// 원안 문구: "4주 중 3번 재셨어요". 빠진 주가 있으면 추세가 끊긴다는 걸 알려 주는 자리.
export function SteadyCard({ rows }) {
  const s = steadiness(rows);
  const t = getTypeAccent();
  return (
    <Card icon="🗓" title="꾸준함" sub="주마다 한 번씩 재면 추세가 이어집니다.">
      <Big value={`${s.n}`} unit={`/ ${s.of}번`} note={`${s.of}주 가운데 ${s.n}번 재셨어요`} />
      <div style={{ display: 'flex', gap: 7, marginTop: 2 }}>
        {s.all.map((w) => {
          const on = s.hit.includes(w);
          return (
            <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <span style={{ width: '100%', height: 30, borderRadius: 9, background: on ? t.accentDeep : '#F1EEE8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? '#fff' : '#C6C0B5',
                fontSize: 13, fontWeight: 900 }}>{on ? '✓' : '·'}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>{dd(w)}</span>
            </div>
          );
        })}
      </div>
      {s.missed.length > 0 && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.sub, marginTop: 12, lineHeight: 1.6, wordBreak: 'keep-all' }}>
          {s.missed.length}주는 건너뛰었어요. 빠진 주가 있으면 그 사이 흐름은 이어 보기 어려워요.
        </div>
      )}
    </Card>
  );
}

// ── 4) 부담이 몰린 주 ──────────────────────────────────────
// 원안 문구: "셋째 주에 가장 많이 쌓였어요"
// 그림은 '기분·불편함 추이'와 같은 짜임으로 둔다 — 막대는 부담(초록·노랑·빨강),
// 꺾은선은 그 주의 불편함 평균. 같은 뜻의 색이 화면마다 다르면 매번 다시 배워야 한다.
export function HeavyWeekCard({ entries }) {
  const h = heaviestWeek(entries);
  if (!h) return null;
  const t = getTypeAccent();
  const NTH = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째'];
  const H = 92, barH = 62;
  const n = h.weeks.length;
  const xOf = (i) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const yOf = (v) => (h.maxSore ? 100 - (v / h.maxSore) * 74 - 13 : 50);
  const line = h.weeks.map((w, i) => (w.sore == null ? null : `${xOf(i).toFixed(1)} ${yOf(w.sore).toFixed(1)}`))
    .filter(Boolean).map((p, i) => `${i ? 'L' : 'M'}${p}`).join(' ');

  return (
    <Card icon={<DiaryIcon name="stress" size={19} />} title="부담이 몰린 주"
      sub={`${NTH[h.top.nth] || `${h.top.nth}번째`} 주에 가장 많이 쌓였어요.`}>
      <Big value={h.top.sum} unit="점" note={`${h.top.when}이 든 주 · ${h.top.days}일 기록`} />

      {/* 점수가 어떻게 나온 값인지 — 숫자만 보면 '내가 몇 점짜리 사람인가'가 된다 */}
      <div style={{ fontSize: 11.5, fontWeight: 700, color: C.sub, lineHeight: 1.7, margin: '0 0 12px', wordBreak: 'keep-all' }}>
        오늘의 태그마다 무게가 있어요. <b style={{ color: C.ink }}>진통제·업무과다처럼 몸이 이미 신호를 보낸 것은 2점</b>,
        오래 앉음·카페인처럼 쌓이면 부담이 되는 것은 1점, 수분 보충·영양제는 0점이에요.
        한 주에 고른 것을 모두 더한 값입니다. <b style={{ color: C.ink }}>음식 섭취는 세지 않아요.</b>
      </div>

      <div style={{ position: 'relative', height: H }}>
        {/* 부담 막대 */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', gap: 7, zIndex: 1 }}>
          {h.weeks.map((w) => {
            const ratio = Math.min(1, w.sum / h.max);
            const band = riskBand(ratio);
            return (
              <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 3, height: '100%' }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: band.text }}>{w.sum}</span>
                <div style={{ width: '64%', maxWidth: 22, height: Math.max(4, Math.round(ratio * barH)),
                  borderRadius: 6, background: riskFill(ratio), transition: 'height .3s' }} />
              </div>
            );
          })}
        </div>
        {/* 불편함 꺾은선 */}
        {line && (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
            <path d={line} fill="none" stroke={t.accent} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        {h.weeks.map((w, i) => (w.sore == null ? null : (
          <span key={w.week} style={{ position: 'absolute', left: `${xOf(i)}%`, top: `${yOf(w.sore)}%`,
            transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%',
            background: t.accent, boxShadow: '0 0 0 2px #fff', zIndex: 3 }} />
        )))}
      </div>
      <div style={{ display: 'flex', gap: 7, marginTop: 6 }}>
        {h.weeks.map((w) => (
          <span key={w.week} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: C.sub }}>{dd(w.week)}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10.5, fontWeight: 800, color: C.sub, flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: 'linear-gradient(180deg,#F0917C,#E0554F)' }} />부담 점수
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 10, height: 3, borderRadius: 2, background: t.accent }} />그 주 불편함 평균
        </span>
      </div>
      {h.hotSore && (
        <div style={{ fontSize: 12, fontWeight: 700, color: C.ink, marginTop: 10, lineHeight: 1.6, wordBreak: 'keep-all' }}>
          불편함이 가장 컸던 건 <b>{h.hotSore.when}</b>이 든 주였어요 (평균 {h.hotSore.sore}).
        </div>
      )}
    </Card>
  );
}

// ── 5) 부담과 움직임 ───────────────────────────────────────
// 원안에서 '이 기획 전체의 핵심'이라고 짚었던 박스.
// 다만 **'부담 때문에 줄었다'고 쓰면 안 된다.** 네 주 치로는 원인을 말할 수 없다.
export function LoadAndMoveCard({ rows, entries }) {
  const d = loadAndMove(rows, entries);
  if (!d) return null;
  const t = getTypeAccent();

  const dir = Math.abs(d.gap) < 0.5 ? null : d.gap < 0;
  return (
    <Card icon="⭐" title="부담과 움직임"
      sub={`부담이 많았던 주와 ${josa(d.item.label, '을')} 나란히 놓았어요. 어느 쪽이 원인인지는 이 기록만으로 알 수 없어요.`}>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink, lineHeight: 1.7, margin: '2px 0 14px', wordBreak: 'keep-all' }}>
        {dir === null
          ? <>부담이 많았던 주와 적었던 주의 {josa(d.item.label, '이')} 거의 같았어요.</>
          : <>부담 태그가 많았던 주에는 {josa(d.item.label, '이')} {Math.abs(d.gap)}도 {dir ? '줄어드는' : '늘어나는'} 편이었어요.</>}
      </div>
      {/* 꺾은선 둘 — 막대로 두면 색 설명을 읽어야 무엇인지 안다.
          선이면 '같이 오르내리는지'가 한눈에 들어오고, 이름을 선 끝에 바로 붙일 수 있다. */}
      <TwoLines rows={d.rows} minA={d.minA} maxA={d.maxA} maxL={d.maxL} item={d.item} t={t} />
    </Card>
  );
}


// 두 갈래를 꺾은선으로 겹쳐 그린다.
// 세로 눈금은 서로 다르다(각도는 도, 부담은 점) — 그래서 숫자 축을 그리지 않고
// 각자 제 범위 안에서 높낮이만 보여 준다. 보려는 건 '같이 움직였나'이지 값이 아니다.
function TwoLines({ rows, minA, maxA, maxL, item, t }) {
  const W = 300, H = 108, padX = 10, padTop = 14, padBot = 26;
  const n = rows.length;
  const x = (i) => padX + (n === 1 ? (W - padX * 2) / 2 : (i * (W - padX * 2)) / (n - 1));
  const spanA = Math.max(0.1, maxA - minA);
  const yA = (v) => padTop + (1 - (v - minA) / spanA) * (H - padTop - padBot);
  const yL = (v) => padTop + (1 - v / Math.max(maxL, 0.1)) * (H - padTop - padBot);
  const path = (f, k) => rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${f(r[k]).toFixed(1)}`).join(' ');
  const last = rows[n - 1];
  // 선 끝 두 개가 가까우면 이름이 겹친다. 위에 있는 쪽은 더 위로, 아래쪽은 더 아래로.
  const labelY = (() => {
    const a = yA(last.angle), l = yL(last.load);
    const up = a <= l;
    const gapOk = Math.abs(a - l) >= 26;
    return {
      a: gapOk ? a - 8 : (up ? a - 9 : a + 16),
      l: gapOk ? l + 15 : (up ? l + 16 : l - 9),
    };
  })();
  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <path d={path(yL, 'load')} stroke="#DCC79B" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={path(yA, 'angle')} stroke={t.accentDeep} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {rows.map((r, i) => (
          <g key={r.week}>
            <circle cx={x(i)} cy={yL(r.load)} r="3.1" fill="#DCC79B" />
            <circle cx={x(i)} cy={yA(r.angle)} r="3.4" fill={t.accentDeep} />
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#9B9489">
              {`${Number(r.week.slice(5, 7))}/${Number(r.week.slice(8, 10))}`}
            </text>
          </g>
        ))}
        {/* 이름은 선 끝에 바로 붙인다 — 아래 색 설명을 찾아 읽지 않게.
            두 끝이 가까우면 글씨가 겹치므로, 위아래로 벌려 둔다. */}
        <text x={x(n - 1) - 4} y={labelY.a} textAnchor="end" fontSize="10" fontWeight="900" fill={t.accentDeep}>
          {item.label}
        </text>
        <text x={x(n - 1) - 4} y={labelY.l} textAnchor="end" fontSize="10" fontWeight="900" fill="#B9A176">
          하루 부담
        </text>
      </svg>
    </div>
  );
}

/** 원안 다섯을 원래 차례대로. */
export default function OctFindingSamples({ rows = [], entries = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <MonthMoveCard rows={rows} />
      <BiggestMoveCard rows={rows} />
      <SteadyCard rows={rows} />
      <HeavyWeekCard entries={entries} />
      <LoadAndMoveCard rows={rows} entries={entries} />
    </div>
  );
}
