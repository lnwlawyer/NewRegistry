import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const moduleSource = fs.readFileSync(new URL('../src/data-logic.js', import.meta.url), 'utf8');

assert.match(
  html,
  /import\s*\{[^}]*parseCSV[^}]*transformManualData[^}]*transformDecisionData[^}]*evalCondition[^}]*transformChatbotData[^}]*transformArchiveData[^}]*\}\s*from\s*['"]\.\/src\/data-logic\.js['"]/s,
  'index.html must import production data logic from src/data-logic.js'
);

for (const name of ['parseCSV', 'transformManualData', 'transformDecisionData', 'evalCondition', 'transformChatbotData', 'transformArchiveData']) {
  assert.doesNotMatch(html, new RegExp(`const\\s+${name}\\s*=`), `${name} must not be redefined in index.html`);
  assert.match(moduleSource, new RegExp(`export\\s+const\\s+${name}\\s*=`), `${name} must be exported by src/data-logic.js`);
}

assert.doesNotMatch(moduleSource, /\b(?:React|document|window|localStorage|fetch)\b/, 'data logic module must remain dependency-free and browser-global-free');

console.log('Modularization structure guard: PASS');
console.log('Verified index imports shared data logic, no duplicate definitions, and module remains dependency-free.');
