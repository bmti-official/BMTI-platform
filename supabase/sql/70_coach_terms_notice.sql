-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 70. 강사 약관 동의 · 새 과제 알림 · 건강 정보 한 장 동의 기록
--
-- ① 강사 약관 — 강사는 약관에 동의해야 강사 기능(링크 만들기·회원 보기·과제 보내기)을 쓸 수 있다.
--    is_coach()가 '활동 중 + 약관 동의'를 함께 보도록 바꾼다. 강사 함수가 모두 is_coach()를 거치므로 한 군데만 고치면 된다.
-- ② 새 과제 알림 — 강사가 과제를 보낸 뒤 알림을 보내도 되는지 서버가 확인해 준다(task_notice).
--    '그 강사가 그 회원에게 그 플리를 보낸 것이 맞는가'를 보고, 같은 과제로 10분 안에 다시 보내지 못하게 한다.
-- ③ 건강 정보 한 장 — 건강에 관한 정보라 따로 동의를 받는다. 동의한 판과 때를 회원 줄에 적어 둔다.
-- 여러 번 실행해도 안전합니다.
begin;

-- ── ① 강사 약관 ──────────────────────────────────────────────
alter table public.coaches add column if not exists terms_ver text;
alter table public.coaches add column if not exists terms_at  timestamptz;

create or replace function public.is_coach()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.coaches
                  where user_id = public.my_user_id() and active and terms_ver is not null);
$$;

-- 약관 동의 — 지정된(활동 중인) 강사 본인만
create or replace function public.agree_coach_terms(p_ver text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_n  int;
begin
  if v_me is null or btrim(coalesce(p_ver, '')) = '' then return false; end if;
  update public.coaches set terms_ver = left(btrim(p_ver), 20), terms_at = now()
   where user_id = v_me and active;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;
revoke all on function public.agree_coach_terms(text) from public, anon;
grant execute on function public.agree_coach_terms(text) to authenticated;

-- ── ② 새 과제 알림 ───────────────────────────────────────────
alter table public.coach_tasks add column if not exists notified_at timestamptz;

-- 알림을 보내도 되는가 — 되면 알림에 쓸 말(강사 이름·플리 제목)과 받을 회원을 돌려준다.
create or replace function public.task_notice(p_member uuid, p_routine_id bigint)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_id bigint;
begin
  if v_me is null or not public.is_coach() then
    return jsonb_build_object('ok', false, 'why', 'coach');
  end if;
  update public.coach_tasks set notified_at = now()
   where coach_id = v_me and member_id = p_member and routine_id = p_routine_id
     and (notified_at is null or notified_at < now() - interval '10 minutes')
  returning id into v_id;
  if v_id is null then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  return jsonb_build_object(
    'ok', true, 'member_id', p_member,
    'coach_name', (select display_name from public.coaches where user_id = v_me),
    'title', (select title_z from public.routines where id = p_routine_id));
end $$;
revoke all on function public.task_notice(uuid, bigint) from public, anon;
grant execute on function public.task_notice(uuid, bigint) to authenticated;

-- ── ③ 건강 정보 한 장 동의 기록 ──────────────────────────────
alter table public.users add column if not exists sheet_consent_ver text;
alter table public.users add column if not exists sheet_consent_at  timestamptz;

commit;
notify pgrst, 'reload schema';

-- 확인 — '5 · 3'이 나오면 성공(새 칸 다섯, 함수 셋)
select
  (select count(*) from information_schema.columns where table_schema = 'public'
    and ((table_name = 'coaches' and column_name in ('terms_ver', 'terms_at'))
      or (table_name = 'coach_tasks' and column_name = 'notified_at')
      or (table_name = 'users' and column_name in ('sheet_consent_ver', 'sheet_consent_at')))) as 새_칸,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('is_coach', 'agree_coach_terms', 'task_notice')) as 함수;
