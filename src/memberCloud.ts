import {
  createCloudReferenceTask,
  dailyfloraCloudEnabled,
  listCloudFavorites,
  listCloudGenerations,
  listCloudProcessingTasks,
  logoutAccount,
  restoreAccount,
  saveCloudGeneration,
  type CloudAccount,
  type CloudGeneration,
  type CloudTask
} from './dailyfloraCloud';

const accountKey = 'dailyflora.account.v2';
const favoritesKey = 'dailyflora.favorites.v1';
const errorBox = document.querySelector<HTMLElement>('#member-auth-error');
const logout = document.querySelector<HTMLButtonElement>('#member-logout');

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

function notify(message: string, isError = false) {
  if (errorBox) {
    errorBox.textContent = message;
    errorBox.hidden = !message;
    errorBox.dataset.error = String(isError);
  }
  if (!message || isError) return;
  const toast = document.querySelector<HTMLElement>('#local-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
}

function saveAccount(user: CloudAccount | null) {
  if (user) localStorage.setItem(accountKey, JSON.stringify(user));
  else localStorage.removeItem(accountKey);
  window.dispatchEvent(new Event('dailyflora:accountchange'));
}

function saveFavorites(favorites: unknown[]) {
  localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  window.dispatchEvent(new Event('dailyflora:accountchange'));
}

async function syncCloudWorkspace() {
  const [generations, tasks] = await Promise.all([listCloudGenerations(), listCloudProcessingTasks()]);
  window.dispatchEvent(new CustomEvent('dailyflora:cloudworkspace', { detail: { generations, tasks } }));
}

async function restoreCloudState() {
  if (!dailyfloraCloudEnabled) {
    saveAccount(null);
    notify('云端账户尚未配置，请从登录页面返回后再试。', true);
    return;
  }
  try {
    const user = await restoreAccount();
    if (!user) {
      saveAccount(null);
      return;
    }
    saveAccount(user);
    saveFavorites(await listCloudFavorites());
    await syncCloudWorkspace();
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录状态暂时无法恢复。';
    if (/需要登录|登录已过期/.test(message)) saveAccount(null);
    else notify(message, true);
  }
}

logout?.addEventListener('click', async () => {
  try {
    await logoutAccount();
  } catch (error) {
    notify(error instanceof Error ? error.message : '退出请求失败，已清除本机登录状态。', true);
  } finally {
    saveAccount(null);
    localStorage.removeItem(favoritesKey);
    window.location.href = '../login/';
  }
});

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
    if (dailyfloraCloudEnabled) await syncCloudWorkspace();
  }
};

void restoreCloudState();
