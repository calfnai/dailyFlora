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

type CloudResponse<T> = { code: number; message?: string; token?: string; tokenExpired?: string; user?: CloudAccount; favorites?: T };

const apiBase = (import.meta.env.VITE_DAILYFLORA_API_BASE || '').trim().replace(/\/$/, '');
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
  if (!dailyfloraCloudEnabled || !readToken()) return null;
  const result = await request<never>('me');
  return result.user || null;
}

export async function logoutAccount() {
  if (dailyfloraCloudEnabled && readToken()) {
    try {
      await request<never>('logout');
    } finally {
      clearCloudSession();
    }
  } else {
    clearCloudSession();
  }
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
