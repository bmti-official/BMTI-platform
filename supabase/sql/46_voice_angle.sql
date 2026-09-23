-- Supabase SQL 편집기에 붙여넣으세요.
--
-- 46. 각도 잴 때 나가는 안내 음성.
--   kind = 'angle'  n = 1~12   (말투를 가리지 않으므로 tone = 'a', 한 벌이면 된다)
--
--    1  조금 더 가까이 와 주세요
--    2  한 걸음만 뒤로 가 주세요
--    3  몸을 옆으로 더 돌려 주세요
--    4  화면을 정면으로 봐 주세요
--    5  머리부터 골반까지 화면에 들어오게 해 주세요
--    6  좋아요. 그대로 계세요
--    7  시작합니다. 가만히 서 계세요        (옆모습)
--    8  이제 천천히 허리를 굽혀 주세요       (옆모습 중간)
--    9  옆모습 다 쟀어요. 정면으로 서 주세요
--   10  시작합니다. 두 팔을 천천히 올려 주세요 (앞모습)
--   11  끝까지 올린 채로 잠깐 멈춰 주세요     (앞모습 중간)
--   12  다 쟀어요. 수고하셨어요
--
-- 브라우저가 읽어 주는 소리는 값싸게 들리고 되풀이되면 듣기 싫다.
-- 사람이 읽어 담아 두고, 같은 말을 연달아 틀지 않는다.
alter table public.voice_assets drop constraint if exists voice_assets_kind_check;
alter table public.voice_assets add constraint voice_assets_kind_check
  check (kind in ('count', 'rest', 'finish', 'switch', 'side', 'countdown', 'bgm', 'next', 'angle'));
