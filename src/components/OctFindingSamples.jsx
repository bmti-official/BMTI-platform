// 이번 달 발견 — **원안** 박스 다섯. 견줘 보려고 만든 샘플이라 관리자에서만 쓴다.
//
// 원안 그대로 만들었다. 손보지 않았다.
//   각도기록  이번 달 움직임 · 가장 많이 달라진 곳 · 꾸준함
//   부담 점수  부담이 몰린 주 · 부담과 움직임
import { monthMove, biggestMove, steadiness, heaviestWeek, loadAndMove } from '../lib/octFindingsDraft';
import { getTypeAccent } from '../lib/typeAccent';

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
export function HeavyWeekCard({ entries }) {
  const h = heaviestWeek(entries);
  if (!h) return null;
  const t = getTypeAccent();
  const NTH = ['', '첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째'];
  return (
    <Card icon="📊" title="부담이 몰린 주"
      sub={`${NTH[h.top.nth] || `${h.top.nth}번째`} 주에 가장 많이 쌓였어요.`}>
      <Big value={h.top.sum} unit="점" note={`${h.top.when}이 든 주 · ${h.top.days}일 기록`} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 78, marginTop: 4 }}>
        {h.weeks.map((w) => {
          const on = w.week === h.top.week;
          return (
            <div key={w.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 900, color: on ? t.accentDeep : C.sub, fontVariantNumeric: 'tabular-nums' }}>{w.sum}</span>
              <span style={{ width: '100%', height: Math.max(5, Math.round((w.sum / h.max) * 46)), borderRadius: 6,
                background: on ? t.accentDeep : '#EDE9E2' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>{dd(w.week)}</span>
            </div>
          );
        })}
      </div>
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
  const span = Math.max(1, d.maxA - d.minA);
  const dir = Math.abs(d.gap) < 0.5 ? null : d.gap < 0;
  return (
    <Card icon="⭐" title="부담과 움직임"
      sub={`부담이 많았던 주와 ${d.item.label}을 나란히 놓았어요. 어느 쪽이 원인인지는 이 기록만으로 알 수 없어요.`}>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: C.ink, lineHeight: 1.7, margin: '2px 0 14px', wordBreak: 'keep-all' }}>
        {dir === null
          ? <>부담이 많았던 주와 적었던 주의 {d.item.label}이 거의 같았어요.</>
          : <>부담 태그가 많았던 주에는 {d.item.label}이 {Math.abs(d.gap)}도 {dir ? '줄어드는' : '늘어나는'} 편이었어요.</>}
      </div>
      <div style={{ display: 'flex', gap: 9 }}>
        {d.rows.map((x) => (
          <div key={x.week} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 62 }}>
              <span style={{ width: 11, borderRadius: 5, background: t.accentDeep,
                height: Math.max(6, Math.round(((x.angle - d.minA) / span) * 44) + 10) }} />
              <span style={{ width: 11, borderRadius: 5, background: '#E3D9C4',
                height: Math.max(6, Math.round((x.load / d.maxL) * 54)) }} />
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: C.sub, whiteSpace: 'nowrap' }}>{dd(x.week)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, fontWeight: 800, color: C.sub }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: t.accentDeep }} />{d.item.label}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: '#E3D9C4' }} />하루 평균 부담
        </span>
      </div>
    </Card>
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
