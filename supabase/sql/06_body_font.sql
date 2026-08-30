-- 제목·썸네일과 본문의 글씨체를 따로 고를 수 있게 한다.
--   font_key      = 제목·썸네일 글씨체 (이미 있던 칸)
--   font_body_key = 본문·초록 글씨체 (새로 만드는 칸)
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists font_body_key text;

-- 지금까지 쓰던 글씨체를 본문에도 그대로 물려준다.
update public.curation_items
   set font_body_key = font_key
 where font_body_key is null;
