-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 큐레이션이 추천하는 것을 바로카드 낱장에서 '바로플리'로 바꾼다.
-- 글을 읽고 나서 필요한 건 동작 하나가 아니라 '오늘 뭘 할지 정해진 묶음'이다.
-- 예전 card_ids 칸은 그냥 둔다 — 비어 있어도 비용이 없고, 되돌릴 여지가 된다.

alter table public.curation_items
  add column if not exists routine_ids bigint[] not null default '{}';
