// 강사를 받는 동네 — 첫 생활권(판교·분당). 늘릴 땐 여기만 고친다.
export const COACH_AREAS = ['판교', '정자', '서현', '수내', '야탑', '미금'];

// 면허는 한 해에 한 번 다시 확인한다
export const RECHECK_DAYS = 365;
export const needsRecheck = (iso, now = Date.now()) => {
  if (!iso) return true;
  const t = new Date(`${iso}T00:00:00`).getTime();
  return !Number.isFinite(t) || now - t > RECHECK_DAYS * 864e5;
};
