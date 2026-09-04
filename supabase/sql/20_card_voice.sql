-- 바로카드에 좌우 구분과 AI 음성 칸을 만든다.
--
-- has_side      : 좌우가 나뉘는 동작인지(왼쪽 어깨 / 오른쪽 어깨처럼)
-- voice_open_*  : 오프닝 멘트 한 편 (준비 자세 → "천천히 시작합니다")
-- voice_sets_*  : 세트마다 다른 동작 멘트. 1세트째부터 차례로 쓴다.
--                 세트 수보다 적게 올리면 마지막 것을 이어서 쓴다.

alter table public.quick_cards
  add column if not exists has_side     boolean not null default false,
  add column if not exists voice_open_z text,
  add column if not exists voice_open_m text,
  add column if not exists voice_sets_z text[] not null default '{}',
  add column if not exists voice_sets_m text[] not null default '{}';
