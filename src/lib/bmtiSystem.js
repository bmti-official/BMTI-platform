import { supabase } from './supabaseClient';

export const canRetakeTest = async (userProfile) => {
  if (!userProfile) return { canRetake: true }; // 비로그인 유저는 즉시 검사 가능 (로그인 모달이 어차피 뜰 수 있음)

  // 이번 달(달력 기준)에 최대 2회까지만 검사 가능
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

// 다시 검사하기 직전 — 지금 결과가 아직 히스토리에 없을 때만 남긴다.
//
// 검사를 마치면 App.jsx가 그 결과를 히스토리에 넣는다. 그런데 2026-09-29 전에는 그 저장이
// 깨져 있어서(.catch TypeError), 예전 회원의 지금 결과는 히스토리에 없을 수 있다.
// 그래서 여기서 무조건 넣으면 같은 결과가 두 번 쌓이고, 위 canRetakeTest의
// '한 달 2회' 셈이 한 번 빨리 막힌다. 마지막 줄이 지금 결과와 같으면 넣지 않는다.
export async function archiveBeforeRetake(userId, code) {
  if (!userId || !code) return;
  try {
    const { data } = await supabase.from('bmti_history').select('bmti_code')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
    if (data && data[0] && data[0].bmti_code === code) return;
    const { error } = await supabase.from('bmti_history').insert({ user_id: userId, bmti_code: code });
    if (error) console.error('검사 이력 저장 실패', error);
  } catch (e) { console.error(e); }
}
