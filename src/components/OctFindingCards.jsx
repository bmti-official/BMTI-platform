// 이번 달 발견 — 각도기록 셋, 부담 점수 둘.
//
// 만들 때 지킨 것.
//   · **건너뛴 것을 세지 않는다.** '3주 걸렀어요' 같은 문구는 한 번 보면 다시 안 온다.
//     한 판만 있어도 그 판으로 말한다.
//   · **인과로 말하지 않는다.** 각도가 나아져서 덜 아팠다고는 못 쓴다. 나란히만 둔다.
//   · **지금 바로 보이는 것을 앞에 둔다.** 큰 숫자 하나, 그다음에 줄들.
import { useEffect, useState } from 'react';
import { recentChecks } from '../lib/angleRecord';
import { bestAngles, firstVsNow, oneThing, lightDays, lightestWeek,
  sideBySide, weekdayLoad, monthOverMonth } from '../lib/octFindings';
import { getTypeAccent } from '../lib/typeAccent';
import { MonthMoveCard, BiggestMoveCard, LoadAndMoveCard } from './OctFindingSamples';
import { SideShapeCard, DayAfterCard, CycleCard } from './OctNewCards';
import { DiaryIcon } from './DiaryIcons';

const C = { ink: '#1C1A17', sub: '#9B9489', card: '#FFFFFF' };
const SHADOW = '0 2px 4px rgba(220,188,86,0.16), 0 10px 24px rgba(233,203,110,0.42)';

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
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '2px 0 12px' }}>
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

// ── 1. 이번 달 최고 기록 ───────────────────────────────────
export function BestAngleCard({ rows }) {
  const b = bestAngles(rows);
  if (!b) return null;
  const h = b.head;
  return (
    <Card icon="🏅" title="이번 달 최고 기록"
      sub={b.count === 1 ? '첫 판이에요. 여기서부터 셉니다.' : `${b.count}번 잰 것 가운데 가장 좋았던 값이에요.`}>
      <Big value={h.value} unit="°" note={`${h.label} · ${h.best} 날 (${h.when})`} />
      {b.rows.slice(1).map((r) => (
        <Row key={r.key} label={r.label}>{r.value}° · {r.best} 날 ({r.when})</Row>
      ))}
    </Card>
  );
}

// ── 2. 처음과 지금 ─────────────────────────────────────────
// 최종 배치에서는 쓰지 않는다. 원안의 '이번 달 움직임'이 같은 자리를 맡는다.
export function FirstNowCard({ rows }) {
  const f = firstVsNow(rows);
  if (!f) return null;
  const t = getTypeAccent();
  const head = f.gained[0];
  return (
    <Card icon="📏" title="처음과 지금"
      sub={`${f.from}에 처음 재고 ${f.to}에 다시 쟀어요. 그 사이 ${f.weeks}판이 쌓였습니다.`}>
      {head
        ? <Big value={Math.abs(head.diff)} unit="°" note={`${head.label}을 처음보다 ${head.gain}`} />
        : <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, margin: '2px 0 12px', lineHeight: 1.6 }}>
            처음과 거의 같은 자리예요. 흔들리지 않았다는 뜻이기도 합니다.
          </div>}
      {f.rows.map((r) => (
        <Row key={r.key} label={r.label}
          right={<span style={{ flex: '0 0 54px', textAlign: 'right', fontSize: 12, fontWeight: 900,
            fontVariantNumeric: 'tabular-nums', color: r.same ? C.sub : r.better ? t.accentDeep : '#B9B2A6' }}>
            {r.same ? '그대로' : `${r.diff > 0 ? '+' : ''}${r.diff}°`}
          </span>}>
          {r.first}° → {r.now}°
        </Row>
      ))}
    </Card>
  );
}

// ── 3. 오늘 해 볼 한 가지 ──────────────────────────────────
// 최종 배치에서는 쓰지 않는다. 옆모습 견주기가 같은 자리를 맡는다.
export function OneThingCard({ rows }) {
  const o = oneThing(rows);
  if (!o) return null;
  if (o.atBest) {
    return (
      <Card icon="✨" title="오늘 해 볼 한 가지" sub="지금이 이번 달 가장 좋은 자리예요.">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink, lineHeight: 1.7, wordBreak: 'keep-all' }}>
          세 가지 모두 최고 기록 언저리에 있어요. 오늘은 <b>이대로 한 번 더</b> 재 두는 것으로 충분합니다.
        </div>
      </Card>
    );
  }
  return (
    <Card icon="✨" title="오늘 해 볼 한 가지"
      sub={`${o.label}이 이번 달 최고 기록에서 가장 멀어요. 하나만 고른다면 여기입니다.`}>
      <Big value={o.gap} unit="°" note={`내 최고 기록 ${o.best}° · 지난번 ${o.now}°`} />
      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, lineHeight: 1.7, background: '#FAF7F0',
        borderRadius: 12, padding: '12px 14px', wordBreak: 'keep-all' }}>
        {o.key === 'neck_bend' && <>오늘 한 번, 화면을 눈높이까지 올려 보세요. 다음에 잴 때 이 숫자가 어떻게 되는지 보면 됩니다.</>}
        {o.key === 'trunk_flex' && <>오늘 한 번, 의자 등받이에 허리를 붙이고 앉아 보세요. 다음 판에서 이 숫자를 다시 봅니다.</>}
        {o.key === 'arm_raise' && <>오늘 한 번, 팔을 귀 옆까지 천천히 올렸다 내려 보세요. 다음 판에서 이 숫자를 다시 봅니다.</>}
      </div>
    </Card>
  );
}

// ── 4. 가벼웠던 날 ─────────────────────────────────────────
export function LightDaysCard({ entries }) {
  const l = lightDays(entries);
  if (!l) return null;
  return (
    <Card icon="🍃" title="가벼웠던 날"
      sub={`기록한 ${l.of}일 가운데 부담이 거의 없던 날이에요.`}>
      <Big value={l.n} unit="일" note={`${l.of}일 중`} />
      {l.top.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.sub, marginTop: 4, marginBottom: 2 }}>
            그 날들에 같이 있던 것
          </div>
          {l.top.map((x) => (
            <Row key={x.label} label={x.label}
              right={<span style={{ flex: '0 0 40px', textAlign: 'right', fontSize: 12, fontWeight: 900, color: C.sub, fontVariantNumeric: 'tabular-nums' }}>{x.n}일</span>}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>{x.icon ? <DiaryIcon name={x.icon} size={17} /> : null}</span>
            </Row>
          ))}
        </>
      )}
    </Card>
  );
}

// ── 5. 가장 가벼웠던 주 ────────────────────────────────────
// 최종 배치에서는 쓰지 않는다. 원안의 '부담이 몰린 주'와 겹친다.
export function LightestWeekCard({ entries }) {
  const w = lightestWeek(entries);
  if (!w) return null;
  const t = getTypeAccent();
  return (
    <Card icon="🌤" title="가장 가벼웠던 주"
      sub="주마다 하루 평균 부담이에요. 적은 쪽이 가벼운 주입니다.">
      <Big value={w.best.avg} unit="점" note={`${w.best.when}이 든 주 · ${w.best.days}일 기록`} />
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: 74, marginTop: 6 }}>
        {w.weeks.map((x) => {
          const on = x.week === w.best.week;
          return (
            <div key={x.week} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10.5, fontWeight: 900, color: on ? t.accentDeep : C.sub, fontVariantNumeric: 'tabular-nums' }}>{x.avg}</span>
              <span style={{ width: '100%', height: Math.max(5, Math.round((x.avg / w.max) * 44)), borderRadius: 6,
                background: on ? t.accentDeep : '#EDE9E2' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: C.sub }}>{Number(x.week.slice(8, 10))}일~</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── 6. 나란히 놓아 본 주 ───────────────────────────────────
// 여기서 가장 조심해야 하는 게 인과다. 각도가 나빠서 부담이 컸다고 읽히면 안 된다.
// 우리가 아는 건 '같은 주에 이랬다'까지다. 그 선을 문구로 못 박아 둔다.
export function SideBySideCard({ rows, entries }) {
  const d = sideBySide(rows, entries);
  if (!d) return null;
  const t = getTypeAccent();
  const span = Math.max(1, d.maxA - d.minA);
  return (
    <Card icon="🔗" title="나란히 놓아 본 주"
      sub={`주마다 ${d.item.label}과 하루 평균 부담을 나란히 뒀어요. 어느 쪽이 먼저인지는 이 기록만으로 알 수 없어요.`}>
      <div style={{ display: 'flex', gap: 9, marginTop: 4 }}>
        {d.rows.map((x) => (
          <div key={x.week} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 62 }}>
              <span title={`${d.item.label} ${x.angle}°`} style={{ width: 11, borderRadius: 5,
                height: Math.max(6, Math.round(((x.angle - d.minA) / span) * 44) + 10), background: t.accentDeep }} />
              <span title={`부담 ${x.load}`} style={{ width: 11, borderRadius: 5,
                height: Math.max(6, Math.round((x.load / d.maxL) * 54)), background: '#E3D9C4' }} />
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: C.sub, whiteSpace: 'nowrap' }}>{x.when.replace('월 ', '/').replace('일', '')}</span>
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

// ── 7. 요일의 결 ───────────────────────────────────────────
export function WeekdayLoadCard({ entries }) {
  const d = weekdayLoad(entries);
  if (!d) return null;
  const t = getTypeAccent();
  return (
    <Card icon="📅" title="요일의 결"
      sub={d.flat ? '요일마다 크게 다르지 않았어요. 고르게 지나간 달이에요.'
        : `${d.heavy.day}요일에 부담이 가장 많이 얹혔어요. 가장 가벼운 건 ${d.light.day}요일이었고요.`}>
      {!d.flat && <Big value={d.heavy.avg} unit="점" note={`${d.heavy.day}요일 하루 평균 · ${d.heavy.n}일 기록`} />}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 70, marginTop: d.flat ? 6 : 0 }}>
        {d.rows.map((r) => {
          const on = !d.flat && r.day === d.heavy.day;
          return (
            <div key={r.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: on ? t.accentDeep : C.sub, fontVariantNumeric: 'tabular-nums' }}>
                {r.avg == null ? '' : r.avg}
              </span>
              <span style={{ width: '100%', height: r.avg == null ? 4 : Math.max(5, Math.round((r.avg / d.max) * 40)),
                borderRadius: 6, background: r.avg == null ? '#F5F2EC' : on ? t.accentDeep : '#EDE9E2' }} />
              <span style={{ fontSize: 10.5, fontWeight: 800, color: on ? C.ink : C.sub }}>{r.day}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── 8. 지난달과 이번 달 ────────────────────────────────────
export function MonthOverMonthCard({ rows, entries }) {
  const d = monthOverMonth(rows, entries);
  if (!d) return null;
  const t = getTypeAccent();
  const mark = (better, same) => (same ? C.sub : better ? t.accentDeep : '#B9B2A6');
  return (
    <Card icon="🌗" title={`${d.lastLabel}과 ${d.nowLabel}`}
      sub="달 평균끼리 견줬어요. 한 판씩은 흔들려도 달 평균은 잘 흔들리지 않아요.">
      {d.angles.map((a) => (
        <Row key={a.key} label={a.label}
          right={<span style={{ flex: '0 0 56px', textAlign: 'right', fontSize: 12, fontWeight: 900,
            fontVariantNumeric: 'tabular-nums', color: mark(a.better, a.same) }}>
            {a.same ? '그대로' : `${a.diff > 0 ? '+' : ''}${a.diff}°`}
          </span>}>
          {a.last}° → {a.now}°
        </Row>
      ))}
      {d.load && (
        <Row label="하루 부담"
          right={<span style={{ flex: '0 0 56px', textAlign: 'right', fontSize: 12, fontWeight: 900,
            fontVariantNumeric: 'tabular-nums', color: mark(d.load.diff < 0, Math.abs(d.load.diff) < 0.3) }}>
            {Math.abs(d.load.diff) < 0.3 ? '그대로' : `${d.load.diff > 0 ? '+' : ''}${d.load.diff}`}
          </span>}>
          {d.load.last}점 → {d.load.now}점
        </Row>
      )}
    </Card>
  );
}

/** 바로 보이는 것 — '이번달 기록'에 선다. 오늘 열어서 오늘 쓸 수 있는 것들이다.
 *  숫자는 스스로 판단이 안 되므로 옆모습을 맨 앞에 세운다. */
export function QuickFindings({ rows: given = null, entries }) {
  const rows = useAngleRows(given);
  return (
    <>
      <SideShapeCard rows={rows} />
      {rows.length > 0 && <BestAngleCard rows={rows} />}
      <LightDaysCard entries={entries} />
    </>
  );
}

/** 시간이 걸리는 것 — '이번달 발견'에 선다. 몇 주가 쌓여야 모양이 잡힌다.
 *  차례는 원안 그대로: 이번 달 움직임 → 가장 많이 달라진 곳 → (새) 다음 날 → (새) 주기 → 부담과 움직임 */
export function SlowFindings({ rows: given = null, entries, female = true }) {
  const rows = useAngleRows(given);
  return (
    <>
      {rows.length > 0 && <MonthMoveCard rows={rows} />}
      {rows.length > 0 && <BiggestMoveCard rows={rows} />}
      <DayAfterCard entries={entries} />
      {female && <CycleCard entries={entries} />}
      {rows.length > 0 && <LoadAndMoveCard rows={rows} entries={entries} />}
    </>
  );
}

/** 각도 판 읽어 오기 — 밖에서 넘겨주면 그걸 쓰고, 아니면 직접 가져온다. */
function useAngleRows(given) {
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (given) return undefined;              // 미리보기는 지어낸 판을 그대로 넘겨 준다
    let alive = true;
    recentChecks(20).then((r) => { if (alive) setFetched(r || []); });
    return () => { alive = false; };
  }, [given]);
  return given || fetched || [];
}
