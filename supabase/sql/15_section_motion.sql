-- 큐레이션 본문 마디에 사진 대신(또는 사진과 함께) 반복 동작을 넣을 수 있게 한다.
-- 동작 뽑기 도구에서 받은 JSON 주소를 담는다.
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists s1_motion text,
  add column if not exists s2_motion text,
  add column if not exists s3_motion text,
  add column if not exists s4_motion text;
