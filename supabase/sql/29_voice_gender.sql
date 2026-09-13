-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 공통 음성을 목소리 성별로 나눈다.
--   영상 속 캐릭터가 여자면 여자 목소리, 남자면 남자 목소리가 나가야 어울린다.
--
--   숫자 세기(count) · 방향 알림(side)   → 성별로만 나뉜다 (말투는 tone='a' 하나)
--   쉬는 시간(rest) · 자리 바꾸기(switch) · 마무리(finish)
--                                       → 성별 × 말투 네 갈래
--
-- 이미 올려 둔 것은 '여자 목소리'로 옮겨 담는다. 지워지는 건 없다.

alter table public.voice_assets
  add column if not exists gender text not null default 'female';

alter table public.voice_assets drop constraint if exists voice_assets_gender_check;
alter table public.voice_assets add constraint voice_assets_gender_check
  check (gender in ('female', 'male'));

-- 말투를 가리지 않는 갈래는 tone='a'(둘 다)로 둔다
alter table public.voice_assets drop constraint if exists voice_assets_tone_check;
alter table public.voice_assets add constraint voice_assets_tone_check
  check (tone in ('z', 'm', 'a'));

-- 숫자·방향은 말투를 가리지 않으므로, 이미 올린 것 중 z 쪽을 'a'로 옮긴다.
-- (같은 자리에 m 쪽이 있으면 그건 지운다 — 어차피 같은 소리다)
delete from public.voice_assets
 where kind in ('count', 'side') and tone = 'm'
   and exists (select 1 from public.voice_assets b
                where b.kind = voice_assets.kind and b.n = voice_assets.n
                  and b.gender = voice_assets.gender and b.tone = 'z');
update public.voice_assets set tone = 'a' where kind in ('count', 'side') and tone in ('z', 'm');

-- 같은 자리를 성별까지 보고 가리도록 열쇠를 다시 짠다
alter table public.voice_assets drop constraint if exists voice_assets_pkey;
alter table public.voice_assets add primary key (kind, gender, tone, n);
