const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`PAGE ERROR: ${msg.text()}`);
    else console.log(`PAGE CONSOLE: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`UNCAUGHT PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  console.log("Navigating to http://localhost:5173 ...");
  await page.goto('http://localhost:5173');

  console.log("Waiting for Start button...");
  await page.waitForSelector('button:has-text("BMTI test GO!")');
  await page.click('button:has-text("BMTI test GO!")');

  // Let's answer 12 questions quickly!
  for (let i = 0; i < 12; i++) {
    console.log(`Answering question ${i+1}...`);
    await page.waitForSelector('#answer-1');
    await page.click('#answer-1');
    await page.waitForTimeout(100); 
  }

  console.log("Waiting for ResultView...");
  await page.waitForTimeout(3000); 

  await page.screenshot({ path: 'screenshot.png' });
  console.log("Screenshot saved.");
  await browser.close();
})();
