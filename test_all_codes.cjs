const { chromium } = require('@playwright/test');

const codes = [
  'ACDZ', 'ACDM', 'ACQZ', 'ACQM',
  'ALDZ', 'ALDM', 'ALQZ', 'ALQM',
  'OCDZ', 'OCDM', 'OCQZ', 'OCQM',
  'OLDZ', 'OLDM', 'OLQZ', 'OLQM'
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let errors = [];

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  for (const code of codes) {
    errors = []; // Reset errors for each run
    console.log(`Testing ${code}...`);
    await page.goto(`http://localhost:5173/#${code}`);
    await page.waitForTimeout(1000); // Wait for render
    
    if (errors.length > 0) {
      console.log(`❌ ERROR on ${code}:`, errors);
    } else {
      console.log(`✅ SUCCESS on ${code}`);
    }
  }

  await browser.close();
})();
