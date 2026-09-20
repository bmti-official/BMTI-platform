-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 43. 10월 건강 다이어리 개편 — 주간 움직임 측정 · 완수 자동 기록 · 웹 푸시.
--
-- 기존 diary_entries 는 건드리지 않는다. overwork(무리했나요) 칸도 그대로 둔다.
-- 지난달 기록을 그대로 읽을 수 있어야 하고, 새 화면에서 쓰지 않을 뿐이다.

-- ── ① 주간 움직임 측정 ────────────────────────────────────────
-- 한 주(일~토)에 한 줄. 같은 주에 다시 재면 덮어쓴다.
-- week 는 그 주의 '일요일' 날짜를 담는다 — 주를 세는 기준을 하나로 둔다.
--
-- 각도는 도(°) 단위. 소수 한 자리까지 담는다.
--   neck_bend   목 숙임      측면 · 가만히 섰을 때
--   trunk_flex  몸통 굽힘    측면 · 앞으로 굽혔을 때의 가동 범위
--   arm_raise   어깨 들림    정면 · 팔을 옆으로 들어 올린 가동 범위
create table if not exists public.posture_checks (
  user_id     uuid        not null references public.users(id) on delete cascade,
  week        date        not null,
  measured_at timestamptz not null default now(),
  neck_bend   numeric(5,1),
  trunk_flex  numeric(5,1),
  arm_raise   numeric(5,1),
  quality     int,                                  -- 0~100. 낮으면 추세에서 뺀다
  retries     int         not null default 0,       -- 다시 찍은 횟수
  device      text,                                 -- 어떤 기기로 쟀는지
  primary key (user_id, week)
);
create index if not exists posture_checks_user_idx on public.posture_checks (user_id, week desc);

alter table public.posture_checks enable row level security;
drop policy if exists posture_self on public.posture_checks;
create policy posture_self on public.posture_checks
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists posture_admin on public.posture_checks;
create policy posture_admin on public.posture_checks
  for select using (public.is_admin());

-- ── ② 바로카드·바로플리 완수 ─────────────────────────────────
-- 일기를 자동으로 만들지 않는다. 여기에만 쌓아 두고,
-- 일기를 열 때 '오늘 두 번 하셨네요' 하고 채워 준다.
--   done = false  한 세트 이상 했다 (했음)
--   done = true   끝까지 다 했다 (완주)
create table if not exists public.card_finishes (
  id         bigserial   primary key,
  user_id    uuid        not null references public.users(id) on delete cascade,
  date       date        not null,
  kind       text        not null check (kind in ('card', 'routine')),
  card_id    bigint      references public.quick_cards(id) on delete set null,
  routine_id bigint      references public.routines(id) on delete set null,
  done       boolean     not null default false,
  sets_done  int         not null default 0,
  at         timestamptz not null default now()
);
create index if not exists card_finishes_user_idx on public.card_finishes (user_id, date desc);

alter table public.card_finishes enable row level security;
drop policy if exists finish_self on public.card_finishes;
create policy finish_self on public.card_finishes
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());
drop policy if exists finish_admin on public.card_finishes;
create policy finish_admin on public.card_finishes
  for select using (public.is_admin());

-- ── ③ 웹 푸시 구독 ───────────────────────────────────────────
-- 한 사람이 기기마다 하나씩 갖는다. endpoint 가 곧 그 기기의 주소다.
create table if not exists public.push_subscriptions (
  endpoint   text        primary key,
  user_id    uuid        not null references public.users(id) on delete cascade,
  p256dh     text        not null,
  auth       text        not null,
  ua         text,
  created_at timestamptz not null default now(),
  last_ok_at timestamptz,
  fail_count int         not null default 0        -- 몇 번 연달아 실패했는지. 쌓이면 지운다
);
create index if not exists push_sub_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
drop policy if exists push_self on public.push_subscriptions;
create policy push_self on public.push_subscriptions
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- ── ④ 사람마다 켜고 끄는 값 ──────────────────────────────────
--   push_weekly    주간 측정 알림을 받을지
--   auto_exercise  바로카드를 끝냈을 때 일기에 저절로 채울지
alter table public.users
  add column if not exists push_weekly   boolean not null default false,
  add column if not exists auto_exercise boolean not null default true;
