// 결과지 공용 상수 — ResultView와 ShareBox가 함께 쓴다(순환 import 방지용 분리).
// 4가지 성향 대표 문장에서 항목 메인 색상으로 강조할 핵심 문구
export const TENDENCY_HL = {
  A: { confident: '몸을 움직여야', flexible: '가볍게 몸을 움직이면' },
  O: { confident: '조용히', flexible: '조용히 쉬는' },
  C: { confident: "'여기'", flexible: '집중할 부위' },
  L: { confident: '전체적으로', flexible: '연결' },
  D: { confident: '직접 움직여', flexible: '직접 움직이면서' },
  Q: { confident: '납득이 돼야', flexible: '왜 좋은지' },
  Z: { confident: '팩트', flexible: '뭘 케어해야' },
  M: { confident: '다정한 위로', flexible: '가벼운 칭찬이나 다정한 격려' },
};
// 각 성향 카드의 메인 색상(축 왼쪽 글자 기준)
export const TENDENCY_HEX = { A: '#FF6B6B', C: '#4ECDC4', D: '#60A5FA', Z: '#A78BFA' };

// BMTI 유형별 정보
export const BMTI_INFO = {
  'ACDM': { kr: '활동적 집중 실전 공감형', catchphrase: '몸으로 부딪히며 배우고,\n응원받을 때 더 힘내는 사람', bestMatch: 'OLQZ', diffTempo: 'OLQM', color: '#FF6B6B', bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)' },
  'ACDZ': { kr: '활동적 집중 실전 팩트형', catchphrase: '말보다 행동이 앞서고,\n핵심만 딱 원하는 사람', bestMatch: 'OCDM', diffTempo: 'ALQM', color: '#4ECDC4', bgGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)' },
  'ACQM': { kr: '활동적 집중 탐구 공감형', catchphrase: '궁금하면 바로 파고들고,\n마음까지 챙기는 사람', bestMatch: 'OLDZ', diffTempo: 'OLDM', color: '#A78BFA', bgGradient: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)' },
  'ACQZ': { kr: '활동적 집중 탐구 팩트형', catchphrase: '이유를 확실히 알아야\n움직이는 사람', bestMatch: 'OLQZ', diffTempo: 'ALDM', color: '#60A5FA', bgGradient: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)' },
  'ALDM': { kr: '활동적 전신 실전 공감형', catchphrase: '온몸으로 부딪히고,\n함께라서 더 신나는 사람', bestMatch: 'OCQZ', diffTempo: 'OCQM', color: '#F472B6', bgGradient: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)' },
  'ALDZ': { kr: '활동적 전신 실전 팩트형', catchphrase: '재지 않고 몸부터 움직이는\n시원시원한 사람', bestMatch: 'OLDZ', diffTempo: 'OCQM', color: '#34D399', bgGradient: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
  'ALQM': { kr: '활동적 전신 탐구 공감형', catchphrase: '궁금한 것도 정도 많은,\n다정한 탐구가 같은 사람', bestMatch: 'OLQZ', diffTempo: 'ACDM', color: '#FBBF24', bgGradient: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' },
  'ALQZ': { kr: '활동적 전신 탐구 팩트형', catchphrase: '원리와 숫자로\n내 몸을 이해하는 사람', bestMatch: 'OCQM', diffTempo: 'ACQZ', color: '#818CF8', bgGradient: 'linear-gradient(135deg, #818CF8 0%, #6366F1 100%)' },
  'OCDM': { kr: '안정적 집중 실전 공감형', catchphrase: '차분하지만 확실하게,\n마음까지 챙기는 사람', bestMatch: 'ACDM', diffTempo: 'ALQZ', color: '#FB923C', bgGradient: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' },
  'OCDZ': { kr: '안정적 집중 실전 팩트형', catchphrase: '군더더기 없이\n필요한 것만 딱 하는 사람', bestMatch: 'OLDZ', diffTempo: 'ACQM', color: '#2DD4BF', bgGradient: 'linear-gradient(135deg, #2DD4BF 0%, #14B8A6 100%)' },
  'OCQM': { kr: '안정적 집중 탐구 공감형', catchphrase: '꼼꼼히 알아보고\n다정하게 다가가는 사람', bestMatch: 'ACDM', diffTempo: 'ALDZ', color: '#E879F9', bgGradient: 'linear-gradient(135deg, #E879F9 0%, #C026D3 100%)' },
  'OCQZ': { kr: '안정적 집중 탐구 팩트형', catchphrase: '원리를 이해해야\n마음이 놓이는 사람', bestMatch: 'ACQZ', diffTempo: 'ALDM', color: '#38BDF8', bgGradient: 'linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)' },
  'OLDM': { kr: '안정적 전신 실전 공감형', catchphrase: '편안한 분위기에서\n다 같이 움직이는 게 좋은 사람', bestMatch: 'ALDM', diffTempo: 'ACQZ', color: '#FB7185', bgGradient: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)' },
  'OLDZ': { kr: '안정적 전신 실전 팩트형', catchphrase: '무리 없이 꾸준한 게\n제일 잘 맞는 사람', bestMatch: 'ALDZ', diffTempo: 'ACQM', color: '#4ADE80', bgGradient: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)' },
  'OLQM': { kr: '안정적 전신 탐구 공감형', catchphrase: '천천히, 하지만 확실하게\n마음을 담아 움직이는 사람', bestMatch: 'ALQM', diffTempo: 'ACDZ', color: '#F9A8D4', bgGradient: 'linear-gradient(135deg, #F9A8D4 0%, #EC4899 100%)' },
  'OLQZ': { kr: '안정적 전신 탐구 팩트형', catchphrase: '정확한 균형을 찾을 때\n마음이 편한 사람', bestMatch: 'ALQZ', diffTempo: 'ACDM', color: '#67E8F9', bgGradient: 'linear-gradient(135deg, #67E8F9 0%, #06B6D4 100%)' },
};
