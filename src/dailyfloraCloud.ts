export type CloudAccount = {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  lastSeenAt?: string;
};

export type CloudFavorite = {
  id: string;
  date: string;
  seed: string;
  themeId: string;
  themeName: string;
  themeEnglishName: string;
  flowerPlanName: string;
  flowers: string;
  savedAt: string;
};

export type CloudGeneration = {
  id: string;
  publicId: string;
  name: string;
  seed: string;
  themeId?: string;
  date?: string;
  source: string;
  status: string;
  colors: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CloudTask = {
  id: string;
  referenceId: string;
  status: 'preparing' | 'queued' | 'processing' | 'completed' | 'failed' | string;
  input: { bouquetName?: string; style?: string; preference?: string };
  result?: {
    title?: string;
    summary?: string;
    flowers?: string[];
    colors?: string[];
    composition?: string;
    seed?: string;
    themeId?: string;
    renderParams?: Record<string, number | string | boolean>;
  } | null;
  generationId?: string | null;
  publicId?: string | null;
  cost?: number;
  refunded?: boolean;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export type PointAccount = { balance: number; updatedAt?: string | null };
export type PointEntry = {
  id: string;
  amount: number;
  type: string;
  reason: string;
  taskId?: string;
  balanceAfter: number;
  createdAt: string;
};

export type AccountSnapshot = {
  user: CloudAccount;
  favorites: CloudFavorite[];
  generations: CloudGeneration[];
  tasks: CloudTask[];
  pointAccount: PointAccount;
  points: PointEntry[];
};

type CloudResponse<T> = {
  code: number;
  message?: string;
  error?: { code?: string | number; message?: string };
  token?: string;
  tokenExpired?: string;
  user?: CloudAccount;
  favorite?: CloudFavorite;
  favorites?: CloudFavorite[];
  generations?: CloudGeneration[];
  generation?: CloudGeneration;
  tasks?: CloudTask[];
  task?: CloudTask;
  pointAccount?: PointAccount;
  points?: PointEntry[];
  snapshot?: AccountSnapshot;
  summary?: Record<string, unknown>;
  users?: Array<CloudAccount & { balance?: number }>;
  reference?: Record<string, unknown>;
  batch?: T;
  ok?: boolean;
};

declare global {
  interface Window {
    __DAILYFLORA_CONFIG__?: { apiUrl?: string; releaseChannel?: string; workerBridgeUrl?: string };
  }
}

const configuredApiBase =
  import.meta.env.VITE_DAILYFLORA_API_BASE ||
  (typeof window !== 'undefined' ? window.__DAILYFLORA_CONFIG__?.apiUrl : '') ||
  '';
export const dailyfloraApiBase = configuredApiBase.trim().replace(/\/$/, '');
export const dailyfloraCloudEnabled = Boolean(dailyfloraApiBase);
export const workerBridgeUrl = (typeof window !== 'undefined' ? window.__DAILYFLORA_CONFIG__?.workerBridgeUrl : '') || 'http://127.0.0.1:43172';

const tokenKey = 'dailyflora.beta072.cloud.token.v1';
const tokenExpiryKey = 'dailyflora.beta072.cloud.token-expired.v1';
export const accountMirrorKey = 'dailyflora.beta072.account.v1';

function readToken() {
  return typeof window === 'undefined' ? '' : window.localStorage.getItem(tokenKey) || '';
}

function saveToken(token?: string, tokenExpired?: string) {
  if (!token || typeof window === 'undefined') return;
  window.localStorage.setItem(tokenKey, token);
  if (tokenExpired) window.localStorage.setItem(tokenExpiryKey, tokenExpired);
}

export function clearCloudSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(tokenExpiryKey);
  window.localStorage.removeItem(accountMirrorKey);
  window.dispatchEvent(new CustomEvent('dailyflora:account-state', { detail: { status: 'guest', user: null } }));
}

export function saveAccountMirror(user: CloudAccount | null) {
  if (typeof window === 'undefined') return;
  if (user) window.localStorage.setItem(accountMirrorKey, JSON.stringify(user));
  else window.localStorage.removeItem(accountMirrorKey);
  window.dispatchEvent(new CustomEvent('dailyflora:account-state', {
    detail: { status: user ? 'signed-in' : 'guest', user }
  }));
}

export function readAccountMirror(): CloudAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(accountMirrorKey) || 'null') as CloudAccount | null;
  } catch {
    return null;
  }
}

export async function cloudRequest<T>(action: string, payload: Record<string, unknown> = {}): Promise<CloudResponse<T>> {
  if (!dailyfloraApiBase) throw new Error('0.72 Beta 云端账户尚未配置。');
  const token = readToken();
  const response = await fetch(dailyfloraApiBase, {
    method: 'POST',
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ action, token, ...payload })
  });
  const result = (await response.json().catch(() => ({}))) as CloudResponse<T>;
  const providerCode = String(result.error?.code || '');
  const providerMessage = result.error?.message || '';
  if (!response.ok || result.code || result.error) {
    if (response.status === 401 || result.code === 401 || providerCode === '401') clearCloudSession();
    if (providerCode === 'PrePayResourceExhausted') {
      throw new Error('云端账户服务暂时达到 UniCloud 平台额度，请恢复按量资源后重试。');
    }
    throw new Error(result.message || providerMessage || `云端请求失败（${response.status}）。`);
  }
  return result;
}

export async function registerAccount(input: { name: string; email: string; password: string; termsVersion: string }) {
  const result = await cloudRequest<never>('register', input);
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('注册响应缺少用户资料。');
  saveAccountMirror(result.user);
  return result.user;
}

export async function loginAccount(input: { email: string; password: string }) {
  const result = await cloudRequest<never>('login', input);
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('登录响应缺少用户资料。');
  saveAccountMirror(result.user);
  return result.user;
}

export async function restoreAccount() {
  if (!dailyfloraCloudEnabled || !readToken()) {
    saveAccountMirror(null);
    return null;
  }
  const result = await cloudRequest<never>('me');
  const user = result.user || null;
  saveAccountMirror(user);
  return user;
}

export async function logoutAccount() {
  try {
    if (dailyfloraCloudEnabled && readToken()) await cloudRequest<never>('logout');
  } finally {
    clearCloudSession();
  }
}

export async function getMemberSnapshot() {
  const result = await cloudRequest<AccountSnapshot>('memberDashboard');
  if (!result.snapshot) throw new Error('个人中心响应不完整。');
  saveAccountMirror(result.snapshot.user);
  return result.snapshot;
}

export async function listCloudFavorites() {
  const result = await cloudRequest<CloudFavorite[]>('listFavorites');
  return result.favorites || [];
}

export async function saveCloudFavorite(favorite: CloudFavorite) {
  const result = await cloudRequest<CloudFavorite>('saveFavorite', { favorite });
  return result.favorite || favorite;
}

export async function removeCloudFavorite(favoriteId: string) {
  await cloudRequest<never>('removeFavorite', { favoriteId });
}

export async function createReferenceTask(input: {
  idempotencyKey: string;
  referenceDataUrl: string;
  thumbnailDataUrl: string;
  sourceFileName: string;
  reference: { bytes: number; width: number; height: number };
  thumbnail: { bytes: number; width: number; height: number };
  bouquetName: string;
  style: string;
  preference: string;
}) {
  const result = await cloudRequest<CloudTask>('createReferenceTask', input);
  if (!result.task) throw new Error('任务创建响应不完整。');
  return result.task;
}

export async function renameGeneration(generationId: string, name: string) {
  const result = await cloudRequest<CloudGeneration>('renameGeneration', { generationId, name });
  if (!result.generation) throw new Error('生成记录更新失败。');
  return result.generation;
}

export async function deleteGeneration(generationId: string) {
  await cloudRequest<never>('deleteGeneration', { generationId });
}

export async function getPublicGeneration(publicId: string) {
  const result = await cloudRequest<CloudGeneration>('getPublicGeneration', { publicId });
  if (!result.generation) throw new Error('这个公开花束不存在。');
  return result.generation;
}

export async function requestPasswordReset(email: string) {
  return cloudRequest<never>('requestPasswordReset', { email });
}

export async function resetPassword(input: { token: string; password: string }) {
  const result = await cloudRequest<never>('resetPassword', input);
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('密码重置响应缺少用户资料。');
  saveAccountMirror(result.user);
  return result.user;
}

export async function getAdminSummary() {
  const result = await cloudRequest<Record<string, unknown>>('adminSummary');
  return result.summary || {};
}

export async function listAdminUsers() {
  const result = await cloudRequest<Array<CloudAccount & { balance?: number }>>('adminListUsers');
  return result.users || [];
}

export async function listAdminTasks(status = '') {
  const result = await cloudRequest<CloudTask[]>('adminListTasks', status ? { status } : {});
  return result.tasks || [];
}

export async function grantPoints(userId: string, amount: number, reason: string, idempotencyKey: string) {
  return cloudRequest<never>('adminGrantPoints', { userId, amount, reason, idempotencyKey });
}

export async function getAdminReference(taskId: string) {
  const result = await cloudRequest<Record<string, unknown>>('adminGetReference', { taskId });
  return result.reference || null;
}

export async function createWorkerBatch() {
  const result = await cloudRequest<{ token: string; expiresAt: string; taskCount: number }>('adminCreateWorkerBatch');
  if (!result.batch) throw new Error('批次创建响应不完整。');
  return result.batch;
}
