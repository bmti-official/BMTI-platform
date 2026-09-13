-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 이 바로카드의 영상에 나오는 사람이 여자인지 남자인지.
-- 그 성별에 맞는 공통 음성(숫자·쉬는 시간·마무리)이 나간다.

alter table public.quick_cards
  add column if not exists video_gender text not null default 'female';

alter table public.quick_cards drop constraint if exists quick_cards_video_gender_check;
alter table public.quick_cards add constraint quick_cards_video_gender_check
  check (video_gender in ('female', 'male'));
