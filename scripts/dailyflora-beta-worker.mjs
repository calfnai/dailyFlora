import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { copyFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = '/Users/ziqing/Documents/DailyFlora-Codex-Queue/beta-072';
const apiUrl = process.env.DAILYFLORA_BETA_API_URL || 'https://fc-mp-7937f272-ccea-46ee-ac33-3e23abb1fa49.next.bspapp.com/dailyflora-api-beta';
const port = Number(process.env.DAILYFLORA_BETA_WORKER_PORT || 43172);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(scriptDir, 'dailyflora-beta-worker-result.schema.json');
const codexPath = process.env.DAILYFLORA_CODEX_PATH || '/Users/ziqing/.local/bin/codex';
const queueNames = ['inbox', 'working', 'outbox', 'archive', 'failed'];

for (const name of queueNames) await mkdir(join(root, name), { recursive: true });

async function api(action, payload) {
  const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.code) throw new Error(result.message || `Beta API ${response.status}`);
  return result;
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`下载私有参考图失败（${response.status}）。`);
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
}

function runCodex(referencePath, manifestPath, outputPath, task) {
  const prompt = [
    '你是 DailyFlora 0.72 Beta 的只读花束参数分析器。',
    '查看附带的参考图和 manifest.json，仅输出符合指定 JSON Schema 的 JSON。',
    '不得修改源码、不得写项目目录、不得执行外部副作用。',
    `用户偏好：${task.input?.preference || '未填写'}`,
    `方向：${task.input?.style || 'auto'}`,
    'themeId 必须从 Schema 的枚举中选择；颜色使用 #RRGGBB；seed 要稳定且不可包含用户邮箱。'
  ].join('\n');
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(codexPath, ['exec', '--ephemeral', '--sandbox', 'read-only', '--skip-git-repo-check', '-i', referencePath, '--output-schema', schemaPath, '--output-last-message', outputPath, prompt], {
      cwd: dirname(manifestPath),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });
    child.on('error', rejectPromise);
    child.on('close', (code) => code === 0 ? resolvePromise() : rejectPromise(new Error(`codex exec 失败（${code}）：${stderr.slice(-1200)}`)));
  });
}

async function processTask(item, batchToken) {
  const task = item.task;
  const folderName = `${new Date(task.createdAt || Date.now()).toISOString().replace(/[:.]/g, '-')}_${task.id}`;
  const inbox = join(root, 'inbox', folderName);
  const working = join(root, 'working', folderName);
  const outbox = join(root, 'outbox', folderName);
  const archive = join(root, 'archive', folderName);
  const failed = join(root, 'failed', folderName);
  await mkdir(inbox, { recursive: true });
  const referencePath = join(inbox, 'reference.webp');
  const thumbnailPath = join(inbox, 'thumbnail.webp');
  const manifestPath = join(inbox, 'manifest.json');
  const manifest = { contractVersion: 'dailyflora-beta-worker-1.0', receivedAt: new Date().toISOString(), apiUrl, user: item.user, task, files: { reference: 'reference.webp', thumbnail: 'thumbnail.webp' } };
  await Promise.all([download(item.reference.referenceUrl, referencePath), download(item.reference.thumbnailUrl, thumbnailPath), writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)]);
  await rename(inbox, working);
  const workingReference = join(working, 'reference.webp');
  const workingManifest = join(working, 'manifest.json');
  const resultPath = join(working, 'result.json');
  try {
    await runCodex(workingReference, workingManifest, resultPath, task);
    const result = JSON.parse(await readFile(resultPath, 'utf8'));
    await api('workerCompleteTask', { batchToken, taskId: task.id, result });
    await mkdir(outbox, { recursive: true });
    await Promise.all([copyFile(resultPath, join(outbox, 'result.json')), copyFile(workingManifest, join(outbox, 'manifest.json'))]);
    await rename(working, archive);
    return true;
  } catch (error) {
    await api('workerFailTask', { batchToken, taskId: task.id, errorMessage: error instanceof Error ? error.message : '本机 Codex 处理失败。' }).catch(() => {});
    await writeFile(join(working, 'error.txt'), `${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    await rename(working, failed);
    return false;
  }
}

async function processBatch(batchToken) {
  const result = await api('workerFetchBatch', { batchToken });
  const items = result.batch?.tasks || [];
  let completed = 0;
  let failed = 0;
  for (const item of items) {
    if (await processTask(item, batchToken)) completed += 1;
    else failed += 1;
  }
  return { completed, failed, total: items.length };
}

function corsHeaders(origin) {
  const allowed = /^https:\/\/static-mp-7937f272-ccea-46ee-ac33-3e23abb1fa49\.next\.bspapp\.com$/.test(origin || '') || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin || '');
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Private-Network': 'true',
    'Content-Type': 'application/json; charset=utf-8',
    Vary: 'Origin'
  };
}

const server = createServer(async (request, response) => {
  const headers = corsHeaders(request.headers.origin || '');
  if (request.method === 'OPTIONS') { response.writeHead(204, headers); response.end(); return; }
  if (request.method === 'GET' && request.url === '/health') {
    response.writeHead(200, headers);
    response.end(JSON.stringify({ ok: true, version: '0.72-beta.1', queueRoot: root }));
    return;
  }
  if (request.method !== 'POST' || request.url !== '/process') { response.writeHead(404, headers); response.end(JSON.stringify({ message: 'Not found' })); return; }
  let raw = '';
  request.on('data', (chunk) => { raw += chunk; });
  request.on('end', async () => {
    try {
      const body = JSON.parse(raw || '{}');
      if (!body.batchToken) throw new Error('缺少批次凭证。');
      const result = await processBatch(String(body.batchToken));
      response.writeHead(200, headers); response.end(JSON.stringify(result));
    } catch (error) {
      response.writeHead(500, headers); response.end(JSON.stringify({ message: error instanceof Error ? error.message : '处理失败。' }));
    }
  });
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`DailyFlora 0.72 Beta worker listening on http://127.0.0.1:${port}\nQueue: ${root}\n`);
});
