// 큐레이션 아티클(curation_content)을 '정적 HTML 매거진'으로 프리렌더링한다.
// 크롤러/애드센스가 자바스크립트 실행 없이도 본문을 읽을 수 있게, public/magazine.html에
// 실제 텍스트를 담아 생성한다. 아티클을 바꾼 뒤 `node scripts/gen-magazine.mjs`로 다시 뽑으면 된다.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';

const SITE = 'https://bmti-official.co.kr';
const s = createClient('https://fiesnznufryrkxcpwuja.supabase.co', 'sb_publishable_eJEbt-Raw_UTFDDghG9nqQ_x32PXONo');

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 본문(\n\n 문단, \n 줄바꿈)을 <p>로 변환
const bodyHtml = (body) => String(body || '').split(/\n{2,}/).map(p =>
  `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('\n');

const { data, error } = await s.from('curation_content')
  .select('*').eq('published', true)
  .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
if (error) { console.error('불러오기 실패:', error.message); process.exit(1); }
const rows = data || [];

const articles = rows.map((r) => `
    <article class="card">
      <span class="cat">${esc(r.category)}</span>
      <h2 id="a${r.id}">${esc(r.title)}</h2>
      <div class="meta">by. ${esc(r.author || '말랑 연구소')}${r.created_at ? ' · ' + esc(String(r.created_at).slice(0, 10)) : ''}</div>
      <div class="body">${bodyHtml(r.body)}</div>
    </article>`).join('\n');

const toc = rows.map((r) => `<li><a href="#a${r.id}">${esc(r.title)}</a></li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BMTI 건강 매거진 — 자세·회복·스트레칭 이야기</title>
<meta name="description" content="물리치료사가 전하는 자세·회복·스트레칭·운동 습관 이야기. 오래 앉는 사람을 위한 뻐근함·자세 교정·스트레칭 오해까지 일상에서 바로 쓰는 건강 정보." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${SITE}/magazine.html" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="BMTI 건강 다이어리" />
<meta property="og:title" content="BMTI 건강 매거진 — 자세·회복·스트레칭 이야기" />
<meta property="og:description" content="물리치료사가 전하는 자세·회복·스트레칭·운동 습관 이야기." />
<meta property="og:url" content="${SITE}/magazine.html" />
<meta name="google-adsense-account" content="ca-pub-8560718405158970" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8560718405158970" crossorigin="anonymous"></script>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif; color: #1C1A17; background: #FBFAF7; line-height: 1.7; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 28px 20px 64px; }
  header.top { text-align: center; padding: 8px 0 6px; }
  header.top .brand { font-size: 13px; font-weight: 800; color: #8B7BD8; letter-spacing: .02em; }
  header.top h1 { font-size: 26px; font-weight: 900; letter-spacing: -0.02em; margin: 8px 0 6px; }
  header.top p { color: #6E6A62; font-size: 14px; margin: 0; }
  nav.toc { background: #fff; border: 1px solid #EEEAE2; border-radius: 16px; padding: 16px 20px; margin: 22px 0; }
  nav.toc b { font-size: 13px; color: #8A857D; }
  nav.toc ul { margin: 10px 0 0; padding-left: 18px; }
  nav.toc li { margin: 5px 0; }
  nav.toc a { color: #5E594F; text-decoration: none; font-weight: 600; }
  nav.toc a:hover { text-decoration: underline; }
  .card { background: #fff; border: 1px solid #EEEAE2; border-radius: 18px; padding: 22px 22px 8px; margin: 18px 0; box-shadow: 0 2px 4px rgba(220,188,86,0.14), 0 10px 24px rgba(233,203,110,0.30); }
  .card .cat { display: inline-block; font-size: 12px; font-weight: 800; color: #6B5BB5; background: #EDE8F9; border-radius: 999px; padding: 4px 11px; }
  .card h2 { font-size: 20px; font-weight: 900; letter-spacing: -0.01em; margin: 12px 0 6px; line-height: 1.4; }
  .card .meta { font-size: 12px; color: #B7B2A9; font-weight: 600; margin-bottom: 12px; }
  .card .body p { margin: 0 0 14px; color: #33302B; font-size: 15.5px; word-break: keep-all; }
  footer.bottom { margin-top: 34px; padding-top: 22px; border-top: 1px solid #EEEAE2; text-align: center; color: #8A857D; font-size: 12.5px; line-height: 1.7; }
  footer.bottom a { color: #8B7BD8; font-weight: 700; text-decoration: none; }
  .disclaimer { background: #F4F1EA; border-radius: 14px; padding: 14px 16px; font-size: 12.5px; color: #6E6A62; margin: 26px 0 0; text-align: left; }
</style>
</head>
<body>
  <div class="wrap">
    <header class="top">
      <div class="brand">BMTI 건강 매거진</div>
      <h1>오래 앉는 사람을 위한 몸 관리 이야기</h1>
      <p>물리치료사가 전하는 자세·회복·스트레칭·운동 습관 가이드</p>
    </header>

    <nav class="toc">
      <b>이번 매거진 목차</b>
      <ul>
${toc}
      </ul>
    </nav>

${articles}

    <div class="disclaimer">
      ✍️ 이 매거진의 콘텐츠는 AI의 도움을 받아 작성되었습니다.<br />
      ※ 본 매거진의 모든 내용은 신체 기능 향상과 웰니스를 위한 일반적인 참고 정보이며,
      의학적 진단·처방·치료를 대신하는 의료 행위가 아닙니다. 통증이나 질환이 있는 경우 반드시 전문의의 진료를 받아주세요.
    </div>

    <footer class="bottom">
      <p>더 많은 콘텐츠와 나만의 건강 기록은 <a href="${SITE}/">BMTI 건강 다이어리</a>에서 만나보세요.</p>
      <p>© 2026 BMTI Labs. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>
`;

mkdirSync('public', { recursive: true });
writeFileSync('public/magazine.html', html, 'utf8');
console.log(`magazine.html 생성 완료 — 아티클 ${rows.length}개, ${Buffer.byteLength(html)} bytes`);
