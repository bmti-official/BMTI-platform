-- 61. 조회수 부풀리기 막기 — 같은 사람이 같은 콘텐츠를 하루에 한 번만 센다.
-- 여러 번 실행해도 안전합니다.
--
-- 지금까지는 bump_counter 를 누구나 몇 번이든 불러 숫자를 올릴 수 있었다.
--   · 올릴 수 있는 것은 조회수(view_count)뿐 — 저장수는 보관함이 세고(57), 시작·완주 수는 쓰지 않는다
--   · 누구인지: 로그인한 회원은 회원 번호, 아니면 접속 주소(IP)를 알아볼 수 없게 바꾼 값
--   · 같은 사람·같은 콘텐츠·같은 날은 한 번만. 한 사람이 하루에 올릴 수 있는 수에도 한도를 둔다
--   · 구분용 값은 이틀 지나면 지운다(행동 기록 정리 예약에 함께 넣는다)

-- 구분용 값을 만들 때 섞는 비밀 글자 — 화면에서는 읽지 못한다(정책 없음)
create table if not exists public.app_private (
  k text primary key,
  v text not null
);
alter table public.app_private enable row level security;
insert into public.app_private (k, v)
  values ('view_salt', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
  on conflict (k) do nothing;

-- 오늘 누가 무엇을 봤는지(누구인지는 알아볼 수 없는 값) — 화면에서는 읽지 못한다(정책 없음)
create table if not exists public.view_marks (
  day     date   not null default current_date,
  who     text   not null,
  tbl     text   not null,
  item_id bigint not null,
  primary key (day, who, tbl, item_id)
);
alter table public.view_marks enable row level security;
create index if not exists view_marks_who_idx on public.view_marks (day, who);

-- 돌려주는 값이 바뀌므로(없음 → 셌는지) 지우고 다시 만든다
drop function if exists public.bump_counter(text, bigint, text);
create function public.bump_counter(p_table text, p_id bigint, p_field text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me   uuid := public.my_user_id();
  v_hdr  json;
  v_ip   text;
  v_who  text;
  v_new  int;
  v_ok   boolean := false;
begin
  if p_table not in ('curation_items', 'quick_cards', 'routines') then return false; end if;
  if p_field <> 'view_count' then return false; end if;          -- 조회수만

  if v_me is not null then
    v_who := 'u:' || v_me::text;
  else
    begin
      v_hdr := current_setting('request.headers', true)::json;
    exception when others then v_hdr := null; end;
    v_ip := split_part(coalesce(v_hdr ->> 'cf-connecting-ip', v_hdr ->> 'x-real-ip', v_hdr ->> 'x-forwarded-for', ''), ',', 1);
    if coalesce(trim(v_ip), '') = '' then return false; end if;  -- 누구인지 모르면 세지 않는다
    v_who := 'i:' || md5(trim(v_ip) || current_date::text || (select v from public.app_private where k = 'view_salt'));
  end if;

  -- 한 사람이 하루에 올릴 수 있는 한도 — 콘텐츠 300개
  if (select count(*) from public.view_marks where day = current_date and who = v_who) >= 300 then
    return false;
  end if;

  insert into public.view_marks (day, who, tbl, item_id) values (current_date, v_who, p_table, p_id)
    on conflict do nothing;
  get diagnostics v_new = row_count;
  if v_new = 0 then return false; end if;                         -- 오늘 이미 셌다

  execute format('update public.%I set view_count = view_count + 1 where id = $1 and published = true', p_table)
    using p_id;
  get diagnostics v_new = row_count;
  v_ok := v_new > 0;
  return v_ok;
end $$;
revoke all on function public.bump_counter(text, bigint, text) from public;
grant execute on function public.bump_counter(text, bigint, text) to anon, authenticated;

-- 구분용 값은 이틀 지나면 지운다 — 매일 도는 행동 기록 정리에 함께 넣는다
select cron.unschedule(jobid) from cron.job where jobname = 'purge-app-events';
select cron.schedule('purge-app-events', '0 4 * * *',
  $$select public.purge_old_events(180); delete from public.view_marks where day < current_date - 1;$$);

-- 확인 — 두 줄 모두 1 이면 성공
select '조회 표시 표' as 확인, count(*)::text as 결과 from information_schema.tables
 where table_schema = 'public' and table_name = 'view_marks'
union all
select '정리 예약', count(*)::text from cron.job
 where jobname = 'purge-app-events' and command like '%view_marks%';
