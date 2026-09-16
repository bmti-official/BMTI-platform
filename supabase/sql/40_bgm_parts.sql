-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 40. 배경음악을 한 곡당 세 도막으로 나눠 담는다.
--   kind = 'bgm'  n = 곡번호 * 10 + 도막번호
--     11 12 13  확신의 O 유형 — 도입부 · 중간 · 마무리
--     21 22 23  유연한 O 유형
--     31 32 33  유연한 A 유형
--     41 42 43  확신의 A 유형
--
-- 칸을 새로 만들 것은 없다. n 에 담는 숫자만 달라진다.
-- 예전 방식(n = 1~4)으로 올려 둔 것이 있으면 이제 쓰이지 않으니 지운다.
delete from public.voice_assets where kind = 'bgm' and n between 1 and 9;

-- 지금 담긴 것 확인 — 12줄이 다 차면 준비 끝이다.
select n, url from public.voice_assets where kind = 'bgm' order by n;
