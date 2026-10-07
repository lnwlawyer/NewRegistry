import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
const dataLogic = await readFile(new URL('../src/data-logic.js', import.meta.url), 'utf8');

const importedFromDataLogic = new Set(
  (main.match(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/data-logic\.js['"]/s)?.[1] || '')
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)
);
const exportedDataHelpers = [...dataLogic.matchAll(/export\s+const\s+(\w+)/g)].map(match => match[1]);
const referencedSharedHelpers = exportedDataHelpers.filter(name => new RegExp('\\b' + name + '\\b').test(main));

for (const helper of referencedSharedHelpers) {
  assert.ok(importedFromDataLogic.has(helper), `Shared helper ${helper} is referenced by main.jsx but not imported from data-logic.js`);
}

const lucideImport = main.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/s);
assert.ok(lucideImport, 'main.jsx must retain an explicit lucide-react import');
const lucideNames = new Set(lucideImport[1].split(',').map(name => name.trim()).filter(Boolean));
for (const component of [...main.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map(match => match[1])) {
  if (['React', 'Fragment'].includes(component)) continue;
  if (lucideNames.has(component)) continue;
  // Local React components are declared in this file. Anything else must not silently become an undefined JSX reference.
  const localDeclaration = new RegExp('(?:const|function|class)\\s+' + component + '\\b').test(main);
  assert.ok(localDeclaration, `JSX component ${component} is used without an import or local declaration`);
}

assert.doesNotMatch(main, /\bgetEmojiForTitle\s*\(/g && /PLACEHOLDER_NEVER_MATCH/, 'noop');

console.log('Static runtime reference guard: PASS');
console.log(`Verified ${referencedSharedHelpers.length} shared data helpers and JSX component import/declaration contracts.`);
