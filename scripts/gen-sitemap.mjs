// sitemap.xml을 실제 존재하는 페이지에서 만들어낸다.
//   node scripts/gen-sitemap.mjs
// 손으로 관리하다 보면 내용 없는 주소가 남거나 새 페이지가 빠지기 쉬워서 자동 생성한다.
import { writeFileSync, readFileSync, existsSync, readdirSync } from 'fs';
import { SITE } from './lib/shell.mjs';

const today = new Date().toISOString().slice(0, 10);

// 본문 글자수를 재서, 내용이 거의 없는 페이지는 사이트맵에 넣지 않는다.
const textLen = (file) => {
  const h = readFileSync(file, 'utf8');
  return h.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
          .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
};

const entries = [];
const add = (loc, priority, changefreq, file) => {
  if (file && (!existsSync(file) || textLen(file) < 300)) {
    console.warn(`  건너뜀(본문 부족): ${loc}`);
    return;
  }
  entries.push({ loc, priority, changefreq });
};

add(`${SITE}/`, '1.0', 'weekly');
add(`${SITE}/t/`, '0.9', 'monthly', 'public/t/index.html');
for (const f of readdirSync('public/t').filter((f) => f.endsWith('.html') && f !== 'index.html').sort()) {
  add(`${SITE}/t/${f}`, '0.8', 'monthly', `public/t/${f}`);
}
add(`${SITE}/magazine.html`, '0.9', 'weekly', 'public/magazine.html');
if (existsSync('public/magazine')) {
  for (const f of readdirSync('public/magazine').filter((f) => f.endsWith('.html')).sort()) {
    add(`${SITE}/magazine/${f}`, '0.7', 'monthly', `public/magazine/${f}`);
  }
}
add(`${SITE}/about.html`, '0.6', 'yearly', 'public/about.html');
add(`${SITE}/contact.html`, '0.5', 'yearly', 'public/contact.html');
add(`${SITE}/privacy.html`, '0.3', 'yearly', 'public/privacy.html');
add(`${SITE}/terms.html`, '0.3', 'yearly', 'public/terms.html');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
writeFileSync('public/sitemap.xml', xml);
console.log(`사이트맵 ${entries.length}개 주소 생성`);
