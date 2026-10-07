import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const script = await readFile(new URL('../scripts/check-bundle-budget.mjs', import.meta.url), 'utf8');
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const workflow = await readFile(new URL('../.github/workflows/credential-safety.yml', import.meta.url), 'utf8');

assert.match(script, /javascript:\s*350 \* 1024/, 'JavaScript budget must remain explicit');
assert.match(script, /css:\s*80 \* 1024/, 'CSS budget must remain explicit');
assert.match(script, /totalCode:\s*500 \* 1024/, 'combined code budget must remain explicit');
assert.match(script, /throw new Error/, 'budget overruns must fail closed');
assert.equal(pkg.scripts['check:bundle'], 'node scripts/check-bundle-budget.mjs');
assert.match(workflow, /npm run check:bundle/, 'CI must enforce the production bundle budget');

console.log('Performance budget baseline guard: PASS');
console.log('Verified explicit JS/CSS/combined budgets and CI enforcement.');
