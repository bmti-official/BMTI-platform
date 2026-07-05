/**
 * ⭐️ 스타 경제 시스템
 * localStorage 기반 (추후 Supabase 연동 가능)
 */

const STAR_STORAGE_KEY = 'bmti_star_balance';
const STAR_DAILY_KEY = 'bmti_star_daily';
const STAR_HISTORY_KEY = 'bmti_star_history';
const MAX_DAILY_EARN = 10; // 일일 최대 획득량

// ⭐️ 획득량
export const STAR_EARN_AMOUNTS = {
  post: 3,      // 게시글 작성
  comment: 1,   // 댓글
  reply: 1,     // 대댓글
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getDailyData() {
  try {
    const data = JSON.parse(localStorage.getItem(STAR_DAILY_KEY) || '{}');
    if (data.date !== getTodayStr()) {
      return { date: getTodayStr(), earned: 0 };
    }
    return data;
  } catch {
    return { date: getTodayStr(), earned: 0 };
  }
}

function saveDailyData(data) {
  localStorage.setItem(STAR_DAILY_KEY, JSON.stringify(data));
}

/**
 * 현재 ⭐️ 잔액 조회
 */
export function getStarBalance() {
  return parseInt(localStorage.getItem(STAR_STORAGE_KEY) || '0', 10);
}

/**
 * 오늘 획득한 ⭐️ 수
 */
export function getDailyEarned() {
  const data = getDailyData();
  return data.earned;
}

/**
 * ⭐️ 획득 (게시글/댓글/대댓글)
 * @returns {{ success: boolean, amount: number, balance: number, message: string }}
 */
export function earnStar(reason) {
  const amount = STAR_EARN_AMOUNTS[reason] || 0;
  if (amount === 0) return { success: false, amount: 0, balance: getStarBalance(), message: '올바르지 않은 이유입니다.' };

  const daily = getDailyData();
  if (daily.earned >= MAX_DAILY_EARN) {
    return { 
      success: false, 
      amount: 0, 
      balance: getStarBalance(), 
      message: `오늘의 ⭐️ 획득 한도(${MAX_DAILY_EARN}개)에 도달했습니다.` 
    };
  }

  const actualAmount = Math.min(amount, MAX_DAILY_EARN - daily.earned);
  const newBalance = getStarBalance() + actualAmount;
  
  localStorage.setItem(STAR_STORAGE_KEY, String(newBalance));
  daily.earned += actualAmount;
  saveDailyData(daily);

  // 히스토리 저장
  const history = JSON.parse(localStorage.getItem(STAR_HISTORY_KEY) || '[]');
  history.push({ amount: actualAmount, reason, date: new Date().toISOString() });
  // 최근 100개만 보관
  if (history.length > 100) history.splice(0, history.length - 100);
  localStorage.setItem(STAR_HISTORY_KEY, JSON.stringify(history));

  return { 
    success: true, 
    amount: actualAmount, 
    balance: newBalance, 
    message: `⭐️ +${actualAmount} 충전! (잔액: ${newBalance}개)` 
  };
}

/**
 * ⭐️ 히스토리 조회
 */
export function getStarHistory() {
  return JSON.parse(localStorage.getItem(STAR_HISTORY_KEY) || '[]');
}

/**
 * ⭐️ 회수 (당일 삭제 시)
 * 잔액이 부족하면 마이너스도 허용
 * @param {string} reason - 'post' | 'comment' | 'reply'
 * @returns {{ success: boolean, amount: number, balance: number, message: string }}
 */
export function reclaimStar(reason) {
  const amount = STAR_EARN_AMOUNTS[reason] || 0;
  if (amount === 0) return { success: false, amount: 0, balance: getStarBalance(), message: '' };

  const daily = getDailyData();
  const newBalance = getStarBalance() - amount;
  
  localStorage.setItem(STAR_STORAGE_KEY, String(newBalance));
  daily.earned = Math.max(0, daily.earned - amount);
  saveDailyData(daily);

  // 히스토리 저장
  const history = JSON.parse(localStorage.getItem(STAR_HISTORY_KEY) || '[]');
  history.push({ amount: -amount, reason: `${reason}_delete`, date: new Date().toISOString() });
  if (history.length > 100) history.splice(0, history.length - 100);
  localStorage.setItem(STAR_HISTORY_KEY, JSON.stringify(history));

  return { 
    success: true, 
    amount, 
    balance: newBalance, 
    message: `⭐️ -${amount} 회수됨 (잔액: ${newBalance}개)` 
  };
}
