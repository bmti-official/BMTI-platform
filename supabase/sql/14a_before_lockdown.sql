-- Supabase SQL 편집기에 붙여넣으세요.
-- ===================================================================
-- 문을 잠그기 직전에 — 잠그면 망가지는 두 곳을 먼저 고친다
-- ===================================================================
-- 14_lockdown.sql 바로 앞에 실행하세요. 이것만 실행해도 사이트는 그대로 돌아갑니다.

-- ── 1. 닉네임 겹침 확인 ─────────────────────────────────────
-- 문을 잠그면 남의 줄이 안 보여서, 겹침 확인이 늘 '쓸 수 있음'으로 나옵니다.
-- 그러면 같은 닉네임이 둘 생깁니다.
-- 줄을 보여 주지 않고 '있다·없다'만 돌려주는 함수로 바꿉니다.
create or replace function public.nickname_taken(p_nickname text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.users
     where lower(trim(nickname)) = lower(trim(p_nickname))
       and (auth_id is null or auth_id <> auth.uid())
  );
$$;

revoke all on function public.nickname_taken(text) from public;
grant execute on function public.nickname_taken(text) to anon, authenticated;

-- ── 2. 아직 안 이어진 회원을 위한 안전망 ────────────────────
-- link_my_account 는 카카오 번호로 찾아 매답니다(이미 만들어 두었습니다).
-- 로그인해서 들어오면 저절로 이어지므로, 아직 안 이어진 분도
-- 다음 카카오 로그인 한 번이면 자기 기록을 되찾습니다.
-- 여기서는 그 함수가 제대로 있는지만 확인합니다.
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'link_my_account') then
    raise exception '13_auth_link.sql 을 먼저 실행해 주세요';
  end if;
end $$;
