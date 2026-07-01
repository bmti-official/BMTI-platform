import re

with open('src/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement1 = """const WEIGHTS = {
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
    // 양수면 왼쪽(left), 음수면 오른쪽(right), 0이면 기본적으로 왼쪽
    return sum >= 0 ? axis.leftLetter : axis.rightLetter;
  }).join('');
}"""

content = re.sub(r'const AXES = \[[\s\S]*?export function calculateAxisCode\(answers\) \{[\s\S]*?\}', replacement1, content)

replacement2 = """export function calculateBMTIPercentages(answers) {
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
}"""

content = re.sub(r'export function calculateBMTIPercentages\(answers\) \{[\s\S]*?\}', replacement2, content)

with open('src/data.js', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated data.js')
