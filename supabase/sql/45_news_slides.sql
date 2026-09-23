-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 45. 읽을거리를 카드뉴스로 — 사진마다 글을 얹어 옆으로 넘겨 본다.
--
-- 담는 모양 (사진별로 묶는다. 평평한 목록으로 두면 같은 사진을 매번 다시 골라야 한다)
--   [
--     { "image": "https://…", "y": 88, "texts": ["첫 장 글", "같은 사진에 얹히는 둘째 장 글"] },
--     { "image": "https://…", "y": 88, "texts": ["셋째 장 글"] }
--   ]
--   y … 글의 아래 선이 사진 위아래 어디쯤에 놓일지 (0 맨 위 ~ 100 맨 아래)
--
-- 비워 두면 예전처럼 긴 글(body_z·body_m)로 보여 준다.
-- 기존 열 편은 그대로 두고 새로 쓰는 글부터 쓴다.
--
-- 검색 유입을 잃지 않으려고, 저장할 때 슬라이드 글을 이어 붙여 body 에도 담는다.
-- 정적 페이지 생성기(gen-magazine.mjs)가 body 를 읽으므로 손댈 것이 없다.
alter table public.curation_items
  add column if not exists slides_z jsonb,
  add column if not exists slides_m jsonb;
