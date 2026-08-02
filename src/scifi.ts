import * as THREE from 'three';
import './scifi.css';
import {
  countSciFiBouquetGeometry,
  createSciFiBouquet,
  disposeSciFiBouquet,
  sciFiBouquetDefinitions,
  sciFiFlowerById,
  sciFiPaletteOrder,
  sciFiPalettePresets
} from './scifiBouquets';
import {
  detectInitialLocale,
  formatTranslation,
  saveLocale,
  setupLocaleSwitcher,
  type Locale
} from './i18n/index';

function required<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`SciFi viewer could not find ${selector}.`);
  return element;
}

const viewer = required<HTMLElement>('#scifi-viewer');
const canvas = required<HTMLCanvasElement>('#scifi-canvas');
const bouquetIndex = required<HTMLElement>('#bouquet-index');
const paletteName = required<HTMLElement>('#palette-name');
const bouquetName = required<HTMLElement>('#bouquet-name');
const bouquetEn = required<HTMLElement>('#bouquet-en');
const bouquetBrief = required<HTMLElement>('#bouquet-brief');
const structureLine = required<HTMLElement>('#structure-line');
const previousButton = required<HTMLButtonElement>('#previous-button');
const nextButton = required<HTMLButtonElement>('#next-button');
const randomButton = required<HTMLButtonElement>('#random-button');
const rotateButton = required<HTMLButtonElement>('#rotate-button');
const fullscreenButton = required<HTMLButtonElement>('#fullscreen-button');
const paletteToggle = required<HTMLButtonElement>('#palette-toggle');
const palettePanel = required<HTMLElement>('#palette-panel');
const paletteOptions = required<HTMLElement>('#palette-options');
const indexMenu = required<HTMLElement>('#scifi-index-menu');
const indexToggle = required<HTMLButtonElement>('#scifi-index-toggle');
const indexPanel = required<HTMLElement>('#scifi-index-panel');
const viewToggle = required<HTMLButtonElement>('#scifi-view-toggle');
const viewPanel = required<HTMLElement>('#scifi-view-panel');
const zoomOutButton = required<HTMLButtonElement>('#zoom-out-button');
const zoomInButton = required<HTMLButtonElement>('#zoom-in-button');
const languageSwitcher = required<HTMLElement>('#scifi-language-switcher');

const sciFiCopy: Record<Locale, {
  index: string;
  view: string;
  close: string;
  palette: string;
  rotate: string;
  stopRotate: string;
  fullscreen: string;
  zoomOut: string;
  zoomIn: string;
  random: string;
}> = {
  en: { index: 'INDEX', view: 'VIEW', close: 'CLOSE', palette: 'PALETTE', rotate: 'ROTATE', stopRotate: 'STOP', fullscreen: 'FULLSCREEN', zoomOut: 'Zoom out', zoomIn: 'Zoom in', random: 'ANOTHER' },
  'zh-CN': { index: '索引', view: '观看', close: '收起', palette: '调色', rotate: '旋转', stopRotate: '停止', fullscreen: '全屏', zoomOut: '拉远', zoomIn: '拉近', random: '换一束' },
  es: { index: 'ÍNDICE', view: 'VISTA', close: 'CERRAR', palette: 'PALETA', rotate: 'GIRAR', stopRotate: 'PARAR', fullscreen: 'PANTALLA', zoomOut: 'Alejar', zoomIn: 'Acercar', random: 'OTRO' },
  fr: { index: 'INDEX', view: 'VUE', close: 'FERMER', palette: 'PALETTE', rotate: 'TOURNER', stopRotate: 'ARRÊTER', fullscreen: 'PLEIN ÉCRAN', zoomOut: 'Éloigner', zoomIn: 'Rapprocher', random: 'AUTRE' },
  pt: { index: 'ÍNDICE', view: 'VISTA', close: 'FECHAR', palette: 'PALETA', rotate: 'GIRAR', stopRotate: 'PARAR', fullscreen: 'TELA CHEIA', zoomOut: 'Afastar', zoomIn: 'Aproximar', random: 'OUTRO' },
  it: { index: 'INDICE', view: 'VISTA', close: 'CHIUDI', palette: 'PALETTE', rotate: 'RUOTA', stopRotate: 'FERMA', fullscreen: 'SCHERMO', zoomOut: 'Allontana', zoomIn: 'Avvicina', random: 'ALTRO' },
  ja: { index: 'INDEX', view: 'VIEW', close: '閉じる', palette: '配色', rotate: '回転', stopRotate: '停止', fullscreen: '全画面', zoomOut: '引く', zoomIn: '寄る', random: '別の花' }
};
let activeLocale = detectInitialLocale();

const params = new URLSearchParams(window.location.search);
const initialBouquetId = params.get('bouquet');
const initialPaletteName = params.get('palette');
const matchedBouquetIndex = initialBouquetId ? sciFiBouquetDefinitions.findIndex((item) => item.id === initialBouquetId) : -1;
let activeBouquetIndex = matchedBouquetIndex >= 0 ? matchedBouquetIndex : sciFiBouquetDefinitions.length - 1;
let activePaletteName = initialPaletteName && sciFiPalettePresets[initialPaletteName] ? initialPaletteName : '晨雾异种';
let activePalette = [...sciFiPalettePresets[activePaletteName]];
let model = new THREE.Group();
let autoRotate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let dragging = false;
let dragX = 0;
let dragY = 0;
let startYaw = 0;
let startPitch = -0.08;
let yaw = 0;
let pitch = -0.08;
let zoom = 4.45;
let idleTimer = 0;
let lastTime = performance.now();
let variant = 0;
const cameraTarget = new THREE.Vector3(0, 0.2, 0);
let cameraRadius = 2.2;

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight('#f5fff9', '#101719', 2.25));
const key = new THREE.DirectionalLight('#ffffff', 3.1);
key.position.set(2.8, 4.2, 5.2);
scene.add(key);
const rim = new THREE.DirectionalLight('#9ad8ff', 1.35);
rim.position.set(-4, 1.2, 2.4);
scene.add(rim);
const lower = new THREE.PointLight('#ff9fb8', 0.8, 8);
lower.position.set(1.2, -1.4, 2.4);
scene.add(lower);

const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 40);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setClearColor(0x000000, 0);

function hexToRgbParts(hex: string) {
  const color = new THREE.Color(hex);
  return `${Math.round(color.r * 255)} ${Math.round(color.g * 255)} ${Math.round(color.b * 255)}`;
}

function renderPaletteOptions() {
  paletteOptions.innerHTML = sciFiPaletteOrder.map((name, index) => `
    <button class="palette-option" type="button" data-palette="${name}" aria-pressed="${name === activePaletteName}">
      <span><span class="palette-rank">0${index + 1}</span> ${name}</span>
      <span class="palette-swatch" aria-hidden="true">${sciFiPalettePresets[name].slice(0, 4).map((color) => `<i style="--swatch:${color}"></i>`).join('')}</span>
    </button>
  `).join('');
  paletteOptions.querySelectorAll<HTMLButtonElement>('[data-palette]').forEach((button) => {
    button.addEventListener('click', () => setPalette(button.dataset.palette || '晨雾异种'));
  });
}

function updateUrl() {
  const next = new URL(window.location.href);
  next.searchParams.set('bouquet', sciFiBouquetDefinitions[activeBouquetIndex].id);
  if (activePaletteName === '晨雾异种') next.searchParams.delete('palette');
  else next.searchParams.set('palette', activePaletteName);
  window.history.replaceState({}, '', next);
}

function updateCaption() {
  const definition = sciFiBouquetDefinitions[activeBouquetIndex];
  bouquetIndex.textContent = `${String(activeBouquetIndex + 1).padStart(2, '0')} / ${String(sciFiBouquetDefinitions.length).padStart(2, '0')}`;
  paletteName.textContent = activePaletteName;
  bouquetName.textContent = definition.cn;
  bouquetEn.textContent = definition.en;
  bouquetBrief.textContent = definition.brief;
  structureLine.textContent = `科幻主体 · ${definition.focus.map((id) => sciFiFlowerById[id].cn).join(' / ')}`;
  document.title = `${definition.cn} · SciFi Flora`;
}

function rebuildModel() {
  scene.remove(model);
  disposeSciFiBouquet(model);
  const definition = sciFiBouquetDefinitions[activeBouquetIndex];
  model = createSciFiBouquet(definition, activePalette, String(variant));
  model.rotation.set(pitch, yaw, 0);
  scene.add(model);
  const bounds = new THREE.Box3().setFromObject(model);
  const sphere = bounds.getBoundingSphere(new THREE.Sphere());
  cameraTarget.copy(sphere.center);
  cameraTarget.x = THREE.MathUtils.clamp(cameraTarget.x, -0.18, 0.18);
  cameraTarget.y = THREE.MathUtils.clamp(cameraTarget.y + 0.04, -0.02, 0.46);
  cameraTarget.z = THREE.MathUtils.clamp(cameraTarget.z, -0.12, 0.12);
  cameraRadius = Math.max(1.9, sphere.radius);
  const geometry = countSciFiBouquetGeometry(model);
  canvas.setAttribute('aria-label', `${definition.cn}，${activePaletteName}配色，${geometry.triangles.toLocaleString()} 个三角形`);
  viewer.style.setProperty('--palette-glow', hexToRgbParts(activePalette[1] || activePalette[0]));
  updateCaption();
  updateUrl();
}

function setBouquet(index: number, nextVariant = variant) {
  activeBouquetIndex = (index + sciFiBouquetDefinitions.length) % sciFiBouquetDefinitions.length;
  variant = nextVariant;
  yaw = 0;
  pitch = -0.08;
  rebuildModel();
  revealChrome();
}

function setPalette(name: string) {
  if (!sciFiPalettePresets[name]) return;
  activePaletteName = name;
  activePalette = [...sciFiPalettePresets[name]];
  renderPaletteOptions();
  rebuildModel();
  revealChrome();
}

function togglePalettePanel(force?: boolean) {
  const open = force ?? palettePanel.hidden;
  palettePanel.hidden = !open;
  paletteToggle.setAttribute('aria-expanded', String(open));
  revealChrome();
}

function toggleIndexPanel(force?: boolean) {
  const open = force ?? indexPanel.hidden;
  indexPanel.hidden = !open;
  indexToggle.setAttribute('aria-expanded', String(open));
  if (open) toggleViewPanel(false);
  applySciFiLocale();
  revealChrome();
}

function toggleViewPanel(force?: boolean) {
  const open = force ?? viewPanel.hidden;
  viewPanel.hidden = !open;
  viewToggle.setAttribute('aria-expanded', String(open));
  if (open) toggleIndexPanel(false);
  applySciFiLocale();
  revealChrome();
}

function applySciFiLocale() {
  const copy = sciFiCopy[activeLocale];
  document.documentElement.lang = activeLocale;
  indexToggle.textContent = copy.index;
  viewToggle.textContent = viewPanel.hidden ? copy.view : copy.close;
  paletteToggle.textContent = copy.palette;
  rotateButton.textContent = autoRotate ? copy.stopRotate : copy.rotate;
  fullscreenButton.textContent = copy.fullscreen;
  randomButton.textContent = copy.random;
  zoomOutButton.setAttribute('aria-label', copy.zoomOut);
  zoomOutButton.title = copy.zoomOut;
  zoomInButton.setAttribute('aria-label', copy.zoomIn);
  zoomInButton.title = copy.zoomIn;
  document.querySelectorAll<HTMLElement>('[data-scifi-nav]').forEach((link) => {
    const key = link.dataset.scifiNav;
    if (key) link.textContent = formatTranslation(activeLocale, `common.${key}`);
  });
}

function revealChrome() {
  viewer.classList.remove('is-idle');
  window.clearTimeout(idleTimer);
  if (!palettePanel.hidden || !indexPanel.hidden || !viewPanel.hidden || dragging) return;
  idleTimer = window.setTimeout(() => viewer.classList.add('is-idle'), 4200);
}

function resize() {
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateCamera() {
  const mobile = window.innerWidth < 760;
  const aspectLift = window.innerHeight > window.innerWidth ? 0.1 : 0;
  const distance = Math.max(zoom, cameraRadius * (mobile ? 3.05 : 2.05)) + (mobile ? 0.9 : 0);
  camera.position.set(cameraTarget.x, cameraTarget.y + (mobile ? 0.04 : 0.02) + aspectLift, cameraTarget.z + distance);
  camera.lookAt(cameraTarget);
}

function animate(time: number) {
  const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  if (autoRotate && !dragging) yaw += delta * 0.12;
  model.rotation.x += (pitch - model.rotation.x) * 0.12;
  model.rotation.y = yaw;
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

previousButton.addEventListener('click', () => setBouquet(activeBouquetIndex - 1));
nextButton.addEventListener('click', () => setBouquet(activeBouquetIndex + 1));
randomButton.addEventListener('click', () => {
  let next = activeBouquetIndex;
  while (next === activeBouquetIndex && sciFiBouquetDefinitions.length > 1) next = Math.floor(Math.random() * sciFiBouquetDefinitions.length);
  setBouquet(next, variant + 1);
});
rotateButton.addEventListener('click', () => {
  autoRotate = !autoRotate;
  rotateButton.setAttribute('aria-pressed', String(autoRotate));
  applySciFiLocale();
  revealChrome();
});
paletteToggle.addEventListener('click', () => togglePalettePanel());
indexToggle.addEventListener('click', () => toggleIndexPanel());
viewToggle.addEventListener('click', () => toggleViewPanel());
zoomOutButton.addEventListener('click', () => {
  zoom = THREE.MathUtils.clamp(zoom + 0.3, 3.35, 6.2);
  revealChrome();
});
zoomInButton.addEventListener('click', () => {
  zoom = THREE.MathUtils.clamp(zoom - 0.3, 3.35, 6.2);
  revealChrome();
});
fullscreenButton.addEventListener('click', async () => {
  if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
  else await document.exitFullscreen();
  revealChrome();
});

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragX = event.clientX;
  dragY = event.clientY;
  startYaw = yaw;
  startPitch = pitch;
  canvas.setPointerCapture(event.pointerId);
  revealChrome();
});
canvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  yaw = startYaw + (event.clientX - dragX) * 0.009;
  pitch = THREE.MathUtils.clamp(startPitch + (event.clientY - dragY) * 0.0045, -0.5, 0.42);
});
const stopDrag = (event: PointerEvent) => {
  dragging = false;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  revealChrome();
};
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoom = THREE.MathUtils.clamp(zoom + event.deltaY * 0.0022, 3.35, 6.2);
  revealChrome();
}, { passive: false });

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') setBouquet(activeBouquetIndex - 1);
  if (event.key === 'ArrowRight') setBouquet(activeBouquetIndex + 1);
  if (event.key === ' ') {
    event.preventDefault();
    rotateButton.click();
  }
  if (event.key.toLowerCase() === 'f') fullscreenButton.click();
  if (event.key.toLowerCase() === 'o') toggleViewPanel();
  if (event.key === 'Escape') {
    if (!palettePanel.hidden) togglePalettePanel(false);
    if (!indexPanel.hidden) toggleIndexPanel(false);
    if (!viewPanel.hidden) toggleViewPanel(false);
  }
});
document.addEventListener('pointerdown', (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (!indexPanel.hidden && !indexMenu.contains(target)) toggleIndexPanel(false);
});
['pointermove', 'touchstart', 'focusin'].forEach((eventName) => window.addEventListener(eventName, revealChrome, { passive: true }));
window.addEventListener('resize', () => { resize(); revealChrome(); });
window.addEventListener('beforeunload', () => disposeSciFiBouquet(model));

renderPaletteOptions();
rotateButton.setAttribute('aria-pressed', String(autoRotate));
setupLocaleSwitcher(languageSwitcher, activeLocale, (locale) => {
  activeLocale = locale;
  saveLocale(locale);
  applySciFiLocale();
});
applySciFiLocale();
resize();
rebuildModel();
revealChrome();
requestAnimationFrame(animate);
