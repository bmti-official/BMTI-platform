// BMTI 하루일기 기록 저장소 — 아직 서버(Supabase)에 저장하는 기능이 없어서,
// 캘린더에 "이번 달 며칠 기록했는지"와 날짜별 무드를 보여주기 위해 로컬에만 저장한다.
const STORAGE_KEY = 'bmti_diary_history';

export const todayISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const getDiaryHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const hasDiaryHistory = () => getDiaryHistory().length > 0;

export const getEntryForDate = (dateISO) => getDiaryHistory().find(e => e.date === dateISO);

// 같은 날짜에 다시 기록하면 그날 것을 덮어쓴다 (하루 1건).
export const saveDiaryEntry = (dateISO, mood) => {
  const history = getDiaryHistory().filter(e => e.date !== dateISO);
  history.push({ date: dateISO, mood });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
};

// ── 주간/월간 리포트 활성화 조건 ──
// 주간 리포트: 마지막으로 받은 시점(없으면 처음부터) 이후 컨디션 체크 7회 이상 쌓이면 활성.
const WEEKLY_BASELINE_KEY = 'bmti_weekly_report_baseline';

export const getWeeklyReportBaseline = () => {
  const v = localStorage.getItem(WEEKLY_BASELINE_KEY);
  return v ? parseInt(v, 10) : 0;
};

export const setWeeklyReportBaseline = (count) => {
  localStorage.setItem(WEEKLY_BASELINE_KEY, String(count));
};

export const getEntriesSinceWeeklyBaseline = () => {
  return getDiaryHistory().length - getWeeklyReportBaseline();
};

export const canClaimWeeklyReport = () => getEntriesSinceWeeklyBaseline() >= 7;

// 월간 리포트: 지난달 총 컨디션 체크가 10회 이상이면 활성 (매달 자연스럽게 갱신됨).
export const getPrevMonthEntryCount = (baseDate = new Date()) => {
  const prev = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  const key = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  return getDiaryHistory().filter(e => e.date.startsWith(key)).length;
};

export const canClaimMonthlyReport = () => getPrevMonthEntryCount() >= 10;
