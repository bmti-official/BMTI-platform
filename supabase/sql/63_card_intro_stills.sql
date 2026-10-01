-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 63. 시작 전 그림 — 설명 영상 대신 멈춰 있는 그림 두 장.
--
-- 시작 전 설명(AI 음성)이 흐르는 동안 그림 두 장이 음성 길이의 절반씩 나온다.
-- 어차피 멈춰 있는 장면이라 영상보다 그림이 훨씬 가볍다.
-- 한 장마다 { url, x, y, s } — 좌우·높이·크기를 화면에 맞게 옮겨 둔 값이다.
-- 비워 두면 예전처럼 설명 영상(intro_url)이, 그것도 없으면 동작 영상의 첫 장면이 나온다.
-- 여러 번 실행해도 안전합니다.
alter table public.quick_cards
  add column if not exists intro_imgs jsonb not null default '[]'::jsonb;

-- 확인 — 아래처럼 한 줄이 나오면 성공
--   intro_imgs | jsonb
select column_name as 칸, data_type as 종류
  from information_schema.columns
 where table_schema = 'public' and table_name = 'quick_cards' and column_name = 'intro_imgs';
