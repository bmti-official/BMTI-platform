/**
 * 앱스토어 미리보기용 실제 화면 캡처.
 *  실행: npm run dev 를 띄운 뒤  node tools/capture-appstore.cjs
 *  결과: appstore/raw/*.png  (1320x2868 = iPhone 6.9" 규격, 440x956 @3x)
 */
const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BMTI_BASE || 'http://localhost:5173/BMTI-platform';
const OUT = path.resolve(__dirname, '..', 'appstore', 'raw');

// 데모용 시드 — 실제 서비스 화면이 풍성하게 보이도록 한 달치 기록을 넣는다.
const seed = () => {
  const ans = [1, 4, 1, 1, 1, 1, 1, 4, 1, 1, 4, 1, 4, 1, 1, 1]; // OLQM
  localStorage.setItem('bmti_answers', JSON.stringify(ans));
  localStorage.setItem('bmti_code', 'OLQM');
  localStorage.setItem('bmti_user', JSON.stringify({ id: 'demo', nickname: '지운', bmti_type: 'OLQM', bmti_code: 'OLQM', bmti_answers: ans, kakao_gender: 'female' }));
  localStorage.setItem('bmti_health_consent', 'v1.0:opt');
  localStorage.setItem('bmti_diary_onboarded', '1');
  localStorage.setItem('bmti_sleep_setting', JSON.stringify({ mode: 'manual', base: '밤 12시', month: '2026-08' }));
  localStorage.setItem('bmti_mallang_info', JSON.stringify({ sore: [{ part: 'neck', when: ['sitting'] }, { part: 'back', when: ['sitting'] }] }));
  const buckets = ['~10시', '11시', '12시', '1시', '2시~'];
  const TAGS = ['카페인', '스트레스', '걷기/산책', '수분 보충', '야식·과식', '생리 중'];
  const NOTES = ['오늘도 무사히 하루를 보냈다.', '점심에 산책하니 개운했다.', '어깨가 좀 뻐근한 하루.', '일찍 자려고 노력했다.'];
  const hist = [];
  for (let d = 1; d <= 24; d++) {
    const dd = String(d).padStart(2, '0');
    const tags = [TAGS[d % 6], TAGS[(d + 2) % 6]];
    hist.push({
      date: `2026-08-${dd}`, mood: (d % 5) + 1, sleep: d % 4, sleepTime: buckets[d % 5],
      soreness: [{ part: 'neck', when: 'sitting', level: (d % 5) + 3 }],
      tags, note: { category: '일상', text: NOTES[d % 4] },
      overwork: { yes: d % 2 === 0, loads: ['sit'] }, exercise: { did: d % 3 !== 0, types: ['run'], reason: 'tired' },
    });
  }
  localStorage.setItem('bmti_diary_history', JSON.stringify(hist));
};

const shots = [
  { name: '1-result-top',   go: 'type',      scroll: 0 },
  { name: '2-tendency',     go: 'type',      find: '나를 움직이게 하는 4가지 성향' },
  { name: '3-diary-mood',   go: 'diary',     keepPopup: true },
  { name: '4-diary-body',   go: 'write',     find: '불편한 부위' },
  { name: '5-awards',       go: 'records',   find: '말랑이 어워즈' },
  { name: '6-trend',        go: 'discovery', find: '기분과 불편함 추이' },
  { name: '7-relation',     go: 'home',      find: 'BMTI 관계도' },
  { name: '8-share',        go: 'type',      find: '친구에게 공유하기' },
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route('**/rest/v1/**', r => r.fulfill({ status: 404, body: '{}' }));
  await page.addInitScript(seed);

  const dismissPopup = async () => {
    await page.keyboard.press('Escape').catch(() => {});
    const x = page.locator('[aria-label="닫기"]').first();
    if (await x.count()) await x.click().catch(() => {});
    await page.waitForTimeout(300);
  };

  for (const s of shots) {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2200);
    if (!s.keepPopup) await dismissPopup();

    if (s.go === 'type')   await page.locator('text=나의유형').first().click().catch(() => {});
    if (s.go === 'diary')  await page.locator('nav button, [role=tab]').filter({ hasText: /다이어리/ }).first().click().catch(() => {});
    if (s.go === 'records' || s.go === 'discovery') await page.locator('text=기록·발견').last().click().catch(() => {});
    if (s.go === 'write') {
      await page.locator('nav button, [role=tab]').filter({ hasText: /다이어리/ }).first().click().catch(() => {});
      await page.waitForTimeout(1200); await dismissPopup();
      await page.locator('text=today').first().click().catch(() => {});
      await page.waitForTimeout(800);
      await page.locator('text=좋았어요').first().click().catch(() => {});
      await page.waitForTimeout(600);
      const more = page.locator('text=/조금 더 기록/').first();
      if (await more.count()) await more.click().catch(() => {});
      await page.waitForTimeout(900);
      const sim = page.locator('text=비슷해요').first();
      if (await sim.count()) await sim.click().catch(() => {});
    }
    await page.waitForTimeout(2200);

    if (s.go === 'records')   { const t = page.locator('text=이번달 기록').first(); if (await t.count()) await t.click().catch(() => {}); await page.waitForTimeout(1600); }
    if (s.go === 'discovery') { const t = page.locator('text=이번달 발견').first(); if (await t.count()) await t.click().catch(() => {}); await page.waitForTimeout(1600); }

    if (s.find) {
      const el = page.locator(`text=${s.find}`).first();
      if (await el.count()) { await el.scrollIntoViewIfNeeded().catch(() => {}); await page.evaluate(() => window.scrollBy(0, -70)); }
      await page.waitForTimeout(900);
    } else if (s.scroll) {
      await page.evaluate((y) => window.scrollTo(0, y), s.scroll);
      await page.waitForTimeout(600);
    }
    // 애니메이션 정지 — 캡처가 어중간한 프레임에서 잡히지 않게
    await page.addStyleTag({ content: '*,*::before,*::after{animation:none !important;transition:none !important;}.mallang-eye-cover{opacity:0 !important}' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${s.name}.png` });
    console.log('captured', s.name);
  }
  await browser.close();
})();
