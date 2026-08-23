// 정적 콘텐츠 페이지(유형 페이지·소개·문의·매거진)가 함께 쓰는 HTML 껍데기.
// 크롤러가 자바스크립트 없이 본문을 그대로 읽을 수 있게, 내용을 HTML에 직접 담는다.
export const SITE = 'https://bmti-official.co.kr';
export const ADSENSE = 'ca-pub-8560718405158970';

export const esc = (t) => String(t ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 본문 텍스트(빈 줄 = 문단, 홑줄바꿈 = <br>)를 문단 HTML로.
export const paras = (body) => String(body || '').trim().split(/\n{2,}/)
  .filter(Boolean)
  .map((p) => `<p>${esc(p).trim().replace(/\n/g, '<br>')}</p>`)
  .join('\n');

export const BASE_CSS = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo',sans-serif;
         color:#1C1A17; background:#FBFAF7; line-height:1.75; word-break:keep-all; }
  .wrap { max-width:720px; margin:0 auto; padding:24px 20px 72px; }
  a { color:#9C6F26; }
  .sitenav { display:flex; align-items:center; gap:16px; padding:10px 0 18px; border-bottom:1px solid #EEEAE2; margin-bottom:26px; flex-wrap:wrap; }
  .sitenav .brand { font-weight:900; font-size:15px; letter-spacing:-.02em; color:#1C1A17; text-decoration:none; }
  .sitenav a.lnk { font-size:13.5px; font-weight:600; color:#6E6A62; text-decoration:none; }
  .sitenav a.lnk:hover { color:#9C6F26; }
  h1 { font-size:27px; font-weight:900; letter-spacing:-.025em; line-height:1.32; margin:0 0 10px; text-wrap:balance; }
  h2 { font-size:19px; font-weight:800; letter-spacing:-.02em; margin:38px 0 12px; text-wrap:balance; }
  h3 { font-size:15.5px; font-weight:800; margin:22px 0 8px; }
  p { margin:0 0 14px; }
  .lede { color:#6E6A62; font-size:15.5px; margin:0 0 6px; }
  .card { background:#fff; border:1px solid #EEEAE2; border-radius:16px; padding:20px 22px; margin:18px 0; }
  .card h2 { margin-top:0; }
  .muted { color:#6E6A62; font-size:14px; }
  .tag { display:inline-block; font-size:11.5px; font-weight:800; letter-spacing:.06em; color:#8B7BD8;
         background:#F1EEFB; border-radius:999px; padding:4px 11px; margin-bottom:12px; }
  figure { margin:0 0 22px; }
  figure img { width:100%; height:auto; border-radius:18px; display:block; }
  figcaption { font-size:12.5px; color:#918A7B; margin-top:8px; text-align:center; }
  ul.clean { margin:0 0 14px; padding-left:19px; }
  ul.clean li { margin:6px 0; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(148px,1fr)); gap:9px; margin:14px 0 0; }
  .grid a { display:block; background:#fff; border:1px solid #EEEAE2; border-radius:12px; padding:11px 13px;
            text-decoration:none; color:#1C1A17; }
  .grid a b { display:block; font-size:13.5px; font-weight:800; }
  .grid a span { display:block; font-size:11.5px; color:#8A857D; margin-top:2px; }
  .cta { display:inline-block; background:#1C1A17; color:#fff; text-decoration:none; font-weight:800;
         font-size:15px; padding:14px 26px; border-radius:999px; margin:8px 0 4px; }
  .disclaimer { font-size:12.5px; color:#918A7B; border-top:1px solid #EEEAE2; margin-top:34px; padding-top:16px; }
  footer.site { margin-top:40px; padding-top:18px; border-top:1px solid #EEEAE2; font-size:12.5px; color:#918A7B; }
  footer.site a { color:#6E6A62; text-decoration:none; margin-right:14px; }
  @media (max-width:520px){ h1{font-size:23px;} .wrap{padding:18px 16px 56px;} }
`;

export const siteNav = (here) => {
  const items = [
    ['/', 'BMTI 테스트'],
    ['/t/', '16가지 유형'],
    ['/magazine.html', '건강 매거진'],
    ['/about.html', '서비스 소개'],
  ];
  return `<nav class="sitenav">
  <a class="brand" href="/">BMTI</a>
  ${items.filter(([h]) => h !== here).map(([h, t]) => `<a class="lnk" href="${h}">${t}</a>`).join('\n  ')}
</nav>`;
};

export const siteFooter = () => `<footer class="site">
  <a href="/about.html">서비스 소개</a><a href="/contact.html">문의</a><a href="/privacy.html">개인정보처리방침</a><a href="/terms.html">이용약관</a>
  <p style="margin:10px 0 0">BMTI 건강 다이어리 · 본 사이트의 건강 정보는 일반적인 참고용이며 의학적 진단·치료를 대신하지 않습니다.</p>
</footer>`;

// 광고는 '읽을 본문이 있는 페이지'에만 붙인다. 앱 화면(index.html)에는 넣지 않는다.
export const adsenseTags = () => `<meta name="google-adsense-account" content="${ADSENSE}" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}" crossorigin="anonymous"></script>`;

export function page({ title, description, canonical, ogImage, ogType = 'article', body, ads = true }) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:site_name" content="BMTI 건강 다이어리" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${canonical}" />${ogImage ? `
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />` : ''}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />${ogImage ? `
<meta name="twitter:image" content="${ogImage}" />` : ''}
<link rel="apple-touch-icon" href="/favicon.svg" />
${ads ? adsenseTags() : ''}
<style>${BASE_CSS}</style>
</head>
<body>
<div class="wrap">
${body}
${siteFooter()}
</div>
</body>
</html>
`;
}
