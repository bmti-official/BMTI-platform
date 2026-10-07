-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 65. 건강 정보 한 장 — '현재 일상 정보'에 두 칸을 더한다.
--
-- 마이페이지의 '현재 일상 정보'(불편한 부위·운동 빈도·목적·자주 하는 자세)를
-- '건강 정보 한 장'으로 합치면서, 강사가 처음 파악할 때 필요한 두 가지를 더 받는다.
--   sore_since  불편이 얼마나 됐는지(1주 안쪽 · 한 달쯤 · 석 달쯤 · 1년쯤 · 그보다 오래)
--   coach_note  강사에게 미리 알릴 말 — 강사와 연결하는 기능이 나올 때부터 받는다(지금은 비워 둔다)
-- 여러 번 실행해도 안전합니다.
alter table public.users                add column if not exists sore_since text;
alter table public.users                add column if not exists coach_note text;
alter table public.mallang_info_history add column if not exists sore_since text;
alter table public.mallang_info_history add column if not exists coach_note text;

-- 확인 — 네 줄이 나오면 성공
select table_name as 표, column_name as 칸
  from information_schema.columns
 where table_schema = 'public' and column_name in ('sore_since', 'coach_note')
   and table_name in ('users', 'mallang_info_history')
 order by 1, 2;
