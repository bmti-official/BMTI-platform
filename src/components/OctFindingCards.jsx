// 이번 달 발견 — 각도기록 셋, 부담 점수 둘.
//
// 만들 때 지킨 것.
//   · **건너뛴 것을 세지 않는다.** '3주 걸렀어요' 같은 문구는 한 번 보면 다시 안 온다.
//     한 판만 있어도 그 판으로 말한다.
//   · **인과로 말하지 않는다.** 각도가 나아져서 덜 아팠다고는 못 쓴다. 나란히만 둔다.
//   · **지금 바로 보이는 것을 앞에 둔다.** 큰 숫자 하나, 그다음에 줄들.
import { useEffect, useState } from 'react';
import { recentChecks } from '../lib/angleRecord';
import { bestAngles, firstVsNow, oneThing, lightDays, lightestWeek } from '../lib/octFindings';
import { getTypeAccent } from '../lib/typeAccent';
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

/** 각도기록 카드 셋 — 기록을 직접 읽어 온다. 한 판도 없으면 아무것도 내지 않는다. */
export function AngleFindings({ rows: given = null }) {
  const [fetched, setFetched] = useState(null);
  useEffect(() => {
    if (given) return undefined;              // 미리보기는 지어낸 판을 그대로 넘겨 준다
    let alive = true;
    recentChecks(20).then((r) => { if (alive) setFetched(r || []); });
    return () => { alive = false; };
  }, [given]);
  const rows = given || fetched || [];
  if (!rows.length) return null;
  return (
    <>
      <BestAngleCard rows={rows} />
      <FirstNowCard rows={rows} />
      <OneThingCard rows={rows} />
    </>
  );
}
