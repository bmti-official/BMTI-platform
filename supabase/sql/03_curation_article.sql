-- ===================================================================
-- 큐레이션 확장 — 썸네일·글씨체·본문 구성·추천 바로카드
-- Supabase 대시보드 → SQL Editor 에 전체를 붙여넣고 실행하세요.
-- 여러 번 실행해도 안전합니다.
-- ===================================================================
alter table public.curation_items
  -- 썸네일 — 이미지 위에 얹는 문구는 Z/M 구분 없이 하나만 쓴다.
  add column if not exists thumb_text   text,
  add column if not exists read_min     int  not null default 0,   -- 평균 가독시간(분)
  add column if not exists font_key     text not null default 'pretendard',

  -- 초록 — 초반에 확 끌릴, 전체를 관통하는 한두 문장
  add column if not exists lead_z       text,
  add column if not exists lead_m       text,

  -- 본문 네 마디: 문제제기 · 과학적 분석 · 분석의 의미 · 사례와 결론
  add column if not exists s1_img text, add column if not exists s1_z text, add column if not exists s1_m text,
  add column if not exists s2_img text, add column if not exists s2_z text, add column if not exists s2_m text,
  add column if not exists s3_img text, add column if not exists s3_z text, add column if not exists s3_m text,
  add column if not exists s4_img text, add column if not exists s4_z text, add column if not exists s4_m text,

  -- 글 끝에 붙일 추천 바로카드(3~4장)
  add column if not exists card_ids    bigint[] not null default '{}';

-- 목록 카드 썸네일 아래에 세울 BMTI 누끼 캐릭터 — Z/M 유형별로 따로 고른다.
alter table public.curation_items
  add column if not exists char_z text,
  add column if not exists char_m text;
