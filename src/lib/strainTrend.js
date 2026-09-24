// 부담이 몰린 날·주·요일 — 보기마다 같은 셈을 다른 눈금으로 묶는다.
// '기분·불편함 추이'와 같은 짜임이다. 막대는 부담, 꺾은선은 기분.
import { strainScore } from './diaryTags';

export const MODES = ['daily', 'weekly', 'weekday'];
export const MODE_LABEL = { daily: '일간', weekly: '주간', weekday: '요일별' };
export const TITLE = { daily: '부담이 몰린 날', weekly: '부담이 몰린 주', weekday: '부담이 몰린 요일' };
export const SUB = {
  daily: '하루하루의 부담이에요 · 좌우로 넘겨보세요',
  weekly: '이번 달을 4주로 나눠 더한 값이에요',
  weekday: '요일별 하루 평균이에요',
};
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const r1 = (v) => Math.round(v * 10) / 10;
const mean = (vs) => (vs.length ? vs.reduce((n, v) => n + v, 0) / vs.length : null);

/** 보기에 맞춰 막대(부담)와 꺾은선(기분)을 만든다.
 *  일간·요일별은 하루 평균, 주간은 그 주에 쌓인 합계다 — '몰렸다'는 말은 합계라야 맞다. */
export function strainTrend(entries = [], mode = 'weekly') {
  const src = (entries || []).filter((e) => e && e.date && Array.isArray(e.tags));
  if (src.length < 2) return null;
  // 기록이 가장 많은 달을 본다. 맨 앞 기록의 달을 잡으면 지난달 끝자락 며칠만
  // 걸려 있을 때 그 달을 그리게 되고, 칸이 하나뿐이라 그래프가 안 뜬다.
  const byMonth = {};
  src.forEach((e) => { const k = String(e.date).slice(0, 7); byMonth[k] = (byMonth[k] || 0) + 1; });
  const base = Object.entries(byMonth).sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0][0];
  const yy = Number(base.slice(0, 4)), mm = Number(base.slice(5, 7));
  const lastDay = new Date(yy, mm, 0).getDate();
  const moodOf = (e) => (Number.isFinite(Number(e.mood)) ? Number(e.mood) : null);

  const byDom = {};
  src.forEach((e) => {
    if (Number(e.date.slice(5, 7)) !== mm) return;
    byDom[Number(e.date.slice(8, 10))] = e;
  });

  let cats = [];
  if (mode === 'daily') {
    for (let d = 1; d <= lastDay; d += 1) {
      const e = byDom[d];
      cats.push({
        key: `d${d}`, label: String(d), dow: new Date(yy, mm - 1, d).getDay(),
        strain: e ? strainScore(e.tags) : null, mood: e ? moodOf(e) : null,
      });
    }
  } else if (mode === 'weekday') {
    const bucket = Array.from({ length: 7 }, () => ({ s: [], m: [] }));
    Object.entries(byDom).forEach(([d, e]) => {
      const w = new Date(yy, mm - 1, Number(d)).getDay();
      bucket[w].s.push(strainScore(e.tags));
      const mo = moodOf(e); if (mo != null) bucket[w].m.push(mo);
    });
    cats = bucket.map((b, i) => ({
      key: WD[i], label: WD[i], dow: i,
      strain: b.s.length ? r1(mean(b.s)) : null,
      mood: b.m.length ? mean(b.m) : null,
    }));
  } else {
    const ranges = [[1, 7], [8, 14], [15, 21], [22, lastDay]];
    cats = ranges.map(([a, b], i) => {
      const s = [], m = [];
      for (let d = a; d <= b; d += 1) {
        const e = byDom[d];
        if (!e) continue;
        s.push(strainScore(e.tags));
        const mo = moodOf(e); if (mo != null) m.push(mo);
      }
      return {
        key: `w${i}`, label: `${i + 1}주`, dow: null,
        strain: s.length ? s.reduce((n, v) => n + v, 0) : null,   // 주간은 합계
        mood: m.length ? mean(m) : null, days: s.length,
      };
    });
  }

  const seen = cats.filter((c) => c.strain != null);
  if (seen.length < 2) return null;
  const max = Math.max(...seen.map((c) => c.strain), 1);
  const top = seen.reduce((a, b) => (b.strain > a.strain ? b : a));
  return { cats, max, top, mode, month: mm, unit: mode === 'weekly' ? '점' : '점' };
}
