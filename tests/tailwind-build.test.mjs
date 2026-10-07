import fs from 'node:fs';
import assert from 'node:assert/strict';

const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = fs.readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const tailwind = fs.readFileSync(new URL('../tailwind.config.js', import.meta.url), 'utf8');
const postcss = fs.readFileSync(new URL('../postcss.config.js', import.meta.url), 'utf8');
const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const lock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

assert.doesNotMatch(index, /cdn\.tailwindcss\.com/, 'Tailwind runtime CDN must not remain in index.html');
assert.match(main, /import ['"]\.\/styles\.css['"];/, 'Vite entry must import the compiled stylesheet');
for (const directive of ['@tailwind base;', '@tailwind components;', '@tailwind utilities;']) assert.ok(css.includes(directive));
assert.match(tailwind, /\.\/src\/\*\*\/\*\.\{js,jsx\}/, 'Tailwind must scan application JSX');
assert.match(postcss, /tailwindcss\s*:\s*\{\}/, 'PostCSS must run Tailwind');
assert.match(postcss, /autoprefixer\s*:\s*\{\}/, 'PostCSS must run Autoprefixer');
for (const [name, version] of Object.entries({ tailwindcss: '3.4.17', postcss: '8.4.49', autoprefixer: '10.4.20' })) {
  assert.equal(pkg.devDependencies?.[name], version, `${name} must be pinned`);
  assert.equal(lock.packages?.['']?.devDependencies?.[name], version, `${name} lockfile entry must match package.json`);
}
assert.equal(lock.lockfileVersion, 3);

console.log('Tailwind build migration guard: PASS');
console.log('Verified no runtime CDN, Vite CSS entry, source scanning, PostCSS pipeline, and locked build dependencies.');
