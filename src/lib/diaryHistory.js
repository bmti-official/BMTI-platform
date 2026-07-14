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

  // 오늘 기록을 남긴 경우, 네비게이션 하단의 '오늘 아직 안 썼어요' 빨간 점을 끈다.
  if (dateISO === todayISO()) {
    localStorage.setItem('last_chat_date', dateISO);
    window.dispatchEvent(new Event('chat_updated'));
  }

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
export const getPrevMonthKey = (baseDate = new Date()) => {
  const prev = new Date(baseDate.getFullYear(), baseDate.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
};

export const getPrevMonthEntryCount = (baseDate = new Date()) => {
  const key = getPrevMonthKey(baseDate);
  return getDiaryHistory().filter(e => e.date.startsWith(key)).length;
};

export const canClaimMonthlyReport = () => getPrevMonthEntryCount() >= 10;

// ── 작성/수정 가능 기간 ──
// 오늘로부터 최근 7일(오늘 포함)까지만 새로 쓰거나 고칠 수 있다.
export const isWithinEditableWindow = (dateISO) => {
  const today = new Date(`${todayISO()}T00:00:00`);
  const d = new Date(`${dateISO}T00:00:00`);
  const diffDays = Math.round((today - d) / 86400000);
  return diffDays >= 0 && diffDays <= 6;
};

// 리포트를 이미 발행받은 기록은, 7일 이내라도 다시 고치면 리포트 내용과 어긋나므로 잠근다.
const WEEKLY_ISSUED_AT_KEY = 'bmti_weekly_report_issued_at';
const MONTHLY_REPORTED_MONTHS_KEY = 'bmti_monthly_reported_months';

export const getWeeklyReportIssuedAt = () => localStorage.getItem(WEEKLY_ISSUED_AT_KEY) || null;
export const markWeeklyReportIssued = () => localStorage.setItem(WEEKLY_ISSUED_AT_KEY, todayISO());

export const getMonthlyReportedMonths = () => {
  try { return JSON.parse(localStorage.getItem(MONTHLY_REPORTED_MONTHS_KEY) || '[]'); } catch { return []; }
};
export const markMonthlyReportIssued = (monthKey) => {
  const months = getMonthlyReportedMonths();
  if (!months.includes(monthKey)) {
    months.push(monthKey);
    localStorage.setItem(MONTHLY_REPORTED_MONTHS_KEY, JSON.stringify(months));
  }
};

export const isEntryLocked = (dateISO) => {
  const issuedAt = getWeeklyReportIssuedAt();
  if (issuedAt && dateISO <= issuedAt) return true;
  const monthKey = dateISO.slice(0, 7);
  return getMonthlyReportedMonths().includes(monthKey);
};

export const isDayWritable = (dateISO) => isWithinEditableWindow(dateISO) && !isEntryLocked(dateISO);
