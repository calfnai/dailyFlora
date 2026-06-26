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
const reviewPanel = document.querySelector<HTMLElement>('#primitive-review');

if (!canvas || !labelLayer || !toggleLabels || !isolateSelect || !silhouetteButton || !gridButton || !statsPanel || !reviewPanel) {
  throw new Error('Primitive lab could not find the required page elements.');
}

const primitiveCanvas = canvas;
const primitiveLabelLayer = labelLayer;
const primitiveToggleLabels = toggleLabels;
const primitiveIsolateSelect = isolateSelect;
const primitiveSilhouetteButton = silhouetteButton;
const primitiveGridButton = gridButton;
const primitiveStatsPanel = statsPanel;
const primitiveReviewPanel = reviewPanel;

const primitiveNames: FloraPrimitiveName[] = [
  'DiskFlower',
  'CosmosOpenFlower',
  'LayeredDahliaFlower',
  'RuffledRoseFlower',
  'StarPinwheelFlower',
  'TulipCupFlower',
  'TrumpetThroatFlower',
  'DaturaTrumpetFlower',
  'OrchidButterflyFlower',
  'CallaCurledBract',
  'SpikeFlower',
  'UmbelMiniCluster',
  'FullHydrangeaCloud',
  'FruitPodCluster',
  'HangingBellFruit',
  'FoliageGrassBranch'
];

const palettes: Record<FloraPrimitiveName, string[]> = {
  DiskFlower: ['#fff8e7', '#f7edd2', '#f0c83a', '#7f8e3e'],
  CosmosOpenFlower: ['#fffdf2', '#f6efdc', '#f4cf2e', '#7f8e3e'],
  LayeredDahliaFlower: ['#f8c9d8', '#fff1f5', '#e7a7bb', '#86a762'],
  RuffledRoseFlower: ['#f8b9cf', '#fff3f6', '#e77da0', '#9bb36b'],
  LayeredRoseFlower: ['#ff9fbd', '#f6c1d2', '#f06b86', '#ffe2a9'],
  RuffledRoundFlower: ['#f7c6df', '#fff0f6', '#d66b9f', '#ffe4b8'],
  StarPinwheelFlower: ['#ff8b32', '#ffd15a', '#e9565d', '#7aa65a'],
  TulipCupFlower: ['#ffbf5a', '#fff0c2', '#f58aa2', '#5d8a55'],
  TrumpetThroatFlower: ['#fff9e8', '#ffffff', '#ffc847', '#f08b36'],
  DaturaTrumpetFlower: ['#ffffff', '#f2e3ff', '#8a5ab8', '#58783f'],
  OrchidButterflyFlower: ['#f8c8eb', '#fff6fb', '#e078b8', '#cc8b4f'],
  CallaCurledBract: ['#fff7df', '#f6e8b5', '#f2b84c', '#6c8b57'],
  LayeredRoundFlower: ['#ff9fbd', '#f6c1d2', '#f06b86', '#ffe2a9'],
  SpikeFlower: ['#8bb8ff', '#b699ff', '#d9d1ff', '#59775c'],
  OpenSculptureFlower: ['#fdf3d6', '#fff9ee', '#ffcf5a', '#d98254'],
  UmbelMiniCluster: ['#ffffff', '#fff6d8', '#e8f5ff', '#89a86a'],
  FullHydrangeaCloud: ['#c9eea8', '#e9ffd4', '#a9d981', '#f3ffe6'],
  HydrangeaCloudCluster: ['#b8d8ff', '#f2f4ff', '#9fc1ef', '#b8f0d2'],
  FruitPodCluster: ['#4566d9', '#273f91', '#bbd1ff', '#5f7a51'],
  HangingBellFruit: ['#ff9f26', '#ffd45d', '#78a55a', '#f7be45'],
  FoliageGrassBranch: ['#5f8f62', '#86b86f', '#c6d88a', '#2f573b'],
  ClusterFlower: ['#b8d8ff', '#f2f4ff', '#9fc1ef', '#b8f0d2'],
  BerryCluster: ['#4566d9', '#273f91', '#bbd1ff', '#5f7a51'],
  AirFiller: ['#ffffff', '#f8f0c8', '#d5e8ff', '#a4c998']
};

const reviewNotes: Partial<Record<FloraPrimitiveName, { status: string; note: string }>> = {
  LayeredDahliaFlower: {
    status: '2 与 3 太像：已拆分',
    note: '已改成细长尖瓣、多层放射的大丽花/团瓣方向，避免和褶皱玫瑰混成一个形。'
  },
  RuffledRoseFlower: {
    status: '3 与 2 太像：已拆分',
    note: '已改成宽瓣、内卷、柔软褶皱玫瑰方向，和 2 的放射尖瓣拉开。'
  },
  StarPinwheelFlower: {
    status: '4 比上一版差：回归/小修',
    note: '已回归更协调的结构，只缩小中心并收敛花瓣延伸；本轮花库验收已达到及格线。'
  },
  TulipCupFlower: {
    status: '5 重做',
    note: '已废弃球芯/花瓣桶方向，改为杯状、半闭合、勺形花瓣。'
  },
  TrumpetThroatFlower: {
    status: '6 方向可保留',
    note: '保留洋水仙管心方向，只小步强化外瓣和管心关系。'
  },
  DaturaTrumpetFlower: {
    status: '7 太像一个喇叭：重做',
    note: '已从单个喇叭物件改成五瓣外翻围出喉部；本轮花库验收已达到及格线。'
  },
  OrchidButterflyFlower: {
    status: '8 比例对，角度回调',
    note: '保留这次比例和花蕊，把花瓣角度往上上版更正确的方向回调。'
  },
  CallaCurledBract: {
    status: '9 接近，继续闭合卷曲',
    note: '沿当前角度拉长外圈卷曲部分，让单片苞片更接近闭合。'
  },
  SpikeFlower: {
    status: '10 回退为直立穗状',
    note: '已取消统一弯曲度，改回直立中轴，只保留极小随机偏移和小花错落。'
  },
  UmbelMiniCluster: {
    status: '11 需要 360 可看',
    note: '已调整小花面向角度，并增加花心，减少单面观察性。'
  },
  FruitPodCluster: {
    status: '13 球太大、密度不够',
    note: '已缩小果粒并增加枝端数量和密度。'
  },
  HangingBellFruit: {
    status: '14 重做',
    note: '已废弃胶囊体，改成悬垂灯笼/风铃果结构。'
  }
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
grid.position.y = -2.35;
scene.add(grid);

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f8f0df', side: THREE.DoubleSide });

const slots = primitiveNames.map((name, index) => {
  const col = index % 5;
  const row = Math.floor(index / 5);
  return {
    name,
    position: new THREE.Vector3((col - 2) * 1.78, 1.68 - row * 1.88, 0),
    scale: 0.58
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
    openness: ['OrchidButterflyFlower', 'TrumpetThroatFlower', 'DaturaTrumpetFlower', 'CallaCurledBract'].includes(slot.name) ? 0.95 : 0.68,
    density: ['UmbelMiniCluster', 'FullHydrangeaCloud', 'FoliageGrassBranch'].includes(slot.name) ? 1.08 : 0.92,
    curvature: ['SpikeFlower', 'FoliageGrassBranch', 'CallaCurledBract'].includes(slot.name) ? 0.85 : 0.42,
    role: ['DiskFlower', 'LayeredDahliaFlower', 'RuffledRoseFlower'].includes(slot.name) ? 'hero' : 'secondary'
  });
  group.rotation.x = ['DiskFlower', 'LayeredDahliaFlower', 'RuffledRoseFlower', 'StarPinwheelFlower', 'TrumpetThroatFlower'].includes(slot.name) ? -0.72 : 0;
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

function updateReviewPanel() {
  const selected = primitiveIsolateSelect.value as FloraPrimitiveName | 'all';
  if (selected === 'all') {
    primitiveReviewPanel.innerHTML = '<strong>花库验收已达及格线</strong><span>用户已确认 Primitive Gate 可以进入下一阶段；后续主视觉修改仍要同步 dashboard。</span>';
    return;
  }
  const note = reviewNotes[selected];
  primitiveReviewPanel.innerHTML = note
    ? `<strong>${note.status}</strong><span>${note.note}</span>`
    : '<strong>待用户验收</strong><span>当前类尚未收到本轮明确通过反馈。</span>';
}

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
  updateReviewPanel();
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
updateReviewPanel();
requestAnimationFrame(animate);
