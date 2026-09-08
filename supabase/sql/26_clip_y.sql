-- 표지와 재생 화면에서 영상을 위아래 어디쯤 보여 줄지.
-- 4:5 틀에 세로로 긴 영상을 담으면 위아래가 잘린다.
-- 0이면 위쪽을 살리고, 100이면 아래쪽을 살린다. 50이 한가운데(지금까지의 모습).

alter table public.quick_cards
  add column if not exists clip_y int not null default 50;
