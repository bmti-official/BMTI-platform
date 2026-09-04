-- 썸네일 문구 자리를 아홉 칸 안에서 더 세밀하게 밀 수 있게 한다.
-- 가로·세로로 -40~40%까지 옮긴다. 0이면 지금과 같다.
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists thumb_dx int not null default 0,
  add column if not exists thumb_dy int not null default 0;

alter table public.quick_cards
  add column if not exists thumb_dx int not null default 0,
  add column if not exists thumb_dy int not null default 0;
