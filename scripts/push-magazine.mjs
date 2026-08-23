// scripts/content/magazine-bodies.mjs의 원고를 curation_content 테이블에 반영한다.
//   node scripts/push-magazine.mjs
// 반영 후 gen-magazine.mjs를 돌려야 정적 페이지에 나타난다.
import { createClient } from '@supabase/supabase-js';
import { BODIES } from './content/magazine-bodies.mjs';

const s = createClient('https://fiesnznufryrkxcpwuja.supabase.co', 'sb_publishable_eJEbt-Raw_UTFDDghG9nqQ_x32PXONo');

for (const [id, body] of Object.entries(BODIES)) {
  const { data, error } = await s.from('curation_content')
    .update({ body, updated_at: new Date().toISOString() })
    .eq('id', Number(id)).select('id,title,body');
  if (error) { console.error(`id=${id} 실패:`, error.message); process.exitCode = 1; continue; }
  if (!data?.length) { console.error(`id=${id} 대상 행 없음`); process.exitCode = 1; continue; }
  console.log(`id=${id} ${String(data[0].body.length).padStart(5)}자  ${data[0].title}`);
}
