-- ===================================================================
-- 큐레이션 · 바로카드 · 플레이리스트 — 테이블과 접근 권한
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전합니다(IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ===================================================================

-- 관리자 판별 — 관리자 페이지 로그인에 쓰는 auth 이메일을 적습니다.
-- 여러 명이면 쉼표로 이어서 추가하면 됩니다.
-- 이 파일을 다시 실행하면 아래 목록으로 덮어써지니, 계정을 바꿨다면 여기도 같이 고쳐두세요.
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') in (
    'dmdwns777@bmti.com'
  );
$$;

-- ── 1. 큐레이션 ─────────────────────────────────────────────────
create table if not exists public.curation_items (
  id            bigserial primary key,
  published     boolean     not null default false,   -- false면 손님에게 안 보임
  sort_order    int         not null default 0,

  title_z       text        not null,                 -- Z 유형용 제목(담백)
  title_m       text        not null,                 -- M 유형용 제목(다정)
  body_z        text,                                 -- Z 유형용 본문
  body_m        text,                                 -- M 유형용 본문
  cover_url     text,                                 -- 상단 큰 이미지

  body_groups   text[]      not null default '{}',    -- 'neck_head' 등. 비우면 전체
  core_parts    text[]      not null default '{}',    -- 핵심 부위(다이어리 부위코드, 최대 3)
  related_parts text[]      not null default '{}',    -- 연관 부위(최대 6)
  tool_mode     text        not null default 'all',   -- all | relax | active

  view_count    bigint      not null default 0,
  save_count    bigint      not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 2. 바로카드 ─────────────────────────────────────────────────
create table if not exists public.quick_cards (
  id            bigserial primary key,
  published     boolean     not null default false,
  sort_order    int         not null default 0,

  kind          text        not null default 'stretch', -- massage | stretch | exercise
  title_z       text        not null,
  title_m       text        not null,
  script_z      text,                                   -- AI 음성 대본(담백)
  script_m      text,                                   -- AI 음성 대본(다정)
  video_url     text,
  duration_sec  int         not null default 0,

  tools         text[]      not null default '{}',      -- 폼롤러·매트 등
  body_groups   text[]      not null default '{}',
  core_parts    text[]      not null default '{}',
  related_parts text[]      not null default '{}',
  tool_mode     text        not null default 'all',

  view_count    bigint      not null default 0,
  save_count    bigint      not null default 0,
  finish_count  bigint      not null default 0,         -- 완주 횟수
  start_count   bigint      not null default 0,         -- 시작 횟수(완주율 계산용)
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── 3. 플레이리스트(루틴) ───────────────────────────────────────
create table if not exists public.routines (
  id            bigserial primary key,
  owner_id      uuid        references public.users(id) on delete cascade, -- null이면 공식 추천 루틴
  published     boolean     not null default false,   -- 공식 루틴 공개 여부
  sort_order    int         not null default 0,

  title_z       text        not null,
  title_m       text        not null,
  bmti_code     text,                                  -- 'BEST 루틴' 배너용(유형별 추천)

  view_count    bigint      not null default 0,
  save_count    bigint      not null default 0,
  finish_count  bigint      not null default 0,
  start_count   bigint      not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.routine_cards (
  routine_id  bigint not null references public.routines(id) on delete cascade,
  card_id     bigint not null references public.quick_cards(id) on delete cascade,
  position    int    not null default 0,
  primary key (routine_id, card_id)
);

-- ── 4. 저장(플레이리스트에 담기) ────────────────────────────────
create table if not exists public.saved_items (
  user_id    uuid        not null references public.users(id) on delete cascade,
  item_type  text        not null,          -- curation | card | routine
  item_id    bigint      not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

-- ===================================================================
-- 접근 권한(RLS) — 여기가 실제 자물쇠입니다.
-- 손님: 공개된 것만 읽기.  관리자: 전부 읽고 쓰기.
-- ===================================================================
alter table public.curation_items enable row level security;
alter table public.quick_cards    enable row level security;
alter table public.routines       enable row level security;
alter table public.routine_cards  enable row level security;
alter table public.saved_items    enable row level security;

-- 큐레이션
drop policy if exists curation_read_public on public.curation_items;
create policy curation_read_public on public.curation_items
  for select using (published = true or public.is_admin());
drop policy if exists curation_admin_write on public.curation_items;
create policy curation_admin_write on public.curation_items
  for all using (public.is_admin()) with check (public.is_admin());

-- 바로카드
drop policy if exists cards_read_public on public.quick_cards;
create policy cards_read_public on public.quick_cards
  for select using (published = true or public.is_admin());
drop policy if exists cards_admin_write on public.quick_cards;
create policy cards_admin_write on public.quick_cards
  for all using (public.is_admin()) with check (public.is_admin());

-- 루틴 — 공식 루틴은 공개된 것만, 내 루틴은 나만
drop policy if exists routines_read on public.routines;
create policy routines_read on public.routines
  for select using (
    (owner_id is null and published = true)
    or owner_id = auth.uid()
    or public.is_admin()
  );
drop policy if exists routines_own_write on public.routines;
create policy routines_own_write on public.routines
  for all using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists routine_cards_read on public.routine_cards;
create policy routine_cards_read on public.routine_cards
  for select using (
    exists (select 1 from public.routines r where r.id = routine_id
            and ((r.owner_id is null and r.published) or r.owner_id = auth.uid() or public.is_admin()))
  );
drop policy if exists routine_cards_write on public.routine_cards;
create policy routine_cards_write on public.routine_cards
  for all using (
    exists (select 1 from public.routines r where r.id = routine_id
            and (r.owner_id = auth.uid() or public.is_admin()))
  ) with check (
    exists (select 1 from public.routines r where r.id = routine_id
            and (r.owner_id = auth.uid() or public.is_admin()))
  );

-- 저장함 — 내 것만
drop policy if exists saved_own on public.saved_items;
create policy saved_own on public.saved_items
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ===================================================================
-- 조회수·저장수 — '우편함 투입구'
-- 손님이 표를 직접 수정하게 두면 제목까지 바꿀 수 있으므로,
-- 숫자를 1 올리는 것만 하는 함수를 열어준다.
-- ===================================================================
create or replace function public.bump_counter(
  p_table text, p_id bigint, p_field text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_table not in ('curation_items', 'quick_cards', 'routines') then
    raise exception '허용되지 않은 대상입니다';
  end if;
  if p_field not in ('view_count', 'save_count', 'start_count', 'finish_count') then
    raise exception '허용되지 않은 항목입니다';
  end if;
  execute format('update public.%I set %I = %I + 1 where id = $1 and published = true', p_table, p_field, p_field)
    using p_id;
end;
$$;

revoke all on function public.bump_counter(text, bigint, text) from public;
grant execute on function public.bump_counter(text, bigint, text) to anon, authenticated;
