// 이번 달 발견 — 각도기록과 부담 점수에서 뽑는 값들. 화면 부품이 아니라 셈만 한다.
//
// 지키는 것 두 가지.
//   1. **건너뛴 것을 세지 않는다.** 못 잰 주, 못 적은 날을 헤아려 보여 주면
//      빠진 사람은 그 숫자를 보고 다시 안 온다. 한 판이라도 있으면 그걸로 말한다.
//   2. **인과로 말하지 않는다.** '각도가 좋아져서 덜 아팠다'는 우리가 알 수 없다.
//      숫자와 함께 있던 것만 나란히 놓는다.
import { strainScore, TAG_BY_LABEL } from './diaryTags';
import { KEY_TO_PART_LABEL } from './diaryEntryLabels';

// 항목마다 어느 쪽이 좋은지.
//   목 숙임  … 가만히 섰을 때의 자세다. 덜 숙일수록 좋다.
//   허리 굽힘 … '천천히 굽혔다 돌아오기'의 최댓값, 곧 **가동 범위**다. 더 굽힐수록 좋다.
//   어깨 들림 … 팔을 옆으로 올린 최댓값. 더 올릴수록 좋다.
// 허리를 '덜 굽힐수록 좋다'로 두면 몸이 굳은 날을 잘한 날로 세게 된다.
// plain — 그 각도가 무슨 뜻인지 손님 말로. 재는 방식을 그대로 옮겨 적는다.
export const ANGLE_ITEMS = [
  {
    // 화면에 나가는 값은 CVA(수평선 기준)다 — angleView.js에서 바꿔 준다.
    // 셋 다 '클수록 좋다'로 모아야 목만 거꾸로 읽히지 않는다.
    key: 'neck_bend', label: '목 세움', kind: 'posture', better: 'high',
    best: '가장 곧게 선', gain: '더 곧게 섰습니다',
    plain: '가만히 섰을 때 귀와 어깨를 이은 선이 바닥과 이루는 각이에요. 90도에 가까울수록 고개가 몸 위에 곧게 얹힌 거고, 작을수록 앞으로 나온 거예요.',
  },
  {
    key: 'trunk_flex', label: '허리 굽힘', kind: 'range', better: 'high',
    best: '가장 많이 굽힌', gain: '더 굽혔습니다',
    plain: '선 자세에서 허리를 앞으로 숙일 때, 가장 깊이 숙인 순간의 각도예요. 90도면 상체가 바닥과 나란해진 거예요. 클수록 잘 숙여지는 겁니다.',
  },
  {
    key: 'arm_raise', label: '어깨 들림', kind: 'range', better: 'high',
    best: '가장 높이 올린', gain: '더 올렸습니다',
    plain: '팔을 옆으로 들어 올릴 때, 가장 높이 올라간 순간의 각도예요. 90도면 어깨 높이, 180도면 귀 옆까지 올라간 겁니다.',
  },
];

const GOOD = 55;                                   // 흔들린 판은 견주지 않는다
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);
// 빈 칸은 빈 칸으로. Number(null)은 0이라 그냥 두면 '0도로 쟀다'가 된다.
const num = (v) => (v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));
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

// ── 시간이 걸리는 발견 ─────────────────────────────────────
// 위의 것들이 '오늘 바로 보이는 것'이라면, 아래는 몇 주가 쌓여야 비로소 모양이 잡힌다.

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];
const weekKey = (dateISO) => {
  const d = new Date(dateISO); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const avg = (vs) => (vs.length ? vs.reduce((n, v) => n + v, 0) / vs.length : null);

/** 주마다 각도와 부담을 나란히 놓는다.
 *  **인과로 읽히지 않게 쓴다.** 어느 쪽이 먼저인지 우리는 모른다. 같이 있었다는 것만 보인다. */
export function sideBySide(rows = [], entries = [], key = 'neck_bend') {
  const angle = {};
  rows.filter(usable).forEach((r) => {
    const v = num(r[key]);
    if (v != null) angle[r.week] = v;
  });
  const load = {};
  (entries || []).filter((e) => e && e.date && Array.isArray(e.tags)).forEach((e) => {
    const k = weekKey(e.date);
    (load[k] = load[k] || []).push(strainScore(e.tags));
  });
  const weeks = Object.keys(angle).filter((k) => (load[k] || []).length >= 2).sort();
  if (weeks.length < 3) return null;
  const out = weeks.map((k) => ({ week: k, when: dayOf(k), angle: r1(angle[k]), load: r1(avg(load[k])) }));
  const item = ANGLE_ITEMS.find((x) => x.key === key) || ANGLE_ITEMS[0];
  return {
    rows: out, item,
    maxA: Math.max(...out.map((x) => x.angle)),
    minA: Math.min(...out.map((x) => x.angle)),
    maxL: Math.max(...out.map((x) => x.load), 1),
  };
}

/** 요일의 결 — 어느 요일에 부담이 몰리는지. 열흘은 쌓여야 흔들림이 가라앉는다. */
export function weekdayLoad(entries = []) {
  const days = (entries || []).filter((e) => e && e.date && Array.isArray(e.tags));
  if (days.length < 10) return null;
  const bucket = Array.from({ length: 7 }, () => []);
  days.forEach((e) => bucket[new Date(e.date).getDay()].push(strainScore(e.tags)));
  const rows = bucket.map((vs, i) => ({ day: WEEKDAY[i], n: vs.length, avg: vs.length ? r1(avg(vs)) : null }));
  const seen = rows.filter((r) => r.n >= 2);
  if (seen.length < 4) return null;
  const heavy = seen.reduce((a, b) => (b.avg > a.avg ? b : a));
  const light = seen.reduce((a, b) => (b.avg < a.avg ? b : a));
  if (heavy.avg - light.avg < 0.5) return { rows, flat: true, max: Math.max(...seen.map((r) => r.avg), 1) };
  return { rows, heavy, light, max: Math.max(...seen.map((r) => r.avg), 1) };
}

/** 지난달과 이번 달 — 각도와 부담을 달 단위로 견준다. 두 달치가 있어야 나온다. */
export function monthOverMonth(rows = [], entries = [], now = new Date()) {
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisM = key(now);
  const prevD = new Date(now); prevD.setMonth(prevD.getMonth() - 1);
  const lastM = key(prevD);

  const angleAvg = (m, k) => {
    const vs = rows.filter((r) => usable(r) && String(r.week).slice(0, 7) === m).map((r) => num(r[k])).filter((v) => v != null);
    return vs.length ? r1(avg(vs)) : null;
  };
  const loadAvg = (m) => {
    const vs = (entries || []).filter((e) => e && e.date && Array.isArray(e.tags) && String(e.date).slice(0, 7) === m)
      .map((e) => strainScore(e.tags));
    return vs.length >= 3 ? { avg: r1(avg(vs)), days: vs.length } : null;
  };

  const angles = ANGLE_ITEMS.map((it) => {
    const a = angleAvg(lastM, it.key), b = angleAvg(thisM, it.key);
    if (a == null || b == null) return null;
    const diff = r1(b - a);
    return { ...it, last: a, now: b, diff, better: it.better === 'low' ? diff < 0 : diff > 0, same: Math.abs(diff) < 0.5 };
  }).filter(Boolean);
  const lastLoad = loadAvg(lastM), nowLoad = loadAvg(thisM);
  const load = lastLoad && nowLoad
    ? { last: lastLoad.avg, now: nowLoad.avg, diff: r1(nowLoad.avg - lastLoad.avg), days: nowLoad.days }
    : null;
  if (!angles.length && !load) return null;
  return { angles, load, lastLabel: `${Number(lastM.slice(5))}월`, nowLabel: `${Number(thisM.slice(5))}월` };
}

// ── 최종 배치에서 새로 더한 셈 셋 ──────────────────────────

/** 옆모습 견주기 — 첫 판과 마지막 판의 관절 좌표.
 *  좌표가 쌓이기 전에는 null. 그럴 땐 카드가 '다음 주부터'라고 말한다. */
export function sideShapes(rows = []) {
  const ok = rows.filter((r) => usable(r) && Array.isArray(r.pose) && r.pose.length >= 25)
    .slice().sort((a, b) => String(a.week).localeCompare(String(b.week)));
  if (!ok.length) return null;
  const first = ok[0], now = ok[ok.length - 1];
  const neck = (r) => (Number.isFinite(Number(r.neck_bend)) ? Math.round(Number(r.neck_bend) * 10) / 10 : null);
  return {
    only: ok.length === 1,
    first: { pose: first.pose, when: dayOf(first.week), neck: neck(first) },
    now: { pose: now.pose, when: dayOf(now.week), neck: neck(now) },
    diff: ok.length > 1 && neck(first) != null && neck(now) != null ? Math.round((neck(now) - neck(first)) * 10) / 10 : null,
  };
}

/** 무리한 날, 그 다음 날.
 *  **인과가 아니라 순서다.** 무엇이 먼저 있었는지는 우리가 실제로 아는 사실이라 말할 수 있다.
 *  '때문에'라고는 쓰지 않는다 — 그건 여전히 모른다. */
export function dayAfterHeavy(entries = [], cut = 3) {
  const days = (entries || []).filter((e) => e && e.date).slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (days.length < 6) return null;
  const at = {};
  days.forEach((e) => { at[e.date] = e; });
  const next = (d) => { const x = new Date(d); x.setDate(x.getDate() + 1); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const sore = (e) => (Array.isArray(e?.soreness) ? e.soreness : []);

  const pairs = [];
  days.forEach((e) => {
    if (strainScore(e.tags || []) < cut) return;
    const n = at[next(e.date)];
    if (n) pairs.push({ heavy: e, after: n });
  });
  if (pairs.length < 3) return null;

  const withSore = pairs.filter((p) => sore(p.after).length > 0).length;
  // 견줄 짝 — 무리하지 않은 날의 다음 날
  const calm = [];
  days.forEach((e) => {
    if (strainScore(e.tags || []) >= cut) return;
    const n = at[next(e.date)];
    if (n) calm.push(n);
  });
  const calmSore = calm.filter((e) => sore(e).length > 0).length;

  const count = {};
  pairs.forEach((p) => sore(p.after).forEach((x) => {
    const lb = x?.partOther || KEY_TO_PART_LABEL[x?.part] || x?.part;
    if (lb) count[lb] = (count[lb] || 0) + 1;
  }));
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, n]) => ({ label, n }));

  // 한 줄씩 눈으로 따라갈 수 있게 짝을 그대로 넘긴다.
  // 비율만 적어 두면 결국 '무리해서 아팠다'로 읽힌다 — 날짜가 나란히 보여야 순서로 읽힌다.
  const md = (d) => `${Number(String(d).slice(5, 7))}/${Number(String(d).slice(8, 10))}`;
  const lines = pairs.slice(-6).map((p) => ({
    from: md(p.heavy.date), to: md(p.after.date),
    load: strainScore(p.heavy.tags || []),
    tags: (p.heavy.tags || []).filter((lb) => (TAG_BY_LABEL[lb]?.strain ?? 0) >= 2).slice(0, 2),
    parts: sore(p.after).map((x) => x?.partOther || KEY_TO_PART_LABEL[x?.part] || x?.part).filter(Boolean).slice(0, 2),
  }));

  return {
    n: pairs.length, withSore,
    pct: Math.round((withSore / pairs.length) * 100),
    calmPct: calm.length >= 3 ? Math.round((calmSore / calm.length) * 100) : null,
    calmN: calm.length, top, lines,
  };
}

/** 주기와 함께 — '생리 중'을 적은 날과 그렇지 않은 날의 부담·불편을 견준다.
 *  여성 이용자에게 가장 현실적인 물음이다. 재료는 이미 태그에 다 있다. */
export function withCycle(entries = []) {
  const days = (entries || []).filter((e) => e && Array.isArray(e.tags));
  if (days.length < 8) return null;
  const on = days.filter((e) => e.tags.includes('생리 중'));
  const off = days.filter((e) => !e.tags.includes('생리 중'));
  if (on.length < 2 || off.length < 4) return null;

  const mean = (list) => Math.round((list.reduce((n, e) => n + strainScore(e.tags), 0) / list.length) * 10) / 10;
  const sore = (e) => (Array.isArray(e.soreness) ? e.soreness : []);
  const count = {};
  on.forEach((e) => sore(e).forEach((x) => {
    const lb = x?.partOther || KEY_TO_PART_LABEL[x?.part] || x?.part;
    if (lb) count[lb] = (count[lb] || 0) + 1;
  }));
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, n]) => ({ label, n }));
  const a = mean(on), b = mean(off);
  return { days: on.length, onAvg: a, offAvg: b, diff: Math.round((a - b) * 10) / 10, top };
}
