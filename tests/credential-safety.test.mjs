#!/usr/bin/env node
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

const forbidden = [
  {
    name: 'Gemini API key persisted in localStorage',
    pattern: /localStorage\.setItem\(\s*['"]gemini_api_key['"]/,
  },
  {
    name: 'SLegal API key persisted in localStorage',
    pattern: /localStorage\.setItem\(\s*['"]slegal_api_key['"]/,
  },
  {
    name: 'Third-party corsproxy.io credential transport',
    pattern: /corsproxy\.io/i,
  },
  {
    name: 'Direct browser fetch to SLegal API',
    pattern: /fetch\(\s*['"`]https:\/\/api\.slegaltools\.digital/i,
  },
  {
    name: 'Unsafe absolute API-key safety claim',
    pattern: /ปลอดภัย\s*100%/i,
  },
];

const failures = forbidden.filter(({ pattern }) => pattern.test(source));

if (failures.length) {
  console.error('Credential safety regression detected:');
  for (const failure of failures) console.error(`- ${failure.name}`);
  process.exit(1);
}

const required = [
  {
    name: 'legacy Gemini localStorage cleanup',
    pattern: /localStorage\.removeItem\(\s*['"]gemini_api_key['"]\s*\)/,
  },
  {
    name: 'SLegal unsafe transport remains fail-closed',
    pattern: /ปิดการค้นหาผ่าน API ชั่วคราวเพื่อความปลอดภัย/,
  },
];

const missing = required.filter(({ pattern }) => !pattern.test(source));

if (missing.length) {
  console.error('Credential safety invariant missing:');
  for (const item of missing) console.error(`- ${item.name}`);
  process.exit(1);
}

console.log('Credential safety regression guard: PASS');
console.log(`Checked ${forbidden.length} forbidden patterns and ${required.length} required invariants.`);
