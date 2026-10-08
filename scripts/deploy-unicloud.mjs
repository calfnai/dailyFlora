import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { resolve, relative, basename } from 'node:path';

const root = process.cwd();
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const sha = git('rev-parse', 'HEAD');
const branch = git('branch', '--show-current');
const prepareOnly = process.argv.includes('--prepare-only');
if (git('rev-parse', '--show-toplevel') !== root) throw new Error('Run from repository root');
const info = JSON.parse(readFileSync('dist/version.json', 'utf8'));
if (info.commitSha !== sha || info.dirty) throw new Error('Build must match clean HEAD');
if (!prepareOnly && (process.env.GITHUB_ACTIONS !== 'true' || process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_REF !== 'refs/heads/codex/dailyflora-integration' || process.env.GITHUB_SHA !== sha || branch !== 'codex/dailyflora-integration')) {
  throw new Error('Production upload requires integration-branch GitHub push workflow');
}
if (!prepareOnly && !/^\[DF-\d{8}-\d{4}\]/.test(git('log', '-1', '--format=%s'))) throw new Error('Missing integration release stamp');
const project = resolve('.codex/runtime/unicloud-publish');
const output = resolve(project, 'site');
mkdirSync(project, { recursive: true });
rmSync(output, { recursive: true, force: true });
cpSync('dist', output, {
  recursive: true,
  filter: (source) => {
    const parts = relative(resolve('dist'), resolve(source)).split('/');
    return !parts.some(p => p.startsWith('.') || p === 'server' || p === 'CNAME') && !source.endsWith('.map');
  }
});
for (const file of ['index.html', 'version.json', 'login/index.html', 'signup/index.html']) {
  if (!existsSync(resolve(output, file))) throw new Error(`Missing ${file}`);
}
console.log(`Prepared ${sha}: ${output}`);
if (prepareOnly) process.exit(0);
const cli = process.env.HBUILDERX_CLI;
if (!cli) throw new Error('Missing HBUILDERX_CLI');
function hx(args, marker) {
  const result = execFileSync(cli, args, { encoding: 'utf8', timeout: 1200000, maxBuffer: 8 * 1024 * 1024 });
  console.log(result);
  if (!result.includes(`0:${marker}:OK`)) throw new Error(`HBuilderX did not confirm ${marker}`);
}
hx(['project', 'open', '--path', project], 'project open');
hx(['hosting', 'deploy', '--prj', basename(project), '--space', 'env-00jy6xjkcayy', '--provider', 'alipay', '--source', 'site'], 'hosting deploy');
const origin = 'https://env-00jy6xjkcayy-static.normal.cloudstatic.cn';
let verified = false;
for (let attempt = 0; attempt < 12; attempt++) {
  try {
    const response = await fetch(`${origin}/version.json?release=${sha}&attempt=${attempt}`, { signal: AbortSignal.timeout(20000), cache: 'no-store' });
    const live = await response.json();
    if (response.ok && live.commitSha === sha && live.releaseId === info.releaseId && !live.dirty) { verified = true; break; }
  } catch { /* Retry bounded CDN propagation/network failures. */ }
  await new Promise(r => setTimeout(r, 10000));
}
if (!verified) throw new Error('Upload returned success but public version verification failed');
console.log(`Verified UniCloud release ${info.releaseId} (${sha})`);
