import assert from 'node:assert/strict';
import { rankSearchItems } from '../src/search-ranking.js';
import { SEARCH_EVALUATION_ITEMS, SEARCH_EVALUATION_CASES } from './fixtures/search-evaluation-fixtures.mjs';

let top1Hits = 0;
let requiredTopNHits = 0;
let requiredTopNTotal = 0;
const failures = [];

for (const scenario of SEARCH_EVALUATION_CASES) {
  const ranked = rankSearchItems(SEARCH_EVALUATION_ITEMS, scenario.query, scenario.filter || 'all', 40);
  const ids = ranked.map(item => item.id);
  const topIds = ids.slice(0, scenario.topN);
  const top1Ok = ids[0] === scenario.expectedTop1;
  if (top1Ok) top1Hits += 1;
  else failures.push(`${scenario.name}: expected Top-1 ${scenario.expectedTop1}, got ${ids[0] || '(none)'}`);

  for (const expected of scenario.expectedTopN) {
    requiredTopNTotal += 1;
    if (topIds.includes(expected)) requiredTopNHits += 1;
    else failures.push(`${scenario.name}: expected ${expected} within Top-${scenario.topN}; got [${topIds.join(', ')}]`);
  }
}

const top1Rate = top1Hits / SEARCH_EVALUATION_CASES.length;
const topNRecall = requiredTopNHits / requiredTopNTotal;
assert.equal(top1Rate, 1, failures.join('\n'));
assert.equal(topNRecall, 1, failures.join('\n'));

console.log('Search evaluation quality baseline guard: PASS');
console.log(`Baseline: ${SEARCH_EVALUATION_CASES.length} scenarios; Top-1 accuracy ${(top1Rate * 100).toFixed(0)}%; required Top-N recall ${(topNRecall * 100).toFixed(0)}%.`);
console.log('Fixtures are synthetic and contain no production/user data.');
