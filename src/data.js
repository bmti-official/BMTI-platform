// 20 Questions for BMTI Test (Part 1)
export const QUESTIONS = [
  { text: "스트레스를 받으면 밖으로 나가\n몸이라도 움직여야 직성이 풀린다.", emoji: "🏃🏻🏃🏻‍♀️" }, // Q1 (A)
  { text: "아무 소리도 안 들리는\n고요한 공간에 있을 때 가장 평온하다.", emoji: "🎧🧘🏻" }, // Q2 (O)
  { text: "가만히 누워만 있는 휴식은\n오히려 몸을 더 찌뿌둥하게 만든다.", emoji: "🛌🏻🌀" }, // Q3 (A)
  { text: "사람이 많고 복잡한 환경에 노출되면\n에너지가 급격히 떨어진다.", emoji: "🏙️🔋" }, // Q4 (O)
  { text: "땀을 가볍게라도 흘리고 났을 때\n진짜 잘 쉬었다는 느낌이 든다.", emoji: "💦✨" }, // Q5 (A)
  { text: "어딘가 뻐근하면 딱 그 아픈 부위만\n집중적으로 주무르게 된다.", emoji: "🤛🏻🤕" }, // Q6 (C)
  { text: "거울을 볼 때 특정 부위보다\n전신의 비율과 대칭을 먼저 살핀다.", emoji: "🪞📏" }, // Q7 (L)
  { text: "특정 근육 딱 한 곳에만\n힘을 집중하는 느낌을 비교적 잘 안다.", emoji: "💪🏻🎯" }, // Q8 (C)
  { text: "목이 아프면 골반이나 발목도\n틀어졌을 것 같아 찝찝하고 신경 쓰인다.", emoji: "🦴🔗" }, // Q9 (L)
  { text: "뭉친 곳을 콕 집어\n직접적으로 타격해 주는 직관적인 관리가 좋다.", emoji: "🔨💆🏻" }, // Q10 (C)
  { text: "새로운 물건을 사면 설명서를 읽기보다\n일단 조작해 보며 익힌다.", emoji: "🕹️🛠️" }, // Q11 (D)
  { text: "누군가의 지시를 따를 때\n\"이걸 왜 해야 하는지\" 납득하는 것이 중요하다.", emoji: "🤔💡" }, // Q12 (Q)
  { text: "길고 복잡한 설명보다\n내가 직접 한 번 부딪혀보는 것이 훨씬 빠르다.", emoji: "🔥🚀" }, // Q13 (D)
  { text: "행동으로 옮기기 전 머릿속으로\n전체 과정을 미리 그려봐야 안심이 된다.", emoji: "🧠🗺️" }, // Q14 (Q)
  { text: "시작부터 완벽할 필요 없이,\n일단 하면서 감을 잡고 수정해 나가는 편이다.", emoji: "📈🔧" }, // Q15 (D)
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
  lounge: [
    { id: 1, title: "오늘 BMTI 결과 나왔는데 너무 정확하네요!", author: "운동러버", date: "10분 전" },
    { id: 2, title: "식단 공유방 만드실 분 계신가요?", author: "다이어터", date: "1시간 전" },
    { id: 3, title: "곰형 체질이신 분들 운동 루틴 추천해주세요.", author: "튼튼이", date: "3시간 전" }
  ],
  challenge: [
    { id: 1, title: "[모집] 매일 만보 걷기 30일 챌린지", author: "운영자", date: "오늘" },
    { id: 2, title: "물 2L 마시기 1주차 인증합니다 💧", author: "수분촉촉", date: "어제" },
    { id: 3, title: "바른 자세 유지 챌린지 - 데스크 워커 모여라", author: "척추요정", date: "2일 전" }
  ],
  qna: [
    { id: 1, title: "Q. BMTI 검사는 얼마나 자주 하는게 좋나요?", author: "궁금해요", date: "오늘" },
    { id: 2, title: "Q. 결과에 맞지 않는 운동을 하면 안되나요?", author: "초보자", date: "어제" },
    { id: 3, title: "Q. 식단과 운동 중 어느 것이 체형에 더 영향을 미치나요?", author: "질문봇", date: "3일 전" }
  ]
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
