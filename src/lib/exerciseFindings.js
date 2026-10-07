// 운동 기록에서 뽑는 두 가지 — '이번 달 운동'(기록)과 '움직인 날, 쉬어 간 날'(발견).
//
// 지킨 것.
//   · **안 한 날을 탓하지 않는다.** '안 했다'가 아니라 '쉬어 갔다'로 센다.
//   · **인과로 말하지 않는다.** 운동해서 기분이 좋았다고는 못 쓴다. 나란히만 둔다.
import { KEY_TO_EXERCISE_TYPE_LABEL } from './diaryEntryLabels';
import { strainScore } from './diaryTags';

// 운동 칸을 적은 날만 — 적지 않은 날은 움직였는지 쉬었는지 알 수 없다
const filled = (entries) => (entries || []).filter((e) => e && e.exercise && typeof e.exercise.did === 'boolean');
// 종목은 담긴 값이 열쇠(run)일 수도, 직접 적은 이름일 수도 있다
const labelOf = (t) => KEY_TO_EXERCISE_TYPE_LABEL[t] || t;
const r1 = (v) => Math.round(v * 10) / 10;

export const MIN_EXERCISE_DAYS = 3;   // '이번 달 운동'이 열리는 날 수
export const MIN_EACH_SIDE = 4;       // '움직인 날, 쉬어 간 날'이 열리려면 양쪽 다 이만큼

/** 이번 달 운동 — 움직인 날 수, 종목별 날 수, 쉬어 간 날과 가장 많았던 이유. 모자라면 null */
export function exerciseMonth(entries) {
  const list = filled(entries);
  if (list.length < MIN_EXERCISE_DAYS) return null;
  const moved = list.filter((e) => e.exercise.did);
  const rested = list.filter((e) => !e.exercise.did);
  const count = {};
  moved.forEach((e) => {
    [...new Set((e.exercise.types || []).map(labelOf))].forEach((lb) => { count[lb] = (count[lb] || 0) + 1; });
  });
  const rows = Object.entries(count)
    .map(([label, days]) => ({ label, days, baro: label === '바디카드', pct: Math.round((days / moved.length) * 100) }))
    .sort((a, b) => b.days - a.days || a.label.localeCompare(b.label, 'ko'));
  const why = {};
  rested.forEach((e) => { const k = e.exercise.reason || 'forgot'; why[k] = (why[k] || 0) + 1; });
  const top = Object.entries(why).sort((a, b) => b[1] - a[1])[0] || null;
  return { of: list.length, moved: moved.length, rested: rested.length, rows,
    reason: top ? { key: top[0], days: top[1] } : null };
}

// 한 묶음(움직인 날 또는 쉬어 간 날)의 기분·부담·수면
function side(list) {
  const moods = list.map((e) => e.mood).filter((v) => typeof v === 'number');
  const sleeps = list.map((e) => e.sleep).filter((v) => typeof v === 'number');
  const strains = list.map((e) => strainScore(e.tags || []));
  const avg = (a) => (a.length ? r1(a.reduce((x, y) => x + y, 0) / a.length) : null);
  return {
    n: list.length,
    mood: avg(moods), moodGood: moods.filter((v) => v >= 4).length, moodOf: moods.length,
    strain: avg(strains), strainLight: strains.filter((v) => v <= 0).length,
    sleep: avg(sleeps), sleepGood: sleeps.filter((v) => v >= 3).length, sleepOf: sleeps.length,
  };
}

/** 움직인 날과 쉬어 간 날 — 양쪽 다 넉넉히 있어야 나란히 둘 수 있다. 모자라면 null */
export function moveVsRest(entries) {
  const list = filled(entries);
  const move = list.filter((e) => e.exercise.did), rest = list.filter((e) => !e.exercise.did);
  if (move.length < MIN_EACH_SIDE || rest.length < MIN_EACH_SIDE) return null;
  return { move: side(move), rest: side(rest) };
}
