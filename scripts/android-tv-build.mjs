import { existsSync, chmodSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const wantsApk = process.argv.includes('--apk');
const isWindows = process.platform === 'win32';

function commandName(name) {
  return isWindows ? `${name}.cmd` : name;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${[command, ...args].join(' ')}`);
  }
}

function prepareTvWebBuild() {
  const indexPath = join(process.cwd(), 'dist/index.html');
  if (!existsSync(indexPath)) return;
  const source = readFileSync(indexPath, 'utf8');
  if (source.includes('__DAILYFLORA_DEVICE__')) return;
  const marker = `<script>
      window.__DAILYFLORA_DEVICE__ = 'tv';
      const dailyFloraTvUrl = new URL(window.location.href);
      if (!dailyFloraTvUrl.searchParams.has('device')) dailyFloraTvUrl.searchParams.set('device', 'tv');
      if (!dailyFloraTvUrl.searchParams.has('render') && !dailyFloraTvUrl.searchParams.has('quality')) dailyFloraTvUrl.searchParams.set('render', 'low');
      window.history.replaceState({}, '', dailyFloraTvUrl);
    </script>`;
  writeFileSync(indexPath, source.replace('</head>', `    ${marker}\n  </head>`));
}

run(commandName('npm'), ['run', 'build']);
prepareTvWebBuild();

if (!existsSync('android')) {
  run(commandName('npx'), ['cap', 'add', 'android']);
}

run(commandName('npx'), ['cap', 'sync', 'android']);
run(commandName('npm'), ['run', 'android:tv:prepare']);

if (wantsApk) {
  const gradleCommand = isWindows ? 'gradlew.bat' : './gradlew';
  if (!isWindows && existsSync(join(process.cwd(), 'android/gradlew'))) {
    chmodSync(join(process.cwd(), 'android/gradlew'), 0o755);
  }
  run(gradleCommand, ['assembleDebug'], { cwd: join(process.cwd(), 'android') });
}
