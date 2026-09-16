-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 음성과 짝을 이루는 자막.
-- 지하철·사무실처럼 소리를 못 켜는 자리에서도 따라 할 수 있어야 한다.
--   sub_open_*  준비 자세 설명 — 오프닝 화면 말풍선에 뜬다
--   sub_sets_*  세트마다 흐르는 멘트 — 영상 아래에 뜬다
-- 음성 파일과 한 칸씩 짝이 맞는다. 시각을 따로 맞출 일이 없다.

alter table public.quick_cards
  add column if not exists sub_open_z text,
  add column if not exists sub_open_m text,
  add column if not exists sub_sets_z text[] not null default '{}',
  add column if not exists sub_sets_m text[] not null default '{}';
