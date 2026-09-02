-- 바로카드에 붙일 동작 데이터(JSON) 주소.
-- bmti-official.co.kr/tools/motion.html 에서 뽑은 파일을 올리고 그 주소를 담는다.
-- 여러 번 실행해도 안전합니다.

alter table public.quick_cards
  add column if not exists motion_url text;
