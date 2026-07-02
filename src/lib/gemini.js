/* eslint-disable */
/**
 * Gemini API 유틸리티 (fetch 기반, SDK 불필요)
 * Gemini 3 Flash REST API를 직접 호출합니다.
 */

const GEMINI_API_KEY = 'AQ.Ab8RN6I-56RjSyoiDYaJJeortWMuupwrLJV2l1hszct3LBOPOw';
const GEMINI_MODEL = 'gemini-2.0-flash'; // 무료 키에서 사용 가능한 모델
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

import { BMTI_RESULTS } from '../bmti_results';
import { BMTI_INFO } from '../data';

/**
 * BMTI 캐릭터 이름 매핑 (bmti_results.js의 nickname 필드에서 추출)
 */
export const CHARACTER_NAMES = {
  'ACDZ': '단단한 케틀벨',
  'ACDM': '복근 슬라이더',
  'ACQZ': '아령(알려)줘요',
  'ACQM': '수다쟁이 루프밴드',
  'ALDZ': '팩트폭행 짐볼',
  'ALDM': '뜨끈뜨끈 보수볼',
  'ALQZ': '분석가 트레드밀',
  'ALQM': '물음표 운동화',
  'OCDZ': '단호한 땅콩볼',
  'OCDM': '다정한 마사지건',
  'OCQZ': '심리학자 온냉팩',
  'OCQM': '친절한 하트괄사',
  'OLDZ': '실용주의 요가링',
  'OLDM': '포근포근 운동매트',
  'OLQZ': '깐깐한 거꾸리',
  'OLQM': '키다리 폼롤러',
};

/**
 * BMTI 축 특성에 따른 말투 스타일 결정
 */
function getSpeechStyle(axisCode) {
  const isZ = axisCode.includes('Z');
  const isM = axisCode.includes('M');
  
  if (isZ) {
    return '팩트 중심으로 직설적이고 단호하게 말해. 위로보다는 객관적 지적과 솔루션을 우선해. 반말을 쓰되 차갑지만 속은 따뜻한 선배처럼 말해.';
  } else if (isM) {
    return '다정하고 따뜻하게 공감하면서 말해. 먼저 감정을 알아주고, 부드러운 격려와 함께 조언해. 반말을 쓰되 친한 친구처럼 포근하게 말해.';
  }
  return '균형 잡힌 톤으로 객관적이면서도 공감하는 말투로 대화해.';
}

/**
 * 시간대별 컨텍스트 생성
 */
function getTimeContext() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return '아침 기상 시간대 (모닝 루틴, 기상 후 몸 상태 점검)';
  if (hour >= 10 && hour < 12) return '오전 시간대 (업무/공부 중 뻐근함, 점심 전 가벼운 스트레칭)';
  if (hour >= 12 && hour < 14) return '점심 시간대 (식후 나른함, 가벼운 산책 유도)';
  if (hour >= 14 && hour < 17) return '오후 시간대 (오후 졸음, 집중력 저하, 자세 교정)';
  if (hour >= 17 && hour < 20) return '저녁 시간대 (퇴근 후, 운동 동기부여, 하루 마무리 운동)';
  if (hour >= 20 && hour < 23) return '늦은 저녁 시간대 (하루 마무리 스트레칭, 수면 준비, 이완)';
  return '새벽 시간대 (수면 유도, 내일을 위한 충전)';
}

/**
 * 1:1 채팅용 시스템 프롬프트 생성
 */
export function buildSystemPrompt(axisCode, userInfo, memoryContext = [], healthRecords = []) {
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 캐릭터';
  const bmtiInfo = BMTI_INFO[axisCode];
  const bmtiResult = BMTI_RESULTS[axisCode];
  const speechStyle = getSpeechStyle(axisCode);
  const timeContext = getTimeContext();
  
  let prompt = `너는 나를 대변하는 BMTI 캐릭터 '${charName}'이야. BMTI 유형: ${axisCode} (${bmtiInfo?.kr || ''})
캐치프레이즈: ${bmtiInfo?.catchphrase || ''}

[너의 성격과 말투]
${speechStyle}
답변은 반드시 1~3문장으로 짧고 강렬하게 해. 절대 길게 쓰지 마.
이모지를 적절히 사용해. 대화가 자연스럽게 이어지도록 질문이나 제안으로 마무리해.
운동, 몸 상태, 멘탈 관리, 스트레칭, 자세 교정에 대한 전문 지식을 갖고 있어.

[현재 시간대]
${timeContext}

[이용자 기본 정보]`;

  if (userInfo) {
    prompt += `
- 연령대: ${userInfo.kakaoAge || '미입력'}
- 성별: ${userInfo.kakaoGender || '미입력'}
- 신체: ${userInfo.height || '?'}cm / ${userInfo.weight || '?'}kg
- 운동 빈도: ${userInfo.frequency || '미입력'}
- 운동 목적: ${(userInfo.goals || []).join(', ') || '미입력'}`;
  }

  if (memoryContext && memoryContext.length > 0) {
    prompt += `\n\n[이전 기억 (최근 대화 요약)]`;
    memoryContext.forEach((mem, i) => {
      prompt += `\n${i + 1}. [${mem.chat_date}] ${mem.summary}`;
    });
    prompt += `\n위 기억을 참고하여 이용자의 상태 변화를 인지하고, 자연스럽게 이전 내용을 언급하며 대화해.`;
  }

  if (healthRecords && healthRecords.length > 0) {
    prompt += `\n\n[최근 건강 기록 (사용자가 예전에 말한 내용)]\n`;
    healthRecords.forEach((record, i) => {
      prompt += `${i + 1}. [${record.categoryLabel}] ${record.summary}\n`;
    });
    prompt += `\n위 건강 기록을 참고하여 자연스럽게 대화해.
[건강 기록 활용 규칙]
1. 매번 억지로 꺼내지 말고, 대화 흐름상 자연스러울 때나 먼저 안부를 물을 때만 사용해.
2. 유저가 말한 사실만 언급하고 ("~라고 했었잖아"), 절대 의사처럼 진단하거나 평가하지 마 ("수면 장애가 있네요" 등 절대 금지).
3. 건강 기록을 참고해서 답변을 작성했다면, 답변 내용 맨 끝에 반드시 <ref category="category_id"/> 태그를 붙여줘. (예: ...그건 좀 괜찮아졌어? <ref category="sleep"/>)`;
  }

  return prompt;
}

/**
 * 단톡방 @BMTI 호출용 시스템 프롬프트
 */
export function buildGroupPrompt(callerAxisCode, otherCharacters, recentMessages) {
  const callerName = CHARACTER_NAMES[callerAxisCode] || 'BMTI 캐릭터';
  const callerInfo = BMTI_INFO[callerAxisCode];
  
  const otherChars = otherCharacters.map(code => {
    const name = CHARACTER_NAMES[code] || code;
    const info = BMTI_INFO[code];
    return `- ${name} (${code}): ${info?.kr || ''} — ${info?.catchphrase || ''}`;
  }).join('\n');

  const recentChat = recentMessages.slice(-10).map(m => 
    `[${m.senderName}]: ${m.content}`
  ).join('\n');

  return `단톡방에서 @BMTI가 호출되었어. 아래 최근 대화를 파악하고, 3명의 BMTI 캐릭터가 각각 대화에 참여해야 해.

[호출한 사람의 BMTI 캐릭터]
- ${callerName} (${callerAxisCode}): ${callerInfo?.kr || ''} 

[다른 참여 캐릭터들]
${otherChars}

[최근 대화]
${recentChat}

[규칙]
1. ${callerName}이 먼저 호출한 사람의 입장에서 응답해.
2. 나머지 2 캐릭터 중 하나는 동조하는 의견을, 다른 하나는 반대(또는 다른 시각의) 의견을 내.
3. 각 캐릭터의 성격과 말투를 유지해. Z 캐릭터는 팩트형, M 캐릭터는 공감형.
4. 각 캐릭터의 답변은 1~2문장으로 짧게.
5. JSON 형식으로 응답해:
[
  {"character": "${callerAxisCode}", "name": "${callerName}", "message": "..."},
  {"character": "CODE", "name": "이름", "message": "..."},
  {"character": "CODE", "name": "이름", "message": "..."}
]`;
}

/**
 * 시간대별 예약 메시지 프롬프트
 */
export function buildScheduledPrompt(axisCode, timeSlot, userInfo, memoryContext = []) {
  const charName = CHARACTER_NAMES[axisCode] || 'BMTI 캐릭터';
  const speechStyle = getSpeechStyle(axisCode);
  
  const slotDescriptions = {
    morning: '아침 기상 시간이야. 오늘 하루를 시작하는 격려/점검 메시지를 보내줘.',
    lunch: '점심 시간이야. 오전의 피로를 풀고 오후를 준비하는 가벼운 조언을 해줘.',
    dinner: '저녁 시간이야. 하루를 마무리하며 운동이나 스트레칭을 권유해줘.',
    late_evening: '늦은 저녁이야. 하루를 돌아보며 내일을 준비하는 이완/수면 유도 메시지를 보내줘.',
  };

  let prompt = `너는 나를 대변하는 BMTI 캐릭터 '${charName}'이야. ${speechStyle}
현재: ${slotDescriptions[timeSlot] || ''}
이용자에게 자기점검 미션을 하나 제시해줘. (예: "5분 스트레칭 해볼까?", "오늘 물 8잔 마셨어?")
답변은 2~3문장으로 짧게. 미션은 구체적이고 실현 가능하게.`;

  if (memoryContext && memoryContext.length > 0) {
    prompt += `\n\n[이전 기억] `;
    memoryContext.forEach((mem, i) => {
      prompt += `${mem.summary} / `;
    });
  }

  return prompt;
}

/**
 * 대화 요약 생성 프롬프트
 */
export function buildSummaryPrompt(messages) {
  const chatLog = messages.map(m => 
    `[${m.sender === 'user' ? '이용자' : 'AI'}]: ${m.content}`
  ).join('\n');

  return `아래는 오늘의 1:1 대화 기록이야. 이용자의 몸 상태, 운동 루틴, 컨디션, 감정 상태를 중심으로 2~3줄로 요약해줘.
요약 형식: "날짜 없이, 핵심만 간결하게"

[오늘의 대화]
${chatLog}

[요약]`;
}

/**
 * Gemini API 호출 (fetch 기반)
 */
export async function callGemini(systemPrompt, userMessage, conversationHistory = []) {
  const contents = [];
  
  // 대화 히스토리 추가
  if (conversationHistory.length > 0) {
    conversationHistory.forEach(msg => {
      contents.push({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });
  }
  
  // 현재 사용자 메시지
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 300,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API error:', response.status, errorData);
      
      if (response.status === 429) {
        return { text: '⏳ 잠시 후 다시 시도해주세요. (API 요청 한도 초과)', error: true };
      }
      return { text: '⚠️ AI 응답을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.', error: true };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { text: '🤔 응답을 생성하지 못했습니다. 다시 말씀해주세요!', error: true };
    }

    // 대략적인 토큰 사용량 추정 (실제는 API 응답의 usageMetadata 참고)
    const inputTokens = data?.usageMetadata?.promptTokenCount || 0;
    const outputTokens = data?.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = inputTokens + outputTokens;

    return { text, error: false, tokensUsed: totalTokens || 500 };
  } catch (err) {
    console.error('Gemini fetch error:', err);
    return { text: '🌐 네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.', error: true };
  }
}

/**
 * 1:1 대화 AI 응답 생성
 */
export async function generateChatResponse(axisCode, userInfo, memoryContext, userMessage, conversationHistory, healthRecords = []) {
  const systemPrompt = buildSystemPrompt(axisCode, userInfo, memoryContext, healthRecords);
  return callGemini(systemPrompt, userMessage, conversationHistory);
}

/**
 * 대화 요약 생성
 */
export async function generateChatSummary(messages) {
  const prompt = buildSummaryPrompt(messages);
  return callGemini('너는 대화 요약 전문가야. 짧고 핵심적으로 요약해.', prompt, []);
}

/**
 * 시간대별 예약 메시지 생성
 */
export async function generateScheduledMessage(axisCode, timeSlot, userInfo, memoryContext) {
  const prompt = buildScheduledPrompt(axisCode, timeSlot, userInfo, memoryContext);
  return callGemini(prompt, `${timeSlot} 시간대에 맞는 메시지를 생성해줘.`, []);
}

/**
 * 단톡방 @BMTI 응답 생성
 */
export async function generateGroupResponse(callerAxisCode, otherCharacters, recentMessages) {
  const prompt = buildGroupPrompt(callerAxisCode, otherCharacters, recentMessages);
  const result = await callGemini(prompt, '@BMTI 호출에 대한 응답을 JSON으로 생성해줘.', []);
  
  if (result.error) return { responses: [], error: true, text: result.text };
  
  try {
    // JSON 파싱 시도
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const responses = JSON.parse(jsonMatch[0]);
      return { responses, error: false, tokensUsed: result.tokensUsed };
    }
  } catch (e) {
    console.error('Failed to parse group response JSON:', e);
  }
  
  // JSON 파싱 실패 시 단일 응답으로 반환
  return { 
    responses: [{ character: callerAxisCode, name: CHARACTER_NAMES[callerAxisCode], message: result.text }],
    error: false,
    tokensUsed: result.tokensUsed
  };
}

/**
 * 가벼운 1차 판별 (비용 절감 목적)
 * 건강/위기 관련 키워드가 포함되어 있는지 정규식/키워드로 빠르게 검사합니다.
 */
export function isHealthOrCrisisRelated(text) {
  const keywords = [
    // 위기
    '죽', '자살', '우울', '사라지', '그만두', '끝내', '포기', '살기', '자해',
    // 수면
    '잠', '수면', '피곤', '피로', '졸려', '불면', '새벽', '밤새',
    // 식습관
    '밥', '식사', '야식', '폭식', '다이어트', '살', '체중', '입맛', '먹', '굶', '간식', '식단',
    // 증상/컨디션
    '아파', '아프', '병원', '약', '두통', '머리', '소화', '생리', '숨차', '컨디션', '몸', '감기', '열', '기침', '어지러',
    // 운동
    '운동', '헬스', '러닝', '걷기', '뛰기', '근육', '체력', '땀', '스트레칭',
    // 멘탈
    '스트레스', '짜증', '불안', '무기력', '답답', '힘들', '지쳐', '지치', '번아웃', '눈물', '울고'
  ];
  return keywords.some(kw => text.includes(kw));
}

/**
 * 건강 기록 자동 감지 분류기
 */
export async function analyzeHealthRecord(userMessage, conversationHistory) {
  const prompt = `사용자의 최신 발화에서 건강 관련 정보를 분석해 JSON 배열 형식으로 반환해.
[카테고리] 'diet'(식습관), 'sleep'(수면), 'exercise'(운동), 'mental'(정서), 'symptom'(증상), 'none'(관련없음), 'crisis'(위기 신호)

[처리 규칙]
1. 다중 태깅: 최대 2개의 관련 카테고리를 잡아내 배열로 반환. 인과관계(예: 스트레스로 폭식)가 있으면 원인과 결과 2개 카테고리를 모두 반환.
2. 위기 신호: "다 그만두고 싶어", "사라지고 싶다" 등 극단적 우울/자해 등 안전 위기가 감지되면 반드시 [{"category": "crisis", "summary": "내용"}] 1개만 반환. (가장 최우선 규칙)
3. 잡담/모호함: 건강과 무관하거나 정도가 미미하면 [{"category": "none", "summary": ""}] 반환.
4. 과거형/부정형: "예전엔 불면증 있었는데 요즘은 괜찮아"처럼 현재 문제가 아니면 "none" 반환.
5. 오직 JSON 배열 형식만 출력할 것. 다른 텍스트는 절대 포함하지 마.

[응답 포맷 예시]
[
  { "category": "mental", "summary": "최근 회사 업무로 스트레스 누적" },
  { "category": "diet", "summary": "스트레스로 인한 폭식 경향" }
]`;

  const result = await callGemini(prompt, userMessage, conversationHistory.slice(-3));
  
  if (result.error) return [];

  try {
    const jsonStr = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item.category && item.category !== 'none').slice(0, 2);
    }
    return [];
  } catch (e) {
    console.error('Failed to parse health record JSON:', e);
    return [];
  }
}
