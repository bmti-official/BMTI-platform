-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 41. 세트 전 설명 영상 — 화살표로 어디를 어떻게 움직이는지 짚어 주는 짧은 한 편.
--
-- 세트를 시작할 때 첫 자세로 멈춰 선 채 멘트가 흐르는데,
-- 그 자리에 이 영상을 대신 돌려 준다. 멘트가 끝나면 동작 영상으로 넘어간다.
-- 비워 두면 예전처럼 동작 영상의 첫 장면에 멈춰 선다.
alter table public.quick_cards
  add column if not exists intro_url text;
