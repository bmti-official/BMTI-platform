-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 바로플리에도 표지를 만든다.
-- 지금은 담긴 첫 동작의 표지를 빌려 쓰는데, 플리마다 얼굴이 따로 있어야 목록에서 구분된다.
-- 칸 이름은 큐레이션·바로카드와 같게 맞춰, 같은 화면 부품이 그대로 그린다.

alter table public.routines
  add column if not exists cover_url   text,
  add column if not exists thumb_text  text,
  add column if not exists thumb_font  text not null default 'pretendard',
  add column if not exists thumb_pos   text not null default 'bc',
  add column if not exists thumb_color text not null default '#FFFFFF',
  add column if not exists thumb_scale int  not null default 100,
  add column if not exists thumb_dx    int  not null default 0,
  add column if not exists thumb_dy    int  not null default 0;
