import * as THREE from 'three';
import { floraPrimitiveFactories, type FloraPrimitiveName } from './floraPrimitives';

const canvas = document.querySelector<HTMLCanvasElement>('#primitive-canvas');
const labelLayer = document.querySelector<HTMLElement>('#primitive-labels');
const toggleLabels = document.querySelector<HTMLButtonElement>('#toggle-labels');
const isolateSelect = document.querySelector<HTMLSelectElement>('#isolate-primitive');
const viewButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-view]'));
const silhouetteButton = document.querySelector<HTMLButtonElement>('#silhouette-button');
const gridButton = document.querySelector<HTMLButtonElement>('#grid-button');
const statsPanel = document.querySelector<HTMLElement>('#primitive-stats');

if (!canvas || !labelLayer || !toggleLabels || !isolateSelect || !silhouetteButton || !gridButton || !statsPanel) {
  throw new Error('Primitive lab could not find the required page elements.');
}

const primitiveCanvas = canvas;
const primitiveLabelLayer = labelLayer;
const primitiveToggleLabels = toggleLabels;
const primitiveIsolateSelect = isolateSelect;
const primitiveSilhouetteButton = silhouetteButton;
const primitiveGridButton = gridButton;
const primitiveStatsPanel = statsPanel;

const primitiveNames: FloraPrimitiveName[] = [
  'DiskFlower',
  'LayeredRoundFlower',
  'SpikeFlower',
  'OpenSculptureFlower',
  'ClusterFlower',
  'BerryCluster',
  'AirFiller'
];

const palettes: Record<FloraPrimitiveName, string[]> = {
  DiskFlower: ['#fff8e7', '#f7edd2', '#f0c83a', '#7f8e3e'],
  LayeredRoundFlower: ['#ff9fbd', '#f6c1d2', '#f06b86', '#ffe2a9'],
  SpikeFlower: ['#8bb8ff', '#b699ff', '#d9d1ff', '#59775c'],
  OpenSculptureFlower: ['#fdf3d6', '#fff9ee', '#ffcf5a', '#d98254'],
  ClusterFlower: ['#b8d8ff', '#f2f4ff', '#9fc1ef', '#b8f0d2'],
  BerryCluster: ['#4566d9', '#273f91', '#bbd1ff', '#5f7a51'],
  AirFiller: ['#ffffff', '#f8f0c8', '#d5e8ff', '#a4c998']
};

const scene = new THREE.Scene();
scene.background = new THREE.Color('#070907');

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 3.7, 9.8);
camera.lookAt(0, 0.2, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight('#fff4d8', '#16241b', 1.8));
const keyLight = new THREE.DirectionalLight('#ffffff', 2.1);
keyLight.position.set(2.8, 4.6, 5);
scene.add(keyLight);

const root = new THREE.Group();
scene.add(root);
const grid = new THREE.GridHelper(9, 18, '#354236', '#1d2a20');
grid.position.y = -2.08;
scene.add(grid);

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f8f0df', side: THREE.DoubleSide });

const slots = primitiveNames.map((name, index) => {
  const col = index % 4;
  const row = Math.floor(index / 4);
  return {
    name,
    position: new THREE.Vector3((col - 1.5) * 2.25, row === 0 ? 1.08 : -1.38, 0),
    scale: row === 0 ? 0.82 : 0.9
  };
});

const rotatingGroups: THREE.Group[] = [];
const groupByName = new Map<FloraPrimitiveName, THREE.Group>();

for (const slot of slots) {
  const factory = floraPrimitiveFactories[slot.name];
  const group = factory({
    seed: `primitive-lab:${slot.name}`,
    position: slot.position,
    scale: slot.scale,
    colorPalette: palettes[slot.name],
    openness: slot.name === 'OpenSculptureFlower' ? 0.95 : 0.68,
    density: slot.name === 'AirFiller' || slot.name === 'ClusterFlower' ? 1.08 : 0.92,
    curvature: slot.name === 'SpikeFlower' || slot.name === 'AirFiller' ? 0.85 : 0.42,
    role: slot.name === 'DiskFlower' || slot.name === 'LayeredRoundFlower' ? 'hero' : 'secondary'
  });
  group.rotation.x = slot.name === 'DiskFlower' || slot.name === 'LayeredRoundFlower' ? -0.72 : 0;
  root.add(group);
  rotatingGroups.push(group);
  groupByName.set(slot.name, group);
}

primitiveLabelLayer.innerHTML = primitiveNames
  .map((name) => `<span class="primitive-label" data-name="${name}">${name}</span>`)
  .join('');

primitiveIsolateSelect.innerHTML = [
  '<option value="all">全部</option>',
  ...primitiveNames.map((name) => `<option value="${name}">${name}</option>`)
].join('');

let labelsVisible = false;
primitiveLabelLayer.classList.add('is-hidden');
primitiveToggleLabels.setAttribute('aria-pressed', 'false');
let silhouetteMode = false;
let gridVisible = true;

primitiveToggleLabels.addEventListener('click', () => {
  labelsVisible = !labelsVisible;
  primitiveLabelLayer.classList.toggle('is-hidden', !labelsVisible);
  primitiveToggleLabels.setAttribute('aria-pressed', String(labelsVisible));
});

primitiveIsolateSelect.addEventListener('change', () => {
  const selected = primitiveIsolateSelect.value;
  groupByName.forEach((group, name) => {
    group.visible = selected === 'all' || selected === name;
  });
});

primitiveSilhouetteButton.addEventListener('click', () => {
  silhouetteMode = !silhouetteMode;
  scene.overrideMaterial = silhouetteMode ? silhouetteMaterial : null;
  primitiveSilhouetteButton.setAttribute('aria-pressed', String(silhouetteMode));
});

primitiveGridButton.addEventListener('click', () => {
  gridVisible = !gridVisible;
  grid.visible = gridVisible;
  primitiveGridButton.setAttribute('aria-pressed', String(gridVisible));
});

viewButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const view = button.dataset.view;
    if (view === 'front') {
      camera.position.set(0, 3.7, 9.8);
      root.rotation.set(0, 0, 0);
    } else if (view === 'side') {
      camera.position.set(9.2, 3.5, 0);
      root.rotation.set(0, 0, 0);
    } else if (view === 'top') {
      camera.position.set(0, 10.4, 0.01);
      root.rotation.set(0, 0, 0);
    }
    camera.lookAt(0, 0.1, 0);
  });
});

let dragStartX = 0;
let rootStartY = 0;
let dragging = false;

primitiveCanvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragStartX = event.clientX;
  rootStartY = root.rotation.y;
  primitiveCanvas.setPointerCapture(event.pointerId);
});

primitiveCanvas.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  root.rotation.y = rootStartY + (event.clientX - dragStartX) * 0.006;
});

primitiveCanvas.addEventListener('pointerup', () => {
  dragging = false;
});

function resize() {
  const { clientWidth, clientHeight } = primitiveCanvas;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / Math.max(1, clientHeight);
  camera.updateProjectionMatrix();
}

function countSceneStats() {
  let drawCalls = 0;
  let triangles = 0;
  let particles = 0;
  groupByName.forEach((group) => {
    if (!group.visible) return;
    group.traverse((child) => {
      if (!child.visible) return;
    if (child instanceof THREE.InstancedMesh) {
      drawCalls += 1;
      const position = child.geometry.getAttribute('position');
      triangles += Math.floor(position.count / 3) * child.count;
    } else if (child instanceof THREE.Mesh) {
      drawCalls += 1;
      const position = child.geometry.getAttribute('position');
      triangles += Math.floor(position.count / 3);
    } else if (child instanceof THREE.LineSegments) {
      drawCalls += 1;
    } else if (child instanceof THREE.Points) {
      drawCalls += 1;
      particles += child.geometry.getAttribute('position')?.count ?? 0;
    }
    });
  });
  primitiveStatsPanel.textContent = `draw ${drawCalls} · tri ${triangles.toLocaleString()} · pts ${particles.toLocaleString()}`;
}

function animate(time: number) {
  resize();
  const seconds = time * 0.001;
  rotatingGroups.forEach((group, index) => {
    if (!group.visible) return;
    group.rotation.y += 0.004 + index * 0.00025;
    group.position.y += Math.sin(seconds * 0.8 + index) * 0.0008;
  });
  countSceneStats();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

resize();
requestAnimationFrame(animate);
