import {
  createCloudReferenceTask,
  dailyfloraCloudEnabled,
  listCloudGenerations,
  listCloudFavorites,
  listCloudProcessingTasks,
  loginAccount,
  logoutAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  saveCloudGeneration,
  type CloudGeneration,
  type CloudTask
} from './dailyfloraCloud';

const accountKey = 'dailyflora.account.v2';
const favoritesKey = 'dailyflora.favorites.v1';
type AuthMode = 'signup' | 'login';

const form = document.querySelector<HTMLFormElement>('#member-signup-form');
const nameField = document.querySelector<HTMLElement>('#member-signup-name-field');
const nameInput = document.querySelector<HTMLInputElement>('#member-signup-name');
const emailInput = document.querySelector<HTMLInputElement>('#member-signup-email');
const passwordInput = document.querySelector<HTMLInputElement>('#member-signup-password');
const termsField = document.querySelector<HTMLElement>('#member-terms-field');
const submitLabel = document.querySelector<HTMLElement>('#member-auth-submit-label');
const authPill = document.querySelector<HTMLElement>('#member-auth-pill');
const switchCopy = document.querySelector<HTMLElement>('#member-auth-switch-copy');
const switchLink = document.querySelector<HTMLAnchorElement>('#member-auth-switch');
const errorBox = document.querySelector<HTMLElement>('#member-auth-error');
const resetRequestForm = document.querySelector<HTMLFormElement>('#member-reset-request-form');
const resetForm = document.querySelector<HTMLFormElement>('#member-reset-form');
const resetTokenInput = document.querySelector<HTMLInputElement>('#member-reset-token');
const forgotRow = document.querySelector<HTMLElement>('#member-forgot-row');
const logout = document.querySelector<HTMLButtonElement>('#member-logout');

let authMode: AuthMode = 'signup';

declare global {
  interface Window {
    __DAILYFLORA_MEMBER_WORKSPACE__?: {
      enabled: boolean;
      createReferenceTask: (input: {
        dataUrl: string;
        fileName: string;
        bouquetName: string;
        style: string;
        preference: string;
      }) => Promise<CloudTask>;
      saveGeneration: (generation: CloudGeneration) => Promise<CloudGeneration>;
      refresh: () => Promise<void>;
    };
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return (value ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function notify(message: string, isError = false) {
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
    errorBox.dataset.error = String(isError);
  }
  if (!isError) {
    const toast = document.querySelector<HTMLElement>('#local-toast');
    toast?.classList.add('is-visible');
    if (toast) {
      toast.textContent = message;
      window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
    }
  }
}

function accountExists() {
  return Boolean(readJson<{ email?: string } | null>(accountKey, null)?.email);
}

function resetUrlState() {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
}

function hashMode(): AuthMode {
  return window.location.hash.replace(/^#/, '').split(/[?&]/, 1)[0] === 'login' ? 'login' : 'signup';
}

function resetTokenFromHash() {
  const raw = window.location.hash.replace(/^#reset\??/, '');
  return new URLSearchParams(raw).get('token') || '';
}

function setAuthMode(nextMode: AuthMode) {
  authMode = nextMode;
  const login = nextMode === 'login';
  if (authPill) authPill.textContent = login ? 'Sign in' : 'Create account';
  if (submitLabel) submitLabel.textContent = login ? '登录并打开花园' : '创建账户';
  if (switchCopy) switchCopy.textContent = login ? '还没有账户？' : '已有账户？';
  if (switchLink) {
    switchLink.textContent = login ? '立即注册' : '直接登录';
    switchLink.href = login ? '#signup' : '#login';
  }
  if (nameField) nameField.hidden = login;
  if (nameInput) nameInput.required = !login;
  if (termsField) termsField.hidden = login;
  const termsInput = termsField?.querySelector<HTMLInputElement>('input[name="termsAccepted"]');
  if (termsInput) termsInput.required = !login;
  if (passwordInput) passwordInput.autocomplete = login ? 'current-password' : 'new-password';
  if (forgotRow) forgotRow.hidden = !login;
  if (resetRequestForm) resetRequestForm.hidden = true;
  if (resetForm) resetForm.hidden = true;
  if (form) form.hidden = false;
  notify('');
}

function setResetMode() {
  const token = resetTokenFromHash();
  if (form) form.hidden = true;
  if (forgotRow) forgotRow.hidden = true;
  if (resetRequestForm) resetRequestForm.hidden = !token;
  if (resetForm) resetForm.hidden = !token;
  if (resetTokenInput) resetTokenInput.value = token;
  if (authPill) authPill.textContent = 'Reset password';
  if (token) notify('请设置一个新的 8 位以上密码。');
  else notify('输入注册邮箱，我们会发送一次性重置链接。');
}

function saveAccount(user: { id?: string; name: string; email: string; termsAccepted?: boolean; termsVersion?: string; createdAt?: string; lastSeenAt?: string }) {
  localStorage.setItem(accountKey, JSON.stringify(user));
  window.dispatchEvent(new Event('dailyflora:accountchange'));
}

function saveFavorites(favorites: unknown[]) {
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  window.dispatchEvent(new Event('dailyflora:accountchange'));
}

async function syncFavorites(mergeLocalFavorites = false) {
  const remote = await listCloudFavorites();
  const pending = readJson<Array<{ id?: string }>>(favoritesKey, []);
  const remoteIds = new Set(remote.map((favorite) => favorite.id));
  if (mergeLocalFavorites) {
    for (const favorite of pending) {
      if (favorite?.id && !remoteIds.has(favorite.id)) {
        await fetchFavoriteSave(favorite);
      }
    }
  }
  const synced = mergeLocalFavorites && pending.length ? await listCloudFavorites() : remote;
  saveFavorites(synced);
  return synced;
}

async function syncCloudWorkspace() {
  const [generations, tasks] = await Promise.all([listCloudGenerations(), listCloudProcessingTasks()]);
  window.dispatchEvent(new CustomEvent('dailyflora:cloudworkspace', { detail: { generations, tasks } }));
}

async function fetchFavoriteSave(favorite: { id?: string }) {
  // The API client keeps the action surface in one place; this small dynamic import
  // avoids duplicating the favorite payload type in the auth-only module.
  const { saveCloudFavorite } = await import('./dailyfloraCloud');
  await saveCloudFavorite(favorite as Parameters<typeof saveCloudFavorite>[0]);
}

async function restoreCloudState() {
  if (!dailyfloraCloudEnabled) return;
  try {
    const { restoreAccount } = await import('./dailyfloraCloud');
    const user = await restoreAccount();
    if (!user) {
      localStorage.removeItem(accountKey);
      window.dispatchEvent(new Event('dailyflora:accountchange'));
      return;
    }
    saveAccount(user);
    await syncFavorites();
    await syncCloudWorkspace();
  } catch (error) {
    localStorage.removeItem(accountKey);
    notify(error instanceof Error ? error.message : '登录状态暂时无法恢复。', true);
  }
}

async function submitAuth(event: SubmitEvent) {
  event.preventDefault();
  if (!form || !form.checkValidity()) {
    form?.reportValidity();
    return;
  }
  const data = new FormData(form);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  const name = String(data.get('name') || '').trim();
  const hadLocalAccount = accountExists();
  const localFavoriteCount = readJson<unknown[]>(favoritesKey, []).length;
  if (authMode === 'signup' && data.get('termsAccepted') !== 'on') {
    form.reportValidity();
    return;
  }
  if (!dailyfloraCloudEnabled) {
    if (authMode === 'login') {
      notify('当前是离线演示模式，无法验证云端密码。', true);
      return;
    }
    saveAccount({ name, email, termsAccepted: true, termsVersion: '0.71.1' });
    notify('本机演示花园已建立。');
    return;
  }
  const button = document.querySelector<HTMLButtonElement>('#member-auth-submit');
  if (button) button.disabled = true;
  notify('');
  try {
    const user = authMode === 'login'
      ? await loginAccount({ email, password })
      : await registerAccount({ name, email, password, termsVersion: '0.71.1' });
    saveAccount(user);
    const mergeLocalFavorites = !hadLocalAccount && localFavoriteCount > 0
      ? window.confirm(`发现本机有 ${localFavoriteCount} 条未同步收藏，是否合并到 ${user.email}？`)
      : false;
    await syncFavorites(mergeLocalFavorites);
    await syncCloudWorkspace();
    form.reset();
    resetUrlState();
    notify(authMode === 'login' ? '登录成功，花园已打开。' : '账户已建立，花园已同步。');
  } catch (error) {
    notify(error instanceof Error ? error.message : '账户请求失败，请稍后重试。', true);
  } finally {
    if (button) button.disabled = false;
  }
}

async function submitResetRequest(event: SubmitEvent) {
  event.preventDefault();
  if (!resetRequestForm || !resetRequestForm.checkValidity()) {
    resetRequestForm?.reportValidity();
    return;
  }
  if (!dailyfloraCloudEnabled) {
    notify('当前是离线演示模式，无法发送重置邮件。', true);
    return;
  }
  const email = String(new FormData(resetRequestForm).get('email') || '').trim();
  try {
    await requestPasswordReset(email);
    notify('如果邮箱已注册，重置链接会发送到该邮箱。请检查收件箱和垃圾邮件。');
  } catch (error) {
    notify(error instanceof Error ? error.message : '重置邮件暂时发送失败。', true);
  }
}

async function submitReset(event: SubmitEvent) {
  event.preventDefault();
  if (!resetForm || !resetForm.checkValidity()) {
    resetForm?.reportValidity();
    return;
  }
  const data = new FormData(resetForm);
  const token = String(data.get('token') || '');
  const password = String(data.get('password') || '');
  const confirmation = String(data.get('passwordConfirm') || '');
  if (password !== confirmation) {
    notify('两次输入的新密码不一致。', true);
    return;
  }
  try {
    const user = await resetPassword({ token, password });
    saveAccount(user);
    await syncFavorites();
    await syncCloudWorkspace();
    resetUrlState();
    notify('密码已更新，花园已登录。');
  } catch (error) {
    notify(error instanceof Error ? error.message : '密码重置失败，请重新申请链接。', true);
  }
}

async function signOut(event: MouseEvent) {
  event.preventDefault();
  try {
    await logoutAccount();
  } catch (error) {
    notify(error instanceof Error ? error.message : '退出请求失败，已清除本机登录状态。', true);
  } finally {
    localStorage.removeItem(accountKey);
    localStorage.removeItem(favoritesKey);
    window.dispatchEvent(new Event('dailyflora:accountchange'));
    window.location.hash = 'login';
  }
}

function syncHash() {
  if (accountExists()) {
    const actions = document.querySelector<HTMLElement>('#member-actions');
    if (actions) actions.hidden = false;
    if (form) form.hidden = true;
    if (forgotRow) forgotRow.hidden = true;
    return;
  }
  if (window.location.hash.startsWith('#reset')) {
    setResetMode();
    return;
  }
  setAuthMode(hashMode());
}

form?.addEventListener('submit', submitAuth);
resetRequestForm?.addEventListener('submit', submitResetRequest);
resetForm?.addEventListener('submit', submitReset);
logout?.addEventListener('click', signOut);
switchLink?.addEventListener('click', () => window.setTimeout(syncHash, 0));
document.querySelector<HTMLAnchorElement>('#member-forgot-link')?.addEventListener('click', () => window.setTimeout(syncHash, 0));
window.addEventListener('hashchange', syncHash);
window.addEventListener('dailyflora:localechange', syncHash);
window.addEventListener('dailyflora:accountchange', syncHash);

window.__DAILYFLORA_MEMBER_WORKSPACE__ = {
  enabled: dailyfloraCloudEnabled,
  createReferenceTask: async (input) => {
    const result = await createCloudReferenceTask(input);
    await syncCloudWorkspace();
    if (!result.task) throw new Error('任务创建响应缺少任务记录。');
    return result.task;
  },
  saveGeneration: async (generation) => {
    const saved = await saveCloudGeneration(generation);
    await syncCloudWorkspace();
    return saved;
  },
  refresh: async () => {
    if (!dailyfloraCloudEnabled) return;
    const [generations, tasks] = await Promise.all([listCloudGenerations(), listCloudProcessingTasks()]);
    window.dispatchEvent(new CustomEvent('dailyflora:cloudworkspace', { detail: { generations, tasks } }));
  }
};

syncHash();
void restoreCloudState();
