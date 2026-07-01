const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let errors = [];

  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`UNCAUGHT PAGE ERROR: ${error.message}`);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`PAGE ERROR: ${msg.text()}`);
    else console.log(`PAGE CONSOLE: ${msg.text()}`);
  });

  console.log("Navigating to https://bmti-official.github.io/BMTI-platform/ ...");
  await page.goto('https://bmti-official.github.io/BMTI-platform/');
  await page.waitForTimeout(2000);

  console.log("Waiting for Start button...");
  const startBtn = await page.$('button:has-text("BMTI test GO!")');
  if (startBtn) {
    console.log("Start button found! Clicking...");
    await startBtn.click();
    
    for (let i = 0; i < 12; i++) {
      console.log(`Answering question ${i+1}...`);
      await page.waitForSelector('#answer-4');
      await page.click('#answer-4');
      await page.waitForTimeout(100); 
    }
  } else {
    console.log("Start button NOT FOUND!");
  }

  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'screenshot_live.png' });
  console.log("Screenshot saved.");

  if (errors.length > 0) {
    console.log("ERRORS DETECTED:", errors);
  } else {
    console.log("NO ERRORS.");
  }

  await browser.close();
})();
