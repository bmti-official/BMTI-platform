-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 플레이리스트에 누끼 캐릭터를 붙인다 — Z 유형 칸, M 유형 칸 각각 최대 4마리.
-- 바로카드에서는 캐릭터를 빼고(칸은 남겨 둠), 여기서만 '추천 유형'을 보여 준다.
-- 낱개 동작은 유형을 가리지 않지만, 묶음은 유형을 보고 고르기 때문이다.

alter table public.routines
  add column if not exists chars_z text[] not null default '{}',
  add column if not exists chars_m text[] not null default '{}';
