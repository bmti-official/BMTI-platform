-- 바로카드에도 누끼 캐릭터를 붙인다 — Z 유형 칸, M 유형 칸 각각 최대 4마리.
-- 큐레이션의 chars_z / chars_m 과 같은 모양이다.

alter table public.quick_cards
  add column if not exists chars_z text[] not null default '{}',
  add column if not exists chars_m text[] not null default '{}';
