-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 42. 자막이 화면 위아래 어디쯤에 놓일지.
--   0이 맨 위, 100이 맨 아래. 비워 두면 78(아래쪽)이다.
-- 동작에 따라 몸이 화면 아래를 채우기도 해서, 자막이 가리지 않게 옮길 수 있어야 한다.
alter table public.quick_cards
  add column if not exists sub_y int;
