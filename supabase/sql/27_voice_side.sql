-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 공통 음성에 '방향 알림'을 더한다.
--   kind = 'side'  n = 1 오른쪽 / n = 2 왼쪽
-- 세트를 시작할 때마다 한 마디만 짧게 흐른다("오른쪽입니다").
-- 좌우를 번갈아 하는 카드에는 쓰지 않는다 — 한 번마다 방향이 바뀌니까.

alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch', 'side'));
