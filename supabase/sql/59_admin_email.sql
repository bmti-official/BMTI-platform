-- 59. 관리자 로그인 이메일을 실제로 쓰는 주소로 바꾼다.
-- 비밀번호·관리자 권한은 그대로다. 여러 번 실행해도 안전합니다.
--
-- ※ 이 저장소는 공개라 실제 주소는 적어 두지 않는다. 실행할 때 '새 주소'를 채워 넣는다.
do $$
declare
  v_id  uuid;
  v_old text := 'dmdwns777@bmti.com';      -- 남의 도메인이라 재설정 메일을 받을 수 없던 주소
  v_new text := '<새 이메일 주소>';
begin
  if v_new like '<%' then raise exception '새 이메일 주소를 채워 주세요.'; end if;
  select id into v_id from auth.users where email = v_old;
  if v_id is null then
    raise notice '예전 이메일 계정을 찾지 못했어요(이미 바꿨을 수 있어요).';
    return;
  end if;
  if exists (select 1 from auth.users where email = v_new) then
    raise exception '새 이메일로 된 계정이 이미 있어요. 바꾸지 않았습니다.';
  end if;

  update auth.users
     set email = v_new,
         email_confirmed_at = coalesce(email_confirmed_at, now()),
         raw_user_meta_data = case when raw_user_meta_data ? 'email'
                                   then jsonb_set(raw_user_meta_data, '{email}', to_jsonb(v_new))
                                   else raw_user_meta_data end,
         updated_at = now()
   where id = v_id;

  update auth.identities
     set identity_data = jsonb_set(coalesce(identity_data, '{}'::jsonb), '{email}', to_jsonb(v_new)),
         updated_at = now()
   where user_id = v_id and provider = 'email';
end $$;

-- 관리자 판별에서 예전 이메일 예비 규칙을 뺀다 — 이제 관리자 표(계정 번호)만 본다
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admins where auth_id = auth.uid());
$$;

-- 확인 — 새 이메일 한 줄이 보이면 성공
select u.email as 관리자_이메일 from auth.users u join public.admins a on a.auth_id = u.id;
