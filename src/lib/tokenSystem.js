/**
 * 토큰 관리 시스템
 * 일일 토큰 제한 및 사용량 추적 (localStorage 기반)
 */

const TOKEN_USAGE_KEY = 'bmti_token_usage';
const TOKEN_BONUS_KEY = 'bmti_token_bonus';

// 구독 티어별 일일 토큰 한도
export const DAILY_TOKEN_LIMITS = {
  free: 3000,
  plus_monthly: 25000,
  plus_lifetime: 25000,
  pro_monthly: 100000,
  pro_lifetime: 100000,
  admin: 9999999, // 관리자 무제한
};

// 기능별 예상 토큰 소비량
export const TOKEN_COSTS = {
  CHAT_MESSAGE: 500,       // 1:1 기본 대화
  CHAT_WITH_MEMORY: 800,   // 기억 포함 대화
  GROUP_MENTION: 1200,     // @BMTI 단톡방 호출
  SCHEDULED_MSG: 400,      // 예약 메시지
};

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getUsageData() {
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_USAGE_KEY) || '{}');
    if (data.date !== getTodayStr()) {
      // 새 날 → 사용량 초기화
      return { date: getTodayStr(), used: 0 };
    }
    return data;
  } catch {
    return { date: getTodayStr(), used: 0 };
  }
}

function saveUsageData(data) {
  localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(data));
}

function getBonusData() {
  try {
    const data = JSON.parse(localStorage.getItem(TOKEN_BONUS_KEY) || '{}');
    if (data.date !== getTodayStr()) {
      return { date: getTodayStr(), bonus: 0 };
    }
    return data;
  } catch {
    return { date: getTodayStr(), bonus: 0 };
  }
}

function saveBonusData(data) {
  localStorage.setItem(TOKEN_BONUS_KEY, JSON.stringify(data));
}

/**
 * 오늘 사용한 토큰 수
 */
export function getUsedTokens() {
  return getUsageData().used;
}

/**
 * 오늘의 보너스 토큰 (⭐️로 충전한 양)
 */
export function getBonusTokens() {
  return getBonusData().bonus;
}

/**
 * 일일 한도 (기본 + 보너스)
 */
export function getTotalDailyLimit(subscriptionTier = 'free') {
  const base = DAILY_TOKEN_LIMITS[subscriptionTier] || DAILY_TOKEN_LIMITS.free;
  const bonus = getBonusTokens();
  return base + bonus;
}

/**
 * 남은 토큰
 */
export function getRemainingTokens(subscriptionTier = 'free') {
  const total = getTotalDailyLimit(subscriptionTier);
  const used = getUsedTokens();
  return Math.max(0, total - used);
}

/**
 * 토큰 사용 가능 여부 체크
 */
export function canUseTokens(amount, subscriptionTier = 'free') {
  return getRemainingTokens(subscriptionTier) >= amount;
}

/**
 * 토큰 사용 (차감)
 * @returns {{ success: boolean, remaining: number, message: string }}
 */
export function useTokens(amount, subscriptionTier = 'free') {
  if (!canUseTokens(amount, subscriptionTier)) {
    const remaining = getRemainingTokens(subscriptionTier);
    return { 
      success: false, 
      remaining,
      message: `토큰이 부족합니다. (남은: ${remaining.toLocaleString()} / 필요: ${amount.toLocaleString()})` 
    };
  }

  const usage = getUsageData();
  usage.used += amount;
  saveUsageData(usage);

  return { 
    success: true, 
    remaining: getRemainingTokens(subscriptionTier),
    message: '' 
  };
}

/**
 * 보너스 토큰 추가 (⭐️ 교환 시)
 */
export function addBonusTokens(amount) {
  const bonus = getBonusData();
  bonus.bonus += amount;
  saveBonusData(bonus);
  return bonus.bonus;
}

/**
 * 토큰 사용률 (%) 
 */
export function getUsagePercentage(subscriptionTier = 'free') {
  const total = getTotalDailyLimit(subscriptionTier);
  const used = getUsedTokens();
  return Math.min(100, Math.round((used / total) * 100));
}

/**
 * 구독 티어 표시 이름
 */
export function getTierDisplayName(tier) {
  const names = {
    free: '무료',
    plus_monthly: 'Plus 월구독',
    plus_lifetime: 'Plus 평생구독',
    pro_monthly: 'Pro 월구독',
    pro_lifetime: 'Pro 평생구독',
  };
  return names[tier] || '무료';
}

/**
 * 구독자 여부 (Plus 이상)
 */
export function isSubscriber(tier) {
  return tier && tier !== 'free';
}

/**
 * Pro 구독자 여부
 */
export function isProSubscriber(tier) {
  return tier === 'pro_monthly' || tier === 'pro_lifetime';
}
