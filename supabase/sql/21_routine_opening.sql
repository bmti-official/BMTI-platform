-- 플레이리스트에서는 동작마다 오프닝 설명을 다시 듣지 않아도 되게 한다.
-- 켜 두면(기본) 담긴 바로카드의 오프닝 멘트를 건너뛰고 곧장 동작으로 들어간다.

alter table public.routines
  add column if not exists skip_opening boolean not null default true;
