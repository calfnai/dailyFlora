import * as THREE from 'three';
import {
  createRealisticFlower,
  realisticFlowerDefinitions,
  type RealisticFlowerDefinition
} from './realisticFlowerForms';

type PanelKind = 'front' | 'back' | 'side' | 'top' | 'perspective' | 'silhouette' | 'wireframe' | 'organ' | 'connection';
type Panel = {
  kind: PanelKind;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
};

const panelKinds: PanelKind[] = ['front', 'back', 'side', 'top', 'perspective', 'silhouette', 'wireframe', 'organ', 'connection'];
const labels: Record<PanelKind, [string, string]> = {
  front: ['正面', '花序轮廓、开放阶段'],
  back: ['背面', '花背与器官连接'],
  side: ['侧面', '物种关键侧视结构'],
  top: ['顶视', '绕轴分布与拥挤度'],
  perspective: ['透视', '整体物种识别'],
  silhouette: ['纯轮廓', '颜色不参与识别'],
  wireframe: ['线框', '曲面、裂片和连接'],
  organ: ['单花 / 花头特写', '器官数量与合生关系'],
  connection: ['连接特写', '主轴到花梗或花头']
};

const speciesConfig: Record<string, { cn: string; en: string; target: string; scale: number }> = {
  snapdragon: {
    cn: '金鱼草',
    en: 'Snapdragon · Antirrhinum majus',
    target: '合生花冠筒、二裂上唇、三裂下唇、隆起闭喉、五裂花萼',
    scale: 0.92
  },
  hyacinth: {
    cn: '风信子',
    en: 'Hyacinth · Hyacinthus orientalis',
    target: '短密圆柱花序、合生钟形花冠、六裂反卷、顶部花蕾',
    scale: 0.96
  },
  liatris: {
    cn: '蛇鞭菊',
    en: 'Liatris · Liatris spicata',
    target: '贴轴头状花序、管状盘花、短外伸花柱、顶部向下开放',
    scale: 0.96
  }
};

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Spike organ approval lab could not find ${selector}.`);
  return element;
}

const speciesId = document.body.dataset.species || '';
const config = speciesConfig[speciesId];
const definition = realisticFlowerDefinitions.find((item) => item.id === speciesId);
if (!config || !definition) throw new Error(`Unsupported approval species: ${speciesId}`);

requiredElement<HTMLElement>('[data-species-name]').textContent = config.cn;
requiredElement<HTMLElement>('[data-species-en]').textContent = config.en;
requiredElement<HTMLElement>('[data-species-target]').textContent = config.target;

const stage = requiredElement<HTMLElement>('.stage-wrap');
const canvas = requiredElement<HTMLCanvasElement>('#approval-canvas');
const cells = Array.from(document.querySelectorAll<HTMLElement>('.cell'));
const stats = requiredElement<HTMLOutputElement>('#approval-stats');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f4ead5', side: THREE.DoubleSide });
const wireframeMaterial = new THREE.MeshBasicMaterial({ color: '#b9d9ad', wireframe: true, side: THREE.DoubleSide });

function addLights(scene: THREE.Scene) {
  scene.add(new THREE.HemisphereLight('#fff4dc', '#172014', 1.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(2.7, 3.6, 4.6);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dce8ff', 0.66);
  fill.position.set(-3.2, 1.4, 1.8);
  scene.add(fill);
}

function cameraFor(kind: PanelKind, model: THREE.Group) {
  const camera = new THREE.PerspectiveCamera(kind === 'organ' || kind === 'connection' ? 27 : 36, 1, 0.03, 30);
  const distance = speciesId === 'hyacinth' ? 4.1 : 4.45;
  const target = new THREE.Vector3();
  if (kind === 'front' || kind === 'silhouette' || kind === 'wireframe') camera.position.set(0, 0.08, distance);
  if (kind === 'back') camera.position.set(0, 0.08, -distance);
  if (kind === 'side') camera.position.set(distance, 0.08, 0);
  if (kind === 'top') camera.position.set(0, speciesId === 'liatris' ? 2.15 : 2.75, 0.01);
  if (kind === 'perspective') camera.position.set(2.7, 1.7, 3.25);
  if (kind === 'organ' || kind === 'connection') {
    const stored = model.userData[kind === 'organ' ? 'approvalTarget' : 'connectionTarget'];
    const storedNormal = model.userData[kind === 'organ' ? 'approvalNormal' : 'connectionNormal'];
    if (stored instanceof THREE.Vector3) target.copy(stored).multiplyScalar(config.scale);
    const normal = storedNormal instanceof THREE.Vector3 ? storedNormal.clone().normalize() : new THREE.Vector3(0, 0, 1);
    let offset = normal.multiplyScalar(kind === 'organ' ? 0.58 : 0.64).addScaledVector(new THREE.Vector3(0, 1, 0), 0.12);
    if (speciesId === 'snapdragon' && kind === 'organ') {
      offset = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize().multiplyScalar(0.62).add(new THREE.Vector3(0, 0.1, 0));
    }
    if (speciesId === 'hyacinth' && kind === 'connection') {
      const tangent = new THREE.Vector3().crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize();
      offset = tangent.multiplyScalar(0.5).addScaledVector(normal, 0.28).add(new THREE.Vector3(0, 0.12, 0));
    }
    camera.position.copy(target).add(offset);
  }
  camera.lookAt(target);
  return camera;
}

function countGeometry(group: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    draws += 1;
    const faces = child.geometry.index
      ? child.geometry.index.count / 3
      : child.geometry.getAttribute('position').count / 3;
    triangles += Math.floor(faces * (child instanceof THREE.InstancedMesh ? child.count : 1));
  });
  return { draws, triangles };
}

function createPanel(kind: PanelKind, flower: RealisticFlowerDefinition) {
  const scene = new THREE.Scene();
  addLights(scene);
  const model = createRealisticFlower(flower, `approval:${speciesId}`);
  model.scale.setScalar(config.scale);
  scene.add(model);
  if (kind === 'silhouette') scene.overrideMaterial = silhouetteMaterial;
  if (kind === 'wireframe') scene.overrideMaterial = wireframeMaterial;
  if (!['top', 'organ', 'connection'].includes(kind)) {
    const grid = new THREE.GridHelper(3.1, 8, '#4d604c', '#283228');
    grid.position.y = -1.15;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    scene.add(grid);
  }
  return { kind, scene, camera: cameraFor(kind, model), model };
}

const panels: Panel[] = panelKinds.map((kind) => createPanel(kind, definition));
cells.forEach((cell, index) => {
  const kind = panelKinds[index];
  const [title, note] = labels[kind];
  cell.innerHTML = `<div class="label"><strong>${title}</strong><span>${note}</span></div>`;
});

const geometry = countGeometry(panels[0].model);
const audit = panels[0].model.userData.botanicalAudit as { connectedBlooms?: number; stages?: Record<string, number> } | undefined;
stats.textContent = `${geometry.draws} draw · ${geometry.triangles.toLocaleString()} tri · ${audit?.connectedBlooms ?? 0} connected · bud ${audit?.stages?.bud ?? 0} / half ${audit?.stages?.half ?? 0} / open ${audit?.stages?.open ?? 0}`;

function resize() {
  renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
}

function animate() {
  renderer.setScissorTest(false);
  renderer.clear();
  renderer.setScissorTest(true);
  const stageRect = stage.getBoundingClientRect();
  panels.forEach((panel, index) => {
    const cell = cells[index];
    const rect = cell.getBoundingClientRect();
    const left = rect.left - stageRect.left;
    const bottom = stageRect.bottom - rect.bottom;
    renderer.setViewport(left, bottom, rect.width, rect.height);
    renderer.setScissor(left, bottom, rect.width, rect.height);
    panel.camera.aspect = rect.width / Math.max(1, rect.height);
    panel.camera.updateProjectionMatrix();
    renderer.render(panel.scene, panel.camera);
  });
  requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
animate();
