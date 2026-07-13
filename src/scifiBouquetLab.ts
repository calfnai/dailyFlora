import * as THREE from 'three';
import { floraPrimitiveFactories, type FloraPrimitiveName } from './floraPrimitives';
import { createRng } from './random';
import { createSciFiFlower, sciFiFlowerDefinitions, type SciFiFlowerDefinition, type SciFiFlowerId } from './scifiFlowerForms';

type ViewName = 'front' | 'side' | 'top';
type BouquetDefinition = {
  id: string;
  cn: string;
  en: string;
  brief: string;
  focus: SciFiFlowerId[];
  support: FloraPrimitiveName[];
  mood: string;
  density: number;
  height: number;
  spread: number;
};
type Preview = {
  definition: BouquetDefinition;
  cell: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid: THREE.GridHelper;
  yaw: number;
};

const presets: Record<string, string[]> = {
  '星云花火': ['#62f6ff', '#ff5fc8', '#f6ff6d', '#8d74ff', '#2ad49e'],
  '深空冷光': ['#65f4ff', '#8174ff', '#ff5ed2', '#dcff6b', '#365b58'],
  '酸性温室': ['#c6ff37', '#29e69b', '#ff7b38', '#fff06a', '#315a3d'],
  '量子珊瑚': ['#ff746c', '#ffb36b', '#e76bff', '#fff0c2', '#4e6574'],
  '黑金信号': ['#050504', '#17130c', '#d7b95f', '#7a6634', '#0d1311'],
  '晨雾异种': ['#e8fff5', '#9ad8ff', '#ff9fb8', '#d9ff9a', '#526b63']
};

const bouquetDefinitions: BouquetDefinition[] = [
  { id: 'orbital-collar', cn: '星云领口花束', en: 'Nebula Orbital Collar', brief: '星环脉冲做科幻主花，外圈由多种小花和发光信号枝打开，不再像被薄膜罩住的小束花。', focus: ['orbital-color-control'], support: ['CosmosOpenFlower', 'LayeredDahliaFlower', 'AirFiller', 'FruitPodCluster'], mood: 'wide orbital collar', density: 0.9, height: 1.0, spread: 1.22 },
  { id: 'signal-meadow', cn: '信号草甸花束', en: 'Signal Meadow Bouquet', brief: '用星环脉冲压住中心，外层用面花、伞状小簇和果点制造缤纷草甸感。', focus: ['orbital-color-control'], support: ['CosmosOpenFlower', 'UmbelMiniCluster', 'RuffledRoseFlower', 'BerryCluster'], mood: 'colorful signal meadow', density: 0.92, height: 0.98, spread: 1.3 },
  { id: 'halo-branch', cn: '光轨枝形花束', en: 'Halo Branch Bouquet', brief: '高低错落的草线枝条和星环主花形成外放轮廓，科幻感来自开放光轨，不来自塑料罩。', focus: ['orbital-color-control'], support: ['FoliageGrassBranch', 'AirFiller', 'TulipCupFlower', 'FruitPodCluster'], mood: 'open halo branches', density: 0.76, height: 1.28, spread: 1.28 },
  { id: 'orbital-fan', cn: '星环风车花束', en: 'Orbital Pinwheel Bouquet', brief: '用星形/风车型、郁金香杯形和发光花火拉成扇形，整体外轮廓更像一束真正展开的花。', focus: ['orbital-color-control'], support: ['StarPinwheelFlower', 'TulipCupFlower', 'CosmosOpenFlower', 'FoliageGrassBranch'], mood: 'radiant fan silhouette', density: 0.88, height: 1.0, spread: 1.36 },
  { id: 'dark-core-cloud', cn: '星云云团花束', en: 'Nebula Cloud Bouquet', brief: '云团、小面花和果点托住星环核心，形成饱满但有空气的科幻云团。', focus: ['orbital-color-control'], support: ['FullHydrangeaCloud', 'CosmosOpenFlower', 'LayeredRoundFlower', 'AirFiller'], mood: 'layered nebula cloud', density: 0.96, height: 0.98, spread: 1.08 },
  { id: 'comet-signal', cn: '彗尾信号花束', en: 'Comet Signal Bouquet', brief: '非对称彗尾由草线、果材和光点拉出，不再使用此前过丑的递归裂枝形态。', focus: ['orbital-color-control'], support: ['FoliageGrassBranch', 'HangingBellFruit', 'AirFiller', 'StarPinwheelFlower'], mood: 'asymmetric comet tail', density: 0.82, height: 1.18, spread: 1.44 },
  { id: 'orbital-orchid', cn: '星环兰形花束', en: 'Orbital Orchid Bouquet', brief: '蝴蝶兰、马蹄莲和星环脉冲形成异种花感，但外部仍保持花束的丰富层次。', focus: ['orbital-color-control'], support: ['OrchidButterflyFlower', 'CallaCurledBract', 'AirFiller', 'CosmosOpenFlower'], mood: 'alien floral orchid', density: 0.86, height: 1.08, spread: 1.16 },
  { id: 'approved-handful', cn: '星云手捧花', en: 'Nebula Handful Bouquet', brief: '全部使用已认可或较稳定的花型做入束测试，目标是缤纷、多样、科幻，而不是暗色小包花。', focus: ['orbital-color-control'], support: ['CosmosOpenFlower', 'UmbelMiniCluster', 'LayeredDahliaFlower', 'FoliageGrassBranch', 'BerryCluster'], mood: 'approved colorful mix', density: 1.0, height: 1.02, spread: 1.22 }
];

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const sciFiById = Object.fromEntries(sciFiFlowerDefinitions.map((definition) => [definition.id, definition])) as Record<SciFiFlowerId, SciFiFlowerDefinition>;

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

let palette = [...presets['星云花火']];
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

function colorAt(source: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(source[index % source.length] || fallback);
}

function material(color: THREE.Color | string, emissive = 0, opacity = 1) {
  const base = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: base,
    emissive: base,
    emissiveIntensity: emissive,
    roughness: emissive > 0 ? 0.32 : 0.78,
    metalness: emissive > 0 ? 0.16 : 0.02,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 0.72
  });
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: THREE.Color | string, emissive = 0) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.82, Math.max(0.001, direction.length()), 7), material(color, emissive));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function randomColor() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
}

function varyPalette(base: string[], rng: ReturnType<typeof createRng>) {
  return base.map((hex, index) => {
    const color = new THREE.Color(hex);
    if (index < 4) color.offsetHSL(rng.range(-0.035, 0.035), rng.range(-0.05, 0.08), rng.range(-0.04, 0.08));
    return `#${color.getHexString()}`;
  });
}

function silhouette(definition: BouquetDefinition) {
  if (definition.id === 'halo-branch') return { low: 0.48, high: 1.2, lift: 0.18, side: 0, fan: 0, tail: 0, cloud: 0.1 };
  if (definition.id === 'orbital-fan') return { low: 0.34, high: 1.04, lift: 0.08, side: 0, fan: 0.62, tail: 0, cloud: 0 };
  if (definition.id === 'comet-signal') return { low: 0.42, high: 1.24, lift: 0.1, side: -0.48, fan: 0, tail: 0.72, cloud: 0 };
  if (definition.id === 'dark-core-cloud') return { low: 0.18, high: 0.9, lift: -0.02, side: 0, fan: 0, tail: 0, cloud: 0.35 };
  if (definition.id === 'signal-meadow') return { low: 0.38, high: 1.16, lift: 0.03, side: 0, fan: 0.16, tail: 0, cloud: 0.05 };
  if (definition.id === 'orbital-orchid') return { low: 0.34, high: 1.08, lift: 0.14, side: 0.1, fan: 0.08, tail: 0, cloud: 0 };
  if (definition.id === 'approved-handful') return { low: 0.26, high: 1.04, lift: 0, side: 0, fan: 0.2, tail: 0, cloud: 0.18 };
  return { low: 0.28, high: 1.06, lift: 0.08, side: 0, fan: 0.12, tail: 0, cloud: 0 };
}

function bouquetPoint(definition: BouquetDefinition, rng: ReturnType<typeof createRng>, index: number, count: number) {
  const profile = silhouette(definition);
  const angleBase = index / count * Math.PI * 2;
  const fanOffset = Math.sin(index / Math.max(1, count - 1) * Math.PI - Math.PI / 2) * profile.fan;
  const angle = angleBase + fanOffset + rng.range(-0.42, 0.42);
  const outer = index % 4 === 0 ? profile.high + rng.range(-0.02, 0.18) : rng.range(profile.low, profile.high);
  const ring = Math.min(1.42, Math.max(0.12, outer));
  const x = Math.cos(angle) * ring * definition.spread + profile.side * Math.max(0, ring - 0.36);
  const z = Math.sin(angle) * ring * (0.48 + definition.spread * 0.26);
  const dome = Math.max(0, 1 - Math.abs(ring - profile.cloud) * 0.54);
  const tailLift = definition.id === 'comet-signal' && x < 0 ? Math.abs(x) * profile.tail : 0;
  const y = rng.range(-0.16, 0.62) + dome * 0.76 * definition.height + profile.lift + tailLift;
  return new THREE.Vector3(x, y, z);
}

function orientFlower(group: THREE.Group, point: THREE.Vector3, rng: ReturnType<typeof createRng>, sideLean = 0) {
  const outward = new THREE.Vector3(point.x * 0.46 + sideLean, point.y * 0.34 + 0.42, point.z + 1.08).normalize();
  group.quaternion.setFromUnitVectors(forward, outward.lengthSq() ? outward : forward);
  group.rotateZ(rng.range(0, Math.PI * 2));
  group.rotateX(rng.range(-0.16, 0.16));
}

function addSupportFlower(group: THREE.Group, definition: BouquetDefinition, primitive: FloraPrimitiveName, point: THREE.Vector3, seed: string, scale: number, rng: ReturnType<typeof createRng>) {
  const factory = floraPrimitiveFactories[primitive];
  const supportPalette = [
    palette[rng.range(0, 4) | 0],
    palette[(rng.range(1, 5) | 0) % palette.length],
    palette[3],
    palette[4]
  ];
  const support = factory({
    seed,
    position: point,
    scale,
    colorPalette: supportPalette,
    openness: rng.range(0.66, 0.92),
    density: rng.range(0.82, 1.08),
    curvature: primitive === 'FoliageGrassBranch' || primitive === 'SpikeFlower' ? 0.86 : 0.45,
    role: primitive === 'FoliageGrassBranch' || primitive === 'SpikeFlower' ? 'line' : 'filler'
  });
  if (primitive === 'SpikeFlower' || primitive === 'FoliageGrassBranch') {
    const target = point.clone().sub(new THREE.Vector3(0, -1.05, 0)).normalize();
    support.quaternion.setFromUnitVectors(up, target);
    support.rotateY(rng.range(-0.4, 0.4));
  } else {
    orientFlower(support, point, rng);
  }
  group.add(support);
  if (primitive === 'SpikeFlower') group.add(cylinderBetween(new THREE.Vector3(0, -1.05, 0), point.clone().setY(point.y - 0.35), 0.01, palette[4]));
  if (definition.id === 'rift-comet') support.position.x -= rng.range(0.08, 0.24);
}

function addSignalTrails(group: THREE.Group, definition: BouquetDefinition, rng: ReturnType<typeof createRng>) {
  const trailCount = definition.id === 'halo-branch' || definition.id === 'comet-signal' ? 9 : 6;
  for (let i = 0; i < trailCount; i += 1) {
    const angle = i / trailCount * Math.PI * 2 + rng.range(-0.22, 0.22);
    const radius = rng.range(0.62, 1.35) * definition.spread;
    const lean = definition.id === 'comet-signal' && i > trailCount * 0.45 ? -rng.range(0.45, 1.05) : 0;
    const start = new THREE.Vector3(0, -0.98, 0);
    const mid = new THREE.Vector3(Math.cos(angle) * radius * 0.56 + lean * 0.45, rng.range(0.18, 0.9) * definition.height, Math.sin(angle) * radius * 0.34);
    const end = new THREE.Vector3(Math.cos(angle + rng.range(-0.18, 0.18)) * radius + lean, rng.range(0.76, 1.56) * definition.height, Math.sin(angle) * radius * 0.62);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const color = colorAt(palette, i).lerp(colorAt(palette, 2), rng.range(0.18, 0.58));
    const trail = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, rng.range(0.006, 0.012), 6, false), material(color, 0.46, 0.68));
    group.add(trail);
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(rng.range(0.032, 0.058), 0), material(color, 0.72, 0.92));
    node.position.copy(end);
    node.rotation.set(rng.range(0, Math.PI), rng.range(0, Math.PI), rng.range(0, Math.PI));
    group.add(node);
  }
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.016, 8, 42), material(colorAt(palette, 3), 0.38, 0.86));
  tie.position.y = -0.98;
  tie.rotation.x = Math.PI / 2;
  group.add(tie);
}

function addParticles(group: THREE.Group, definition: BouquetDefinition, rng: ReturnType<typeof createRng>) {
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(90 * definition.density);
  for (let i = 0; i < count; i += 1) {
    const p = bouquetPoint(definition, rng, i, count);
    p.multiplyScalar(rng.range(0.9, 1.36));
    p.y += rng.range(-0.02, 0.36);
    if (definition.id === 'rift-comet' && rng.value() > 0.52) p.x -= rng.range(0.35, 0.92);
    positions.push(p.x, p.y, p.z);
    const color = colorAt(palette, rng.range(0, 4) | 0).lerp(colorAt(palette, 2), rng.range(0.12, 0.55));
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })));
}

function createBouquet(definition: BouquetDefinition) {
  const rng = createRng(`scifi-bouquet:${definition.id}:${palette.join('-')}`);
  const group = new THREE.Group();
  const flowerCount = Math.floor(8 + definition.density * 5);
  const tie = new THREE.Vector3(0, -1.05, 0);

  for (let i = 0; i < flowerCount; i += 1) {
    const flowerId = definition.focus[i % definition.focus.length];
    const flowerDefinition = sciFiById[flowerId];
    const point = bouquetPoint(definition, rng, i, flowerCount);
    if (definition.id === 'rift-comet' && i > flowerCount * 0.52) point.x -= rng.range(0.22, 0.74);
    const stemEnd = point.clone().lerp(tie, 0.14);
    group.add(cylinderBetween(tie, stemEnd, rng.range(0.008, 0.014), palette[4]));
    const flower = createSciFiFlower(flowerDefinition, varyPalette(palette, rng), `${definition.id}:${flowerId}:${i}`);
    const baseScale = flowerId === 'fractal-rift' ? 0.18 : flowerId === 'orbital-color-control' ? 0.24 : 0.2;
    flower.position.copy(point);
    flower.scale.setScalar(baseScale * rng.range(0.74, 1.12));
    orientFlower(flower, point, rng, definition.id === 'rift-comet' ? -0.28 : 0);
    group.add(flower);
  }

  const supportCount = Math.floor(18 + definition.density * 12);
  for (let i = 0; i < supportCount; i += 1) {
    const primitive = definition.support[i % definition.support.length];
    const point = bouquetPoint(definition, rng, i + flowerCount, supportCount + flowerCount);
    point.multiplyScalar(rng.range(0.86, 1.18));
    point.y -= rng.range(0.08, 0.28);
    addSupportFlower(group, definition, primitive, point, `${definition.id}:support:${primitive}:${i}`, rng.range(0.15, 0.28), rng);
  }

  addParticles(group, definition, rng);
  addSignalTrails(group, definition, rng);
  group.rotation.x = -0.08;
  group.scale.setScalar(1.02);
  return group;
}

function disposeModel(model: THREE.Group) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.InstancedMesh) && !(child instanceof THREE.Points) && !(child instanceof THREE.Line)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((item) => item.dispose());
  });
}

function renderLabels() {
  labels.innerHTML = bouquetDefinitions.map((definition, index) => `
    <article class="bouquet-cell" data-bouquet="${escapeHtml(definition.id)}">
      <div class="bouquet-copy">
        <div class="meta"><span>${String(index + 1).padStart(2, '0')}</span><span>${escapeHtml(definition.mood)}</span></div>
        <h3>${escapeHtml(definition.cn)}</h3>
        <p class="en">${escapeHtml(definition.en)}</p>
        <p>${escapeHtml(definition.brief)}</p>
        <p class="support">支撑花型：${definition.support.map((item) => escapeHtml(item)).join(' / ')}</p>
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

function countGeometry(model: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  model.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces * (child instanceof THREE.InstancedMesh ? child.count : 1));
    }
  });
  return { draws, triangles };
}

function buildModel(preview: Preview) {
  if (preview.model) {
    preview.scene.remove(preview.model);
    disposeModel(preview.model);
  }
  const model = createBouquet(preview.definition);
  model.rotation.y = preview.yaw;
  preview.model = model;
  preview.scene.add(model);
}

function updateStats() {
  const total = previews.reduce((sum, preview) => {
    const c = countGeometry(preview.model);
    return { draws: sum.draws + c.draws, triangles: sum.triangles + c.triangles };
  }, { draws: 0, triangles: 0 });
  stats.textContent = `1 canvas · ${previews.length} bouquets · draw ${total.draws} · tri ${total.triangles.toLocaleString()}`;
}

function initScenes() {
  const cells = Array.from(labels.querySelectorAll<HTMLElement>('.bouquet-cell'));
  bouquetDefinitions.forEach((definition, index) => {
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
  const name = button.dataset.preset || '星云花火';
  applyPalette(presets[name] || presets['深空冷光'], name);
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
applyPalette(presets['星云花火'], '星云花火');
updateLayout();
window.addEventListener('resize', updateLayout);
requestAnimationFrame(animate);
