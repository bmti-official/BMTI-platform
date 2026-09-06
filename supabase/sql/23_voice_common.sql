-- 모든 바로카드가 함께 쓰는 음성 — 숫자 세기, 쉬는 시간, 마무리.
-- 카드마다 다시 만들 필요가 없는 것들만 여기 담는다.
--
--   kind = 'count'   n = 1~20    "하나" "둘" …
--   kind = 'rest'    n = 5·10·15·20   "잘했어요. 열 셀 동안 숨 고르고 갈게요 … 셋, 둘, 하나"
--   kind = 'finish'  n = 0       "오늘 다 하셨어요"
--
-- tone 은 유형 말투 — z(담백) / m(다정)

create table if not exists public.voice_assets (
  kind       text not null check (kind in ('count', 'rest', 'finish')),
  tone       text not null check (tone in ('z', 'm')),
  n          int  not null default 0,
  url        text not null,
  updated_at timestamptz not null default now(),
  primary key (kind, tone, n)
);

alter table public.voice_assets enable row level security;

-- 손님은 읽기만, 관리자만 올리고 지운다.
drop policy if exists voice_read on public.voice_assets;
create policy voice_read on public.voice_assets
  for select using (true);

drop policy if exists voice_admin_write on public.voice_assets;
create policy voice_admin_write on public.voice_assets
  for all using (public.is_admin()) with check (public.is_admin());
