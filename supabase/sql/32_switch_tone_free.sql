-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 자리 바꾸기 멘트도 말투를 가리지 않게 한다.
-- 하는 말이 '오른쪽을 마쳤으니 반대로 누우세요' 하나뿐이라,
-- 담백하게 읽든 다정하게 읽든 내용이 같다. 성별당 한 벌이면 된다.
--
-- 이미 올려 둔 것 중 Z 쪽을 'a'(둘 다)로 옮기고, 겹치는 M 쪽은 지운다.

delete from public.voice_assets
 where kind = 'switch' and tone = 'm'
   and exists (select 1 from public.voice_assets b
                where b.kind = 'switch' and b.n = voice_assets.n
                  and b.gender = voice_assets.gender and b.tone = 'z');

update public.voice_assets set tone = 'a' where kind = 'switch' and tone in ('z', 'm');
