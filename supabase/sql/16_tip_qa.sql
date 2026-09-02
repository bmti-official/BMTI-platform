-- 곁다리 팁을 '질문'과 '답변' 두 칸으로 나눈다.
-- 지금까지 적어 둔 팁은 '답변' 칸(s*_tip_*)에 그대로 남는다.
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists s1_tipq_z text,
  add column if not exists s1_tipq_m text,
  add column if not exists s2_tipq_z text,
  add column if not exists s2_tipq_m text,
  add column if not exists s3_tipq_z text,
  add column if not exists s3_tipq_m text,
  add column if not exists s4_tipq_z text,
  add column if not exists s4_tipq_m text;
