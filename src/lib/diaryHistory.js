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
