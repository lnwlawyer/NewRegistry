import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');

const viewport = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']+)["'][^>]*>/i)?.[1] || '';
assert.ok(viewport, 'viewport meta must exist');
assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/i, 'viewport must not disable user scaling');
assert.doesNotMatch(viewport, /maximum-scale\s*=\s*1(?:\.0)?/i, 'viewport must not cap zoom at 1x');
assert.match(viewport, /width=device-width/);
assert.match(viewport, /initial-scale=1\.0/);
assert.match(viewport, /viewport-fit=cover/);

assert.match(main, /เปิดเว็บไซต์ภายนอก/, 'embedded government views must expose an external-open fallback');
assert.match(main, /target=["']_blank["']/, 'external fallback must open outside the embedded view');
assert.match(main, /rel=["']noopener noreferrer["']/, 'external fallback must protect opener/referrer');
assert.match(main, /aria-label=\{\`เปิด \$\{title\} ในเว็บไซต์ภายนอก\`\}/, 'external fallback must have an accessible label');
assert.match(main, /<iframe[\s\S]*sandbox=["']allow-same-origin allow-scripts allow-popups allow-forms["']/, 'existing iframe sandbox must remain');
assert.match(main, /https:\/\/comment\.ocs\.go\.th/);
assert.match(main, /https:\/\/deka\.supremecourt\.or\.th\//);

console.log('Accessibility and external-link resilience guard: PASS');
console.log('Verified zoom accessibility, safe external fallback, government targets, and preserved iframe sandbox.');
