import * as THREE from 'three';
import { createRng, type Rng } from './random';

type PanelName = 'front' | 'side' | 'top' | 'silhouette' | 'closeup';

type Panel = {
  name: PanelName;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
  grid?: THREE.GridHelper;
  silhouette?: boolean;
};

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Foxtail Lily approval lab could not find ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#foxtail-lily-canvas');
const stage = requiredElement<HTMLElement>('.stage-wrap');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f5dfb8', side: THREE.DoubleSide });

function material(color: string | THREE.Color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function axisPoint(y: number) {
  const t = (y + 1.55) / 3.1;
  return new THREE.Vector3(
    Math.sin(t * Math.PI * 1.35) * 0.018,
    y,
    Math.sin(t * Math.PI * 1.05 + 0.8) * 0.012
  );
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: string | THREE.Color, radialSegments = 8) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.9, direction.length(), radialSegments, 1, false),
    material(color, 0.9)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function tepalGeometry(length: number, width: number, cup: number, taper = 0.28) {
  const positions: number[] = [];
  const rows = 7;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const shoulder = Math.sin(v * Math.PI) ** 0.66;
    const narrowing = 1 - taper * v ** 1.8;
    return new THREE.Vector3(
      u * width * shoulder * narrowing,
      v * length,
      Math.sin(v * Math.PI) * cup - 0.012 * v * v
    );
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const a = point(row, col);
      const b = point(row, col + 1);
      const c = point(row + 1, col);
      const d = point(row + 1, col + 1);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      positions.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.9 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function placeFlowerPart(part: THREE.Object3D, center: THREE.Vector3, face: THREE.Vector3, roll: number, scale = 1) {
  part.position.copy(center);
  part.quaternion.setFromUnitVectors(forward, face.clone().normalize());
  part.rotateZ(roll);
  part.scale.setScalar(scale);
}

function paletteColor(index: number, rng: Rng, fade = 0) {
  const base = ['#f09a3f', '#f6b65a', '#ffd48a', '#ffdfaa'][index % 4];
  return new THREE.Color(base).lerp(new THREE.Color('#fff3d6'), rng.range(0.02, 0.12) + fade);
}

type StamenProfile = 'full' | 'reduced' | 'minimal';

function addCompleteFlower(
  group: THREE.Group,
  center: THREE.Vector3,
  face: THREE.Vector3,
  size: number,
  rng: Rng,
  stamenProfile: StamenProfile = 'full'
) {
  const { tangent, bitangent } = tangentFrame(face);
  const tepalGeo = tepalGeometry(0.19, 0.054, 0.018, 0.22);
  for (let i = 0; i < 6; i += 1) {
    const mesh = new THREE.Mesh(tepalGeo, material(paletteColor(i, rng), 0.8));
    placeFlowerPart(mesh, center, face, i / 6 * Math.PI * 2 + rng.range(-0.035, 0.035), size);
    group.add(mesh);
  }

  const ovary = new THREE.Mesh(new THREE.SphereGeometry(0.026 * size, 10, 7), material('#d6c66b', 0.86));
  ovary.position.copy(center).addScaledVector(face, 0.018 * size);
  ovary.scale.set(0.82, 1.05, 0.82);
  ovary.quaternion.setFromUnitVectors(up, face);
  group.add(ovary);

  const stamenCount = stamenProfile === 'full' ? 6 : stamenProfile === 'reduced' ? 3 : 2;
  const stamenLength = stamenProfile === 'full' ? 0.94 : stamenProfile === 'reduced' ? 0.56 : 0.42;
  const stamenSpread = stamenProfile === 'full' ? 0.94 : stamenProfile === 'reduced' ? 0.58 : 0.44;
  for (let i = 0; i < stamenCount; i += 1) {
    const angle = i / stamenCount * Math.PI * 2 + rng.range(-0.05, 0.05);
    const radial = tangent.clone().multiplyScalar(Math.cos(angle) * 0.012 * size)
      .addScaledVector(bitangent, Math.sin(angle) * 0.012 * size);
    const start = center.clone().add(radial).addScaledVector(face, 0.026 * size);
    const end = start.clone()
      .addScaledVector(face, rng.range(0.036, 0.052) * size * stamenLength)
      .addScaledVector(radial, rng.range(0.06, 0.11) * stamenSpread);
    group.add(cylinderBetween(start, end, 0.0018 * size, '#e7c567', 6));

    const anther = new THREE.Mesh(new THREE.SphereGeometry(0.0064 * size, 8, 5), material('#a96e30', 0.78));
    anther.position.copy(end);
    anther.scale.set(1.25, 0.75, 0.85);
    anther.quaternion.setFromUnitVectors(up, face);
    group.add(anther);
  }
}

function addSimpleFlower(group: THREE.Group, center: THREE.Vector3, face: THREE.Vector3, size: number, openness: number, rng: Rng) {
  const tepalGeo = tepalGeometry(0.14 + openness * 0.035, 0.041 + openness * 0.01, 0.022, 0.2);
  const petals = openness > 0.58 ? 6 : 4;
  for (let i = 0; i < petals; i += 1) {
    const mesh = new THREE.Mesh(tepalGeo, material(paletteColor(i, rng, 0.03), 0.82));
    placeFlowerPart(mesh, center, face, i / petals * Math.PI * 2 + rng.range(-0.04, 0.04), size * (0.78 + openness * 0.18));
    group.add(mesh);
  }
  const centerDot = new THREE.Mesh(new THREE.SphereGeometry(0.017 * size, 8, 5), material('#d9b65d', 0.88));
  centerDot.position.copy(center).addScaledVector(face, 0.015 * size);
  group.add(centerDot);
}

function addBud(group: THREE.Group, center: THREE.Vector3, face: THREE.Vector3, size: number, rng: Rng) {
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.052 * size, 10, 7), material(paletteColor(1, rng, 0.02), 0.84));
  bud.position.copy(center);
  bud.scale.set(0.72, 1.32, 0.72);
  bud.quaternion.setFromUnitVectors(up, face.clone().normalize());
  group.add(bud);
}

function attachBloom(
  group: THREE.Group,
  y: number,
  angle: number,
  radius: number,
  size: number,
  kind: 'complete' | 'simple' | 'bud',
  rng: Rng,
  openness = 1,
  stamenProfile: StamenProfile = 'full'
) {
  const source = axisPoint(y);
  const upward = kind === 'bud' ? 0.38 : kind === 'simple' ? 0.2 : 0.27;
  const face = new THREE.Vector3(Math.cos(angle), upward + rng.range(-0.025, 0.035), Math.sin(angle)).normalize();
  const pedicelEnd = source.clone().addScaledVector(face, radius);
  group.add(cylinderBetween(source, pedicelEnd, kind === 'complete' ? 0.006 : kind === 'simple' ? 0.0045 : 0.0036, '#5f7f4d', 6));
  if (kind === 'complete') addCompleteFlower(group, pedicelEnd, face, size, rng, stamenProfile);
  if (kind === 'simple') addSimpleFlower(group, pedicelEnd, face, size, openness, rng);
  if (kind === 'bud') addBud(group, pedicelEnd, face, size, rng);
}

function createFoxtailLilyApprovalModel(seed = 'foxtail-lily-approval-a') {
  const rng = createRng(seed);
  const group = new THREE.Group();
  const axisCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.64, 0),
    axisPoint(-0.7),
    axisPoint(0.22),
    axisPoint(1.06),
    new THREE.Vector3(0.006, 1.55, -0.002)
  ], false, 'centripetal');
  group.add(new THREE.Mesh(new THREE.TubeGeometry(axisCurve, 34, 0.018, 8, false), material('#5e7d4c', 0.92)));

  const frontAngles = [-0.18, 0.16, -0.46, 0.42, -0.72, 0.66, -0.05, 0.28, -0.34, 0.52, -0.62, 0.08, -0.22, 0.38, -0.5];
  for (let i = 0; i < 15; i += 1) {
    const p = i / 14;
    const y = -0.84 + p * 1.17 + rng.range(-0.025, 0.025);
    const sideAmount = Math.abs(frontAngles[i]);
    const stamenProfile: StamenProfile = sideAmount > 0.5 ? 'minimal' : sideAmount > 0.32 ? 'reduced' : 'full';
    const radius = (0.262 - p * 0.078 + rng.range(-0.009, 0.009)) * (i % 3 === 0 ? 0.87 : 0.92);
    const scale = rng.range(0.68, 0.78) + p * 0.035;
    attachBloom(group, y, Math.PI / 2 + frontAngles[i] * 0.78, radius, scale, 'complete', rng, 1, stamenProfile);
  }

  for (let i = 0; i < 24; i += 1) {
    const p = i / 23;
    const y = -0.6 + p * 1.72 + rng.range(-0.034, 0.034);
    const angle = i * 2.39996 + rng.range(-0.16, 0.16);
    const radius = (0.204 - p * 0.096 + rng.range(-0.008, 0.008)) * (i % 4 === 0 || i % 7 === 0 ? 0.86 : 0.94);
    const openness = 0.78 - p * 0.32 + rng.range(-0.04, 0.04);
    attachBloom(group, y, angle, radius, rng.range(0.76, 0.9) - p * 0.05, 'simple', rng, openness);
  }

  for (let i = 0; i < 24; i += 1) {
    const p = i / 23;
    const y = 0.72 + p * 0.8 + rng.range(-0.018, 0.018);
    const angle = i * 2.19 + rng.range(-0.12, 0.12);
    const radius = 0.09 - p * 0.055 + rng.range(-0.006, 0.006);
    attachBloom(group, y, angle, Math.max(0.025, radius), 0.72 - p * 0.25, 'bud', rng);
  }

  const lowerStem = cylinderBetween(new THREE.Vector3(0, -2.02, 0), new THREE.Vector3(0, -1.56, 0), 0.023, '#5a7a49', 8);
  group.add(lowerStem);
  group.userData.approvalCounts = { completeOpen: 15, simpleAndHalf: 24, buds: 24 };
  return group;
}

function createCompleteFlowerCloseup() {
  const rng = createRng('foxtail-lily-closeup');
  const group = new THREE.Group();
  const source = new THREE.Vector3(-0.52, -0.12, 0);
  const center = new THREE.Vector3(0, 0, 0.06);
  group.add(cylinderBetween(source, center, 0.012, '#5e7d4c', 8));
  addCompleteFlower(group, center, new THREE.Vector3(0.18, 0.2, 1).normalize(), 1.35, rng);
  return group;
}

function createPanel(name: PanelName, model: THREE.Group, silhouette = false) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff0d4', '#1b2416', 1.75));
  const key = new THREE.DirectionalLight('#ffffff', 2.4);
  key.position.set(2.5, 3.4, 4.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#ffd9a8', 0.68);
  fill.position.set(-3, 1.5, 1.8);
  scene.add(fill);
  scene.add(model);
  const grid = new THREE.GridHelper(2.7, 8, '#526153', '#293229');
  grid.position.y = -2.02;
  grid.material.transparent = true;
  grid.material.opacity = 0.32;
  if (name !== 'closeup') scene.add(grid);
  if (silhouette) scene.overrideMaterial = silhouetteMaterial;
  const camera = new THREE.PerspectiveCamera(name === 'closeup' ? 31 : 34, 1, 0.1, 30);
  return { name, scene, camera, model, grid, silhouette };
}

const panels: Panel[] = [
  createPanel('front', createFoxtailLilyApprovalModel('front')),
  createPanel('side', createFoxtailLilyApprovalModel('side')),
  createPanel('top', createFoxtailLilyApprovalModel('top')),
  createPanel('silhouette', createFoxtailLilyApprovalModel('silhouette'), true),
  createPanel('closeup', createCompleteFlowerCloseup())
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  if (panel.name === 'side') panel.camera.position.set(4.2, 0.02, 0);
  else if (panel.name === 'top') panel.camera.position.set(0, 4.8, 0.02);
  else if (panel.name === 'closeup') panel.camera.position.set(0.18, 0.1, 2.35);
  else panel.camera.position.set(0, 0.02, 4.45);
  panel.camera.lookAt(panel.name === 'closeup' ? new THREE.Vector3(0, 0, 0.08) : new THREE.Vector3(0, -0.1, 0));
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 900;
  if (mobile) {
    const h = Math.floor(height / 5);
    return { left: 0, bottom: height - (index + 1) * h, width, height: index === 4 ? height - h * 4 : h };
  }
  const colWidth = Math.floor(width / 3);
  const rowHeight = Math.floor(height / 2);
  if (index < 3) return { left: index * colWidth, bottom: rowHeight, width: index === 2 ? width - colWidth * 2 : colWidth, height: rowHeight };
  if (index === 3) return { left: 0, bottom: 0, width: colWidth, height: height - rowHeight };
  return { left: colWidth, bottom: 0, width: width - colWidth, height: height - rowHeight };
}

function render() {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height, false);
  renderer.clear();
  renderer.setScissorTest(true);
  panels.forEach((panel, index) => {
    const rect = panelRect(index, width, height);
    renderer.setViewport(rect.left, rect.bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, rect.bottom, rect.width, rect.height);
    setCamera(panel, rect.width, rect.height);
    renderer.render(panel.scene, panel.camera);
  });
  renderer.setScissorTest(false);
}

render();
window.addEventListener('resize', render);
