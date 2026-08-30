-- 마디마다 곁다리 팁 상자 하나 — '✨ ~라면?' 처럼 본문 옆에 얹는 정보.
-- 비워 두면 나오지 않습니다. 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists s1_tip_z text,
  add column if not exists s1_tip_m text,
  add column if not exists s2_tip_z text,
  add column if not exists s2_tip_m text,
  add column if not exists s3_tip_z text,
  add column if not exists s3_tip_m text,
  add column if not exists s4_tip_z text,
  add column if not exists s4_tip_m text;
