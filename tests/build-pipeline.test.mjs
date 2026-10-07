import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const vite = fs.readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8');
const copy = fs.readFileSync(new URL('../scripts/copy-static.mjs', import.meta.url), 'utf8');

assert.match(html, /<script\s+type=["']module["']\s+src=["']\/src\/main\.jsx["']><\/script>/, 'index.html must load the Vite entry module');
assert.doesNotMatch(html, /@babel\/standalone|text\/babel/, 'browser Babel must be removed');
assert.doesNotMatch(html, /type=["']importmap["']|esm\.sh\/react|esm\.sh\/lucide-react/, 'browser import map/CDN React dependencies must be removed');
assert.match(html, /cdn\.tailwindcss\.com/, 'Tailwind CDN remains intentionally in Task #4B');
assert.equal(pkg.dependencies.react, '18.2.0');
assert.equal(pkg.dependencies['react-dom'], '18.2.0');
assert.equal(pkg.dependencies['lucide-react'], '0.344.0');
assert.ok(pkg.devDependencies.vite, 'Vite must be a development dependency');
assert.match(pkg.scripts.build, /vite build/);
assert.match(pkg.scripts.build, /copy-static\.mjs/);
assert.match(vite, /base:\s*['"]\.\/['"]/, 'Vite must emit relative asset URLs for GitHub Pages repository hosting');
for (const file of ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png']) {
  assert.ok(copy.includes(`'${file}'`), `${file} must be copied into dist`);
}

console.log('Build pipeline regression guard: PASS');
console.log('Verified Vite entry, npm React dependencies, relative Pages base, Tailwind scope, and PWA artifact copy.');
