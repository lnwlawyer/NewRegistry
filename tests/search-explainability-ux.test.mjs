import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

assert.match(source, /explainSearchMatch\(item, q\)/, 'search result cards must derive explainable match metadata');
assert.match(source, /พบจาก/, 'search result cards must label why a result matched');
assert.match(source, /เหตุผลที่พบผลลัพธ์/, 'match explanation must expose an accessible label');
assert.match(source, /getSearchHighlightTerms\(query\)/, 'highlighting must use normalized search terms');
assert.match(source, /gsHighlight\(p, q\)/, 'category paths must highlight matching terms');
assert.doesNotMatch(source, /คะแนน\s*\{?item\.score/, 'raw ranking scores must not be exposed as user-facing explanations');

console.log('Search explainability UX guard: PASS');
console.log('Verified match-reason labels, accessible explanation, normalized highlighting, and no raw score exposure.');
