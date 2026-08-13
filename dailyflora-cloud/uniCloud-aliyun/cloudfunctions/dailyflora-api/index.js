'use strict';

const crypto = require('crypto');

const db = uniCloud.database();
const command = db.command;
const users = db.collection('uni-id-users');
const sessions = db.collection('dailyflora-sessions');
const favorites = db.collection('dailyflora-favorites');
const passwordResets = db.collection('dailyflora-password-resets');
const generations = db.collection('dailyflora-generations');
const gardens = db.collection('dailyflora-gardens');
const referenceImages = db.collection('dailyflora-reference-images');
const processingTasks = db.collection('dailyflora-processing-tasks');
const pointsLedger = db.collection('dailyflora-points-ledger');
const demoOrders = db.collection('dailyflora-demo-orders');
const SESSION_DAYS = 30;
const RESET_MINUTES = 30;
const MAX_FAVORITES = 24;
const MAX_GENERATIONS = 60;
const MAX_TASKS = 40;
const MAX_REFERENCE_BYTES = 1_500_000;

function jsonBody(event) {
  let body = event && event.body;
  if (event && event.isBase64Encoded && typeof body === 'string') {
    body = Buffer.from(body, 'base64').toString('utf8');
  }
  if (!body) return {};
  if (typeof body === 'object') return body;
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
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

function now() {
  return new Date();
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim().slice(0, 80);
}

function assertPassword(password) {
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    const error = new Error('密码需要为 8–128 位。');
    error.statusCode = 400;
    throw error;
  }
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createPasswordRecord(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}

function passwordMatches(password, user) {
  if (!user.passwordHash || !user.passwordSalt) return false;
  const actual = Buffer.from(hashPassword(password, user.passwordSalt), 'hex');
  const expected = Buffer.from(user.passwordHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.nickname || user.name || 'DailyFlora 用户',
    email: user.email,
    termsAccepted: Boolean(user.termsAcceptedAt),
    termsVersion: user.termsVersion || null,
    createdAt: user.createdAt,
    lastSeenAt: user.lastSeenAt
  };
}

function parseCookies(event) {
  const headers = (event && event.headers) || {};
  const raw = headers.cookie || headers.Cookie || '';
  return String(raw).split(';').reduce((cookies, part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return cookies;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function sessionCookie(token, expiresAt) {
  const maxAge = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `dailyflora_session=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=None`;
}

function clearSessionCookie() {
  return 'dailyflora_session=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None';
}

async function issueSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await sessions.add({
    userId,
    tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
    createdAt: now(),
    expiresAt
  });
  return { token, tokenExpired: expiresAt.toISOString() };
}

function bearerToken(event, body) {
  const headers = (event && event.headers) || {};
  const header = headers.authorization || headers.Authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return String(body.token || parseCookies(event).dailyflora_session || '').trim();
}

async function authenticatedUser(event, body) {
  const token = bearerToken(event, body);
  if (!token) {
    const error = new Error('需要登录。');
    error.statusCode = 401;
    throw error;
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const sessionResult = await sessions.where({ tokenHash, expiresAt: command.gt(now()) }).limit(1).get();
  const session = sessionResult.data && sessionResult.data[0];
  if (!session) {
    const error = new Error('登录已过期，请重新登录。');
    error.statusCode = 401;
    throw error;
  }
  const userResult = await users.doc(session.userId).get();
  const user = userResult.data && userResult.data[0];
  if (!user || user.status === 1) {
    const error = new Error('账户不可用。');
    error.statusCode = 403;
    throw error;
  }
  return { user, token, session };
}

function favoriteInput(value) {
  const favorite = value && typeof value === 'object' ? value : {};
  const fields = ['id', 'date', 'seed', 'themeId', 'themeName', 'themeEnglishName', 'flowerPlanName', 'flowers', 'savedAt'];
  const result = {};
  for (const field of fields) {
    if (favorite[field] !== undefined) result[field] = String(favorite[field]).slice(0, 500);
  }
  if (!result.id || !result.date || !result.seed) {
    const error = new Error('收藏数据不完整。');
    error.statusCode = 400;
    throw error;
  }
  result.savedAt = result.savedAt || now().toISOString();
  return result;
}

function failure(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function boundedString(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function randomId(prefix) {
  const suffix = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : crypto.randomBytes(12).toString('hex');
  return `${prefix}-${suffix}`;
}

function generationInput(value) {
  const generation = value && typeof value === 'object' ? value : {};
  const result = {
    id: boundedString(generation.id, 120),
    name: boundedString(generation.name || generation.title, 120),
    seed: boundedString(generation.seed, 180),
    source: boundedString(generation.source, 500),
    status: boundedString(generation.status || '已生成', 50),
    colors: Array.isArray(generation.colors) ? generation.colors.slice(0, 8).map((color) => boundedString(color, 30)) : []
  };
  if (!result.id || !result.seed) failure('生成记录缺少 ID 或 seed。');
  return result;
}

function publicGeneration(generation) {
  return {
    id: generation.id,
    name: generation.name || generation.title || 'DailyFlora 生成记录',
    seed: generation.seed,
    source: generation.source || '',
    status: generation.status || '已生成',
    colors: Array.isArray(generation.colors) ? generation.colors : [],
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt
  };
}

function gardenInput(value) {
  const garden = value && typeof value === 'object' ? value : {};
  const entries = Array.isArray(garden.entries)
    ? garden.entries.slice(0, MAX_GENERATIONS).map(generationInput)
    : [];
  return {
    entries,
    profile: {
      displayName: boundedString(garden.profile?.displayName, 120),
      note: boundedString(garden.profile?.note, 500)
    }
  };
}

function publicTask(task) {
  return {
    id: task.id,
    referenceId: task.referenceId,
    status: task.status,
    input: task.input || {},
    result: task.result || null,
    generationId: task.generationId || null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt || null,
    errorMessage: task.errorMessage || null
  };
}

function publicReference(reference) {
  return {
    id: reference.id,
    fileName: reference.fileName,
    contentType: reference.contentType,
    size: reference.size,
    status: reference.status,
    taskId: reference.taskId,
    createdAt: reference.createdAt
  };
}

function parseReferenceImage(value) {
  const raw = String(value || '');
  const match = raw.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) failure('参考图必须是 PNG、JPEG、WebP 或 GIF 图片。');
  const contentType = match[1].toLowerCase() === 'image/jpg' ? 'image/jpeg' : match[1].toLowerCase();
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length) failure('参考图内容为空。');
  if (buffer.length > MAX_REFERENCE_BYTES) failure('参考图压缩后仍超过 1.5MB，请换一张图片。', 413);
  const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
  return { buffer, contentType, extension };
}

function adminEmailSet() {
  return new Set(String(process.env.DAILYFLORA_ADMIN_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean));
}

function isAdmin(user) {
  return user?.role === 'admin' || user?.roles?.includes?.('admin') || adminEmailSet().has(normalizeEmail(user?.email));
}

async function requireAdmin(event, body) {
  const auth = await authenticatedUser(event, body);
  if (!isAdmin(auth.user)) failure('没有后台权限。', 403);
  return auth;
}

async function register(body) {
  const email = normalizeEmail(body.email);
  const name = normalizeName(body.name);
  assertPassword(body.password);
  if (!email || !email.includes('@') || !name) {
    const error = new Error('请填写有效的昵称和邮箱。');
    error.statusCode = 400;
    throw error;
  }
  const existing = await users.where({ email }).limit(1).get();
  if (existing.data && existing.data.length) {
    const error = new Error('该邮箱已经注册，请直接登录。');
    error.statusCode = 409;
    throw error;
  }
  const password = createPasswordRecord(body.password);
  const createdAt = now();
  const addResult = await users.add({
    email,
    nickname: name,
    name,
    passwordHash: password.hash,
    passwordSalt: password.salt,
    status: 0,
    termsAcceptedAt: body.termsAcceptedAt || createdAt.toISOString(),
    termsVersion: body.termsVersion || '0.71',
    createdAt,
    lastSeenAt: createdAt
  });
  const user = { _id: addResult.id, email, nickname: name, name, createdAt, lastSeenAt: createdAt, termsAcceptedAt: createdAt.toISOString(), termsVersion: body.termsVersion || '0.71' };
  return { user: publicUser(user), ...(await issueSession(addResult.id)) };
}

async function login(body) {
  const email = normalizeEmail(body.email);
  assertPassword(body.password);
  const result = await users.where({ email }).limit(1).get();
  const user = result.data && result.data[0];
  if (!user || !passwordMatches(body.password, user)) {
    const error = new Error('邮箱或密码不正确。');
    error.statusCode = 401;
    throw error;
  }
  await users.doc(user._id).update({ lastSeenAt: now() });
  user.lastSeenAt = now();
  return { user: publicUser(user), ...(await issueSession(user._id)) };
}

async function listGenerations(auth) {
  const result = await generations.where({ userId: auth.user._id }).orderBy('updatedAt', 'desc').limit(MAX_GENERATIONS).get();
  return { generations: (result.data || []).map(publicGeneration) };
}

async function saveGeneration(auth, body) {
  const input = generationInput(body.generation);
  const current = now();
  const existing = await generations.where({ userId: auth.user._id, id: input.id }).limit(1).get();
  const record = {
    ...input,
    userId: auth.user._id,
    updatedAt: current
  };
  if (existing.data && existing.data[0]) {
    await generations.doc(existing.data[0]._id).update(record);
    return { generation: publicGeneration({ ...existing.data[0], ...record }) };
  }
  const created = { ...record, createdAt: current };
  await generations.add(created);
  return { generation: publicGeneration(created) };
}

async function getGarden(auth) {
  const result = await gardens.where({ userId: auth.user._id }).limit(1).get();
  const garden = result.data && result.data[0];
  return {
    garden: garden
      ? { entries: garden.entries || [], profile: garden.profile || {}, updatedAt: garden.updatedAt }
      : { entries: [], profile: {}, updatedAt: null }
  };
}

async function saveGarden(auth, body) {
  const input = gardenInput(body.garden);
  const current = now();
  const existing = await gardens.where({ userId: auth.user._id }).limit(1).get();
  const record = { userId: auth.user._id, ...input, updatedAt: current };
  if (existing.data && existing.data[0]) {
    await gardens.doc(existing.data[0]._id).update(record);
  } else {
    await gardens.add({ ...record, createdAt: current });
  }
  return { garden: { ...input, updatedAt: current } };
}

async function createReferenceTask(auth, body) {
  const image = parseReferenceImage(body.dataUrl);
  const referenceId = randomId('DF-REF');
  const taskId = randomId('DF-TASK');
  const fileName = boundedString(body.fileName || `${referenceId}.${image.extension}`, 160);
  const cloudPath = `dailyflora/private/${auth.user._id}/${referenceId}.${image.extension}`;
  let uploaded;
  try {
    uploaded = await uniCloud.uploadFile({
      cloudPath,
      fileContent: image.buffer,
      cloudPathAsRealPath: true
    });
  } catch (error) {
    const uploadError = new Error('参考图私有存储上传失败，请稍后重试。');
    uploadError.statusCode = 503;
    uploadError.cause = error;
    throw uploadError;
  }
  const fileId = uploaded?.fileID || uploaded?.fileId;
  if (!fileId) failure('私有存储没有返回文件 ID。', 503);
  const current = now();
  const reference = {
    id: referenceId,
    userId: auth.user._id,
    fileId,
    fileName,
    contentType: image.contentType,
    size: image.buffer.length,
    status: 'queued',
    taskId,
    createdAt: current,
    updatedAt: current
  };
  const task = {
    id: taskId,
    userId: auth.user._id,
    referenceId,
    status: 'queued',
    input: {
      bouquetName: boundedString(body.bouquetName, 120),
      style: boundedString(body.style, 40),
      preference: boundedString(body.preference, 500)
    },
    result: null,
    createdAt: current,
    updatedAt: current
  };
  try {
    await referenceImages.add(reference);
    await processingTasks.add(task);
  } catch (error) {
    try {
      await uniCloud.deleteFile({ fileList: [fileId] });
    } catch {
      // The database failure is still returned; an operator can remove an orphaned file by file ID.
    }
    throw error;
  }
  return { reference: publicReference(reference), task: publicTask(task) };
}

async function listProcessingTasks(auth) {
  const result = await processingTasks.where({ userId: auth.user._id }).orderBy('updatedAt', 'desc').limit(MAX_TASKS).get();
  return { tasks: (result.data || []).map(publicTask) };
}

async function getProcessingTask(auth, body) {
  const taskId = boundedString(body.taskId, 160);
  if (!taskId) failure('缺少任务 ID。');
  const result = await processingTasks.where({ userId: auth.user._id, id: taskId }).limit(1).get();
  const task = result.data && result.data[0];
  if (!task) failure('任务不存在。', 404);
  return { task: publicTask(task) };
}

function processingResultInput(value) {
  const result = value && typeof value === 'object' ? value : {};
  return {
    title: boundedString(result.title, 160),
    summary: boundedString(result.summary, 1000),
    flowers: Array.isArray(result.flowers) ? result.flowers.slice(0, 24).map((item) => boundedString(item, 120)) : [],
    colors: Array.isArray(result.colors) ? result.colors.slice(0, 8).map((item) => boundedString(item, 30)) : [],
    composition: boundedString(result.composition, 1000),
    seed: boundedString(result.seed, 180)
  };
}

async function writeProcessingResult(auth, body) {
  const taskId = boundedString(body.taskId, 160);
  const status = boundedString(body.status || 'completed', 30);
  if (!taskId || !['processing', 'completed', 'failed'].includes(status)) failure('任务状态或任务 ID 无效。');
  const taskResult = await processingTasks.where({ id: taskId }).limit(1).get();
  const task = taskResult.data && taskResult.data[0];
  if (!task) failure('任务不存在。', 404);
  const current = now();
  const result = processingResultInput(body.result);
  let generationId = task.generationId || null;
  if (status === 'completed') {
    generationId = generationId || randomId('DF-AI');
    const generation = {
      id: generationId,
      userId: task.userId,
      name: result.title || task.input?.bouquetName || 'DailyFlora 参考图生成',
      seed: result.seed || generationId.toLowerCase(),
      source: '参考图 + Codex/人工处理',
      status: '已生成',
      colors: result.colors,
      createdAt: current,
      updatedAt: current
    };
    const existingGeneration = await generations.where({ userId: task.userId, id: generationId }).limit(1).get();
    if (existingGeneration.data && existingGeneration.data[0]) await generations.doc(existingGeneration.data[0]._id).update(generation);
    else await generations.add(generation);
    const gardenResult = await gardens.where({ userId: task.userId }).limit(1).get();
    const existingGarden = gardenResult.data && gardenResult.data[0];
    const entries = existingGarden?.entries || [];
    const nextEntries = [publicGeneration(generation), ...entries.filter((entry) => entry.id !== generationId)].slice(0, MAX_GENERATIONS);
    const gardenRecord = { userId: task.userId, entries: nextEntries, profile: existingGarden?.profile || {}, updatedAt: current };
    if (existingGarden) await gardens.doc(existingGarden._id).update(gardenRecord);
    else await gardens.add({ ...gardenRecord, createdAt: current });
  }
  const update = {
    status,
    result,
    generationId,
    updatedAt: current,
    ...(status === 'completed' || status === 'failed' ? { completedAt: current } : {}),
    ...(status === 'failed' ? { errorMessage: boundedString(body.errorMessage || result.summary, 500) } : {})
  };
  await processingTasks.doc(task._id).update(update);
  await referenceImages.where({ id: task.referenceId }).update({ status, updatedAt: current });
  return { task: publicTask({ ...task, ...update }) };
}

async function adminSummary(auth) {
  const [usersCount, favoritesCount, generationCount, taskCount, orderCount] = await Promise.all([
    users.count(),
    favorites.count(),
    generations.count(),
    processingTasks.count(),
    demoOrders.count()
  ]);
  return {
    summary: {
      users: usersCount.total,
      favorites: favoritesCount.total,
      generations: generationCount.total,
      tasks: taskCount.total,
      demoOrders: orderCount.total,
      adminEmail: auth.user.email
    }
  };
}

async function adminListUsers() {
  const result = await users.orderBy('createdAt', 'desc').limit(100).get();
  return { users: (result.data || []).map(publicUser) };
}

async function adminListTasks(body) {
  const status = boundedString(body.status, 30);
  const query = status ? { status } : {};
  const result = await processingTasks.where(query).orderBy('updatedAt', 'desc').limit(MAX_TASKS).get();
  return { tasks: (result.data || []).map(publicTask) };
}

async function adminGetReference(body) {
  const taskId = boundedString(body.taskId, 160);
  if (!taskId) failure('缺少任务 ID。');
  const taskResult = await processingTasks.where({ id: taskId }).limit(1).get();
  const task = taskResult.data && taskResult.data[0];
  if (!task) failure('任务不存在。', 404);
  const referenceResult = await referenceImages.where({ id: task.referenceId }).limit(1).get();
  const reference = referenceResult.data && referenceResult.data[0];
  if (!reference) failure('参考图记录不存在。', 404);
  try {
    const temporary = await uniCloud.getTempFileURL({ fileList: [reference.fileId] });
    const item = Array.isArray(temporary?.fileList) ? temporary.fileList[0] : temporary?.[0];
    const url = item?.tempFileURL || item?.url;
    if (!url) failure('私有文件暂时无法读取。', 503);
    return { reference: { ...publicReference(reference), temporaryUrl: url, expiresIn: 300 } };
  } catch (error) {
    const readError = new Error('私有文件暂时无法读取。');
    readError.statusCode = 503;
    readError.cause = error;
    throw readError;
  }
}

async function listDemoPoints(auth) {
  const result = await pointsLedger.where({ userId: auth.user._id }).orderBy('createdAt', 'desc').limit(100).get();
  return { points: result.data || [] };
}

async function listDemoOrders(auth) {
  const result = await demoOrders.where({ userId: auth.user._id }).orderBy('createdAt', 'desc').limit(50).get();
  return { orders: result.data || [] };
}

async function createDemoOrder(auth, body) {
  const current = now();
  const order = {
    id: randomId('DF-DEMO-ORDER'),
    userId: auth.user._id,
    productId: boundedString(body.productId, 120),
    label: boundedString(body.label, 160),
    amount: boundedString(body.amount, 40),
    status: 'demo-only',
    createdAt: current
  };
  if (!order.productId || !order.label) failure('演示订单缺少商品信息。');
  await demoOrders.add(order);
  return { order };
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function encodedQuery(params) {
  const encode = (value) => encodeURIComponent(String(value))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
  return Object.keys(params).sort().map((key) => `${encode(key)}=${encode(params[key])}`).join('&');
}

async function sendPasswordResetEmail(user, token) {
  const accessKeyId = process.env.DIRECTMAIL_ACCESS_KEY_ID;
  const accessKeySecret = process.env.DIRECTMAIL_ACCESS_KEY_SECRET;
  const accountName = process.env.DIRECTMAIL_ACCOUNT_NAME;
  const fromAlias = process.env.DIRECTMAIL_FROM_ALIAS || 'DailyFlora';
  const publicOrigin = (process.env.DAILYFLORA_PUBLIC_ORIGIN || 'https://dailyflora.calfn.com').replace(/\/$/, '');
  if (!accessKeyId || !accessKeySecret || !accountName) {
    const error = new Error('邮件服务尚未配置，请联系管理员完成 DirectMail 配置。');
    error.statusCode = 503;
    throw error;
  }
  const params = {
    AccessKeyId: accessKeyId,
    AccountName: accountName,
    Action: 'SingleSendMail',
    AddressType: '1',
    Format: 'JSON',
    HtmlBody: `<p>你好，${String(user.nickname || 'DailyFlora 用户').replace(/[<>]/g, '')}：</p><p>请点击下面的链接，在 30 分钟内重置 DailyFlora 密码：</p><p><a href="${publicOrigin}/login/#reset?token=${encodeURIComponent(token)}">重置密码</a></p><p>如果不是你发起的请求，请忽略这封邮件。</p>`,
    ReplyToAddress: 'true',
    Subject: '重置你的 DailyFlora 密码',
    ToAddress: user.email,
    SignatureMethod: 'HMAC-SHA1',
    SignatureNonce: crypto.randomBytes(16).toString('hex'),
    SignatureVersion: '1.0',
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    Version: '2015-11-23'
  };
  const canonicalized = encodedQuery(params);
  const stringToSign = `POST&%2F&${encodeURIComponent(canonicalized).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A')}`;
  params.Signature = crypto.createHmac('sha1', `${accessKeySecret}&`).update(stringToSign).digest('base64');
  const body = encodedQuery(params);
  const result = await uniCloud.httpclient.request('https://dm.aliyuncs.com/', {
    method: 'POST',
    content: body,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    dataType: 'json'
  });
  if (Number(result.status) >= 300 || result.data?.Code) {
    const error = new Error('DirectMail 暂时无法发送重置邮件。');
    error.statusCode = 503;
    throw error;
  }
}

async function requestPasswordReset(body) {
  const email = normalizeEmail(body.email);
  const result = email ? await users.where({ email }).limit(1).get() : { data: [] };
  const user = result.data && result.data[0];
  if (user) {
    const token = crypto.randomBytes(32).toString('base64url');
    await passwordResets.add({
      userId: user._id,
      tokenHash: hashResetToken(token),
      createdAt: now(),
      expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000)
    });
    await sendPasswordResetEmail(user, token);
  }
  return { ok: true };
}

async function resetPassword(body) {
  const token = String(body.token || '').trim();
  assertPassword(body.password);
  if (!token) {
    const error = new Error('重置链接无效或已过期。');
    error.statusCode = 400;
    throw error;
  }
  const result = await passwordResets.where({ tokenHash: hashResetToken(token), expiresAt: command.gt(now()) }).limit(1).get();
  const reset = result.data && result.data[0];
  if (!reset) {
    const error = new Error('重置链接无效或已过期。');
    error.statusCode = 400;
    throw error;
  }
  const userResult = await users.doc(reset.userId).get();
  const user = userResult.data && userResult.data[0];
  if (!user || user.status === 1) {
    const error = new Error('账户不可用。');
    error.statusCode = 403;
    throw error;
  }
  const password = createPasswordRecord(body.password);
  const lastSeenAt = now();
  await users.doc(user._id).update({ passwordHash: password.hash, passwordSalt: password.salt, lastSeenAt });
  await passwordResets.doc(reset._id).remove();
  return { user: publicUser({ ...user, ...password, lastSeenAt }), ...(await issueSession(user._id)) };
}

async function handleAction(action, body, event) {
  if (action === 'register') return register(body);
  if (action === 'login') return login(body);
  if (action === 'health') return { service: 'dailyflora-api', version: '0.71.1' };
  if (action === 'requestPasswordReset') return requestPasswordReset(body);
  if (action === 'resetPassword') return resetPassword(body);

  const auth = await authenticatedUser(event, body);
  if (action === 'me') return { user: publicUser(auth.user) };
  if (action === 'logout') {
    await sessions.doc(auth.session._id).remove();
    return { ok: true };
  }
  if (action === 'listFavorites') {
    const result = await favorites.where({ userId: auth.user._id }).orderBy('savedAt', 'desc').limit(MAX_FAVORITES).get();
    return { favorites: result.data || [] };
  }
  if (action === 'saveFavorite') {
    const favorite = favoriteInput(body.favorite);
    const record = { ...favorite, userId: auth.user._id, updatedAt: now() };
    const existing = await favorites.where({ userId: auth.user._id, id: favorite.id }).limit(1).get();
    if (existing.data && existing.data[0]) {
      await favorites.doc(existing.data[0]._id).update(record);
    } else {
      await favorites.add({ ...record, createdAt: now() });
    }
    return { favorite: record };
  }
  if (action === 'removeFavorite') {
    if (!body.favoriteId) {
      const error = new Error('缺少收藏 ID。');
      error.statusCode = 400;
      throw error;
    }
    await favorites.where({ userId: auth.user._id, id: String(body.favoriteId) }).remove();
    return { ok: true };
  }
  if (action === 'listGenerations') return listGenerations(auth);
  if (action === 'saveGeneration') return saveGeneration(auth, body);
  if (action === 'getGarden') return getGarden(auth);
  if (action === 'saveGarden') return saveGarden(auth, body);
  if (action === 'createReferenceTask') return createReferenceTask(auth, body);
  if (action === 'listProcessingTasks') return listProcessingTasks(auth);
  if (action === 'getProcessingTask') return getProcessingTask(auth, body);
  if (action === 'listDemoPoints') return listDemoPoints(auth);
  if (action === 'listDemoOrders') return listDemoOrders(auth);
  if (action === 'createDemoOrder') return createDemoOrder(auth, body);
  if (action === 'adminSummary') return adminSummary(await requireAdmin(event, body));
  if (action === 'adminListUsers') {
    await requireAdmin(event, body);
    return adminListUsers();
  }
  if (action === 'adminListTasks') {
    await requireAdmin(event, body);
    return adminListTasks(body);
  }
  if (action === 'adminGetReference') {
    await requireAdmin(event, body);
    return adminGetReference(body);
  }
  if (action === 'adminWriteProcessingResult') return writeProcessingResult(await requireAdmin(event, body), body);
  const error = new Error('未知操作。');
  error.statusCode = 400;
  throw error;
}

exports.main = async (event) => {
  if (event && event.httpMethod === 'OPTIONS') return response(204, {});
  const body = jsonBody(event);
  try {
    const action = String(body.action || '');
    const result = await handleAction(action, body, event);
    const headers = {};
    if (result.token && result.tokenExpired) headers['Set-Cookie'] = sessionCookie(result.token, result.tokenExpired);
    if (action === 'logout') headers['Set-Cookie'] = clearSessionCookie();
    return response(200, { code: 0, ...result }, headers);
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    return response(statusCode, { code: statusCode, message: error.message || '服务暂时不可用。' });
  }
};
