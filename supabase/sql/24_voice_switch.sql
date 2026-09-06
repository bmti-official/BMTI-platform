-- 공통 음성에 '자리 바꾸기 멘트'를 더한다.
--   kind = 'switch'  n = 0
-- '한쪽씩 둘 다'로 하다가 오른쪽을 마치고 왼쪽으로 넘어갈 때 한 번 흐른다.
-- (좌우를 번갈아 하는 카드는 방향을 말하지 않으므로 쓰지 않는다.)

alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch'));
