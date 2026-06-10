// 20 Questions for BMTI Test (Part 1)
export const QUESTIONS = [
  { text: "스트레스를 받으면 밖으로 나가\n몸이라도 움직여야 직성이 풀린다.", emoji: "🏃🏻🏃🏻‍♀️" }, // Q1 (A)
  { text: "아무 소리도 안 들리는\n고요한 공간에 있을 때 가장 평온하다.", emoji: "🎧🧘🏻" }, // Q2 (O)
  { text: "가만히 누워만 있는 휴식은\n오히려 몸을 더 찌뿌둥하게 만든다.", emoji: "🛌🏻🌀" }, // Q3 (A)
  { text: "사람이 많고 복잡한 환경에 노출되면\n에너지가 급격히 떨어진다.", emoji: "🏙️🔋" }, // Q4 (O)
  { text: "땀을 가볍게라도 흘리고 났을 때\n진짜 잘 쉬었다는 느낌이 든다.", emoji: "💦✨" }, // Q5 (A)
  { prefix: "몸에 뻐근한 곳이 생기면,", text: "다른 곳보다 딱 아픈 그 부위를\n집중적으로 누르거나 풀어야 직성이 풀린다.", emoji: "🤛🏻🤕" }, // Q6 (C)
  { prefix: "거울로 내 체형을 볼 때,", text: "'승모근'이나 '뱃살' 같은 특정 부위보다\n좌우 어깨의 높낮이나 전체적인 대칭을 먼저 보는 편이다.", emoji: "🪞📏" }, // Q7 (L)
  { prefix: "운동을 하거나 움직일 때,", text: "다른 곳은 힘을 빼고 내가 원하는 타겟 근육\n딱 한 곳에만 힘을 주는 느낌을 잘 안다.", emoji: "💪🏻🎯" }, // Q8 (C)
  { prefix: "목이나 어깨가 아프면,", text: "'혹시 골반이나 발목 등 다른 곳이 틀어져서 여기까지 아픈 건 아닐까?'\n하고 몸을 연결 지어 생각하게 된다.", emoji: "🦴🔗" }, // Q9 (L)
  { prefix: "마사지나 관리를 받을 때,", text: "전신을 훑어주는 것보다 내가 뻐근하다고 느끼는\n그 타겟 부위만 집중적으로 파고들어 풀어주는 것이 좋다.", emoji: "🔨💆🏻" }, // Q10 (C)
  { text: "새로운 물건을 사면 설명서를 읽기보다\n일단 조작해 보며 익힌다.", emoji: "🕹️🛠️" }, // Q11 (D)
  { text: "누군가의 지시를 따를 때\n\"이걸 왜 해야 하는지\" 납득하는 것이 중요하다.", emoji: "🤔💡" }, // Q12 (Q)
  { text: "길고 복잡한 설명보다\n내가 직접 한 번 부딪혀보는 것이 훨씬 빠르다.", emoji: "🔥🚀" }, // Q13 (D)
  { text: "행동으로 옮기기 전 머릿속으로\n전체 과정을 미리 그려봐야 안심이 된다.", emoji: "🧠🗺️" }, // Q14 (Q)
  { prefix: "운동 동작이 엉성해도 스트레스받지 않고,", text: "'하다 보면 몸에 익겠지' 하고\n일단 횟수를 채우는 편이다.", emoji: "📈🔧" }, // Q15 (D)
  { text: "위로의 말보다 구체적인 수치와\n명확한 해결책을 제시받을 때 마음이 놓인다.", emoji: "📊✅" }, // Q16 (Z)
  { text: "결과를 평가받기 전,\n내가 그동안 노력한 과정을 먼저 인정받고 싶다.", emoji: "🌱👏🏻" }, // Q17 (M)
  { text: "빙빙 돌리지 않고 팩트만\n단호하게 말해주는 사람에게 더 큰 신뢰를 느낀다.", emoji: "🗡️💯" }, // Q18 (Z)
  { text: "아무리 맞는 말이라도\n말투가 차가우면 마음의 문이 먼저 닫힌다.", emoji: "🧊🚪" }, // Q19 (M)
  { text: "누군가에게 조언을 구할 때,\n다정한 공감보다 냉정하고 객관적인 평가를 원한다.", emoji: "⚖️🔍" } // Q20 (Z)
];

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
const AXES = [
  {
    // 제1축: A vs O
    left:  { letter: 'A', questions: [1, 3, 5] },   // 3문항
    right: { letter: 'O', questions: [2, 4] },       // 2문항
  },
  {
    // 제2축: C vs L
    left:  { letter: 'C', questions: [6, 8, 10] },   // 3문항
    right: { letter: 'L', questions: [7, 9] },        // 2문항
  },
  {
    // 제3축: D vs Q
    left:  { letter: 'D', questions: [11, 13, 15] },  // 3문항
    right: { letter: 'Q', questions: [12, 14] },       // 2문항
  },
  {
    // 제4축: Z vs M
    left:  { letter: 'Z', questions: [16, 18, 20] },  // 3문항
    right: { letter: 'M', questions: [17, 19] },       // 2문항
  },
];

/**
 * 문항 점수 배열(1-indexed answers)에서 평균을 계산
 * @param {number[]} answers - 20개 응답 (index 0 = Q1), 값: 1~4
 * @param {number[]} questionNumbers - 1-indexed 문항 번호들
 * @returns {number} 평균값
 */
function calcAverage(answers, questionNumbers) {
  const sum = questionNumbers.reduce((acc, qNum) => acc + (answers[qNum - 1] || 0), 0);
  return sum / questionNumbers.length;
}

/**
 * BMTI 4축 코드 생성
 * @param {number[]} answers - 20개 응답 배열 (index 0 = Q1)
 * @returns {string} 4자리 코드, 예: "ALDZ"
 */
export function calculateAxisCode(answers) {
  return AXES.map(axis => {
    const leftAvg = calcAverage(answers, axis.left.questions);
    const rightAvg = calcAverage(answers, axis.right.questions);
    // 동점 시 왼쪽(left) 알파벳 우선
    return leftAvg >= rightAvg ? axis.left.letter : axis.right.letter;
  }).join('');
}

/**
 * Part 2 선택지에서 접미사(Suffix) 결정
 * @param {number} choiceId - 선택지 ID (1~5)
 * @returns {string} 접미사, 예: "Tl"
 */
export function getSuffix(choiceId) {
  const option = PART2_OPTIONS.find(o => o.id === choiceId);
  return option ? option.suffix : 'Fp';
}

/**
 * 최종 BMTI 코드 생성
 * @param {number[]} answers - 20개 응답 배열
 * @param {number} part2Choice - Part 2 선택지 ID (1~5)
 * @returns {string} 최종 코드, 예: "ALDZ-Tl"
 */
export function calculateBMTI(answers, part2Choice) {
  const axisCode = calculateAxisCode(answers);
  const suffix = getSuffix(part2Choice);
  return `${axisCode}-${suffix}`;
}

// Mock Board Data
export const BOARD_DATA = {
  vote: {
    question: "곧 맞춤형 50분 운동 플레이리스트 앱이 출시됩니다!\n가장 먼저 써보고 싶은 기능은?",
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
