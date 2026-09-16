-- Supabase SQL 편집기에 붙여넣으세요.
-- ===================================================================
-- 공통 음성에서 성별 축을 걷어내고, 캐릭터 인사를 새로 만든다
-- ===================================================================
-- 목소리는 '영상 속 사람'이 아니라 '내 BMTI 파트너'입니다.
-- 파트너 16종은 케틀벨·폼롤러 같은 도구라 성별이 없습니다.
-- 그래서 목소리는 말투(Z/M) 둘로만 나누고, 정체성은 인사 한 마디가 맡습니다.
--
-- 29·30번을 아직 실행하지 않았어도 그냥 실행하면 됩니다. 알아서 건너뜁니다.

-- ── 1. 성별 칸 걷어내기 ─────────────────────────────────────
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'voice_assets' and column_name = 'gender') then
    -- 같은 자리에 여자·남자가 둘 다 있으면 여자 것만 남긴다
    delete from public.voice_assets a
     where a.gender = 'male'
       and exists (select 1 from public.voice_assets b
                    where b.kind = a.kind and b.tone = a.tone and b.n = a.n and b.gender = 'female');
    alter table public.voice_assets drop constraint if exists voice_assets_pkey;
    alter table public.voice_assets drop constraint if exists voice_assets_gender_check;
    alter table public.voice_assets drop column gender;
    alter table public.voice_assets add primary key (kind, tone, n);
  end if;
end $$;

-- ── 2. 캐릭터 인사 ──────────────────────────────────────────
-- 유형 코드마다 한 편. 오프닝 화면에서 누끼 캐릭터가 뜰 때 한 번 흐른다.
create table if not exists public.voice_hello (
  code       text primary key,
  url        text not null,
  updated_at timestamptz not null default now()
);

alter table public.voice_hello enable row level security;

drop policy if exists hello_read on public.voice_hello;
create policy hello_read on public.voice_hello
  for select using (true);

drop policy if exists hello_admin_write on public.voice_hello;
create policy hello_admin_write on public.voice_hello
  for all using (public.is_admin()) with check (public.is_admin());
