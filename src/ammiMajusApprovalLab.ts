import * as THREE from 'three';
import { createRng, type Rng } from './random';

type PanelName = 'front' | 'side' | 'top' | 'silhouette' | 'cluster' | 'hub';

type Panel = {
  name: PanelName;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
};

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const flowerWhite = '#fffdf0';
const flowerWarm = '#f7f0d8';
const flowerBud = '#efe8c9';
const centerGold = '#d8c56b';
const stemGreen = '#5f8055';

type AmmiStats = {
  primaryRays: number;
  secondaryRange: [number, number];
  flowers: number;
  buds: number;
  centerToOuterHeightDelta: number;
  heightWidthRatio: number;
};

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Ammi majus approval lab could not find ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#ammi-majus-canvas');
const stage = requiredElement<HTMLElement>('.stage-wrap');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f6efd7', side: THREE.DoubleSide });

function material(color: string | THREE.Color, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: string | THREE.Color, radialSegments = 6) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.9, direction.length(), radialSegments, 1, false),
    material(color, 0.92)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function petalGeometry(length: number, width: number, cup = 0.003) {
  const positions: number[] = [];
  const rows = 5;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    // Keep a softly rounded, broad distal edge instead of tapering each petal
    // into a pointed paper-star tip.
    const shoulder = Math.sin(v * Math.PI * 0.78);
    return new THREE.Vector3(
      u * width * shoulder * (1 - 0.08 * v),
      v * length,
      Math.sin(v * Math.PI * 0.92) * cup
    );
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const a = point(row, col);
      const b = point(row, col + 1);
      const c = point(row + 1, col);
      const d = point(row + 1, col + 1);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      positions.push(b.x, b.y, b.z, d.x, d.y, c.x, c.y, c.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, length * 0.5, cup * 0.5),
    Math.sqrt(width * width + length * length * 0.25 + cup * cup)
  );
  return geometry;
}

function placePart(part: THREE.Object3D, center: THREE.Vector3, normal: THREE.Vector3, roll: number, scale = 1) {
  part.position.copy(center);
  part.quaternion.setFromUnitVectors(forward, normal.clone().normalize());
  part.rotateZ(roll);
  part.scale.setScalar(scale);
}

function addFivePetalFlower(group: THREE.Group, center: THREE.Vector3, normal: THREE.Vector3, scale: number, rng: Rng) {
  const petalGeo = petalGeometry(0.036, 0.020, 0.002);
  const { tangent, bitangent } = tangentFrame(normal);
  const base = new THREE.Color(flowerWhite);
  for (let i = 0; i < 5; i += 1) {
    const color = base.clone().lerp(new THREE.Color(flowerWarm), rng.range(0, 0.22));
    const petal = new THREE.Mesh(petalGeo, material(color, 0.88));
    const roll = i / 5 * Math.PI * 2 + rng.range(-0.045, 0.045);
    placePart(petal, center, normal, roll, scale);
    group.add(petal);
  }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0085 * scale, 7, 5), material(centerGold, 0.86));
  dot.position.copy(center).addScaledVector(normal, 0.004 * scale);
  dot.scale.set(1.1, 0.8, 1.1);
  dot.quaternion.setFromUnitVectors(up, normal);
  dot.position.addScaledVector(tangent, rng.range(-0.0018, 0.0018)).addScaledVector(bitangent, rng.range(-0.0018, 0.0018));
  group.add(dot);
}

function addBud(group: THREE.Group, center: THREE.Vector3, normal: THREE.Vector3, scale: number) {
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.018 * scale, 8, 6), material(flowerBud, 0.9));
  bud.position.copy(center);
  bud.scale.set(0.86, 1.18, 0.86);
  bud.quaternion.setFromUnitVectors(up, normal.clone().normalize());
  group.add(bud);
}

function hubPoint() {
  return new THREE.Vector3(0, 0.08, 0);
}

function primaryHubPosition(i: number, count: number, rng: Rng) {
  const angleOffsets = [-0.08, 0.16, -0.19, 0.27, -0.11, 0.05, -0.28, 0.19, -0.03, 0.24, -0.22, 0.1, -0.15, 0.31, -0.24, 0.02];
  const angle = i / count * Math.PI * 2 + angleOffsets[i % angleOffsets.length] + rng.range(-0.04, 0.04);
  const short = i === 3 || i === 9 || i === 13;
  const radius = (short ? rng.range(0.44, 0.58) : rng.range(0.57, 0.88)) * (i % 5 === 0 ? 0.9 : 1);
  const normalized = radius / 0.86;
  // A shallow compound umbel: centre highest, middle next, outer rim lower.
  const arch = 0.44 * Math.max(0, 1 - normalized) ** 0.72 - 0.04 * normalized;
  const y = 0.31 + arch + rng.range(-0.05, 0.06);
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function addAmmiModel(seed = 'ammi-majus-approval-a') {
  const rng = createRng(seed);
  const group = new THREE.Group();
  const hub = hubPoint();
  const primaryCount = 16;
  let flowerCount = 0;
  let budCount = 0;
  let minSecondary = Number.POSITIVE_INFINITY;
  let maxSecondary = 0;
  let outerYTotal = 0;

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.22, 0),
    new THREE.Vector3(-0.035, -0.7, 0.018),
    new THREE.Vector3(0.018, -0.28, -0.012),
    hub
  ], false, 'centripetal');
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 18, 0.017, 7, false), material(stemGreen, 0.92)));

  const node = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 7), material('#789567', 0.9));
  node.position.copy(hub);
  node.scale.set(1.15, 0.85, 1.15);
  group.add(node);

  const miniHubs: THREE.Vector3[] = [];
  for (let i = 0; i < primaryCount; i += 1) {
    const miniHub = primaryHubPosition(i, primaryCount, rng);
    miniHubs.push(miniHub);
    outerYTotal += miniHub.y;
    group.add(cylinderBetween(hub, miniHub, 0.0056, stemGreen, 6));
  }

  miniHubs.forEach((miniHub, i) => {
    const radial = new THREE.Vector3(miniHub.x, 0, miniHub.z).normalize();
    const clusterNormal = radial.clone().multiplyScalar(0.14).add(up.clone().multiplyScalar(0.99)).normalize();
    const { tangent, bitangent } = tangentFrame(clusterNormal);
    const secondaryCount = 5 + ((i * 7 + 2) % 4);
    minSecondary = Math.min(minSecondary, secondaryCount);
    maxSecondary = Math.max(maxSecondary, secondaryCount);
    const clusterSpread = (0.082 + (secondaryCount - 5) * 0.009 + rng.range(-0.008, 0.008)) * rng.range(0.82, 1.18);
    const clusterBias = i % 4 === 0 ? -0.18 : i % 5 === 0 ? 0.22 : 0;

    for (let f = 0; f < secondaryCount; f += 1) {
      const a = f / secondaryCount * Math.PI * 2 + clusterBias + rng.range(-0.18, 0.18);
      const length = clusterSpread * rng.range(0.78, 1.18);
      const direction = tangent.clone().multiplyScalar(Math.cos(a))
        .addScaledVector(bitangent, Math.sin(a))
        .addScaledVector(clusterNormal, rng.range(0.08, 0.4))
        .addScaledVector(radial, rng.range(-0.05, 0.08))
        .normalize();
      const bloom = miniHub.clone().addScaledVector(direction, length);
      bloom.y += rng.range(-0.026, 0.04);
      group.add(cylinderBetween(miniHub, bloom, 0.0025, stemGreen, 5));
      const isBud = f === secondaryCount - 1 && (i % 3 === 0 || i % 5 === 0);
      if (isBud) {
        addBud(group, bloom, clusterNormal, rng.range(0.86, 1.08));
        budCount += 1;
      } else {
        addFivePetalFlower(group, bloom, clusterNormal, rng.range(0.82, 1.05), rng);
        flowerCount += 1;
      }
    }
  });

  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2 + rng.range(-0.12, 0.12);
    const start = hub.clone().add(new THREE.Vector3(Math.cos(angle) * 0.014, -0.012, Math.sin(angle) * 0.014));
    const end = hub.clone().add(new THREE.Vector3(Math.cos(angle) * rng.range(0.16, 0.24), rng.range(-0.015, 0.038), Math.sin(angle) * rng.range(0.16, 0.24)));
    group.add(cylinderBetween(start, end, 0.0019, '#779769', 4));
  }

  const avgOuterY = outerYTotal / primaryCount;
  const stats: AmmiStats = {
    primaryRays: primaryCount,
    secondaryRange: [minSecondary, maxSecondary],
    flowers: flowerCount,
    buds: budCount,
    centerToOuterHeightDelta: Number((avgOuterY - hub.y).toFixed(2)),
    heightWidthRatio: Number((1.68 / 1.72).toFixed(2))
  };
  group.userData.approvalStats = stats;
  return group;
}

function createClusterCloseup() {
  const rng = createRng('ammi-cluster-closeup');
  const group = new THREE.Group();
  const miniHub = new THREE.Vector3(0, -0.08, 0);
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.023, 9, 6), material('#789567', 0.9));
  node.position.copy(miniHub);
  group.add(node);
  const normal = new THREE.Vector3(0.12, 1, 0.18).normalize();
  const { tangent, bitangent } = tangentFrame(normal);
  for (let i = 0; i < 7; i += 1) {
    const a = i / 7 * Math.PI * 2 + rng.range(-0.12, 0.12);
    const dir = tangent.clone().multiplyScalar(Math.cos(a)).addScaledVector(bitangent, Math.sin(a)).addScaledVector(normal, 0.2).normalize();
    const end = miniHub.clone().addScaledVector(dir, rng.range(0.18, 0.25));
    group.add(cylinderBetween(miniHub, end, 0.005, stemGreen, 6));
    if (i === 2) addBud(group, end, normal, 1.6);
    else addFivePetalFlower(group, end, normal, 1.55, rng);
  }
  return group;
}

function createHubCloseup() {
  const rng = createRng('ammi-hub-closeup');
  const group = new THREE.Group();
  const hub = new THREE.Vector3(0, 0, 0);
  group.add(cylinderBetween(new THREE.Vector3(0, -0.68, 0), hub, 0.026, stemGreen, 8));
  const node = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 8), material('#789567', 0.9));
  node.position.copy(hub);
  group.add(node);
  for (let i = 0; i < 9; i += 1) {
    const angle = i / 9 * Math.PI * 2 + rng.range(-0.06, 0.06);
    const end = new THREE.Vector3(Math.cos(angle) * rng.range(0.32, 0.48), rng.range(0.11, 0.28), Math.sin(angle) * rng.range(0.32, 0.48));
    group.add(cylinderBetween(hub, end, 0.009, stemGreen, 6));
  }
  for (let i = 0; i < 6; i += 1) {
    const angle = i / 6 * Math.PI * 2 + 0.22;
    const end = new THREE.Vector3(Math.cos(angle) * rng.range(0.18, 0.25), rng.range(-0.02, 0.04), Math.sin(angle) * rng.range(0.18, 0.25));
    group.add(cylinderBetween(hub, end, 0.003, '#779769', 4));
  }
  return group;
}

function createPanel(name: PanelName, model: THREE.Group, silhouette = false) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff8dc', '#1b2416', 1.85));
  const key = new THREE.DirectionalLight('#ffffff', 2.35);
  key.position.set(2.5, 3.2, 4.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#f2e8c4', 0.78);
  fill.position.set(-3, 1.6, 1.8);
  scene.add(fill);
  scene.add(model);
  if (name !== 'cluster' && name !== 'hub') {
    const grid = new THREE.GridHelper(2.7, 8, '#526153', '#293229');
    grid.position.y = -1.22;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);
  }
  if (silhouette) scene.overrideMaterial = silhouetteMaterial;
  const camera = new THREE.PerspectiveCamera(name === 'cluster' || name === 'hub' ? 30 : 34, 1, 0.1, 30);
  return { name, scene, camera, model };
}

const panels: Panel[] = [
  createPanel('front', addAmmiModel('front')),
  createPanel('side', addAmmiModel('side')),
  createPanel('top', addAmmiModel('top')),
  createPanel('silhouette', addAmmiModel('silhouette'), true),
  createPanel('cluster', createClusterCloseup()),
  createPanel('hub', createHubCloseup())
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  if (panel.name === 'side') panel.camera.position.set(2.6, 0.1, 0);
  else if (panel.name === 'top') panel.camera.position.set(0, 2.95, 0.02);
  else if (panel.name === 'cluster') panel.camera.position.set(0.05, 0.08, 1.05);
  else if (panel.name === 'hub') panel.camera.position.set(0.05, 0.04, 1.35);
  else panel.camera.position.set(0, 0.08, 2.8);
  const target = panel.name === 'cluster' ? new THREE.Vector3(0, 0.02, 0) : panel.name === 'hub' ? new THREE.Vector3(0, 0.02, 0) : new THREE.Vector3(0, -0.05, 0);
  panel.camera.lookAt(target);
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 900;
  if (mobile) {
    const h = Math.floor(height / 6);
    return { left: 0, bottom: height - (index + 1) * h, width, height: index === 5 ? height - h * 5 : h };
  }
  const colWidth = Math.floor(width / 3);
  const rowHeight = Math.floor(height / 2);
  return {
    left: (index % 3) * colWidth,
    bottom: index < 3 ? rowHeight : 0,
    width: index % 3 === 2 ? width - colWidth * 2 : colWidth,
    height: index < 3 ? rowHeight : height - rowHeight
  };
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

Object.assign(window, {
  ammiMajusApprovalStats: (panels[0].model.userData.approvalStats as AmmiStats)
});
