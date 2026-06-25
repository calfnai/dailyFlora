import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'copy-aesthetic-review-data',
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist/data'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'data/aesthetic-review-dashboard.json'),
          resolve(__dirname, 'dist/data/aesthetic-review-dashboard.json')
        );
      }
    }
  ],
  build: {
    target: 'es2020',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        aestheticReviewDashboard: resolve(__dirname, 'docs/aesthetic-review-dashboard.html'),
        primitiveLab: resolve(__dirname, 'docs/primitive-lab.html')
      }
    }
  }
});
