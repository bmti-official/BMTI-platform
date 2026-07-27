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
export const WHEN_OPTS = ["오늘 아침 일어날 때", "움직일 때", "오래 앉아있을 때", "오래 서있을 때", "하루 종일"];

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
export const HOTSPOTS = {
  front: [
    Z("머리", 40, 3, 20, 13),
    Z("목", 44, 16, 12, 5),
    Z("어깨", 27, 21, 46, 6),
    Z("팔꿈치", 19, 44, 12, 8), Z("팔꿈치", 69, 44, 12, 8),
    Z("손목", 17, 58, 12, 9), Z("손목", 71, 58, 12, 9),
    Z("복부", 38, 39, 24, 11),
    Z("골반", 35, 51, 30, 9),
    Z("무릎", 35, 71, 30, 8),
    Z("발목", 37, 89, 26, 7),
  ],
  back: [
    Z("머리", 40, 3, 20, 13),
    Z("목", 44, 16, 12, 5),
    Z("어깨", 27, 21, 46, 6),
    Z("팔꿈치", 19, 44, 12, 8), Z("팔꿈치", 69, 44, 12, 8),
    Z("손목", 17, 58, 12, 9), Z("손목", 71, 58, 12, 9),
    Z("등", 36, 29, 28, 12),
    Z("허리", 38, 45, 24, 6),
    Z("골반", 35, 52, 30, 9),
    Z("무릎", 35, 71, 30, 8),
    Z("발목", 37, 89, 26, 7),
  ],
  right: [
    Z("머리", 42, 4, 18, 11),
    Z("목", 45, 15, 11, 5),
    Z("어깨", 40, 20, 16, 6),
    Z("등", 36, 27, 12, 13),
    Z("복부", 50, 30, 12, 12),
    Z("팔꿈치", 44, 37, 12, 8),
    Z("손목", 44, 50, 12, 8),
    Z("허리", 40, 43, 16, 7),
    Z("골반", 40, 51, 20, 9),
    Z("무릎", 42, 70, 16, 8),
    Z("발목", 42, 89, 16, 7),
  ],
  left: [
    Z("머리", 40, 4, 18, 11),
    Z("목", 44, 15, 11, 5),
    Z("어깨", 44, 20, 16, 6),
    Z("등", 52, 27, 12, 13),
    Z("복부", 38, 30, 12, 12),
    Z("팔꿈치", 44, 37, 12, 8),
    Z("손목", 44, 50, 12, 8),
    Z("허리", 44, 43, 16, 7),
    Z("골반", 40, 51, 20, 9),
    Z("무릎", 42, 70, 16, 8),
    Z("발목", 42, 89, 16, 7),
  ],
};
// 회전 순서: 앞 → 오른쪽 → 뒤 → 왼쪽
export const VIEW_ORDER = ["front", "right", "back", "left"];
export const VIEW_LABEL = { front: "앞", right: "오른쪽", back: "뒤", left: "왼쪽" };

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
