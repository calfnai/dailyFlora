import { existsSync, chmodSync } from 'node:fs';
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

run(commandName('npm'), ['run', 'build']);

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
