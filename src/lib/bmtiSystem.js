import { supabase } from './supabaseClient';
import { isSubscriber } from './tokenSystem';

export const canRetakeTest = async (userProfile) => {
  if (!userProfile) return { canRetake: true }; // 비로그인 유저는 즉시 검사 가능 (로그인 모달이 어차피 뜰 수 있음)
  
  const tier = userProfile.subscription_tier || userProfile.subscriptionTier || 'free';
  const isPremium = isSubscriber(tier) || userProfile.isPremium;

  // 플러스 등급(평생구독권) 회원은 언제든 재검사 가능
  if (isPremium) {
    return { canRetake: true };
  }

  // 일반 회원은 이번 달(달력 기준)에 최대 2회까지만 검사 가능
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data, error } = await supabase
      .from('bmti_history')
      .select('created_at')
      .eq('user_id', userProfile.id)
      .gte('created_at', monthStart);

    if (error) {
      console.error('Error fetching BMTI history:', error);
      return { canRetake: true }; // 에러 발생 시 일단 허용
    }

    const countThisMonth = data ? data.length : 0;

    if (countThisMonth >= 2) {
      return {
        canRetake: false,
        message: '이번 달 검사 횟수(2회)를 모두 사용하셨어요. 다음 달부터 다시 검사할 수 있습니다.'
      };
    }

    if (countThisMonth === 1) {
      return {
        canRetake: true,
        isLastForMonth: true,
        message: '이번 검사가 이번 달의 마지막 검사예요. 다음 검사는 다음 달부터 가능해요.'
      };
    }
  } catch (err) {
    console.error('BMTI history check failed:', err);
  }

  return { canRetake: true };
};
