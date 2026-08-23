// 서비스 소개 · 문의 페이지를 정적 HTML로 발행한다.
//   node scripts/gen-info-pages.mjs
//
// 두 글은 원래 AboutModal.jsx / ContactModal.jsx 안에만 있었다. 모달이라 고유 주소가 없어
// 크롤러도 애드센스 심사자도 찾아올 수 없었다. 같은 내용을 주소가 있는 페이지로 옮긴다.
import { writeFileSync } from 'fs';
import { SITE, page, siteNav } from './lib/shell.mjs';

const KAKAO = 'http://pf.kakao.com/_xasxgZX/chat';

const aboutBody = `${siteNav('/about.html')}
<h1>서비스 소개</h1>
<p class="lede">BMTI는 물리치료사가 설계한 움직임 성향 검사와, 매일의 컨디션을 기록하는 건강 다이어리를 함께 제공하는 웹 서비스입니다.</p>

<h2>BMTI, 내 몸을 알아가는 가장 귀여운 방법</h2>
<p>BMTI(Body Management Type Indicator)는 물리치료사가 설계한 <strong>움직임 성향 검사</strong>입니다.
   2분이면 끝나는 검사로 내가 몸을 어떻게 움직이고 관리하는지 16가지 유형으로 알려드리고,
   그에 맞춰 매일의 컨디션을 기록·분석하도록 돕는 <strong>건강 다이어리</strong>로 이어집니다.</p>
<p>같은 뻐근함이라도 사람마다 반응이 다릅니다. 어떤 사람은 일단 움직여야 풀리고, 어떤 사람은 쉬어야 회복됩니다.
   어떤 사람은 “여기가 문제입니다”라는 말에 힘을 얻고, 어떤 사람은 그 말에 마음을 닫습니다.
   BMTI는 그 차이를 네 가지 축으로 나눠 정리한 뒤, 내 성향에 맞는 회복 습관과 운동 환경을 제안합니다.</p>

<h2>이런 걸 할 수 있어요</h2>
<ul class="clean">
  <li><strong>BMTI 검사</strong> — 2분 만에 내 움직임 성향(16유형)과 파트너 캐릭터 확인</li>
  <li><strong>건강 다이어리</strong> — 하루 1분, 기분·수면·불편한 부위·운동을 귀엽게 기록</li>
  <li><strong>기록·발견 리포트</strong> — 쌓인 기록으로 내 몸의 월간 패턴과 인사이트를 발견</li>
  <li><strong>BMTI 관계도</strong> — 16가지 유형이 어떻게 이어지는지 살펴보고 예시 결과지 확인</li>
  <li><strong>BMTI 빙고판</strong> — 유형별 성향·가이드 문구로 채우는 나만의 빙고판</li>
</ul>

<h2>네 가지 축으로 봅니다</h2>
<ul class="clean">
  <li><strong>에너지 (A / O)</strong> — 몸을 움직여 풀지, 쉬면서 회복할지</li>
  <li><strong>시야 (C / L)</strong> — 불편한 곳만 볼지, 몸 전체를 볼지</li>
  <li><strong>학습 (D / Q)</strong> — 일단 해보며 익힐지, 원리를 알고 시작할지</li>
  <li><strong>피드백 (Z / M)</strong> — 사실대로 짚어주길 원할지, 응원을 원할지</li>
</ul>
<p>네 축이 겹쳐 16가지 유형이 나옵니다. <a href="/t/">유형별 특징과 회복 가이드</a>에서 전체를 볼 수 있어요.</p>

<h2>우리가 지키는 것</h2>
<p>몸과 마음을 다정하게 챙기는 경험을 만들기 위해, 어렵고 딱딱한 건강 정보 대신
   누구나 매일 부담 없이 이어갈 수 있는 기록 습관을 지향합니다.
   하루에 1분, 오늘 기분이 어땠는지 눌러두는 것만으로도 한 달 뒤에는 패턴이 보입니다.</p>

<h2>운영 정보</h2>
<ul class="clean">
  <li>서비스명 — BMTI 건강 다이어리</li>
  <li>운영 — 자기점검 50분</li>
  <li>책임자 — 이응준</li>
  <li>연락처 — 070-8027-8648 · <a href="${KAKAO}" target="_blank" rel="noopener">카카오톡 채널 1:1 문의</a></li>
</ul>

<div class="card">
  <p class="muted">※ BMTI가 제공하는 검사 결과·리포트·가이드는 신체 기능 향상과 웰니스를 위한 참고용 정보이며,
     의학적 진단·처방·치료를 대신하는 의료 행위가 아닙니다. 통증이나 질환이 있는 경우 반드시 전문의의 진료를 받아주세요.</p>
  <p class="muted" style="margin-bottom:0">※ 일부 캐릭터·이미지는 생성형 AI로 제작되었으며, 결과지·리포트는 입력하신 기록을 바탕으로 자동 생성됩니다.</p>
</div>

<p><a class="cta" href="/">BMTI 테스트 하러 가기 →</a></p>`;

const contactBody = `${siteNav('/contact.html')}
<h1>문의하기</h1>
<p class="lede">서비스 이용, 제휴, 광고, 개인정보 관련 문의를 받고 있습니다. 확인하는 대로 답변드릴게요.</p>

<h2>가장 빠른 방법 — 카카오톡 채널</h2>
<p>카카오톡 채널 1:1 채팅이 가장 빠르게 답변드릴 수 있는 방법입니다.
   서비스 오류, 기록이 사라진 경우, 결과지 관련 질문은 이쪽으로 남겨주세요.</p>
<p><a class="cta" href="${KAKAO}" target="_blank" rel="noopener">카카오톡 채널로 문의하기 →</a></p>

<h2>전화</h2>
<p>070-8027-8648 (평일 상담 가능)</p>

<h2>어떤 문의를 받나요</h2>
<ul class="clean">
  <li><strong>서비스 이용 문의</strong> — 검사 결과, 다이어리 기록, 리포트에 대한 질문</li>
  <li><strong>오류 신고</strong> — 화면이 열리지 않거나 기록이 저장되지 않는 경우</li>
  <li><strong>제휴·광고 문의</strong> — 콘텐츠 제휴, 클래스 입점, 광고 문의</li>
  <li><strong>개인정보 관련</strong> — 열람·정정·삭제·처리정지 요청, 동의 철회</li>
</ul>

<h2>개인정보 보호책임자</h2>
<ul class="clean">
  <li>성명 — 이응준</li>
  <li>소속·직위 — 자기점검 50분 대표</li>
  <li>전화 — 070-8027-8648</li>
</ul>
<p>개인정보 처리에 관한 자세한 내용은 <a href="/privacy.html">개인정보처리방침</a>에서 확인하실 수 있습니다.</p>

<div class="card">
  <p class="muted" style="margin-bottom:0">※ 통증·질환에 대한 의학적 상담은 제공하지 않습니다.
     증상이 이어진다면 가까운 의료기관에서 진료를 받아보시길 권합니다.</p>
</div>`;

writeFileSync('public/about.html', page({
  title: '서비스 소개 — BMTI 건강 다이어리',
  description: 'BMTI는 물리치료사가 설계한 움직임 성향 검사와 건강 다이어리를 함께 제공하는 웹 서비스입니다. 서비스 구성, 네 가지 성향 축, 운영 정보를 안내합니다.',
  canonical: `${SITE}/about.html`,
  ogImage: `${SITE}/og-cover.png`,
  ogType: 'website',
  body: aboutBody,
}));

writeFileSync('public/contact.html', page({
  title: '문의하기 — BMTI 건강 다이어리',
  description: 'BMTI 건강 다이어리 서비스 이용·오류 신고·제휴·개인정보 관련 문의 안내. 카카오톡 채널과 전화로 연락하실 수 있습니다.',
  canonical: `${SITE}/contact.html`,
  ogImage: `${SITE}/og-cover.png`,
  ogType: 'website',
  body: contactBody,
  ads: false, // 문의 페이지는 읽을 본문이 짧아 광고를 붙이지 않는다.
}));

console.log('about.html · contact.html 생성');
