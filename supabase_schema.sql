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
