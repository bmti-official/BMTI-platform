-- ===================================================================
-- 1단계 — 로그인한 사람이 누구인지 서버가 알게 만든다
-- ===================================================================
-- 지금은 브라우저가 "나는 이 사람이다"라고 말하면 서버가 그대로 믿습니다.
-- 그래서 아무나 남의 건강 기록을 읽고 지울 수 있습니다.
--
-- 이 파일은 그 바탕을 깝니다. 아직 아무것도 막지 않으므로
-- 실행해도 사이트는 지금 그대로 돌아갑니다.
-- 실제로 잠그는 것은 14_lockdown.sql이고, 로그인이 잘 되는 걸 확인한 뒤에 실행합니다.
-- 여러 번 실행해도 안전합니다.

-- ── 1. 회원 표에 '로그인 계정' 칸을 붙인다 ──────────────────
-- 기존 users.id는 그대로 두고, 로그인 계정 id를 옆에 이어 붙입니다.
-- 지금까지 쌓인 다이어리·건강 기록이 하나도 끊기지 않습니다.
alter table public.users
  add column if not exists auth_id uuid unique;

create index if not exists users_auth_id_idx on public.users (auth_id);

-- ── 2. '지금 로그인한 사람의 users.id'를 돌려주는 함수 ───────
-- 정책들이 이 함수 하나만 보면 되게 만듭니다.
create or replace function public.my_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from public.users where auth_id = auth.uid() limit 1;
$$;

revoke all on function public.my_user_id() from public;
grant execute on function public.my_user_id() to authenticated;

-- ── 3. 카카오 로그인과 기존 회원을 이어 붙이는 함수 ──────────
-- 로그인한 사람이 자기 카카오 번호를 대면, 그 회원 줄에 로그인 계정을 매답니다.
-- 이미 다른 계정이 매달린 줄은 건드리지 않습니다.
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

  -- 카카오 번호로 찾아 이어 붙인다 (아직 아무 계정도 안 매달린 줄만)
  update public.users
     set auth_id = auth.uid()
   where kakao_id = p_kakao_id
     and auth_id is null
  returning id into v_id;

  return v_id;   -- 못 찾으면 null (새로 가입해야 하는 사람)
end;
$$;

revoke all on function public.link_my_account(text) from public;
grant execute on function public.link_my_account(text) to authenticated;

-- ── 4. 제대로 된 정책을 '추가'한다 ───────────────────────────
-- 지금 열려 있는 정책은 그대로 두므로 사이트는 계속 돌아갑니다.
-- 14_lockdown.sql에서 열린 정책을 지우면 아래 정책만 남습니다.

-- 내 회원 정보
drop policy if exists users_self on public.users;
create policy users_self on public.users
  for all using (auth_id = auth.uid()) with check (auth_id = auth.uid());

drop policy if exists users_admin on public.users;
create policy users_admin on public.users
  for select using (public.is_admin());

-- 내 다이어리
drop policy if exists diary_self on public.diary_entries;
create policy diary_self on public.diary_entries
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

drop policy if exists diary_admin on public.diary_entries;
create policy diary_admin on public.diary_entries
  for select using (public.is_admin());

-- 내 건강 기록
drop policy if exists hrec_self on public.health_records;
create policy hrec_self on public.health_records
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- 내 건강정보 동의
drop policy if exists hcon_self on public.health_record_consents;
create policy hcon_self on public.health_record_consents
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- 내 BMTI 기록
drop policy if exists bmti_self on public.bmti_history;
create policy bmti_self on public.bmti_history
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- 내 일상 정보 기록
drop policy if exists mallang_self on public.mallang_info_history;
create policy mallang_self on public.mallang_info_history
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- 사전 신청 — 넣는 것만, 그것도 본인 것만
drop policy if exists prereg_self on public.pre_registrations;
create policy prereg_self on public.pre_registrations
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
