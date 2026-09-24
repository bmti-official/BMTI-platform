-- 48) 각도기록에 '옆모습'을 담는다.
--
-- 숫자만 남기면 15.4도가 좋은 건지 나쁜 건지 스스로 판단할 수 없다.
-- 첫 판과 지금 판의 옆모습을 겹쳐 보여 주려고 관절 좌표를 함께 담는다.
--
-- **사진이 아니라 좌표다.** 얼굴도, 방 안 모습도 남지 않는다.
-- MediaPipe가 뽑은 점 33개를 {x, y}만 소수점 셋째 자리까지 줄여서 넣는다.
--   [{"x":0.512,"y":0.184}, ...]   → 한 판에 1KB 안쪽
alter table public.posture_checks
  add column if not exists pose jsonb;

comment on column public.posture_checks.pose is
  '옆모습 실루엣용 관절 좌표 33개 [{x,y}…]. 사진이 아니라 좌표만 담는다.';
