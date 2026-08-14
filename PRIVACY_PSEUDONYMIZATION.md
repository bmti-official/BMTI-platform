# 민감정보 가명처리 스키마 (Supabase에서 직접 실행)

기분·통증·수면은 PIPA §23 민감정보입니다. B2B/통계·연구 활용은 반드시
**선택 동의(optional_consent)** + **가명처리(§28-2)** 를 전제로 하세요.

> ⚠️ 코드 자동 실행하지 않습니다. 아래 SQL을 Supabase → SQL Editor에서 직접 실행하세요.
> 법적 문구·처리 방식은 변호사/DPO 최종 검토를 권장합니다.

```sql
-- 1) 식별 user_id ↔ 연구용 난수 ID 매핑 (별도 테이블·접근 최소화·재식별 금지)
create table if not exists research_id_map (
  user_id uuid primary key references users(id) on delete cascade,
  research_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
-- 매핑 테이블은 서비스 코드에서 직접 조회 금지(RLS로 접근 차단, 관리자/배치만).
alter table research_id_map enable row level security;

-- 2) 가명 이벤트(식별자 제거, research_id만) — B2B/통계는 이 테이블만 사용
create table if not exists diary_events_pseudo (
  research_id uuid not null,
  date date not null,
  mood int, sleep int, soreness jsonb, tags jsonb, weather jsonb,
  primary key (research_id, date)
);
alter table diary_events_pseudo enable row level security;

-- 3) 식별 diary_entries → 가명 이벤트로 적재하는 배치 함수(관리자 권한으로만 실행)
create or replace function refresh_diary_events_pseudo() returns void
language sql security definer as $$
  insert into diary_events_pseudo (research_id, date, mood, sleep, soreness, tags, weather)
  select m.research_id, d.date, d.mood, d.sleep, d.soreness, d.tags, d.weather
  from diary_entries d
  join research_id_map m on m.user_id = d.user_id
  -- 선택 동의(optional_consent)한 사용자만 포함
  join health_record_consents c on c.user_id = d.user_id and c.optional_consent = true
  on conflict (research_id, date) do update
    set mood = excluded.mood, sleep = excluded.sleep, soreness = excluded.soreness,
        tags = excluded.tags, weather = excluded.weather;
$$;

-- 4) 집계 전용 뷰 — 행 단위 노출 금지, 최소 표본(n>=5)만 공개
create or replace view weather_mood_agg as
select date_trunc('month', date) as m, count(*) as n, avg(mood::float) as avg_mood
from diary_events_pseudo
group by 1
having count(*) >= 5;
```

## 운영 원칙
- **매핑키 격리**: `research_id_map`은 서비스 클라이언트에서 조회하지 않음(RLS 차단), 배치/관리자만 접근.
- **식별자 제거**: `diary_events_pseudo`에는 `user_id`·닉네임 등 식별정보를 넣지 않음.
- **재식별 금지**: 결합·역추적 금지. 외부(B2B)에는 **집계 뷰**(`weather_mood_agg` 등)만 제공.
- **최소표본**: 소표본(예: n<5) 집계는 공개하지 않음(재식별 위험).
- **동의 연동**: 선택 동의(`health_record_consents.optional_consent=true`)한 사용자만 가명 적재.
- **철회/파기**: 필수 동의 철회 시 `diary_entries`·`diary_events_pseudo`·`research_id_map`에서 해당 사용자 데이터 파기.

## 앱 반영(이미 적용됨)
- 첫 기록 전 **별도 동의 게이트**(`HealthConsentGate`): (필수) 개인 리포트 목적 수집·이용, (선택) 가명처리 B2B.
- 처리방침에 **민감정보·처리위탁·국외이전(Supabase)·가명정보** 조항 추가(TermsModal 제4-1~4-3조).
