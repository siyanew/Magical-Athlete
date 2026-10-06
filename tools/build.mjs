import { cp, mkdir } from 'node:fs/promises';
await import('./check.mjs');
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'app.js', 'search.js', 'cards.json', 'LICENSE', 'ASSET-NOTICE.md', 'assets', 'locales']) {
  await cp(new URL(file, root), new URL(file, output), { recursive: true });
}
console.log('Production frontend built in dist/.');
