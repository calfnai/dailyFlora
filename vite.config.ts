import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function readGitValue(args: string[]) {
  try {
    return execFileSync('git', args, {
      cwd: __dirname,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return '';
  }
}

function shanghaiStamp(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '00';
  return `${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}`;
}

const builtAt = new Date();
const buildSource = process.env.VERCEL ? 'vercel' : 'local';
const commitSha = process.env.VERCEL_GIT_COMMIT_SHA || readGitValue(['rev-parse', 'HEAD']) || 'uncommitted';
const shortSha = commitSha === 'uncommitted' ? commitSha : commitSha.slice(0, 8);
const branch = process.env.VERCEL_GIT_COMMIT_REF || readGitValue(['branch', '--show-current']) || 'unknown';
const commitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || readGitValue(['log', '-1', '--format=%s']);
const stampedId = commitMessage.match(/\bDF-(\d{8}-\d{4})\b/)?.[1];
const dirty = buildSource === 'local' && Boolean(readGitValue(['status', '--porcelain']));
const releaseStamp = stampedId || shanghaiStamp(builtAt);
const releaseId = `DF-${releaseStamp}-${shortSha}${dirty ? '-dirty' : ''}`;
const buildInfo = Object.freeze({
  releaseId,
  builtAt: builtAt.toISOString(),
  timezone: 'Asia/Shanghai',
  commitSha,
  shortSha,
  branch,
  commitMessage,
  dirty,
  buildSource,
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
  deploymentUrl: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
});

if (process.env.VERCEL && branch === 'codex/dailyflora-integration' && !stampedId) {
  throw new Error('Production integration commits must include [DF-YYYYMMDD-HHmm] in the commit message.');
}

export default defineConfig({
  base: './',
  define: {
    __DAILYFLORA_BUILD_INFO__: JSON.stringify(buildInfo)
  },
  plugins: [
    {
      name: 'dailyflora-build-metadata',
      transformIndexHtml() {
        return [
          {
            tag: 'meta',
            attrs: { name: 'dailyflora-release', content: buildInfo.releaseId },
            injectTo: 'head'
          }
        ];
      },
      closeBundle() {
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true });
        writeFileSync(resolve(__dirname, 'dist/version.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);
        mkdirSync(resolve(__dirname, 'dist/data'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'data/aesthetic-review-dashboard.json'),
          resolve(__dirname, 'dist/data/aesthetic-review-dashboard.json')
        );
        mkdirSync(resolve(__dirname, 'dist/server'), { recursive: true });
        copyFileSync(
          resolve(__dirname, 'sites/worker.js'),
          resolve(__dirname, 'dist/server/index.js')
        );
        const indexHtmlPath = resolve(__dirname, 'dist/index.html');
        if (existsSync(indexHtmlPath)) {
          const indexHtml = readFileSync(indexHtmlPath, 'utf8');
          for (const route of ['special0629', 'special0629-v2', 'special0629-v3', 'special0629-v4']) {
            mkdirSync(resolve(__dirname, `dist/${route}`), { recursive: true });
            writeFileSync(
              resolve(__dirname, `dist/${route}/index.html`),
              indexHtml.replace('<head>', '<head>\n    <base href="../" />')
            );
          }
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
        scifi: resolve(__dirname, 'scifi/index.html'),
        signup: resolve(__dirname, 'signup/index.html'),
        devIndex: resolve(__dirname, 'docs/dev-index.html'),
        developmentDocumentSummary: resolve(__dirname, 'docs/development-document-summary.html'),
        memberTest: resolve(__dirname, 'docs/member-test.html'),
        memberUiDirection: resolve(__dirname, 'docs/member-ui-direction.html'),
        adminBouquets: resolve(__dirname, 'docs/admin-bouquets.html'),
        adminUsers: resolve(__dirname, 'docs/admin-users.html'),
        flowerPlanSamples: resolve(__dirname, 'docs/dailyflora-flower-plan-samples.html'),
        aestheticReviewDashboard: resolve(__dirname, 'docs/aesthetic-review-dashboard.html'),
        primitiveLab: resolve(__dirname, 'docs/primitive-lab.html'),
        realisticFlowerLab: resolve(__dirname, 'docs/realistic-flower-lab.html'),
        leafFlowerPairingLab: resolve(__dirname, 'docs/leaf-flower-pairing-lab.html'),
        foxtailLilyApprovalLab: resolve(__dirname, 'docs/foxtail-lily-approval-lab.html'),
        ammiMajusApprovalLab: resolve(__dirname, 'docs/ammi-majus-approval-lab.html'),
        scifiFlowerLab: resolve(__dirname, 'docs/scifi-flower-lab.html'),
        scifiBouquetLab: resolve(__dirname, 'docs/scifi-bouquet-lab.html'),
        leafSilhouetteLab: resolve(__dirname, 'docs/leaf-silhouette-lab.html'),
        strap3DMiniLab: resolve(__dirname, 'docs/strap-3d-mini-lab.html'),
        palmate3DMiniLab: resolve(__dirname, 'docs/palmate-3d-mini-lab.html'),
        avatarLab: resolve(__dirname, 'docs/avatar-lab.html')
      }
    }
  }
});
