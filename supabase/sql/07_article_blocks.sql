-- 큐레이션 글에 리듬을 준다 — 마디마다 소제목·사진 설명·핵심 한 줄, 그리고 숫자 카드.
-- 채우지 않은 칸은 글에 나오지 않는다.
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists s1_h_z   text,
  add column if not exists s1_h_m   text,
  add column if not exists s1_key_z text,
  add column if not exists s1_key_m text,
  add column if not exists s1_caps  text[] not null default '{}',
  add column if not exists s2_h_z   text,
  add column if not exists s2_h_m   text,
  add column if not exists s2_key_z text,
  add column if not exists s2_key_m text,
  add column if not exists s2_caps  text[] not null default '{}',
  add column if not exists s3_h_z   text,
  add column if not exists s3_h_m   text,
  add column if not exists s3_key_z text,
  add column if not exists s3_key_m text,
  add column if not exists s3_caps  text[] not null default '{}',
  add column if not exists s4_h_z   text,
  add column if not exists s4_h_m   text,
  add column if not exists s4_key_z text,
  add column if not exists s4_key_m text,
  add column if not exists s4_caps  text[] not null default '{}',
  add column if not exists stats jsonb not null default '[]'::jsonb;
