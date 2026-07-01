export const BMTI_INFO = {
  'ACDM': { kr: '활동적 집중 실전 공감형', catchphrase: '몸으로 먼저 느끼고, 마음으로 함께 움직이는 사람', bestMatch: 'OLQZ', diffTempo: 'OLQM', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
  'ACDZ': { kr: '활동적 집중 실전 팩트형', catchphrase: '결과로 말하는 실전 파워 무버', bestMatch: 'OLQM', diffTempo: 'OLQZ', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
  'ACQM': { kr: '활동적 집중 탐구 공감형', catchphrase: '이론과 감성 사이에서 최적의 균형을 찾는 사람', bestMatch: 'OLDZ', diffTempo: 'OLDM', color: '#A78BFA', bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' },
  'ACQZ': { kr: '활동적 집중 탐구 팩트형', catchphrase: '데이터로 파고드는 분석형 액티비스트', bestMatch: 'OLDM', diffTempo: 'OLDZ', color: '#60A5FA', bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  'ALDM': { kr: '활동적 전신 실전 공감형', catchphrase: '전신으로 느끼며 사람과 함께 성장하는 무버', bestMatch: 'OCQZ', diffTempo: 'OCQM', color: '#F472B6', bgGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  'ALDZ': { kr: '활동적 전신 실전 팩트형', catchphrase: '거침없는 실행력으로 몸 전체를 깨우는 사람', bestMatch: 'OCQM', diffTempo: 'OCQZ', color: '#34D399', bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
  'ALQM': { kr: '활동적 전신 탐구 공감형', catchphrase: '호기심과 따뜻함이 공존하는 밸런스 탐험가', bestMatch: 'OCDZ', diffTempo: 'OCDM', color: '#FBBF24', bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  'ALQZ': { kr: '활동적 전신 탐구 팩트형', catchphrase: '과학적 근거 위에 움직임을 설계하는 전략가', bestMatch: 'OCDM', diffTempo: 'OCDZ', color: '#818CF8', bgGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
  'OCDM': { kr: '정적인 집중 실전 공감형', catchphrase: '내면의 소리에 귀 기울이며 성장하는 조율사', bestMatch: 'ALQZ', diffTempo: 'ALQM', color: '#EC4899', bgGradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)' },
  'OCDZ': { kr: '정적인 집중 실전 팩트형', catchphrase: '나만의 페이스로 목표를 명중시키는 저격수', bestMatch: 'ALQM', diffTempo: 'ALQZ', color: '#10B981', bgGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  'OCQM': { kr: '정적인 집중 탐구 공감형', catchphrase: '깊이 있는 이해로 몸과 마음을 잇는 가이드', bestMatch: 'ALDZ', diffTempo: 'ALDM', color: '#8B5CF6', bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' },
  'OCQZ': { kr: '정적인 집중 탐구 팩트형', catchphrase: '원리를 파악하고 체계를 세우는 전략가', bestMatch: 'ALDM', diffTempo: 'ALDZ', color: '#3B82F6', bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  'OLDM': { kr: '정적인 전신 실전 공감형', catchphrase: '휴식의 가치를 알고 나를 돌보는 도슨트', bestMatch: 'ACQZ', diffTempo: 'ACQM', color: '#F43F5E', bgGradient: 'linear-gradient(135deg, #F43F5E 0%, #E11D48 100%)' },
  'OLDZ': { kr: '정적인 전신 실전 팩트형', catchphrase: '유연한 사고로 실용성을 찾는 해결사', bestMatch: 'ACQM', diffTempo: 'ACQZ', color: '#14B8A6', bgGradient: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)' },
  'OLQM': { kr: '정적인 전신 탐구 공감형', catchphrase: '전체를 조망하며 안정을 찾는 키다리 아저씨', bestMatch: 'ACDZ', diffTempo: 'ACDM', color: '#F59E0B', bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  'OLQZ': { kr: '정적인 전신 탐구 팩트형', catchphrase: '정확한 분석으로 최적의 답을 찾는 수학자', bestMatch: 'ACDM', diffTempo: 'ACDZ', color: '#6366F1', bgGradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' },
};

export function calculateBMTIPercentages(answers) {
  if (!answers || answers.length === 0) return null;
  const percentages = {};
  AXES.forEach(axis => {
    const leftSum = axis.left.questions.reduce((acc, q) => acc + (answers[q - 1] || 0), 0);
    const rightSum = axis.right.questions.reduce((acc, q) => acc + (answers[q - 1] || 0), 0);
    const totalSum = leftSum + rightSum;
    const leftPct = Math.round((leftSum / totalSum) * 100);
    percentages[axis.left.letter] = leftPct;
    percentages[axis.right.letter] = 100 - leftPct;
  });
  return percentages;
}
