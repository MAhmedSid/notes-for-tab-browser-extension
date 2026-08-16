import { build } from 'esbuild';

await Promise.all([
  build({
    entryPoints: ['src/content/index.ts'],
    bundle: true,
    outfile: 'dist/content.js',
    format: 'iife',
    target: 'es2022',
    legalComments: 'none',
  }),
  build({
    entryPoints: ['src/background/index.ts'],
    bundle: true,
    outfile: 'dist/background.js',
    format: 'esm',
    target: 'es2022',
    legalComments: 'none',
  }),
]);

console.log('Content and background scripts bundled.');
