export type CloudAccount = {
  id: string;
  name: string;
  email: string;
  termsAccepted?: boolean;
  termsVersion?: string;
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
  name: string;
  seed: string;
  source: string;
  status: string;
  colors: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type CloudGarden = {
  entries: CloudGeneration[];
  profile?: { displayName?: string; note?: string };
  updatedAt?: string | null;
};

export type CloudTask = {
  id: string;
  referenceId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | string;
  input: { bouquetName?: string; style?: string; preference?: string };
  result?: {
    title?: string;
    summary?: string;
    flowers?: string[];
    colors?: string[];
    composition?: string;
    seed?: string;
  } | null;
  generationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  errorMessage?: string | null;
};

export type CloudReference = {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  status: string;
  taskId: string;
  createdAt?: string;
  temporaryUrl?: string;
  expiresIn?: number;
};

type CloudResponse<T> = {
  code: number;
  message?: string;
  token?: string;
  tokenExpired?: string;
  user?: CloudAccount;
  favorites?: T;
  generations?: T;
  garden?: T;
  generation?: T;
  task?: T;
  tasks?: T;
  reference?: T;
  summary?: T;
  users?: T;
  points?: T;
  orders?: T;
  order?: T;
  ok?: boolean;
};

declare global {
  interface Window {
    __DAILYFLORA_CONFIG__?: { apiUrl?: string };
  }
}

const configuredApiBase =
  import.meta.env.VITE_DAILYFLORA_API_BASE ||
  (typeof window !== 'undefined' ? window.__DAILYFLORA_CONFIG__?.apiUrl : '') ||
  '';
const apiBase = configuredApiBase.trim().replace(/\/$/, '');
const tokenKey = 'dailyflora.cloud.token.v1';
const tokenExpiryKey = 'dailyflora.cloud.token-expired.v1';

export const dailyfloraCloudEnabled = Boolean(apiBase);

function readToken() {
  return window.localStorage.getItem(tokenKey) || '';
}

function saveToken(token?: string, tokenExpired?: string) {
  if (!token) return;
  window.localStorage.setItem(tokenKey, token);
  if (tokenExpired) window.localStorage.setItem(tokenExpiryKey, tokenExpired);
}

export function clearCloudSession() {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(tokenExpiryKey);
}

async function request<T>(action: string, payload: Record<string, unknown> = {}): Promise<CloudResponse<T>> {
  if (!apiBase) throw new Error('云端账户尚未配置。');
  const token = readToken();
  const response = await fetch(apiBase, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ action, token, ...payload })
  });
  const result = (await response.json().catch(() => ({}))) as CloudResponse<T>;
  if (!response.ok || result.code) {
    if (response.status === 401 || result.code === 401) clearCloudSession();
    throw new Error(result.message || `云端请求失败（${response.status}）。`);
  }
  return result;
}

export async function registerAccount(input: { name: string; email: string; password: string; termsVersion: string }) {
  const result = await request<never>('register', {
    name: input.name,
    email: input.email,
    password: input.password,
    termsVersion: input.termsVersion,
    termsAcceptedAt: new Date().toISOString()
  });
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('注册响应缺少用户资料。');
  return result.user;
}

export async function loginAccount(input: { email: string; password: string }) {
  const result = await request<never>('login', input);
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('登录响应缺少用户资料。');
  return result.user;
}

export async function restoreAccount() {
  if (!dailyfloraCloudEnabled) return null;
  const result = await request<never>('me');
  return result.user || null;
}

export async function logoutAccount() {
  let failure: unknown;
  if (dailyfloraCloudEnabled) {
    try {
      await request<never>('logout');
    } catch (error) {
      failure = error;
    } finally {
      clearCloudSession();
    }
  } else {
    clearCloudSession();
  }
  if (failure) throw failure;
}

export async function listCloudFavorites() {
  const result = await request<CloudFavorite[]>('listFavorites');
  return result.favorites || [];
}

export async function saveCloudFavorite(favorite: CloudFavorite) {
  await request<never>('saveFavorite', { favorite });
}

export async function removeCloudFavorite(favoriteId: string) {
  await request<never>('removeFavorite', { favoriteId });
}

export async function listCloudGenerations() {
  const result = await request<CloudGeneration[]>('listGenerations');
  return result.generations || [];
}

export async function saveCloudGeneration(generation: CloudGeneration) {
  const result = await request<CloudGeneration>('saveGeneration', { generation });
  return result.generation || generation;
}

export async function getCloudGarden() {
  const result = await request<CloudGarden>('getGarden');
  return result.garden || { entries: [], profile: {} };
}

export async function saveCloudGarden(garden: CloudGarden) {
  const result = await request<CloudGarden>('saveGarden', { garden });
  return result.garden || garden;
}

export async function createCloudReferenceTask(input: {
  dataUrl: string;
  fileName: string;
  bouquetName: string;
  style: string;
  preference: string;
}) {
  const result = await request<CloudTask>('createReferenceTask', input);
  return { reference: result.reference, task: result.task };
}

export async function listCloudProcessingTasks() {
  const result = await request<CloudTask[]>('listProcessingTasks');
  return result.tasks || [];
}

export async function getCloudProcessingTask(taskId: string) {
  const result = await request<CloudTask>('getProcessingTask', { taskId });
  return result.task;
}

export async function listCloudDemoPoints() {
  const result = await request<unknown[]>('listDemoPoints');
  return result.points || [];
}

export async function listCloudDemoOrders() {
  const result = await request<unknown[]>('listDemoOrders');
  return result.orders || [];
}

export async function createCloudDemoOrder(input: { productId: string; label: string; amount?: string }) {
  const result = await request<unknown>('createDemoOrder', input);
  return result.order;
}

export async function getCloudAdminSummary() {
  const result = await request<Record<string, unknown>>('adminSummary');
  return result.summary || {};
}

export async function listCloudAdminUsers() {
  const result = await request<CloudAccount[]>('adminListUsers');
  return result.users || [];
}

export async function listCloudAdminTasks(status = '') {
  const result = await request<CloudTask[]>('adminListTasks', status ? { status } : {});
  return result.tasks || [];
}

export async function getCloudAdminReference(taskId: string) {
  const result = await request<CloudReference>('adminGetReference', { taskId });
  return result.reference;
}

export async function writeCloudProcessingResult(input: {
  taskId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: CloudTask['result'];
  errorMessage?: string;
}) {
  const result = await request<CloudTask>('adminWriteProcessingResult', input);
  return result.task;
}

export async function requestPasswordReset(email: string) {
  return request<never>('requestPasswordReset', { email });
}

export async function resetPassword(input: { token: string; password: string }) {
  const result = await request<never>('resetPassword', input);
  saveToken(result.token, result.tokenExpired);
  if (!result.user) throw new Error('密码重置响应缺少用户资料。');
  return result.user;
}
