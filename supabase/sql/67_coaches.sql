-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 67. 강사 — 관리자가 직접 지정한다 (강사–회원 연결 1단계)
--
-- 물리치료사 면허를 직접 확인한 회원을 관리자가 '강사'로 지정한다.
-- 면허증 사본은 받아서 확인한 뒤 지우고, 여기에는 '확인한 날'만 남긴다.
-- 이 표에는 회원에게 보여도 되는 것만 담는다(연락처·메모는 담지 않는다).
--   읽기: 관리자(전부) · 강사 본인(자기 줄만)      쓰기: 관리자만
-- 지정을 풀거나 쉬게 하면 is_coach()가 곧바로 거짓이 되어, 다음 단계에서 만들 강사 화면과 회원 정보 열람이 함께 닫힌다.
-- 회원이 탈퇴하면 그 줄도 함께 지워진다. 여러 번 실행해도 안전합니다.
create table if not exists public.coaches (
  user_id            uuid        primary key references public.users(id) on delete cascade,
  display_name       text        not null check (char_length(btrim(display_name)) between 1 and 20),   -- 회원에게 보이는 이름
  center_name        text        not null default '' check (char_length(center_name) <= 30),
  area               text        not null default '',                                                   -- 판교·정자·서현·수내·야탑·미금
  license_checked_on date        not null,                                                              -- 면허를 확인한 날
  active             boolean     not null default true,                                                 -- 쉬게 하면 false
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.coaches enable row level security;

drop policy if exists coaches_admin on public.coaches;
create policy coaches_admin on public.coaches
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists coaches_self_read on public.coaches;
create policy coaches_self_read on public.coaches
  for select using (user_id = public.my_user_id());

-- 지금 로그인한 사람이 활동 중인 강사인가 — 다음 단계의 권한 확인이 모두 이것을 쓴다
create or replace function public.is_coach()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.coaches where user_id = public.my_user_id() and active);
$$;
revoke all on function public.is_coach() from public;
grant execute on function public.is_coach() to authenticated;

-- 확인 — '1 · 2 · 1'이 나오면 성공(표 하나, 정책 둘, 함수 하나)
select
  (select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'coaches') as 강사_표,
  (select count(*) from pg_policies where schemaname = 'public' and tablename = 'coaches') as 정책_수,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_coach') as 함수_수;
