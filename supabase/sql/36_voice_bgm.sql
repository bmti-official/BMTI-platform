-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 배경음악 네 곡. 가사 없는 연주곡이다.
--   kind = 'bgm'  n = 1~4
--     1  확신의 O 유형 — 이완 · 또렷
--     2  유연한 O 유형 — 이완 · 흐르듯
--     3  유연한 A 유형 — 활력 · 흐르듯
--     4  확신의 A 유형 — 활력 · 또렷
-- 손님의 유형에 맞는 곡이 처음부터 골라져 있고, 손님이 바꿀 수도 있다.

alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch', 'side', 'countdown', 'bgm'));
