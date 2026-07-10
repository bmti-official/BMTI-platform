// BMTI 과몰입 게시판 — AI 커뮤니티 활성화 (기능 A: 무플 게시판 오프닝 글 / 기능 B: 무플 게시물 AI 댓글)
//
// pg_cron이 10분마다 이 함수를 호출한다 (net.http_post). 판단 로직은 전부 여기 안에 있고,
// cron 쪽은 단순 호출만 담당한다.
//
// 필수 시크릿 (supabase secrets set으로 등록, 코드에는 절대 넣지 않는다):
//   GEMINI_API_KEY
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY는 Edge Function 런타임이 자동 주입한다.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.110.0';

const GEMINI_MODEL = 'gemini-2.5-flash-lite';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ── 페르소나 ────────────────────────────────────────────────────────────
// data.js의 CHARACTER_NAMES와 같은 원본(ResultView.jsx SHORT_NICKNAMES)에서 가져온 값.
// Deno 환경에선 이미지 asset이 섞인 src/data.js를 그대로 import할 수 없어 여기 따로 둔다.
const Z_PERSONAS = ['ACDZ', 'ACQZ', 'ALDZ', 'ALQZ', 'OCDZ', 'OCQZ', 'OLDZ', 'OLQZ'];
const M_PERSONAS = ['ACDM', 'ACQM', 'ALDM', 'ALQM', 'OCDM', 'OCQM', 'OLDM', 'OLQM'];

// ── 안전 레이어 ──────────────────────────────────────────────────────────
// 주의: 기존 src/lib/gemini.js의 isHealthOrCrisisRelated 목록은 재사용하지 않는다.
// '운동'/'몸'/'피곤'/'스트레스' 같은 이 앱에서 거의 모든 글에 등장하는 단어가 섞여 있어
// 위기 감지용 하드 게이트로 쓰기엔 너무 광범위하다. 아래는 별도로 좁게 만든 목록.
const CRISIS_PHRASES = [
  '자살', '자해', '죽고싶', '죽어버리', '죽을래', '사라지고싶', '그만살고싶',
  '목숨을끊', '극단적선택', '뛰어내리', '살기싫',
];
const MEDICAL_REDFLAG_PHRASES = [
  '갑자기 마비', '저림이 안 없어져', '숨을 못 쉬', '가슴 통증', '심한 두통이',
  '갑자기 안 보여', '실신', '피가 안 멈춰',
];

function normalize(text: string): string {
  return text.replace(/\s+/g, '');
}

function checkSafety(text: string): 'none' | 'medical' | 'crisis' {
  const normalized = normalize(text);
  if (CRISIS_PHRASES.some((p) => normalized.includes(normalize(p)))) return 'crisis';
  if (MEDICAL_REDFLAG_PHRASES.some((p) => normalized.includes(normalize(p)))) return 'medical';
  return 'none';
}

// 생성된 답변이 진단/처방스러운 문구를 담고 있는지 사후 검사 (프롬프트만 믿지 않는다)
const BANNED_OUTPUT_PATTERNS = [
  /병입니다/, /증후군이에요/, /증후군입니다/, /일 가능성이 높아요/,
  /\d+\s*(mg|정|알)\b/i, /처방/, /진단/,
];

function violatesOutputRules(text: string): boolean {
  if (!/[?？]\s*$/.test(text.trim())) return true; // 열린 질문으로 안 끝나면 규칙 위반
  return BANNED_OUTPUT_PATTERNS.some((re) => re.test(text));
}

// ── 톤 ──────────────────────────────────────────────────────────────────
// 기본 톤은 게시판(tab_type) 기준, 글쓴이 BMTI 유형은 강도만 미세조정한다.
function getSpeechStyle(tabType: 'Z' | 'M', authorBmtiCode?: string | null): string {
  const base = tabType === 'Z'
    ? '팩트 중심으로 담백하고 직설적으로 말해. 위로보다는 관찰과 질문을 우선해. 반말을 쓰되 차갑지 않은 선배처럼.'
    : '다정하고 따뜻하게 공감하면서 말해. 먼저 감정을 알아주고 부드럽게 다가가. 반말을 쓰되 친한 친구처럼.';

  if (!authorBmtiCode) return base;
  const authorIsZ = authorBmtiCode.includes('Z');
  const authorIsM = authorBmtiCode.includes('M');
  if (tabType === 'Z' && authorIsM) return `${base} 글쓴이가 평소엔 공감형이니 팩트를 던지되 말투는 한 톤 부드럽게.`;
  if (tabType === 'M' && authorIsZ) return `${base} 글쓴이가 평소엔 팩트형이니 공감하되 말은 담백하게, 과하게 늘어지지 않게.`;
  return base;
}

const SAFETY_RULES = `
[안전 규칙 — 반드시 지켜]
- 진단하지 마 ("~병이에요", "~증후군이네요" 금지). 처방하지 마 (약, 용량, 특정 시술 추천 금지).
- 이 서비스나 특정 상품이 병을 고친다는 식으로 말하지 마.
- 너는 사람이 아니라 BMTI 캐릭터 AI야. 사람인 척하지 마.
- 답이나 해결책을 주지 말고, 관찰이나 공감 한마디 + 열린 질문으로만 마무리해. 반드시 물음표로 끝내.
- 1~2문장으로 짧게.`;

async function callGemini(systemPrompt: string, userMessage: string): Promise<string | null> {
  try {
    const res = await fetch(`${GEMINI_URL}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 150,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    });
    if (!res.ok) {
      console.error('Gemini API error', res.status, await res.text().catch(() => ''));
      return null;
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch (err) {
    console.error('Gemini fetch error', err);
    return null;
  }
}

async function generateBoardReply(tabType: 'Z' | 'M', authorBmtiCode: string | null, postContent: string, safetyTier: 'none' | 'medical'): Promise<string | null> {
  const speechStyle = getSpeechStyle(tabType, authorBmtiCode);
  let extra = '';
  if (safetyTier === 'medical') {
    extra = '\n[주의] 이 글은 급성 증상 신호가 있어. 원인 추정이나 해결책 제시는 절대 하지 말고, "병원/전문가에게 확인해보라"는 담백한 권유 + 공감 질문으로만 마무리해.';
  }
  const systemPrompt = `너는 커뮤니티 게시판에 댓글을 다는 BMTI 캐릭터야.\n[말투]\n${speechStyle}${extra}\n${SAFETY_RULES}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await callGemini(systemPrompt, postContent);
    if (text && !violatesOutputRules(text)) return text.trim();
  }
  return null; // 두 번 다 규칙 위반이면 포기 (억지로 끼워 맞추지 않는다)
}

// ── 기능 B: 무플 게시물에 AI 댓글 1개 ──────────────────────────────────
async function runFeatureB() {
  const { data: candidates, error } = await supabase
    .from('posts')
    .select('id, content, tab_type, user_id, users(bmti_type)')
    .is('ai_comment_added_at', null)
    .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .lte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('featureB candidate query error', error);
    return { processed: 0 };
  }

  let processed = 0;
  for (const post of candidates ?? []) {
    // 이미 댓글이 달렸으면 건너뜀 (사람이 먼저 반응했으면 AI는 안 낀다)
    const { count: commentCount } = await supabase
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', post.id);
    if ((commentCount ?? 0) > 0) {
      await supabase.from('posts').update({ ai_comment_added_at: new Date().toISOString() }).eq('id', post.id).is('ai_comment_added_at', null);
      continue;
    }

    // 원자적 선점 — 이 UPDATE가 행을 반환할 때만 진행 (cron 틱 겹침/중복 방지)
    const { data: claimed } = await supabase
      .from('posts')
      .update({ ai_comment_added_at: new Date().toISOString() })
      .eq('id', post.id)
      .is('ai_comment_added_at', null)
      .select('id');
    if (!claimed || claimed.length === 0) continue;

    const tabType = post.tab_type as 'Z' | 'M';
    const authorBmtiCode = (post.users as { bmti_type?: string } | null)?.bmti_type ?? null;
    const safetyTier = checkSafety(post.content ?? '');

    if (safetyTier === 'crisis') {
      await supabase.from('ai_actions').insert({
        action_type: 'reply_comment', tab_type: tabType, persona_code: 'none',
        post_id: post.id, safety_tier: 'crisis_blocked',
      });
      continue; // Gemini 호출 자체를 하지 않는다
    }

    const personaPool = tabType === 'Z' ? Z_PERSONAS : M_PERSONAS;
    const persona = await pickLeastRecentPersona(personaPool, 'reply_comment', tabType);

    const replyText = await generateBoardReply(tabType, authorBmtiCode, post.content ?? '', safetyTier);
    if (!replyText) continue; // 안전한 답을 못 만들면 그냥 스킵 (억지로 달지 않는다)

    const { data: personaUser } = await supabase.from('users').select('id').eq('bmti_type', persona).eq('is_ai', true).single();
    if (!personaUser) continue;

    const { data: insertedComment } = await supabase
      .from('comments')
      .insert({ post_id: post.id, user_id: personaUser.id, content: replyText })
      .select('id')
      .single();

    await supabase.from('ai_actions').insert({
      action_type: 'reply_comment', tab_type: tabType, persona_code: persona,
      post_id: post.id, comment_id: insertedComment?.id ?? null, safety_tier: safetyTier,
    });
    processed++;
  }
  return { processed };
}

async function pickLeastRecentPersona(pool: string[], actionType: string, tabType: string): Promise<string> {
  const { data: recent } = await supabase
    .from('ai_actions')
    .select('persona_code')
    .eq('action_type', actionType)
    .eq('tab_type', tabType)
    .order('created_at', { ascending: false })
    .limit(pool.length);

  const recentlyUsed = new Set((recent ?? []).map((r) => r.persona_code));
  const unused = pool.filter((p) => !recentlyUsed.has(p));
  if (unused.length > 0) return unused[Math.floor(Math.random() * unused.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── 기능 A: 무플 게시판에 AI 오프닝 글 ──────────────────────────────────
const OPENING_TOPICS: Record<'Z' | 'M', string[]> = {
  Z: [
    '다들 오래 앉을 때 허리 어떻게 관리해요? 저는 30분마다 일어나는데 다른 방법 있어요?',
    '모니터 높이 바꿨더니 목이 편해졌다는 얘기 많던데, 효과 본 분?',
    '운동 전후로 스트레칭 순서 다들 어떻게 하세요?',
    '아침 공복 운동 vs 식후 운동, 다들 뭐가 더 잘 맞아요?',
  ],
  M: [
    '월요일 아침, 몸이 무거운 사람 저뿐인가요…? 다들 어떻게 시동 거세요?',
    '요즘 날씨 탓인지 여기저기 뻐근한데, 다들 괜찮으세요?',
    '오늘 운동 가기 진짜 싫었는데 그래도 다녀온 분 계세요?',
    '컨디션 안 좋은 날엔 다들 어떻게 스스로를 다독여요?',
  ],
};

function quietThresholdHours(humanPosts7d: number): number | null {
  if (humanPosts7d < 10) return 4;
  if (humanPosts7d <= 30) return 8;
  return null; // 활동 많은 탭은 기능 A 비활성
}

async function runFeatureA() {
  // 최근 7일 통계 + "마지막 인간 게시물" 판단에만 쓰므로, 게시판이 커져도 조회 범위를 30일로 고정한다.
  const { data: posts } = await supabase
    .from('posts')
    .select('id, tab_type, created_at, user_id, users(is_ai)')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
  const tabs: Array<'Z' | 'M'> = ['Z', 'M'];
  let created = 0;

  for (const tabType of tabs) {
    const humanPosts = (posts ?? []).filter((p) => p.tab_type === tabType && !(p.users as { is_ai?: boolean } | null)?.is_ai);
    const humanPosts7d = humanPosts.filter((p) => new Date(p.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length;
    const threshold = quietThresholdHours(humanPosts7d);
    if (threshold === null) continue;

    const lastHumanPostAt = humanPosts.length > 0
      ? Math.max(...humanPosts.map((p) => new Date(p.created_at).getTime()))
      : 0;
    const quietFor = Date.now() - lastHumanPostAt;
    if (quietFor < threshold * 60 * 60 * 1000) continue;

    // KST 19:00 (UTC 10:00) 기준으로 하루 상한을 리셋 (매일 오후 7시에 새 오프닝 글 작성 가능)
    const now = new Date();
    const todayStart = new Date(now);
    if (now.getUTCHours() < 10) {
      todayStart.setUTCDate(todayStart.getUTCDate() - 1);
    }
    todayStart.setUTCHours(10, 0, 0, 0);
    const { count: postedToday } = await supabase
      .from('ai_actions')
      .select('id', { count: 'exact', head: true })
      .eq('action_type', 'opening_post')
      .eq('tab_type', tabType)
      .gte('created_at', todayStart.toISOString());
    if ((postedToday ?? 0) >= 1) continue; // 탭당 하루 1건 상한 (MVP)

    const pool = tabType === 'Z' ? Z_PERSONAS : M_PERSONAS;
    const persona = await pickLeastRecentPersona(pool, 'opening_post', tabType);
    const { data: personaUser } = await supabase.from('users').select('id').eq('bmti_type', persona).eq('is_ai', true).single();
    if (!personaUser) continue;

    const { count: topicsUsed } = await supabase
      .from('ai_actions')
      .select('id', { count: 'exact', head: true })
      .eq('action_type', 'opening_post')
      .eq('tab_type', tabType);
    const topicPool = OPENING_TOPICS[tabType];
    const topic = topicPool[(topicsUsed ?? 0) % topicPool.length];

    const { data: insertedPost } = await supabase
      .from('posts')
      .insert({ user_id: personaUser.id, tab_type: tabType, category: '일상', content: topic })
      .select('id')
      .single();

    await supabase.from('ai_actions').insert({
      action_type: 'opening_post', tab_type: tabType, persona_code: persona,
      post_id: insertedPost?.id ?? null, safety_tier: 'none',
    });
    created++;
  }
  return { created };
}

Deno.serve(async (_req: Request) => {
  const [featureB, featureA] = [await runFeatureB(), await runFeatureA()];
  return new Response(JSON.stringify({ featureB, featureA }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
