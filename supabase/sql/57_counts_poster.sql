-- 57. 저장수를 보관함과 맞춰 세고, 바로카드에 격자용 그림 칸을 더한다.
-- 여러 번 실행해도 안전합니다.
--
--   ① quick_cards.poster_url — 격자(둘러보기·보관함)에 깔 작은 그림. 영상은 카드를 열 때만 튼다.
--   ② 저장수(save_count) — 보관함에 담기면 +1, 빠지면 -1. 서버가 스스로 세서 숫자를 부풀릴 수 없다.
--   ③ 지금까지 담긴 것만큼 저장수를 맞춘다(오늘 배포 뒤 담긴 것)

-- ── ① 격자용 그림 ─────────────────────────────────────────────
alter table public.quick_cards add column if not exists poster_url text;

-- ── ② 보관함에 담기고 빠질 때 저장수를 센다 ───────────────────────
create or replace function public.count_saves()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  typ text;
  iid bigint;
  tbl text;
  d   int;
begin
  if tg_op = 'INSERT' then typ := new.item_type; iid := new.item_id; d := 1;
  else typ := old.item_type; iid := old.item_id; d := -1; end if;
  tbl := case typ when 'card' then 'quick_cards' when 'routine' then 'routines'
                  when 'curation' then 'curation_items' end;
  if tbl is null then return null; end if;
  execute format('update public.%I set save_count = greatest(0, save_count + $1) where id = $2', tbl)
    using d, iid;
  return null;
end $$;

drop trigger if exists saved_items_count on public.saved_items;
create trigger saved_items_count
  after insert or delete on public.saved_items
  for each row execute function public.count_saves();

-- ── ③ 이미 담긴 것만큼 맞춘다 ─────────────────────────────────
update public.quick_cards q set save_count = greatest(q.save_count,
  (select count(*) from public.saved_items s where s.item_type = 'card' and s.item_id = q.id));
update public.routines r set save_count = greatest(r.save_count,
  (select count(*) from public.saved_items s where s.item_type = 'routine' and s.item_id = r.id));
update public.curation_items c set save_count = greatest(c.save_count,
  (select count(*) from public.saved_items s where s.item_type = 'curation' and s.item_id = c.id));

-- 확인 — poster_url 한 줄과 트리거 한 줄이 보이면 성공
select 'poster_url 칸' as 확인, count(*)::text as 결과 from information_schema.columns
 where table_schema = 'public' and table_name = 'quick_cards' and column_name = 'poster_url'
union all
select '저장수 세기', count(*)::text from pg_trigger where tgname = 'saved_items_count';
