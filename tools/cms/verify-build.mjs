import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(root, '../../public/admin');
const html = await readFile(resolve(outDir, 'index.html'), 'utf8');
assert(!html.includes('unpkg.com') && !html.includes('cdn.jsdelivr.net'), 'The entry page still loads a CDN');
assert(html.includes('nc-root'), 'CMS mount element is missing');

// Check the emitted entry scripts and all manifest assets/chunks exist under /admin.
async function checkLocal(path) {
  assert(!/^(?:[a-z]+:|\/\/)/i.test(path), `External build asset: ${path}`);
  const file = resolve(outDir, path);
  assert(file.startsWith(outDir + sep), `Asset escaped output directory: ${path}`);
  assert((await stat(file)).isFile(), `Missing build asset: ${path}`);
}
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)];
assert(scripts.length > 0, 'No built entry script');
for (const [, path] of scripts) await checkLocal(path);
const manifest = JSON.parse(await readFile(resolve(outDir, '.vite/manifest.json'), 'utf8'));
for (const chunk of Object.values(manifest)) {
  await checkLocal(chunk.file);
  for (const path of [...(chunk.css || []), ...(chunk.assets || [])]) await checkLocal(path);
  for (const key of [...(chunk.imports || []), ...(chunk.dynamicImports || [])]) {
    assert(manifest[key], `Missing manifest chunk: ${key}`);
  }
}
// A successful editor build must not remove or alter the original content schema.
const original = await readFile(resolve(root, '../../static/admin/config.yml'), 'utf8');
assert.equal(await readFile(resolve(outDir, 'config.yml'), 'utf8'), original);
await checkLocal('licenses/Sveltia-CMS.LICENSE.txt');
console.log('CMS build verified: local entry/assets, preserved config and license.');
