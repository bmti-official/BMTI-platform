-- 좌우를 번갈아 할 수 있는 동작인지 표시한다.
-- 켜면 손님 화면에 '좌우 번갈아' 버튼이 하나 더 생기고,
-- 영상이 한 번 돌 때마다 좌우가 뒤집혀 나온다.
-- (한쪽을 다 하고 반대쪽으로 넘어가야 하는 동작은 꺼 두세요.)

alter table public.quick_cards
  add column if not exists can_alternate boolean not null default false;
