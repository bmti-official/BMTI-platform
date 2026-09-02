-- ===================================================================
-- 2단계 — 활짝 열려 있던 문을 닫는다
-- ===================================================================
-- ⚠️ 13_auth_link.sql을 먼저 실행하고,
--    로그인·다이어리·건강 기록이 모두 잘 되는 걸 확인한 뒤에 실행하세요.
--    이걸 실행하면 로그인하지 않은 사람은 자기 기록도 못 씁니다.
--
-- 되돌리려면 이 파일 맨 아래 주석의 문장을 실행하면 됩니다.

drop policy if exists "allow anon all - users"                  on public.users;
drop policy if exists "allow anon all - bmti_history"            on public.bmti_history;
drop policy if exists "allow anon all - health_records"          on public.health_records;
drop policy if exists "allow anon all - health_record_consents"  on public.health_record_consents;
drop policy if exists "allow anon all - pre_registrations"       on public.pre_registrations;
drop policy if exists "diary_entries_open"                       on public.diary_entries;
drop policy if exists "mallang_hist_all"                         on public.mallang_info_history;

-- 누구나 지우고·넣고·읽던 건강 기록 정책도 함께 없앤다
drop policy if exists "Anyone can delete health_records" on public.health_records;
drop policy if exists "Anyone can insert health_records" on public.health_records;
drop policy if exists "Anyone can select health_records" on public.health_records;

-- 쓰지 않는 옛 표는 관리자만 보게 좁힌다
drop policy if exists "curation_all" on public.curation_content;

-- 방문자 수는 숫자만 있는 표라 계속 열어 두되, 지우지는 못하게 한다.
drop policy if exists "allow anon all - visitor_counts" on public.visitor_counts;
create policy visitor_counts_rw on public.visitor_counts
  for select using (true);
create policy visitor_counts_ins on public.visitor_counts
  for insert with check (true);
create policy visitor_counts_upd on public.visitor_counts
  for update using (true) with check (true);

drop policy if exists "allow anon all - visitor_total" on public.visitor_total;
create policy visitor_total_sel on public.visitor_total
  for select using (true);
create policy visitor_total_upd on public.visitor_total
  for update using (true) with check (true);

-- 되돌리기(문제가 생겼을 때만):
--   create policy "allow anon all - users" on public.users for all using (true) with check (true);
--   create policy "diary_entries_open" on public.diary_entries for all using (true) with check (true);
--   create policy "allow anon all - health_records" on public.health_records for all using (true) with check (true);
--   create policy "allow anon all - health_record_consents" on public.health_record_consents for all using (true) with check (true);
--   create policy "allow anon all - bmti_history" on public.bmti_history for all using (true) with check (true);
--   create policy "mallang_hist_all" on public.mallang_info_history for all using (true) with check (true);
--   create policy "allow anon all - pre_registrations" on public.pre_registrations for all using (true) with check (true);
