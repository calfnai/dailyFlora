import {
  configureDocument,
  detectInitialLocale,
  formatTranslation,
  getTranslation,
  localeButtons,
  locales,
  normalizeLocale,
  saveLocale,
  setupLocaleSwitcher,
  type Locale
} from './i18n/index';

declare global {
  interface Window {
    dailyfloraT?: (key: string, values?: Record<string, string | number>) => string;
  }
}

const page = document.body.dataset.page || 'home';
let currentLocale = detectInitialLocale();

const pagePath: Record<string, string> = {
  home: '',
  about: 'about',
  member: 'member',
  objects: 'bouquet-shop',
  platforms: 'downloads',
  terms: 'legal/terms',
  privacy: 'legal/privacy',
  credits: 'legal/credits',
  copyright: 'legal/copyright'
};

function makeRelativePrefix() {
  const depth = Math.max(0, window.location.pathname.split('/').filter(Boolean).length - 1);
  return depth === 0 ? './' : '../'.repeat(depth);
}

function ensureLanguageSwitcher() {
  const header = document.querySelector<HTMLElement>('.site-header');
  if (!header || header.querySelector('.language-switcher')) return;
  const switcher = document.createElement('nav');
  switcher.className = 'language-switcher marketing-language-switcher';
  switcher.setAttribute('aria-label', 'Language');
  switcher.innerHTML = locales
    .map((locale) => `<button type="button" data-language="${locale}">${localeButtons[locale].label}</button>`)
    .join('');
  header.append(switcher);
}

function interpolate(element: Element) {
  const values: Record<string, string> = {};
  for (const attribute of Array.from(element.attributes)) {
    if (attribute.name.startsWith('data-i18n-value-')) {
      values[attribute.name.replace('data-i18n-value-', '')] = attribute.value;
    }
  }
  return values;
}

function applyLocale(locale: Locale) {
  currentLocale = locale;
  saveLocale(locale);
  window.dailyfloraT = (key, values) => formatTranslation(currentLocale, key, values);
  configureDocument(locale, page, pagePath[page] ?? page);

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
    element.textContent = formatTranslation(locale, element.dataset.i18n || '', interpolate(element));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((element) => {
    element.innerHTML = formatTranslation(locale, element.dataset.i18nHtml || '', interpolate(element));
  });
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((element) => {
    element.setAttribute('aria-label', getTranslation(locale, element.dataset.i18nAria || ''));
  });
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = getTranslation(locale, element.dataset.i18nPlaceholder || '');
  });
  document.querySelectorAll<HTMLOptionElement>('[data-i18n-option]').forEach((element) => {
    element.textContent = getTranslation(locale, element.dataset.i18nOption || '');
  });
  setupLocaleSwitcher(document.querySelector<HTMLElement>('.language-switcher'), locale, applyLocale);

  window.dispatchEvent(new CustomEvent('dailyflora:localechange', { detail: { locale } }));
}

function markDevLinksHidden() {
  document.querySelectorAll<HTMLAnchorElement>('a[href*="dev-index"], a[href*="development"], a[href*="member-test"]').forEach((link) => {
    link.hidden = true;
    link.setAttribute('aria-hidden', 'true');
  });
}

const prefix = makeRelativePrefix();
document.querySelectorAll<HTMLAnchorElement>('[data-link-root]').forEach((link) => {
  const target = link.dataset.linkRoot || '';
  link.href = `${prefix}${target}`;
});

const pathLocale = normalizeLocale(window.location.pathname.split('/').filter(Boolean)[0]);
if (pathLocale) currentLocale = pathLocale;

ensureLanguageSwitcher();
markDevLinksHidden();
applyLocale(currentLocale);
