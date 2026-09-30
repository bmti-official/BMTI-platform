-- 55. 건강정보 동의 철회 · 회원 탈퇴 — 마이페이지 버튼이 부르는 서버 함수.
-- 여러 번 실행해도 안전합니다.
--
-- 둘 다 '지금 로그인한 본인'(my_user_id())만 지운다. 남의 번호를 넘길 칸이 없다.
-- 표마다 지우기 권한(RLS)을 따로 열지 않고, 이 함수 안에서만 지운다.
-- 없는 표는 건너뛴다(예전 기능의 표가 있을 수도, 없을 수도 있어서).

-- ── ① 건강정보 동의 철회 — 다이어리 기록과 각도기록을 지우고, 동의를 '철회'로 적는다 ─────
create or replace function public.withdraw_health_consent()
returns void
language plpgsql security definer set search_path = public as $$
declare
  me uuid := public.my_user_id();
begin
  if me is null then raise exception '로그인이 필요해요.' using errcode = '42501'; end if;
  delete from public.diary_entries  where user_id = me;
  delete from public.posture_checks where user_id = me;
  if to_regclass('public.health_records') is not null then
    execute 'delete from public.health_records where user_id = $1' using me;
  end if;
  update public.health_record_consents
     set agreed = false, version = 'withdrawn', optional_consent = false, updated_at = now()
   where user_id = me;
  if not found then
    insert into public.health_record_consents (user_id, agreed, version, optional_consent, updated_at)
         values (me, false, 'withdrawn', false, now());
  end if;
end $$;
revoke all on function public.withdraw_health_consent() from public, anon;
grant execute on function public.withdraw_health_consent() to authenticated;

-- ── ② 회원 탈퇴 — 회원에 딸린 기록을 모두 지우고, 회원 줄과 로그인 계정까지 지운다 ────────
create or replace function public.delete_my_account()
returns void
language plpgsql security definer set search_path = public as $$
declare
  me  uuid := public.my_user_id();
  aid uuid := auth.uid();
  t   text;
begin
  if me is null then raise exception '로그인이 필요해요.' using errcode = '42501'; end if;

  -- 공개한 마이플리 — 지우면 보관해 둔 사람에게 복사본이 남는다(54의 트리거). 먼저 지운다.
  delete from public.routines where owner_id = me;

  -- 회원 번호(user_id)를 가진 표들 — 있는 것만 지운다
  foreach t in array array[
    'diary_entries', 'posture_checks', 'card_finishes', 'push_subscriptions', 'saved_items',
    'bmti_history', 'mallang_info_history', 'health_records', 'health_record_consents', 'pre_registrations'
  ] loop
    if to_regclass('public.' || t) is not null then
      execute format('delete from public.%I where user_id = $1', t) using me;
    end if;
  end loop;

  -- 행동 기록은 회원 번호만 떼어 낸다(익명 통계로 남고 180일 뒤 지워진다)
  update public.app_events set user_id = null where user_id = me;

  delete from public.users where id = me;
  if aid is not null then delete from auth.users where id = aid; end if;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 확인 — 두 함수가 보이면 성공
select proname from pg_proc
 where pronamespace = 'public'::regnamespace and proname in ('withdraw_health_consent', 'delete_my_account')
 order by proname;
