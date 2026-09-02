-- 바로카드에도 큐레이션처럼 썸네일을 붙인다.
-- 썸네일은 인스타 게시물 비율(4:5 세로), 실제 동작 영상은 쇼츠 비율(9:16)이다.
-- 여러 번 실행해도 안전합니다.

alter table public.quick_cards
  add column if not exists cover_url   text,
  add column if not exists thumb_text  text,
  add column if not exists thumb_font  text not null default 'pretendard',
  add column if not exists thumb_pos   text not null default 'tl',
  add column if not exists thumb_color text not null default '#FFFFFF';
