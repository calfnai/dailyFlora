import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const wantsApk = process.argv.includes('--apk');
const isWindows = process.platform === 'win32';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
    ...options
  });

  if (result.status !== 0) {
    const rendered = [command, ...args].join(' ');
    throw new Error(`Command failed: ${rendered}`);
  }
}

function bin(name) {
  return isWindows ? `${name}.cmd` : name;
}

run(bin('npm'), ['run', 'build']);

if (!existsSync('android')) {
  run(bin('npx'), ['cap', 'add', 'android']);
}

run(bin('npx'), ['cap', 'sync', 'android']);
run(bin('npm'), ['run', 'android:tv:prepare']);

if (wantsApk) {
  const gradleCommand = isWindows ? 'gradlew.bat' : './gradlew';
  run(gradleCommand, ['assembleDebug'], { cwd: join(process.cwd(), 'android') });
}
