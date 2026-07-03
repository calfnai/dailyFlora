import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
        const indexHtml = readFileSync(resolve(__dirname, 'dist/index.html'), 'utf8');
        for (const route of ['special0629', 'special0629-v2', 'special0629-v3', 'special0629-v4']) {
          mkdirSync(resolve(__dirname, `dist/${route}`), { recursive: true });
          writeFileSync(
            resolve(__dirname, `dist/${route}/index.html`),
            indexHtml.replace('<head>', '<head>\n    <base href="../" />')
          );
        }
        mkdirSync(resolve(__dirname, 'dist/what-did-hubble-see-on-your-birthday'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'docs/what-did-hubble-see-on-your-birthday/index.html'),
          resolve(__dirname, 'dist/what-did-hubble-see-on-your-birthday/index.html')
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
        about: resolve(__dirname, 'about/index.html'),
        bouquetShop: resolve(__dirname, 'bouquet-shop/index.html'),
        downloads: resolve(__dirname, 'downloads/index.html'),
        member: resolve(__dirname, 'member/index.html'),
        devIndex: resolve(__dirname, 'docs/dev-index.html'),
        developmentDocumentSummary: resolve(__dirname, 'docs/development-document-summary.html'),
        memberTest: resolve(__dirname, 'docs/member-test.html'),
        adminBouquets: resolve(__dirname, 'docs/admin-bouquets.html'),
        adminUsers: resolve(__dirname, 'docs/admin-users.html'),
        flowerPlanSamples: resolve(__dirname, 'docs/dailyflora-flower-plan-samples.html'),
        aestheticReviewDashboard: resolve(__dirname, 'docs/aesthetic-review-dashboard.html'),
        primitiveLab: resolve(__dirname, 'docs/primitive-lab.html'),
        avatarLab: resolve(__dirname, 'docs/avatar-lab.html')
      }
    }
  }
});
