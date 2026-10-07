import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');

assert.match(source, /root\.render\(\s*<ErrorBoundary>\s*<App \/>\s*<\/ErrorBoundary>/s, 'App must be protected by a root-level ErrorBoundary');
assert.match(source, /const requestController = new AbortController\(\)/, 'each source request needs its own timeout controller');
assert.doesNotMatch(source, /setTimeout\(\(\) => controller\.abort\('timeout'\)/, 'source timeout must not abort the overall load controller');
assert.match(source, /if \(!onlySource\) setIsLoading\(true\)/, 'targeted retry must not hide the whole app behind global loading');
assert.match(source, /if \(!onlySource && !signal\.aborted\) setIsLoading\(false\)/, 'global loading state must belong to full loads only');
assert.match(source, /\bExternalLink\b[\s\S]*from 'lucide-react'/, 'ExternalLink used by embedded-site fallback must be imported');

console.log('Production blank-screen recovery guard: PASS');
console.log('Verified root crash fallback, isolated source timeouts, non-blocking targeted retry, and external-link icon import.');
// CI trigger marker: production incident recovery.
