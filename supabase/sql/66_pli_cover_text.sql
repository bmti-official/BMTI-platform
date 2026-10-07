-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 66. 플리 표지 문구 — 이용자도 마이플리 표지에 문구를 적을 수 있게 되면서, 서버에서도 지킨다.
--
-- 지금까지는 플리 '이름'만 쓸 수 없는 말을 걸렀다. 표지 문구는 공개하면 남에게 보이는 글이라
-- 같은 기준으로 거르고, 길이도 40자로 묶는다. 표지에 따로 올린 그림(cover_url)은 이제 쓰지 않으므로
-- 이용자 플리에서는 늘 비운다(표지는 담긴 동작의 그림이 차례로 나온다).
-- 52번의 함수에 세 줄만 더한 것이다. 여러 번 실행해도 안전합니다.
create or replace function public.guard_my_routine()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nick text; v_code text;
begin
  if new.owner_id is null then return new; end if;            -- 공식 플리는 관리자 몫 — 여기서 손대지 않는다

  if not public.is_admin() then
    -- 이용자는 공식 칸·숫자를 못 바꾼다
    new.published := false;
    new.cover_url := null;                                    -- 표지에 따로 그림을 올리지 못한다
    if tg_op = 'UPDATE' then
      new.owner_id := old.owner_id;
      new.view_count := old.view_count; new.save_count := old.save_count;
      new.finish_count := old.finish_count; new.start_count := old.start_count;
      new.kept_copy := old.kept_copy;
      -- 숨김은 관리자만 — 숨겨진 플리는 스스로 다시 올릴 수 없다
      if old.share_state = 'hidden' and new.share_state <> 'hidden' then
        raise exception '관리자가 숨긴 플리는 다시 올릴 수 없어요.' using errcode = '42501';
      end if;
    end if;
    if new.share_state = 'hidden' and (tg_op = 'INSERT' or old.share_state <> 'hidden') then
      raise exception '숨김은 관리자만 정할 수 있어요.' using errcode = '42501';
    end if;
  end if;

  -- 이름과 표지 문구에 쓸 수 없는 말
  if public.bad_name(new.title_z) or public.bad_name(new.title_m) then
    raise exception '플리 이름에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;
  new.thumb_text := nullif(left(btrim(coalesce(new.thumb_text, '')), 40), '');
  if new.thumb_text is not null and public.bad_name(new.thumb_text) then
    raise exception '표지 문구에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;

  -- 바디플리에 올릴 때 — 올린 때와 만든 사람(닉네임·유형)을 적어 둔다.
  -- 닉네임이 거르기에 걸리면 비워 둔다(유형 캐릭터만 보인다).
  if new.share_state = 'public' then
    if tg_op = 'INSERT' or old.share_state <> 'public' then new.shared_at := now(); end if;
    select u.nickname, left(coalesce(u.bmti_type, ''), 4) into v_nick, v_code
      from public.users u where u.id = new.owner_id;
    new.author_code := nullif(v_code, '');
    new.author_nick := case when new.show_nick and v_nick is not null and not public.bad_name(v_nick) then v_nick else null end;
  elsif new.share_state = 'private' then
    new.shared_at := null;
  end if;
  return new;
end $$;

-- 확인 — '1'이 나오면 성공(함수에 표지 문구 거르기가 들어갔다)
select count(*) as 표지_문구_거르기
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'guard_my_routine' and pg_get_functiondef(p.oid) like '%표지 문구에 쓸 수 없는 말%';
