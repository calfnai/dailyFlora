import './styles.css';
import { buildInfo } from './buildInfo';
import type { DensityName, RenderQualityName } from './types';
import { todayKey } from './random';
import { bouquetDisplayName, createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';
import { createSpecialSpec, readSpecialId, specialPathname, specialReferences, withBasePath } from './special';
import { themes } from './themes';
import { IdleClockController, normalizeClockInterval, type ClockDisplaySource, type IdleClockSettings } from './idleClock';
import { warmupDailyFloraHandModel, type DailyFloraHandActions } from './dailyFloraHandControl';
import {
  dailyfloraCloudEnabled,
  listCloudFavorites,
  loginAccount,
  logoutAccount,
  registerAccount,
  removeCloudFavorite,
  restoreAccount,
  saveCloudFavorite,
  type CloudFavorite
} from './dailyfloraCloud';
import './accountHeader';
import {
  configureDocument,
  detectInitialLocale,
  formatTranslation,
  getTranslation,
  localeStorageKey,
  normalizeLocale,
  saveLocale,
  setupLocaleSwitcher,
  type Locale
} from './i18n/index';

type RotationDirection = 1 | -1;
type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';
type AccountState = {
  name: string;
  email: string;
  termsAccepted?: boolean;
  termsVersion?: string;
  termsAcceptedAt?: string;
};
type FavoriteBouquet = {
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
type ReferenceState = {
  dataUrl: string;
  fileName: string;
  size: number;
  averageColor: string;
  themeId: string;
  themeName: string;
};

const minRotationSpeed = 0.012;
const maxRotationSpeed = 0.13;
const densityLabels: Record<DensityName, string> = {
  low: '疏',
  medium: '中',
  high: '密'
};
const renderLabels: Record<Exclude<RenderQualityName, 'auto'>, string> = {
  low: '省',
  medium: '清',
  high: '精'
};
const accountStorageKey = 'dailyflora.beta072.account.v1';
const favoritesStorageKey = 'dailyflora.beta072.favorites.v1';
const themeEnglishNames: Record<string, string> = {
  'tropical-forest': 'Tropical Forest',
  'moon-white': 'Moon White Hand-Tied',
  'fairy-violet': 'Fairy Violet Mist',
  'sea-salt-lemon': 'Sea Salt Lemon',
  'hillside-wild': 'Hillside Wildflowers',
  'summer-pinwheel': 'Summer Pinwheel',
  'dopamine-field': 'Dopamine Field',
  'starry-night': 'Starry Night',
  'dewberry-morning': 'Dewberry Morning',
  'lychee-garden-rainbow': 'Lychee Garden Rainbow',
  'her-january-sky': 'Her January Sky',
  'her-january-sky-v2': 'Her January Sky v2',
  'her-january-sky-v3': 'Her January Sky v3',
  'her-real-bouquet-v4': 'Her Real Bouquet v4'
};
const rotationPresets: Array<{
  speed: number;
  direction: RotationDirection;
  pitch: number;
  mode: CameraRouteMode;
  pitchAmplitude: number;
  yawAmplitude: number;
  distanceAmplitude: number;
  targetYAmplitude: number;
}> = [
  {
    speed: 0.036,
    direction: 1,
    pitch: 0.38,
    mode: 'orbit',
    pitchAmplitude: 0,
    yawAmplitude: 0,
    distanceAmplitude: 0,
    targetYAmplitude: 0
  },
  {
    speed: 0.052,
    direction: 1,
    pitch: 0.78,
    mode: 'high-arc',
    pitchAmplitude: 0.28,
    yawAmplitude: 0.16,
    distanceAmplitude: 0.16,
    targetYAmplitude: 0.08
  },
  {
    speed: 0.044,
    direction: -1,
    pitch: 0.24,
    mode: 'low-arc',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.2,
    distanceAmplitude: 0.24,
    targetYAmplitude: 0.06
  },
  {
    speed: 0.064,
    direction: 1,
    pitch: 0.52,
    mode: 'near-far',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.24,
    distanceAmplitude: 0.52,
    targetYAmplitude: 0.12
  },
  {
    speed: 0.046,
    direction: -1,
    pitch: 0.62,
    mode: 'figure-eight',
    pitchAmplitude: 0.26,
    yawAmplitude: 0.48,
    distanceAmplitude: 0.32,
    targetYAmplitude: 0.1
  }
];

const canvas = document.querySelector<HTMLCanvasElement>('#flora-canvas');
const hud = document.querySelector<HTMLElement>('#hud');
const dailyMark = document.querySelector<HTMLElement>('.daily-mark');
const controls = document.querySelector<HTMLElement>('#controls');
const controlsToggleButton = document.querySelector<HTMLButtonElement>('#controls-toggle');
const controlsPanel = document.querySelector<HTMLElement>('#controls-panel');
const siteMenu = document.querySelector<HTMLElement>('#site-menu');
const siteMenuToggle = document.querySelector<HTMLButtonElement>('#site-menu-toggle');
const siteMenuPanel = document.querySelector<HTMLElement>('#site-menu-panel');
const siteMenuFavoriteLink = document.querySelector<HTMLButtonElement>('#site-menu-favorite-link');
const siteMenuDebugLink = document.querySelector<HTMLAnchorElement>('#site-menu-debug-link');
const handControlToggle = document.querySelector<HTMLButtonElement>('#hand-control-toggle');
const dateLabel = document.querySelector<HTMLElement>('#daily-date');
const themeLabel = document.querySelector<HTMLElement>('#daily-theme');
const themeCnLabel = document.querySelector<HTMLElement>('#daily-theme-cn');
const themeEnLabel = document.querySelector<HTMLElement>('#daily-theme-en');
const flowerPlanLabel = document.querySelector<HTMLElement>('#flower-plan-mark');
const qualityLabel = document.querySelector<HTMLElement>('#quality-mark');
const reviewDashboardLink = document.querySelector<HTMLAnchorElement>('#review-dashboard-link');
const debugPanel = document.querySelector<HTMLElement>('#debug-panel');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const todayButton = document.querySelector<HTMLButtonElement>('#today-button');
const datePicker = document.querySelector<HTMLInputElement>('#date-picker');
const calendarPanel = document.createElement('div');
const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-button');
const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen-button');
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoom-in-button');
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoom-out-button');
const densityButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-density-choice]'));
const renderButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-render-choice]'));
const rotationSpeedInput = document.querySelector<HTMLInputElement>('#rotation-speed');
const rotationDirectionButton = document.querySelector<HTMLButtonElement>('#rotation-direction-button');
const rotationPresetButton = document.querySelector<HTMLButtonElement>('#rotation-preset-button');
const accountDock = document.querySelector<HTMLElement>('#account-dock');
const favoriteButton = document.querySelector<HTMLButtonElement>('#favorite-button');
const accountOpenButton = document.querySelector<HTMLButtonElement>('#account-open-button');
const accountCloseButton = document.querySelector<HTMLButtonElement>('#account-close-button');
const accountPanel = document.querySelector<HTMLElement>('#account-panel');
const accountAvatar = document.querySelector<HTMLElement>('#account-avatar');
const accountOpenTitle = document.querySelector<HTMLElement>('#account-open-title');
const accountOpenStatus = document.querySelector<HTMLElement>('#account-open-status');
const accountPanelTitle = document.querySelector<HTMLElement>('#account-panel-title');
const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const loginNameField = document.querySelector<HTMLElement>('#login-name-field');
const loginNameInput = document.querySelector<HTMLInputElement>('#login-name-input');
const loginEmailInput = document.querySelector<HTMLInputElement>('#login-email-input');
const loginPasswordInput = document.querySelector<HTMLInputElement>('#login-password-input');
const loginConsentField = document.querySelector<HTMLElement>('#login-consent-field');
const loginSubmitLabel = document.querySelector<HTMLElement>('#login-submit-label');
const accountFormSwitchCopy = document.querySelector<HTMLElement>('#account-form-switch-copy');
const accountFormSwitchLink = document.querySelector<HTMLAnchorElement>('#account-form-switch-link');
const accountFormError = document.querySelector<HTMLElement>('#account-form-error');
const accountGuestActions = document.querySelector<HTMLElement>('#account-guest-actions');
const accountProfile = document.querySelector<HTMLElement>('#account-profile');
const profileAvatar = document.querySelector<HTMLElement>('#profile-avatar');
const profileName = document.querySelector<HTMLElement>('#profile-name');
const profileEmail = document.querySelector<HTMLElement>('#profile-email');
const logoutButton = document.querySelector<HTMLButtonElement>('#logout-button');
const collectionCount = document.querySelector<HTMLElement>('#collection-count');
const collectionList = document.querySelector<HTMLElement>('#collection-list');
const referenceFileInput = document.querySelector<HTMLInputElement>('#reference-file-input');
const referencePreview = document.querySelector<HTMLElement>('#reference-preview');
const referencePreviewImage = document.querySelector<HTMLImageElement>('#reference-preview-image');
const referencePreviewTitle = document.querySelector<HTMLElement>('#reference-preview-title');
const referencePreviewMeta = document.querySelector<HTMLElement>('#reference-preview-meta');
const referenceNoteInput = document.querySelector<HTMLTextAreaElement>('#reference-note-input');
const referenceGenerateButton = document.querySelector<HTMLButtonElement>('#reference-generate-button');
const referenceResult = document.querySelector<HTMLElement>('#reference-result');
const clockToggleButton = document.querySelector<HTMLButtonElement>('#clock-toggle');
const clockIntervalInput = document.querySelector<HTMLInputElement>('#clock-interval');
const clockAutoEnabledInput = document.querySelector<HTMLInputElement>('#clock-auto-enabled');
const clockOverlay = document.querySelector<HTMLElement>('#clock-overlay');
const clockTime = document.querySelector<HTMLElement>('#clock-time');
const clockDate = document.querySelector<HTMLElement>('#clock-date');
const clockQuoteText = document.querySelector<HTMLElement>('#clock-quote-text');
const clockQuoteAuthor = document.querySelector<HTMLElement>('#clock-quote-author');
const inlineTutorialDialog = document.querySelector<HTMLDialogElement>('#inline-tutorial-dialog');
const inlineTutorialKicker = document.querySelector<HTMLElement>('#inline-tutorial-kicker');
const inlineTutorialTitle = document.querySelector<HTMLElement>('#inline-tutorial-title');
const inlineTutorialBody = document.querySelector<HTMLElement>('#inline-tutorial-body');
const inlineTutorialClose = document.querySelector<HTMLButtonElement>('#inline-tutorial-close');
const fullscreenShortcutContent = document.querySelector<HTMLElement>('#fullscreen-shortcut-content');
const gestureGuideContent = document.querySelector<HTMLElement>('#gesture-guide-content');
const fullscreenHelpMore = document.querySelector<HTMLAnchorElement>('#fullscreen-help-more');
const fullscreenHelpClose = document.querySelector<HTMLButtonElement>('#fullscreen-help-close');
const releaseMark = document.querySelector<HTMLAnchorElement>('#release-mark');
const clockExitHint = document.querySelector<HTMLElement>('#clock-exit-hint');
const languageSwitcher = document.querySelector<HTMLElement>('#language-switcher');
let interfaceLanguage: Locale = detectInitialLocale();
const legacyInterfaceLanguageKey = 'dailyflora.interface-language.v1';
try {
  const legacy = normalizeLocale(window.localStorage.getItem(legacyInterfaceLanguageKey));
  if (legacy && !window.localStorage.getItem(localeStorageKey)) {
    interfaceLanguage = legacy;
    saveLocale(legacy);
  }
} catch {
  // The selector remains usable even when storage is unavailable.
}

const t = (key: string, values?: Record<string, string | number>) =>
  values ? formatTranslation(interfaceLanguage, key, values) : getTranslation(interfaceLanguage, key);

if (
  !canvas ||
  !hud ||
  !controls ||
  !controlsToggleButton ||
  !controlsPanel ||
  !dateLabel ||
  !themeLabel ||
  !themeCnLabel ||
  !themeEnLabel ||
  !flowerPlanLabel ||
  !qualityLabel
) {
  throw new Error('DailyFlora could not find the required page elements.');
}

const ui = {
  canvas,
  hud,
  controls,
  controlsToggleButton,
  controlsPanel,
  dateLabel,
  themeLabel,
  themeCnLabel,
  themeEnLabel,
  flowerPlanLabel,
  qualityLabel
};

function syncInterfaceButtonAlignment() {
  if (document.body.classList.contains('is-special') || window.innerWidth <= 680 || !dailyMark) {
    ui.controls.style.removeProperty('top');
    ui.controls.style.removeProperty('bottom');
    return;
  }
  ui.controls.style.top = `${dailyMark.getBoundingClientRect().top}px`;
  ui.controls.style.bottom = 'auto';
}

window.requestAnimationFrame(syncInterfaceButtonAlignment);

if (releaseMark) {
  releaseMark.textContent = buildInfo.releaseId;
  releaseMark.href = withBasePath('version.json');
  releaseMark.title = [
    `Release: ${buildInfo.releaseId}`,
    `Commit: ${buildInfo.commitSha}`,
    `Branch: ${buildInfo.branch}`,
    `Built: ${buildInfo.builtAt}`,
    buildInfo.deploymentId ? `Vercel: ${buildInfo.deploymentId}` : ''
  ].filter(Boolean).join('\n');
}

const specialId = readSpecialId();
const specialReference = specialId ? specialReferences[specialId] : null;
document.body.classList.toggle('is-special', Boolean(specialReference));
const searchParams = new URLSearchParams(window.location.search);
const tutorialValue = searchParams.get('tutorial');
let params = readParams();
const debugValue = searchParams.get('debug');
const debugMode = searchParams.has('debug') && debugValue !== '0' && debugValue !== 'false';
const previewValue = searchParams.get('preview');
const previewMode = searchParams.has('preview') && previewValue !== '0' && previewValue !== 'false';
const embedMode = searchParams.get('embed') === 'flower';
const handControlValue = searchParams.get('hand-control');
const handControlInitiallyEnabled = searchParams.has('hand-control') && handControlValue !== '0' && handControlValue !== 'false';
const internalPreviewMode = debugMode || previewMode;
const requestedDensity = searchParams.get('density') || searchParams.get('quality');
const requestedRender = searchParams.get('render');
const maxSelectableDate = todayKey();
const requestedSeed = searchParams.get('seed');
const requestedDate = params.date;
const clampedRequestedDate = clampDateKeyToToday(requestedDate);
if (clampedRequestedDate !== requestedDate) {
  params = {
    ...params,
    date: clampedRequestedDate,
    seed: !requestedSeed || params.seed === requestedDate ? clampedRequestedDate : params.seed
  };
}
if (datePicker) datePicker.max = maxSelectableDate;
let selectedDensity = requestedDensity
  ? normalizeDensity(requestedDensity)
  : internalPreviewMode
    ? 'high'
    : specialReference
      ? 'medium'
      : normalizeDensity(params.density);
document.body.classList.toggle('is-preview', previewMode);
document.body.classList.toggle('is-flower-embed', embedMode);
siteMenuDebugLink && (siteMenuDebugLink.hidden = !debugMode);
let selectedRender = requestedRender
  ? normalizeRender(requestedRender)
  : internalPreviewMode || specialReference
    ? 'high'
    : normalizeRender(params.render);
let selectedTheme = specialReference ? specialReference.theme.id : params.theme;
let quality = resolveQuality(selectedDensity, selectedRender);
let spec = specialReference
  ? createSpecialSpec(specialReference, searchParams.get('date') ? clampedRequestedDate : undefined)
  : createDailySpec(params.date, params.seed, selectedTheme);
let followsToday = !specialReference && !searchParams.has('date') && !searchParams.has('seed');
let scene = new BouquetScene(ui.canvas, spec, quality);
(window as Window & {
  __dailyFloraAudit?: () => ReturnType<BouquetScene['getDebugStats']>;
}).__dailyFloraAudit = () => scene.getDebugStats();
const requestedCamera = searchParams.get('camera');
if (requestedCamera === 'front' || requestedCamera === 'side' || requestedCamera === 'top') {
  scene.setStaticCameraView(requestedCamera);
}
let hideTimer = 0;
let previewCount = 0;
let rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
let rotationDirection: RotationDirection = 1;
let cameraRouteMode: CameraRouteMode = 'orbit';
let pitchAmplitude = 0;
let yawAmplitude = 0;
let distanceAmplitude = 0;
let targetYAmplitude = 0;
let manualRotation = false;
let manualZoom = 0;
let specialAudio: HTMLAudioElement | null = null;
let specialAudioMuted = false;
let debugTimer = 0;
let dateRolloverTimer = 0;
let calendarView = parseDateKey(spec.dateLabel);
let accountState = readAccountState();
let favoriteBouquets = readFavoriteBouquets();
let mainAuthMode: 'signup' | 'login' = 'signup';

function cloudFavoriteToLocal(favorite: CloudFavorite): FavoriteBouquet {
  return favorite;
}

async function restoreCloudState() {
  if (!dailyfloraCloudEnabled) return;
  try {
    const account = await restoreAccount();
    if (!account) return;
    accountState = account;
    const favorites = await listCloudFavorites();
    favoriteBouquets = favorites.map(cloudFavoriteToLocal).slice(0, 24);
    renderAccountState();
  } catch (error) {
    console.warn('[DailyFlora] cloud session restore failed', error);
    if (error instanceof Error && /需要登录|登录已过期/.test(error.message)) saveAccountState(null);
  }
}
let referenceState: ReferenceState | null = null;
let clockTickTimer = 0;
let clockExitHintTimer = 0;
let clockDisplaySource: ClockDisplaySource | null = null;
const clockSettingsStorageKey = 'dailyflora.idle-clock.v1';
const clockQuotes = [
  ['Nothing can bring you peace but yourself.', 'Ralph Waldo Emerson'],
  ['Nature does not hurry, yet everything is accomplished.', 'Lao Tzu'],
  ['Each day provides its own gifts.', 'Marcus Aurelius'],
  ['The quieter you become, the more you can hear.', 'Ram Dass'],
  ['Adopt the pace of nature: her secret is patience.', 'Ralph Waldo Emerson'],
  ['There is a calmness to a life lived in gratitude.', 'Ralph Blum']
] as const;

function readClockSettings(): IdleClockSettings {
  const stored = safeJsonParse<Partial<IdleClockSettings>>(window.localStorage.getItem(clockSettingsStorageKey), {});
  return {
    autoEnabled: stored.autoEnabled ?? true,
    intervalMinutes: normalizeClockInterval(stored.intervalMinutes ?? 2)
  };
}

let clockSettings = readClockSettings();
const idleClock = new IdleClockController(clockSettings, {
  onShow: (source) => showClock(source),
  onHide: hideClock
});

calendarPanel.className = 'date-calendar';
calendarPanel.id = 'date-calendar';
calendarPanel.hidden = true;
calendarPanel.setAttribute('role', 'dialog');
calendarPanel.setAttribute('aria-label', 'Pick bouquet date');
document.body.append(calendarPanel);
todayButton?.setAttribute('aria-haspopup', 'dialog');
todayButton?.setAttribute('aria-controls', 'date-calendar');
todayButton?.setAttribute('aria-expanded', 'false');

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDensity(value: string): DensityName {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeRender(value: string): RenderQualityName {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'auto' ? value : 'auto';
}

function speedToSlider(speed: number) {
  return Math.round(((speed - minRotationSpeed) / (maxRotationSpeed - minRotationSpeed)) * 100);
}

function sliderToSpeed(value: string) {
  const ratio = Number(value) / 100;
  return minRotationSpeed + (maxRotationSpeed - minRotationSpeed) * ratio;
}

function bouquetHoverTitle() {
  const name = bouquetDisplayName(spec);
  return `${name.cn} / ${name.en}`;
}

function themeEnglishName() {
  return themeEnglishNames[spec.theme.id] || spec.theme.id;
}

function flowerPlanText() {
  return spec.flowerPlan.items.map((item) => item.cn).join(' / ');
}

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatClockDate(now: Date) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const weekday = new Intl.DateTimeFormat(interfaceLanguage, { weekday: 'short' }).format(now);
  return interfaceLanguage === 'zh-CN' || interfaceLanguage === 'ja'
    ? `${year}年${month}月${day}日 · ${weekday}`
    : new Intl.DateTimeFormat(interfaceLanguage, { year: 'numeric', month: 'short', day: '2-digit', weekday: 'short' }).format(now);
}

function updateClockTime() {
  const now = new Date();
  if (clockTime) {
    clockTime.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }
  if (clockDate) clockDate.textContent = formatClockDate(now);
}

function syncClockControls() {
  const { autoEnabled, intervalMinutes } = clockSettings;
  [clockIntervalInput].forEach((input) => {
    if (input) input.value = String(intervalMinutes);
  });
  [clockAutoEnabledInput].forEach((input) => {
    if (input) input.checked = autoEnabled;
  });
  if (clockToggleButton) {
    const isManual = clockDisplaySource === 'manual';
    clockToggleButton.classList.toggle('is-active', isManual);
    clockToggleButton.setAttribute('aria-pressed', String(isManual));
    clockToggleButton.setAttribute('aria-label', isManual ? t('view.hideClock') : t('view.showClock'));
    clockToggleButton.title = isManual ? t('view.hideClock') : t('view.showClock');
  }
}

function updateClockSettings(next: Partial<IdleClockSettings>) {
  clockSettings = {
    ...clockSettings,
    ...next,
    intervalMinutes: normalizeClockInterval(next.intervalMinutes ?? clockSettings.intervalMinutes)
  };
  window.localStorage.setItem(clockSettingsStorageKey, JSON.stringify(clockSettings));
  idleClock.updateSettings(clockSettings);
  syncClockControls();
}

function showClock(source: ClockDisplaySource) {
  clockDisplaySource = source;
  idleClock.resetPointerReference();
  const quote = clockQuotes[Math.floor(Math.random() * clockQuotes.length)];
  if (clockQuoteText) clockQuoteText.textContent = quote[0];
  if (clockQuoteAuthor) clockQuoteAuthor.textContent = quote[1];
  updateClockTime();
  window.clearInterval(clockTickTimer);
  clockTickTimer = window.setInterval(updateClockTime, 1000);
  document.body.classList.add('is-clock-visible');
  scene.setClockLayout(true);
  if (clockOverlay) {
    clockOverlay.classList.remove('is-auto', 'is-manual', 'is-visible');
    clockOverlay.setAttribute('aria-hidden', 'false');
    if (source === 'auto') clockOverlay.classList.add('is-auto');
    if (source === 'manual') clockOverlay.classList.add('is-manual');
    requestAnimationFrame(() => clockOverlay.classList.add('is-visible'));
  }
  window.clearTimeout(clockExitHintTimer);
  if (clockExitHint) {
    clockExitHint.classList.remove('is-visible');
    requestAnimationFrame(() => {
      clockExitHint.classList.add('is-visible');
      clockExitHintTimer = window.setTimeout(() => clockExitHint.classList.remove('is-visible'), 2000);
    });
  }
  window.setTimeout(() => scene.resize(), 0);
  syncClockControls();
}

function hideClock() {
  clockDisplaySource = null;
  window.clearInterval(clockTickTimer);
  if (clockOverlay) {
    clockOverlay.classList.remove('is-visible', 'is-auto', 'is-manual');
    clockOverlay.setAttribute('aria-hidden', 'true');
  }
  document.body.classList.remove('is-clock-visible');
  window.clearTimeout(clockExitHintTimer);
  clockExitHint?.classList.remove('is-visible');
  scene.setClockLayout(false);
  window.setTimeout(() => scene.resize(), 380);
  syncClockControls();
}

function readAccountState(): AccountState | null {
  const account = safeJsonParse<AccountState | null>(window.localStorage.getItem(accountStorageKey), null);
  if (!account?.email) return null;
  return account;
}

function saveAccountState(nextAccount: AccountState | null) {
  accountState = nextAccount;
  if (nextAccount) {
    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccount));
  } else {
    window.localStorage.removeItem(accountStorageKey);
  }
  renderAccountState();
}

function readFavoriteBouquets(): FavoriteBouquet[] {
  const favorites = safeJsonParse<FavoriteBouquet[]>(window.localStorage.getItem(favoritesStorageKey), []);
  return Array.isArray(favorites) ? favorites : [];
}

function saveFavoriteBouquets(nextFavorites: FavoriteBouquet[]) {
  favoriteBouquets = nextFavorites.slice(0, 24);
  window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteBouquets));
  renderAccountState();
}

function currentFavoriteId() {
  return `${spec.dateLabel}:${spec.seed}:${spec.theme.id}`;
}

function publicFavoriteCode(favorite: Pick<FavoriteBouquet, 'date'>) {
  return `DF-DATE-${favorite.date.split('-').join('')}`;
}

function currentFavorite() {
  return favoriteBouquets.find((favorite) => favorite.id === currentFavoriteId()) || null;
}

function createFavorite(): FavoriteBouquet {
  const name = bouquetDisplayName(spec);
  return {
    id: currentFavoriteId(),
    date: spec.dateLabel,
    seed: spec.seed,
    themeId: spec.theme.id,
    themeName: name.cn,
    themeEnglishName: name.en,
    flowerPlanName: spec.flowerPlan.cnName,
    flowers: flowerPlanText(),
    savedAt: new Date().toISOString()
  };
}

function initials(name: string, fallback: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : fallback;
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
}

function rgbToHsl(red: number, green: number, blue: number) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  if (max === g) hue = (b - r) / delta + 2;
  if (max === b) hue = (r - g) / delta + 4;
  return { hue: (hue * 60 + 360) % 360, saturation, lightness };
}

function themeForAverageColor(red: number, green: number, blue: number) {
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  let themeId = 'sea-salt-lemon';
  if (lightness > 0.76 && saturation < 0.28) themeId = 'moon-white';
  else if (hue >= 245 && hue < 330) themeId = saturation > 0.34 ? 'fairy-violet' : 'starry-night';
  else if (hue >= 330 || hue < 22) themeId = 'dewberry-morning';
  else if (hue >= 22 && hue < 54) themeId = saturation > 0.42 ? 'summer-pinwheel' : 'hillside-wild';
  else if (hue >= 54 && hue < 92) themeId = 'sea-salt-lemon';
  else if (hue >= 92 && hue < 172) themeId = saturation > 0.32 ? 'tropical-forest' : 'hillside-wild';
  else if (hue >= 172 && hue < 215) themeId = 'sea-salt-lemon';
  else if (hue >= 215 && hue < 245) themeId = 'starry-night';
  return themes.find((theme) => theme.id === themeId) || themes[0];
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result || '')));
    reader.addEventListener('error', () => reject(reader.error || new Error('Could not read reference image.')));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', () => reject(new Error('Could not load reference image.')));
    image.src = dataUrl;
  });
}

async function analyzeReferenceImage(file: File): Promise<ReferenceState> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const canvasElement = document.createElement('canvas');
  const size = 48;
  canvasElement.width = size;
  canvasElement.height = size;
  const context = canvasElement.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Could not analyze reference image.');
  context.drawImage(image, 0, 0, size, size);
  const pixels = context.getImageData(0, 0, size, size).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.2) continue;
    red += pixels[index] * alpha;
    green += pixels[index + 1] * alpha;
    blue += pixels[index + 2] * alpha;
    count += alpha;
  }
  const averageRed = Math.round(red / Math.max(1, count));
  const averageGreen = Math.round(green / Math.max(1, count));
  const averageBlue = Math.round(blue / Math.max(1, count));
  const theme = themeForAverageColor(averageRed, averageGreen, averageBlue);
  return {
    dataUrl,
    fileName: file.name,
    size: file.size,
    averageColor: rgbToHex(averageRed, averageGreen, averageBlue),
    themeId: theme.id,
    themeName: theme.name
  };
}

function renderReferenceState() {
  if (!referencePreview || !referencePreviewImage || !referencePreviewMeta || !referenceGenerateButton) return;
  const hasReference = Boolean(referenceState);
  referencePreview.hidden = !hasReference;
  referenceGenerateButton.disabled = !hasReference;
  if (!referenceState) return;
  referencePreviewImage.src = referenceState.dataUrl;
  referencePreviewTitle && (referencePreviewTitle.textContent = referenceState.fileName);
  referencePreviewMeta.textContent = `${formatFileSize(referenceState.size)} · ${referenceState.themeName} · ${referenceState.averageColor}`;
  referencePreview.style.setProperty('--reference-color', referenceState.averageColor);
}

async function handleReferenceFile(file: File) {
  if (!file.type.startsWith('image/')) return;
  if (referenceResult) {
    referenceResult.hidden = false;
    referenceResult.textContent = t('index.referenceReading');
  }
  referenceState = await analyzeReferenceImage(file);
  renderReferenceState();
  if (referenceResult) {
    referenceResult.textContent = t('index.referenceReady', { theme: referenceState.themeName });
  }
}

function generateFromReference() {
  if (!referenceState) return;
  const note = referenceNoteInput?.value.trim() || 'reference';
  const date = todayKey();
  const seed = `reference:${Date.now()}:${referenceState.fileName}:${note}`;
  selectedTheme = referenceState.themeId;
  previewCount = 0;
  closeCalendar();
  rebuild(date, seed);
  syncTodayMode(date, seed);
  if (referenceResult) {
    referenceResult.hidden = false;
    referenceResult.textContent = t('index.referenceDone', { theme: referenceState.themeName });
  }
}

function openAccountPanel() {
  if (!accountPanel || !accountOpenButton) return;
  accountPanel.hidden = false;
  accountOpenButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => accountPanel.classList.add('is-open'), 20);
  if (!accountState) {
    accountGuestActions?.querySelector<HTMLAnchorElement>('a')?.focus();
  }
  revealUi();
}

function closeAccountPanel() {
  if (!accountPanel || !accountOpenButton) return;
  accountPanel.classList.remove('is-open');
  accountOpenButton.setAttribute('aria-expanded', 'false');
  window.setTimeout(() => {
    if (!accountPanel.classList.contains('is-open')) accountPanel.hidden = true;
  }, 220);
}

function toggleSiteMenu(forceOpen?: boolean) {
  if (!siteMenuToggle || !siteMenuPanel) return;
  const open = forceOpen ?? siteMenuPanel.hidden;
  siteMenuPanel.hidden = !open;
  siteMenuToggle.setAttribute('aria-expanded', String(open));
}

function setMainAuthError(message: string, isError = true) {
  if (!accountFormError) return;
  accountFormError.textContent = message;
  accountFormError.hidden = !message;
  accountFormError.dataset.error = String(isError);
}

function setMainAuthMode(nextMode: 'signup' | 'login') {
  mainAuthMode = nextMode;
  const login = nextMode === 'login';
  if (loginNameField) loginNameField.hidden = login;
  if (loginNameInput) loginNameInput.required = !login;
  if (loginConsentField) loginConsentField.hidden = login;
  const consent = loginConsentField?.querySelector<HTMLInputElement>('input[name="termsAccepted"]');
  if (consent) consent.required = !login;
  if (loginPasswordInput) loginPasswordInput.autocomplete = login ? 'current-password' : 'new-password';
  if (loginSubmitLabel) loginSubmitLabel.textContent = login ? '登录并打开花园' : '建立账户并收藏';
  if (accountFormSwitchCopy) accountFormSwitchCopy.textContent = login ? '还没有账户？' : '已有账户？';
  if (accountFormSwitchLink) {
    accountFormSwitchLink.textContent = login ? '立即注册' : '直接登录';
    accountFormSwitchLink.href = login ? '#signup' : '#login';
  }
  setMainAuthError('');
}

async function toggleFavorite() {
  if (!accountState) {
    window.location.href = './signup/?intent=favorite';
    return;
  }

  const favorite = currentFavorite();
  if (favorite) {
    if (dailyfloraCloudEnabled) {
      try {
        await removeCloudFavorite(favorite.id);
      } catch (error) {
        showFavoriteFeedback(error instanceof Error ? error.message : '取消收藏失败，请稍后重试。', true);
        return;
      }
    }
    saveFavoriteBouquets(favoriteBouquets.filter((item) => item.id !== favorite.id));
    return;
  }

  const nextFavorite = createFavorite();
  if (dailyfloraCloudEnabled) {
    try {
      await saveCloudFavorite(nextFavorite);
    } catch (error) {
      showFavoriteFeedback(error instanceof Error ? error.message : '收藏失败，请稍后重试。', true);
      return;
    }
  }
  saveFavoriteBouquets([nextFavorite, ...favoriteBouquets.filter((item) => item.id !== currentFavoriteId())]);
  showFavoriteFeedback('已保存到你的云端收藏。');
}

function showFavoriteFeedback(message: string, isError = false) {
  let status = document.querySelector<HTMLElement>('#favorite-action-status');
  if (!status) {
    status = document.createElement('p');
    status.id = 'favorite-action-status';
    status.className = 'favorite-action-status';
    status.setAttribute('role', 'status');
    document.body.append(status);
  }
  status.textContent = message;
  status.dataset.error = String(isError);
  status.classList.add('is-visible');
  window.setTimeout(() => status?.classList.remove('is-visible'), 3600);
}

function renderFavoriteButton() {
  if (!favoriteButton) return;
  const saved = Boolean(currentFavorite());
  favoriteButton.classList.toggle('is-saved', saved);
  favoriteButton.setAttribute('aria-pressed', String(saved));
  favoriteButton.title = saved ? t('index.savedToday') : t('index.favoriteToday');
  favoriteButton.setAttribute('aria-label', saved ? t('index.savedToday') : t('index.favoriteToday'));
}

function renderCollectionList() {
  if (!collectionList || !collectionCount) return;
  collectionCount.textContent = String(favoriteBouquets.length);
  if (favoriteBouquets.length === 0) {
    collectionList.innerHTML = `
      <div class="empty-collection">
        <strong>${t('index.emptyTitle')}</strong>
        <span>${t('index.emptyBody')}</span>
      </div>
    `;
    return;
  }

  collectionList.innerHTML = favoriteBouquets
    .map(
      (favorite) => `
        <button class="collection-item" type="button" data-favorite-id="${favorite.id}">
          <span class="collection-item-date">${publicFavoriteCode(favorite)} · ${favorite.date}</span>
          <span class="collection-item-title">${favorite.themeName}</span>
          <span class="collection-item-meta">${favorite.flowerPlanName} · ${favorite.themeEnglishName}</span>
        </button>
      `
    )
    .join('');
}

function renderAccountState() {
  const signedIn = Boolean(accountState);
  accountDock?.classList.toggle('is-signed-in', signedIn);
  if (accountOpenTitle) accountOpenTitle.textContent = signedIn ? accountState?.name || '个人花园' : '个人花园';
  if (accountOpenStatus) {
    accountOpenStatus.textContent = signedIn
      ? t('index.gardenStatusSigned', { count: favoriteBouquets.length })
      : t('index.gardenStatusGuest');
  }
  if (accountAvatar) accountAvatar.textContent = signedIn ? initials(accountState?.name || '', '花') : '访';
  if (accountPanelTitle) accountPanelTitle.textContent = signedIn ? t('index.accountPanelTitleSigned') : t('index.accountPanelTitleGuest');
  if (loginForm) loginForm.hidden = signedIn;
  if (accountGuestActions) accountGuestActions.hidden = signedIn;
  if (accountProfile) accountProfile.hidden = !signedIn;
  if (profileAvatar) profileAvatar.textContent = initials(accountState?.name || '', '花');
  if (profileName) profileName.textContent = accountState?.name || 'DailyFlora';
  if (profileEmail) profileEmail.textContent = accountState?.email || '';
  renderFavoriteButton();
  renderCollectionList();
}

function setLabels() {
  const name = bouquetDisplayName(spec);
  ui.dateLabel.textContent = spec.dateLabel;
  ui.themeCnLabel.textContent = name.cn;
  ui.themeEnLabel.textContent = name.en;
  ui.flowerPlanLabel.textContent = `${spec.theme.name} · ${spec.flowerPlan.cnName} · ${flowerPlanText()}`;
  ui.flowerPlanLabel.title = `${spec.flowerPlan.reference}\n${spec.flowerPlan.silhouette}\n避免：${spec.flowerPlan.avoid}`;
  if (datePicker) datePicker.value = spec.dateLabel;
  ui.themeLabel.title = bouquetHoverTitle();
  ui.dateLabel.title = bouquetHoverTitle();
  todayButton?.setAttribute('title', `选择日期 · ${bouquetHoverTitle()}`);
  todayButton?.setAttribute('aria-label', t('view.dateWithName', { name: bouquetHoverTitle() }));
  shuffleButton?.setAttribute('title', `${t('view.random')} · ${bouquetHoverTitle()}`);
  const renderLabel =
    selectedRender === 'auto' ? `自/${renderLabels[quality.renderName]}` : renderLabels[quality.renderName];
  ui.qualityLabel.textContent = `${densityLabels[quality.densityName]} · ${renderLabel}`;
  configureDocument(interfaceLanguage, 'home', '');
  document.title = `DailyFlora - ${interfaceLanguage === 'zh-CN' ? name.cn : name.en}`;
  if (!calendarPanel.hidden) {
    renderCalendar();
    positionCalendarPanel();
  }
  renderFavoriteButton();
}

function formatCount(value: number) {
  return value >= 1000 ? value.toLocaleString('en-US') : String(value);
}

function updateDebugPanel() {
  if (!debugMode || !debugPanel) return;
  const stats = scene.getDebugStats();
  debugPanel.dataset.flowerAudit = JSON.stringify(stats.flowerAudit);
  const { flowerRecords: _flowerRecords, ...leafOwnershipCounts } = stats.leafOwnership;
  debugPanel.dataset.leafOwnershipAudit = JSON.stringify(leafOwnershipCounts);
  const heapText = stats.jsHeapUsedMb === null
    ? 'n/a'
    : `${stats.jsHeapUsedMb}/${stats.jsHeapTotalMb} MB`;
  debugPanel.innerHTML = `
    <div class="debug-row"><span>FPS</span><strong>${stats.fps || '--'} / ${stats.targetFps}</strong></div>
    <div class="debug-row"><span>Render</span><strong>${stats.render} · ${stats.density}</strong></div>
    <div class="debug-row"><span>Canvas</span><strong>${stats.canvasWidth}×${stats.canvasHeight} @ ${stats.pixelRatio.toFixed(2)}</strong></div>
    <div class="debug-row"><span>Draw</span><strong>${stats.calls} calls · ${formatCount(stats.triangles)} tris</strong></div>
    <div class="debug-row"><span>Points/Lines</span><strong>${formatCount(stats.points)} / ${formatCount(stats.lines)}</strong></div>
    <div class="debug-row"><span>GPU res</span><strong>${stats.geometries} geo · ${stats.textures} tex</strong></div>
    <div class="debug-row"><span>JS heap</span><strong>${heapText}</strong></div>
    <div class="debug-row"><span>Realistic leaves</span><strong>${stats.leafOwnership.realisticFlowerLeafCount}</strong></div>
    <div class="debug-row"><span>Legacy stems</span><strong>${stats.leafOwnership.temporaryLegacyStemCount}</strong></div>
    <div class="debug-row"><span>Leaves before/after</span><strong>${stats.leafOwnership.beforeTotalLeafCount} → ${stats.leafOwnership.afterTotalLeafCount} (${stats.leafOwnership.totalLeafDelta})</strong></div>
    <div class="debug-row"><span>Loose leaves removed</span><strong>${stats.leafOwnership.beforeLooseLeafCount}</strong></div>
    <div class="debug-row"><span>Ownership errors</span><strong>${stats.leafOwnership.orphanLeafCount}/${stats.leafOwnership.mixedProfileStemCount}/${stats.leafOwnership.mixedArrangementStemCount}/${stats.leafOwnership.unresolvedGeneratedLeafCount}/${stats.leafOwnership.detachedLeafNodeCount}</strong></div>
    <div class="debug-row"><span>Leaf status</span><strong>structural transition</strong></div>
  `;
}

function setupDebugMode() {
  document.body.classList.toggle('is-debug', debugMode);
  if (reviewDashboardLink) {
    reviewDashboardLink.hidden = !debugMode;
    reviewDashboardLink.href = withBasePath('docs/aesthetic-review-dashboard.html?debug=1');
  }
  if (debugPanel) {
    debugPanel.hidden = !debugMode;
  }
  if (!debugMode) return;
  updateDebugPanel();
  debugTimer = window.setInterval(updateDebugPanel, 650);
}

function syncControls() {
  densityButtons.forEach((button) => {
    const active = button.dataset.densityChoice === selectedDensity;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  renderButtons.forEach((button) => {
    const active = button.dataset.renderChoice === selectedRender;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (rotationSpeedInput) {
    rotationSpeedInput.value = String(speedToSlider(rotationSpeed));
    rotationSpeedInput.setAttribute('aria-valuetext', `${Math.round(rotationSpeed * 1000)}`);
  }

  if (rotationDirectionButton) {
    rotationDirectionButton.classList.toggle('is-reverse', rotationDirection === -1);
    rotationDirectionButton.setAttribute('aria-label', t('view.reverse'));
    rotationDirectionButton.title = t('view.reverse');
  }
}

function revealUi() {
  ui.hud.classList.remove('is-hidden');
  ui.controls.classList.remove('is-hidden');
  window.clearTimeout(hideTimer);
  if (specialReference) {
    hideTimer = window.setTimeout(() => {
      ui.hud.classList.add('is-hidden');
      ui.controls.classList.add('is-hidden');
    }, ui.controls.classList.contains('is-expanded') ? 3600 : 2600);
    return;
  }
  if (!ui.controls.classList.contains('is-expanded')) return;
  hideTimer = window.setTimeout(() => {
    ui.controls.classList.remove('is-expanded');
    ui.controls.classList.add('is-collapsed');
    ui.controlsPanel.hidden = true;
    ui.controlsToggleButton.setAttribute('aria-expanded', 'false');
    ui.controlsToggleButton.setAttribute('aria-label', t('view.show'));
    ui.controlsToggleButton.title = t('view.show');
    updateInterfaceLanguage(interfaceLanguage);
  }, 3600);
}

function setControlsExpanded(expanded: boolean) {
  ui.controls.classList.toggle('is-expanded', expanded);
  ui.controls.classList.toggle('is-collapsed', !expanded);
  ui.controlsPanel.hidden = !expanded;
  ui.controlsToggleButton.setAttribute('aria-expanded', String(expanded));
  ui.controlsToggleButton.setAttribute('aria-label', expanded ? t('view.hide') : t('view.show'));
  ui.controlsToggleButton.title = expanded ? t('view.hide') : t('view.show');
  if (!specialReference) updateInterfaceLanguage(interfaceLanguage);
  revealUi();
}

function updateInterfaceLanguage(language: Locale) {
  interfaceLanguage = language;
  saveLocale(language);
  window.dailyfloraT = (key, values) => formatTranslation(interfaceLanguage, key, values);
  configureDocument(language, 'home', '');
  document.querySelectorAll<HTMLElement>('[data-interface-copy]').forEach((element) => {
    const key = element.dataset.interfaceCopy as 'index' | 'view';
    element.textContent = key === 'view' && ui.controls.classList.contains('is-expanded') ? t('index.hideView') : t(`index.${key}`);
  });
  setupLocaleSwitcher(languageSwitcher, language, (nextLocale) => {
    updateInterfaceLanguage(nextLocale);
    if (activeTutorialKind) showInlineTutorial(activeTutorialKind);
    revealUi();
  });
  applyStaticCopy();
  window.dispatchEvent(new CustomEvent('dailyflora:localechange', { detail: { locale: language } }));
}

function applyStaticCopy() {
  const textBySelector: Array<[string, string]> = [
    ['#site-menu-panel a[href="./"]', 'index.currentBouquet'],
    ['#site-menu-panel a[href="./member/"]', 'index.myGarden'],
    ['#site-menu-panel a[href="./about/"]', 'index.about'],
    ['#site-menu-panel a[href="./bouquet-shop/"]', 'index.objects'],
    ['#site-menu-panel a[href="./downloads/"]', 'index.platforms'],
    ['#site-menu-panel .site-menu-primary', 'index.favorite'],
    ['#site-menu-debug-link', 'index.debug'],
    ['#account-open-title', 'index.gardenTitle'],
    ['#account-panel-title', accountState ? 'index.accountPanelTitleSigned' : 'index.accountPanelTitleGuest'],
    ['.collection-header h3', 'index.collection'],
    ['.reference-copy h3', 'index.referenceTitle'],
    ['.reference-copy p', 'index.referenceBody'],
    ['.reference-upload-zone span:last-of-type', 'index.referenceChoose'],
    ['.reference-note-label span', 'index.referenceNote'],
    ['#reference-generate-button', 'index.referenceGenerate']
  ];
  textBySelector.forEach(([selector, key]) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.textContent = t(key);
  });
  siteMenu?.setAttribute('aria-label', t('index.siteMenu'));

  const tooltipBySelector: Array<[string, string]> = [
    ['#controls-toggle', ui.controls.classList.contains('is-expanded') ? 'view.hide' : 'view.show'],
    ['#review-dashboard-link', 'index.debug'],
    ['#today-button', 'view.date'],
    ['#shuffle-button', 'view.random'],
    ['#fullscreen-button', 'view.fullscreen'],
    ['#hand-control-toggle', stopHandControl ? 'view.handOff' : 'view.handOn'],
    ['#zoom-out-button', 'view.zoomOut'],
    ['#zoom-in-button', 'view.zoomIn'],
    ['[data-density-choice="low"]', 'view.densityLow'],
    ['[data-density-choice="medium"]', 'view.densityMedium'],
    ['[data-density-choice="high"]', 'view.densityHigh'],
    ['[data-render-choice="auto"]', 'view.renderAuto'],
    ['[data-render-choice="low"]', 'view.renderLow'],
    ['[data-render-choice="medium"]', 'view.renderMedium'],
    ['[data-render-choice="high"]', 'view.renderHigh'],
    ['#pause-button', 'view.pause'],
    ['#rotation-direction-button', 'view.reverse'],
    ['.slider-shell', 'view.speed'],
    ['#rotation-preset-button', 'view.preset'],
    ['#clock-toggle', clockDisplaySource === 'manual' ? 'view.hideClock' : 'view.showClock']
  ];
  tooltipBySelector.forEach(([selector, key]) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) return;
    const value = t(key);
    if (selector === '#controls-toggle' && ui.controls.classList.contains('is-expanded')) {
      delete element.dataset.tooltip;
      element.removeAttribute('title');
    } else {
      element.dataset.tooltip = value;
      element.setAttribute('title', value);
    }
    if (element instanceof HTMLButtonElement || element instanceof HTMLAnchorElement) {
      element.setAttribute('aria-label', value);
    }
  });

  const densityShortCopy: Record<string, string> = {
    low: t('view.densityLowShort'),
    medium: t('view.densityMediumShort'),
    high: t('view.densityHighShort')
  };
  document.querySelectorAll<HTMLElement>('[data-density-choice]').forEach((button) => {
    const choice = button.dataset.densityChoice;
    button.textContent = choice ? densityShortCopy[choice] || choice : '';
  });
  const renderShortCopy: Record<string, string> = {
    auto: t('view.renderAutoShort'),
    low: t('view.renderLowShort'),
    medium: t('view.renderMediumShort'),
    high: t('view.renderHighShort')
  };
  document.querySelectorAll<HTMLElement>('[data-render-choice]').forEach((button) => {
    const choice = button.dataset.renderChoice;
    button.textContent = choice ? renderShortCopy[choice] || choice : '';
  });
  document.querySelectorAll<HTMLElement>('[data-clock-copy]').forEach((element) => {
    element.textContent = t(`view.${element.dataset.clockCopy}`);
  });
  const tutorialCopy: Record<string, string> = {
    fullscreen: t('tutorial.fullscreenTitle'),
    gesture: t('tutorial.gestureTitle'),
    clock: t('tutorial.clockTitle')
  };
  document.querySelectorAll<HTMLElement>('[data-tutorial-entry]').forEach((link) => {
    const label = link.dataset.tutorialEntry === 'help'
      ? t('view.howToUse')
      : tutorialCopy[link.dataset.tutorialEntry || ''] || t('tutorial.title');
    link.dataset.tooltip = label;
    link.title = label;
    link.setAttribute('aria-label', label);
  });
  document.querySelector<HTMLElement>('.clock-control')?.setAttribute('aria-label', t('view.clockSettings'));
  document.querySelector<HTMLElement>('.density-control')?.setAttribute('aria-label', t('view.density'));
  document.querySelector<HTMLElement>('.render-control')?.setAttribute('aria-label', t('view.render'));
  if (referenceNoteInput) referenceNoteInput.placeholder = t('index.referencePlaceholder');
  if (loginNameInput) loginNameInput.placeholder = t('index.loginNamePlaceholder');
}

function updateUrl(date: string, seed: string) {
  const next = new URL(window.location.href);
  if (date === todayKey()) {
    next.searchParams.delete('date');
  } else {
    next.searchParams.set('date', date);
  }
  if (seed === date) {
    next.searchParams.delete('seed');
  } else {
    next.searchParams.set('seed', seed);
  }
  next.searchParams.delete('quality');
  if (selectedDensity === 'medium') {
    next.searchParams.delete('density');
  } else {
    next.searchParams.set('density', selectedDensity);
  }
  if (selectedRender === 'auto') {
    next.searchParams.delete('render');
  } else {
    next.searchParams.set('render', selectedRender);
  }
  if (selectedTheme === 'random') {
    next.searchParams.delete('theme');
  } else {
    next.searchParams.set('theme', selectedTheme);
  }
  if (specialReference) {
    next.pathname = specialPathname(specialReference);
    next.searchParams.delete('special');
    next.searchParams.delete('seed');
    if (date === specialReference.date) {
      next.searchParams.delete('date');
    } else {
      next.searchParams.set('date', date);
    }
  }
  window.history.replaceState({}, '', next);
}

function syncTodayMode(date: string, seed: string) {
  followsToday = !specialReference && date === todayKey() && seed === date;
}

function isValidDateKey(dateKey: string) {
  const match = dateKey.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function clampDateKeyToToday(dateKey: string) {
  if (!isValidDateKey(dateKey)) return maxSelectableDate;
  return dateKey > maxSelectableDate ? maxSelectableDate : dateKey;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map((part) => Number(part));
  const fallback = new Date();
  return {
    year: Number.isFinite(year) ? year : fallback.getFullYear(),
    month: Number.isFinite(month) ? THREEClamp(month - 1, 0, 11) : fallback.getMonth(),
    day: Number.isFinite(day) ? THREEClamp(day, 1, 31) : fallback.getDate()
  };
}

function dateKeyFromParts(year: number, month: number, day: number) {
  const paddedMonth = String(month + 1).padStart(2, '0');
  const paddedDay = String(day).padStart(2, '0');
  return `${year}-${paddedMonth}-${paddedDay}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function firstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1)).getUTCDay();
}

function selectCalendarDate(dateKey: string) {
  const safeDateKey = clampDateKeyToToday(dateKey);
  previewCount = 0;
  rebuild(safeDateKey, safeDateKey);
  syncTodayMode(safeDateKey, safeDateKey);
  closeCalendar();
}

function closeCalendar() {
  if (calendarPanel.hidden) return;
  calendarPanel.hidden = true;
  todayButton?.setAttribute('aria-expanded', 'false');
}

function positionCalendarPanel() {
  if (!todayButton) return;
  const margin = 12;
  const buttonRect = todayButton.getBoundingClientRect();
  const panelRect = calendarPanel.getBoundingClientRect();
  const panelWidth = panelRect.width || 292;
  const panelHeight = panelRect.height || 332;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const preferredLeft = buttonRect.right - panelWidth;
  const left = THREEClamp(preferredLeft, margin, Math.max(margin, viewportWidth - panelWidth - margin));
  const aboveTop = buttonRect.top - panelHeight - 10;
  const belowTop = buttonRect.bottom + 10;
  const hasRoomAbove = aboveTop >= margin;
  const preferredTop = hasRoomAbove ? aboveTop : belowTop;
  const top = THREEClamp(preferredTop, margin, Math.max(margin, viewportHeight - panelHeight - margin));

  calendarPanel.style.left = `${left}px`;
  calendarPanel.style.top = `${top}px`;
}

function renderCalendar() {
  const selected = parseDateKey(spec.dateLabel);
  const today = parseDateKey(todayKey());
  const totalDays = daysInMonth(calendarView.year, calendarView.month);
  const leadingDays = firstWeekday(calendarView.year, calendarView.month);
  const monthLabel = `${calendarView.year}.${String(calendarView.month + 1).padStart(2, '0')}`;
  const dayButtons: string[] = [];

  for (let index = 0; index < leadingDays; index += 1) {
    dayButtons.push('<span class="calendar-day is-empty" aria-hidden="true"></span>');
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const dateKey = dateKeyFromParts(calendarView.year, calendarView.month, day);
    const isSelected =
      selected.year === calendarView.year && selected.month === calendarView.month && selected.day === day;
    const isToday = today.year === calendarView.year && today.month === calendarView.month && today.day === day;
    const isFuture = dateKey > maxSelectableDate;
    dayButtons.push(`
      <button
        class="calendar-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}${isFuture ? ' is-disabled' : ''}"
        type="button"
        data-calendar-date="${dateKey}"
        aria-pressed="${isSelected}"
        aria-disabled="${isFuture}"
        ${isFuture ? 'disabled' : ''}
      >${day}</button>
    `);
  }

  const nextMonthDateKey = dateKeyFromParts(
    calendarView.month === 11 ? calendarView.year + 1 : calendarView.year,
    calendarView.month === 11 ? 0 : calendarView.month + 1,
    1
  );
  const canGoNext = nextMonthDateKey <= maxSelectableDate;

  calendarPanel.innerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-button" type="button" data-calendar-nav="-1" aria-label="${t('view.previousMonth')}">‹</button>
      <strong>${monthLabel}</strong>
      <button class="calendar-nav-button" type="button" data-calendar-nav="1" aria-label="${t('view.nextMonth')}" ${canGoNext ? '' : 'disabled aria-disabled="true"'}>›</button>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      ${t('view.weekdays').split(',').map((day) => `<span>${day}</span>`).join('')}
    </div>
    <div class="calendar-grid">${dayButtons.join('')}</div>
  `;
}

function openCalendar() {
  calendarView = parseDateKey(spec.dateLabel);
  renderCalendar();
  calendarPanel.hidden = false;
  todayButton?.setAttribute('aria-expanded', 'true');
  positionCalendarPanel();
}

function toggleCalendar() {
  if (calendarPanel.hidden) {
    openCalendar();
  } else {
    closeCalendar();
  }
}

function applyRotationSettings(pitch?: number) {
  scene.setRotationSettings({
    speed: rotationSpeed,
    direction: rotationDirection,
    pitch,
    mode: cameraRouteMode,
    pitchAmplitude,
    yawAmplitude,
    distanceAmplitude,
    targetYAmplitude
  });
  syncControls();
}

function applyZoom(nextZoom: number) {
  manualZoom = scene.setZoomOffset(THREEClamp(nextZoom, -1.35, 2.05));
  revealUi();
}

function zoomBy(delta: number) {
  manualZoom = scene.zoomBy(delta);
  revealUi();
}

function resetView() {
  manualZoom = scene.setZoomOffset(0);
  manualRotation = false;
  rotationDirection = 1;
  cameraRouteMode = 'orbit';
  pitchAmplitude = 0;
  yawAmplitude = 0;
  distanceAmplitude = 0;
  targetYAmplitude = 0;
  rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
  applyRotationSettings();
  revealUi();
}

function applyRoutePreset(preset: (typeof rotationPresets)[number]) {
  manualRotation = true;
  rotationSpeed = preset.speed;
  rotationDirection = preset.direction;
  cameraRouteMode = preset.mode;
  pitchAmplitude = preset.pitchAmplitude;
  yawAmplitude = preset.yawAmplitude;
  distanceAmplitude = preset.distanceAmplitude;
  targetYAmplitude = preset.targetYAmplitude;
  applyRotationSettings(preset.pitch);
}

function applyRandomRoutePreset() {
  const preset = rotationPresets[Math.floor(Math.random() * rotationPresets.length)];
  applyRoutePreset({
    ...preset,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: THREEClamp(preset.speed * (0.78 + Math.random() * 0.58), minRotationSpeed, maxRotationSpeed)
  });
  revealUi();
}

function randomDateKey() {
  const start = new Date('2026-01-01T00:00:00');
  const end = new Date(`${maxSelectableDate}T00:00:00`);
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs);
  const date = new Date(start.getTime() + Math.floor(Math.random() * (days + 1)) * dayMs);
  return date.toISOString().slice(0, 10);
}

function dateKeyWithOffset(dateKey: string, offsetDays: number) {
  const { year, month, day } = parseDateKey(dateKey);
  const next = new Date(Date.UTC(year, month, day + offsetDays));
  return clampDateKeyToToday(dateKeyFromParts(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()));
}

function openDate(dateKey: string) {
  previewCount = 0;
  closeCalendar();
  rebuild(dateKey, dateKey);
  syncTodayMode(dateKey, dateKey);
}

function rebuild(date: string, seed: string) {
  spec = specialReference ? createSpecialSpec(specialReference, date) : createDailySpec(date, seed, selectedTheme);
  if (!manualRotation) {
    rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
    cameraRouteMode = 'orbit';
    pitchAmplitude = 0;
    yawAmplitude = 0;
    distanceAmplitude = 0;
    targetYAmplitude = 0;
  }
  scene.rebuild(spec, quality);
  applyRotationSettings();
  setLabels();
  updateUrl(date, seed);
  params = { date, seed, density: selectedDensity, render: selectedRender, theme: selectedTheme };
  revealUi();
}

function scheduleDailyRollover() {
  if (specialReference) return;

  window.clearTimeout(dateRolloverTimer);
  const now = new Date();
  const nextDay = new Date(now);
  nextDay.setHours(24, 0, 3, 0);
  const delay = Math.max(1000, nextDay.getTime() - now.getTime());

  dateRolloverTimer = window.setTimeout(() => {
    const date = todayKey();
    if (followsToday && spec.dateLabel !== date) {
      rebuild(date, date);
      syncTodayMode(date, date);
    }
    scheduleDailyRollover();
  }, delay);
}

function createSpecialOverlay() {
  if (!specialReference) return;
  document.body.classList.add('is-special');

  const overlay = document.createElement('section');
  overlay.className = 'special-start-overlay';
  overlay.setAttribute('aria-label', 'Start special bouquet');
  overlay.innerHTML = `
    <div class="special-start-copy">
      <p class="special-date">1997.01.29</p>
      <h1>A galaxy, wound around its own light.</h1>
      <button class="special-start-button" type="button">Start the bouquet</button>
    </div>
  `;

  const caption = document.createElement('aside');
  caption.className = 'special-caption';
  const versionText = specialReference.versionLabel ? ` · ${specialReference.versionLabel}` : '';
  caption.innerHTML = `
    <p>NGC 2787 · seen by Hubble</p>
    <p>A bouquet remembered for 2026.06.29${versionText}</p>
  `;

  const quote = document.createElement('aside');
  quote.className = specialReference.quoteStanzas ? 'special-quote is-custom' : 'special-quote';
  if (specialReference.quoteStanzas) {
    const zh = specialReference.quoteStanzas
      .map((stanza) => `<p lang="zh-CN">${stanza.replace(/\n/g, '<br />')}</p>`)
      .join('');
    const en = (specialReference.quoteTranslationStanzas || [])
      .map((stanza) => `<p lang="en">${stanza.replace(/\n/g, '<br />')}</p>`)
      .join('');
    quote.innerHTML = `
      <div class="special-quote-language special-quote-zh">${zh}</div>
      ${en ? `<div class="special-quote-language special-quote-en">${en}</div>` : ''}
    `;
  } else {
    quote.innerHTML = `
      <p>Some flowers last for days.<br />Some light travels long enough to arrive as a memory.</p>
      <p lang="zh-CN">有些花会谢。<br />有些光，会走很久才抵达。</p>
    `;
  }

  const credit = document.createElement('aside');
  credit.className = 'special-credit';
  credit.textContent = 'Image source: NASA / ESA / Hubble';

  const muteButton = document.createElement('button');
  muteButton.className = 'special-mute-button';
  muteButton.type = 'button';
  muteButton.hidden = true;
  const syncMuteButton = () => {
    muteButton.classList.toggle('is-muted', specialAudioMuted);
    muteButton.setAttribute('aria-pressed', String(specialAudioMuted));
    muteButton.setAttribute('aria-label', specialAudioMuted ? 'Unmute audio' : 'Mute audio');
    muteButton.title = specialAudioMuted ? 'Unmute audio' : 'Mute audio';
    muteButton.innerHTML = specialAudioMuted
      ? '<svg class="special-audio-glyph" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.2 18.5H6.9a1.25 1.25 0 0 1-1.25-1.25v-2.5A1.25 1.25 0 0 1 6.9 13.5h2.3l5.15-4.05v13.1L9.2 18.5Z" /><path d="M19.2 11.4l5.2 9.2" /></svg>'
      : '<svg class="special-audio-glyph" viewBox="0 0 32 32" aria-hidden="true"><path d="M9.2 18.5H6.9a1.25 1.25 0 0 1-1.25-1.25v-2.5A1.25 1.25 0 0 1 6.9 13.5h2.3l5.15-4.05v13.1L9.2 18.5Z" /><path d="M18.55 12.6c.95.9 1.45 2.05 1.45 3.4s-.5 2.5-1.45 3.4" /><path d="M21.45 10.05c1.6 1.6 2.45 3.65 2.45 5.95s-.85 4.35-2.45 5.95" /></svg>';
  };
  syncMuteButton();
  muteButton.addEventListener('click', () => {
    specialAudioMuted = !specialAudioMuted;
    if (specialAudio) specialAudio.muted = specialAudioMuted;
    syncMuteButton();
  });

  document.body.append(overlay, caption, quote, credit, muteButton);

  try {
    specialAudio = new Audio(withBasePath(specialReference.audioPath));
    specialAudio.loop = true;
    specialAudio.preload = 'auto';
    specialAudio.volume = 0.42;
    specialAudio.muted = false;
  } catch {
    specialAudio = null;
  }

  overlay.querySelector<HTMLButtonElement>('.special-start-button')?.addEventListener('click', async () => {
    overlay.classList.add('is-dismissed');
    try {
      await specialAudio?.play();
      muteButton.hidden = !specialAudio;
    } catch {
      specialAudio = null;
      muteButton.hidden = true;
    }
    window.setTimeout(() => overlay.remove(), 900);
  });
}

function rebuildQuality(nextDensity = selectedDensity, nextRender = selectedRender) {
  const next = resolveQuality(nextDensity, nextRender);
  const changed = next.densityName !== quality.densityName || next.renderName !== quality.renderName;
  quality = next;
  if (changed) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    scene.setZoomOffset(manualZoom);
  }
  setLabels();
  syncControls();
  updateUrl(spec.dateLabel, spec.seed);
  revealUi();
}

function setDensity(nextDensity: DensityName) {
  selectedDensity = nextDensity;
  rebuildQuality();
}

function setRender(nextRender: RenderQualityName) {
  selectedRender = nextRender;
  rebuildQuality();
}

accountOpenButton?.addEventListener('click', () => {
  if (accountPanel?.classList.contains('is-open')) {
    closeAccountPanel();
  } else {
    openAccountPanel();
  }
});

accountCloseButton?.addEventListener('click', closeAccountPanel);

favoriteButton?.addEventListener('click', () => {
  void toggleFavorite();
  revealUi();
});

siteMenuFavoriteLink?.addEventListener('click', (event) => {
  event.preventDefault();
  toggleSiteMenu(false);
  void toggleFavorite();
});

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }
  const data = new FormData(loginForm);
  if (mainAuthMode === 'signup' && data.get('termsAccepted') !== 'on') {
    loginForm.reportValidity();
    return;
  }
  const name = loginNameInput?.value.trim() || 'DailyFlora 用户';
  const email = loginEmailInput?.value.trim() || '';
  const password = loginPasswordInput?.value || '';
  const hadLocalAccount = Boolean(accountState);
  const localFavoritesBeforeAuth = [...favoriteBouquets];
  if (dailyfloraCloudEnabled && password.length < 8) {
    loginPasswordInput?.setCustomValidity('云端账户密码至少 8 位。');
    loginPasswordInput?.reportValidity();
    return;
  }
  if (loginPasswordInput) loginPasswordInput.setCustomValidity('');
  const submitButton = loginForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submitButton) submitButton.disabled = true;
  setMainAuthError('');
  if (dailyfloraCloudEnabled) {
    try {
      const account = mainAuthMode === 'login'
        ? await loginAccount({ email, password })
        : await registerAccount({ name, email, password, termsVersion: '0.72-beta.1' });
      saveAccountState(account);
      favoriteBouquets = await listCloudFavorites();
      if (!hadLocalAccount && localFavoritesBeforeAuth.length > 0 && window.confirm(`发现本机有 ${localFavoritesBeforeAuth.length} 条未同步收藏，是否合并到 ${account.email}？`)) {
        const remoteIds = new Set(favoriteBouquets.map((favorite) => favorite.id));
        for (const favorite of localFavoritesBeforeAuth) {
          if (!remoteIds.has(favorite.id)) await saveCloudFavorite(favorite);
        }
        favoriteBouquets = await listCloudFavorites();
      }
      window.localStorage.setItem(favoritesStorageKey, JSON.stringify(favoriteBouquets));
      renderAccountState();
      if (!currentFavorite()) {
        const favorite = createFavorite();
        await saveCloudFavorite(favorite);
        saveFavoriteBouquets([favorite, ...favoriteBouquets]);
      }
      loginForm.reset();
      setMainAuthMode('signup');
      return;
    } catch (error) {
      setMainAuthError(error instanceof Error ? error.message : '账户请求失败，请稍后重试。');
      return;
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  }
  setMainAuthError('0.72 Beta 云端账户服务当前不可用，请稍后重试。');
  if (submitButton) submitButton.disabled = false;
});

logoutButton?.addEventListener('click', async () => {
  try {
    await logoutAccount();
  } catch (error) {
    console.warn('[DailyFlora] logout request failed; clearing local session', error);
  } finally {
    saveAccountState(null);
    favoriteBouquets = [];
    window.localStorage.removeItem(favoritesStorageKey);
  }
});

accountFormSwitchLink?.addEventListener('click', (event) => {
  event.preventDefault();
  setMainAuthMode(mainAuthMode === 'login' ? 'signup' : 'login');
  loginEmailInput?.focus();
});

collectionList?.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest<HTMLButtonElement>('[data-favorite-id]');
  if (!button) return;
  const favorite = favoriteBouquets.find((item) => item.id === button.dataset.favoriteId);
  if (!favorite) return;
  previewCount = 0;
  closeCalendar();
  rebuild(favorite.date, favorite.seed);
  syncTodayMode(favorite.date, favorite.seed);
  closeAccountPanel();
});

referenceFileInput?.addEventListener('change', async () => {
  const file = referenceFileInput.files?.[0];
  if (!file) return;
  try {
    await handleReferenceFile(file);
  } catch {
    referenceState = null;
    renderReferenceState();
    if (referenceResult) {
      referenceResult.hidden = false;
      referenceResult.textContent = '这张图暂时读不了，换一张试试。';
    }
  }
});

referenceGenerateButton?.addEventListener('click', generateFromReference);

siteMenuToggle?.addEventListener('click', () => {
  toggleSiteMenu();
  revealUi();
});

siteMenuFavoriteLink?.addEventListener('click', (event) => {
  if (!accountState) return;
  event.preventDefault();
  if (!currentFavorite()) saveFavoriteBouquets([createFavorite(), ...favoriteBouquets]);
  window.location.href = './member/#saved-title';
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (siteMenuPanel && siteMenu && !siteMenuPanel.hidden && target instanceof Node && !siteMenu.contains(target)) {
    toggleSiteMenu(false);
  }
  if (!accountPanel) return;
  if (
    accountPanel.hidden ||
    !(target instanceof Node) ||
    accountPanel.contains(target) ||
    accountDock?.contains(target)
  ) {
    return;
  }
  closeAccountPanel();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    toggleSiteMenu(false);
    if (clockDisplaySource) hideClock();
  }
});

controlsToggleButton?.addEventListener('click', () => {
  setControlsExpanded(!controls.classList.contains('is-expanded'));
});

pauseButton?.addEventListener('click', () => {
  const paused = scene.togglePause();
  syncPauseButton(paused);
  revealUi();
});

function syncPauseButton(paused: boolean) {
  if (!pauseButton) return;
  pauseButton.setAttribute('aria-label', paused ? t('view.resume') : t('view.pause'));
  pauseButton.title = paused ? t('view.resume') : t('view.pause');
  pauseButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>';
}

todayButton?.addEventListener('click', () => {
  toggleCalendar();
  revealUi();
});

datePicker?.addEventListener('change', () => {
  if (!datePicker.value) return;
  const safeDateKey = clampDateKeyToToday(datePicker.value);
  datePicker.value = safeDateKey;
  previewCount = 0;
  rebuild(safeDateKey, safeDateKey);
  syncTodayMode(safeDateKey, safeDateKey);
  datePicker.blur();
});

calendarPanel.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const navValue = target.dataset.calendarNav;
  if (navValue) {
    const nextMonth = calendarView.month + Number(navValue);
    const nextYear = calendarView.year + (nextMonth < 0 ? -1 : nextMonth > 11 ? 1 : 0);
    const normalizedNextMonth = nextMonth < 0 ? 11 : nextMonth > 11 ? 0 : nextMonth;
    if (dateKeyFromParts(nextYear, normalizedNextMonth, 1) > maxSelectableDate) return;
    calendarView.month += Number(navValue);
    if (calendarView.month < 0) {
      calendarView.month = 11;
      calendarView.year -= 1;
    }
    if (calendarView.month > 11) {
      calendarView.month = 0;
      calendarView.year += 1;
    }
    renderCalendar();
    positionCalendarPanel();
    revealUi();
    return;
  }

  const dateKey = target.dataset.calendarDate;
  if (dateKey) {
    if (dateKey > maxSelectableDate) return;
    selectCalendarDate(dateKey);
  }
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (
    calendarPanel.hidden ||
    !(target instanceof Node) ||
    calendarPanel.contains(target) ||
    todayButton?.contains(target)
  ) {
    return;
  }
  closeCalendar();
});

document.addEventListener('keydown', (event) => {
  if (isTextInputTarget(event.target)) return;
  if (event.key === 'Escape' && inlineTutorialDialog?.open) {
    event.preventDefault();
    closeInlineTutorial();
    return;
  }
  if (event.key === 'Escape') {
    closeCalendar();
    closeAccountPanel();
    if (clockDisplaySource) hideClock();
    if (document.fullscreenElement) void document.exitFullscreen();
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    openDate(dateKeyWithOffset(spec.dateLabel, event.key === 'ArrowLeft' ? -1 : 1));
    return;
  }
  if (event.key === '?') {
    event.preventDefault();
    showInlineTutorial('fullscreen');
    return;
  }
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    zoomBy(event.key === 'ArrowUp' ? -0.28 : 0.28);
    return;
  }
  if (event.key.toLowerCase() === 'r') {
    event.preventDefault();
    openDate(randomDateKey());
    return;
  }
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    zoomBy(-0.28);
    return;
  }
  if (event.key === '-') {
    event.preventDefault();
    zoomBy(0.28);
    return;
  }
  if (event.key === '0') {
    event.preventDefault();
    resetView();
    return;
  }
  if (event.key.toLowerCase() === 'p') {
    event.preventDefault();
    applyRandomRoutePreset();
    return;
  }
  if (event.code === 'Space') {
    event.preventDefault();
    pauseButton?.click();
    return;
  }
  if (event.key.toLowerCase() === 'h') {
    event.preventDefault();
    window.clearTimeout(hideTimer);
    const hidden = ui.controls.classList.contains('is-hidden');
    if (hidden) {
      revealUi();
    } else {
      window.setTimeout(() => {
        ui.hud.classList.add('is-hidden');
        ui.controls.classList.add('is-hidden');
      }, 0);
    }
    return;
  }
  if (event.key.toLowerCase() === 'o' && !isTextInputTarget(event.target)) {
    setControlsExpanded(!controls.classList.contains('is-expanded'));
  }
  if (event.key.toLowerCase() === 'f' && !isTextInputTarget(event.target)) {
    event.preventDefault();
    void toggleFullscreen();
  }
});

shuffleButton?.addEventListener('click', () => {
  const date = randomDateKey();
  previewCount = 0;
  closeCalendar();
  rebuild(date, date);
  syncTodayMode(date, date);
});

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch {
    // Fullscreen can be refused by an embedded or file-based browser context.
  }
  revealUi();
}

fullscreenButton?.addEventListener('click', () => {
  void toggleFullscreen();
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    maybeShowFullscreenTutorial();
  }
});

zoomInButton?.addEventListener('click', () => {
  zoomBy(-0.28);
});

zoomOutButton?.addEventListener('click', () => {
  zoomBy(0.28);
});

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const normalized = THREEClamp(event.deltaY / 520, -0.42, 0.42);
    applyZoom(manualZoom + normalized);
  },
  { passive: false }
);

densityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDensity(normalizeDensity(button.dataset.densityChoice || 'medium'));
  });
});

renderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setRender(normalizeRender(button.dataset.renderChoice || 'auto'));
  });
});

rotationSpeedInput?.addEventListener('input', () => {
  manualRotation = true;
  rotationSpeed = sliderToSpeed(rotationSpeedInput.value);
  applyRotationSettings();
  revealUi();
});

rotationDirectionButton?.addEventListener('click', () => {
  manualRotation = true;
  rotationDirection = rotationDirection === 1 ? -1 : 1;
  applyRotationSettings();
  revealUi();
});

rotationPresetButton?.addEventListener('click', applyRandomRoutePreset);

clockToggleButton?.addEventListener('click', () => {
  idleClock.toggleManual();
  revealUi();
});

function updateClockIntervalFrom(input: HTMLInputElement | null) {
  if (!input) return;
  updateClockSettings({ intervalMinutes: normalizeClockInterval(Number(input.value)) });
}

[clockIntervalInput].forEach((input) => {
  input?.addEventListener('change', () => updateClockIntervalFrom(input));
});

[clockAutoEnabledInput].forEach((input) => {
  input?.addEventListener('change', () => updateClockSettings({ autoEnabled: input.checked }));
});

window.addEventListener('resize', () => {
  const nextQuality = resolveQuality(selectedDensity, selectedRender);
  const qualityChanged = nextQuality.densityName !== quality.densityName || nextQuality.renderName !== quality.renderName;
  quality = nextQuality;
  scene.resize();
  if (qualityChanged) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    setLabels();
  }
  if (!calendarPanel.hidden) positionCalendarPanel();
  syncInterfaceButtonAlignment();
});

['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, (event) => {
    revealUi();
    const target = event.target;
    if (target instanceof Element && target.closest('[data-clock-interaction]')) return;
    idleClock.noteActivity();
  }, { passive: true });
});

window.addEventListener('pointermove', (event) => {
  revealUi();
  idleClock.notePointerMove(event.clientX, event.clientY);
}, { passive: true });

window.addEventListener('focus', () => idleClock.noteActivity());

window.addEventListener('beforeunload', () => scene.stop());
window.addEventListener('beforeunload', () => window.clearInterval(debugTimer));
window.addEventListener('beforeunload', () => window.clearTimeout(dateRolloverTimer));
window.addEventListener('beforeunload', () => window.clearInterval(clockTickTimer));
window.addEventListener('beforeunload', () => idleClock.stop());

async function startHandControl() {
  const { startDailyFloraHandControl } = await import('./dailyFloraHandControl.ts');
  const densityOrder: DensityName[] = ['low', 'medium', 'high'];
  const renderOrder: Array<Exclude<RenderQualityName, 'auto'>> = ['low', 'medium', 'high'];
  let immersive = false;
  const actions: DailyFloraHandActions = {
    cycleDensity: () => {
      const index = densityOrder.indexOf(selectedDensity);
      setDensity(densityOrder[(index + 1) % densityOrder.length]);
    },
    cycleRender: () => {
      const current = selectedRender === 'auto' ? quality.renderName : selectedRender;
      const index = renderOrder.indexOf(current);
      setRender(renderOrder[(index + 1) % renderOrder.length]);
    },
    toggleClock: () => {
      idleClock.toggleManual();
      revealUi();
    },
    setAutomaticCameraEnabled: (enabled) => {
      scene.setAutomaticCameraEnabled(enabled);
      syncPauseButton(!enabled);
      revealUi();
    },
    toggleImmersive: () => {
      immersive = !immersive;
      document.body.classList.toggle('is-hand-control-immersive', immersive);
    },
    moveFramingBy: (deltaX, deltaY) => {
      scene.moveGestureFramingBy(-deltaX, -deltaY);
    },
    rotateBy: (deltaYaw, deltaPitch) => {
      scene.rotateGestureBy(deltaYaw, deltaPitch);
    },
    zoomBy: (delta) => {
      zoomBy(delta);
    }
  };
  const stop = startDailyFloraHandControl(actions);
  return () => {
    stop();
    document.body.classList.remove('is-hand-control-immersive');
  };
}

let stopHandControl: (() => void) | null = null;
let handControlLoading = false;

function syncHandControlToggle() {
  if (!handControlToggle) return;
  const active = stopHandControl !== null;
  handControlToggle.classList.toggle('is-loading', handControlLoading);
  handControlToggle.disabled = handControlLoading;
  handControlToggle.setAttribute('aria-pressed', String(active));
  handControlToggle.setAttribute('aria-label', active ? t('view.handOff') : t('view.handOn'));
  handControlToggle.title = active ? t('view.handOff') : t('view.handOn');
}

async function enableHandControl() {
  if (stopHandControl || handControlLoading) return;
  handControlLoading = true;
  syncHandControlToggle();
  try {
    stopHandControl = await startHandControl();
    showInlineTutorial('gesture');
  } catch (error) {
    console.error('Unable to start hand control', error);
  } finally {
    handControlLoading = false;
    syncHandControlToggle();
  }
}

function disableHandControl() {
  stopHandControl?.();
  stopHandControl = null;
  syncHandControlToggle();
}

handControlToggle?.addEventListener('click', () => {
  if (stopHandControl) disableHandControl();
  else void enableHandControl();
});

window.addEventListener('beforeunload', () => stopHandControl?.(), { once: true });

setLabels();
if (!specialReference) updateInterfaceLanguage(interfaceLanguage);
renderAccountState();
void restoreCloudState();
setupDebugMode();
if (specialReference) {
  rotationSpeed = 0.024;
  cameraRouteMode = 'figure-eight';
  pitchAmplitude = 0.16;
  yawAmplitude = 0.2;
  distanceAmplitude = 0.18;
  targetYAmplitude = 0.08;
  createSpecialOverlay();
}
applyRotationSettings();
scene.setZoomOffset(manualZoom);
scheduleDailyRollover();
syncClockControls();
idleClock.start();
revealUi();
scene.start();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register(new URL('./gesture-cache-worker.js', document.baseURI), { scope: new URL('./', document.baseURI).pathname }).catch(() => undefined);
}
const warmupHandModel = () => {
  void warmupDailyFloraHandModel().catch(() => undefined);
};
const requestIdle = (window as Window & {
  requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
}).requestIdleCallback;
if (requestIdle) {
  requestIdle(warmupHandModel, { timeout: 5000 });
} else {
  window.setTimeout(warmupHandModel, 2500);
}

syncHandControlToggle();
if (handControlInitiallyEnabled) void enableHandControl();

function isTextInputTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

let activeTutorialKind: 'fullscreen' | 'gesture' | 'clock' | null = null;

function syncFullscreenShortcutCopy() {
  const shortcutKeys = ['fullscreen', 'escape', 'dates', 'arrowZoom', 'zoom', 'random', 'reset', 'preset', 'rotation', 'interface', 'view', 'help'];
  document.querySelectorAll<HTMLElement>('[data-shortcut-copy]').forEach((element) => {
    const key = element.dataset.shortcutCopy;
    if (key && shortcutKeys.includes(key)) element.textContent = t(`shortcuts.${key}`);
  });
  if (fullscreenHelpMore) fullscreenHelpMore.textContent = t('shortcuts.more');
  if (fullscreenHelpClose) fullscreenHelpClose.textContent = t('tutorial.acknowledge');
}

function syncGestureGuideCopy() {
  const gestureKeys = ['index', 'victory', 'three', 'thumb', 'four', 'fist', 'pinch', 'open', 'curled', 'twoHands'];
  gestureKeys.forEach((key) => {
    const label = document.querySelector<HTMLElement>(`[data-gesture-label="${key}"]`);
    const action = document.querySelector<HTMLElement>(`[data-gesture-action="${key}"]`);
    if (label) label.textContent = t(`hand.${key}Label`);
    if (action) action.textContent = t(`hand.${key}Action`);
  });
}

function syncTutorialModeCopy(activeKind: 'fullscreen' | 'gesture' | 'clock') {
  document.querySelectorAll<HTMLButtonElement>('[data-tutorial-select]').forEach((button) => {
    const kind = button.dataset.tutorialSelect as 'fullscreen' | 'gesture' | 'clock';
    button.textContent = t(`tutorial.${kind}Title`);
    button.setAttribute('aria-pressed', String(kind === activeKind));
  });
}

function closeInlineTutorial() {
  if (!inlineTutorialDialog?.open) return;
  inlineTutorialDialog.close();
  activeTutorialKind = null;
}

function maybeShowFullscreenTutorial() {
  showInlineTutorial('fullscreen');
}

function showInlineTutorial(kind: 'fullscreen' | 'gesture' | 'clock') {
  const copy = {
    fullscreen: ['tutorial.fullscreenTitle', 'tutorial.fullscreenBody'],
    gesture: ['tutorial.gestureTitle', 'tutorial.gestureBody'],
    clock: ['tutorial.clockTitle', 'tutorial.clockBody']
  }[kind];
  if (!inlineTutorialDialog || !inlineTutorialTitle || !inlineTutorialBody) return;
  activeTutorialKind = kind;
  inlineTutorialKicker && (inlineTutorialKicker.textContent = t('tutorial.title'));
  inlineTutorialTitle.textContent = kind === 'fullscreen'
    ? t('shortcuts.title')
    : kind === 'gesture' ? t('hand.gestureTableTitle') : t(copy[0]);
  inlineTutorialBody.textContent = kind === 'fullscreen' ? t('shortcuts.intro') : t(copy[1]);
  inlineTutorialClose?.setAttribute('aria-label', t('common.close'));
  if (fullscreenShortcutContent) fullscreenShortcutContent.hidden = kind !== 'fullscreen';
  if (gestureGuideContent) gestureGuideContent.hidden = kind !== 'gesture';
  if (kind === 'fullscreen') syncFullscreenShortcutCopy();
  if (kind === 'gesture') syncGestureGuideCopy();
  if (fullscreenHelpClose) fullscreenHelpClose.textContent = t('tutorial.acknowledge');
  syncTutorialModeCopy(kind);
  if (!inlineTutorialDialog.open) inlineTutorialDialog.showModal();
}

document.querySelectorAll<HTMLElement>('[data-tutorial-entry]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    const kind = link.dataset.tutorialEntry;
    if (kind === 'help') showInlineTutorial('fullscreen');
    else if (kind === 'fullscreen' || kind === 'gesture' || kind === 'clock') showInlineTutorial(kind);
  });
});
document.querySelectorAll<HTMLButtonElement>('[data-tutorial-select]').forEach((button) => {
  button.addEventListener('click', () => {
    const kind = button.dataset.tutorialSelect;
    if (kind === 'fullscreen' || kind === 'gesture' || kind === 'clock') showInlineTutorial(kind);
  });
});
window.addEventListener('dailyflora:opentutorial', (event) => {
  const kind = (event as CustomEvent<{ kind?: string }>).detail?.kind;
  if (kind === 'fullscreen' || kind === 'gesture' || kind === 'clock') showInlineTutorial(kind);
});
inlineTutorialClose?.addEventListener('click', closeInlineTutorial);
fullscreenHelpClose?.addEventListener('click', closeInlineTutorial);
inlineTutorialDialog?.addEventListener('cancel', (event) => {
  event.preventDefault();
  closeInlineTutorial();
});

if (tutorialValue === 'gesture') {
  setControlsExpanded(true);
  window.setTimeout(() => showInlineTutorial('gesture'), 0);
} else if (tutorialValue === 'fullscreen') {
  setControlsExpanded(true);
  window.setTimeout(() => showInlineTutorial('fullscreen'), 0);
} else if (tutorialValue === 'clock') {
  setControlsExpanded(true);
  window.setTimeout(() => showInlineTutorial('clock'), 0);
}
