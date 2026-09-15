-- Supabase SQL 편집기에 붙여넣으세요.
--
-- '셋, 둘, 하나'를 따로 떼어낸다.
--   kind = 'countdown'  n = 0
-- 쉬는 시간이든 자리 바꾸기든, 남은 3초에 이 파일 하나가 나간다.
-- 말투를 가리지 않으므로 성별당 한 벌(모두 두 개)이면 된다.
--
-- 덕분에 쉬는 시간 멘트는 '앞부분'만 만들면 되고,
-- 끝을 초 단위로 맞추느라 애쓸 일이 없어진다.

alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch', 'side', 'countdown'));
