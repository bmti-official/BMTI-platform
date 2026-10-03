-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 64. 검색어 칸 — 콘텐츠마다 '손님이 이 말로 찾으면 나와야 한다'는 말을 직접 적어 둔다.
--
-- 검색은 제목·부위·도구·설명 글과 말 사전으로 찾는다. 그래도 안 걸리는 말
-- (예: 그 동작만의 별명, 자주 묻는 증상)을 콘텐츠에 바로 붙여 두는 칸이다.
-- 여기 적은 말은 제목과 같은 무게로 걸린다. 비워 두어도 검색은 그대로 된다.
-- 여러 번 실행해도 안전합니다.
alter table public.quick_cards    add column if not exists keywords text[] not null default '{}';
alter table public.curation_items add column if not exists keywords text[] not null default '{}';
alter table public.routines       add column if not exists keywords text[] not null default '{}';

-- 확인 — 세 줄이 나오면 성공
--   curation_items | keywords / quick_cards | keywords / routines | keywords
select table_name as 표, column_name as 칸
  from information_schema.columns
 where table_schema = 'public' and column_name = 'keywords'
   and table_name in ('quick_cards', 'curation_items', 'routines')
 order by 1;
