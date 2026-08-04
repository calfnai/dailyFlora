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
import { legalPageTranslations, privacyJapanRights, type LegalPageName } from './i18n/legalPages';

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
  tutorial: 'how-to-use',
  terms: 'legal/terms',
  privacy: 'legal/privacy',
  credits: 'legal/credits',
  copyright: 'legal/copyright'
};

function makeRelativePrefix() {
  const depth = Math.max(0, window.location.pathname.split('/').filter(Boolean).length - 1);
  return depth === 0 ? './' : '../'.repeat(depth);
}

function makeRootRelativePrefix() {
  return '../'.repeat(window.location.pathname.split('/').filter(Boolean).length);
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
  applyLegalPageLocale(locale);

  window.dispatchEvent(new CustomEvent('dailyflora:localechange', { detail: { locale } }));
}

function applyLegalPageLocale(locale: Locale) {
  if (!['terms', 'privacy', 'copyright', 'credits'].includes(page)) return;
  const documentRoot = document.querySelector<HTMLElement>('.legal-document');
  if (!documentRoot) return;
  documentRoot.querySelectorAll<HTMLElement>('.legal-language[data-generated-legal-language]').forEach((node) => node.remove());
  const articles = Array.from(documentRoot.querySelectorAll<HTMLElement>('.legal-language'));
  const nativeArticle = articles.find((node) => node.lang === locale);
  if (nativeArticle) {
    articles.forEach((node) => { node.hidden = node !== nativeArticle; });
    return;
  }
  const translated = legalPageTranslations[locale]?.[page as LegalPageName];
  if (!translated) {
    const fallback = articles.find((node) => node.lang === 'en') || articles[0];
    articles.forEach((node) => { node.hidden = node !== fallback; });
    return;
  }
  articles.forEach((node) => { node.hidden = true; });
  const article = document.createElement('article');
  article.className = 'legal-language';
  article.lang = locale;
  article.dataset.generatedLegalLanguage = 'true';
  article.innerHTML = translated;
  if (page === 'privacy') {
    const japan = privacyJapanRights[locale];
    const rightsSection = Array.from(article.querySelectorAll<HTMLElement>('.legal-section')).find((section) => section.querySelector('h3')?.textContent?.startsWith('5.'));
    if (japan && rightsSection) {
      const heading = document.createElement('h4');
      heading.textContent = japan.title;
      const body = document.createElement('p');
      body.textContent = japan.body;
      rightsSection.append(heading, body);
    }
  }
  documentRoot.append(article);
}

function syncReleaseInfo() {
  fetch(`${makeRelativePrefix()}version.json`)
    .then((response) => response.ok ? response.json() : null)
    .then((info) => {
      if (!info) return;
      document.querySelectorAll<HTMLElement>('[data-release-code]').forEach((node) => { node.textContent = info.releaseId || ''; });
      document.querySelectorAll<HTMLElement>('[data-product-version]').forEach((node) => { node.textContent = info.productVersion || info.version || ''; });
    })
    .catch(() => {});
}

function markDevLinksHidden() {
  document.querySelectorAll<HTMLAnchorElement>('a[href*="dev-index"], a[href*="development"], a[href*="member-test"]').forEach((link) => {
    link.hidden = true;
    link.setAttribute('aria-hidden', 'true');
  });
}

function ensureTutorialFooterLink() {
  const footer = document.querySelector<HTMLElement>('.site-footer .footer-main');
  if (!footer || footer.querySelector('.footer-tutorial-link, a[data-i18n="tutorial.title"]')) return;
  const link = document.createElement('a');
  link.className = 'footer-tutorial-link';
  link.href = `${makeRootRelativePrefix()}how-to-use/?tutorial=fullscreen`;
  link.dataset.i18n = 'tutorial.title';
  link.textContent = 'How to use';
  const column = footer.querySelector('.footer-col');
  if (column) column.append(link);
  else footer.append(link);
}

function ensureSciFiNavLink() {
  const prefix = makeRootRelativePrefix();
  document.querySelectorAll<HTMLElement>('.site-nav').forEach((nav) => {
    if (nav.querySelector('a[data-generated-sci-fi], a[data-i18n="common.scifi"]')) return;
    const link = document.createElement('a');
    link.dataset.generatedSciFi = 'true';
    link.href = `${prefix}scifi/`;
    link.dataset.i18n = 'common.scifi';
    link.textContent = 'SciFi Flora';
    nav.append(link);
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
ensureTutorialFooterLink();
ensureSciFiNavLink();
applyLocale(currentLocale);
syncReleaseInfo();
