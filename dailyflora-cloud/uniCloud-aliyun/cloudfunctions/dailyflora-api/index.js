'use strict';

const crypto = require('crypto');

const db = uniCloud.database();
const command = db.command;
const users = db.collection('uni-id-users');
const sessions = db.collection('dailyflora-sessions');
const favorites = db.collection('dailyflora-favorites');
const SESSION_DAYS = 30;
const MAX_FAVORITES = 24;

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

function response(statusCode, payload) {
  return {
    mpserverlessComposedResponse: true,
    isBase64Encoded: false,
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
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
  return String(body.token || '').trim();
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

async function handleAction(action, body, event) {
  if (action === 'register') return register(body);
  if (action === 'login') return login(body);
  if (action === 'health') return { service: 'dailyflora-api', version: '0.71.1' };

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
  const error = new Error('未知操作。');
  error.statusCode = 400;
  throw error;
}

exports.main = async (event) => {
  if (event && event.httpMethod === 'OPTIONS') return response(204, {});
  const body = jsonBody(event);
  try {
    const result = await handleAction(String(body.action || ''), body, event);
    return response(200, { code: 0, ...result });
  } catch (error) {
    const statusCode = Number(error.statusCode) || 500;
    return response(statusCode, { code: statusCode, message: error.message || '服务暂时不可用。' });
  }
};
