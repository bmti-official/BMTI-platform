-- 62. 회원이 공개한 플리도 조회수를 센다.
-- 여러 번 실행해도 안전합니다.
--
-- bump_counter 는 '공개(published)된 것'만 세는데, 회원이 올린 플리는 published 가 아니라
-- share_state = 'public' 으로 공개된다. 그래서 조회수가 늘 0 이었다.
create or replace function public.bump_counter(p_table text, p_id bigint, p_field text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me   uuid := public.my_user_id();
  v_hdr  json;
  v_ip   text;
  v_who  text;
  v_new  int;
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

  if p_table = 'routines' then
    -- 공식 플리(published)와 회원이 공개한 플리(share_state = public). 내 플리를 내가 본 것은 세지 않는다.
    update public.routines set view_count = view_count + 1
     where id = p_id and (published = true or share_state = 'public')
       and (owner_id is null or owner_id is distinct from v_me);
  else
    execute format('update public.%I set view_count = view_count + 1 where id = $1 and published = true', p_table)
      using p_id;
  end if;
  get diagnostics v_new = row_count;
  return v_new > 0;
end $$;
revoke all on function public.bump_counter(text, bigint, text) from public;
grant execute on function public.bump_counter(text, bigint, text) to anon, authenticated;

-- 확인 — 1 이면 성공
select count(*) as 함수 from pg_proc where pronamespace = 'public'::regnamespace and proname = 'bump_counter';
