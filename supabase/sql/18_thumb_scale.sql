-- 썸네일 문구 크기 — 기본값 100(지금 크기)을 기준으로 한 퍼센트 값
-- 60이면 지금의 60%, 160이면 1.6배로 보입니다.

alter table public.curation_items
  add column if not exists thumb_scale int not null default 100;

alter table public.quick_cards
  add column if not exists thumb_scale int not null default 100;
