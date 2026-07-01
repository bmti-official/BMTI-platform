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

  // 일반 회원은 마지막 검사일 기준 1개월 뒤에 가능
  try {
    const { data, error } = await supabase
      .from('bmti_history')
      .select('created_at')
      .eq('user_id', userProfile.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching BMTI history:', error);
      return { canRetake: true }; // 에러 발생 시 일단 허용
    }

    if (data && data.length > 0) {
      const lastTestDate = new Date(data[0].created_at);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      if (lastTestDate > oneMonthAgo) {
        return { 
          canRetake: false, 
          message: '플러스 등급(평생구독권) 회원이 아니면 1달 뒤에 다시 검사할 수 있습니다.' 
        };
      }
    }
  } catch (err) {
    console.error('BMTI history check failed:', err);
  }

  return { canRetake: true };
};
