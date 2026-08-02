import {
  dailyfloraCloudEnabled,
  listCloudFavorites,
  logoutAccount,
  registerAccount
} from './dailyfloraCloud';

const accountKey = 'dailyflora.account.v2';
const favoritesKey = 'dailyflora.favorites.v1';

if (dailyfloraCloudEnabled) {
  const form = document.querySelector<HTMLFormElement>('#member-signup-form');
  const logout = document.querySelector<HTMLButtonElement>('#member-logout');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const data = new FormData(form);
    if (data.get('termsAccepted') !== 'on' || String(data.get('password') || '').length < 8) {
      form.reportValidity();
      return;
    }
    try {
      const user = await registerAccount({
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        password: String(data.get('password') || ''),
        termsVersion: '0.71'
      });
      localStorage.setItem(accountKey, JSON.stringify({ ...user, termsAccepted: true, termsVersion: '0.71' }));
      localStorage.setItem(favoritesKey, JSON.stringify(await listCloudFavorites()));
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '云端注册失败，请稍后重试。');
    }
  }, true);

  logout?.addEventListener('click', async (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    await logoutAccount();
    localStorage.removeItem(accountKey);
    localStorage.removeItem(favoritesKey);
    window.location.reload();
  }, true);
}
