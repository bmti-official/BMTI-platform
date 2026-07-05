-- ===================================================
-- BMTI 운동 심리 AI 개편 - Supabase Schema
-- Supabase SQL Editor에서 실행하세요
-- ===================================================

-- 1. 구독 정보 (users 테이블 수정)
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS star_balance INTEGER DEFAULT 0;

-- 2. ⭐️ 스타 트랜잭션
CREATE TABLE IF NOT EXISTS star_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 토큰 사용량
CREATE TABLE IF NOT EXISTS token_usage (
  user_id UUID REFERENCES users(id),
  date DATE NOT NULL,
  used_tokens INTEGER DEFAULT 0,
  bonus_tokens INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- 4. 1:1 채팅 메시지
CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  sender TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. AI 기억 요약
CREATE TABLE IF NOT EXISTS chat_memories (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  summary TEXT NOT NULL,
  chat_date DATE NOT NULL,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 단톡방
CREATE TABLE IF NOT EXISTS group_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  max_members INTEGER DEFAULT 5,
  morning_time TIME DEFAULT '08:00',
  lunch_time TIME DEFAULT '12:00',
  lunch_enabled BOOLEAN DEFAULT true,
  dinner_time TIME DEFAULT '19:00',
  dinner_enabled BOOLEAN DEFAULT true,
  late_evening_time TIME DEFAULT '21:00',
  late_evening_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id BIGSERIAL PRIMARY KEY,
  room_id UUID REFERENCES group_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  sender_type TEXT NOT NULL,
  bmti_character TEXT,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. 대화 기록 보관 (7일)
CREATE TABLE IF NOT EXISTS chat_archives (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  room_type TEXT NOT NULL,
  room_id UUID,
  messages JSONB NOT NULL,
  chat_date DATE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. BMTI 원본 응답(16문항) 저장 — 기기 간 결과 동기화용
-- bmti_type(코드)만 저장되고 원본 응답은 기기 로컬에만 있어서, 축별 확신/유연 판정과
-- 퍼센트가 로그인한 다른 기기·AI챗 등에서 재현되지 않던 문제를 해결하기 위해 추가.
ALTER TABLE users ADD COLUMN IF NOT EXISTS bmti_answers JSONB;

-- ============================================================
-- 9. BMTI 과몰입 게시판 — AI 커뮤니티 활성화 기능
--    (users에 AI 페르소나 16명을 실제 행으로 시딩하는 방식.
--     이유: BoardView.jsx의 fetchPosts 조인/리셰이핑/AuthorBadge/삭제
--     권한 로직을 거의 그대로 재사용할 수 있어 nullable user_id +
--     별도 sender_type 컬럼 방식보다 변경 범위가 훨씬 작음)
-- ============================================================

-- 9-1. AI 페르소나 플래그
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT false;

-- 9-2. 16개 페르소나 행 시딩
-- 닉네임은 "AI + 유형코드" 형식으로 고정 (이모지 없음) — 사람 닉네임과 절대 헷갈리지 않게.
INSERT INTO users (kakao_id, nickname, bmti_type, is_ai) VALUES
  ('ai_bot_ACDZ', 'AI ACDZ', 'ACDZ', true),
  ('ai_bot_ACDM', 'AI ACDM', 'ACDM', true),
  ('ai_bot_ACQZ', 'AI ACQZ', 'ACQZ', true),
  ('ai_bot_ACQM', 'AI ACQM', 'ACQM', true),
  ('ai_bot_ALDZ', 'AI ALDZ', 'ALDZ', true),
  ('ai_bot_ALDM', 'AI ALDM', 'ALDM', true),
  ('ai_bot_ALQZ', 'AI ALQZ', 'ALQZ', true),
  ('ai_bot_ALQM', 'AI ALQM', 'ALQM', true),
  ('ai_bot_OCDZ', 'AI OCDZ', 'OCDZ', true),
  ('ai_bot_OCDM', 'AI OCDM', 'OCDM', true),
  ('ai_bot_OCQZ', 'AI OCQZ', 'OCQZ', true),
  ('ai_bot_OCQM', 'AI OCQM', 'OCQM', true),
  ('ai_bot_OLDZ', 'AI OLDZ', 'OLDZ', true),
  ('ai_bot_OLDM', 'AI OLDM', 'OLDM', true),
  ('ai_bot_OLQZ', 'AI OLQZ', 'OLQZ', true),
  ('ai_bot_OLQM', 'AI OLQM', 'OLQM', true)
ON CONFLICT (kakao_id) DO NOTHING;

-- 9-3. 무플 게시물 추적 + 멱등성 (Edge Function이 원자적으로 선점하는 데 씀)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS ai_comment_added_at TIMESTAMPTZ;

-- 9-4. AI 행동 로그 — 기능 A의 페르소나/소재 로테이션과 일일 상한, 기능 B의 안전 통계 근거
CREATE TABLE IF NOT EXISTS ai_actions (
  id BIGSERIAL PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN ('opening_post','reply_comment')),
  tab_type TEXT NOT NULL CHECK (tab_type IN ('Z','M')),
  persona_code TEXT NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  safety_tier TEXT NOT NULL DEFAULT 'none' CHECK (safety_tier IN ('none','medical','crisis_blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ai_actions_type_tab_idx ON ai_actions (action_type, tab_type, created_at);
-- 한 게시물엔 AI 댓글이 절대 2개 이상 안 달리도록 DB 레벨에서도 강제
CREATE UNIQUE INDEX IF NOT EXISTS ai_actions_one_reply_per_post
  ON ai_actions (post_id) WHERE action_type = 'reply_comment';

-- 9-5. 필수 — 사람이 AI 페르소나를 사칭해 글을 못 올리게 차단.
--    이 앱은 Supabase Auth 없이 anon 키로만 동작해서 auth.uid()로 실제 유저를
--    구분할 방법이 없다. 16명의 진짜 users 행을 만드는 순간, 아무 브라우저나
--    user_id에 봇의 uuid를 넣어 올리면 사람이 AI인 척 글을 쓸 수 있게 된다.
CREATE POLICY "block_ai_impersonation_posts" ON posts
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id NOT IN (SELECT id FROM users WHERE is_ai = true));

CREATE POLICY "block_ai_impersonation_comments" ON comments
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id NOT IN (SELECT id FROM users WHERE is_ai = true));
