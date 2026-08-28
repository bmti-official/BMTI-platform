-- 큐레이션 사진 저장소 --------------------------------------------------------
-- 관리자 화면의 '사진 올리기' 버튼이 쓰는 곳이다.
-- 이 파일을 한 번 실행하면 버킷 만들기와 권한 설정이 모두 끝난다.
-- (Supabase 대시보드에서 손으로 버킷을 만들 필요가 없다)

-- 1) 'curation' 버킷 — 손님에게 사진이 보여야 하므로 공개(public)로 둔다.
insert into storage.buckets (id, name, public)
values ('curation', 'curation', true)
on conflict (id) do update set public = true;

-- 2) 권한
--    읽기는 누구나, 올리기·바꾸기·지우기는 관리자만.
--    is_admin()은 01_curation.sql에서 이미 만들어 둔 함수를 그대로 쓴다.
drop policy if exists "curation 사진 아무나 보기" on storage.objects;
create policy "curation 사진 아무나 보기"
  on storage.objects for select
  using (bucket_id = 'curation');

drop policy if exists "curation 사진 관리자만 올리기" on storage.objects;
create policy "curation 사진 관리자만 올리기"
  on storage.objects for insert
  with check (bucket_id = 'curation' and public.is_admin());

drop policy if exists "curation 사진 관리자만 바꾸기" on storage.objects;
create policy "curation 사진 관리자만 바꾸기"
  on storage.objects for update
  using (bucket_id = 'curation' and public.is_admin())
  with check (bucket_id = 'curation' and public.is_admin());

drop policy if exists "curation 사진 관리자만 지우기" on storage.objects;
create policy "curation 사진 관리자만 지우기"
  on storage.objects for delete
  using (bucket_id = 'curation' and public.is_admin());
