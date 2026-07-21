import * as THREE from 'three';
import { createRng, type Rng } from './random';

type ViewName = 'front' | 'side' | 'top';
type Variant = 'current' | 'rebuilt';
type Segment = { start: THREE.Vector3; end: THREE.Vector3; radius: number };
type Bloom = { position: THREE.Vector3; normal: THREE.Vector3; scale: number; bud: boolean };
type Panel = { variant: Variant; view: ViewName; scene: THREE.Scene; camera: THREE.PerspectiveCamera; model: THREE.Group };

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const temp = new THREE.Object3D();
const stemGreen = new THREE.Color('#58784f');
const flowerWhite = new THREE.Color('#fffdf0');
const flowerWarm = new THREE.Color('#f3ebd0');
const centerGold = new THREE.Color('#d5c26b');

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Ammi majus comparison LAB could not find ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#ammi-comparison-canvas');
const stage = requiredElement<HTMLElement>('.stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

function material(color: THREE.Color | string, roughness = 0.93) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function stemAlong(points: THREE.Vector3[], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 18, radius, 7, false), material(stemGreen, 0.96));
}

function cylinderInstances(count: number, radiusSegments = 6) {
  return new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.78, 1, 1, radiusSegments, 1, false),
    material(stemGreen, 0.96),
    count
  );
}

function setCylinder(mesh: THREE.InstancedMesh, index: number, segment: Segment) {
  const direction = segment.end.clone().sub(segment.start);
  temp.position.copy(segment.start).add(segment.end).multiplyScalar(0.5);
  temp.quaternion.setFromUnitVectors(up, direction.clone().normalize());
  temp.scale.set(segment.radius, direction.length(), segment.radius);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
}

function addSegments(group: THREE.Group, segments: Segment[]) {
  const mesh = cylinderInstances(segments.length, 6);
  segments.forEach((segment, index) => setCylinder(mesh, index, segment));
  mesh.count = segments.length;
  mesh.instanceMatrix.needsUpdate = true;
  group.add(mesh);
}

function petalGeometry(length = 0.032, width = 0.0215, cup = 0.0018) {
  const positions: number[] = [];
  const rows = 6;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const shoulder = Math.sin(v * Math.PI * 0.7);
    return new THREE.Vector3(
      u * width * shoulder * (1 - 0.035 * v),
      v * length,
      Math.sin(v * Math.PI * 0.86) * cup
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

function setPlanar(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  scale: number,
  angle: number,
  color: THREE.Color
) {
  temp.position.copy(position);
  temp.quaternion.setFromUnitVectors(forward, normal.clone().normalize());
  temp.rotateZ(angle);
  temp.scale.set(scale, scale, 1);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
  mesh.setColorAt(index, color);
}

function setVolume(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  normal: THREE.Vector3,
  scale: THREE.Vector3,
  color: THREE.Color
) {
  temp.position.copy(position);
  temp.quaternion.setFromUnitVectors(up, normal.clone().normalize());
  temp.scale.copy(scale);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
  mesh.setColorAt(index, color);
}

function addBlooms(group: THREE.Group, blooms: Bloom[], rng: Rng) {
  const petals = new THREE.InstancedMesh(petalGeometry(), material(flowerWhite, 0.9), blooms.length * 5);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0072, 7, 5), material(centerGold, 0.92), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.017, 7, 5), material(flowerWarm, 0.92), blooms.length);
  let petalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom) => {
    if (bloom.bud) {
      setVolume(buds, budUsed, bloom.position, bloom.normal, new THREE.Vector3(0.82, 1.12, 0.82).multiplyScalar(bloom.scale), flowerWarm);
      budUsed += 1;
      return;
    }
    setVolume(centers, centerUsed, bloom.position.clone().addScaledVector(bloom.normal, 0.004), bloom.normal, new THREE.Vector3(1.05, 0.8, 1.05).multiplyScalar(bloom.scale), centerGold);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      const color = flowerWhite.clone().lerp(flowerWarm, rng.range(0, 0.2));
      setPlanar(petals, petalUsed, bloom.position, bloom.normal, bloom.scale, p / 5 * Math.PI * 2 + rng.range(-0.05, 0.05), color);
      petalUsed += 1;
    }
  });
  petals.count = petalUsed;
  centers.count = centerUsed;
  buds.count = budUsed;
  petals.instanceMatrix.needsUpdate = true;
  centers.instanceMatrix.needsUpdate = true;
  buds.instanceMatrix.needsUpdate = true;
  if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
  if (centers.instanceColor) centers.instanceColor.needsUpdate = true;
  if (buds.instanceColor) buds.instanceColor.needsUpdate = true;
  group.add(petals, centers, buds);
}

function addJunction(group: THREE.Group, hub: THREE.Vector3, radius: number) {
  const points = [
    new THREE.Vector2(radius * 0.7, -0.045),
    new THREE.Vector2(radius, -0.012),
    new THREE.Vector2(radius * 0.86, 0.018),
    new THREE.Vector2(radius * 0.42, 0.052)
  ];
  const junction = new THREE.Mesh(new THREE.LatheGeometry(points, 9), material(stemGreen, 0.97));
  junction.position.copy(hub);
  group.add(junction);
}

function createCurrentErrorModel(seed: string) {
  const rng = createRng(`${seed}:current-error`);
  const group = new THREE.Group();
  const hub = new THREE.Vector3(0, 0.06, 0);
  group.add(stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.035, -0.62, 0.016),
    hub
  ], 0.018));
  addJunction(group, hub, 0.028);
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  for (let i = 0; i < 16; i += 1) {
    const angle = i / 16 * Math.PI * 2 + rng.range(-0.045, 0.045);
    const radius = rng.range(0.58, 0.86);
    const miniHub = new THREE.Vector3(Math.cos(angle) * radius, 0.37 + (1 - radius / 0.86) * 0.2 + rng.range(-0.025, 0.025), Math.sin(angle) * radius);
    segments.push({ start: hub, end: miniHub, radius: 0.008 });
    const normal = new THREE.Vector3(Math.cos(angle) * 0.12, 1, Math.sin(angle) * 0.12).normalize();
    const { tangent, bitangent } = tangentFrame(normal);
    const count = 6 + (i % 3);
    for (let f = 0; f < count; f += 1) {
      const fa = f / count * Math.PI * 2 + rng.range(-0.12, 0.12);
      const direction = tangent.clone().multiplyScalar(Math.cos(fa)).addScaledVector(bitangent, Math.sin(fa)).addScaledVector(normal, 0.22).normalize();
      const bloom = miniHub.clone().addScaledVector(direction, rng.range(0.075, 0.105));
      segments.push({ start: miniHub, end: bloom, radius: 0.0026 });
      blooms.push({ position: bloom, normal, scale: rng.range(0.86, 1.02), bud: f === count - 1 && i % 4 === 0 });
    }
  }
  addSegments(group, segments);
  addBlooms(group, blooms, rng);
  group.userData.structureStats = { primaryRays: 16, blooms: blooms.length, readingOrder: 'exposed rays first' };
  return group;
}

function unevenAngles(count: number, rng: Rng) {
  const gaps = Array.from({ length: count }, (_, index) => {
    let weight = rng.range(0.52, 1.48);
    if (index === 4 || index === 18) weight *= 1.72;
    if (index === 9 || index === 10 || index === 24) weight *= 0.58;
    return weight;
  });
  const total = gaps.reduce((sum, value) => sum + value, 0);
  const angles: number[] = [];
  let angle = -0.86;
  gaps.forEach((gap) => {
    angle += gap / total * Math.PI * 2;
    angles.push(angle);
  });
  return angles;
}

function createRebuiltModel(seed: string) {
  const rng = createRng(`${seed}:rebuilt-lace-plane-v1`);
  const group = new THREE.Group();
  const hub = new THREE.Vector3(0, 0.06, 0);
  group.add(stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.03, -0.62, 0.014),
    new THREE.Vector3(0.012, -0.22, -0.008),
    hub
  ], 0.016));
  addJunction(group, hub, 0.021);
  const primaryCount = 30;
  const angles = unevenAngles(primaryCount, rng);
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const bandCounts = { center: 0, middle: 0, outer: 0 };

  angles.forEach((angle, i) => {
    const bandSlot = (i * 7) % 10;
    const band = bandSlot < 2 ? 'center' : bandSlot < 5 ? 'middle' : 'outer';
    bandCounts[band] += 1;
    const radius = band === 'center' ? rng.range(0.055, 0.28) : band === 'middle' ? rng.range(0.32, 0.58) : rng.range(0.56, 0.87);
    const height = 0.42 + (1 - radius / 0.87) * 0.075 + rng.range(-0.055, 0.055);
    const miniHub = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const start = hub.clone().addScaledVector(radial, rng.range(0.004, 0.014)).add(new THREE.Vector3(0, rng.range(-0.008, 0.012), 0));
    segments.push({ start, end: miniHub, radius: band === 'outer' ? rng.range(0.0021, 0.0028) : rng.range(0.0023, 0.0031) });

    const normal = radial.clone().multiplyScalar(rng.range(0.025, 0.1)).add(up).normalize();
    const { tangent, bitangent } = tangentFrame(normal);
    const count = band === 'center' ? 8 + (i % 3) : band === 'middle' ? 9 + ((i * 5) % 4) : 8 + ((i * 7) % 5);
    const spread = band === 'center' ? rng.range(0.075, 0.11) : band === 'middle' ? rng.range(0.105, 0.15) : rng.range(0.13, 0.18);
    const phase = rng.range(-0.4, 0.4);
    for (let f = 0; f < count; f += 1) {
      const fa = f / count * Math.PI * 2 + phase + rng.range(-0.22, 0.22);
      const reach = spread * rng.range(f === 0 ? 0.08 : 0.42, 1.12);
      const direction = tangent.clone().multiplyScalar(Math.cos(fa))
        .addScaledVector(bitangent, Math.sin(fa))
        .addScaledVector(normal, rng.range(0.05, 0.34))
        .normalize();
      const bloom = miniHub.clone().addScaledVector(direction, reach);
      bloom.y += rng.range(-0.034, 0.04) + Math.sin(i * 0.83 + f * 1.31) * 0.012;
      const bloomNormal = normal.clone().addScaledVector(direction, rng.range(0.12, 0.3)).normalize();
      segments.push({ start: miniHub, end: bloom, radius: rng.range(0.00115, 0.00165) });
      blooms.push({ position: bloom, normal: bloomNormal, scale: rng.range(0.9, 1.12), bud: f === count - 1 && i % 5 === 0 });
    }
  });

  addSegments(group, segments);
  addBlooms(group, blooms, rng);
  group.userData.structureStats = {
    primaryRays: primaryCount,
    bands: bandCounts,
    blooms: blooms.length,
    readingOrder: 'lace plane, cluster groups, fine support'
  };
  return group;
}

function createPanel(variant: Variant, view: ViewName) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff7df', '#172013', 1.8));
  const key = new THREE.DirectionalLight('#ffffff', 2.1);
  key.position.set(2.8, 3.6, 4.6);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dce9ff', 0.55);
  fill.position.set(-3, 1.5, 2);
  scene.add(fill);
  const model = variant === 'current' ? createCurrentErrorModel('ammi-comparison') : createRebuiltModel('ammi-comparison');
  scene.add(model);
  const grid = new THREE.GridHelper(2.8, 8, '#465446', '#263026');
  grid.position.y = -1.18;
  grid.material.transparent = true;
  grid.material.opacity = 0.24;
  scene.add(grid);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
  return { variant, view, scene, camera, model } satisfies Panel;
}

const panels: Panel[] = [
  createPanel('current', 'front'),
  createPanel('rebuilt', 'front'),
  createPanel('current', 'side'),
  createPanel('rebuilt', 'side'),
  createPanel('current', 'top'),
  createPanel('rebuilt', 'top')
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  if (panel.view === 'side') panel.camera.position.set(3.0, 0.08, 0);
  else if (panel.view === 'top') panel.camera.position.set(0, 3.0, 0.015);
  else panel.camera.position.set(0, 0.08, 3.0);
  panel.camera.lookAt(0, -0.02, 0);
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 860;
  if (mobile) {
    const cellHeight = Math.floor(height / 6);
    return { left: 0, bottom: height - (index + 1) * cellHeight, width, height: index === 5 ? height - cellHeight * 5 : cellHeight };
  }
  const columnWidth = Math.floor(width / 2);
  const rowHeight = Math.floor(height / 3);
  return {
    left: (index % 2) * columnWidth,
    bottom: height - (Math.floor(index / 2) + 1) * rowHeight,
    width: index % 2 ? width - columnWidth : columnWidth,
    height: Math.floor(index / 2) === 2 ? height - rowHeight * 2 : rowHeight
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
  ammiMajusComparisonStats: {
    current: panels[0].model.userData.structureStats,
    rebuilt: panels[1].model.userData.structureStats
  }
});
