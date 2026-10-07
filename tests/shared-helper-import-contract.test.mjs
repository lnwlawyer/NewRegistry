import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getEmojiForTitle } from '../src/data-logic.js';

const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

assert.match(
  source,
  /import\s*\{[^}]*\bgetEmojiForTitle\b[^}]*\}\s*from\s*['"]\.\/data-logic\.js['"]/s,
  'main.jsx must import getEmojiForTitle from data-logic.js before using it'
);
assert.equal(getEmojiForTitle('คนต่างด้าว'), '🌍');
assert.equal(getEmojiForTitle('การจดทะเบียน'), '📝');

console.log('Shared data helper import contract guard: PASS');
console.log('Verified main.jsx imports the exported getEmojiForTitle helper it renders with.');
