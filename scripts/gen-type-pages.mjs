// 16가지 BMTI 유형 페이지를 정적 HTML로 프리렌더링한다.
//   node scripts/gen-type-pages.mjs
//
// 지금까지 public/t/*.html은 본문 105자에 60ms 뒤 테스트로 자동 이동하는 페이지였다.
// 크롤러와 사람에게 서로 다른 것을 보여주는 도어웨이 구조라 애드센스 정책에 걸린다.
// 이 스크립트는 같은 주소를 '결과지 본문을 그대로 담은 읽을거리'로 바꾼다.
//
// 중복 콘텐츠를 피하려고, 유형마다 고유한 글(summary·bodyGuide·궁합)을 위에 배치하고
// 축을 공유하는 유형끼리 겹치는 글(성향 축 설명·강사 가이드)은 아래에 둔다.
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { SITE, esc, paras, page, siteNav } from './lib/shell.mjs';

const { BMTI_RESULTS } = await import('../src/bmti_results.js');
const { INSTRUCTOR_GUIDE_DATA, BODY_GUIDE_DATA, TENDENCY_DATA } = await import('../src/customResultData.js');
// src/data.js는 이미지(.webp)를 import해서 Node로 직접 불러올 수 없다.
// 필요한 두 상수만 소스에서 떼어내 읽는다.
const { CHARACTER_NAMES, CODE_KO } = (() => {
  const src = readFileSync('src/data.js', 'utf8');
  const pick = (name) => {
    const i = src.indexOf(`export const ${name} = {`);
    if (i < 0) throw new Error(`${name}을 src/data.js에서 찾지 못했습니다`);
    const start = src.indexOf('{', i);
    let depth = 0;
    for (let j = start; j < src.length; j++) {
      if (src[j] === '{') depth++;
      else if (src[j] === '}' && --depth === 0) {
        return new Function(`return ${src.slice(start, j + 1)}`)();
      }
    }
    throw new Error(`${name} 파싱 실패`);
  };
  return { CHARACTER_NAMES: pick('CHARACTER_NAMES'), CODE_KO: pick('CODE_KO') };
})();

const AXIS_LABEL = {
  A: '에너지', O: '에너지', C: '시야', L: '시야',
  D: '학습', Q: '학습', Z: '피드백', M: '피드백',
};

// nickname/catchphrase는 줄바꿈이 섞여 있어 한 줄로 다듬어 쓴다.
const oneLine = (s) => String(s || '').replace(/\s*\n\s*/g, ' ').trim();

// 결과지 원문에 남아 있는 [닉네임] 자리표시자를 실제 별명으로 채운다.
const fillNick = (s, nick) => String(s || '').replace(/\[닉네임\]/g, nick);

const codes = Object.keys(BMTI_RESULTS);
mkdirSync('public/t', { recursive: true });

// 유형 목록(다른 유형 둘러보기 · 목록 페이지 공용)
const gridLinks = (exclude) => `<div class="grid">
${codes.filter((c) => c !== exclude).map((c) => `  <a href="/t/${c}.html"><b>${esc(CHARACTER_NAMES[c] || c)}</b><span>${c} ${esc(CODE_KO[c] || '')}</span></a>`).join('\n')}
</div>`;

let made = 0;
const summary = [];

for (const code of codes) {
  const r = BMTI_RESULTS[code];
  const nick = oneLine(r.nickname);
  const catch1 = oneLine(r.catchphrase);
  const koRead = CODE_KO[code] || '';
  const bodyGuide = BODY_GUIDE_DATA[code] || '';
  const guide = INSTRUCTOR_GUIDE_DATA[code.substring(2, 4) + '_flexible'];

  // 네 글자 각각의 성향 설명 — 조합은 유형마다 다르다.
  const axes = code.split('').map((letter) => {
    const t = TENDENCY_DATA[letter];
    if (!t) return null;
    const v = t.confident || t.flexible;
    return { letter, label: AXIS_LABEL[letter] || '성향', name: t.name, quote: v?.quote, desc: v?.desc };
  }).filter(Boolean);

  const title = `${nick} — BMTI ${code} 유형 특징과 운동·회복 가이드`;
  const description = `${catch1.replace(/\s+/g, ' ').slice(0, 90)} BMTI ${code}(${koRead}) 유형의 성향, 뻐근할 때의 습관, 잘 맞는 강사와 운동 환경을 정리했습니다.`;

  const body = `${siteNav()}
<article>
  <span class="tag">BMTI ${esc(code)} ${esc(koRead)}</span>
  <h1>${esc(nick)}</h1>
  <p class="lede">${esc(catch1)}</p>

  <figure>
    <img src="/share/${code}.jpg" alt="BMTI ${code} 유형 ${esc(nick)} 캐릭터" width="1200" height="630" loading="lazy" />
    <figcaption>BMTI ${esc(code)} · ${esc(CHARACTER_NAMES[code] || nick)}</figcaption>
  </figure>

  <h2>어떤 유형인가요</h2>
  ${paras(fillNick(r.summary, nick))}

  ${bodyGuide ? `<h2>몸이 뻐근할 때 이 유형은</h2>
  ${paras(fillNick(bodyGuide, nick))}` : ''}

  <h2>네 글자가 뜻하는 것</h2>
  <p class="muted">BMTI는 네 가지 축으로 움직임 성향을 봅니다. ${esc(code)}는 아래 네 가지가 겹친 유형이에요.</p>
${axes.map((a) => `  <div class="card">
    <h3>${esc(a.letter)} · ${esc(a.name)} <span class="muted">(${esc(a.label)})</span></h3>
    ${a.quote ? `<p><strong>“${esc(a.quote)}”</strong></p>` : ''}
    ${a.desc ? `<p>${esc(a.desc)}</p>` : ''}
  </div>`).join('\n')}

  <h2>다른 유형과의 궁합</h2>
  ${paras(fillNick(r.goodMatch, nick))}
  ${paras(fillNick(r.badMatch, nick))}

  ${guide ? `<h2>운동 강사를 고를 때</h2>
  <div class="card">
    <h3>잘 맞는 강사</h3>
    <p>${esc(guide.goodGuide)}</p>
    <h3>안 맞는 강사</h3>
    <p>${esc(guide.badGuide)}</p>
    ${guide.tools ? `<h3>손이 잘 가는 도구</h3><p>${esc(guide.tools)}</p>` : ''}
  </div>` : ''}

  <h2>내 유형도 확인해보기</h2>
  <p>BMTI는 물리치료사가 설계한 움직임 성향 검사입니다. 2분이면 끝나고 로그인 없이 볼 수 있어요.
     검사를 마치면 이 페이지보다 자세한 개인 결과지와, 매일의 컨디션을 기록하는 건강 다이어리를 함께 쓸 수 있습니다.</p>
  <p><a class="cta" href="/#example-${code}">BMTI 테스트 하러 가기 →</a></p>

  <h2>다른 유형 둘러보기</h2>
  ${gridLinks(code)}

  <p class="disclaimer">본 페이지의 내용은 움직임 성향에 대한 일반적인 안내이며, 의학적 진단이나 치료를 대신하지 않습니다.
     통증이 2주 이상 이어지거나 저림·힘 빠짐이 있다면 전문가의 진료를 받아보시길 권합니다.</p>
</article>`;

  const html = page({
    title,
    description,
    canonical: `${SITE}/t/${code}.html`,
    ogImage: `${SITE}/share/${code}.jpg`,
    ogType: 'article',
    body,
  });

  writeFileSync(`public/t/${code}.html`, html);
  const text = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  summary.push([code, text.length]);
  made++;
}

// 유형 목록 페이지 — 16개 페이지로 가는 허브
const indexBody = `${siteNav('/t/')}
<h1>BMTI 16가지 움직임 유형</h1>
<p class="lede">몸이 뻐근할 때 어떻게 반응하는지, 어떤 말이 힘이 되는지는 사람마다 다릅니다.
   BMTI는 그 차이를 네 가지 축으로 나눠 16가지 유형으로 정리한 움직임 성향 검사입니다.</p>

<h2>네 가지 축</h2>
<ul class="clean">
  <li><strong>에너지 (A / O)</strong> — 몸을 움직여 풀지, 쉬면서 회복할지</li>
  <li><strong>시야 (C / L)</strong> — 불편한 곳만 볼지, 몸 전체를 볼지</li>
  <li><strong>학습 (D / Q)</strong> — 일단 해보며 익힐지, 원리를 알고 시작할지</li>
  <li><strong>피드백 (Z / M)</strong> — 사실대로 짚어주길 원할지, 응원을 원할지</li>
</ul>
<p>이 네 가지가 겹쳐 <strong>16가지 유형</strong>이 만들어집니다. 아래에서 유형별 특징과 회복 습관, 잘 맞는 운동 환경을 확인해보세요.</p>

<h2>유형 전체 보기</h2>
${gridLinks(null)}

<h2>내 유형이 궁금하다면</h2>
<p>검사는 2분이면 끝나고 로그인이 필요 없습니다. 결과지에는 유형 설명과 함께
   내 몸의 회복 습관, 잘 맞는 강사 유형, 피해야 할 운동 환경까지 담겨 있어요.</p>
<p><a class="cta" href="/">BMTI 테스트 하러 가기 →</a></p>`;

writeFileSync('public/t/index.html', page({
  title: 'BMTI 16가지 움직임 유형 — 유형별 특징과 회복 가이드',
  description: '몸이 뻐근할 때의 반응, 잘 맞는 운동 환경, 회복 습관을 16가지 유형으로 정리했습니다. 물리치료사가 설계한 BMTI 움직임 성향 검사.',
  canonical: `${SITE}/t/`,
  ogImage: `${SITE}/og-cover.png`,
  ogType: 'website',
  body: indexBody,
}));

console.log(`유형 페이지 ${made}개 + 목록 1개 생성`);
const lens = summary.map(([, n]) => n);
console.log(`본문 글자수 최소 ${Math.min(...lens)} / 평균 ${Math.round(lens.reduce((a, b) => a + b, 0) / lens.length)} / 최대 ${Math.max(...lens)}`);
