-- 54. 개인정보처리방침(2026-10-01)에 적은 약속을 실제로 지키게 한다.
-- 여러 번 실행해도 안전합니다.
--
--   ① 행동 기록(app_events)은 180일이 지나면 지운다 — 지우는 함수(02)만 있고 돌리는 예약이 없었다
--   ② 공개한 마이플리를 지우면 보관한 사람에게 남는 복사본에서 만든 사람의 닉네임·유형을 뺀다
--   ③ 확인 — 회원을 지우면 딸린 기록이 함께 지워지는지(표마다 on delete 규칙)

-- ── ① 매일 새벽 4시(한국 시각 13시 = UTC 4시)에 180일 지난 행동 기록을 지운다 ─────
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname = 'purge-app-events';
select cron.schedule('purge-app-events', '0 4 * * *', $$select public.purge_old_events(180)$$);

-- ── ② 보관해 둔 사람에게 남기는 복사본 — 만든 사람 정보는 남기지 않는다 ─────────────
create or replace function public.keep_saved_copies()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s   record;
  cp  public.routines%rowtype;
begin
  if old.owner_id is null then return old; end if;             -- 공식 플리는 해당 없음
  for s in
    select user_id from public.saved_items
     where item_type = 'routine' and item_id = old.id and user_id <> old.owner_id
  loop
    cp := old;
    cp.id := nextval(pg_get_serial_sequence('public.routines', 'id'));
    cp.owner_id := s.user_id;
    cp.share_state := 'private'; cp.shared_at := null; cp.kept_copy := true; cp.source_id := null;
    cp.show_nick := false; cp.author_nick := null; cp.author_code := null;   -- 만든 사람 정보는 빼고 동작 구성만
    cp.view_count := 0; cp.save_count := 0; cp.finish_count := 0; cp.start_count := 0;
    cp.created_at := now(); cp.updated_at := now();
    insert into public.routines values (cp.*);
    insert into public.routine_cards (routine_id, card_id, position, reps, sets, rest, side, guide)
      select cp.id, rc.card_id, rc.position, rc.reps, rc.sets, rc.rest, rc.side, rc.guide
        from public.routine_cards rc where rc.routine_id = old.id;
  end loop;
  delete from public.saved_items where item_type = 'routine' and item_id = old.id;
  return old;
end $$;

-- ── ③ 확인 — 회원(users)을 가리키는 표와 지울 때의 규칙 ──────────────────────
--   CASCADE(함께 지움) · SET NULL(번호만 비움)이면 괜찮고, NO ACTION·RESTRICT가 보이면 알려 주세요.
select c.conrelid::regclass as 표, a.attname as 칸,
       case c.confdeltype when 'c' then 'CASCADE' when 'n' then 'SET NULL' when 'a' then 'NO ACTION'
                          when 'r' then 'RESTRICT' when 'd' then 'SET DEFAULT' end as 지울_때
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
 where c.contype = 'f' and c.confrelid = 'public.users'::regclass
 order by 1;
