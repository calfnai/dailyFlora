import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const stateRoot = join(root, '.codex', 'runtime');
const command = process.argv[2];
const vitePath = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
const devArgs = [vitePath, '--host', process.env.DAILYFLORA_VITE_HOST || '0.0.0.0'];
if (process.env.DAILYFLORA_VITE_PORT) devArgs.push('--port', process.env.DAILYFLORA_VITE_PORT, '--strictPort');

const commands = {
  build: ['npm', ['run', 'build:raw']],
  'build:vercel': ['npm', ['run', 'build:vercel:raw']],
  dev: [process.execPath, devArgs],
  preview: [process.execPath, [vitePath, 'preview', '--outDir', 'dist/client', '--host', '0.0.0.0']]
};

const lockName = command === 'dev' || command === 'preview' ? `${command}.lock` : 'build.lock';
const lockPath = join(stateRoot, lockName);

function readLock(path = lockPath) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function pidIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function clearStaleLock() {
  const existing = readLock();
  if (!existing || !pidIsAlive(existing.pid)) {
    if (existsSync(lockPath)) rmSync(lockPath, { force: true });
    return null;
  }
  return existing;
}

function projectServerPids(kind) {
  let output = '';
  try {
    output = execFileSync('ps', ['-axo', 'pid=,command='], { encoding: 'utf8' });
  } catch {
    return [];
  }
  return output
    .split('\n')
    .map((line) => {
      const match = line.trim().match(/^(\d+)\s+(.*)$/);
      return match ? { pid: Number(match[1]), command: match[2] } : null;
    })
    .filter((entry) => {
      if (!entry || entry.pid === process.pid) return false;
      const isVite = entry.command.includes(`${root}/node_modules/vite/`) || entry.command.includes(`${root}/node_modules/.bin/vite`);
      if (!isVite || !entry.command.includes(root)) return false;
      return kind === 'preview' ? /\bpreview\b/.test(entry.command) : !/\bpreview\b/.test(entry.command);
    });
}

function launchdLabelForPid(pid) {
  try {
    const output = execFileSync('launchctl', ['list'], { encoding: 'utf8' });
    const row = output.split('\n').find((line) => new RegExp(`^\\s*${pid}\\s+`).test(line));
    return row?.trim().split(/\s+/)[2] || null;
  } catch {
    return null;
  }
}

function acquireLock() {
  mkdirSync(stateRoot, { recursive: true });
  const existing = clearStaleLock();
  if (existing) {
    const label = command === 'build' || command === 'build:vercel' ? '构建' : '服务器';
    const launchdLabel = label === '服务器' ? launchdLabelForPid(existing.pid) : null;
    if (launchdLabel) {
      throw new Error(
        `DailyFlora ${label}由 launchd 服务 ${launchdLabel} 托管（PID ${existing.pid}）。\n` +
        '这是本项目唯一的持久本地入口，本次已拒绝重复启动。'
      );
    }
    throw new Error(
      `DailyFlora ${label}已在运行（PID ${existing.pid}，命令 ${existing.command}）。\n` +
      `为避免入口和 dist 冲突，本次已拒绝启动。需要时运行：npm run ${command === 'dev' ? 'dev:stop' : command === 'preview' ? 'preview:stop' : 'build:stop'}`
    );
  }

  if (command === 'dev' || command === 'preview') {
    const unmanaged = projectServerPids(command);
    if (unmanaged.length > 0) {
      throw new Error(
        `DailyFlora 已有未受管的 ${command} 进程（PID ${unmanaged.map((entry) => entry.pid).join(', ')}）。\n` +
        `为避免重复入口和端口漂移，本次已拒绝启动。需要时运行：npm run ${command}:stop`
      );
    }
  }

  const payload = {
    pid: process.pid,
    command,
    cwd: root,
    host: hostname(),
    startedAt: new Date().toISOString()
  };
  try {
    writeFileSync(lockPath, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' });
  } catch {
    const raceWinner = clearStaleLock();
    if (raceWinner) throw new Error(`DailyFlora ${command} 已被另一个进程占用（PID ${raceWinner.pid}）。`);
    throw new Error(`无法创建 DailyFlora 锁文件：${lockPath}`);
  }
}

function releaseLock() {
  const current = readLock();
  if (current?.pid === process.pid) rmSync(lockPath, { force: true });
}

function stop(commandName) {
  const targetLock = join(stateRoot, `${commandName}.lock`);
  const lock = readLock(targetLock);
  const managedPid = lock?.pid;
  const managedLaunchdLabel = managedPid ? launchdLabelForPid(managedPid) : null;
  if (managedLaunchdLabel) {
    console.log(`DailyFlora ${commandName} 由 launchd 服务 ${managedLaunchdLabel} 持续托管，未停止。`);
    console.log('如需永久停用，请先修改或卸载对应 LaunchAgent；普通 npm 预览不会再重复启动。');
    return;
  }
  const serverPids = projectServerPids(commandName);
  if ((!managedPid || !pidIsAlive(managedPid)) && serverPids.length === 0) {
    if (existsSync(targetLock)) rmSync(targetLock, { force: true });
    console.log(`DailyFlora ${commandName} 没有正在运行的受管进程。`);
    return;
  }
  const pids = [...new Set([managedPid, ...serverPids.map((entry) => entry.pid)].filter((pid) => pid && pidIsAlive(pid)))];
  for (const pid of pids) process.kill(pid, 'SIGTERM');
  if (existsSync(targetLock)) rmSync(targetLock, { force: true });
  console.log(`已请求停止 DailyFlora ${commandName}（PID ${pids.join(', ')}）。`);
}

if (command === 'dev:stop' || command === 'preview:stop' || command === 'build:stop') {
  stop(command.slice(0, command.indexOf(':')));
  process.exit(0);
}

if (!commands[command]) {
  console.error('用法：node scripts/dailyflora-guard.mjs <dev|preview|build|build:vercel|dev:stop|preview:stop|build:stop>');
  process.exit(2);
}

let child;
try {
  acquireLock();
  const [executable, args] = commands[command];
  child = spawn(executable, args, { cwd: root, env: process.env, stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    releaseLock();
    process.exitCode = signal ? 1 : (code ?? 1);
  });
  child.on('error', (error) => {
    releaseLock();
    console.error(error.message);
    process.exitCode = 1;
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    if (child && !child.killed) child.kill(signal);
    releaseLock();
  });
}
