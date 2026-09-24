// 이번 달 발견 — **원안**의 셈. (각도기록 셋 · 부담 점수 둘)
//
// 지금 손님 화면에 올라간 것과는 다른 기획이다. 견줘 보려고 남겨 둔 원안이라
// 관리자 미리보기에서만 쓴다. 원안 그대로 만들었다 — 손보지 않았다.
//
//   각도기록  이번 달 움직임 · 가장 많이 달라진 곳 · 꾸준함
//   부담 점수  부담이 몰린 주 · 부담과 움직임
//
// 원안이 '지금 것'과 갈리는 지점은 두 가지다.
//   · 첫 주와 마지막 주를 견준다(지금 것은 첫 판과 마지막 판).
//   · **재지 않은 주를 센다**('4주 중 3번'). 지금 것은 건너뛴 것을 세지 않는다.
import { strainScore } from './diaryTags';
import { ANGLE_ITEMS } from './octFindings';

const GOOD = 55;
const usable = (r) => r && (r.quality == null || r.quality >= GOOD);
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const r1 = (v) => Math.round(v * 10) / 10;
const dayOf = (w) => `${Number(String(w).slice(5, 7))}월 ${Number(String(w).slice(8, 10))}일`;
const avg = (vs) => (vs.length ? vs.reduce((n, v) => n + v, 0) / vs.length : null);
const weekKey = (dateISO) => {
  const d = new Date(dateISO); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - d.getDay());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 그 달에 걸친 주(일요일)를 센다. 꾸준함의 분모다.
 *  아직 오지 않은 주는 세지 않는다 — 다음 주를 '건너뛴 주'로 잡으면 그냥 틀린 셈이다. */
export function weeksInMonth(now = new Date()) {
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const last = monthEnd < now ? monthEnd : now;
  const out = [];
  const d = new Date(first); d.setDate(d.getDate() - d.getDay());
  while (d <= last) {
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    d.setDate(d.getDate() + 7);
  }
  return out;
}

/** 1) 이번 달 움직임 — 첫 주와 마지막 주를 견준다. */
export function monthMove(rows = []) {
  const ok = rows.filter(usable).slice().sort((a, b) => String(a.week).localeCompare(String(b.week)));
  if (ok.length < 2) return null;
  const a = ok[0], b = ok[ok.length - 1];
  const items = ANGLE_ITEMS.map((it) => {
    const x = num(a[it.key]), y = num(b[it.key]);
    if (x == null || y == null) return null;
    const diff = r1(y - x);
    return { ...it, first: r1(x), last: r1(y), diff, down: diff < 0, same: Math.abs(diff) < 0.5 };
  }).filter(Boolean);
  if (!items.length) return null;
  return { items, from: dayOf(a.week), to: dayOf(b.week), weeks: ok.length };
}

/** 2) 가장 많이 달라진 곳 — 변화 폭이 가장 큰 하나. 한 달에 하나만 기억하면 된다. */
export function biggestMove(rows = []) {
  const m = monthMove(rows);
  if (!m) return null;
  const top = m.items.reduce((a, b) => (Math.abs(b.diff) > Math.abs(a.diff) ? b : a));
  return { ...top, from: m.from, to: m.to, flat: Math.abs(top.diff) < 0.5 };
}

/** 3) 꾸준함 — 이번 달 몇 주 가운데 몇 번 쟀는지. 빠진 주가 있으면 그것도 적는다. */
export function steadiness(rows = [], now = new Date()) {
  const all = weeksInMonth(now);
  const done = new Set(rows.filter(usable).map((r) => String(r.week)));
  const hit = all.filter((w) => done.has(w));
  return { all, hit, n: hit.length, of: all.length, missed: all.filter((w) => !done.has(w)) };
}

/** 4) 부담이 몰린 주 — 주마다 부담을 더해 막대로. 합계다(평균이 아니다).
 *  불편함은 따로 주 평균을 내어 꺾은선으로 겹친다 — '기분·불편함 추이'와 같은 짜임이다. */
export function heaviestWeek(entries = []) {
  const days = (entries || []).filter((e) => e && e.date && Array.isArray(e.tags));
  if (days.length < 3) return null;
  const bucket = {};
  const soreBucket = {};
  days.forEach((e) => {
    const k = weekKey(e.date);
    (bucket[k] = bucket[k] || []).push(strainScore(e.tags));
    const lv = (Array.isArray(e.soreness) ? e.soreness : []).map((x) => Number(x?.level)).filter(Number.isFinite);
    if (lv.length) (soreBucket[k] = soreBucket[k] || []).push(Math.max(...lv));
  });
  const weeks = Object.entries(bucket)
    .map(([week, vs]) => {
      const sv = soreBucket[week] || [];
      return {
        week, when: dayOf(week),
        sum: vs.reduce((n, v) => n + v, 0),
        days: vs.length,
        sore: sv.length ? r1(sv.reduce((n, v) => n + v, 0) / sv.length) : null,
      };
    })
    .sort((a, b) => String(a.week).localeCompare(String(b.week)));
  if (weeks.length < 2) return null;
  const top = weeks.reduce((a, b) => (b.sum > a.sum ? b : a));
  const nth = weeks.findIndex((w) => w.week === top.week) + 1;
  const sores = weeks.map((w) => w.sore).filter((v) => v != null);
  return {
    weeks, top: { ...top, nth },
    max: Math.max(...weeks.map((w) => w.sum), 1),
    maxSore: sores.length ? Math.max(...sores, 1) : null,
    hotSore: sores.length ? weeks.filter((w) => w.sore != null).reduce((a, b) => (b.sore > a.sore ? b : a)) : null,
  };
}

/** 5) 부담과 움직임 — 부담이 많았던 주와 각도를 나란히 놓는다.
 *  **인과로 쓰면 안 된다.** 네 주 치로는 원인을 말할 수 없다. 같이 있었다는 것까지만. */
export function loadAndMove(rows = [], entries = [], key = 'trunk_flex') {
  const angle = {};
  rows.filter(usable).forEach((r) => { const v = num(r[key]); if (v != null) angle[String(r.week)] = v; });
  const load = {};
  (entries || []).filter((e) => e && e.date && Array.isArray(e.tags))
    .forEach((e) => { const k = weekKey(e.date); (load[k] = load[k] || []).push(strainScore(e.tags)); });
  const weeks = Object.keys(angle).filter((k) => (load[k] || []).length >= 2).sort();
  if (weeks.length < 2) return null;
  const rowsOut = weeks.map((k) => ({ week: k, when: dayOf(k), angle: r1(angle[k]), load: r1(avg(load[k])) }));
  const item = ANGLE_ITEMS.find((x) => x.key === key) || ANGLE_ITEMS[0];
  // 부담이 가장 컸던 주와 가장 적었던 주에서 각도가 어땠는지만 적는다
  const heavy = rowsOut.reduce((a, b) => (b.load > a.load ? b : a));
  const light = rowsOut.reduce((a, b) => (b.load < a.load ? b : a));
  return {
    rows: rowsOut, item, heavy, light,
    gap: r1(heavy.angle - light.angle),
    maxA: Math.max(...rowsOut.map((x) => x.angle)),
    minA: Math.min(...rowsOut.map((x) => x.angle)),
    maxL: Math.max(...rowsOut.map((x) => x.load), 1),
  };
}
