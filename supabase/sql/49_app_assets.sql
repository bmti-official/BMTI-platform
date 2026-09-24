-- 49) 화면에 쓰는 공용 이미지 한 칸.
--
-- 지금은 각도기록의 옆모습 사람 그림(남/여) 둘만 쓴다.
-- meta에는 그림마다 어깨·골반이 어디쯤인지를 담는다 — 그 자리를 알아야
-- 머리를 잰 각도만큼 돌리고, 굽힘·들림 부채꼴을 제자리에 그릴 수 있다.
--   { "shoulderX": 46, "shoulderY": 34, "hipY": 58, "baseNeck": 6 }   (모두 %)
create table if not exists public.app_assets (
  key        text        primary key,          -- 'angle_body_male' | 'angle_body_female'
  url        text,
  meta       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_assets enable row level security;

drop policy if exists app_assets_read on public.app_assets;
create policy app_assets_read on public.app_assets
  for select using (true);

drop policy if exists app_assets_admin on public.app_assets;
create policy app_assets_admin on public.app_assets
  for all using (public.is_admin()) with check (public.is_admin());
