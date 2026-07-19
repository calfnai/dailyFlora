import * as THREE from 'three';
import {
  countSciFiBouquetGeometry,
  createSciFiBouquet,
  disposeSciFiBouquet,
  sciFiBouquetDefinitions,
  sciFiFlowerById,
  sciFiPalettePresets,
  type SciFiBouquetDefinition
} from './scifiBouquets';

type ViewName = 'front' | 'side' | 'top';
type Preview = {
  definition: SciFiBouquetDefinition;
  cell: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid: THREE.GridHelper;
  yaw: number;
};

function required<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Sci-Fi Bouquet Lab could not find ${selector}.`);
  return element;
}

const stage = required<HTMLElement>('#bouquet-stage');
const canvas = required<HTMLCanvasElement>('#bouquet-canvas');
const labels = required<HTMLElement>('#bouquet-labels');
const stats = required<HTMLOutputElement>('#bouquet-stats');
const paletteName = required<HTMLOutputElement>('#palette-name');
const presetButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-preset]'));
const colorInputs = Array.from(document.querySelectorAll<HTMLInputElement>('[data-color-index]'));
const randomButton = required<HTMLButtonElement>('#random-palette');
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));
const gridButton = required<HTMLButtonElement>('#grid-button');
const rotateButton = required<HTMLButtonElement>('#rotate-button');

let palette = [...sciFiPalettePresets['晨雾异种']];
let activeView: ViewName = 'front';
let gridVisible = true;
let autoRotate = true;
let columns = 2;
let rowHeight = 370;
let lastTime = performance.now();
let dragging: Preview | null = null;
let dragStartX = 0;
let dragStartYaw = 0;
const previews: Preview[] = [];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function randomColor() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function renderLabels() {
  labels.innerHTML = sciFiBouquetDefinitions.map((definition, index) => `
    <article class="bouquet-cell" data-bouquet="${escapeHtml(definition.id)}">
      <div class="bouquet-copy">
        <div class="meta"><span>${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(definition.mood)}</span></div>
        <h3>${escapeHtml(definition.cn)}</h3>
        <p class="en">${escapeHtml(definition.en)}</p>
        <p>${escapeHtml(definition.brief)}</p>
        <p class="support">科幻主体：${definition.focus.map((item) => escapeHtml(sciFiFlowerById[item].cn)).join(' / ')}<br />少量支撑：${definition.support.map((item) => escapeHtml(item)).join(' / ')}</p>
      </div>
    </article>
  `).join('');
}

function setView(preview: Preview, view: ViewName) {
  const distance = 4.6;
  if (view === 'side') preview.camera.position.set(distance, 0.22, 0);
  else if (view === 'top') preview.camera.position.set(0, distance, 0.01);
  else preview.camera.position.set(0, 0.12, distance);
  preview.camera.lookAt(0, -0.04, 0);
}

function buildModel(preview: Preview) {
  if (preview.model) {
    preview.scene.remove(preview.model);
    disposeSciFiBouquet(preview.model);
  }
  const model = createSciFiBouquet(preview.definition, palette);
  model.rotation.y = preview.yaw;
  preview.model = model;
  preview.scene.add(model);
}

function updateStats() {
  const total = previews.reduce((sum, preview) => {
    const count = countSciFiBouquetGeometry(preview.model);
    return { draws: sum.draws + count.draws, triangles: sum.triangles + count.triangles };
  }, { draws: 0, triangles: 0 });
  stats.textContent = `1 canvas · ${previews.length} bouquets · draw ${total.draws} · tri ${total.triangles.toLocaleString()}`;
}

function initScenes() {
  const cells = Array.from(labels.querySelectorAll<HTMLElement>('.bouquet-cell'));
  sciFiBouquetDefinitions.forEach((definition, index) => {
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#f2fbff', '#151a24', 2.1));
    const key = new THREE.DirectionalLight('#ffffff', 2.7);
    key.position.set(2.4, 3.2, 4.8);
    scene.add(key);
    const rim = new THREE.DirectionalLight('#7cf9ff', 1.18);
    rim.position.set(-3, 0.6, 2);
    scene.add(rim);
    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 30);
    const grid = new THREE.GridHelper(3.6, 9, '#526153', '#26312c');
    grid.position.y = -1.18;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);
    const preview: Preview = { definition, cell: cells[index], scene, camera, model: new THREE.Group(), grid, yaw: index * 0.12 };
    buildModel(preview);
    setView(preview, activeView);
    previews.push(preview);
  });
  updateStats();
}

function applyPalette(next: string[], name: string) {
  palette = next.slice(0, 5);
  colorInputs.forEach((input, index) => { input.value = palette[index]; });
  previews.forEach((preview) => buildModel(preview));
  updateStats();
  paletteName.textContent = name;
  presetButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.preset === name)));
}

function updateLayout() {
  columns = stage.clientWidth >= 980 ? 2 : 1;
  rowHeight = columns === 1 ? 360 : 370;
  stage.style.height = `${Math.ceil(previews.length / columns) * rowHeight}px`;
  labels.style.gridTemplateColumns = `repeat(${columns},minmax(0,1fr))`;
  labels.style.gridAutoRows = `${rowHeight}px`;
  renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
}

presetButtons.forEach((button) => button.addEventListener('click', () => {
  const name = button.dataset.preset || '晨雾异种';
  applyPalette(sciFiPalettePresets[name] || sciFiPalettePresets['晨雾异种'], name);
}));
colorInputs.forEach((input) => input.addEventListener('input', () => applyPalette(colorInputs.map((item) => item.value), '用户自选')));
randomButton.addEventListener('click', () => applyPalette(Array.from({ length: 5 }, randomColor), '随机配色'));
viewButtons.forEach((button) => button.addEventListener('click', () => {
  activeView = (button.dataset.view || 'front') as ViewName;
  viewButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
  previews.forEach((preview) => setView(preview, activeView));
}));
gridButton.addEventListener('click', () => {
  gridVisible = !gridVisible;
  gridButton.setAttribute('aria-pressed', String(gridVisible));
  previews.forEach((preview) => { preview.grid.visible = gridVisible; });
});
rotateButton.addEventListener('click', () => {
  autoRotate = !autoRotate;
  rotateButton.setAttribute('aria-pressed', String(autoRotate));
});

function previewAt(x: number, y: number) {
  return previews.find((preview) => {
    const rect = preview.cell.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }) || null;
}

canvas.addEventListener('pointerdown', (event) => {
  dragging = previewAt(event.clientX, event.clientY);
  if (!dragging) return;
  dragStartX = event.clientX;
  dragStartYaw = dragging.yaw;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (dragging) dragging.yaw = dragStartYaw + (event.clientX - dragStartX) * 0.012;
});
const stopDrag = (event: PointerEvent) => {
  dragging = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
};
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);

function animate(time: number) {
  const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  const stageHeight = stage.clientHeight;
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  previews.forEach((preview) => {
    const visible = preview.cell.getBoundingClientRect();
    if (visible.bottom < 0 || visible.top > window.innerHeight) return;
    const left = preview.cell.offsetLeft;
    const bottom = stageHeight - preview.cell.offsetTop - preview.cell.clientHeight;
    const width = preview.cell.clientWidth;
    const height = preview.cell.clientHeight;
    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    preview.camera.aspect = width / Math.max(1, height);
    preview.camera.updateProjectionMatrix();
    if (autoRotate && dragging !== preview) preview.yaw += delta * 0.12;
    preview.model.rotation.y = preview.yaw;
    renderer.render(preview.scene, preview.camera);
  });
  renderer.setScissorTest(false);
  requestAnimationFrame(animate);
}

renderLabels();
initScenes();
applyPalette(sciFiPalettePresets['晨雾异种'], '晨雾异种');
updateLayout();
window.addEventListener('resize', updateLayout);
requestAnimationFrame(animate);
