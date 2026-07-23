/**
 * 말랑이의 발견 — 월간 리포트 엔진 v3.0
 *
 * 설계 원칙
 *  - 순수 함수. UI/프레임워크/스타일 의존 0. 서버·클라이언트 어디서든 이 파일을 쓸 수 있다.
 *  - buildMonthlyReport() 하나만 호출하면 렌더에 필요한 모든 데이터가 나온다.
 *  - 렌더러는 반환된 구조를 그대로 그리기만 하면 된다.
 *
 * 표현 원칙 (규칙 §5 — 반드시 유지)
 *  1) 개인 진단 금지. "당신은 X 원인으로 Y가 굳어있어요" → "일반적으로 ~라고 알려져 있어요"
 *  2) 헤드라인은 본인 기록의 사실만 지칭 (진단이 아니라 관찰)
 *  3) 정서적 안전 최우선 이용. 구체적 통증 처방 금지
 *  4) 금지어: 치료·교정·완화·개선·진단·원인·통증·질환·효과·처방
 *  5) 성과·점수·랭킹·달성률 금지 (게임화 절대 금지)
 */

/* ────────────────────────────────────────────────────────────
 * 1. 도메인 사전
 * ──────────────────────────────────────────────────────── */

export const MOOD = { 1: "힘들었어요", 2: "지쳤어요", 3: "그냥저냥", 4: "괜찮았어요", 5: "좋았어요" };
export const SLEEP = { 0: "밤을 새웠어요", 1: "뒤척였어요", 2: "그냥 그랬어요", 3: "푹 잤어요" };
export const PARTS = { head: "머리", neck: "목", shoulder: "어깨", elbow: "팔꿈치", wrist: "손목", back: "등", abdomen: "복부", waist: "허리", pelvis: "골반", knee: "무릎", ankle: "발목", etc: "기타" };
export const SITUATIONS = { morning: "아침에 일어날 때", moving: "움직일 때", sitting: "오래 앉아있을 때", standing: "오래 서있을 때", allday: "하루 종일", etc: "기타" };
export const LOADS = { sit: "오래 앉음", stand: "오래 선 자세", walk: "많이 걸음", lift: "무거운 물건 들기", etc: "기타" };
export const REASONS = { busy: "바빴어요", tired: "피곤해요", sick: "몸이 안 좋아요", rest: "그냥 쉬고 싶었어요", forgot: "깜빡했어요" };
export const POSTURE = { sitting: "주로 앉아 있어요", standing: "주로 서 있어요", moving: "계속 움직여요", mixed: "앉았다 섰다 해요", etc: "기타" };
export const GOALS = { sore: "뻐근함 줄이기", posture: "자세 바로잡기", stamina: "체력 기르기", stress: "스트레스 풀기" };
export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

export const EXERCISE = {
  indoor: { label: "개인 집중형 (실내)", items: { gym: "헬스·PT", yoga: "요가", pilates: "필라테스", stretch: "스트레칭", meditation: "명상·호흡", swim: "수영" } },
  outdoor: { label: "야외 활동형 (실외)", items: { walk: "걷기/산책", run: "러닝·조깅", bike: "자전거", hike: "등산" } },
  group: { label: "그룹 및 파트너형", items: { soccer: "축구", basketball: "농구", badminton: "배드민턴", tennis: "테니스", crossfit: "크로스핏", dance: "댄스" } },
  etc: { label: "기타", items: {} },
};

/** 운동 세부 종류 → 라벨 / 카테고리 역인덱스 */
const TYPE_INDEX = (() => {
  const m = {};
  for (const [cat, g] of Object.entries(EXERCISE)) for (const [k, label] of Object.entries(g.items)) m[k] = { label, cat };
  return m;
})();
export const typeLabel = (t) => TYPE_INDEX[t]?.label ?? t;
export const typeCategory = (t) => TYPE_INDEX[t]?.cat ?? "etc";

/** 일상 자세 → 원래 부하(baseline). 무리 체크는 '초과 부하'로 해석해야 한다. */
const BASELINE_LOAD = { sitting: "sit", standing: "stand", moving: "walk", mixed: null, etc: null };

/* ────────────────────────────────────────────────────────────
 * 2. 설정 — 정책은 전부 여기에 모아 있다
 * ──────────────────────────────────────────────────────── */

export const CONFIG = {
  // 발견
  MIN_RECORD_DAYS: 10,   // 월간 최소 기록일
  MIN_OBSERVATIONS: 3,   // 최소 관측 횟수
  CONSISTENCY: 0.7,      // 일관성 임계값 (70%)
  MOOD_GAP: 0.8,         // 기분 차이 유의 기준
  REPEAT_LIMIT: 2,       // 같은 발견 N개월 연속 시 감점 후보로 교체
  LOAD_SAME_DAY: true,   // A1: 부하와 뻐근함을 같은 날로 볼지(false면 다음날)

  // 섹션 잠금 해제 임계값
  UNLOCK: {
    mood_calendar: 1,
    mood_distribution: 5,
    sore_map: 3,
    sore_moments: 5,
    overwork: 3,
    movement: 3,
    rest: 3,
    sleep: 5,
    notes: 1,
  },

  // 안전
  CHRONIC_ALLDAY: 5,     // '하루 종일' N회 이상 → 안내 노출 임계값
};

export const DISCLAIMER =
  "말랑이의 발견은 회원님이 남긴 기록에서 찾은 패턴이에요. 건강 상태를 진단하거나 의학적 조언을 드리는 것이 아니에요. 불편함이 계속된다면 전문가와 상담해 주세요.";

/* ────────────────────────────────────────────────────────────
 * 3. 타입 (JSDoc)
 * ──────────────────────────────────────────────────────── */

/**
 * @typedef {Object} Profile
 * @property {string} [ageRange]
 * @property {string} [gender]
 * @property {'rarely'|'sometimes'|'weekly'|'daily'} [freq]
 * @property {Array<'sore'|'posture'|'stamina'|'stress'>} [goals]   최대 2
 * @property {'sitting'|'standing'|'moving'|'mixed'|'etc'} dailyPosture
 */

/**
 * @typedef {Object} Soreness
 * @property {keyof PARTS} part
 * @property {number} level        0~10
 * @property {keyof SITUATIONS} situation
 */

/**
 * @typedef {Object} DiaryEntry
 * @property {string} date                       ISO 'YYYY-MM-DD' (필수)
 * @property {1|2|3|4|5} mood                    필수
 * @property {0|1|2|3|null} [sleep]
 * @property {{yes:boolean, loads?:Array<keyof LOADS>}|null} [overwork]
 * @property {{did:boolean, reason?:keyof REASONS, types?:string[]}|null} [exercise]  types 최대 2
 * @property {Soreness[]} [soreness]             최대 2
 * @property {{category:'운동습관'|'일상'|'고민', text:string}|null} [note]
 */

/**
 * @typedef {Object} Bmti
 * @property {'A'|'O'} ao   활동 (이번 버전 문구에는 미사용 — 발견 E1 해석에만 참고)
 * @property {'C'|'L'} cl   범위 (이번 버전 문구에는 미사용)
 * @property {'D'|'Q'} dq   해석 — D 감각 / Q 이론
 * @property {'Z'|'M'} zm   어투 — Z 사실 직진 / M 공감 우선
 */

/**
 * @typedef {Object} Section
 * @property {string} id
 * @property {string} title
 * @property {boolean} unlocked
 * @property {{current:number, required:number, unit:'day'|'count'}} progress
 * @property {string|null} lockedMessage   잠겼을 때 보여줄 문장
 * @property {string|null} summary         열렸을 때 한 줄 요약
 * @property {Object|null} data            렌더용 데이터
 * @property {{type:string, message:string}|null} alert
 */

/* ────────────────────────────────────────────────────────────
 * 4. 유틸
 * ──────────────────────────────────────────────────────── */

// 받침 유무에 따라 조사를 붙인다 (목이/허리가). 한글이 아니면 받침 없음으로 본다.
const hasBatchim = (word) => {
  const ch = (word || "").trim().slice(-1);
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
};
const iga = (word) => `${word}${hasBatchim(word) ? "이" : "가"}`;
const eulreul = (word) => `${word}${hasBatchim(word) ? "을" : "를"}`;

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
const count = (arr) => arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {});
const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const weekdayOf = (iso) => new Date(iso + "T00:00:00").getDay();

/** 지배적 항목 찾기: [key, n, ratio] — 관측/일관성 조건 미달이면 null */
function dominant(list, minObs = CONFIG.MIN_OBSERVATIONS, minRatio = CONFIG.CONSISTENCY) {
  if (list.length < minObs) return null;
  const [k, n] = sortDesc(count(list))[0];
  const ratio = n / list.length;
  return ratio >= minRatio ? { key: k, n, total: list.length, ratio } : null;
}

/* ────────────────────────────────────────────────────────────
 * 5. 섹션 집계
 * ──────────────────────────────────────────────────────── */

function secMoodCalendar(days, year, month) {
  const dim = daysInMonth(year, month);
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
  const cells = [];
  for (let i = 1; i <= dim; i++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    const e = byDate[iso];
    cells.push({ date: iso, day: i, weekday: weekdayOf(iso), mood: e ? e.mood : null });
  }
  return {
    // 렌더러가 첫 주 요일에 맞춰 그리드를 만들 수 있도록 첫날 offset 제공
    firstWeekday: weekdayOf(`${year}-${String(month).padStart(2, "0")}-01`),
    cells,
  };
}

function secMoodDistribution(days) {
  const c = count(days.map((d) => d.mood));
  const items = [1, 2, 3, 4, 5].map((m) => ({ mood: m, label: MOOD[m], count: c[m] || 0, ratio: days.length ? (c[m] || 0) / days.length : 0 }));
  const top = sortDesc(c)[0];
  return { items, top: top ? Number(top[0]) : null };
}

function secSoreMap(days) {
  const acc = {};
  for (const d of days) for (const s of d.soreness || []) {
    acc[s.part] ||= { part: s.part, label: PARTS[s.part], count: 0, sum: 0 };
    acc[s.part].count++;
    acc[s.part].sum += s.level;
  }
  const parts = Object.values(acc).map((p) => ({ part: p.part, label: p.label, count: p.count, avgLevel: p.sum / p.count })).sort((a, b) => b.count - a.count);
  return { parts, maxCount: parts.length ? parts[0].count : 0 };
}

function secSoreMoments(days) {
  const flat = [];
  for (const d of days) for (const s of d.soreness || []) flat.push(s);
  const c = count(flat.map((s) => s.situation));
  const items = Object.keys(SITUATIONS).map((k) => ({ situation: k, label: SITUATIONS[k], count: c[k] || 0 })).filter((i) => i.count > 0).sort((a, b) => b.count - a.count);
  // 부위별 지배적 상황 (C2 발견의 근거)
  const byPart = {};
  for (const s of flat) (byPart[s.part] ||= []).push(s.situation);
  const perPart = Object.entries(byPart).map(([part, sits]) => {
    const dom = dominant(sits);
    return { part, label: PARTS[part], total: sits.length, dominant: dom ? { situation: dom.key, label: SITUATIONS[dom.key], n: dom.n, ratio: dom.ratio } : null };
  });
  return { items, perPart, alldayCount: c.allday || 0 };
}

function secOverwork(days, profile) {
  const od = days.filter((d) => d.overwork?.yes);
  const loads = [];
  for (const d of od) for (const l of d.overwork.loads || []) loads.push(l);
  const c = count(loads);
  const items = sortDesc(c).map(([l, n]) => ({ load: l, label: LOADS[l], count: n }));
  return { days: od.length, items, baseline: BASELINE_LOAD[profile.dailyPosture] || null };
}

function secMovement(days) {
  const md = days.filter((d) => d.exercise?.did === true);
  const types = [];
  for (const d of md) for (const t of d.exercise.types || []) types.push(t);
  const byType = sortDesc(count(types)).map(([t, n]) => ({ type: t, label: typeLabel(t), category: typeCategory(t), count: n }));
  const byCat = sortDesc(count(types.map(typeCategory))).map(([c2, n]) => ({ category: c2, label: EXERCISE[c2]?.label ?? c2, count: n }));
  return { days: md.length, byType, byCat };
}

function secRest(days) {
  const rd = days.filter((d) => d.exercise?.did === false);
  const items = sortDesc(count(rd.map((d) => d.exercise.reason))).map(([r, n]) => ({ reason: r, label: REASONS[r], count: n }));
  return { days: rd.length, items };
}

function secSleep(days) {
  const withSleep = days.filter((d) => d.sleep != null);
  const c = count(withSleep.map((d) => d.sleep));
  const items = [3, 2, 1, 0].map((l) => ({ level: l, label: SLEEP[l], count: c[l] || 0, ratio: withSleep.length ? (c[l] || 0) / withSleep.length : 0 }));
  return { items, recorded: withSleep.length };
}

function secNotes(days) {
  const items = days.filter((d) => d.note?.text).map((d) => ({ date: d.date, category: d.note.category, text: d.note.text }));
  const categories = sortDesc(count(items.map((i) => i.category))).map(([k, n]) => ({ category: k, count: n }));
  return { items: items.reverse(), categories };
}

/* ────────────────────────────────────────────────────────────
 * 6. 발견 탐지기 — MVP 5개 (D1 · C2 · A1 · E1 · F1)
 *
 * 각 탐지기가 반환하는 것:
 *   { id, actionable, strength, fact, evidence, info, sense, suggestion }
 *   fact       = 본인 기록의 사실 (진단 아님)
 *   info       = Q에게 어울리는 일반 지식 ("일반적으로 ~라고 알려져 있어요")
 *   sense      = D에게 어울리는 감각 표현
 *   suggestion = 부담 없는 습관 수준의 제안
 * ──────────────────────────────────────────────────────── */

/** D1 — '피곤해요'로 쉰 날 × 수면 부족. 막연한 이유를 구체적 원인으로 바꿔주는 발견. */
function detectD1(days) {
  const tired = days.filter((d) => d.exercise?.did === false && d.exercise.reason === "tired");
  if (tired.length < CONFIG.MIN_OBSERVATIONS) return null;
  const bad = tired.filter((d) => d.sleep != null && d.sleep <= 1);
  const ratio = bad.length / tired.length;
  if (ratio < CONFIG.CONSISTENCY) return null;
  return {
    id: "D1", actionable: 1, strength: tired.length * ratio,
    fact: `'피곤해요'로 쉬어간 날이 ${tired.length}번, 그중 ${bad.length}번은 잠을 잘 못 잔 날이었어요.`,
    evidence: `${tired.length}번 중 ${bad.length}번`,
    info: "일반적으로 잠이 부족하면 몸의 회복과 활력이 함께 떨어진다고 알려져 있어요.",
    sense: "몸이 무거운 건 마음가짐 탓이 아니었을지도 몰라요.",
    suggestion: "운동 횟수를 늘리기보다, 잠을 먼저 챙겨보면 어떨까요.",
  };
}

/** C2 — 뻐근함이 특정 상황에 몰림. 상황이 몰리면 짚이는 게 있다. */
const SITUATION_COPY = {
  morning: { info: "아침에만 유독 그렇다면 그 전날 자세와 관련이 있는 경우가 많다고 알려져 있어요.", sug: "베개 높이나 자는 자세를 한번 살펴보면 어떨까요." },
  sitting: { info: "일반적으로 같은 자세를 오래 유지하면 그 부위 근육이 계속 긴장한다고 알려져 있어요.", sug: "한 시간에 한 번쯤 앉은 자세를 바꿔보면 어떨까요." },
  standing: { info: "일반적으로 오래 서 있으면 하체와 허리가 계속 버티게 된다고 알려져 있어요.", sug: "양쪽 발에 번갈아 무게를 실어보면 편해진다고 해요." },
  moving: { info: "움직일 때만 그렇다면 몸이 덜 풀린 상태일 수 있다고 알려져 있어요.", sug: "움직이기 전에 가볍게 몸을 풀어보면 어떨까요." },
  allday: { info: "하루 종일 이어지는 건 몸이 보내는 신호일 수 있어요.", sug: "계속된다면 전문가와 상담해보는 게 좋겠어요." },
  etc: { info: "상황이 한곳에 몰리면 짚이는 게 있어요.", sug: "그 상황을 조금 덜어주시면 다음엔 더 편해질 거예요." },
};
function detectC2(days) {
  const byPart = {};
  for (const d of days) for (const s of d.soreness || []) (byPart[s.part] ||= []).push(s.situation);
  let best = null;
  for (const [part, sits] of Object.entries(byPart)) {
    const dom = dominant(sits);
    if (!dom) continue;
    const cand = { part, ...dom };
    if (!best || cand.n * cand.ratio > best.n * best.ratio) best = cand;
  }
  if (!best) return null;
  const c = SITUATION_COPY[best.key] || SITUATION_COPY.etc;
  return {
    id: "C2", actionable: 1, strength: best.n * best.ratio,
    fact: `${iga(PARTS[best.part])} 불편했던 ${best.total}번 중 ${best.n}번이 '${SITUATIONS[best.key]}'였어요.`,
    evidence: `${best.total}번 중 ${best.n}번`,
    info: c.info,
    sense: `${PARTS[best.part]}가 그 비슷한 순간마다 신호를 보내왔어요.`,
    suggestion: c.sug,
  };
}

/** A1 — 부하 종류 × 뻐근 부위. 반드시 "평소보다"를 지킨다. */
function detectA1(days) {
  const off = CONFIG.LOAD_SAME_DAY ? 0 : 1;
  const byLoad = {};
  days.forEach((d, i) => {
    if (!d.overwork?.yes) return;
    const t = days[i + off];
    if (!t) return;
    for (const load of d.overwork.loads || []) for (const s of t.soreness || []) (byLoad[load] ||= []).push(s.part);
  });
  let best = null;
  for (const [load, parts] of Object.entries(byLoad)) {
    const dom = dominant(parts);
    if (!dom) continue;
    const cand = { load, ...dom };
    if (!best || cand.n * cand.ratio > best.n * best.ratio) best = cand;
  }
  if (!best) return null;
  return {
    id: "A1", actionable: 1, strength: best.n * best.ratio,
    fact: `평소보다 ${LOADS[best.load]}이 있던 날 ${best.total}번 중 ${best.n}번, ${iga(PARTS[best.key])} 불편했어요.`,
    evidence: `${best.total}번 중 ${best.n}번`,
    info: `일반적으로 ${LOADS[best.load]}이 이어지면 ${PARTS[best.key]} 주변이 먼저 지친다고 알려져 있어요.`,
    sense: `${LOADS[best.load]}이 길어질 때, 몸이 먼저 알아차리는 것 같아요.`,
    suggestion: `${LOADS[best.load]}이 길어지는 날엔 잠깐씩 한 번 쉬어가면 어떨까요.`,
  };
}

/** E1 — 운동 종류 × 기분. 시간이라 비교식 가능. */
function detectE1(days) {
  const moodsByType = {};
  for (const d of days) {
    if (d.exercise?.did !== true) continue;
    for (const t of d.exercise.types || []) (moodsByType[t] ||= []).push(d.mood);
  }
  const eligible = Object.entries(moodsByType).filter(([, m]) => m.length >= CONFIG.MIN_OBSERVATIONS);
  if (eligible.length < 2) return null;
  const ranked = eligible.map(([t, m]) => ({ type: t, n: m.length, mean: avg(m) })).sort((a, b) => b.mean - a.mean);
  const top = ranked[0];
  const restMean = avg(ranked.slice(1).flatMap((r) => Array(r.n).fill(r.mean)));
  const gap = top.mean - restMean;
  if (gap < CONFIG.MOOD_GAP) return null;
  return {
    id: "E1", actionable: 1, strength: gap,
    fact: `${typeLabel(top.type)}을(를) 한 날의 기분이 다른 운동을 한 날보다 높았어요. (${top.n}번 · 평균 ${top.mean.toFixed(1)} vs ${restMean.toFixed(1)})`,
    evidence: `${typeLabel(top.type)} ${top.n}번`,
    info: "일반적으로 사람마다 잘 맞는 움직임의 종류가 다르다고 알려져 있어요.",
    sense: "몸이 어떤 움직임에 반가워하는지 알아차린 것 같아요.",
    suggestion: `${typeLabel(top.type)}이(가) 잘 맞는 것 같으면 조금 더 자주 해보면 좋겠어요.`,
  };
}

/** F1 — 요일 패턴. 시간이라 비교식 가능 (요일당 4~5회). */
function detectF1(days) {
  const byWd = {};
  for (const d of days) (byWd[weekdayOf(d.date)] ||= []).push(d.mood);
  const eligible = Object.entries(byWd).filter(([, m]) => m.length >= CONFIG.MIN_OBSERVATIONS);
  if (eligible.length < 3) return null;
  const ranked = eligible.map(([wd, m]) => ({ wd: Number(wd), n: m.length, mean: avg(m) })).sort((a, b) => a.mean - b.mean);
  const low = ranked[0];
  const others = ranked.slice(1);
  const othersMean = avg(others.flatMap((r) => Array(r.n).fill(r.mean)));
  const gap = othersMean - low.mean;
  if (gap < CONFIG.MOOD_GAP) return null;
  return {
    id: "F1", actionable: 1, strength: gap,
    fact: `${WEEKDAYS[low.wd]}요일의 컨디션이 다른 요일보다 낮았어요. (${low.n}번 · 평균 ${low.mean.toFixed(1)} vs ${othersMean.toFixed(1)})`,
    evidence: `${WEEKDAYS[low.wd]}요일 ${low.n}번`,
    info: "일반적으로 한 주 안에서도 피로가 쌓이는 시점이 사람마다 다르다고 알려져 있어요.",
    sense: `${WEEKDAYS[low.wd]}요일마다 몸이 조금 무거워지는 것 같아요.`,
    suggestion: `${WEEKDAYS[low.wd]}요일엔 일정을 조금 가볍게 잡아보면 어떨까요.`,
  };
}

/* ────────────────────────────────────────────────────────────
 * 7. 발견 선정 — ① 표현 가능 ② 의외성 ③ 관측 견고
 * ──────────────────────────────────────────────────────── */

export function findDiscovery(days, recentIds = []) {
  if (days.length < CONFIG.MIN_RECORD_DAYS) return { found: false, code: "MIN_DAYS", recorded: days.length, required: CONFIG.MIN_RECORD_DAYS };
  const cands = [detectD1(days), detectC2(days), detectA1(days), detectE1(days), detectF1(days)].filter(Boolean);
  if (!cands.length) return { found: false, code: "NO_PATTERN", recorded: days.length, required: CONFIG.MIN_RECORD_DAYS };

  const streak = (id) => recentIds.filter((p) => p === id).length;
  const pool = cands.filter((c) => streak(c.id) < CONFIG.REPEAT_LIMIT);
  const use = pool.length ? pool : cands;

  use.sort((a, b) =>
    (b.actionable - a.actionable) ||
    ((recentIds.includes(a.id) ? 1 : 0) - (recentIds.includes(b.id) ? 1 : 0)) ||
    (b.strength - a.strength)
  );
  return { found: true, discovery: use[0], all: use, others: use.slice(1).map((c) => c.id), recorded: days.length };
}

/* ────────────────────────────────────────────────────────────
 * 7-b. 입력 없이 얻는 발견 (freeSignals)
 *   기록 자체(기분·무리 여부·날짜 연속성)만으로 계산 — 추가 입력 불필요.
 *   · rebound(회복력): 힘들었던 날(기분≤2) 다음날, 하루 만에 기분이 오른 비율
 *   · streak(연속·공백): 무리한 날이 며칠 연속됐는지 + 그 직후 기분이 꺾였는지
 * ──────────────────────────────────────────────────────── */
const DAY_MS = 86400000;
// 날짜 문자열에 n일을 더한다. toISOString()은 UTC로 변환하며 하루가 밀릴 수 있어(한국시간 기준)
// 로컬 날짜 요소로만 계산한다.
const shiftISO = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

export function computeFreeSignals(days) {
  const byDate = Object.fromEntries(days.map((d) => [d.date, d]));

  // 회복력 — 힘들었던 다음날 하루 만에 반등한 비율
  let low = 0, rebound = 0;
  for (const d of days) {
    if (typeof d.mood !== "number" || d.mood > 2) continue;
    const next = byDate[shiftISO(d.date, 1)];
    if (!next || typeof next.mood !== "number") continue;
    low++;
    if (next.mood > d.mood) rebound++;
  }

  // 연속·공백 — 날짜가 이어진 무리한 날의 최장 연속 길이
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let longest = 0, cur = 0, prevDate = null, longestEnd = null;
  for (const d of sorted) {
    const consec = prevDate && new Date(d.date + "T00:00:00") - new Date(prevDate + "T00:00:00") === DAY_MS;
    if (d.overwork?.yes) {
      cur = consec ? cur + 1 : 1;
      if (cur > longest) { longest = cur; longestEnd = d.date; }
    } else {
      cur = 0;
    }
    prevDate = d.date;
  }
  // 최장 연속 무리 바로 다음날 기분이 꺾였는지
  const after = longestEnd ? byDate[shiftISO(longestEnd, 1)] : null;
  const crashAfter = !!(after && typeof after.mood === "number" && after.mood <= 2);

  return {
    rebound: { low, rebound, ratio: low ? rebound / low : 0 },
    streak: { longest, crashAfter },
  };
}

/* ────────────────────────────────────────────────────────────
 * 8. 발견 문구 조립 (BMTI)
 *   Z: 사실 → 정보/감각 → 제안
 *   M: 공감 → 사실 → 정보/감각 → 제안
 *   ※ Z는 '단정'이 아니라 '간결'. 단정 표현 금지 규칙은 그대로 적용.
 * ──────────────────────────────────────────────────────── */

const FALLBACK_EMPATHY = "이번 달도 몸을 살펴봐 주셔서 고마워요.";

export function composeDiscovery(result, bmti, empathy = null) {
  if (!result.found) {
    return {
      found: false,
      headline: null,
      evidence: null,
      lines: [bmti.zm === "Z"
        ? "이번 달은 패턴을 짚을 만큼 기록이 모이지 않았어요.\n며칠 더 있으면 찾아드릴게요."
        : "이번 달은 조용히 지켜보고 있어요.\n며칠 더 있으면 재밌는 걸 찾아올게요."],
      progress: { current: result.recorded, required: result.required },
    };
  }
  const d = result.discovery;
  const interp = bmti.dq === "Q" ? d.info : d.sense;
  const lines = bmti.zm === "Z"
    ? [interp, d.suggestion]
    : [empathy || FALLBACK_EMPATHY, interp, d.suggestion];
  return { found: true, id: d.id, headline: d.fact, evidence: d.evidence, lines, empathyFirst: bmti.zm === "M" };
}

/* ────────────────────────────────────────────────────────────
 * 9. 표현 가드 — LLM 출력·수동 카피 모두 통과시킬 것
 * ──────────────────────────────────────────────────────── */

export const BANNED_WORDS = ["치료", "교정", "완화", "개선", "진단", "원인", "통증", "질환", "효과", "처방", "점수", "랭킹", "달성률"];

/** @returns {{ok:boolean, hits:string[]}} */
export function guardCopy(text) {
  const hits = BANNED_WORDS.filter((w) => String(text).includes(w));
  return { ok: hits.length === 0, hits };
}

/* ────────────────────────────────────────────────────────────
 * 10. LLM 프롬프트 — M 유형만 '공감 한 문장'만
 *   Z 유형은 호출하지 않는다 → 사용자 절반은 비용 0
 *   실서비스에서는 반드시 서버에서 호출할 것
 * ──────────────────────────────────────────────────────── */

export function buildEmpathyPrompt({ report, bmti }) {
  if (bmti.zm !== "M" || !report.discovery?.found) return null;
  const dist = report.sections.find((s) => s.id === "mood_distribution");
  const rest = report.sections.find((s) => s.id === "rest");
  const lines = [
    `- 기록한 날: ${report.meta.recordedDays}일 / ${report.period.daysInMonth}일`,
    dist?.data?.top ? `- 가장 자주 나온 기분: ${MOOD[dist.data.top]}` : null,
    rest?.data ? `- 쉬어간 날: ${rest.data.days}일` : null,
    `- 이번 달 발견: ${report.discovery.headline}`,
  ].filter(Boolean);

  return `당신은 이동일기 앱의 마스코트 '말랑이'입니다. 월간 리포트 맨 위에 뜨일 '공감 한 문장'만 씁니다.

[이번 달 사용자]
${lines.join("\n")}

[규칙 — 반드시 지킬 것]
- 정확히 한 문장. 존댓말.
- 공감과 따뜻함 위주. 조언, 해결책, 다음 할 일, 원인 설명은 절대 넣지 마세요.
- 몸 상태를 진단하거나 단정 짓지 마세요.
- 체중, 강도, 외모, 성과, 점수를 언급하지 마세요.
- 어떤 선택이 옳다고 암시하거나 평가하지 마세요.
- 다음 단어를 쓰지 마세요: ${BANNED_WORDS.join(", ")}
- 이모지를 쓰지 마세요.

문장 하나만 출력하세요.`;
}

/* ────────────────────────────────────────────────────────────
 * 11. 메인 — 이 함수 하나만 호출하면 된다
 * ──────────────────────────────────────────────────────── */

function mkSection(id, title, current, data, summary, alert = null) {
  const required = CONFIG.UNLOCK[id];
  const unit = ["mood_calendar", "mood_distribution", "movement", "sleep"].includes(id) ? "day" : "count";
  const unlocked = current >= required;
  const left = Math.max(0, required - current);
  return {
    id, title, unlocked,
    progress: { current, required, unit },
    lockedMessage: unlocked ? null : `말랑이가 아직 지켜보는 중이에요 · ${left}${unit === "day" ? "일" : "번"}만 더 기록하면 열려요`,
    summary: unlocked ? summary : null,
    data: unlocked ? data : null,
    alert: unlocked ? alert : null,
  };
}

/**
 * 월간 리포트 전체를 만든다.
 * @param {DiaryEntry[]} entries  해당 월의 기록 (정렬 무관 — 내부에서 날짜순 정렬)
 * @param {Profile} profile
 * @param {{year:number, month:number, bmti:Bmti, empathy?:string|null, recentDiscoveryIds?:string[]}} opts
 */
export function buildMonthlyReport(entries, profile, opts) {
  const { year, month, bmti, empathy = null, recentDiscoveryIds = [] } = opts;
  const days = [...(entries || [])].filter((e) => e && e.mood).sort((a, b) => a.date.localeCompare(b.date));

  const discRaw = findDiscovery(days, recentDiscoveryIds);
  const discovery = composeDiscovery(discRaw, bmti, empathy);
  // 대표 발견 외에 추가로 보여줄 발견들 (발견 더보기). 공감 문구는 대표에만 붙이고 여기선 생략.
  const discoveries = discRaw.found
    ? discRaw.all.slice(0, 3).map((raw) => composeDiscovery({ found: true, discovery: raw }, bmti))
    : [];
  const freeSignals = computeFreeSignals(days);

  // 섹션별 집계
  const dCal = secMoodCalendar(days, year, month);
  const dDist = secMoodDistribution(days);
  const dSore = secSoreMap(days);
  const dMoments = secSoreMoments(days);
  const dOver = secOverwork(days, profile);
  const dMove = secMovement(days);
  const dRest = secRest(days);
  const dSleep = secSleep(days);
  const dNotes = secNotes(days);

  const soreCount = days.reduce((n, d) => n + (d.soreness?.length || 0), 0);

  const sections = [
    mkSection("mood_calendar", "기분 달력", days.length, dCal, `이번 달 ${days.length}일을 기록했어요.`),

    mkSection("mood_distribution", "이번 달 말랑이들", days.length, dDist,
      dDist.top ? `이번 달은 '${MOOD[dDist.top]}'한 날이 가장 많았어요.` : null),

    mkSection("sore_map", "불편한 곳 지도", soreCount, dSore,
      dSore.parts[0] ? `${eulreul(dSore.parts[0].label)} ${dSore.parts[0].count}번 짚어주셨어요. 평균 ${dSore.parts[0].avgLevel.toFixed(1)}이었어요.` : null),

    mkSection("sore_moments", "불편했던 순간", soreCount, dMoments,
      dMoments.items[0] ? `가장 자주 짚어주신 순간은 '${dMoments.items[0].label}'이었어요.` : null,
      dMoments.alldayCount >= CONFIG.CHRONIC_ALLDAY
        ? { type: "chronic", message: "'하루 종일' 불편했던 날이 여러 번이었어요. 계속된다면 전문가와 상담해보시길 권해요." }
        : null),

    // baseline 규칙: 반드시 '평소보다'를 앞에 둔다
    mkSection("overwork", "무리하던 날", dOver.days, dOver,
      dOver.items[0] ? `평소보다 '${dOver.items[0].label}'이 있던 날이 ${dOver.items[0].count}번이었어요.` : null),

    mkSection("movement", "몸을 움직인 날", dMove.days, dMove,
      dMove.byType[0] ? `${dMove.byType[0].label} ${dMove.byType[0].count}번, 이번 달 가장 많이 몸을 움직인 방법이었어요.` : null),

    // 톤 주의: 이곳은 강조하지 않는다. 이유의 분포만 보여준다.
    mkSection("rest", "쉬어간 날", dRest.days, dRest,
      dRest.items[0] ? `쉬어간 날엔 '${dRest.items[0].label}'가 가장 많았어요.` : null),

    mkSection("sleep", "잠든 날", dSleep.recorded, dSleep,
      dSleep.items[0]?.count ? `'${dSleep.items[0].label}'라고 적어주신 날이 ${dSleep.items[0].count}번이었어요.` : null),

    mkSection("notes", "한 줄 일기 모아보기", dNotes.items.length, dNotes,
      dNotes.items.length ? `이번 달 ${dNotes.items.length}줄을 남기셨어요.` : null),
  ];

  return {
    period: { year, month, daysInMonth: daysInMonth(year, month) },
    meta: { recordedDays: days.length, bmti },
    discovery,
    discoveries,
    freeSignals,
    sections,
    disclaimer: DISCLAIMER,
  };
}
