-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 69. 강사–회원 연결 3단계 — 강사 화면(내 회원 · 수행 확인 · 건강 정보 사본 · 링크 없이 바로 보내기)
--
-- 표와 정책은 그대로 두고, 강사가 쓰는 함수 다섯 개만 더한다.
-- 지키는 것
--   · 함수마다 '활동 중인 강사인가'를 먼저 본다. 쉬게 하거나 지정을 풀면 곧바로 아무것도 볼 수 없다.
--   · 강사는 '자기와 연결된 회원'만 본다.
--   · 수행 기록은 '이 강사가 보낸 과제'에 한해서만 돌려준다(회원이 따로 한 운동은 주지 않는다).
--   · 건강 정보 한 장은 회원이 보내기로 한 사본만 돌려준다. 회원 표(users)에서는 닉네임만 꺼낸다.
-- 여러 번 실행해도 안전합니다.
begin;

-- 내 회원 한눈에 — 회원마다 닉네임·별칭·건강 정보 사본·보낸 과제·과제를 한 날(최근 5주)
create or replace function public.coach_overview()
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 볼 수 있어요.' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'member_id', m.member_id,
      'nickname', u.nickname,
      'alias', m.alias,
      'since', m.created_at,
      'share_sheet', m.share_sheet,
      'sheet', case when m.share_sheet then m.sheet end,
      'sheet_at', case when m.share_sheet then m.sheet_at end,
      'tasks', coalesce((
        select jsonb_agg(jsonb_build_object(
                 'id', t.id, 'routine_id', t.routine_id, 'title', r.title_z,
                 'note', t.note, 'per_week', t.per_week, 'sent_at', t.sent_at) order by t.sent_at desc)
          from public.coach_tasks t join public.routines r on r.id = t.routine_id
         where t.coach_id = v_me and t.member_id = m.member_id), '[]'::jsonb),
      'done', coalesce((
        select jsonb_agg(jsonb_build_object('routine_id', f.routine_id, 'date', f.date, 'all', f.all_done))
          from (select cf.routine_id, cf.date, bool_or(cf.done) as all_done
                  from public.card_finishes cf
                 where cf.user_id = m.member_id and cf.kind = 'routine' and cf.date >= current_date - 35
                   and cf.routine_id in (select t2.routine_id from public.coach_tasks t2
                                          where t2.coach_id = v_me and t2.member_id = m.member_id)
                 group by cf.routine_id, cf.date) f), '[]'::jsonb),
      'last', (select max(cf.date) from public.card_finishes cf
                where cf.user_id = m.member_id and cf.kind = 'routine'
                  and cf.routine_id in (select t3.routine_id from public.coach_tasks t3
                                         where t3.coach_id = v_me and t3.member_id = m.member_id))
    ) order by m.created_at desc)
      from public.coach_members m join public.users u on u.id = m.member_id
     where m.coach_id = v_me), '[]'::jsonb);
end $$;

-- 별칭 — 강사만 보는 이름. 회원에게는 가지 않는다.
create or replace function public.set_member_alias(p_member uuid, p_alias text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_n  int;
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 할 수 있어요.' using errcode = '42501';
  end if;
  update public.coach_members set alias = left(btrim(coalesce(p_alias, '')), 20)
   where member_id = p_member and coach_id = v_me;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 링크 없이 바로 보내기 — 이미 연결된 회원에게, 내가 만든 플리만
create or replace function public.send_coach_task(p_member uuid, p_routine_id bigint, p_note text default '', p_per_week int default null)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me   uuid := public.my_user_id();
  v_note text := left(btrim(coalesce(p_note, '')), 60);
  v_week int  := case when p_per_week between 1 and 7 then p_per_week else null end;
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 보낼 수 있어요.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.coach_members m where m.member_id = p_member and m.coach_id = v_me) then
    raise exception '연결된 회원에게만 보낼 수 있어요.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.routines r
                  where r.id = p_routine_id and r.owner_id = v_me and coalesce(r.share_state, 'private') <> 'hidden') then
    raise exception '내가 만든 플리만 보낼 수 있어요.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.routine_cards c where c.routine_id = p_routine_id) then
    raise exception '동작이 담긴 플리만 보낼 수 있어요.' using errcode = '22023';
  end if;
  if v_note <> '' and public.bad_name(v_note) then
    raise exception '한마디에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;
  insert into public.coach_tasks (coach_id, member_id, routine_id, note, per_week)
  values (v_me, p_member, p_routine_id, v_note, v_week)
  on conflict (member_id, routine_id)
  do update set coach_id = excluded.coach_id, note = excluded.note, per_week = excluded.per_week, sent_at = now();
  return true;
end $$;

-- 과제 거두기 — 내가 보낸 것만. 회원이 한 기록은 회원의 것이라 그대로 남는다.
create or replace function public.withdraw_coach_task(p_task_id bigint)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_n  int;
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 할 수 있어요.' using errcode = '42501';
  end if;
  delete from public.coach_tasks where id = p_task_id and coach_id = v_me;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 강사 쪽에서 연결 끊기 — 연결(건강 정보 사본 포함)과 보낸 과제를 지운다
create or replace function public.drop_member(p_member uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_n  int;
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 할 수 있어요.' using errcode = '42501';
  end if;
  delete from public.coach_tasks where member_id = p_member and coach_id = v_me;
  delete from public.coach_members where member_id = p_member and coach_id = v_me;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 로그인한 사람만 부를 수 있다(안에서 다시 '활동 중인 강사인가'를 본다)
revoke all on function public.coach_overview()                          from public, anon;
revoke all on function public.set_member_alias(uuid, text)              from public, anon;
revoke all on function public.send_coach_task(uuid, bigint, text, int)  from public, anon;
revoke all on function public.withdraw_coach_task(bigint)               from public, anon;
revoke all on function public.drop_member(uuid)                         from public, anon;
grant execute on function public.coach_overview()                         to authenticated;
grant execute on function public.set_member_alias(uuid, text)             to authenticated;
grant execute on function public.send_coach_task(uuid, bigint, text, int) to authenticated;
grant execute on function public.withdraw_coach_task(bigint)              to authenticated;
grant execute on function public.drop_member(uuid)                        to authenticated;

commit;
notify pgrst, 'reload schema';

-- 확인 — '5'가 나오면 성공(함수 다섯)
select count(*) as 함수
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('coach_overview', 'set_member_alias', 'send_coach_task', 'withdraw_coach_task', 'drop_member');
