-- 56. 사전 신청(pre_registrations)도 회원을 지우면 함께 지워지게 맞춘다.
-- 다른 표들은 모두 CASCADE인데 이 표만 NO ACTION이라, 관리자가 회원을 직접 지우면 막힌다.
-- 여러 번 실행해도 안전합니다.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.pre_registrations'::regclass and contype = 'f'
       and confrelid = 'public.users'::regclass
  loop
    execute format('alter table public.pre_registrations drop constraint %I', c);
  end loop;
  alter table public.pre_registrations
    add constraint pre_registrations_user_id_fkey
    foreign key (user_id) references public.users(id) on delete cascade;
end $$;

-- 확인 — 두 줄 모두 기대한 값이면 성공
--   pre_registrations 지울 때 → CASCADE
--   행동 기록 자동 삭제 예약 → 0 4 * * *
select '사전 신청 — 회원 지울 때' as 확인,
       (select case c.confdeltype when 'c' then 'CASCADE' when 'a' then 'NO ACTION' else c.confdeltype::text end
          from pg_constraint c
         where c.conrelid = 'public.pre_registrations'::regclass and c.contype = 'f'
           and c.confrelid = 'public.users'::regclass limit 1) as 결과
union all
select '행동 기록 자동 삭제 예약',
       coalesce((select schedule from cron.job where jobname = 'purge-app-events'), '없음');
