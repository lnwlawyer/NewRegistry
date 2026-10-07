import fs from 'node:fs';
import assert from 'node:assert/strict';

const sw = fs.readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

assert.match(sw, /CACHE_NAME\s*=\s*['"]land-registry-v2['"]/, 'service worker cache version must advance from v1');
assert.doesNotMatch(sw, /CACHE_NAME\s*=\s*['"]land-registry-v1['"]/, 'legacy v1 cache must not remain active');
for (const file of ['./index.html', './manifest.json', './icon-192.png', './icon-512.png']) {
  assert.ok(sw.includes(`'${file}'`), `${file} must be included in the offline app shell`);
}
assert.match(sw, /addEventListener\(['"]activate['"]/, 'service worker must clean up old caches during activation');
assert.match(sw, /name\.startsWith\(['"]land-registry-['"]\)/, 'cache cleanup must be scoped to this app');
assert.match(sw, /name !== CACHE_NAME/, 'active cache must not be deleted');
assert.match(sw, /caches\.delete\(name\)/, 'old app caches must be deleted');
assert.match(sw, /self\.clients\.claim\(\)/, 'activated worker must claim existing clients');
assert.doesNotMatch(sw, /skipWaiting\s*\(/, 'worker must not force activation over an active session');
assert.match(sw, /request\.mode === ['"]navigate['"]/, 'navigation requests need an explicit update strategy');
assert.match(sw, /networkFirst\(request, ['"]\.\/index\.html['"]\)/, 'navigations must prefer the network and fall back to cached app shell');
assert.doesNotMatch(sw, /caches\.match\(event\.request\)[\s\S]*response \|\| fetch/, 'legacy cache-first fetch handler must not return');
assert.match(sw, /request\.method !== ['"]GET['"]/, 'non-GET requests must not be intercepted');
assert.match(sw, /url\.origin === self\.location\.origin/, 'runtime caching must remain same-origin only');

console.log('PWA update safety regression guard: PASS');
console.log('Verified versioned cleanup, network-first navigation, offline shell fallback, no forced activation, and same-origin runtime caching.');
