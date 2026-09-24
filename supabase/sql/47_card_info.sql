-- 47) 바로카드 '알아 두기' — 손님 화면에서 대본 자리를 대신한다.
--
-- 음성 대본은 어차피 귀로 듣는다. 눈으로 볼 자리에는
-- 언제 하면 좋은지 · 언제는 하지 말아야 하는지 · 어디를 쓰는지를 둔다.
-- 세 칸 모두 줄바꿈으로 여러 줄을 적을 수 있다(한 줄에 한 항목).
alter table public.quick_cards
  add column if not exists good_when  text,  -- 하면 좋은 상황
  add column if not exists avoid_when text,  -- 피해야 할 상황
  add column if not exists focus_body text;  -- 핵심 근육·관절·신경

comment on column public.quick_cards.good_when  is '이럴 때 좋습니다 — 한 줄에 하나';
comment on column public.quick_cards.avoid_when is '이럴 땐 하지 마세요 — 한 줄에 하나';
comment on column public.quick_cards.focus_body is '쓰는 곳(근육·관절·신경) — 한 줄에 하나';
