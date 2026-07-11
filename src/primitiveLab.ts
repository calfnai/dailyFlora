import * as THREE from 'three';
import dashboardData from '../data/aesthetic-review-dashboard.json';
import { floraPrimitiveFactories, type FloraPrimitiveName } from './floraPrimitives';

type ViewName = 'front' | 'side' | 'top';

type ShapeEntry = {
  id: string;
  name: string;
  englishName: string;
  examples: string;
  whyNeeded: string;
};

type CandidateShapeEntry = ShapeEntry & {
  primitive: FloraPrimitiveName;
  status: string;
  source: string;
  acceptance: string;
  ownerNote: string;
};

type GateEntry = {
  primitive: string;
  status: string;
  acceptance: string;
};

type DisplayShape = {
  shape: ShapeEntry | CandidateShapeEntry;
  primitive: FloraPrimitiveName;
  candidate: boolean;
  indexLabel: string;
  statusLabel: string;
};

type PreviewScene = DisplayShape & {
  cell: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid: THREE.GridHelper;
  yaw: number;
};

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Primitive Lab could not find ${selector}.`);
  return element;
}

const stage = requiredElement<HTMLElement>('#gallery-stage');
const canvas = requiredElement<HTMLCanvasElement>('#primitive-canvas');
const labelLayer = requiredElement<HTMLElement>('#shape-labels');
const silhouetteButton = requiredElement<HTMLButtonElement>('#silhouette-button');
const gridButton = requiredElement<HTMLButtonElement>('#grid-button');
const rotateButton = requiredElement<HTMLButtonElement>('#rotate-button');
const statsPanel = requiredElement<HTMLOutputElement>('#primitive-stats');
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));

const targetPrimitiveByShapeId: Record<string, FloraPrimitiveName> = {
  'disk-face-flower': 'DiskFlower',
  'cosmos-open-face': 'CosmosOpenFlower',
  'layered-dahlia-form': 'LayeredDahliaFlower',
  'ruffled-rose-form': 'RuffledRoseFlower',
  'star-pinwheel-form': 'StarPinwheelFlower',
  'tulip-cup-form': 'TulipCupFlower',
  'trumpet-throat-form': 'TrumpetThroatFlower',
  'datura-trumpet-form': 'DaturaTrumpetFlower',
  'orchid-butterfly-form': 'OrchidButterflyFlower',
  'calla-curled-bract': 'CallaCurledBract',
  'spike-vertical-form': 'SpikeFlower',
  'umbel-mini-cluster': 'UmbelMiniCluster',
  'hydrangea-cloud-cluster': 'FullHydrangeaCloud',
  'fruit-pod-form': 'FruitPodCluster',
  'hanging-bell-fruit': 'HangingBellFruit',
  'foliage-grass-branch': 'FoliageGrassBranch'
};

const palettes: Partial<Record<FloraPrimitiveName, string[]>> = {
  DiskFlower: ['#fff8e7', '#f7edd2', '#f0c83a', '#7f8e3e'],
  CosmosOpenFlower: ['#fffdf2', '#f6efdc', '#f4cf2e', '#7f8e3e'],
  LayeredDahliaFlower: ['#f8c9d8', '#fff1f5', '#e7a7bb', '#86a762'],
  RuffledRoseFlower: ['#f8b9cf', '#fff3f6', '#e77da0', '#9bb36b'],
  StarPinwheelFlower: ['#ff8b32', '#ffd15a', '#e9565d', '#7aa65a'],
  TulipCupFlower: ['#ffbf5a', '#fff0c2', '#f58aa2', '#5d8a55'],
  TrumpetThroatFlower: ['#fff9e8', '#ffffff', '#ffc847', '#f08b36'],
  FrilledNarcissusFlower: ['#fff4c8', '#ffe8a7', '#f3b13e', '#ffd86a', '#78a66a'],
  DaturaTrumpetFlower: ['#ffffff', '#f2e3ff', '#8a5ab8', '#58783f'],
  OrchidButterflyFlower: ['#f8c8eb', '#fff6fb', '#e078b8', '#cc8b4f'],
  CallaCurledBract: ['#fff7df', '#f6e8b5', '#f2b84c', '#6c8b57'],
  SpikeFlower: ['#8bb8ff', '#b699ff', '#d9d1ff', '#59775c'],
  UmbelMiniCluster: ['#ffffff', '#fff6d8', '#e8f5ff', '#89a86a'],
  FullHydrangeaCloud: ['#c9eea8', '#e9ffd4', '#a9d981', '#f3ffe6'],
  FruitPodCluster: ['#4566d9', '#273f91', '#bbd1ff', '#5f7a51'],
  HangingBellFruit: ['#ff9f26', '#ffd45d', '#78a55a', '#f7be45'],
  FoliageGrassBranch: ['#5f8f62', '#86b86f', '#c6d88a', '#2f573b']
};

const faceForwardPrimitives: FloraPrimitiveName[] = [
  'DiskFlower',
  'CosmosOpenFlower',
  'LayeredDahliaFlower',
  'RuffledRoseFlower',
  'StarPinwheelFlower',
  'TrumpetThroatFlower',
  'FrilledNarcissusFlower'
];
const tallPrimitives: FloraPrimitiveName[] = ['SpikeFlower', 'FoliageGrassBranch'];
const openPrimitives: FloraPrimitiveName[] = [
  'OrchidButterflyFlower',
  'TrumpetThroatFlower',
  'FrilledNarcissusFlower',
  'DaturaTrumpetFlower',
  'CallaCurledBract'
];
const densePrimitives: FloraPrimitiveName[] = [
  'UmbelMiniCluster',
  'FullHydrangeaCloud',
  'FruitPodCluster',
  'FoliageGrassBranch'
];

const shapeEntries = dashboardData.targetShapeVocabulary as ShapeEntry[];
const candidateEntries = dashboardData.candidateShapeVocabulary as CandidateShapeEntry[];
const gateEntries = dashboardData.primitiveGate as GateEntry[];
const displayShapes: DisplayShape[] = [
  ...candidateEntries.map((shape, index) => ({
    shape,
    primitive: shape.primitive,
    candidate: true,
    indexLabel: `C${String(index + 1).padStart(2, '0')}`,
    statusLabel: 'candidate'
  })),
  ...shapeEntries.map((shape, index) => ({
    shape,
    primitive: targetPrimitiveByShapeId[shape.id],
    candidate: false,
    indexLabel: String(index + 1).padStart(2, '0'),
    statusLabel: gateEntries.find((item) => item.primitive === targetPrimitiveByShapeId[shape.id])?.status || 'pass'
  }))
];

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f7f0e3', side: THREE.DoubleSide });
const previews: PreviewScene[] = [];
let activeView: ViewName = 'front';
let silhouetteMode = false;
let gridVisible = true;
let autoRotate = true;
let columns = 3;
let rowHeight = 320;
let lastTime = performance.now();
let draggingPreview: PreviewScene | null = null;
let dragStartX = 0;
let dragStartYaw = 0;

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLabels() {
  labelLayer.innerHTML = displayShapes.map((item) => {
    const candidate = item.candidate ? item.shape as CandidateShapeEntry : null;
    const description = candidate
      ? '六片花被、褶边副冠、深喉、花蕊与绿色连接点；待用户确认后才登记。'
      : item.shape.examples;
    return `
      <article class="shape-cell${item.candidate ? ' is-candidate' : ''}" data-primitive="${escapeHtml(item.primitive)}">
        <div class="shape-copy">
          <div class="shape-index"><span>${escapeHtml(item.indexLabel)}</span><span class="shape-status">${escapeHtml(item.statusLabel)}</span></div>
          <h3>${escapeHtml(item.shape.name)}</h3>
          <p class="shape-english">${escapeHtml(item.shape.englishName)}</p>
          <p class="shape-description">${escapeHtml(description)}</p>
        </div>
      </article>
    `;
  }).join('');
}

function modelScale(primitive: FloraPrimitiveName) {
  if (primitive === 'FoliageGrassBranch') return 0.66;
  if (primitive === 'SpikeFlower') return 0.62;
  if (primitive === 'FrilledNarcissusFlower') return 0.68;
  if (primitive === 'HangingBellFruit') return 0.72;
  return 0.74;
}

function setCameraView(preview: PreviewScene, view: ViewName) {
  const distance = tallPrimitives.includes(preview.primitive) ? 5.1 : 4.35;
  if (view === 'side') preview.camera.position.set(distance, 0.2, 0);
  else if (view === 'top') preview.camera.position.set(0, distance + 0.25, 0.01);
  else preview.camera.position.set(0, 0.2, distance);
  preview.camera.lookAt(0, 0, 0);
}

function countGeometry(group: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  let points = 0;
  group.traverse((child) => {
    if (child instanceof THREE.InstancedMesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces * child.count);
    } else if (child instanceof THREE.Mesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces);
    } else if (child instanceof THREE.Line || child instanceof THREE.LineSegments) {
      draws += 1;
    } else if (child instanceof THREE.Points) {
      draws += 1;
      points += child.geometry.getAttribute('position')?.count ?? 0;
    }
  });
  return { draws, triangles, points };
}

function initScenes() {
  const cells = Array.from(labelLayer.querySelectorAll<HTMLElement>('.shape-cell'));
  let totalDraws = 0;
  let totalTriangles = 0;
  let totalPoints = 0;

  displayShapes.forEach((item, index) => {
    const factory = floraPrimitiveFactories[item.primitive];
    const cell = cells[index];
    if (!factory || !cell) return;

    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4dc', '#182014', 1.9));
    const key = new THREE.DirectionalLight('#ffffff', 2.25);
    key.position.set(2.2, 3.2, 4.6);
    scene.add(key);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    const model = factory({
      seed: `primitive-gallery:${item.primitive}`,
      position: new THREE.Vector3(-0.72, 0, 0),
      scale: modelScale(item.primitive),
      colorPalette: palettes[item.primitive] || ['#ffffff', '#f7d78a', '#80ad65', '#cc8b4f'],
      openness: openPrimitives.includes(item.primitive) ? 0.95 : 0.7,
      density: densePrimitives.includes(item.primitive) ? 1.08 : 0.92,
      curvature: ['SpikeFlower', 'FoliageGrassBranch', 'CallaCurledBract'].includes(item.primitive) ? 0.86 : 0.42,
      role: tallPrimitives.includes(item.primitive) ? 'line' : 'secondary'
    });
    model.rotation.x = faceForwardPrimitives.includes(item.primitive) ? -0.64 : item.primitive === 'FoliageGrassBranch' ? -0.34 : -0.1;
    if (item.primitive === 'FoliageGrassBranch') model.rotation.z = -0.38;
    scene.add(model);

    const grid = new THREE.GridHelper(3.2, 8, '#526153', '#2a342b');
    grid.position.set(-0.72, -1.12, 0);
    grid.material.transparent = true;
    grid.material.opacity = 0.38;
    scene.add(grid);

    const preview: PreviewScene = { ...item, cell, scene, camera, model, grid, yaw: index * 0.16 };
    setCameraView(preview, activeView);
    previews.push(preview);

    const counts = countGeometry(model);
    totalDraws += counts.draws;
    totalTriangles += counts.triangles;
    totalPoints += counts.points;
  });

  statsPanel.textContent = `1 canvas · ${previews.length} flowers · draw ${totalDraws} · tri ${totalTriangles.toLocaleString()} · pts ${totalPoints.toLocaleString()}`;
}

function updateLayout() {
  const width = stage.clientWidth;
  columns = width >= 1080 ? 3 : width >= 680 ? 2 : 1;
  rowHeight = columns === 1 ? 270 : 320;
  const rows = Math.ceil(displayShapes.length / columns);
  stage.style.height = `${rows * rowHeight}px`;
  labelLayer.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  labelLayer.style.gridAutoRows = `${rowHeight}px`;
  renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
  previews.forEach((preview) => {
    preview.model.position.x = columns === 1 ? -0.68 : -0.72;
    preview.grid.position.x = columns === 1 ? -0.68 : -0.72;
  });
}

function previewAtPoint(clientX: number, clientY: number) {
  return previews.find((preview) => {
    const rect = preview.cell.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }) || null;
}

canvas.addEventListener('pointerdown', (event) => {
  draggingPreview = previewAtPoint(event.clientX, event.clientY);
  if (!draggingPreview) return;
  dragStartX = event.clientX;
  dragStartYaw = draggingPreview.yaw;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!draggingPreview) return;
  draggingPreview.yaw = dragStartYaw + (event.clientX - dragStartX) * 0.012;
});

const stopDragging = (event: PointerEvent) => {
  draggingPreview = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
};
canvas.addEventListener('pointerup', stopDragging);
canvas.addEventListener('pointercancel', stopDragging);

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeView = (button.dataset.view || 'front') as ViewName;
    viewButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    previews.forEach((preview) => setCameraView(preview, activeView));
  });
});

silhouetteButton.addEventListener('click', () => {
  silhouetteMode = !silhouetteMode;
  silhouetteButton.setAttribute('aria-pressed', String(silhouetteMode));
  previews.forEach((preview) => {
    preview.scene.overrideMaterial = silhouetteMode ? silhouetteMaterial : null;
  });
});

gridButton.addEventListener('click', () => {
  gridVisible = !gridVisible;
  gridButton.setAttribute('aria-pressed', String(gridVisible));
  previews.forEach((preview) => { preview.grid.visible = gridVisible; });
});

rotateButton.addEventListener('click', () => {
  autoRotate = !autoRotate;
  rotateButton.setAttribute('aria-pressed', String(autoRotate));
});

function animate(time: number) {
  const delta = Math.min(0.05, Math.max(0, (time - lastTime) / 1000));
  lastTime = time;
  const stageHeight = stage.clientHeight;

  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);

  previews.forEach((preview) => {
    const viewportRect = preview.cell.getBoundingClientRect();
    if (viewportRect.bottom < 0 || viewportRect.top > window.innerHeight) return;
    const left = preview.cell.offsetLeft;
    const bottom = stageHeight - preview.cell.offsetTop - preview.cell.clientHeight;
    const width = preview.cell.clientWidth;
    const height = preview.cell.clientHeight;
    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    preview.camera.aspect = width / Math.max(1, height);
    preview.camera.updateProjectionMatrix();
    if (autoRotate && draggingPreview !== preview) preview.yaw += delta * 0.18;
    preview.model.rotation.y = preview.yaw;
    renderer.render(preview.scene, preview.camera);
  });

  renderer.setScissorTest(false);
  window.requestAnimationFrame(animate);
}

try {
  renderLabels();
  initScenes();
  updateLayout();
  window.addEventListener('resize', updateLayout);
  window.requestAnimationFrame(animate);
} catch (error) {
  labelLayer.innerHTML = `<div class="shape-copy">花库载入失败：${escapeHtml(error instanceof Error ? error.message : error)}</div>`;
  throw error;
}
