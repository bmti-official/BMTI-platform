-- Supabase Security Advisor 경고 정리 — 확실히 안전한 것만 손봅니다.
-- (RLS 정책 검토는 이 파일에 넣지 않았습니다. 먼저 눈으로 확인해야 합니다.)
-- 여러 번 실행해도 안전합니다.

-- ── 1. Function Search Path Mutable ───────────────────────────
-- 함수가 어떤 스키마를 먼저 볼지 정해 두지 않으면, 이름이 같은 가짜 함수에
-- 속을 수 있습니다. public 스키마의 모든 함수에 search_path를 못박습니다.
-- 함수 내용은 건드리지 않고 설정만 붙이므로 동작이 바뀌지 않습니다.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.prokind = 'f'
       and (p.proconfig is null or not exists (
             select 1 from unnest(p.proconfig) c where c like 'search_path=%'))
  loop
    execute format('alter function %s set search_path = public, pg_temp', r.sig);
  end loop;
end $$;

-- ── 2. SECURITY DEFINER 함수 실행 권한 ────────────────────────
-- purge_old_events(오래된 행동 기록 지우기)는 관리자가 SQL 편집기에서만
-- 부르면 되므로, 손님과 로그인 사용자 모두 못 부르게 막습니다.
revoke all on function public.purge_old_events(int) from public, anon, authenticated;

-- bump_counter(조회수·저장수 1 올리기)는 손님도 눌러야 하므로 열어 둡니다.
-- 대신 바꿀 수 있는 표와 항목이 함수 안에서 이미 제한돼 있습니다.
-- (경고는 남지만 의도한 설계입니다)

-- ── 3. 확인용 — 지금 걸려 있는 RLS 정책을 모두 본다 ───────────
-- 아래를 따로 실행해서 결과를 살펴보세요.
-- '읽기(SELECT)'인데 조건이 true인 표가 있으면 그 표는 누구나 다 읽을 수 있습니다.
--
--   select tablename, policyname, cmd,
--          coalesce(qual, '—')       as "읽을 수 있는 조건",
--          coalesce(with_check, '—') as "쓸 수 있는 조건"
--     from pg_policies
--    where schemaname = 'public'
--    order by tablename, cmd;
