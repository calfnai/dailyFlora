import { createHash } from 'node:crypto';
import { copyFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const releaseDir = resolve(projectRoot, 'desktop/windows/release');
const executableNames = readdirSync(releaseDir)
  .filter((name) => /^DailyFlora-.*-(?:setup|portable)\.exe$/i.test(name))
  .sort();

if (!executableNames.length) throw new Error(`No DailyFlora executable found in ${releaseDir}`);

const lines = executableNames.map((name) => {
  const hash = createHash('sha256').update(readFileSync(resolve(releaseDir, name))).digest('hex');
  return `${hash}  ${name}`;
});

writeFileSync(resolve(releaseDir, 'SHA256SUMS.txt'), `${lines.join('\n')}\n`);
copyFileSync(resolve(projectRoot, 'desktop/windows/verify-package.ps1'), resolve(releaseDir, 'verify-package.ps1'));
copyFileSync(resolve(projectRoot, 'desktop/windows/verify-package.cmd'), resolve(releaseDir, 'verify-package.cmd'));

console.log(lines.join('\n'));
