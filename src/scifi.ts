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

function revealChrome() {
  viewer.classList.remove('is-idle');
  window.clearTimeout(idleTimer);
  if (!palettePanel.hidden || dragging) return;
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
  const distance = zoom + (mobile ? 1.15 : 0);
  camera.position.set(mobile ? 0 : 0.18, mobile ? 0.12 : 0.16, distance);
  camera.lookAt(mobile ? 0 : 0.28, 0.05, 0);
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
  revealChrome();
});
paletteToggle.addEventListener('click', () => togglePalettePanel());
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
  if (event.key === 'Escape' && !palettePanel.hidden) togglePalettePanel(false);
});
['pointermove', 'touchstart', 'focusin'].forEach((eventName) => window.addEventListener(eventName, revealChrome, { passive: true }));
window.addEventListener('resize', () => { resize(); revealChrome(); });
window.addEventListener('beforeunload', () => disposeSciFiBouquet(model));

renderPaletteOptions();
rotateButton.setAttribute('aria-pressed', String(autoRotate));
resize();
rebuildModel();
revealChrome();
requestAnimationFrame(animate);
