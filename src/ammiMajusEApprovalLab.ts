import * as THREE from 'three';
import { createRng, type Rng } from './random';

type ViewKind = 'reference' | 'aligned' | 'overlay' | 'difference' | 'front' | 'side' | 'top' | 'cluster' | 'junction';
type Segment = { start: THREE.Vector3; end: THREE.Vector3; radius: number };
type Bloom = { position: THREE.Vector3; normal: THREE.Vector3; scale: number; bud: boolean };
type ModelResult = { group: THREE.Group; node: THREE.Vector3; clusterFocus: THREE.Vector3; stats: Record<string, unknown> };
type Panel = { view: ViewKind; scene: THREE.Scene; camera: THREE.PerspectiveCamera; model?: ModelResult };

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const temp = new THREE.Object3D();
const stemGreen = new THREE.Color('#527348');
const bractGreen = new THREE.Color('#668657');
const flowerWhite = new THREE.Color('#fffdf1');
const flowerWarm = new THREE.Color('#f2ead4');
const centerGold = new THREE.Color('#cab969');

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Ammi majus E LAB could not find ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#ammi-e-canvas');
const stage = requiredElement<HTMLElement>('.stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.4));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

function matteMaterial(color: THREE.Color | string, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.96,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1
  });
}

function stemAlong(points: THREE.Vector3[], radius: number, color = stemGreen) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 7, false), matteMaterial(color));
}

function segmentInstances(segments: Segment[], color: THREE.Color, opacity = 1, sides = 6) {
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.76, 1, 1, sides, 1, false),
    matteMaterial(color, opacity),
    segments.length
  );
  segments.forEach((segment, index) => {
    const direction = segment.end.clone().sub(segment.start);
    temp.position.copy(segment.start).add(segment.end).multiplyScalar(0.5);
    temp.quaternion.setFromUnitVectors(up, direction.clone().normalize());
    temp.scale.set(segment.radius, direction.length(), segment.radius);
    temp.updateMatrix();
    mesh.setMatrixAt(index, temp.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function petalGeometry(length = 0.0105, width = 0.0074, cup = 0.00065) {
  const positions: number[] = [];
  const rows = 5;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const shoulder = Math.sin(v * Math.PI * 0.72);
    return new THREE.Vector3(
      u * width * shoulder,
      v * length,
      Math.sin(v * Math.PI * 0.88) * cup
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

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function flowerLOD(blooms: Bloom[], rng: Rng) {
  const detailed = new THREE.Group();
  const petals = new THREE.InstancedMesh(petalGeometry(), matteMaterial(flowerWhite), blooms.length * 5);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.00215, 6, 4), matteMaterial(centerGold), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0048, 6, 4), matteMaterial(flowerWarm), blooms.length);
  let petalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom) => {
    if (bloom.bud) {
      setVolume(buds, budUsed, bloom.position, bloom.normal, new THREE.Vector3(0.72, 1.08, 0.72).multiplyScalar(bloom.scale), flowerWarm);
      budUsed += 1;
      return;
    }
    setVolume(centers, centerUsed, bloom.position.clone().addScaledVector(bloom.normal, 0.0017), bloom.normal, new THREE.Vector3(1, 0.72, 1).multiplyScalar(bloom.scale), centerGold);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      setPlanar(
        petals,
        petalUsed,
        bloom.position,
        bloom.normal,
        bloom.scale,
        p / 5 * Math.PI * 2 + rng.range(-0.04, 0.04),
        flowerWhite.clone().lerp(flowerWarm, rng.range(0, 0.12))
      );
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
  detailed.add(petals, centers, buds);

  const simplified = new THREE.Group();
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0082, 5, 4), matteMaterial(flowerWhite), blooms.length);
  blooms.forEach((bloom, index) => {
    setVolume(
      dots,
      index,
      bloom.position,
      bloom.normal,
      new THREE.Vector3(1, bloom.bud ? 1.2 : 0.65, 1).multiplyScalar(bloom.scale),
      bloom.bud ? flowerWarm : flowerWhite
    );
  });
  dots.instanceMatrix.needsUpdate = true;
  if (dots.instanceColor) dots.instanceColor.needsUpdate = true;
  simplified.add(dots);

  const lod = new THREE.LOD();
  lod.addLevel(detailed, 0);
  lod.addLevel(simplified, 1.32);
  return lod;
}

function nonUniformAngles(count: number, rng: Rng) {
  const gaps = Array.from({ length: count }, (_, index) => {
    let gap = rng.range(0.58, 1.48);
    if (index === 5 || index === 23) gap *= 1.45;
    if (index === 11 || index === 12 || index === 29) gap *= 0.62;
    return gap;
  });
  const total = gaps.reduce((sum, gap) => sum + gap, 0);
  const angles: number[] = [];
  let angle = -2.82;
  gaps.forEach((gap) => {
    angle += gap / total * Math.PI * 2;
    angles.push(angle);
  });
  return angles;
}

function shuffle<T>(values: T[], rng: Rng) {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(rng.range(0, i + 1));
    [values[i], values[swapIndex]] = [values[swapIndex], values[i]];
  }
  return values;
}

function createJunction(node: THREE.Vector3) {
  const profile = [
    new THREE.Vector2(0.0135, -0.038),
    new THREE.Vector2(0.0155, -0.014),
    new THREE.Vector2(0.0162, 0.004),
    new THREE.Vector2(0.0125, 0.026),
    new THREE.Vector2(0.0065, 0.046)
  ];
  const junction = new THREE.Mesh(new THREE.LatheGeometry(profile, 9), matteMaterial(stemGreen));
  junction.position.copy(node);
  junction.rotation.y = 0.18;
  return junction;
}

function createEModel(seed: string): ModelResult {
  const rng = createRng(`${seed}:ammi-e-hierarchy-v1`);
  const group = new THREE.Group();
  const node = new THREE.Vector3(0, 0.04, 0);
  group.add(stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(-0.028, -0.66, 0.014),
    new THREE.Vector3(-0.012, -0.22, -0.006),
    node.clone().add(new THREE.Vector3(0, 0.034, 0))
  ], 0.0145));
  group.add(createJunction(node));

  const primaryCount = 38;
  const angles = nonUniformAngles(primaryCount, rng);
  const bands = shuffle<Array<'center' | 'middle' | 'outer'>[number]>([
    ...Array.from({ length: 14 }, () => 'center' as const),
    ...Array.from({ length: 14 }, () => 'middle' as const),
    ...Array.from({ length: 10 }, () => 'outer' as const)
  ], rng);
  const primarySegments: Segment[] = [];
  const secondarySegments: Segment[] = [];
  const bractSegments: Segment[] = [];
  const blooms: Bloom[] = [];
  const miniHubs: THREE.Vector3[] = [];
  let clusterFocus = new THREE.Vector3(0, 0.48, 0.58);

  angles.forEach((baseAngle, i) => {
    const angle = baseAngle + rng.range(-0.045, 0.045);
    const band = bands[i];
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const radius = band === 'center'
      ? rng.range(0.035, 0.28)
      : band === 'middle'
        ? rng.range(0.23, 0.52)
        : rng.range(0.48, 0.82);
    const start = node.clone()
      .addScaledVector(radial, rng.range(0.0015, 0.0065))
      .addScaledVector(tangent, rng.range(-0.004, 0.004))
      .add(new THREE.Vector3(0, rng.range(0.004, 0.022), 0));
    const miniHub = radial.clone().multiplyScalar(radius)
      .addScaledVector(tangent, rng.range(-0.055, 0.055));
    miniHub.y = 0.42 + (1 - radius / 0.82) * 0.092 + rng.range(-0.026, 0.034);
    miniHubs.push(miniHub);
    const midpoint = start.clone().lerp(miniHub, rng.range(0.42, 0.58))
      .addScaledVector(tangent, rng.range(-0.035, 0.035))
      .add(new THREE.Vector3(0, rng.range(0.012, 0.05), 0));
    primarySegments.push(
      { start, end: midpoint, radius: rng.range(0.00082, 0.00135) },
      { start: midpoint, end: miniHub, radius: rng.range(0.0005, 0.00088) }
    );

    const count = band === 'center'
      ? Math.round(rng.range(22, 24))
      : band === 'middle'
        ? Math.round(rng.range(20, 24))
        : Math.round(rng.range(17, 22));
    const spread = band === 'center'
      ? rng.range(0.074, 0.094)
      : band === 'middle'
        ? rng.range(0.082, 0.104)
        : rng.range(0.09, 0.116);
    const clusterNormal = up.clone()
      .addScaledVector(radial, rng.range(0.03, 0.11))
      .addScaledVector(tangent, rng.range(-0.04, 0.04))
      .normalize();
    const frame = tangentFrame(clusterNormal);
    const clusterStretch = rng.range(0.84, 1.18);
    for (let f = 0; f < count; f += 1) {
      const floretAngle = rng.range(-Math.PI, Math.PI);
      const localRadius = spread * Math.sqrt(rng.range(0.012, 1));
      const offset = frame.tangent.clone().multiplyScalar(Math.cos(floretAngle) * localRadius * clusterStretch)
        .addScaledVector(frame.bitangent, Math.sin(floretAngle) * localRadius / clusterStretch);
      const bloom = miniHub.clone().add(offset);
      const dome = (1 - Math.min(1, localRadius / spread)) * rng.range(0.015, 0.034);
      bloom.y += dome + rng.range(-0.018, 0.022);
      const tiltAngle = rng.range(-Math.PI, Math.PI);
      const bloomNormal = clusterNormal.clone().multiplyScalar(rng.range(0.62, 0.9))
        .add(new THREE.Vector3(Math.cos(tiltAngle), rng.range(-0.05, 0.14), Math.sin(tiltAngle)).multiplyScalar(rng.range(0.12, 0.42)))
        .normalize();
      secondarySegments.push({ start: miniHub, end: bloom, radius: rng.range(0.00018, 0.00034) });
      blooms.push({
        position: bloom,
        normal: bloomNormal,
        scale: rng.range(0.72, 1.02),
        bud: f >= count - 2 && (i + f) % 7 === 0
      });
    }
    if (miniHub.z > clusterFocus.z && miniHub.x > -0.25 && miniHub.x < 0.45) clusterFocus = miniHub.clone();
  });

  const bractCount = 11;
  for (let b = 0; b < bractCount; b += 1) {
    const angle = b / bractCount * Math.PI * 2 + rng.range(-0.22, 0.22);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const length = rng.range(0.27, 0.47);
    const start = node.clone().addScaledVector(radial, rng.range(0.006, 0.016)).add(new THREE.Vector3(0, rng.range(-0.03, -0.012), 0));
    const fork = start.clone().addScaledVector(radial, length * rng.range(0.48, 0.64))
      .addScaledVector(tangent, rng.range(-0.035, 0.035))
      .add(new THREE.Vector3(0, rng.range(-0.055, 0.005), 0));
    const tip = start.clone().addScaledVector(radial, length)
      .addScaledVector(tangent, rng.range(-0.075, 0.075))
      .add(new THREE.Vector3(0, rng.range(-0.16, -0.04), 0));
    bractSegments.push(
      { start, end: fork, radius: rng.range(0.0013, 0.0019) },
      { start: fork, end: tip, radius: rng.range(0.00062, 0.001) }
    );
    const lobeCount = b % 3 === 0 ? 3 : 2;
    for (let l = 0; l < lobeCount; l += 1) {
      const lobeDirection = radial.clone().multiplyScalar(rng.range(0.08, 0.16))
        .addScaledVector(tangent, (l - (lobeCount - 1) / 2) * rng.range(0.05, 0.095))
        .add(new THREE.Vector3(0, rng.range(-0.065, 0.035), 0));
      bractSegments.push({ start: fork, end: fork.clone().add(lobeDirection), radius: rng.range(0.00045, 0.00072) });
    }
  }

  group.add(segmentInstances(primarySegments, stemGreen, 0.78, 6));
  group.add(segmentInstances(secondarySegments, stemGreen, 0.5, 5));
  group.add(segmentInstances(bractSegments, bractGreen, 0.9, 5));
  group.add(flowerLOD(blooms, rng));
  const stats = {
    primaryRays: primaryCount,
    miniUmbels: miniHubs.length,
    flowersAndBuds: blooms.length,
    bracts: bractCount,
    hierarchy: 'main stem → common node → primary rays → mini umbels → secondary pedicels → tiny florets'
  };
  group.userData.structureStats = stats;
  return { group, node, clusterFocus, stats };
}

function setModelOpacity(group: THREE.Group, opacity: number) {
  group.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((item) => {
      item.transparent = true;
      item.opacity = opacity;
      item.depthWrite = false;
      item.needsUpdate = true;
    });
  });
}

function setSilhouette(group: THREE.Group) {
  const silhouette = new THREE.MeshBasicMaterial({ color: '#78e1d1', transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false });
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) object.material = silhouette;
  });
}

function createPanel(view: ViewKind) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff9e8', '#172313', 1.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.15);
  key.position.set(2.8, 4.2, 4.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#dce9ff', 0.58);
  fill.position.set(-3, 1.8, 2.4);
  scene.add(fill);
  if (view === 'reference') return { view, scene, camera: new THREE.PerspectiveCamera(34, 1, 0.1, 30) } satisfies Panel;
  const model = createEModel(`ammi-e:${view}`);
  if (view === 'overlay') setModelOpacity(model.group, 0.5);
  if (view === 'difference') setSilhouette(model.group);
  scene.add(model.group);
  return { view, scene, camera: new THREE.PerspectiveCamera(34, 1, 0.1, 30), model } satisfies Panel;
}

const panels: Panel[] = [
  createPanel('reference'),
  createPanel('aligned'),
  createPanel('overlay'),
  createPanel('difference'),
  createPanel('front'),
  createPanel('side'),
  createPanel('top'),
  createPanel('cluster'),
  createPanel('junction')
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  if (panel.view === 'reference') {
    panel.camera.updateProjectionMatrix();
    return;
  }
  const model = panel.model!;
  if (panel.view === 'cluster') {
    const target = model.clusterFocus;
    panel.camera.position.copy(target).add(new THREE.Vector3(0.02, 0.075, 0.36));
    panel.camera.lookAt(target);
    panel.camera.fov = 30;
  } else if (panel.view === 'junction') {
    panel.camera.position.set(0.22, 0.18, 0.72);
    panel.camera.lookAt(model.node.clone().add(new THREE.Vector3(0, 0.03, 0)));
    panel.camera.fov = 31;
  } else if (panel.view === 'top') {
    panel.camera.position.set(0, 3.25, 0.018);
    panel.camera.lookAt(0, 0.24, 0);
    panel.camera.fov = 34;
  } else if (panel.view === 'side' || panel.view === 'aligned' || panel.view === 'overlay' || panel.view === 'difference') {
    panel.camera.position.set(3.15, 0.2, 0);
    panel.camera.lookAt(0, -0.05, 0);
    panel.camera.fov = 34;
  } else {
    panel.camera.position.set(0, 0.78, 3.2);
    panel.camera.lookAt(0, -0.02, 0);
    panel.camera.fov = 34;
  }
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 900;
  if (mobile) {
    const cellHeight = Math.floor(height / 9);
    return { left: 0, bottom: height - (index + 1) * cellHeight, width, height: index === 8 ? height - cellHeight * 8 : cellHeight };
  }
  const columnWidth = Math.floor(width / 3);
  const rowHeight = Math.floor(height / 3);
  return {
    left: (index % 3) * columnWidth,
    bottom: height - (Math.floor(index / 3) + 1) * rowHeight,
    width: index % 3 === 2 ? width - columnWidth * 2 : columnWidth,
    height: Math.floor(index / 3) === 2 ? height - rowHeight * 2 : rowHeight
  };
}

function render() {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height, false);
  renderer.clear();
  renderer.setScissorTest(true);
  panels.forEach((panel, index) => {
    if (panel.view === 'reference') return;
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
  ammiMajusEStats: panels[1].model?.stats
});
document.documentElement.dataset.ammiEStats = JSON.stringify(panels[1].model?.stats ?? {});
