// BMTI 하루일기 기록 저장소 — localStorage를 빠른 로컬 캐시로 쓰고, 로그인한 유저는
// Supabase의 diary_entries 테이블에도 같이 저장해 다른 기기에서 로그인해도 같은 기록을 본다.
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'bmti_diary_history';

// 이 값보다 이전 날짜, 또는 오늘보다 미래인 날짜는 애초에 기록 대상이 아니다
// (DiaryCalendar의 날짜 선택 범위와 동일하게 맞춘다).
const MIN_DATE = '2026-07-01';

function getCurrentUserId() {
  try {
    const u = JSON.parse(localStorage.getItem('bmti_user') || 'null');
    return u?.id || null;
  } catch {
    return null;
  }
}

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
// extra에는 말랑이의 발견(월간 리포트)이 쓰는 sleep/overwork/exercise/soreness/note를 담을 수 있다 —
// 캘린더의 '오늘은 여기까지 할게요' 같은 간단 기록은 extra 없이 mood만 넘기면 된다.
export const saveDiaryEntry = (dateISO, mood, extra = {}) => {
  const history = getDiaryHistory().filter(e => e.date !== dateISO);
  history.push({ date: dateISO, mood, ...extra });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

  // 오늘 기록을 남긴 경우, 네비게이션 하단의 '오늘 아직 안 썼어요' 빨간 점을 끈다.
  if (dateISO === todayISO()) {
    localStorage.setItem('last_chat_date', dateISO);
    window.dispatchEvent(new Event('chat_updated'));
  }

  // 로그인한 유저면 서버에도 같이 저장해서 다른 기기에서도 같은 기록을 보게 한다.
  // 화면을 막지 않도록 결과를 기다리지 않고(fire-and-forget), 실패해도 로컬 기록은 남아있다.
  const userId = getCurrentUserId();
  if (userId) {
    supabase.from('diary_entries').upsert({
      user_id: userId,
      date: dateISO,
      mood,
      sleep: extra.sleep ?? null,
      overwork: extra.overwork ?? null,
      exercise: extra.exercise ?? null,
      soreness: extra.soreness ?? null,
      note: extra.note ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,date' }).then(({ error }) => {
      if (error) console.error('일기 기록 서버 저장 실패', error);
    });
  }

  return history;
};

// 로그인 직후(하루일기 진입 시) 한 번 호출해, 서버에 저장된 기록을 로컬 캐시에 반영한다.
// 다른 기기에서 기록한 내용을 지금 기기에서도 볼 수 있게 해주는 부분.
export async function syncDiaryHistoryFromServer() {
  const userId = getCurrentUserId();
  if (!userId) return getDiaryHistory();
  try {
    const { data, error } = await supabase.from('diary_entries').select('*').eq('user_id', userId);
    if (error) throw error;
    // 서버에 아직 컬럼이 없는 새 신호(tags·sleepTime)는 로컬에 저장된 값을 날짜 기준으로
    // 이어붙여, 다른 기기 동기화가 이 기기의 선택 태그·잠든 시간대를 지우지 않게 한다.
    const localByDate = Object.fromEntries(getDiaryHistory().map((e) => [e.date, e]));
    const mapped = (data || []).map((row) => {
      const local = localByDate[row.date] || {};
      return {
        date: row.date, mood: row.mood, sleep: row.sleep,
        overwork: row.overwork, exercise: row.exercise, soreness: row.soreness, note: row.note,
        sleepTime: row.sleep_time ?? local.sleepTime ?? null,
        tags: row.tags ?? local.tags ?? [],
      };
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
    return mapped;
  } catch (e) {
    console.error('일기 기록 서버 동기화 실패', e);
    return getDiaryHistory();
  }
}

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
// 서비스 시작일(2026-07-01)부터 오늘까지는 언제든 새로 쓰거나 고칠 수 있다. 미래 날짜만 막는다.
export const isWithinEditableWindow = (dateISO) => {
  return dateISO >= MIN_DATE && dateISO <= todayISO();
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
