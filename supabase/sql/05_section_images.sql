-- 본문 네 마디에 사진을 여러 장 넣을 수 있게 한다.
-- (대표 이미지 cover_url은 한 장 그대로다)
-- 여러 번 실행해도 안전합니다.

alter table public.curation_items
  add column if not exists s1_imgs text[] not null default '{}',
  add column if not exists s2_imgs text[] not null default '{}',
  add column if not exists s3_imgs text[] not null default '{}',
  add column if not exists s4_imgs text[] not null default '{}';

-- 한 장씩 넣어 두었던 기존 사진을 새 칸으로 옮겨 담는다.
update public.curation_items set s1_imgs = array[s1_img] where s1_img is not null and s1_img <> '' and cardinality(s1_imgs) = 0;
update public.curation_items set s2_imgs = array[s2_img] where s2_img is not null and s2_img <> '' and cardinality(s2_imgs) = 0;
update public.curation_items set s3_imgs = array[s3_img] where s3_img is not null and s3_img <> '' and cardinality(s3_imgs) = 0;
update public.curation_items set s4_imgs = array[s4_img] where s4_img is not null and s4_img <> '' and cardinality(s4_imgs) = 0;
