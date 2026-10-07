import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = 'dist';
const budgets = {
  javascript: 350 * 1024,
  css: 80 * 1024,
  totalCode: 500 * 1024,
};

const files = [];
const walk = async dir => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else files.push({ path: relative(root, path), bytes: (await stat(path)).size });
  }
};
await walk(root);

const js = files.filter(file => file.path.endsWith('.js') && !file.path.endsWith('sw.js'));
const css = files.filter(file => file.path.endsWith('.css'));
const jsBytes = js.reduce((sum, file) => sum + file.bytes, 0);
const cssBytes = css.reduce((sum, file) => sum + file.bytes, 0);
const totalCode = jsBytes + cssBytes;

const kb = bytes => (bytes / 1024).toFixed(1);
const fail = (label, actual, budget) => {
  if (actual > budget) throw new Error(`${label} budget exceeded: ${kb(actual)} KiB > ${kb(budget)} KiB`);
};

if (js.length === 0) throw new Error('No production JavaScript bundle found in dist/');
if (css.length === 0) throw new Error('No production CSS bundle found in dist/');
fail('JavaScript', jsBytes, budgets.javascript);
fail('CSS', cssBytes, budgets.css);
fail('Combined JS+CSS', totalCode, budgets.totalCode);

console.log('Performance and bundle budget guard: PASS');
console.log(`Production JS ${kb(jsBytes)} KiB / ${kb(budgets.javascript)} KiB; CSS ${kb(cssBytes)} KiB / ${kb(budgets.css)} KiB; combined ${kb(totalCode)} KiB / ${kb(budgets.totalCode)} KiB.`);
