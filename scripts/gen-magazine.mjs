// 큐레이션 아티클(curation_content)을 정적 HTML 매거진으로 프리렌더링한다.
//   node scripts/gen-magazine.mjs
//
// 크롤러/애드센스가 자바스크립트 실행 없이 본문을 읽을 수 있게, public/magazine.html에
// 실제 텍스트를 담아 생성한다.
//
// 글마다 고유 주소를 주는 편이 검색에는 유리하지만, 분량이 짧은 글을 낱개 페이지로 쪼개면
// 오히려 '빈약한 콘텐츠' 판정을 받는다. 그래서 MIN_SOLO_LEN 이상인 글만 개별 페이지로 뽑고,
// 나머지는 매거진 한 페이지 안에 모아 둔다. 글을 늘리면 자동으로 개별 페이지가 생긴다.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { SITE, esc, paras, page, siteNav } from './lib/shell.mjs';

const MIN_SOLO_LEN = 800; // 개별 페이지로 독립시킬 최소 본문 길이(자)

const s = createClient('https://fiesnznufryrkxcpwuja.supabase.co', 'sb_publishable_eJEbt-Raw_UTFDDghG9nqQ_x32PXONo');
const { data, error } = await s.from('curation_content')
  .select('*').eq('published', true)
  .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
if (error) { console.error('불러오기 실패:', error.message); process.exit(1); }
const rows = data || [];

const solo = rows.filter((r) => String(r.body || '').length >= MIN_SOLO_LEN);
const soloIds = new Set(solo.map((r) => r.id));
const urlOf = (r) => (soloIds.has(r.id) ? `/magazine/${r.id}.html` : `/magazine.html#a${r.id}`);

// ── 개별 아티클 페이지 ──────────────────────────────────────
if (existsSync('public/magazine')) rmSync('public/magazine', { recursive: true, force: true });
if (solo.length) mkdirSync('public/magazine', { recursive: true });

for (const r of solo) {
  const body = `${siteNav('/magazine.html')}
<article>
  <span class="tag">${esc(r.category)}</span>
  <h1>${esc(r.title)}</h1>
  <p class="muted">by. ${esc(r.author || 'BMTI')}${r.created_at ? ' · ' + esc(String(r.created_at).slice(0, 10)) : ''}</p>
  ${paras(r.body)}
  <p class="disclaimer">본 글은 일반적인 건강 정보이며 의학적 진단·치료를 대신하지 않습니다.
     증상이 2주 이상 이어지거나 저림·힘 빠짐이 있다면 전문가의 진료를 받아보시길 권합니다.</p>
  <h2>다른 글도 보기</h2>
  <ul class="clean">
    ${rows.filter((o) => o.id !== r.id).slice(0, 6).map((o) => `<li><a href="${urlOf(o)}">${esc(o.title)}</a></li>`).join('\n    ')}
  </ul>
  <p><a class="cta" href="/t/">내 몸에 맞는 회복법 찾아보기 →</a></p>
</article>`;
  writeFileSync(`public/magazine/${r.id}.html`, page({
    title: `${r.title} — BMTI 건강 매거진`,
    description: String(r.body || '').replace(/\s+/g, ' ').slice(0, 150),
    canonical: `${SITE}/magazine/${r.id}.html`,
    ogImage: `${SITE}/og-cover.png`,
    body,
  }));
}

// ── 매거진 본지 ─────────────────────────────────────────────
const toc = rows.map((r) => `<li><a href="${urlOf(r)}">${esc(r.title)}</a></li>`).join('\n    ');

const articles = rows.map((r) => soloIds.has(r.id)
  ? `<article class="card">
      <span class="tag">${esc(r.category)}</span>
      <h2 id="a${r.id}">${esc(r.title)}</h2>
      <p class="muted">by. ${esc(r.author || 'BMTI')}</p>
      <p>${esc(String(r.body || '').replace(/\s+/g, ' ').slice(0, 120))}…</p>
      <p><a href="${urlOf(r)}">이어서 읽기 →</a></p>
    </article>`
  : `<article class="card">
      <span class="tag">${esc(r.category)}</span>
      <h2 id="a${r.id}">${esc(r.title)}</h2>
      <p class="muted">by. ${esc(r.author || 'BMTI')}${r.created_at ? ' · ' + esc(String(r.created_at).slice(0, 10)) : ''}</p>
      ${paras(r.body)}
    </article>`).join('\n');

const body = `${siteNav('/magazine.html')}
<h1>BMTI 건강 매거진</h1>
<p class="lede">오래 앉는 사람을 위한 몸 관리 이야기. 물리치료사가 전하는 자세·회복·스트레칭·운동 습관 가이드입니다.</p>

<div class="card">
  <b class="muted">이번 매거진 목차</b>
  <ul class="clean" style="margin-top:10px">
    ${toc}
  </ul>
</div>

${articles}

<h2>내 몸에 맞는 회복법이 궁금하다면</h2>
<p>같은 뻐근함이라도 사람마다 잘 맞는 회복 방식이 다릅니다.
   움직여야 풀리는 사람이 있고, 쉬어야 회복되는 사람이 있어요.
   BMTI 검사로 내 움직임 성향을 확인하면 그에 맞는 회복 습관과 운동 환경을 볼 수 있습니다.</p>
<p><a class="cta" href="/t/">16가지 유형 보러 가기 →</a></p>`;

writeFileSync('public/magazine.html', page({
  title: 'BMTI 건강 매거진 — 자세·회복·스트레칭 이야기',
  description: '물리치료사가 전하는 자세·회복·스트레칭·운동 습관 이야기. 오래 앉는 사람을 위한 뻐근함·자세 교정·스트레칭 오해까지 일상에서 바로 쓰는 건강 정보.',
  canonical: `${SITE}/magazine.html`,
  ogImage: `${SITE}/og-cover.png`,
  body,
}));

console.log(`매거진 ${rows.length}편 생성 — 개별 페이지 ${solo.length}편 / 본지 수록 ${rows.length - solo.length}편`);
if (!solo.length) {
  const lens = rows.map((r) => String(r.body || '').length);
  console.log(`  현재 글 길이 ${Math.min(...lens)}~${Math.max(...lens)}자. ${MIN_SOLO_LEN}자를 넘기면 개별 주소가 자동 생성됩니다.`);
}

// 사이트맵이 쓸 수 있게 개별 페이지 목록을 남긴다.
writeFileSync('scripts/.magazine-urls.json', JSON.stringify(solo.map((r) => `/magazine/${r.id}.html`), null, 2));
