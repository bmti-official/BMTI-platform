// 이번 달 발견 — 각도기록과 부담 점수에서 뽑는 값들. 화면 부품이 아니라 셈만 한다.
//
// 지키는 것 두 가지.
//   1. **건너뛴 것을 세지 않는다.** 못 잰 주, 못 적은 날을 헤아려 보여 주면
//      빠진 사람은 그 숫자를 보고 다시 안 온다. 한 판이라도 있으면 그걸로 말한다.
//   2. **인과로 말하지 않는다.** '각도가 좋아져서 덜 아팠다'는 우리가 알 수 없다.
//      숫자와 함께 있던 것만 나란히 놓는다.
import { strainScore, TAG_BY_LABEL } from './diaryTags';

// 항목마다 어느 쪽이 좋은지. 목·허리는 덜 굽힐수록, 어깨는 더 올릴수록 좋다.
export const ANGLE_ITEMS = [
  { key: 'neck_bend', label: '목 숙임', better: 'low', best: '가장 덜 숙인', gain: '덜 숙였습니다' },
  { key: 'trunk_flex', label: '허리 굽힘', better: 'low', best: '가장 덜 굽힌', gain: '덜 굽혔습니다' },
  { key: 'arm_raise', label: '어깨 들림', better: 'high', best: '가장 높이 올린', gain: '더 올렸습니다' },
];

const GOOD = 55;                                   // 흔들린 판은 견주지 않는다
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const r1 = (v) => Math.round(v * 10) / 10;
const dayOf = (w) => `${Number(String(w).slice(5, 7))}월 ${Number(String(w).slice(8, 10))}일`;

/** 이번 달 가장 좋았던 판. 한 판만 있어도 나온다 — 그게 곧 최고 기록이다. */
export function bestAngles(rows = []) {
  const ok = rows.filter(usable);
  if (!ok.length) return null;
  const out = ANGLE_ITEMS.map((it) => {
    const vs = ok.map((r) => ({ v: num(r[it.key]), week: r.week })).filter((x) => x.v != null);
    if (!vs.length) return null;
    const pickBest = it.better === 'low'
      ? vs.reduce((a, b) => (b.v < a.v ? b : a))
      : vs.reduce((a, b) => (b.v > a.v ? b : a));
    return { ...it, value: r1(pickBest.v), when: dayOf(pickBest.week), only: vs.length === 1 };
  }).filter(Boolean);
  if (!out.length) return null;
  // 머리에 세울 하나 — 판이 가장 많이 쌓인 항목을 고른다
  return { rows: out, head: out[0], count: ok.length };
}

/** 처음 잰 날과 지금. 두 판부터 나온다. 나빠졌어도 숫자만 적는다. */
export function firstVsNow(rows = []) {
  const ok = rows.filter(usable).slice().sort((a, b) => String(a.week).localeCompare(String(b.week)));
  if (ok.length < 2) return null;
  const first = ok[0], now = ok[ok.length - 1];
  const out = ANGLE_ITEMS.map((it) => {
    const a = num(first[it.key]), b = num(now[it.key]);
    if (a == null || b == null) return null;
    const diff = r1(b - a);
    const better = it.better === 'low' ? diff < 0 : diff > 0;
    return { ...it, first: r1(a), now: r1(b), diff, better, same: Math.abs(diff) < 0.5 };
  }).filter(Boolean);
  if (!out.length) return null;
  const gained = out.filter((x) => x.better && !x.same);
  return { rows: out, from: dayOf(first.week), to: dayOf(now.week), gained, weeks: ok.length };
}

/** 오늘 해 볼 한 가지 — 자기 최고 기록에서 가장 멀어진 항목 하나를 짚는다.
 *  남과 견주지 않는다. 어제의 나와만 견준다. */
export function oneThing(rows = []) {
  const ok = rows.filter(usable);
  if (!ok.length) return null;
  const latest = ok[0];
  const gaps = ANGLE_ITEMS.map((it) => {
    const now = num(latest[it.key]);
    const vs = ok.map((r) => num(r[it.key])).filter((v) => v != null);
    if (now == null || vs.length < 2) return null;
    const best = it.better === 'low' ? Math.min(...vs) : Math.max(...vs);
    const gap = r1(Math.abs(now - best));
    return { ...it, now: r1(now), best: r1(best), gap };
  }).filter(Boolean);
  if (!gaps.length) return null;
  const pick = gaps.reduce((a, b) => (b.gap > a.gap ? b : a));
  return pick.gap < 0.5 ? { ...pick, atBest: true } : pick;
}

/** 이번 달 가벼웠던 날. 몇 일이었는지와, 그 날들에 함께 있던 태그를 나란히 둔다. */
export function lightDays(entries = []) {
  const days = (entries || []).filter((e) => e && Array.isArray(e.tags));
  if (!days.length) return null;
  const scored = days.map((e) => ({ e, s: strainScore(e.tags) }));
  const light = scored.filter((x) => x.s <= 1);
  if (!light.length) return null;
  const count = {};
  light.forEach(({ e }) => (e.tags || []).forEach((lb) => { count[lb] = (count[lb] || 0) + 1; }));
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([label, n]) => ({ label, n, icon: TAG_BY_LABEL[label]?.icon }));
  return { n: light.length, of: days.length, top };
}

/** 가장 가벼웠던 주. 하루 평균으로 견준다 — 기록 수가 다른 주끼리 비교하려면 이래야 한다. */
export function lightestWeek(entries = []) {
  const days = (entries || []).filter((e) => e && e.date && Array.isArray(e.tags));
  if (days.length < 3) return null;
  const bucket = {};
  days.forEach((e) => {
    const d = new Date(e.date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    (bucket[k] = bucket[k] || []).push(strainScore(e.tags));
  });
  const weeks = Object.entries(bucket)
    .filter(([, vs]) => vs.length >= 2)                       // 하루짜리 주는 견주지 않는다
    .map(([k, vs]) => ({ week: k, avg: r1(vs.reduce((n, v) => n + v, 0) / vs.length), days: vs.length }));
  if (weeks.length < 2) return null;
  const best = weeks.reduce((a, b) => (b.avg < a.avg ? b : a));
  const sorted = weeks.slice().sort((a, b) => String(a.week).localeCompare(String(b.week)));
  return { best: { ...best, when: dayOf(best.week) }, weeks: sorted, max: Math.max(...weeks.map((w) => w.avg), 1) };
}
