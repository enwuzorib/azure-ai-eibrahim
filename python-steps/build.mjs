// Builds python-steps/index.html (the single page that gets published) from src/.
// Run: node python-steps/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(path.join(dir, 'src', f), 'utf8');
const parts = { '/*__CSS__*/': read('styles.css'), '//__MINIPY__': read('minipy.js'), '//__LESSONS__': read('lessons.js'), '//__APP__': read('app.js') };
for (const [k, v] of Object.entries(parts)) {
  if (k !== '/*__CSS__*/' && /<\/script/i.test(v)) throw new Error(`${k} contains "</script", which would break the inline script`);
}
let html = read('shell.html');
for (const [k, v] of Object.entries(parts)) {
  if (!html.includes(k)) throw new Error(`placeholder ${k} missing from shell.html`);
  html = html.split(k).join(v);
}
writeFileSync(path.join(dir, 'index.html'), html);
console.log(`Built python-steps/index.html (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
