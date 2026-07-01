const fs = require('fs');

// Read temp_results.txt
let rawTemp = fs.readFileSync('temp_results.txt', 'utf8');

// Fix the syntax error: literal backslash n outside the quote
// The string looks like: 가이드가 필요합니다."\n  },
rawTemp = rawTemp.replace(/"\\n  },/g, '"\n  },');

const jsCode = rawTemp.replace('export const BMTI_RESULTS = ', 'const BMTI_RESULTS = ');

let BMTI_RESULTS;
try {
  eval(jsCode + '; BMTI_RESULTS = BMTI_RESULTS;');
} catch (e) {
  console.error("Eval failed:", e);
  process.exit(1);
}

// Read the finalized shortened texts
const finalData = JSON.parse(fs.readFileSync('extracted_reports_final.json', 'utf8'));

// Inject the shortened texts into BMTI_RESULTS
for (const [key, fields] of Object.entries(finalData)) {
  if (BMTI_RESULTS[key]) {
    BMTI_RESULTS[key].summary = fields.summary;
    BMTI_RESULTS[key].howToChooseInstructor = fields.howToChooseInstructor;
    BMTI_RESULTS[key].whyQuit = fields.whyQuit;
    BMTI_RESULTS[key].worstVibe = fields.worstVibe;
    BMTI_RESULTS[key].checkPoints = fields.checkPoints;
  }
}

// Write to src/bmti_results.js
const exportStr = 'export const BMTI_RESULTS = ' + JSON.stringify(BMTI_RESULTS, null, 2) + ';';
fs.writeFileSync('src/bmti_results.js', exportStr, 'utf8');

console.log('Fixed and injected successfully!');
