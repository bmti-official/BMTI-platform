// 20 Questions for BMTI Test (Part 1)
export const QUESTIONS = [
  { text: "스트레스를 받으면 밖으로 나가\n몸이라도 움직여야 직성이 풀린다.", emoji: "🏃🏻🏃🏻‍♀️" }, // Q1 (A)
  { text: "아무 소리도 안 들리는 고요한 공간에 있을 때\n가장 평온하다.", emoji: "🎧🧘🏻" }, // Q2 (O)
  { text: "가만히 누워만 있는 휴식은\n오히려 몸을 더 찌뿌둥하게 만든다.", emoji: "🛌🏻🌀" }, // Q3 (A)
  { text: "사람이 많고 복잡한 환경에 노출되면\n에너지가 급격히 떨어진다.", emoji: "🏙️🔋" }, // Q4 (O)
  { prefix: "몸에 뻐근한 곳이 생기면,", text: "다른 곳보다 딱 아픈 그 부위를\n집중적으로 누르거나 풀어야 직성이 풀린다.", emoji: "🤛🏻🤕" }, // Q5 (C)
  { prefix: "무릎이 아프면 발의 아치나 엉덩이 근육 운동까지 찾아보진 않고,", text: "무릎 주변 근육만\n운동 또는 이완 방법을 찾아본다.", emoji: "💪🏻🎯" }, // Q6 (C)
  { prefix: "목이나 어깨가 아프면,", text: "'혹시 골반이나 발목 등 다른 곳이 틀어져서\n여기까지 아픈 건 아닐까?' 하고\n몸을 연결 지어 생각하게 된다.", emoji: "🦴🔗" }, // Q7 (L)
  { prefix: "마사지나 관리를 받을 때,", text: "전신을 훑어주는 것보다 뻐근하게 느끼는 그 타겟 부위만\n집중적으로 파고들어 풀어주는 것이 좋다.", emoji: "🔨💆🏻" }, // Q8 (C)
  { text: "누군가의 지시를 따를 때\n\"이걸 왜 해야 하는지\" 납득하는 것이 중요하다.", emoji: "🤔💡" }, // Q9 (Q)
  { text: "길고 복잡한 설명보다\n내가 직접 한 번 부딪혀보는 것이 훨씬 빠르다.", emoji: "🔥🚀" }, // Q10 (D)
  { text: "행동으로 옮기기 전\n머릿속으로 전체 과정을 미리 그려봐야 안심이 된다.", emoji: "🧠🗺️" }, // Q11 (Q)
  { prefix: "운동 동작이 엉성해도 스트레스받지 않고,", text: "'하다 보면 몸에 익겠지' 하고\n일단 횟수를 채우는 편이다.", emoji: "📈🔧" }, // Q12 (D)
  { text: "위로의 말보다 구체적인 수치와\n명확한 해결책을 제시받을 때 마음이 놓인다.", emoji: "📊✅" }, // Q13 (Z)
  { text: "빙빙 돌리지 않고 팩트만 단호하게\n말해주는 사람에게 더 큰 신뢰를 느낀다.", emoji: "🗡️💯" }, // Q14 (Z)
  { text: "아무리 맞는 말이라도 말투가\n차가우면 마음의 문이 먼저 닫힌다.", emoji: "🧊🚪" }, // Q15 (M)
  { text: "누군가에게 조언을 구할 때,\n다정한 공감보다 냉정하고 객관적인 평가를 원한다.", emoji: "⚖️🔍" } // Q16 (Z)
].map((q, idx) => ({ ...q, id: idx + 1 }));

// Part 2: State Indicator Question
export const PART2_QUESTION = "현재 나의 몸 상태를 가장 잘 표현하는 것은?";

export const PART2_OPTIONS = [
  { id: 1, label: "에너지 바닥 / 휴식이 필요한 상태", suffix: "Th", emoji: "🔋" },
  { id: 2, label: "국소적 뻐근함 / 순환이 필요한 상태", suffix: "Tl", emoji: "🔄" },
  { id: 3, label: "안정적 밸런스 유지 중", suffix: "Fp", emoji: "⚖️" },
  { id: 4, label: "정렬 내재화 / 신경근 제어 단계", suffix: "Fp", emoji: "🧬" },
  { id: 5, label: "기능 향상 / 한계 돌파 단계", suffix: "Fb", emoji: "🚀" },
];

// ===================================================================
// BMTI Scoring Logic
// ===================================================================

/**
 * 4축 코드 매핑
 * 각 축은 두 선택지 그룹으로 나뉘며, 문항 번호는 1-indexed (Q1 = index 0)
 */
const WEIGHTS = {
  LEFT_CORE: { 4: 5, 3: 2, 2: -1, 1: -3 },
  LEFT_NORMAL: { 4: 3, 3: 1, 2: -1, 1: -2 },
  RIGHT_CORE: { 4: -5, 3: -2, 2: 1, 1: 3 },
  RIGHT_NORMAL: { 4: -3, 3: -1, 2: 1, 1: 2 },
};

const AXES_CONFIG = [
  {
    leftLetter: 'A', rightLetter: 'O',
    min: -13, max: 13,
    questions: [
      { id: 1, type: 'LEFT_CORE' },
      { id: 3, type: 'LEFT_NORMAL' },
      { id: 2, type: 'RIGHT_CORE' },
      { id: 4, type: 'RIGHT_NORMAL' },
    ]
  },
  {
    leftLetter: 'C', rightLetter: 'L',
    min: -12, max: 14,
    questions: [
      { id: 5, type: 'LEFT_CORE' },
      { id: 6, type: 'LEFT_NORMAL' },
      { id: 8, type: 'LEFT_NORMAL' },
      { id: 7, type: 'RIGHT_CORE' },
    ]
  },
  {
    leftLetter: 'D', rightLetter: 'Q',
    min: -13, max: 13,
    questions: [
      { id: 10, type: 'LEFT_CORE' },
      { id: 12, type: 'LEFT_NORMAL' },
      { id: 9, type: 'RIGHT_CORE' },
      { id: 11, type: 'RIGHT_NORMAL' },
    ]
  },
  {
    leftLetter: 'Z', rightLetter: 'M',
    min: -12, max: 14,
    questions: [
      { id: 14, type: 'LEFT_CORE' },
      { id: 13, type: 'LEFT_NORMAL' },
      { id: 16, type: 'LEFT_NORMAL' },
      { id: 15, type: 'RIGHT_CORE' },
    ]
  }
];

function calculateWeightedSum(answers, questions) {
  let sum = 0;
  questions.forEach(q => {
    const val = answers[q.id - 1]; // 1-indexed to 0-indexed
    if (val && WEIGHTS[q.type][val] !== undefined) {
      sum += WEIGHTS[q.type][val];
    }
  });
  return sum;
}

export function calculateAxisCode(answers) {
  return AXES_CONFIG.map(axis => {
    const sum = calculateWeightedSum(answers, axis.questions);
    // min/max가 대칭이 아닌 축(C/L, Z/M)은 0이 아니라 (min+max)/2가 실제 50% 지점이다.
    // calculateBMTIPercentages와 동일한 기준을 써야 유형 코드와 퍼센트 표시가 어긋나지 않는다.
    const midpoint = (axis.min + axis.max) / 2;
    return sum >= midpoint ? axis.leftLetter : axis.rightLetter;
  }).join('');
}

/**
 * 최종 BMTI 코드 생성
 * @param {number[]} answers - 20개 응답 배열
 * @returns {string} 최종 코드, 예: "ALDZ"
 */
export function calculateBMTI(answers) {
  return calculateAxisCode(answers);
}

// Mock Board Data
export const BOARD_DATA = {
  vote: {
    question: "곧 맞춤형 50분 운동 플레이리스트 앱이 출시됩니다! 가장 먼저 써보고 싶은 기능은?",
    options: [
      { id: 1, text: "내 유형별 인기 랭킹", votes: 45 },
      { id: 2, text: "원클릭 추천 플레이리스트", votes: 89 },
      { id: 3, text: "친구와 공유기능", votes: 21 }
    ]
  },
  chat: {
    Z: [
      { id: 1, title: "효율적인 50분 운동 루틴 공유합니다.", author: "효율성애자", date: "10분 전" },
      { id: 2, title: "단백질 보충제 가성비 팩트체크", author: "팩트폭격기", date: "1시간 전" },
      { id: 3, title: "BMTI 결과 기반 주 3회 근력운동 플랜", author: "논리왕", date: "3시간 전" }
    ],
    M: [
      { id: 4, title: "오늘도 운동 가기 너무 싫었는데 결국 해냈어요 ㅠㅠ", author: "따뜻한맘", date: "5분 전" },
      { id: 5, title: "다이어트 정체기인데 너무 우울하네요...", author: "위로가필요해", date: "2시간 전" },
      { id: 6, title: "같이 런닝하실 분 구해요! 초보자 대환영!", author: "다같이화이팅", date: "4시간 전" }
    ]
  },
  qna: {
    description: "추후 어플리케이션 제작과 본인 몸상태에 관련한 QnA",
    posts: [
      { id: 1, title: "Q. 앱은 언제쯤 출시되나요?", author: "기대중", date: "오늘" },
      { id: 2, title: "Q. BMTI 결과에 맞지 않는 운동을 하면 몸이 나빠지나요?", author: "초보자", date: "어제" },
      { id: 3, title: "Q. 결과지에 나온 보완 운동만 매일 해도 될까요?", author: "궁금해요", date: "3일 전" }
    ]
  }
};

import imgACDM from './assets/누끼 버전/ACDM 누끼.png';
import imgACDZ from './assets/누끼 버전/ACDZ 누끼.png';
import imgACQM from './assets/누끼 버전/ACQM 누끼.png';
import imgACQZ from './assets/누끼 버전/ACQZ 누끼.png';
import imgALDM from './assets/누끼 버전/ALDM 누끼.png';
import imgALDZ from './assets/누끼 버전/ALDZ 누끼.png';
import imgALQM from './assets/누끼 버전/ALQM 누끼.png';
import imgALQZ from './assets/누끼 버전/ALQZ 누끼.png';
import imgOCDM from './assets/누끼 버전/OCDM 누끼.png';
import imgOCDZ from './assets/누끼 버전/OCDZ 누끼.png';
import imgOCQM from './assets/누끼 버전/OCQM 누끼.png';
import imgOCQZ from './assets/누끼 버전/OCQZ 누끼.png';
import imgOLDM from './assets/누끼 버전/OLDM 누끼.png';
import imgOLDZ from './assets/누끼 버전/OLDZ 누끼.png';
import imgOLQM from './assets/누끼 버전/OLQM 누끼.png';
import imgOLQZ from './assets/누끼 버전/OLQZ 누끼.png';

// Original Images
import origACDM from './assets/원본/ACDM.png';
import origACDZ from './assets/원본/ACDZ.png';
import origACQM from './assets/원본/ACQM.png';
import origACQZ from './assets/원본/ACQZ.jpeg';
import origALDM from './assets/원본/ALDM.png';
import origALDZ from './assets/원본/ALDZ.png';
import origALQM from './assets/원본/ALQM.png';
import origALQZ from './assets/원본/ALQZ.png';
import origOCDM from './assets/원본/OCDM.png';
import origOCDZ from './assets/원본/OCDZ.png';
import origOCQM from './assets/원본/OCQM.png';
import origOCQZ from './assets/원본/OCQZ.PNG';
import origOLDM from './assets/원본/OLDM.png';
import origOLDZ from './assets/원본/OLDZ.png';
import origOLQM from './assets/원본/OLQM.png';
import origOLQZ from './assets/원본/OLQZ.png';

// 16 BMTI Character types
export const CHARACTERS = [
  { id: 'ACDM', image: imgACDM, originalImage: origACDM, color: 'bg-[#f4f4f4]', imgClass: 'scale-[1.25]' },
  { id: 'ACDZ', image: imgACDZ, originalImage: origACDZ, color: 'bg-[#fdf9e6]', imgClass: 'scale-[1.25]' },
  { id: 'ACQM', image: imgACQM, originalImage: origACQM, color: 'bg-[#edf6ed]' },
  { id: 'ACQZ', image: imgACQZ, originalImage: origACQZ, color: 'bg-[#eef4fb]', imgClass: 'scale-[1.25]' },
  { id: 'ALDM', image: imgALDM, originalImage: origALDM, color: 'bg-[#e7f7f9]' },
  { id: 'ALDZ', image: imgALDZ, originalImage: origALDZ, color: 'bg-[#f1f3f5]' },
  { id: 'ALQM', image: imgALQM, originalImage: origALQM, color: 'bg-[#fdf3eb]', imgClass: 'scale-[1.25]' },
  { id: 'ALQZ', image: imgALQZ, originalImage: origALQZ, color: 'bg-[#fff0e6]', imgClass: 'scale-[1.25]' },
  { id: 'OCDM', image: imgOCDM, originalImage: origOCDM, color: 'bg-[#fceef2]' },
  { id: 'OCDZ', image: imgOCDZ, originalImage: origOCDZ, color: 'bg-[#eaf5f0]', imgClass: 'translate-x-3' },
  { id: 'OCQM', image: imgOCQM, originalImage: origOCQM, color: 'bg-[#f5f3ef]' },
  { id: 'OCQZ', image: imgOCQZ, originalImage: origOCQZ, color: 'bg-[#e9ecef]' },
  { id: 'OLDM', image: imgOLDM, originalImage: origOLDM, color: 'bg-[#f4f4f5]' },
  { id: 'OLDZ', image: imgOLDZ, originalImage: origOLDZ, color: 'bg-[#ffeedd]' },
  { id: 'OLQM', image: imgOLQM, originalImage: origOLQM, color: 'bg-[#fdf0f3]' },
  { id: 'OLQZ', image: imgOLQZ, originalImage: origOLQZ, color: 'bg-[#eaf6f6]', imgClass: 'scale-[1.25]' }
];

// BMTI 캐릭터 별명 (짧은 표시용) — ResultView.jsx의 SHORT_NICKNAMES를 정본으로 통합.
// gemini.js와 ResultView.jsx에 각각 살짝 다른 철자로 중복 정의되어 있던 것을 여기로 모음.
export const CHARACTER_NAMES = {
  ACDZ: '단단한 케틀벨', ACDM: '복근 슬라이더', ACQZ: '핵심만 \'아령(알려)\'줘요', ACQM: '수다쟁이 루프밴드',
  ALDZ: '팩트폭행 짐볼', ALDM: '뜨끈뜨끈 보수볼', ALQZ: '분석가 트레드밀', ALQM: '물음표 운동화',
  OCDZ: '저격수 땅콩볼', OCDM: '다정한 마사지건', OCQZ: '심리학자 온냉팩', OCQM: '친절한 하트괄사',
  OLDZ: '실용주의 요가링', OLDM: '포근포근 운동매트', OLQZ: '깐깐한 거꾸리', OLQM: '키다리 폼롤러'
};

// 사람 유저가 BMTI 유형 코드(ACDZ 등) 자체를 닉네임으로 쓰지 못하게 막는 데 씀 —
// 게시판의 AI 페르소나 닉네임이 "AI ACDZ" 형식이라, 코드만 딱 따와서 헷갈리게 하는 걸 방지.
const BMTI_TYPE_CODES = Object.keys(CHARACTER_NAMES);

export function isReservedNickname(nickname) {
  if (!nickname) return false;
  const normalized = nickname.trim().toUpperCase();
  return BMTI_TYPE_CODES.includes(normalized);
}


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
  
  AXES_CONFIG.forEach(axis => {
    const sum = calculateWeightedSum(answers, axis.questions);
    let leftPct = Math.round(((sum - axis.min) / (axis.max - axis.min)) * 100);
    
    // 50%가 최대한 나오지 않게 하기 위해 정확히 50%일 경우 51%로 조정
    if (leftPct === 50) {
      leftPct = 51;
    }
    
    // 범위 초과 방지
    leftPct = Math.max(0, Math.min(100, leftPct));
    
    percentages[axis.leftLetter] = leftPct;
    percentages[axis.rightLetter] = 100 - leftPct;
  });
  
  return percentages;
};

