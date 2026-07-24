import * as THREE from 'three';
import {
  createRealisticFlower,
  realisticFlowerDefinitions,
  type RealisticFlowerDefinition
} from './realisticFlowerForms';
import { realisticFlowerFoliageStatus, type PlantStemInstance } from './plantOwnership';
import { buildConfirmedFoliage } from './realisticLeafForms';

type ViewName = 'front' | 'side' | 'top';
type Preview = {
  definition: RealisticFlowerDefinition;
  cell: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid: THREE.GridHelper;
  yaw: number;
};

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Realistic Flower Lab could not find ${selector}.`);
  return element;
}

const stage = requiredElement<HTMLElement>('#realistic-stage');
const canvas = requiredElement<HTMLCanvasElement>('#realistic-canvas');
const labels = requiredElement<HTMLElement>('#realistic-labels');
const stats = requiredElement<HTMLOutputElement>('#lab-stats');
const silhouetteButton = requiredElement<HTMLButtonElement>('#silhouette-button');
const gridButton = requiredElement<HTMLButtonElement>('#grid-button');
const rotateButton = requiredElement<HTMLButtonElement>('#rotate-button');
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));
const pairingMode = document.body.dataset.labMode === 'leaf-member-pairing';
const displayedDefinitions = pairingMode
  ? realisticFlowerDefinitions.filter((definition) => realisticFlowerFoliageStatus[definition.id].status === 'confirmed')
  : realisticFlowerDefinitions;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.3));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const previews: Preview[] = [];
const calibratedFlowerIds = new Set([
  'delphinium', 'snapdragon', 'hyacinth', 'foxtail-lily',
  'liatris', 'lace-flower', 'babys-breath'
]);
const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f7f0e3', side: THREE.DoubleSide });
let activeView: ViewName = 'front';
let silhouetteMode = false;
let gridVisible = true;
let autoRotate = true;
let columns = 4;
let rowHeight = 300;
let lastTime = performance.now();
let dragging: Preview | null = null;
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
  labels.innerHTML = displayedDefinitions.map((definition, index) => {
    const foliage = realisticFlowerFoliageStatus[definition.id];
    return `
      <article class="cell" data-flower="${escapeHtml(definition.id)}" data-foliage-profile="${escapeHtml(foliage.foliageProfile)}" data-leaf-mode="${escapeHtml(foliage.leafMode)}">
        <div class="label">
          <div class="meta"><span>${String(index + 1).padStart(2, '0')} · ${escapeHtml(definition.category)}</span><span class="connected">${definition.frozen ? 'frozen' : 'connected'}</span></div>
          <h3>${escapeHtml(definition.cn)}</h3>
          <p class="en">${escapeHtml(definition.en)}</p>
          ${definition.scientificName ? `<p class="species">${escapeHtml(definition.scientificName)}</p>` : ''}
          <p class="desc">${escapeHtml(definition.description)}</p>
          ${definition.calibration ? `<p class="calibration">${escapeHtml(definition.calibration)}</p>` : ''}
          <p class="print">${escapeHtml(definition.printStructure)}</p>
          <p class="scope-note">foliageProfile: ${escapeHtml(foliage.foliageProfile)} · leafMode: ${escapeHtml(foliage.leafMode)} · leafArrangement: ${escapeHtml(foliage.leafArrangement)} · ${foliage.status === 'confirmed' ? '已按受控成员映射接入' : '后续需要独立研究'}</p>
          ${definition.scopeNote ? `<p class="scope-note">${escapeHtml(definition.scopeNote)}</p>` : ''}
        </div>
      </article>
    `;
  }).join('');
}

function modelScale(definition: RealisticFlowerDefinition) {
  if (calibratedFlowerIds.has(definition.id)) return definition.category === 'spike' ? 0.7 : 0.69;
  if (definition.category === 'spike') return 0.56;
  if (definition.category === 'cluster') return 0.62;
  if (definition.id === 'calla') return 0.68;
  if (definition.id === 'narcissus') return 0.62;
  return 0.64;
}

function setView(preview: Preview, view: ViewName) {
  const distance = calibratedFlowerIds.has(preview.definition.id)
    ? preview.definition.category === 'spike' ? 4.55 : 4.4
    : preview.definition.category === 'spike' ? 5.4 : 4.7;
  if (view === 'side') preview.camera.position.set(distance, 0.15, 0);
  else if (view === 'top') preview.camera.position.set(0, distance, 0.01);
  else preview.camera.position.set(0, 0.15, distance);
  preview.camera.lookAt(0, 0, 0);
}

function countGeometry(group: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  group.traverse((child) => {
    if (child instanceof THREE.InstancedMesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces * child.count);
    } else if (child instanceof THREE.Mesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces);
    }
  });
  return { draws, triangles };
}

function initScenes() {
  const cells = Array.from(labels.querySelectorAll<HTMLElement>('.cell'));
  let totalDraws = 0;
  let totalTriangles = 0;
  displayedDefinitions.forEach((definition, index) => {
    const cell = cells[index];
    if (!cell) return;
    const scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight('#fff4dc', '#182014', 1.95));
    const key = new THREE.DirectionalLight('#ffffff', 2.35);
    key.position.set(2.6, 3.4, 4.8);
    scene.add(key);
    const fill = new THREE.DirectionalLight('#d8e7ff', 0.7);
    fill.position.set(-3, 1.5, 2);
    scene.add(fill);

    const camera = new THREE.PerspectiveCamera(37, 1, 0.1, 30);
    const model = createRealisticFlower(definition, `realistic-lab:${definition.id}`);
    const foliageProfile = realisticFlowerFoliageStatus[definition.id];
    if (foliageProfile.leafMode === 'attached') {
      const labStem: PlantStemInstance = {
        stemId: `realistic-lab:${definition.id}:stem`,
        plantMemberId: definition.id,
        source: 'realistic-flower',
        curvePoints: [
          new THREE.Vector3(0, -1.08, 0),
          new THREE.Vector3(0.01, -0.72, 0),
          new THREE.Vector3(-0.01, -0.28, 0),
          new THREE.Vector3(0, 0.16, 0)
        ],
        ...foliageProfile
      };
      const foliage = buildConfirmedFoliage({
        stems: [labStem],
        seed: `realistic-lab:${definition.id}`,
        palette: [definition.palette[definition.palette.length - 1] ?? '#66854f', '#7d9b5c', '#58764a'],
        density: 1,
        context: 'realistic-lab'
      });
      model.add(foliage.object);
      model.userData.confirmedLeafCount = foliage.leaves.length;
    }
    model.scale.setScalar(modelScale(definition));
    model.position.x = 0;
    model.rotation.x = definition.category === 'spike' || definition.category === 'cluster' ? 0 : -0.58;
    scene.add(model);

    const grid = new THREE.GridHelper(3.15, 8, '#526153', '#293229');
    grid.position.set(0, -1.1, 0);
    grid.material.transparent = true;
    grid.material.opacity = 0.36;
    scene.add(grid);

    const preview: Preview = { definition, cell, scene, camera, model, grid, yaw: index * 0.13 };
    setView(preview, activeView);
    previews.push(preview);
    const counts = countGeometry(model);
    totalDraws += counts.draws;
    totalTriangles += counts.triangles;
  });
  stats.textContent = `1 canvas · ${previews.length} ${pairingMode ? 'confirmed pairings' : 'supported forms'} · draw ${totalDraws} · tri ${totalTriangles.toLocaleString()}`;
}

function updateLayout() {
  const width = stage.clientWidth;
  columns = pairingMode
    ? width >= 760 ? 2 : 1
    : width >= 1180 ? 3 : width >= 720 ? 2 : 1;
  rowHeight = columns === 1 ? 560 : pairingMode ? 430 : 340;
  const rows = Math.ceil(displayedDefinitions.length / columns);
  stage.style.height = `${rows * rowHeight}px`;
  labels.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
  labels.style.gridAutoRows = `${rowHeight}px`;
  renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
}

function previewViewport(preview: Preview, stageHeight: number) {
  const cellWidth = preview.cell.clientWidth;
  const cellHeight = preview.cell.clientHeight;
  const cellBottom = stageHeight - preview.cell.offsetTop - cellHeight;
  if (columns === 1) {
    const infoHeight = 220;
    return {
      left: preview.cell.offsetLeft,
      bottom: cellBottom + infoHeight,
      width: cellWidth,
      height: cellHeight - infoHeight
    };
  }

  const infoWidth = Math.min(210, Math.round(cellWidth * 0.44));
  return {
    left: preview.cell.offsetLeft,
    bottom: cellBottom,
    width: cellWidth - infoWidth - 20,
    height: cellHeight
  };
}

function previewAt(clientX: number, clientY: number) {
  return previews.find((preview) => {
    const rect = preview.cell.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
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
  if (!dragging) return;
  dragging.yaw = dragStartYaw + (event.clientX - dragStartX) * 0.012;
});
const stopDrag = (event: PointerEvent) => {
  dragging = null;
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
};
canvas.addEventListener('pointerup', stopDrag);
canvas.addEventListener('pointercancel', stopDrag);

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeView = (button.dataset.view || 'front') as ViewName;
    viewButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    previews.forEach((preview) => setView(preview, activeView));
  });
});
silhouetteButton.addEventListener('click', () => {
  silhouetteMode = !silhouetteMode;
  silhouetteButton.setAttribute('aria-pressed', String(silhouetteMode));
  previews.forEach((preview) => { preview.scene.overrideMaterial = silhouetteMode ? silhouetteMaterial : null; });
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
    const visibleRect = preview.cell.getBoundingClientRect();
    if (visibleRect.bottom < 0 || visibleRect.top > window.innerHeight) return;
    const { left, bottom, width, height } = previewViewport(preview, stageHeight);
    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    preview.camera.aspect = width / Math.max(1, height);
    preview.camera.updateProjectionMatrix();
    if (autoRotate && dragging !== preview) preview.yaw += delta * 0.16;
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
  labels.innerHTML = `<div class="label">偏写实花型 LAB 载入失败：${escapeHtml(error instanceof Error ? error.message : error)}</div>`;
  throw error;
}
