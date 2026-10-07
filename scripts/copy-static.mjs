import { copyFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const files = ['manifest.json', 'sw.js', 'icon-192.png', 'icon-512.png'];
await mkdir(resolve('dist'), { recursive: true });
await Promise.all(files.map(file => copyFile(resolve(file), resolve('dist', file))));
console.log(`Copied ${files.length} PWA static files into dist/.`);
