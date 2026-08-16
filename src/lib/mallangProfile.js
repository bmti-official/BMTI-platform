// 말랑 정보(온보딩 1회 입력 → 마이페이지에서 수정) 공용 상수·헬퍼.
// 온보딩(DiaryOnboarding)·마이페이지(MyPageView)·다이어리(DiaryWriteFlow) 세 곳이 함께 쓴다.
// 서버 저장은 각 컴포넌트가 supabase로 직접 하고, 여기서는 게스트용 localStorage 캐시와
// 라벨/문구 포맷만 담당한다.

// ── 운동 습관 ──
export const FREQ_OPTS = [
  { id: "none", label: "거의 안 해요" },
  { id: "sometimes", label: "가끔 생각날 때" },
  { id: "weekly", label: "일주일에 몇 번" },
  { id: "daily", label: "거의 매일" },
];
export const GOAL_OPTS = [
  { id: "flexibility", label: "💢 뻐근함 줄이기" },
  { id: "posture", label: "🧘🏻‍♀️ 자세 바로잡기" },
  { id: "health", label: "🏃🏻 체력 기르기" },
  { id: "stress", label: "💥 스트레스 풀기" },
];
// '무거운 물건' 추가 — 온보딩·마이페이지 공용
export const POSTURE_OPTS = [
  { id: "sitting", label: "🪑 주로 앉아 있어요", sub: "사무직, 공부 등" },
  { id: "standing", label: "🧍 주로 서 있어요", sub: "판매, 요리, 미용 등" },
  { id: "moving", label: "🚶 계속 움직여요", sub: "간호, 육아, 서비스 등" },
  { id: "mixed", label: "🔄 앉았다 섰다 해요", sub: "다양" },
  { id: "heavy", label: "📦 무거운 물건을 자주 들어요", sub: "물류, 현장직 등" },
  { id: "other", label: "기타" },
];
export const POSTURE_KNOWN_IDS = ["sitting", "standing", "moving", "mixed", "heavy"];

export const FREQ_LABELS = Object.fromEntries(FREQ_OPTS.map(o => [o.id, o.label]));
export const GOAL_LABELS = Object.fromEntries(GOAL_OPTS.map(o => [o.id, o.label]));
export const POSTURE_LABELS = Object.fromEntries(POSTURE_OPTS.map(o => [o.id, o.label]));

// ── 불편한 부위 ──
// 인체 위 → 아래 순서 (기타는 항상 마지막). DiaryWriteFlow의 PARTS와 동일하게 유지.
export const SORE_PARTS = ["머리", "목", "어깨", "팔꿈치", "손목", "등", "복부", "허리", "골반", "무릎", "발목", "기타"];
export const WHEN_OPTS = ["오늘 아침 일어날 때", "움직일 때", "오래 앉아있을 때", "오래 서있을 때", "일할 때", "하루 종일"];

// ── 받침 유무로 이/가·은/는 조사 고르기 ──
export function hasBatchim(word) {
  if (!word) return false;
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xAC00 || code > 0xD7A3) return false;
  return (code - 0xAC00) % 28 !== 0;
}

// ── 3D 부위 선택 히트존 ──
// 뷰별로 부위 버튼을 캔버스(700x1400 정규화 이미지) 위 % 좌표로 배치한다.
// 캐릭터는 모든 뷰에서 세로 3.5%~96.5%를 차지하도록 정규화돼 있어 y%가 뷰 간 일관적이다.
// 하나의 부위가 좌우 두 곳(팔꿈치/손목/무릎/발목)에 있을 수 있고, 어느 쪽을 눌러도 같은 부위로 선택된다.
// {part, x, y, w, h} = 중심 기준이 아니라 좌상단 기준 % 사각형.
const Z = (part, x, y, w, h) => ({ part, x, y, w, h });
// 앞/뒤 두 뷰만 사용(옆모습 제거). 앞: 목·허리·등 없음 / 뒤: 복부 없음.
// 어깨는 좌·우 각각, 목은 넓게.
// 좌표는 정규화 3D 이미지(캐릭터 세로 4~96%)의 실제 부위 위치에 맞춤.
// 여성 기준: 목 y≈26%(가장 좁은 지점), 어깨 y≈29~35%, 골반 y≈59%, 무릎 y≈77%, 발목 y≈90%.
export const HOTSPOTS = {
  front: [
    Z("머리", 40, 5, 20, 13),
    Z("어깨", 27, 29, 17, 7), Z("어깨", 56, 29, 17, 7),
    Z("팔꿈치", 18, 45, 13, 8), Z("팔꿈치", 69, 45, 13, 8),
    Z("손목", 17, 57, 12, 9), Z("손목", 71, 57, 12, 9),
    Z("복부", 38, 42, 24, 10),
    Z("골반", 35, 55, 30, 9),
    Z("무릎", 35, 73, 14, 8), Z("무릎", 51, 73, 14, 8),   // 좌·우로 분리
    Z("발목", 37, 87, 12, 7), Z("발목", 51, 87, 12, 7),   // 좌·우로 분리
  ],
  back: [
    Z("머리", 40, 5, 20, 13),
    Z("목", 40, 22, 20, 9),          // 2배 크게, 실제 목 위치(y≈26%)로 내림
    Z("어깨", 27, 29, 17, 7), Z("어깨", 56, 29, 17, 7),
    Z("팔꿈치", 18, 45, 13, 8), Z("팔꿈치", 69, 45, 13, 8),
    Z("손목", 17, 57, 12, 9), Z("손목", 71, 57, 12, 9),
    Z("등", 36, 33, 28, 6),           // 높이 절반으로
    Z("허리", 38, 46, 24, 10),        // 위로만 높여(아래는 56% 유지)
    Z("골반", 35, 55, 30, 9),
    Z("무릎", 35, 73, 14, 8), Z("무릎", 51, 73, 14, 8),
    Z("발목", 37, 87, 12, 7), Z("발목", 51, 87, 12, 7),
  ],
};
// 앞 ↔ 뒤 두 뷰만 전환
export const VIEW_ORDER = ["front", "back"];
export const VIEW_LABEL = { front: "앞모습", back: "뒷모습" };

// 부위·언제를 한 줄 문구로 — "허리(움직일 때·하루 종일), 목(아침)". when은 배열(중복 선택).
export function soreSummary(sore) {
  if (!Array.isArray(sore) || sore.length === 0) return "";
  return sore.map(s => {
    const whens = Array.isArray(s.when) ? s.when : (s.when ? [s.when] : []);
    const txt = whens.map(w => (w === "기타" ? (s.whenOther || "기타") : w)).join("·");
    return `${s.part}${txt ? `(${txt})` : ""}`;
  }).join(", ");
}

// ── 게스트(미로그인) localStorage 캐시 ──
const MALLANG_KEY = "bmti_mallang_info";
const HISTORY_KEY = "bmti_mallang_info_history";

export function getGuestMallang() {
  try { return JSON.parse(localStorage.getItem(MALLANG_KEY) || "null"); } catch { return null; }
}
export function setGuestMallang(info) {
  localStorage.setItem(MALLANG_KEY, JSON.stringify(info));
}
export function getGuestMallangHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
export function pushGuestMallangHistory(snapshot) {
  const list = getGuestMallangHistory();
  list.unshift({ ...snapshot, created_at: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 24)));
}

// userInfo(서버) 또는 게스트 캐시에서 말랑 정보(sore/운동)를 통합해 읽어온다.
export function readMallangProfile(userInfo) {
  const guest = getGuestMallang();
  const sore = userInfo?.mallang_sore ?? guest?.sore ?? null;
  return {
    sore: Array.isArray(sore) ? sore : (sore ? [] : null),
    exercise_frequency: userInfo?.exercise_frequency ?? guest?.exercise_frequency ?? null,
    exercise_goals: userInfo?.exercise_goals ?? guest?.exercise_goals ?? [],
    common_posture: userInfo?.common_posture ?? guest?.common_posture ?? null,
  };
}

// 이번 달 '수정(edit)' 횟수 제한(2회) 판정용 — 히스토리 rows에서 이번 달 edit 개수를 센다.
export function editsThisMonth(historyRows) {
  const now = new Date();
  return (historyRows || []).filter(r => {
    if (r.source !== "edit") return false;
    const d = new Date(r.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}
export const MONTHLY_EDIT_LIMIT = 2;

// ── 수면 기준 설정 ─────────────────────────────────────────────
// 다이어리 첫 진입 시 '주로 잠드는 시간대'(수동) 또는 '불규칙'을 고르고, 그 뒤 매일의 수면 입력이
// 이 설정을 따른다. '말랑이의 밤' 월간 집계 때문에 한 달에 한 번만 바꿀 수 있다.
const SLEEP_KEY = "bmti_sleep_setting";
// 좌우로 넘겨 기준 시간을 고르는 타임라인 — 모든 시간을 고를 수 있게 저녁~아침 전체를 담는다.
export const SLEEP_HOURS = ["저녁 7시", "저녁 8시", "저녁 9시", "밤 10시", "밤 11시", "밤 12시", "새벽 1시", "새벽 2시", "새벽 3시", "새벽 4시", "새벽 5시", "아침 6시", "아침 7시"];
export const SLEEP_BASE_MIN = 0;
export const SLEEP_BASE_MAX = SLEEP_HOURS.length - 1;
// 불규칙 수면 3단계
export const SLEEP_IRREGULAR_OPTS = ["일찍 잤어요", "적당히 잤어요", "늦게 잤어요"];

export function sleepBaseIdx(base) {
  const i = SLEEP_HOURS.indexOf(base);
  return i < 0 ? 5 : i; // 기본 밤 12시
}
// 기준 시간을 중심으로 앞2·뒤2 = 5개(매일 입력용). 한 줄에 다 들어가도록 '밤/새벽' 등은 떼고 '~10시 / 11시 / … / 2시~' 형태로 짧게.
const sleepHourNum = (label) => label.replace(/^(저녁|밤|새벽|아침)\s*/, "");
export function sleepWindowByIdx(i) {
  const c = Math.max(2, Math.min(SLEEP_HOURS.length - 3, i));
  return [`~${sleepHourNum(SLEEP_HOURS[c - 2])}`, sleepHourNum(SLEEP_HOURS[c - 1]), sleepHourNum(SLEEP_HOURS[c]), sleepHourNum(SLEEP_HOURS[c + 1]), `${sleepHourNum(SLEEP_HOURS[c + 2])}~`];
}
export function sleepWindow(base) { return sleepWindowByIdx(sleepBaseIdx(base)); }

export function getSleepSetting() { try { return JSON.parse(localStorage.getItem(SLEEP_KEY) || "null"); } catch { return null; } }
export function setSleepSetting(mode, base) {
  const month = new Date().toISOString().slice(0, 7);
  const v = { mode, base: mode === "manual" ? (base || SLEEP_HOURS[3]) : null, month };
  try { localStorage.setItem(SLEEP_KEY, JSON.stringify(v)); } catch {}
  return v;
}
export function canChangeSleepSetting() {
  const s = getSleepSetting();
  if (!s) return true;
  return s.month !== new Date().toISOString().slice(0, 7); // 이번 달에 이미 정했으면 다음 달까지 잠금
}
// 오늘 입력에 보여줄 수면 시간대 선택지 (설정에 따라 5개 또는 3개)
export function sleepOptionsFor(setting) {
  if (!setting) return null;
  return setting.mode === "irregular" ? SLEEP_IRREGULAR_OPTS : sleepWindow(setting.base);
}

// ── 로그인 유저: 기본 수면 설정을 서버(users.sleep_setting JSONB)에 함께 저장/복원 ──
// 컬럼이 아직 없으면 조용히 실패하고 localStorage만 사용한다(무회귀).
// 서버 값(달 기준)이 로컬보다 최신이거나 로컬이 없으면 서버 값을 로컬 기준으로 삼아 다른 기기에서도 이어쓴다.
export function syncSleepSettingFromServer(serverSetting) {
  if (!serverSetting || typeof serverSetting !== "object" || !serverSetting.month) return;
  const local = getSleepSetting();
  if (!local || !local.month || serverSetting.month >= local.month) {
    try { localStorage.setItem(SLEEP_KEY, JSON.stringify(serverSetting)); } catch {}
  }
}
export async function saveSleepSettingToServer(v) {
  try {
    const u = JSON.parse(localStorage.getItem("bmti_user") || "null");
    if (!u?.id || !v) return;
    const { supabase } = await import("./supabaseClient");
    await supabase.from("users").update({ sleep_setting: v }).eq("id", u.id);
  } catch { /* 컬럼 미존재 등은 무시 — localStorage가 유지된다 */ }
}
