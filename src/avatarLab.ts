import * as THREE from 'three';
import { createRng, hashString } from './random';
import { floraPrimitiveFactories, type FloraPrimitiveName, type FloraPrimitiveRole } from './floraPrimitives';

type AvatarStyle = 'auto' | 'face' | 'cup' | 'cluster' | 'sculptural';

type AvatarRecipe = {
  seed: string;
  primitive: FloraPrimitiveName;
  palette: string[];
  background: string;
  ring: string;
  role: FloraPrimitiveRole;
  openness: number;
  density: number;
  curvature: number;
  tilt: number;
  rotationSpeed: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('#avatar-canvas');
const frame = document.querySelector<HTMLElement>('#avatar-frame');
const seedInput = document.querySelector<HTMLInputElement>('#avatar-seed');
const styleSelect = document.querySelector<HTMLSelectElement>('#avatar-style');
const renderButton = document.querySelector<HTMLButtonElement>('#render-avatar');
const randomButton = document.querySelector<HTMLButtonElement>('#random-avatar');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-avatar');
const avatarTitle = document.querySelector<HTMLElement>('#avatar-title');
const avatarMeta = document.querySelector<HTMLElement>('#avatar-meta');
const avatarGrid = document.querySelector<HTMLElement>('#avatar-grid');

if (!canvas || !frame || !seedInput || !styleSelect || !renderButton || !randomButton || !pauseButton || !avatarTitle || !avatarMeta || !avatarGrid) {
  throw new Error('DailyFlora Avatar Lab could not find the required page elements.');
}

const avatarCanvas = canvas;
const avatarFrame = frame;
const avatarSeedInput = seedInput;
const avatarStyleSelect = styleSelect;
const avatarRenderButton = renderButton;
const avatarRandomButton = randomButton;
const avatarPauseButton = pauseButton;
const avatarTitleLabel = avatarTitle;
const avatarMetaLabel = avatarMeta;
const avatarGridElement = avatarGrid;

const stylePrimitives: Record<Exclude<AvatarStyle, 'auto'>, FloraPrimitiveName[]> = {
  face: ['DiskFlower', 'CosmosOpenFlower', 'LayeredDahliaFlower', 'RuffledRoseFlower', 'StarPinwheelFlower'],
  cup: ['TulipCupFlower', 'TrumpetThroatFlower', 'DaturaTrumpetFlower', 'CallaCurledBract'],
  cluster: ['UmbelMiniCluster', 'FullHydrangeaCloud', 'FruitPodCluster', 'HangingBellFruit'],
  sculptural: ['OrchidButterflyFlower', 'SpikeFlower', 'LayeredRoseFlower', 'OpenSculptureFlower']
};

const allAvatarPrimitives: FloraPrimitiveName[] = [
  ...stylePrimitives.face,
  ...stylePrimitives.cup,
  ...stylePrimitives.cluster,
  ...stylePrimitives.sculptural
];

const paletteFamilies = [
  ['#fff7df', '#ffd86b', '#ff9f6a', '#7fbf6a'],
  ['#fff4f8', '#ff9fbd', '#d56f9d', '#9fd37f'],
  ['#f6efff', '#b99cff', '#7dc9ff', '#dce98d'],
  ['#f8fff0', '#bfe878', '#5fd0a0', '#fff2a8'],
  ['#fffaf0', '#ffcf5a', '#7fd7e8', '#ff8fab'],
  ['#f7f7ff', '#c7d7ff', '#8b82ff', '#f0d56e'],
  ['#fff6e7', '#f0a35f', '#f56f5e', '#91c874'],
  ['#efffff', '#8ee9d0', '#67b0ff', '#f8e781']
];

const backgrounds = ['#0b100d', '#0b0e16', '#11100a', '#0d1110', '#100d12', '#091113', '#11130b', '#0e0b10'];
const sampleSeeds = [
  'flora-0001',
  'leaf@dailyflora',
  'morning-user',
  'violet-studio',
  'sea-salt',
  'cosmos-42',
  'gardenia@example.com',
  'daily-bloom',
  'avatar-system',
  'wildflower',
  'moon-white',
  'lychee-rainbow'
];

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
camera.position.set(0, 0, 5.4);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({
  canvas: avatarCanvas,
  antialias: true,
  alpha: true,
  preserveDrawingBuffer: true
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight('#fff7de', '#162219', 2.1));
const keyLight = new THREE.DirectionalLight('#ffffff', 2.4);
keyLight.position.set(3.2, 4.2, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight('#d6fff0', 1.2);
rimLight.position.set(-3, 1.4, -2);
scene.add(rimLight);

const root = new THREE.Group();
scene.add(root);

const ringGroup = new THREE.Group();
scene.add(ringGroup);

let currentFlower: THREE.Group | null = null;
let currentRecipe = createRecipe(avatarSeedInput.value, 'auto');
let paused = false;

function hexFromHash(seed: string, offset: number) {
  const value = hashString(`${seed}:${offset}`).toString(16).padStart(8, '0');
  return `#${value.slice(0, 6)}`;
}

function pickPrimitive(seed: string, style: AvatarStyle) {
  const rng = createRng(`avatar-primitive:${seed}:${style}`);
  const source = style === 'auto' ? allAvatarPrimitives : stylePrimitives[style];
  return rng.pick(source);
}

function roleForPrimitive(primitive: FloraPrimitiveName): FloraPrimitiveRole {
  if (['UmbelMiniCluster', 'FullHydrangeaCloud'].includes(primitive)) return 'cluster';
  if (['FruitPodCluster', 'HangingBellFruit'].includes(primitive)) return 'fruit';
  if (['SpikeFlower'].includes(primitive)) return 'line';
  return 'hero';
}

function createRecipe(seed: string, style: AvatarStyle): AvatarRecipe {
  const rng = createRng(`dailyflora-avatar:${seed}:${style}`);
  const primitive = pickPrimitive(seed, style);
  const basePalette = rng.pick(paletteFamilies);
  const palette = basePalette.map((color, index) => {
    const mixed = new THREE.Color(color).lerp(new THREE.Color(hexFromHash(seed, index)), index === 0 ? 0.08 : 0.18);
    return `#${mixed.getHexString()}`;
  });
  return {
    seed,
    primitive,
    palette,
    background: rng.pick(backgrounds),
    ring: palette[1],
    role: roleForPrimitive(primitive),
    openness: rng.range(0.72, 0.98),
    density: rng.range(0.9, 1.16),
    curvature: rng.range(0.34, 0.9),
    tilt: rng.range(-0.5, 0.38),
    rotationSpeed: rng.range(0.0035, 0.008)
  };
}

function clearGroup(group: THREE.Group) {
  while (group.children.length) {
    const child = group.children.pop();
    if (!child) continue;
    child.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((item) => item?.dispose());
      }
    });
  }
}

function createRing(recipe: AvatarRecipe) {
  clearGroup(ringGroup);
  const outer = new THREE.Mesh(
    new THREE.TorusGeometry(1.58, 0.018, 10, 96),
    new THREE.MeshBasicMaterial({ color: recipe.ring, transparent: true, opacity: 0.62 })
  );
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(1.22, 0.008, 8, 80),
    new THREE.MeshBasicMaterial({ color: recipe.palette[0], transparent: true, opacity: 0.32 })
  );
  ringGroup.add(outer, inner);
  ringGroup.rotation.x = 0.18;
}

function fitFlowerToAvatar(group: THREE.Group) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const largestAxis = Math.max(size.x, size.y, size.z, 0.001);
  const fitScale = 2.32 / largestAxis;
  group.scale.multiplyScalar(fitScale);
  group.position.sub(center.multiplyScalar(fitScale));
  group.position.y += 0.04;
}

function rebuildAvatar(recipe: AvatarRecipe) {
  clearGroup(root);
  createRing(recipe);
  const factory = floraPrimitiveFactories[recipe.primitive];
  currentFlower = factory({
    seed: `avatar:${recipe.seed}:${recipe.primitive}`,
    position: new THREE.Vector3(0, -0.12, 0),
    scale: 1.18,
    colorPalette: recipe.palette,
    openness: recipe.openness,
    density: recipe.density,
    curvature: recipe.curvature,
    role: recipe.role
  });
  currentFlower.rotation.x = recipe.tilt;
  currentFlower.rotation.z = createRng(`avatar-z:${recipe.seed}`).range(-0.18, 0.18);
  root.add(currentFlower);
  fitFlowerToAvatar(currentFlower);
  avatarFrame.style.setProperty('--avatar-bg', recipe.background);
  avatarTitleLabel.textContent = recipe.seed;
  avatarMetaLabel.textContent = `${recipe.primitive} · ${recipe.palette.slice(0, 3).join(' / ')}`;
}

function resize() {
  const { clientWidth, clientHeight } = avatarCanvas;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / Math.max(1, clientHeight);
  camera.updateProjectionMatrix();
}

function animate(time: number) {
  resize();
  const seconds = time * 0.001;
  if (!paused) {
    root.rotation.y += currentRecipe.rotationSpeed;
    root.position.y = Math.sin(seconds * 1.2) * 0.035;
    ringGroup.rotation.z -= currentRecipe.rotationSpeed * 0.45;
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function renderSamples() {
  avatarGridElement.innerHTML = sampleSeeds.map((seed) => {
    const recipe = createRecipe(seed, 'auto');
    return `
      <button class="avatar-card" type="button" data-seed="${seed}" style="--chip-a: ${recipe.palette[0]}; --chip-b: ${recipe.background}; --chip-c: ${recipe.palette[1]};">
        <span class="avatar-chip" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 21c-2.4-3.3-5.8-6-5.8-10.1A5.8 5.8 0 0 1 12 5.1a5.8 5.8 0 0 1 5.8 5.8C17.8 15 14.4 17.7 12 21Zm0-8.2a2.1 2.1 0 1 0 0-4.2 2.1 2.1 0 0 0 0 4.2Z" /></svg>
        </span>
        <strong>${seed}</strong>
        <span>${recipe.primitive}</span>
      </button>
    `;
  }).join('');
}

function applyCurrentControls() {
  currentRecipe = createRecipe(avatarSeedInput.value.trim() || 'dailyflora-user', avatarStyleSelect.value as AvatarStyle);
  rebuildAvatar(currentRecipe);
}

avatarRenderButton.addEventListener('click', applyCurrentControls);

avatarSeedInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') applyCurrentControls();
});

avatarStyleSelect.addEventListener('change', applyCurrentControls);

avatarRandomButton.addEventListener('click', () => {
  avatarSeedInput.value = `flora-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`;
  applyCurrentControls();
});

avatarPauseButton.addEventListener('click', () => {
  paused = !paused;
  avatarPauseButton.setAttribute('aria-pressed', String(paused));
  avatarPauseButton.textContent = paused ? '继续旋转' : '暂停旋转';
});

avatarGridElement.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const card = target.closest<HTMLButtonElement>('[data-seed]');
  if (!card?.dataset.seed) return;
  avatarSeedInput.value = card.dataset.seed;
  avatarStyleSelect.value = 'auto';
  applyCurrentControls();
});

renderSamples();
rebuildAvatar(currentRecipe);
requestAnimationFrame(animate);
