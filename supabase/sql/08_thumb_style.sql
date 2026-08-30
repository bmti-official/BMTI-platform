-- 썸네일 문구의 글씨체·자리·색을 관리자가 고른다.
-- (제목·소제목·본문·핵심 한 줄·초록·숫자 카드의 글씨체는 사이트가 정해 둔 값으로 고정)
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists thumb_font  text not null default 'pretendard',
  add column if not exists thumb_pos   text not null default 'tl',
  add column if not exists thumb_color text not null default '#FFFFFF';
