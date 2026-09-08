-- 바로카드마다 처음 보여 줄 기본 설정.
-- 비워 두면 종류에 맞는 값을 쓴다 —
--   운동     15회 · 3세트 · 10초 쉼
--   마사지    5회 · 3세트 · 10초 쉼   (한 번이 '버티기' 한 판이라 횟수가 적다)
--   스트레칭  5회 · 3세트 · 10초 쉼
-- 손님은 언제든 아코디언에서 바꿀 수 있다.

alter table public.quick_cards
  add column if not exists default_reps int,
  add column if not exists default_sets int,
  add column if not exists default_rest int;
