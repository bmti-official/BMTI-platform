-- 58. 보안 잠금 — 로그인하지 않은 사람이 회원·다이어리 기록을 읽던 문을 닫는다.
-- 여러 번 실행해도 안전합니다. 되돌리는 법은 맨 아래에 있습니다.
--
-- 2026-10-01 점검에서 확인: 로그인 없이 users(카카오 번호·성별·연령대·키·몸무게)와
-- diary_entries(기분·통증·태그·한 줄 일기)를 누구나 읽을 수 있었다. 14_lockdown.sql 을 실행하지 않아
-- 처음에 열어 둔 '누구나 다 하기' 정책이 남아 있었다.
--
--   ① 계정 잇기(link_my_account) — 브라우저가 대는 카카오 번호를 믿지 않고, 로그인 세션의 카카오 번호와 맞을 때만 잇는다
--   ② 민감한 표 — 우리가 만든 '본인만' 정책만 남기고 나머지는 모두 지운다(이름이 달라도 남지 않게)
--   ③ 관리자 판별 — 이메일이 아니라 로그인 계정 번호로
--   ④ 회원이 스스로 바꾸면 안 되는 칸(구독 등급·만료일·별·로그인 계정·카카오 번호)을 지킨다
--   ⑤ 닉네임 'BMTI'·유형 코드는 서버에서도 막는다(관리자 제외)
--   ⑥ 행동 기록 — 남의 회원 번호를 붙여 넣지 못하게, 지나치게 큰 기록은 받지 않게

-- ── ① 계정 잇기 — 세션의 카카오 번호와 같아야 한다 ─────────────────────
create or replace function public.link_my_account(p_kakao_id text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_id uuid;
begin
  if auth.uid() is null then
    raise exception '로그인이 필요합니다';
  end if;

  -- 이미 이어져 있으면 그대로 돌려준다
  select id into v_id from public.users where auth_id = auth.uid() limit 1;
  if v_id is not null then return v_id; end if;

  -- 이 로그인 세션이 정말 그 카카오 계정인지 서버가 직접 확인한다
  if not exists (
    select 1 from auth.identities i
     where i.user_id = auth.uid() and i.provider = 'kakao'
       and p_kakao_id in (i.identity_data ->> 'sub', i.identity_data ->> 'provider_id')
  ) then
    return null;
  end if;

  update public.users
     set auth_id = auth.uid()
   where kakao_id = p_kakao_id
     and auth_id is null
  returning id into v_id;

  return v_id;
end;
$$;
revoke all on function public.link_my_account(text) from public, anon;
grant execute on function public.link_my_account(text) to authenticated;
-- 정책들이 부르는 함수 — 로그인하지 않은 사람에게는 null 을 돌려줄 뿐이다
grant execute on function public.my_user_id() to anon, authenticated;

-- ── ③ 관리자 판별 — 로그인 계정 번호로 ─────────────────────────────
create table if not exists public.admins (
  auth_id    uuid primary key,
  note       text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;   -- 정책이 없으니 화면에서는 아무도 못 읽고 못 쓴다
insert into public.admins (auth_id, note)
  select id, '처음 관리자(이메일로 찾아 넣음)' from auth.users where email = 'dmdwns777@bmti.com'
  on conflict (auth_id) do nothing;

-- 관리자 표가 비어 있으면(이메일로 못 찾은 경우) 예전처럼 이메일로 본다 — 관리자가 잠기지 않게.
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admins where auth_id = auth.uid())
      or (not exists (select 1 from public.admins)
          and coalesce(auth.jwt() ->> 'email', '') = 'dmdwns777@bmti.com');
$$;

-- ── ② 민감한 표 — '본인만' 정책만 남긴다 ───────────────────────────
do $$
declare
  t record;
  p record;
begin
  for t in select * from (values
      ('users',                  array['users_self', 'users_admin']),
      ('diary_entries',          array['diary_self', 'diary_admin']),
      ('health_records',         array['hrec_self']),
      ('health_record_consents', array['hcon_self']),
      ('bmti_history',           array['bmti_self']),
      ('mallang_info_history',   array['mallang_self']),
      ('pre_registrations',      array['prereg_self']),
      ('curation_content',       array[]::text[])
    ) as x(tbl, keep)
  loop
    if to_regclass('public.' || t.tbl) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t.tbl);
    for p in select policyname from pg_policies where schemaname = 'public' and tablename = t.tbl loop
      if not (p.policyname = any (t.keep)) then
        execute format('drop policy %I on public.%I', p.policyname, t.tbl);
      end if;
    end loop;
  end loop;
end $$;

-- '본인만' 정책을 다시 깐다(이미 있어도 같은 내용으로)
drop policy if exists users_self on public.users;
create policy users_self on public.users
  for all using (auth_id = auth.uid()) with check (auth_id = auth.uid());
drop policy if exists users_admin on public.users;
create policy users_admin on public.users for select using (public.is_admin());

drop policy if exists diary_self on public.diary_entries;
create policy diary_self on public.diary_entries
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists diary_admin on public.diary_entries;
create policy diary_admin on public.diary_entries for select using (public.is_admin());

drop policy if exists hrec_self on public.health_records;
create policy hrec_self on public.health_records
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists hcon_self on public.health_record_consents;
create policy hcon_self on public.health_record_consents
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists bmti_self on public.bmti_history;
create policy bmti_self on public.bmti_history
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists mallang_self on public.mallang_info_history;
create policy mallang_self on public.mallang_info_history
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists prereg_self on public.pre_registrations;
create policy prereg_self on public.pre_registrations
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- ── ④ 회원이 스스로 바꾸면 안 되는 칸 ────────────────────────────────
-- 화면(anon·authenticated 역할)에서 바로 고칠 때만 막는다. 서버 함수(계정 잇기 등)는
-- 함수 주인 권한으로 돌아 current_user 가 다르므로 그대로 통과한다.
create or replace function public.guard_user_fields()
returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    -- 새로 가입할 때 구독 등급·만료일·별을 스스로 적어 넣지 못하게, 표에 정해 둔 기본값으로 되돌린다
    execute 'select ' || coalesce((select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'subscription_tier'), 'null')
      into new.subscription_tier;
    execute 'select ' || coalesce((select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'subscription_expires_at'), 'null')
      into new.subscription_expires_at;
    execute 'select ' || coalesce((select column_default from information_schema.columns
      where table_schema = 'public' and table_name = 'users' and column_name = 'star_balance'), 'null')
      into new.star_balance;
    return new;
  end if;
  new.id := old.id;
  new.kakao_id := old.kakao_id;
  new.auth_id := old.auth_id;
  new.subscription_tier := old.subscription_tier;
  new.subscription_expires_at := old.subscription_expires_at;
  new.star_balance := old.star_balance;
  return new;
end $$;
drop trigger if exists users_guard_fields on public.users;
create trigger users_guard_fields
  before insert or update on public.users
  for each row execute function public.guard_user_fields();

-- ── ⑤ 닉네임 — 'BMTI'(관리자 표시)와 16가지 유형 코드는 회원이 못 쓴다 ─────────
create or replace function public.guard_nickname()
returns trigger
language plpgsql as $$
declare n text := upper(trim(coalesce(new.nickname, '')));
begin
  if new.nickname is null then return new; end if;
  if tg_op = 'UPDATE' then
    if new.nickname is not distinct from old.nickname then return new; end if;   -- 닉네임을 안 바꿨으면 보지 않는다
  end if;
  if public.bad_name(new.nickname) then
    raise exception '닉네임에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;
  if not public.is_admin() and (n = 'BMTI' or n ~ '^[AO][CL][DQ][ZM]$') then
    raise exception '이 닉네임은 쓸 수 없어요.' using errcode = '22023';
  end if;
  return new;
end $$;

-- ── ⑥ 행동 기록 — 회원 번호는 본인 것만, 크기는 적당히 ───────────────────
-- 남의 회원 번호가 붙어 오면 거절하지 않고 번호만 뗀다(익명 기록으로 남긴다).
-- 거절하면 로그인 세션이 끊긴 회원의 기록이 통째로 버려진다.
create or replace function public.fix_event_user()
returns trigger
language plpgsql set search_path = public as $$
begin
  if new.user_id is not null and new.user_id is distinct from public.my_user_id() then
    new.user_id := null;
  end if;
  return new;
end $$;
drop trigger if exists app_events_fix_user on public.app_events;
create trigger app_events_fix_user
  before insert on public.app_events
  for each row execute function public.fix_event_user();

drop policy if exists events_insert_any on public.app_events;
create policy events_insert_any on public.app_events
  for insert with check (char_length(name) <= 40 and pg_column_size(meta) <= 4000);

-- 확인 — 표마다 남은 정책. 아래처럼 나오면 성공
--   users: users_admin, users_self / diary_entries: diary_admin, diary_self / 나머지: *_self 하나
--   관리자 수: 1
select tablename as 표, string_agg(policyname, ', ' order by policyname) as 남은_정책
  from pg_policies
 where schemaname = 'public'
   and tablename in ('users', 'diary_entries', 'health_records', 'health_record_consents', 'bmti_history',
                     'mallang_info_history', 'pre_registrations', 'curation_content')
 group by tablename
union all
select '관리자 수', count(*)::text from public.admins
 order by 1;

-- 되돌리기(문제가 생겼을 때만 — 다시 누구나 읽게 됩니다):
--   create policy "allow anon all - users" on public.users for all using (true) with check (true);
--   create policy "diary_entries_open" on public.diary_entries for all using (true) with check (true);
