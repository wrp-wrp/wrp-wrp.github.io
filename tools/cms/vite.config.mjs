import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

export default {
  root,
  base: './',
  publicDir: false,
  worker: { format: 'es' },
  build: {
    outDir: resolve(root, '../../public/admin'),
    // Hugo has already copied config.yml here; never remove it.
    emptyOutDir: false,
    target: 'es2022',
    manifest: true,
    assetsInlineLimit: 0,
    reportCompressedSize: false,
  },
  plugins: [{
    name: 'cms-licenses',
    async generateBundle() {
      const npmDir = dirname(fileURLToPath(import.meta.resolve('@sveltia/cms')));
      const assets = resolve(npmDir, 'assets');
      // Redistributed fonts require their accompanying OFL license files.
      for (const name of await readdir(assets)) {
        if (name.endsWith('.LICENSE.txt')) {
          this.emitFile({ type: 'asset', fileName: 'licenses/' + name, source: await readFile(resolve(assets, name), 'utf8') });
        }
      }
      this.emitFile({
        type: 'asset', fileName: 'licenses/Sveltia-CMS.LICENSE.txt',
        source: await readFile(resolve(npmDir, '../LICENSE.txt'), 'utf8'),
      });
    },
  }],
};
