-- 53. 마이플리에 담은 동작마다 바로카드와 같은 설정을 둔다 — 안내(설명 들으며·숫자만)와 좌우(우·좌까지).
-- 여러 번 실행해도 안전합니다.

-- 안내 — 비움(카드 그대로 = 설명 들으며) / talk(설명 들으며) / count(숫자만)
alter table public.routine_cards
  add column if not exists guide text;
alter table public.routine_cards drop constraint if exists routine_cards_guide_chk;
alter table public.routine_cards
  add constraint routine_cards_guide_chk check (guide is null or guide in ('talk', 'count'));

-- 좌우 — 기존 off·both·alt에 한쪽만 하는 right(우)·left(좌)를 더한다
alter table public.routine_cards drop constraint if exists routine_cards_side_chk;
alter table public.routine_cards
  add constraint routine_cards_side_chk
  check (side is null or side in ('off', 'both', 'alt', 'right', 'left'));

-- 확인 — guide 한 줄이 보이면 성공
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'routine_cards' and column_name = 'guide';
