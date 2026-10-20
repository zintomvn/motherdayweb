import { cp, mkdir, readFile, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
if (path.relative(root, output) !== 'dist') throw new Error('Invalid build directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'css', 'js', 'fonts']) {
  await cp(path.join(root, name), path.join(output, name), { recursive: true });
}
const html = await readFile(path.join(output, 'index.html'), 'utf8');
const assets = [...html.matchAll(/(?:src|href)="((?:css|js)\/[^"#]+)"/g)].map(match => match[1]);
for (const asset of assets) await stat(path.join(output, asset));
console.log(`Built static site in dist/; ${assets.length} linked assets verified.`);
