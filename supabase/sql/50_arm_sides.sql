-- 50) 어깨 들림을 좌우 따로 담는다.
--
-- 한쪽만 안 올라가는 일이 흔한데, 지금은 둘 중 큰 값만 남겨서
-- 안 올라가는 쪽이 기록에서 사라졌다. 추세는 큰 쪽(arm_raise)으로 보되,
-- 양쪽 값을 함께 남겨 '어느 쪽이 덜 올라가는지'를 말할 수 있게 한다.
alter table public.posture_checks
  add column if not exists arm_raise_l numeric(5,1),
  add column if not exists arm_raise_r numeric(5,1);

comment on column public.posture_checks.arm_raise_l is '왼팔 들림 최댓값(도)';
comment on column public.posture_checks.arm_raise_r is '오른팔 들림 최댓값(도)';
