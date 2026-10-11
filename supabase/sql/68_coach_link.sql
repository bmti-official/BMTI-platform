-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 68. 강사–회원 연결 2단계 — 과제 링크 · 연결(동의) · 과제
--
-- 흐름: 강사가 자기 플리로 링크를 만든다 → 회원이 링크를 열고 로그인·동의한다 → 연결되고 과제가 생긴다.
--
-- 지키는 것
--   · 표에 직접 쓰는 길은 열지 않는다. 쓰는 일은 모두 아래 함수가 맡고, 함수가 매번 누구인지 확인한다.
--   · 회원 한 명은 강사 한 명과만 연결된다.
--   · 건강 정보 한 장은 회원이 고른 때에만, 그 순간의 내용을 사본으로 담는다(연결한 날 것만).
--     연결을 끊거나 '그만 나누기'를 누르면 사본을 지운다.
--   · 강사에게 회원 표(users)를 열지 않는다.
--   · 강사가 보낸 플리는 받은 회원만 읽을 수 있다(읽기 정책을 하나 '더한다' — 있던 정책은 건드리지 않는다).
-- 맨 끝에서 '로그인하지 않은 손님'으로 바디플리를 읽어 보고, 읽히지 않으면 전부 되돌린다.
-- 여러 번 실행해도 안전합니다.
begin;

-- ── ① 표 ─────────────────────────────────────────────────────
-- 과제 링크 — 강사 + 플리. 여러 회원에게 보낼 수 있고 14일 뒤 닫힌다.
create table if not exists public.coach_links (
  code        text        primary key,                                                        -- 추측할 수 없는 값
  coach_id    uuid        not null references public.coaches(user_id) on delete cascade,
  routine_id  bigint      not null references public.routines(id) on delete cascade,
  note        text        not null default '' check (char_length(note) <= 60),                -- 한마디
  per_week    int         check (per_week between 1 and 7),                                   -- 주 몇 번
  active      boolean     not null default true,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index if not exists coach_links_coach_idx on public.coach_links (coach_id, routine_id);

-- 연결 — 회원 번호가 열쇠라서 한 회원은 한 강사와만 이어진다.
create table if not exists public.coach_members (
  member_id    uuid        primary key references public.users(id) on delete cascade,
  coach_id     uuid        not null references public.coaches(user_id) on delete cascade,
  alias        text        not null default '' check (char_length(alias) <= 20),              -- 강사만 보는 별칭
  share_sheet  boolean     not null default false,                                            -- 건강 정보 한 장을 보냈는가
  sheet        jsonb,                                                                         -- 보낸 순간의 사본
  sheet_at     timestamptz,
  consent_ver  text        not null,                                                          -- 동의문 판
  consent_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists coach_members_coach_idx on public.coach_members (coach_id);

-- 과제 — 강사가 회원에게 보낸 플리
create table if not exists public.coach_tasks (
  id          bigserial   primary key,
  coach_id    uuid        not null references public.coaches(user_id) on delete cascade,
  member_id   uuid        not null references public.users(id) on delete cascade,
  routine_id  bigint      not null references public.routines(id) on delete cascade,
  note        text        not null default '' check (char_length(note) <= 60),
  per_week    int         check (per_week between 1 and 7),
  sent_at     timestamptz not null default now(),
  unique (member_id, routine_id)
);
create index if not exists coach_tasks_coach_idx on public.coach_tasks (coach_id);
create index if not exists coach_tasks_routine_idx on public.coach_tasks (routine_id);

alter table public.coach_links   enable row level security;
alter table public.coach_members enable row level security;
alter table public.coach_tasks   enable row level security;

-- ── ② 읽기 정책 — 쓰기 정책은 없다(함수만 쓴다) ─────────────
-- 손님이 읽는 표의 정책에서도 불리므로, 손님에게도 실행을 허락해 둔다(손님에게는 늘 거짓).
grant execute on function public.is_coach() to anon;

-- 링크: 만든 강사와 관리자
drop policy if exists coach_links_read on public.coach_links;
create policy coach_links_read on public.coach_links
  for select using (coach_id = public.my_user_id() or public.is_admin());

-- 연결: 관리자만 표로 읽는다. 회원은 my_coach() 로 자기 것만 본다(별칭은 회원에게 가지 않는다).
drop policy if exists coach_members_admin on public.coach_members;
create policy coach_members_admin on public.coach_members
  for select using (public.is_admin());

-- 과제: 받은 회원 · 보낸 강사(활동 중일 때) · 관리자
drop policy if exists coach_tasks_read on public.coach_tasks;
create policy coach_tasks_read on public.coach_tasks
  for select using (
    member_id = public.my_user_id()
    or (coach_id = public.my_user_id() and public.is_coach())
    or public.is_admin()
  );

-- 지금 로그인한 회원이 이 플리를 과제로 받았는가
create or replace function public.has_task(p_routine_id bigint)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.coach_tasks t
                  where t.routine_id = p_routine_id and t.member_id = public.my_user_id());
$$;
grant execute on function public.has_task(bigint) to anon, authenticated;

-- 강사의 플리는 비공개여도, 과제로 받은 회원은 읽을 수 있다. (있던 읽기 정책에 하나를 더한다)
drop policy if exists routines_read_task on public.routines;
create policy routines_read_task on public.routines
  for select using (public.has_task(id));
drop policy if exists routine_cards_read_task on public.routine_cards;
create policy routine_cards_read_task on public.routine_cards
  for select using (public.has_task(routine_id));

-- ── ③ 강사가 쓰는 함수 ───────────────────────────────────────
-- 링크 만들기 — 이 플리의 살아 있는 링크가 있으면 그것을 고쳐 다시 쓴다(주소가 바뀌지 않게).
create or replace function public.make_coach_link(p_routine_id bigint, p_note text default '', p_per_week int default null)
returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me   uuid := public.my_user_id();
  v_note text := left(btrim(coalesce(p_note, '')), 60);
  v_week int  := case when p_per_week between 1 and 7 then p_per_week else null end;
  v_code text;
begin
  if v_me is null or not public.is_coach() then
    raise exception '강사만 보낼 수 있어요.' using errcode = '42501';
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

  select code into v_code from public.coach_links
   where coach_id = v_me and routine_id = p_routine_id and active and expires_at > now()
   order by created_at desc limit 1;
  if v_code is not null then
    update public.coach_links
       set note = v_note, per_week = v_week, expires_at = now() + interval '14 days'
     where code = v_code;
    return v_code;
  end if;

  v_code := substr(md5(gen_random_uuid()::text || gen_random_uuid()::text), 1, 20);
  insert into public.coach_links (code, coach_id, routine_id, note, per_week, expires_at)
  values (v_code, v_me, p_routine_id, v_note, v_week, now() + interval '14 days');
  return v_code;
end $$;

-- 링크 끄기 — 내가 만든 것만
create or replace function public.close_coach_link(p_code text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  update public.coach_links set active = false
   where code = p_code and coach_id = public.my_user_id();
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- ── ④ 회원이 쓰는 함수 ───────────────────────────────────────
-- 링크 미리 보기 — 로그인 전에도 본다. 강사 이름·센터와 플리 제목·담긴 동작만 돌려준다.
create or replace function public.peek_coach_link(p_code text)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_me   uuid := public.my_user_id();
  l      public.coach_links%rowtype;
  c      public.coaches%rowtype;
  v_mine uuid;
begin
  select * into l from public.coach_links where code = p_code;
  if not found then return jsonb_build_object('ok', false, 'why', 'none'); end if;
  select * into c from public.coaches where user_id = l.coach_id;
  if not found or not c.active or not l.active or l.expires_at <= now() then
    return jsonb_build_object('ok', false, 'why', 'closed');
  end if;
  if v_me is not null then
    select coach_id into v_mine from public.coach_members where member_id = v_me;
  end if;
  return jsonb_build_object(
    'ok', true,
    'coach_name', c.display_name, 'center_name', c.center_name, 'area', c.area,
    'title', (select r.title_z from public.routines r where r.id = l.routine_id),
    'cover_text', (select r.thumb_text from public.routines r where r.id = l.routine_id),
    'card_ids', coalesce((select jsonb_agg(rc.card_id order by rc.position)
                            from public.routine_cards rc where rc.routine_id = l.routine_id), '[]'::jsonb),
    'note', l.note, 'per_week', l.per_week,
    'is_me', v_me is not null and v_me = l.coach_id,
    'connected', v_mine is not null and v_mine = l.coach_id,
    'other_coach', v_mine is not null and v_mine <> l.coach_id
  );
end $$;

-- 링크 받기 — 처음이면 동의를 기록하고 연결한다. 이미 이 강사와 연결돼 있으면 과제만 더한다.
create or replace function public.accept_coach_link(p_code text, p_share_sheet boolean default false, p_consent_ver text default '')
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me    uuid := public.my_user_id();
  l       public.coach_links%rowtype;
  v_cur   uuid;
  v_u     jsonb;
  v_share boolean := coalesce(p_share_sheet, false);
begin
  if v_me is null then
    raise exception '로그인한 뒤에 받을 수 있어요.' using errcode = '42501';
  end if;
  select k.* into l from public.coach_links k join public.coaches c on c.user_id = k.coach_id
   where k.code = p_code and k.active and k.expires_at > now() and c.active;
  if not found then return jsonb_build_object('ok', false, 'why', 'closed'); end if;
  if l.coach_id = v_me then return jsonb_build_object('ok', false, 'why', 'self'); end if;

  select coach_id into v_cur from public.coach_members where member_id = v_me;
  if v_cur is not null and v_cur <> l.coach_id then
    return jsonb_build_object('ok', false, 'why', 'other_coach');
  end if;

  if v_cur is null then
    if btrim(coalesce(p_consent_ver, '')) = '' then
      return jsonb_build_object('ok', false, 'why', 'consent');
    end if;
    select to_jsonb(x) into v_u from public.users x where x.id = v_me;
    insert into public.coach_members (member_id, coach_id, share_sheet, sheet, sheet_at, consent_ver)
    values (v_me, l.coach_id, v_share,
      case when v_share then jsonb_build_object(
        'sore', v_u -> 'mallang_sore', 'sore_since', v_u -> 'sore_since',
        'exercise_frequency', v_u -> 'exercise_frequency', 'exercise_goals', v_u -> 'exercise_goals',
        'common_posture', v_u -> 'common_posture', 'coach_note', v_u -> 'coach_note') end,
      case when v_share then now() end,
      left(btrim(p_consent_ver), 20));
  end if;

  insert into public.coach_tasks (coach_id, member_id, routine_id, note, per_week)
  values (l.coach_id, v_me, l.routine_id, l.note, l.per_week)
  on conflict (member_id, routine_id)
  do update set coach_id = excluded.coach_id, note = excluded.note, per_week = excluded.per_week, sent_at = now();
  return jsonb_build_object('ok', true);
end $$;

-- 내 강사 — 연결돼 있지 않으면 null
create or replace function public.my_coach()
returns jsonb
language sql stable security definer set search_path = public, pg_temp as $$
  select jsonb_build_object(
           'coach_name', c.display_name, 'center_name', c.center_name, 'area', c.area, 'active', c.active,
           'share_sheet', m.share_sheet, 'sheet_at', m.sheet_at, 'since', m.created_at)
    from public.coach_members m join public.coaches c on c.user_id = m.coach_id
   where m.member_id = public.my_user_id();
$$;

-- 건강 정보 한 장을 지금 내용으로 (다시) 보낸다 — 회원이 누를 때만
create or replace function public.send_sheet_to_coach()
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_u  jsonb;
  v_n  int;
begin
  if v_me is null then return false; end if;
  select to_jsonb(x) into v_u from public.users x where x.id = v_me;
  update public.coach_members
     set share_sheet = true, sheet_at = now(),
         sheet = jsonb_build_object(
           'sore', v_u -> 'mallang_sore', 'sore_since', v_u -> 'sore_since',
           'exercise_frequency', v_u -> 'exercise_frequency', 'exercise_goals', v_u -> 'exercise_goals',
           'common_posture', v_u -> 'common_posture', 'coach_note', v_u -> 'coach_note')
   where member_id = v_me;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 건강 정보 그만 나누기 — 사본을 지운다
create or replace function public.stop_sharing_sheet()
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_n int;
begin
  update public.coach_members set share_sheet = false, sheet = null, sheet_at = null
   where member_id = public.my_user_id();
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 연결 끊기 — 연결과 받은 과제를 지운다. 내가 한 기록(card_finishes)은 내 것이라 그대로 남는다.
create or replace function public.leave_coach()
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := public.my_user_id();
  v_n  int;
begin
  if v_me is null then return false; end if;
  delete from public.coach_tasks where member_id = v_me;
  delete from public.coach_members where member_id = v_me;
  get diagnostics v_n = row_count;
  return v_n > 0;
end $$;

-- 누가 부를 수 있는가 — 미리 보기만 손님에게 열고, 나머지는 로그인한 사람만
revoke all on function public.make_coach_link(bigint, text, int)      from public, anon;
revoke all on function public.close_coach_link(text)                  from public, anon;
revoke all on function public.peek_coach_link(text)                   from public;
revoke all on function public.accept_coach_link(text, boolean, text)  from public, anon;
revoke all on function public.my_coach()                              from public, anon;
revoke all on function public.send_sheet_to_coach()                   from public, anon;
revoke all on function public.stop_sharing_sheet()                    from public, anon;
revoke all on function public.leave_coach()                           from public, anon;
grant execute on function public.peek_coach_link(text)                  to anon, authenticated;
grant execute on function public.make_coach_link(bigint, text, int)     to authenticated;
grant execute on function public.close_coach_link(text)                 to authenticated;
grant execute on function public.accept_coach_link(text, boolean, text) to authenticated;
grant execute on function public.my_coach()                             to authenticated;
grant execute on function public.send_sheet_to_coach()                  to authenticated;
grant execute on function public.stop_sharing_sheet()                   to authenticated;
grant execute on function public.leave_coach()                          to authenticated;

-- ── ⑤ 안전 확인 — 손님으로 바디플리를 읽어 본다 ──────────────
-- 읽기 정책을 더했으니, 로그인하지 않은 손님이 예전처럼 공개 플리를 다 읽는지 본다.
-- 하나라도 덜 읽히거나 오류가 나면 여기서 멈추고, 위에서 한 일이 모두 되돌려진다.
do $$
declare
  n_pub  int;
  n_anon int;
begin
  select count(*) into n_pub from public.routines
   where (owner_id is null and published) or (owner_id is not null and share_state = 'public');
  set local role anon;
  select count(*) into n_anon from public.routines;
  perform count(*) from public.routine_cards;
  reset role;
  if n_anon <> n_pub then
    raise exception '손님이 읽는 플리 수가 달라졌습니다(공개 % · 손님 %). 적용하지 않습니다.', n_pub, n_anon;
  end if;
end $$;

commit;
notify pgrst, 'reload schema';

-- 확인 — '3 · 5 · 9'가 나오면 성공(표 셋, 정책 다섯, 함수 아홉)
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name in ('coach_links', 'coach_members', 'coach_tasks')) as 표,
  (select count(*) from pg_policies where schemaname = 'public'
    and policyname in ('coach_links_read', 'coach_members_admin', 'coach_tasks_read', 'routines_read_task', 'routine_cards_read_task')) as 정책,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('has_task', 'make_coach_link', 'close_coach_link', 'peek_coach_link',
      'accept_coach_link', 'my_coach', 'send_sheet_to_coach', 'stop_sharing_sheet', 'leave_coach')) as 함수;
