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
    errors = []; // Reset
    console.log(`Testing PROD ${code}...`);
    // Note: react router hash vs path might be different, but we hacked App.jsx to read window.location.hash
    await page.goto(`http://localhost:3000/#${code}`);
    await page.waitForTimeout(1000); 
    
    if (errors.length > 0) {
      console.log(`❌ ERROR on ${code}:`, errors);
    } else {
      console.log(`✅ SUCCESS on ${code}`);
    }
  }

  await browser.close();
})();
