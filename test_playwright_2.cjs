const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('pageerror', error => {
    console.log(`UNCAUGHT PAGE ERROR: ${error.message}`);
  });

  await page.goto('http://localhost:5173');
  await page.click('button:has-text("BMTI test GO!")');

  for (let i = 0; i < 12; i++) {
    await page.waitForSelector('#answer-4');
    await page.click('#answer-4');
    await page.waitForTimeout(100); 
  }

  await page.waitForTimeout(2000); 
  await page.screenshot({ path: 'screenshot4.png' });
  console.log("Done 4.");

  await browser.close();
})();
