import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) mkdirSync(distDir, { recursive: true });
        copyFileSync(resolve(__dirname, 'public/manifest.json'), resolve(distDir, 'manifest.json'));
        const iconsDir = resolve(distDir, 'icons');
        if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true });
        for (const size of [16, 48, 128]) {
          const iconPath = resolve(__dirname, `public/icons/icon${size}.png`);
          if (existsSync(iconPath)) {
            copyFileSync(iconPath, resolve(iconsDir, `icon${size}.png`));
          }
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'es',
      },
    },
    outDir: 'dist',
    minify: false,
  },
});
