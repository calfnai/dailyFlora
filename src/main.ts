import './styles.css';
import type { DensityName, RenderQualityName } from './types';
import { todayKey } from './random';
import { bouquetDisplayName, createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';
import { createSpecialSpec, readSpecialId, specialPathname, specialReferences, withBasePath } from './special';
import { themes } from './themes';

type RotationDirection = 1 | -1;
type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';
type AccountState = {
  name: string;
  email: string;
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
const accountStorageKey = 'dailyflora.account.v1';
const favoritesStorageKey = 'dailyflora.favorites.v1';
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
const controls = document.querySelector<HTMLElement>('#controls');
const controlsToggleButton = document.querySelector<HTMLButtonElement>('#controls-toggle');
const controlsPanel = document.querySelector<HTMLElement>('#controls-panel');
const siteMenu = document.querySelector<HTMLElement>('#site-menu');
const siteMenuToggle = document.querySelector<HTMLButtonElement>('#site-menu-toggle');
const siteMenuPanel = document.querySelector<HTMLElement>('#site-menu-panel');
const siteMenuDebugLink = document.querySelector<HTMLAnchorElement>('#site-menu-debug-link');
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
const loginNameInput = document.querySelector<HTMLInputElement>('#login-name-input');
const loginEmailInput = document.querySelector<HTMLInputElement>('#login-email-input');
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

let params = readParams();
const specialId = readSpecialId();
const specialReference = specialId ? specialReferences[specialId] : null;
const searchParams = new URLSearchParams(window.location.search);
const debugValue = searchParams.get('debug');
const debugMode = searchParams.has('debug') && debugValue !== '0' && debugValue !== 'false';
const previewValue = searchParams.get('preview');
const previewMode = searchParams.has('preview') && previewValue !== '0' && previewValue !== 'false';
const internalPreviewMode = debugMode || previewMode;
const requestedDensity = searchParams.get('density') || searchParams.get('quality');
const requestedRender = searchParams.get('render');
let selectedDensity = requestedDensity
  ? normalizeDensity(requestedDensity)
  : internalPreviewMode
    ? 'high'
    : specialReference
      ? 'medium'
      : normalizeDensity(params.density);
document.body.classList.toggle('is-preview', previewMode);
siteMenuDebugLink && (siteMenuDebugLink.hidden = !debugMode);
let selectedRender = requestedRender
  ? normalizeRender(requestedRender)
  : internalPreviewMode || specialReference
    ? 'high'
    : normalizeRender(params.render);
let selectedTheme = specialReference ? specialReference.theme.id : params.theme;
let quality = resolveQuality(selectedDensity, selectedRender);
let spec = specialReference
  ? createSpecialSpec(specialReference, new URLSearchParams(window.location.search).get('date') || undefined)
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
let referenceState: ReferenceState | null = null;

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
    referenceResult.textContent = '正在读取参考图...';
  }
  referenceState = await analyzeReferenceImage(file);
  renderReferenceState();
  if (referenceResult) {
    referenceResult.textContent = `已匹配到 ${referenceState.themeName}，可以生成。`;
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
    referenceResult.textContent = `已按 ${referenceState.themeName} 生成，可点爱心收藏。`;
  }
}

function openAccountPanel() {
  if (!accountPanel || !accountOpenButton) return;
  accountPanel.hidden = false;
  accountOpenButton.setAttribute('aria-expanded', 'true');
  window.setTimeout(() => accountPanel.classList.add('is-open'), 20);
  if (!accountState) {
    loginNameInput?.focus();
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

function toggleFavorite() {
  if (!accountState) {
    openAccountPanel();
    return;
  }

  const favorite = currentFavorite();
  if (favorite) {
    saveFavoriteBouquets(favoriteBouquets.filter((item) => item.id !== favorite.id));
    return;
  }

  saveFavoriteBouquets([createFavorite(), ...favoriteBouquets.filter((item) => item.id !== currentFavoriteId())]);
}

function renderFavoriteButton() {
  if (!favoriteButton) return;
  const saved = Boolean(currentFavorite());
  favoriteButton.classList.toggle('is-saved', saved);
  favoriteButton.setAttribute('aria-pressed', String(saved));
  favoriteButton.title = saved ? '已收藏今日花束' : '收藏今日花束';
}

function renderCollectionList() {
  if (!collectionList || !collectionCount) return;
  collectionCount.textContent = String(favoriteBouquets.length);
  if (favoriteBouquets.length === 0) {
    collectionList.innerHTML = `
      <div class="empty-collection">
        <strong>还没有收藏</strong>
        <span>点亮爱心后，这束花会留在这里。</span>
      </div>
    `;
    return;
  }

  collectionList.innerHTML = favoriteBouquets
    .map(
      (favorite) => `
        <button class="collection-item" type="button" data-favorite-id="${favorite.id}">
          <span class="collection-item-date">${favorite.date}</span>
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
      ? `${favoriteBouquets.length} 个收藏`
      : '登录后同步收藏';
  }
  if (accountAvatar) accountAvatar.textContent = signedIn ? initials(accountState?.name || '', '花') : '访';
  if (accountPanelTitle) accountPanelTitle.textContent = signedIn ? '你的 DailyFlora 收藏' : '把今天的花束收进个人花园';
  if (loginForm) loginForm.hidden = signedIn;
  if (accountProfile) accountProfile.hidden = !signedIn;
  if (profileAvatar) profileAvatar.textContent = initials(accountState?.name || '', '花');
  if (profileName) profileName.textContent = accountState?.name || 'DailyFlora 用户';
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
  todayButton?.setAttribute('aria-label', `Pick bouquet date: ${bouquetHoverTitle()}`);
  shuffleButton?.setAttribute('title', `随机日期花束 · ${bouquetHoverTitle()}`);
  const renderLabel =
    selectedRender === 'auto' ? `自/${renderLabels[quality.renderName]}` : renderLabels[quality.renderName];
  ui.qualityLabel.textContent = `${densityLabels[quality.densityName]} · ${renderLabel}`;
  document.title = `DailyFlora - ${name.cn} / ${name.en}`;
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
    rotationDirectionButton.setAttribute('aria-label', 'Reverse current camera route');
    rotationDirectionButton.title = 'Reverse current camera route';
  }
}

function revealUi() {
  ui.hud.classList.remove('is-hidden');
  ui.controls.classList.remove('is-hidden');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    ui.hud.classList.add('is-hidden');
    ui.controls.classList.add('is-hidden');
  }, ui.controls.classList.contains('is-expanded') ? 7000 : 3200);
}

function setControlsExpanded(expanded: boolean) {
  ui.controls.classList.toggle('is-expanded', expanded);
  ui.controls.classList.toggle('is-collapsed', !expanded);
  ui.controlsPanel.hidden = !expanded;
  ui.controlsToggleButton.setAttribute('aria-expanded', String(expanded));
  ui.controlsToggleButton.setAttribute('aria-label', expanded ? 'Hide viewing controls' : 'Show viewing controls');
  ui.controlsToggleButton.title = expanded ? 'Hide viewing controls' : 'Show viewing controls';
  revealUi();
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
  previewCount = 0;
  rebuild(dateKey, dateKey);
  syncTodayMode(dateKey, dateKey);
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
    dayButtons.push(`
      <button
        class="calendar-day${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}"
        type="button"
        data-calendar-date="${dateKey}"
        aria-pressed="${isSelected}"
      >${day}</button>
    `);
  }

  calendarPanel.innerHTML = `
    <div class="calendar-header">
      <button class="calendar-nav-button" type="button" data-calendar-nav="-1" aria-label="Previous month">‹</button>
      <strong>${monthLabel}</strong>
      <button class="calendar-nav-button" type="button" data-calendar-nav="1" aria-label="Next month">›</button>
    </div>
    <div class="calendar-weekdays" aria-hidden="true">
      <span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span>
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

function randomDateKey() {
  const start = new Date('2026-01-01T00:00:00');
  const end = new Date('2026-12-31T00:00:00');
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs);
  const date = new Date(start.getTime() + Math.floor(Math.random() * (days + 1)) * dayMs);
  return date.toISOString().slice(0, 10);
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
  toggleFavorite();
  revealUi();
});

loginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = loginNameInput?.value.trim() || 'DailyFlora 用户';
  const email = loginEmailInput?.value.trim() || `${name.replace(/\s+/g, '').toLowerCase()}@dailyflora.local`;
  saveAccountState({ name, email });
  if (!currentFavorite()) {
    saveFavoriteBouquets([createFavorite(), ...favoriteBouquets]);
  }
});

logoutButton?.addEventListener('click', () => {
  saveAccountState(null);
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
  }
});

controlsToggleButton?.addEventListener('click', () => {
  setControlsExpanded(!controls.classList.contains('is-expanded'));
});

pauseButton?.addEventListener('click', () => {
  const paused = scene.togglePause();
  pauseButton.setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
  pauseButton.title = paused ? 'Resume rotation' : 'Pause rotation';
  pauseButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>';
  revealUi();
});

todayButton?.addEventListener('click', () => {
  toggleCalendar();
  revealUi();
});

datePicker?.addEventListener('change', () => {
  if (!datePicker.value) return;
  previewCount = 0;
  rebuild(datePicker.value, datePicker.value);
  syncTodayMode(datePicker.value, datePicker.value);
  datePicker.blur();
});

calendarPanel.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const navValue = target.dataset.calendarNav;
  if (navValue) {
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
  if (event.key === 'Escape') {
    closeCalendar();
    closeAccountPanel();
  }
});

shuffleButton?.addEventListener('click', () => {
  const date = randomDateKey();
  previewCount = 0;
  closeCalendar();
  rebuild(date, date);
  syncTodayMode(date, date);
});

fullscreenButton?.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
  revealUi();
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

rotationPresetButton?.addEventListener('click', () => {
  const preset = rotationPresets[Math.floor(Math.random() * rotationPresets.length)];
  applyRoutePreset({
    ...preset,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: THREEClamp(preset.speed * (0.78 + Math.random() * 0.58), minRotationSpeed, maxRotationSpeed)
  });
  revealUi();
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
});

['pointermove', 'pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, revealUi, { passive: true });
});

window.addEventListener('beforeunload', () => scene.stop());
window.addEventListener('beforeunload', () => window.clearInterval(debugTimer));
window.addEventListener('beforeunload', () => window.clearTimeout(dateRolloverTimer));

setLabels();
renderAccountState();
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
revealUi();
scene.start();
