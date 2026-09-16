-- 38. 바로플리에 담은 동작마다 횟수·세트·쉬는 시간·좌우를 따로 정한다.
--
-- 같은 동작이라도 묶음 안에서는 가볍게 넘어가고 싶을 때가 있다.
-- 비워 두면(null) 바로카드에 적어 둔 기본값을 그대로 쓴다.
alter table public.routine_cards
  add column if not exists reps int,
  add column if not exists sets int,
  add column if not exists rest int,
  add column if not exists side text;

-- side 는 비움(카드 그대로) / off(좌우 없음) / both(한쪽씩 둘 다) / alt(좌우 번갈아)
alter table public.routine_cards drop constraint if exists routine_cards_side_chk;
alter table public.routine_cards
  add constraint routine_cards_side_chk
  check (side is null or side in ('off', 'both', 'alt'));
