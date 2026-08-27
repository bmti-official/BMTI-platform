-- ===================================================================
-- 행동 기록(app_events) — 비회원 포함, 익명 ID 기준
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전합니다.
-- ===================================================================
--
-- 개인정보를 새로 모으지 않습니다. 브라우저에 저장한 임의의 익명 ID만 씁니다.
-- 로그인한 뒤에는 user_id도 함께 남겨, 같은 사람이 비회원일 때 무엇을 했는지
-- 이어 볼 수 있습니다(비회원 → 회원 전환율 계산에 씁니다).

create table if not exists public.app_events (
  id          bigserial primary key,
  anon_id     text        not null,          -- 브라우저마다 하나. 개인 식별 정보가 아님
  user_id     uuid        references public.users(id) on delete set null,
  name        text        not null,          -- quiz_start · quiz_done · share_click …
  meta        jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists app_events_name_time_idx on public.app_events (name, created_at desc);
create index if not exists app_events_anon_idx      on public.app_events (anon_id, created_at);

alter table public.app_events enable row level security;

-- 손님은 '쓰기만' 할 수 있다. 남이 남긴 기록을 읽지는 못한다.
drop policy if exists events_insert_any on public.app_events;
create policy events_insert_any on public.app_events
  for insert with check (true);

drop policy if exists events_admin_read on public.app_events;
create policy events_admin_read on public.app_events
  for select using (public.is_admin());

-- 오래된 기록 정리용 — 필요할 때 관리자가 직접 부른다.
create or replace function public.purge_old_events(days int default 180)
returns void language sql security definer set search_path = public as $$
  delete from public.app_events where created_at < now() - (days || ' days')::interval;
$$;
revoke all on function public.purge_old_events(int) from public;
