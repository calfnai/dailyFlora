import {
  dailyfloraCloudEnabled,
  listCloudFavorites,
  loginAccount,
  registerAccount,
  requestPasswordReset,
  resetPassword,
  restoreAccount,
  saveCloudFavorite,
  type CloudAccount,
  type CloudFavorite
} from './dailyfloraCloud';

const accountKey = 'dailyflora.beta072.account.v1';
const favoritesKey = 'dailyflora.beta072.favorites.v1';
const mode = document.body.dataset.authMode === 'login' ? 'login' : 'signup';

const authForm = document.querySelector<HTMLFormElement>('#auth-form');
const forgotForm = document.querySelector<HTMLFormElement>('#forgot-form');
const resetForm = document.querySelector<HTMLFormElement>('#reset-form');
const status = document.querySelector<HTMLElement>('#auth-status');
const resetTokenInput = document.querySelector<HTMLInputElement>('#reset-token');

function readJson<T>(key: string, fallback: T): T {
  try {
    return (JSON.parse(localStorage.getItem(key) || 'null') ?? fallback) as T;
  } catch {
    return fallback;
  }
}

function saveAccount(user: CloudAccount) {
  localStorage.setItem(accountKey, JSON.stringify(user));
  window.dispatchEvent(new Event('dailyflora:accountchange'));
}

function saveFavorites(favorites: CloudFavorite[]) {
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
}

function showStatus(message: string, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
  status.dataset.error = String(isError);
}

function destination() {
  const requested = new URLSearchParams(window.location.search).get('next');
  if (!requested || requested.includes(':') || requested.startsWith('//')) return '../member/';
  return requested;
}

function resetToken() {
  const raw = window.location.hash.replace(/^#reset\??/, '');
  return new URLSearchParams(raw).get('token') || '';
}

function syncLoginView() {
  if (mode !== 'login') return;
  const token = resetToken();
  const forgot = window.location.hash === '#forgot';
  if (authForm) authForm.hidden = forgot || Boolean(token);
  if (forgotForm) forgotForm.hidden = !forgot;
  if (resetForm) resetForm.hidden = !token;
  if (resetTokenInput) resetTokenInput.value = token;
  showStatus(token ? '请设置一个新的 8 位以上密码。' : forgot ? '输入注册邮箱，我们会发送一次性重置链接。' : '');
}

async function mergeGuestFavorites(user: CloudAccount) {
  const localAccount = readJson<{ email?: string } | null>(accountKey, null);
  const localFavorites = readJson<CloudFavorite[]>(favoritesKey, []);
  let remote = await listCloudFavorites();
  const shouldOfferMerge = !localAccount?.email && localFavorites.length > 0;
  if (shouldOfferMerge && window.confirm(`发现本机有 ${localFavorites.length} 条未同步收藏，是否合并到 ${user.email}？`)) {
    const remoteIds = new Set(remote.map((favorite) => favorite.id));
    for (const favorite of localFavorites) {
      if (favorite.id && !remoteIds.has(favorite.id)) await saveCloudFavorite(favorite);
    }
    remote = await listCloudFavorites();
  }
  saveFavorites(remote);
}

authForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!authForm.checkValidity()) {
    authForm.reportValidity();
    return;
  }
  if (!dailyfloraCloudEnabled) {
    showStatus('云端账户尚未配置，当前页面不能注册或登录。', true);
    return;
  }
  const data = new FormData(authForm);
  const email = String(data.get('email') || '').trim();
  const password = String(data.get('password') || '');
  const submit = authForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) submit.disabled = true;
  showStatus('');
  try {
    const user = mode === 'login'
      ? await loginAccount({ email, password })
      : await registerAccount({
          name: String(data.get('name') || '').trim(),
          email,
          password,
          termsVersion: '0.72-beta.4'
        });
    await mergeGuestFavorites(user);
    saveAccount(user);
    window.location.href = destination();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '账户请求失败，请稍后重试。', true);
  } finally {
    if (submit) submit.disabled = false;
  }
});

forgotForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!forgotForm.checkValidity()) {
    forgotForm.reportValidity();
    return;
  }
  const submit = forgotForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    const email = String(new FormData(forgotForm).get('email') || '').trim();
    await requestPasswordReset(email);
    showStatus('如果邮箱已注册，重置链接会发送到该邮箱。请检查收件箱和垃圾邮件。');
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '重置邮件暂时发送失败。', true);
  } finally {
    if (submit) submit.disabled = false;
  }
});

resetForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!resetForm.checkValidity()) {
    resetForm.reportValidity();
    return;
  }
  const data = new FormData(resetForm);
  const password = String(data.get('password') || '');
  if (password !== String(data.get('passwordConfirm') || '')) {
    showStatus('两次输入的新密码不一致。', true);
    return;
  }
  const submit = resetForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) submit.disabled = true;
  try {
    const user = await resetPassword({ token: String(data.get('token') || ''), password });
    saveAccount(user);
    saveFavorites(await listCloudFavorites());
    window.location.href = destination();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '密码重置失败，请重新申请链接。', true);
  } finally {
    if (submit) submit.disabled = false;
  }
});

window.addEventListener('hashchange', syncLoginView);
syncLoginView();

if (dailyfloraCloudEnabled) {
  void restoreAccount().then((user) => {
    if (user) {
      saveAccount(user);
      window.location.href = destination();
    }
  }).catch(() => {});
}
