-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 39. '다음 동작' 멘트 — 바로플리에서 한 동작을 끝내고 다음으로 넘어갈 때.
--   kind = 'next'  n = 0
--     z  "좋습니다. 잠깐 숨 고르고 다음 동작으로 가겠습니다."
--     m  "잘하셨어요! 잠깐 숨 고르고 다음 동작 갈게요."
-- 이 멘트가 끝나면 스무 셈을 세고 저절로 다음 동작이 이어진다.

alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch', 'side', 'countdown', 'bgm', 'next'));
