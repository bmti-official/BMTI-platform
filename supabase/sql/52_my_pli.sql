-- 52. 마이플리 — 이용자가 만든 플리를 서버에 담고, 바로플리에 올리고(바로 공개), 가져와 고친 원본을 적어 둔다.
-- 여러 번 실행해도 안전합니다.
--
--   ① routines 표에 칸 더하기 — 원본 번호, 게시 상태, 만든 사람 표시
--   ② 권한 바로잡기 — owner_id·user_id는 회원 번호(users.id)라 auth.uid()가 아니라 my_user_id()로 견준다
--   ③ 지키기 — 이용자는 공식 칸을 못 건드리고, '숨김'은 관리자만, 이름에 쓸 수 없는 말은 서버에서도 막는다
--   ④ 게시한 플리를 지우면 — 보관해 둔 사람에게는 복사본으로 남긴다

-- ── ① 칸 더하기 ─────────────────────────────────────────────
alter table public.routines
  add column if not exists source_id   bigint references public.routines(id) on delete set null, -- 가져와 고친 원본
  add column if not exists share_state text not null default 'private',                         -- private · public · hidden
  add column if not exists shared_at   timestamptz,                                              -- 바로플리에 올린 때
  add column if not exists show_nick   boolean not null default false,                           -- 만든 사람 표시: 닉네임도 보이기
  add column if not exists author_nick text,                                                     -- 보여 줄 닉네임(올릴 때 적어 둠)
  add column if not exists author_code text,                                                     -- 보여 줄 유형(캐릭터)
  add column if not exists kept_copy   boolean not null default false;                           -- 원본이 지워져 남긴 복사본

alter table public.routines drop constraint if exists routines_share_state_chk;
alter table public.routines
  add constraint routines_share_state_chk check (share_state in ('private', 'public', 'hidden'));

create index if not exists routines_owner_idx  on public.routines (owner_id);
create index if not exists routines_shared_idx on public.routines (share_state, shared_at desc) where owner_id is not null;

-- ── 이름 거르기(서버) — 화면(src/lib/nameFilter.js)과 같은 목록 ───────
-- 띄어쓰기·기호를 빼고 숫자는 6·9만 남겨 붙여 본다('시 발', 'ㅅ1발'도 걸린다).
create or replace function public.bad_name(p text)
returns boolean
language plpgsql immutable as $$
declare
  raw  text := lower(regexp_replace(coalesce(p, ''), '\s', '', 'g'));
  flat text := regexp_replace(regexp_replace(lower(coalesce(p, '')), '[[:space:][:punct:]·•ㆍ]', '', 'g'), '[0-578]', '', 'g');
  w    text;
begin
  foreach w in array array[
    -- 욕설
    '시발','씨발','씨바','시바놈','시바년','씨빨','시빨','씹새','씹년','씹할','ㅅㅂ','ㅆㅂ','ㅅ발','ㅆ발','시ㅂ','씨ㅂ','병신','븅신','빙신','ㅂㅅ','좆','존나','졸라',
    '개새','개색','개세끼','이새끼','저새끼','새끼야','색기','쌍년','썅','샹년','니미','느금','엠창','니애미','니애비','애미뒤','애비없','미친놈','미친년',
    '미친새','미친것','지랄','ㅈㄹ','꺼져','닥쳐','염병','호로새','후레자식','등신','찐따','fuck','shit','bitch','asshole','dick',
    -- 성적인 말
    '섹스','섹시','sex','보지','자지','잠지','딸딸이','자위','야동','포르노','porn','젖꼭','빨통','강간','성폭','성관계','떡치','조건만남','원나잇',
    '성인방','오피걸','노콘','69','페티시','음란','변태','누드','nude','hentai',
    -- 정치적인 말
    '국민의힘','더불어민주','민주당','정의당','조국혁신','개혁신당','진보당','새누리','한나라당','윤석열','이재명','문재인','박근혜','이명박','한동훈',
    '조국수호','김건희','김정은','김일성','트럼프','시진핑','푸틴','일베','일간베스트','좌빨','빨갱이','수꼴','대깨','개딸','태극기부대','토착왜구','종북',
    '틀딱','문재앙','굥',
    -- 혐오 표현
    '한남','김치녀','된장녀','메갈','워마드','쪽바리','짱깨','짱개','흑형','깜둥','니거','nigger','게이새','장애년','맘충','급식충','틀딱충','홍어족',
    '전라디언','경상디언',
    -- 운영자 사칭
    '관리자','운영자','운영진','운영팀','고객센터','admin','어드민'
  ] loop
    if position(w in raw) > 0 or position(w in flat) > 0 then return true; end if;
  end loop;
  return false;
end $$;

-- 닉네임 — 새로 정하거나 바꿀 때만 본다(이미 가입한 사람의 닉네임은 건드리지 않는다)
create or replace function public.guard_nickname()
returns trigger
language plpgsql as $$
begin
  if new.nickname is not null
     and (tg_op = 'INSERT' or new.nickname is distinct from old.nickname)
     and public.bad_name(new.nickname) then
    raise exception '닉네임에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;
  return new;
end $$;

drop trigger if exists users_guard_nickname on public.users;
create trigger users_guard_nickname
  before insert or update of nickname on public.users
  for each row execute function public.guard_nickname();

-- ── ③ 지키기 — 이용자 플리를 쓸 때마다 ───────────────────────
create or replace function public.guard_my_routine()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nick text; v_code text;
begin
  if new.owner_id is null then return new; end if;            -- 공식 플리는 관리자 몫 — 여기서 손대지 않는다

  if not public.is_admin() then
    -- 이용자는 공식 칸·숫자를 못 바꾼다
    new.published := false;
    if tg_op = 'UPDATE' then
      new.owner_id := old.owner_id;
      new.view_count := old.view_count; new.save_count := old.save_count;
      new.finish_count := old.finish_count; new.start_count := old.start_count;
      new.kept_copy := old.kept_copy;
      -- 숨김은 관리자만 — 숨겨진 플리는 스스로 다시 올릴 수 없다
      if old.share_state = 'hidden' and new.share_state <> 'hidden' then
        raise exception '관리자가 숨긴 플리는 다시 올릴 수 없어요.' using errcode = '42501';
      end if;
    end if;
    if new.share_state = 'hidden' and (tg_op = 'INSERT' or old.share_state <> 'hidden') then
      raise exception '숨김은 관리자만 정할 수 있어요.' using errcode = '42501';
    end if;
  end if;

  -- 이름에 쓸 수 없는 말
  if public.bad_name(new.title_z) or public.bad_name(new.title_m) then
    raise exception '플리 이름에 쓸 수 없는 말이 들어 있어요.' using errcode = '22023';
  end if;

  -- 바로플리에 올릴 때 — 올린 때와 만든 사람(닉네임·유형)을 적어 둔다.
  -- 닉네임이 거르기에 걸리면 비워 둔다(유형 캐릭터만 보인다).
  if new.share_state = 'public' then
    if tg_op = 'INSERT' or old.share_state <> 'public' then new.shared_at := now(); end if;
    select u.nickname, left(coalesce(u.bmti_type, ''), 4) into v_nick, v_code
      from public.users u where u.id = new.owner_id;
    new.author_code := nullif(v_code, '');
    new.author_nick := case when new.show_nick and v_nick is not null and not public.bad_name(v_nick) then v_nick else null end;
  elsif new.share_state = 'private' then
    new.shared_at := null;
  end if;
  return new;
end $$;

drop trigger if exists routines_guard_mine on public.routines;
create trigger routines_guard_mine
  before insert or update on public.routines
  for each row execute function public.guard_my_routine();

-- ── ② 권한 바로잡기 ──────────────────────────────────────────
-- 읽기: 공개된 공식 플리 · 바로플리에 올린 회원 플리 · 내 플리 · 관리자
drop policy if exists routines_read on public.routines;
create policy routines_read on public.routines
  for select using (
    (owner_id is null and published = true)
    or (owner_id is not null and share_state = 'public')
    or owner_id = public.my_user_id()
    or public.is_admin()
  );
-- 쓰기: 내 플리만(관리자는 전부)
drop policy if exists routines_own_write on public.routines;
create policy routines_own_write on public.routines
  for all using (owner_id = public.my_user_id() or public.is_admin())
  with check (owner_id = public.my_user_id() or public.is_admin());

drop policy if exists routine_cards_read on public.routine_cards;
create policy routine_cards_read on public.routine_cards
  for select using (
    exists (select 1 from public.routines r where r.id = routine_id
            and ((r.owner_id is null and r.published)
                 or (r.owner_id is not null and r.share_state = 'public')
                 or r.owner_id = public.my_user_id()
                 or public.is_admin()))
  );
drop policy if exists routine_cards_write on public.routine_cards;
create policy routine_cards_write on public.routine_cards
  for all using (
    exists (select 1 from public.routines r where r.id = routine_id
            and (r.owner_id = public.my_user_id() or public.is_admin()))
  ) with check (
    exists (select 1 from public.routines r where r.id = routine_id
            and (r.owner_id = public.my_user_id() or public.is_admin()))
  );

-- 보관함 — 내 것만
drop policy if exists saved_own on public.saved_items;
create policy saved_own on public.saved_items
  for all using (user_id = public.my_user_id()) with check (user_id = public.my_user_id());

-- ── ④ 게시한 플리를 지우면 — 보관해 둔 사람에게 복사본으로 남긴다 ─────
create or replace function public.keep_saved_copies()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  s   record;
  cp  public.routines%rowtype;
begin
  if old.owner_id is null then return old; end if;             -- 공식 플리는 해당 없음
  for s in
    select user_id from public.saved_items
     where item_type = 'routine' and item_id = old.id and user_id <> old.owner_id
  loop
    cp := old;
    cp.id := nextval(pg_get_serial_sequence('public.routines', 'id'));
    cp.owner_id := s.user_id;
    cp.share_state := 'private'; cp.shared_at := null; cp.kept_copy := true; cp.source_id := null;
    cp.view_count := 0; cp.save_count := 0; cp.finish_count := 0; cp.start_count := 0;
    cp.created_at := now(); cp.updated_at := now();
    insert into public.routines values (cp.*);
    insert into public.routine_cards (routine_id, card_id, position, reps, sets, rest, side)
      select cp.id, rc.card_id, rc.position, rc.reps, rc.sets, rc.rest, rc.side
        from public.routine_cards rc where rc.routine_id = old.id;
  end loop;
  delete from public.saved_items where item_type = 'routine' and item_id = old.id;
  return old;
end $$;

drop trigger if exists routines_keep_copies on public.routines;
create trigger routines_keep_copies
  before delete on public.routines
  for each row execute function public.keep_saved_copies();

-- 확인 — 칸이 생겼는지
select column_name from information_schema.columns
 where table_schema = 'public' and table_name = 'routines'
   and column_name in ('source_id', 'share_state', 'shared_at', 'show_nick', 'author_nick', 'author_code', 'kept_copy')
 order by column_name;
