'use strict';

const crypto = require('crypto');
const db = uniCloud.database();
const command = db.command;

const users = db.collection('dailyflora-beta-users');
const sessions = db.collection('dailyflora-beta-sessions');
const favorites = db.collection('dailyflora-beta-favorites');
const generations = db.collection('dailyflora-beta-generations');
const tasks = db.collection('dailyflora-beta-tasks');
const references = db.collection('dailyflora-beta-refs');
const pointAccounts = db.collection('dailyflora-beta-point-accounts');
const pointsLedger = db.collection('dailyflora-beta-points-ledger');
const gardens = db.collection('dailyflora-beta-gardens');
const passwordResets = db.collection('dailyflora-beta-resets');

const VERSION = '0.72-beta.1';
const SESSION_DAYS = 30;
const RESET_MINUTES = 30;
const TASK_COST = 10;
const MAX_REFERENCE_BYTES = 1_500_000;
const MAX_THUMBNAIL_BYTES = 350_000;
const BATCH_MINUTES = 10;

function now() { return new Date(); }
function bounded(value, max = 500) { return String(value ?? '').trim().slice(0, max); }
function normalizeEmail(value) { return bounded(value, 320).toLowerCase(); }
function fail(message, statusCode = 400) { const error = new Error(message); error.statusCode = statusCode; throw error; }
function hash(value) { return crypto.createHash('sha256').update(String(value)).digest('hex'); }
function randomId(prefix) { return `${prefix}-${crypto.randomBytes(18).toString('base64url')}`; }

function jsonBody(event) {
  let body = event && event.body;
  if (event?.isBase64Encoded && typeof body === 'string') body = Buffer.from(body, 'base64').toString('utf8');
  if (!body) return {};
  if (typeof body === 'object') return body;
  try { return JSON.parse(body); } catch { return {}; }
}

function response(statusCode, payload, extraHeaders = {}) {
  return {
    mpserverlessComposedResponse: true,
    isBase64Encoded: false,
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extraHeaders },
    body: JSON.stringify(payload)
  };
}

function assertPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) fail('密码需要为 8–128 位。');
}

function passwordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { passwordSalt: salt, passwordHash: crypto.scryptSync(password, salt, 64).toString('hex') };
}

function passwordMatches(password, user) {
  if (!user.passwordHash || !user.passwordSalt) return false;
  const actual = Buffer.from(crypto.scryptSync(password, user.passwordSalt, 64).toString('hex'), 'hex');
  const expected = Buffer.from(user.passwordHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicUser(user) {
  return { id: user._id, name: user.name || user.nickname || 'DailyFlora 用户', email: user.email, role: user.role || 'user', createdAt: user.createdAt, lastSeenAt: user.lastSeenAt };
}

function publicFavorite(item) {
  const fields = ['id', 'date', 'seed', 'themeId', 'themeName', 'themeEnglishName', 'flowerPlanName', 'flowers', 'savedAt'];
  return fields.reduce((out, key) => ({ ...out, [key]: item[key] || '' }), {});
}

function publicGeneration(item) {
  return {
    id: item.id,
    publicId: item.publicId,
    name: item.name,
    seed: item.seed,
    themeId: item.themeId || '',
    date: item.date || '',
    source: item.source || '',
    status: item.status || 'completed',
    colors: Array.isArray(item.colors) ? item.colors : [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function publicTask(item) {
  return {
    id: item.id,
    referenceId: item.referenceId,
    status: item.status,
    input: item.input || {},
    result: item.result || null,
    generationId: item.generationId || null,
    publicId: item.publicId || null,
    cost: item.cost || TASK_COST,
    refunded: Boolean(item.refundedAt),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: item.completedAt || null,
    errorMessage: item.errorMessage || null
  };
}

function parseCookies(event) {
  const headers = event?.headers || {};
  return String(headers.cookie || headers.Cookie || '').split(';').reduce((out, part) => {
    const at = part.indexOf('=');
    if (at > 0) out[part.slice(0, at).trim()] = decodeURIComponent(part.slice(at + 1).trim());
    return out;
  }, {});
}

function bearer(event, body) {
  const headers = event?.headers || {};
  const auth = headers.authorization || headers.Authorization || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return bounded(body.token || parseCookies(event).dailyflora_beta_session, 200);
}

function sessionCookie(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `dailyflora_beta_session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

async function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await sessions.add({ userId, tokenHash: hash(token), createdAt: now(), expiresAt });
  return { token, tokenExpired: expiresAt.toISOString() };
}

async function authenticated(event, body) {
  const token = bearer(event, body);
  if (!token) fail('需要登录。', 401);
  const found = await sessions.where({ tokenHash: hash(token), expiresAt: command.gt(now()) }).limit(1).get();
  const session = found.data?.[0];
  if (!session) fail('登录已过期，请重新登录。', 401);
  const result = await users.doc(session.userId).get();
  const user = result.data?.[0];
  if (!user || user.disabledAt) fail('账户不可用。', 403);
  return { user, session };
}

function adminEmails() {
  return new Set(String(process.env.DAILYFLORA_BETA_ADMIN_EMAILS || process.env.DAILYFLORA_ADMIN_EMAILS || '').split(',').map(normalizeEmail).filter(Boolean));
}

async function requireAdmin(event, body) {
  const auth = await authenticated(event, body);
  if (auth.user.role !== 'admin' && !adminEmails().has(normalizeEmail(auth.user.email))) fail('没有 0.72 Beta 后台权限。', 403);
  return auth;
}

async function ensurePointAccount(userId) {
  let result = await pointAccounts.where({ userId }).limit(1).get();
  if (result.data?.[0]) return result.data[0];
  try { await pointAccounts.add({ userId, balance: 0, operations: {}, createdAt: now(), updatedAt: now() }); } catch {}
  result = await pointAccounts.where({ userId }).limit(1).get();
  return result.data?.[0] || fail('积分账户初始化失败。', 503);
}

async function applyPointOperation(userId, operationId, amount) {
  const account = await ensurePointAccount(userId);
  const operationKey = hash(operationId).slice(0, 40);
  const operationPath = `operations.${operationKey}`;
  const where = { _id: account._id, [operationPath]: command.exists(false) };
  if (amount < 0) where.balance = command.gte(Math.abs(amount));
  const appliedAt = now();
  const applied = await pointAccounts.where(where).update({ balance: command.inc(amount), [operationPath]: { id: operationId, amount, appliedAt }, updatedAt: appliedAt });
  const updated = (await pointAccounts.doc(account._id).get()).data?.[0];
  if (!updated) fail('积分账户读取失败。', 503);
  const operation = updated.operations?.[operationKey];
  if (applied.updated || operation?.id === operationId) return { ok: true, applied: Boolean(applied.updated), balanceAfter: updated.balance || 0 };
  return { ok: false, applied: false, balanceAfter: updated.balance || 0 };
}

async function writePointLedger(record) {
  try { await pointsLedger.add(record); } catch (error) {
    if (!(await pointsLedger.where({ id: record.id }).limit(1).get()).data?.length) throw error;
  }
}

async function register(body) {
  const email = normalizeEmail(body.email);
  const name = bounded(body.name, 80);
  assertPassword(body.password);
  if (!email.includes('@') || !name) fail('请填写有效的昵称和邮箱。');
  if ((await users.where({ email }).limit(1).get()).data?.length) fail('该邮箱已经注册，请直接登录。', 409);
  const current = now();
  const created = await users.add({ email, name, nickname: name, ...passwordRecord(body.password), role: 'user', termsVersion: bounded(body.termsVersion, 40) || VERSION, termsAcceptedAt: current, createdAt: current, lastSeenAt: current });
  await pointAccounts.add({ userId: created.id, balance: 0, operations: {}, createdAt: current, updatedAt: current });
  const user = { _id: created.id, email, name, role: 'user', createdAt: current, lastSeenAt: current };
  return { user: publicUser(user), ...(await issueSession(created.id)) };
}

async function login(body) {
  const email = normalizeEmail(body.email);
  assertPassword(body.password);
  const result = await users.where({ email }).limit(1).get();
  const user = result.data?.[0];
  if (!user || !passwordMatches(body.password, user)) fail('邮箱或密码不正确。', 401);
  user.lastSeenAt = now();
  await users.doc(user._id).update({ lastSeenAt: user.lastSeenAt });
  return { user: publicUser(user), ...(await issueSession(user._id)) };
}

function favoriteInput(value) {
  const item = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const key of ['id', 'date', 'seed', 'themeId', 'themeName', 'themeEnglishName', 'flowerPlanName', 'flowers', 'savedAt']) result[key] = bounded(item[key], 500);
  if (!result.id || !result.date || !result.seed) fail('收藏数据不完整。');
  result.savedAt ||= now().toISOString();
  return result;
}

function parseWebp(dataUrl, maxBytes, label) {
  const match = String(dataUrl || '').match(/^data:image\/webp;base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) fail(`${label} 必须是 WebP。`);
  const buffer = Buffer.from(match[1].replace(/\s/g, ''), 'base64');
  if (!buffer.length) fail(`${label} 为空。`);
  if (buffer.length > maxBytes) fail(`${label} 超过大小限制。`, 413);
  return buffer;
}

async function memberDashboard(auth) {
  const [favoriteResult, generationResult, taskResult, account, pointResult] = await Promise.all([
    favorites.where({ userId: auth.user._id }).orderBy('savedAt', 'desc').limit(100).get(),
    generations.where({ userId: auth.user._id }).orderBy('updatedAt', 'desc').limit(100).get(),
    tasks.where({ userId: auth.user._id }).orderBy('updatedAt', 'desc').limit(100).get(),
    ensurePointAccount(auth.user._id),
    pointsLedger.where({ userId: auth.user._id }).orderBy('createdAt', 'desc').limit(100).get()
  ]);
  return { snapshot: { user: publicUser(auth.user), favorites: (favoriteResult.data || []).map(publicFavorite), generations: (generationResult.data || []).map(publicGeneration), tasks: (taskResult.data || []).map(publicTask), pointAccount: { balance: account.balance || 0, updatedAt: account.updatedAt }, points: pointResult.data || [] } };
}

async function createReferenceTask(auth, body) {
  const key = bounded(body.idempotencyKey, 120);
  if (!key) fail('缺少幂等键。');
  const taskId = `DF-BETA-TASK-${hash(`${auth.user._id}:${key}`).slice(0, 32)}`;
  const existing = await tasks.where({ id: taskId, userId: auth.user._id }).limit(1).get();
  const existingTask = existing.data?.[0];
  if (existingTask && existingTask.status !== 'preparing') return { task: publicTask(existingTask) };

  const current = now();
  const referenceId = taskId.replace('TASK', 'REF');
  const reservation = existingTask || { id: taskId, userId: auth.user._id, referenceId, idempotencyKey: key, status: 'preparing', cost: TASK_COST, charged: false, input: { bouquetName: bounded(body.bouquetName, 120) || '我的参考图花束', style: bounded(body.style, 40) || 'auto', preference: bounded(body.preference, 500) }, createdAt: current, updatedAt: current };
  if (!existingTask) {
    try { await tasks.add(reservation); } catch {
      const duplicate = await tasks.where({ id: taskId, userId: auth.user._id }).limit(1).get();
      if (duplicate.data?.[0]?.status !== 'preparing') return { task: publicTask(duplicate.data[0]) };
      if (!duplicate.data?.[0]) throw new Error('任务预留失败。');
    }
  }

  const referenceBuffer = parseWebp(body.referenceDataUrl, MAX_REFERENCE_BYTES, '主参考图');
  const thumbnailBuffer = parseWebp(body.thumbnailDataUrl, MAX_THUMBNAIL_BYTES, '缩略图');
  const base = `dailyflora/beta-072/private/${auth.user._id}/${referenceId}`;
  let uploaded = [];
  let debitSucceeded = false;
  try {
    const [referenceUpload, thumbnailUpload] = await Promise.all([
      uniCloud.uploadFile({ cloudPath: `${base}/reference.webp`, fileContent: referenceBuffer, cloudPathAsRealPath: true }),
      uniCloud.uploadFile({ cloudPath: `${base}/thumbnail.webp`, fileContent: thumbnailBuffer, cloudPathAsRealPath: true })
    ]);
    uploaded = [referenceUpload?.fileID || referenceUpload?.fileId, thumbnailUpload?.fileID || thumbnailUpload?.fileId].filter(Boolean);
    if (uploaded.length !== 2) fail('私有存储没有返回完整文件 ID。', 503);

    const referenceRecord = { id: referenceId, userId: auth.user._id, taskId, referenceFileId: uploaded[0], thumbnailFileId: uploaded[1], sourceFileName: bounded(body.sourceFileName, 180), reference: { ...(body.reference || {}), bytes: referenceBuffer.length, contentType: 'image/webp' }, thumbnail: { ...(body.thumbnail || {}), bytes: thumbnailBuffer.length, contentType: 'image/webp' }, storagePrefix: base, status: 'queued', updatedAt: now() };
    const existingReference = (await references.where({ id: referenceId, userId: auth.user._id }).limit(1).get()).data?.[0];
    if (existingReference) await references.doc(existingReference._id).update(referenceRecord);
    else await references.add({ ...referenceRecord, createdAt: current });

    const debit = await applyPointOperation(auth.user._id, `debit:${taskId}`, -TASK_COST);
    if (!debit.ok) fail('积分不足：创建参考图任务需要 10 分。', 402);
    debitSucceeded = true;
    await writePointLedger({ id: `DF-BETA-DEBIT-${taskId}`, userId: auth.user._id, amount: -TASK_COST, type: 'generation-debit', reason: '参考图生成任务', taskId, balanceAfter: debit.balanceAfter, createdAt: now() });
    const update = { status: 'queued', charged: true, updatedAt: now() };
    const queued = await tasks.where({ id: taskId, userId: auth.user._id, status: 'preparing' }).update(update);
    if (!queued.updated) fail('任务状态已变化，请刷新后重试。', 409);
    return { task: publicTask({ ...reservation, ...update }) };
  } catch (error) {
    if (uploaded.length) await uniCloud.deleteFile({ fileList: uploaded }).catch(() => {});
    await references.where({ id: referenceId, userId: auth.user._id }).remove().catch(() => {});
    if (debitSucceeded) {
      const refund = await applyPointOperation(auth.user._id, `create-refund:${taskId}`, TASK_COST).catch(() => null);
      if (refund?.ok) await writePointLedger({ id: `DF-BETA-REFUND-${taskId}`, userId: auth.user._id, amount: TASK_COST, type: 'generation-refund', reason: '任务创建失败退款', taskId, balanceAfter: refund.balanceAfter, createdAt: now() }).catch(() => {});
      const failedUpdate = { status: 'failed', charged: true, errorMessage: '任务创建失败，未进入处理队列。', updatedAt: now() };
      if (refund?.ok) failedUpdate.refundedAt = now();
      await tasks.where({ id: taskId, userId: auth.user._id }).update(failedUpdate).catch(() => {});
    } else {
      await tasks.where({ id: taskId, userId: auth.user._id, status: 'preparing' }).remove().catch(() => {});
    }
    throw error;
  }
}

function processingResult(value) {
  const input = value && typeof value === 'object' ? value : {};
  const colors = Array.isArray(input.colors) ? input.colors.slice(0, 8).map((item) => bounded(item, 30)).filter((item) => /^#[0-9a-f]{6}$/i.test(item)) : [];
  const flowers = Array.isArray(input.flowers) ? input.flowers.slice(0, 24).map((item) => bounded(item, 120)).filter(Boolean) : [];
  const themeId = bounded(input.themeId, 80) || 'dewberry-morning';
  const seed = bounded(input.seed, 180);
  if (!seed || !colors.length) fail('Codex 结果缺少有效 seed 或颜色。');
  return { title: bounded(input.title, 160) || 'DailyFlora 参考图花束', summary: bounded(input.summary, 1000), flowers, colors, composition: bounded(input.composition, 1000), seed, themeId, renderParams: input.renderParams && typeof input.renderParams === 'object' ? input.renderParams : {} };
}

async function refundTask(task, reason) {
  if (!task.charged || task.refundedAt) return false;
  const ledgerId = `DF-BETA-REFUND-${task.id}`;
  if ((await pointsLedger.where({ id: ledgerId }).limit(1).get()).data?.length) return false;
  const freshTask = (await tasks.where({ id: task.id, userId: task.userId }).limit(1).get()).data?.[0];
  if (!freshTask?.charged || freshTask.refundedAt) return false;
  const refund = await applyPointOperation(task.userId, `failure-refund:${task.id}`, TASK_COST);
  if (!refund.ok) fail('积分退款失败。', 503);
  const refundedAt = now();
  await writePointLedger({ id: ledgerId, userId: task.userId, amount: TASK_COST, type: 'generation-refund', reason: reason || '生成失败退款', taskId: task.id, balanceAfter: refund.balanceAfter, createdAt: refundedAt });
  await tasks.doc(freshTask._id).update({ refundedAt, updatedAt: refundedAt });
  return refund.applied;
}

async function completeTask(task, resultValue) {
  if (task.status === 'completed' && task.publicId) return publicTask(task);
  const result = processingResult(resultValue);
  const current = now();
  const generationId = task.generationId || randomId('DF-BETA-AI');
  const publicId = task.publicId || crypto.randomBytes(24).toString('base64url');
  const generation = { id: generationId, publicId, userId: task.userId, taskId: task.id, name: result.title || task.input?.bouquetName, seed: result.seed, themeId: result.themeId, date: current.toISOString().slice(0, 10), source: 'reference-codex', status: 'completed', colors: result.colors, renderParams: result.renderParams, createdAt: current, updatedAt: current };
  const existing = await generations.where({ id: generationId, userId: task.userId }).limit(1).get();
  if (existing.data?.[0]) await generations.doc(existing.data[0]._id).update(generation); else await generations.add(generation);
  const update = { status: 'completed', result, generationId, publicId, completedAt: current, updatedAt: current, errorMessage: null };
  await tasks.doc(task._id).update(update);
  await references.where({ id: task.referenceId }).update({ status: 'completed', updatedAt: current });
  const garden = (await gardens.where({ userId: task.userId }).limit(1).get()).data?.[0];
  const entry = publicGeneration(generation);
  if (garden) await gardens.doc(garden._id).update({ entries: [entry, ...(garden.entries || []).filter((item) => item.id !== entry.id)].slice(0, 100), updatedAt: current });
  else await gardens.add({ userId: task.userId, entries: [entry], createdAt: current, updatedAt: current });
  return publicTask({ ...task, ...update });
}

async function failTask(task, message) {
  if (task.status !== 'failed') {
    await tasks.doc(task._id).update({ status: 'failed', errorMessage: bounded(message, 500) || 'Codex 处理失败。', completedAt: now(), updatedAt: now() });
    await references.where({ id: task.referenceId }).update({ status: 'failed', updatedAt: now() });
  }
  await refundTask({ ...task, status: 'failed' }, '生成失败退款');
  const refreshed = (await tasks.doc(task._id).get()).data?.[0];
  return publicTask(refreshed || task);
}

async function adminSummary() {
  const counts = await Promise.all([users.count(), favorites.count(), generations.count(), tasks.count(), pointAccounts.count()]);
  return { summary: { users: counts[0].total, favorites: counts[1].total, generations: counts[2].total, tasks: counts[3].total, pointAccounts: counts[4].total, version: VERSION } };
}

async function adminListUsers() {
  const result = await users.orderBy('createdAt', 'desc').limit(100).get();
  const accountResult = await pointAccounts.limit(200).get();
  const balances = new Map((accountResult.data || []).map((item) => [item.userId, item.balance || 0]));
  return { users: (result.data || []).map((item) => ({ ...publicUser(item), balance: balances.get(item._id) || 0 })) };
}

async function adminGrantPoints(body) {
  const userId = bounded(body.userId, 160);
  const amount = Number(body.amount);
  const reason = bounded(body.reason, 160) || 'Admin Beta 测试赠分';
  const key = bounded(body.idempotencyKey, 120);
  if (!userId || !Number.isInteger(amount) || amount <= 0 || amount > 10000 || !key) fail('赠分参数无效。');
  const ledgerId = `DF-BETA-GRANT-${hash(`${userId}:${key}`).slice(0, 32)}`;
  if ((await pointsLedger.where({ id: ledgerId }).limit(1).get()).data?.length) return { ok: true };
  const grant = await applyPointOperation(userId, `grant:${ledgerId}`, amount);
  if (!grant.ok) fail('赠分失败。', 503);
  await writePointLedger({ id: ledgerId, userId, amount, type: 'admin-grant', reason, balanceAfter: grant.balanceAfter, createdAt: now() });
  return { ok: true };
}

async function adminGetReference(body) {
  const task = (await tasks.where({ id: bounded(body.taskId, 180) }).limit(1).get()).data?.[0];
  if (!task) fail('任务不存在。', 404);
  const reference = (await references.where({ id: task.referenceId }).limit(1).get()).data?.[0];
  if (!reference) fail('参考图不存在。', 404);
  const temp = await uniCloud.getTempFileURL({ fileList: [reference.referenceFileId, reference.thumbnailFileId] });
  const files = temp?.fileList || [];
  return { reference: { id: reference.id, taskId: task.id, referenceUrl: files[0]?.tempFileURL || files[0]?.url, thumbnailUrl: files[1]?.tempFileURL || files[1]?.url, expiresIn: 300 } };
}

async function adminCreateWorkerBatch() {
  const queued = (await tasks.where({ status: 'queued' }).orderBy('createdAt', 'asc').limit(5).get()).data || [];
  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = hash(token);
  const expiresAt = new Date(Date.now() + BATCH_MINUTES * 60000);
  for (const task of queued) await tasks.doc(task._id).update({ workerBatchHash: tokenHash, workerBatchExpiresAt: expiresAt, updatedAt: now() });
  return { batch: { token, expiresAt: expiresAt.toISOString(), taskCount: queued.length } };
}

async function batchTasks(body) {
  const token = bounded(body.batchToken, 200);
  if (!token) fail('缺少批次凭证。', 401);
  const result = await tasks.where({ workerBatchHash: hash(token), workerBatchExpiresAt: command.gt(now()), status: command.in(['queued', 'processing']) }).orderBy('createdAt', 'asc').limit(5).get();
  if (!result.data?.length) fail('批次凭证无效、已过期或没有任务。', 401);
  return { token, tasks: result.data };
}

async function workerFetchBatch(body) {
  const batch = await batchTasks(body);
  const output = [];
  for (const task of batch.tasks) {
    const reference = (await references.where({ id: task.referenceId }).limit(1).get()).data?.[0];
    const user = (await users.doc(task.userId).get()).data?.[0];
    const temp = await uniCloud.getTempFileURL({ fileList: [reference.referenceFileId, reference.thumbnailFileId] });
    const files = temp?.fileList || [];
    await tasks.doc(task._id).update({ status: 'processing', updatedAt: now() });
    output.push({ task: publicTask({ ...task, status: 'processing' }), user: { id: user._id, name: user.name, email: user.email }, reference: { referenceUrl: files[0]?.tempFileURL || files[0]?.url, thumbnailUrl: files[1]?.tempFileURL || files[1]?.url } });
  }
  return { batch: { tasks: output } };
}

async function workerTask(body) {
  const batch = await batchTasks(body);
  const taskId = bounded(body.taskId, 180);
  const task = batch.tasks.find((item) => item.id === taskId);
  if (!task) fail('任务不属于当前批次。', 403);
  return task;
}

async function publicGenerationById(body) {
  const publicId = bounded(body.publicId, 160);
  const generation = (await generations.where({ publicId }).limit(1).get()).data?.[0];
  if (!generation) fail('这个公开花束不存在。', 404);
  const value = publicGeneration(generation);
  return { generation: { id: value.id, publicId: value.publicId, name: value.name, seed: value.seed, themeId: value.themeId, date: value.date, status: value.status, colors: value.colors, createdAt: value.createdAt } };
}

async function sendResetEmail(user, token) {
  const accessKeyId = process.env.DIRECTMAIL_ACCESS_KEY_ID;
  const accessKeySecret = process.env.DIRECTMAIL_ACCESS_KEY_SECRET;
  const accountName = process.env.DIRECTMAIL_ACCOUNT_NAME;
  if (!accessKeyId || !accessKeySecret || !accountName) fail('邮件服务尚未配置，请联系管理员。', 503);
  const origin = (process.env.DAILYFLORA_BETA_PUBLIC_ORIGIN || 'https://static-mp-7937f272-ccea-46ee-ac33-3e23abb1fa49.next.bspapp.com/beta-072').replace(/\/$/, '');
  const params = { AccessKeyId: accessKeyId, AccountName: accountName, Action: 'SingleSendMail', AddressType: '1', Format: 'JSON', HtmlBody: `<p>请在 30 分钟内重置 DailyFlora 0.72 Beta 密码：</p><p><a href="${origin}/login/#reset?token=${encodeURIComponent(token)}">重置密码</a></p>`, ReplyToAddress: 'true', Subject: '重置 DailyFlora Beta 密码', ToAddress: user.email, SignatureMethod: 'HMAC-SHA1', SignatureNonce: crypto.randomBytes(16).toString('hex'), SignatureVersion: '1.0', Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'), Version: '2015-11-23' };
  const encode = (value) => encodeURIComponent(String(value)).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
  const query = Object.keys(params).sort().map((key) => `${encode(key)}=${encode(params[key])}`).join('&');
  const toSign = `POST&%2F&${encode(query)}`;
  params.Signature = crypto.createHmac('sha1', `${accessKeySecret}&`).update(toSign).digest('base64');
  const body = Object.keys(params).sort().map((key) => `${encode(key)}=${encode(params[key])}`).join('&');
  const result = await uniCloud.httpclient.request('https://dm.aliyuncs.com/', { method: 'POST', content: body, headers: { 'content-type': 'application/x-www-form-urlencoded' }, dataType: 'json' });
  if (Number(result.status) >= 300 || result.data?.Code) fail('重置邮件暂时无法发送。', 503);
}

async function requestPasswordReset(body) {
  const user = (await users.where({ email: normalizeEmail(body.email) }).limit(1).get()).data?.[0];
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    const reset = await passwordResets.add({ userId: user._id, tokenHash: hash(token), createdAt: now(), expiresAt: new Date(Date.now() + RESET_MINUTES * 60000) });
    try {
      await sendResetEmail(user, token);
    } catch (error) {
      await passwordResets.doc(reset.id).remove().catch(() => {});
      throw error;
    }
  }
  return { ok: true };
}

async function resetPassword(body) {
  assertPassword(body.password);
  const reset = (await passwordResets.where({ tokenHash: hash(bounded(body.token, 200)), expiresAt: command.gt(now()) }).limit(1).get()).data?.[0];
  if (!reset) fail('重置链接无效或已过期。');
  const user = (await users.doc(reset.userId).get()).data?.[0];
  if (!user) fail('账户不可用。', 403);
  await users.doc(user._id).update({ ...passwordRecord(body.password), lastSeenAt: now() });
  await passwordResets.doc(reset._id).remove();
  return { user: publicUser(user), ...(await issueSession(user._id)) };
}

async function handle(action, body, event) {
  if (action === 'health') return { service: 'dailyflora-api-beta', version: VERSION, isolated: true };
  if (action === 'register') return register(body);
  if (action === 'login') return login(body);
  if (action === 'requestPasswordReset') return requestPasswordReset(body);
  if (action === 'resetPassword') return resetPassword(body);
  if (action === 'getPublicGeneration') return publicGenerationById(body);
  if (action === 'workerFetchBatch') return workerFetchBatch(body);
  if (action === 'workerCompleteTask') return { task: await completeTask(await workerTask(body), body.result) };
  if (action === 'workerFailTask') return { task: await failTask(await workerTask(body), body.errorMessage) };

  const auth = await authenticated(event, body);
  if (action === 'me') return { user: publicUser(auth.user) };
  if (action === 'logout') { await sessions.doc(auth.session._id).remove(); return { ok: true }; }
  if (action === 'memberDashboard') return memberDashboard(auth);
  if (action === 'listFavorites') return { favorites: ((await favorites.where({ userId: auth.user._id }).orderBy('savedAt', 'desc').limit(100).get()).data || []).map(publicFavorite) };
  if (action === 'saveFavorite') {
    const favorite = favoriteInput(body.favorite);
    const existing = (await favorites.where({ userId: auth.user._id, id: favorite.id }).limit(1).get()).data?.[0];
    const record = { ...favorite, userId: auth.user._id, updatedAt: now() };
    if (existing) await favorites.doc(existing._id).update(record); else await favorites.add({ ...record, createdAt: now() });
    return { favorite: publicFavorite(record) };
  }
  if (action === 'removeFavorite') { await favorites.where({ userId: auth.user._id, id: bounded(body.favoriteId, 180) }).remove(); return { ok: true }; }
  if (action === 'createReferenceTask') return createReferenceTask(auth, body);
  if (action === 'renameGeneration') {
    const item = (await generations.where({ userId: auth.user._id, id: bounded(body.generationId, 180) }).limit(1).get()).data?.[0];
    if (!item) fail('生成记录不存在。', 404);
    const name = bounded(body.name, 120); if (!name) fail('名称不能为空。');
    await generations.doc(item._id).update({ name, updatedAt: now() }); return { generation: publicGeneration({ ...item, name }) };
  }
  if (action === 'deleteGeneration') { await generations.where({ userId: auth.user._id, id: bounded(body.generationId, 180) }).remove(); return { ok: true }; }

  if (action === 'adminSummary') { await requireAdmin(event, body); return adminSummary(); }
  if (action === 'adminListUsers') { await requireAdmin(event, body); return adminListUsers(); }
  if (action === 'adminListTasks') { await requireAdmin(event, body); const query = body.status ? { status: bounded(body.status, 30) } : {}; return { tasks: ((await tasks.where(query).orderBy('updatedAt', 'desc').limit(100).get()).data || []).map(publicTask) }; }
  if (action === 'adminGrantPoints') { await requireAdmin(event, body); return adminGrantPoints(body); }
  if (action === 'adminGetReference') { await requireAdmin(event, body); return adminGetReference(body); }
  if (action === 'adminCreateWorkerBatch') { await requireAdmin(event, body); return adminCreateWorkerBatch(); }
  fail('未知操作。');
}

exports.main = async (event) => {
  if (event?.httpMethod === 'OPTIONS') return response(204, {});
  const body = jsonBody(event);
  try {
    const action = bounded(body.action, 80);
    const result = await handle(action, body, event);
    const headers = {};
    if (result.token && result.tokenExpired) headers['Set-Cookie'] = sessionCookie(result.token, result.tokenExpired);
    if (action === 'logout') headers['Set-Cookie'] = 'dailyflora_beta_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None';
    return response(200, { code: 0, ...result }, headers);
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    return response(statusCode, { code: statusCode, message: error.message || '服务暂时不可用。' });
  }
};
