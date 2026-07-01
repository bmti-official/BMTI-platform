import fs from 'fs';
const text = fs.readFileSync('./src/bmti_results.js', 'utf8');
const jsCode = text.replace('export const BMTI_RESULTS', 'const BMTI_RESULTS');
eval(jsCode + '\nconsole.log(JSON.stringify(Object.fromEntries(Object.entries(BMTI_RESULTS).map(([k,v]) => [k, {summary: v.summary, howToChooseInstructor: v.howToChooseInstructor, whyQuit: v.whyQuit, worstVibe: v.worstVibe, checkPoints: v.checkPoints}])), null, 2))');
