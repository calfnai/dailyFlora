import { readAccountMirror, restoreAccount, type CloudAccount } from './dailyfloraCloud';

type AccountUiState =
  | { status: 'loading'; user: null }
  | { status: 'guest'; user: null }
  | { status: 'signed-in'; user: CloudAccount }
  | { status: 'error'; user: CloudAccount | null };

let state: AccountUiState = { status: 'loading', user: null };
let restorePromise: Promise<CloudAccount | null> | null = null;

function initials(name: string) {
  return Array.from(name.trim()).slice(0, 2).join('') || '花';
}

function isAuthLink(anchor: HTMLAnchorElement) {
  try {
    const path = new URL(anchor.href, window.location.href).pathname.replace(/\/+$/, '');
    return path.endsWith('/login') || path.endsWith('/signup');
  } catch {
    return false;
  }
}

function render(next: AccountUiState) {
  state = next;
  document.documentElement.dataset.accountState = next.status;
  const signedIn = next.status === 'signed-in';
  document.querySelectorAll<HTMLAnchorElement>('a').forEach((anchor) => {
    if (!isAuthLink(anchor)) return;
    anchor.hidden = signedIn;
    anchor.setAttribute('aria-hidden', String(signedIn));
  });

  document.querySelectorAll<HTMLElement>('.site-nav, #site-menu-panel').forEach((container) => {
    const existingMemberHref = Array.from(container.querySelectorAll<HTMLAnchorElement>('a')).find((anchor) => {
      try { return new URL(anchor.href, window.location.href).pathname.replace(/\/+$/, '').endsWith('/member'); } catch { return false; }
    })?.href;
    let profile = container.querySelector<HTMLAnchorElement>('[data-account-profile-link]');
    if (!signedIn) {
      profile?.remove();
      return;
    }
    if (!profile) {
      profile = document.createElement('a');
      profile.dataset.accountProfileLink = '';
      profile.className = 'account-nav-profile';
      profile.href = existingMemberHref || (container.id === 'site-menu-panel' ? './member/' : '../member/');
      container.append(profile);
    }
    profile.innerHTML = `<span class="account-nav-avatar" aria-hidden="true">${initials(next.user.name)}</span><span>${next.user.name}</span>`;
    profile.title = next.user.email;
  });
}

export function currentAccountUiState() {
  return state;
}

export async function syncAccountHeader() {
  const mirror = readAccountMirror();
  render(mirror ? { status: 'signed-in', user: mirror } : { status: 'loading', user: null });
  restorePromise ||= restoreAccount();
  try {
    const user = await restorePromise;
    render(user ? { status: 'signed-in', user } : { status: 'guest', user: null });
    return user;
  } catch {
    render({ status: 'error', user: mirror });
    return mirror;
  }
}

window.addEventListener('dailyflora:account-state', (event) => {
  const detail = (event as CustomEvent<{ user: CloudAccount | null }>).detail;
  render(detail?.user ? { status: 'signed-in', user: detail.user } : { status: 'guest', user: null });
});

void syncAccountHeader();
