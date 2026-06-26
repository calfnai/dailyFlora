import * as THREE from 'three';
import type { DailyBouquetSpec, FlowerPlanItem, FlowerTypeId, QualityProfile } from './types';
import { createRng, hashString } from './random';
import { withBasePath } from './special';
import { floraPrimitiveFactories, type FloraPrimitiveName, type FloraPrimitiveRole } from './floraPrimitives';

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();
const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const minCameraPitch = 0.03;
const maxCameraPitch = 1.34;
const minZoomOffset = -1.35;
const maxZoomOffset = 2.05;

type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';

type CameraRouteOffsets = {
  yaw: number;
  pitch: number;
  distance: number;
  targetY: number;
};

const emptyRouteOffsets: CameraRouteOffsets = {
  yaw: 0,
  pitch: 0,
  distance: 0,
  targetY: 0
};

function appendGeometryTriangles(positions: number[], geometry: THREE.BufferGeometry, matrix = new THREE.Matrix4()) {
  const source = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = source.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const v = new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(matrix);
    positions.push(v.x, v.y, v.z);
  }
}

function pickColor(colors: readonly string[], value: number) {
  return colors[Math.floor(value * colors.length) % colors.length];
}

function ellipsoidPoint(radius: number, height: number, theta: number, phi: number, asymmetry: number) {
  const sideLean = Math.sin(theta * 2.0) * asymmetry;
  const x = Math.cos(theta) * Math.sin(phi) * radius * (1 + sideLean);
  const z = Math.sin(theta) * Math.sin(phi) * radius * (1 - sideLean * 0.45);
  const y = Math.cos(phi) * height + 0.12;
  return new THREE.Vector3(x, y, z);
}

function bouquetPoint(spec: DailyBouquetSpec, radius: number, height: number, theta: number, phi: number) {
  const shape = spec.special?.shape;
  const point = ellipsoidPoint(
    radius * (shape?.radius ?? 1),
    height * (shape?.height ?? 1),
    theta,
    phi,
    spec.asymmetry
  );
  if (shape) {
    point.x += Math.sin(phi * 1.8 + theta) * 0.08;
    point.z *= 0.92;
    if (Math.cos(theta - 0.9) > 0.2) point.x += 0.18 * Math.cos(theta - 0.9);
  }
  return point;
}

function makeRadialTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.28, 'rgba(255,255,255,0.92)');
  gradient.addColorStop(0.68, 'rgba(255,255,255,0.28)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 96, 96);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildBranches(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:branches`);
  const positions: number[] = [];
  const colors: number[] = [];
  const branchCount = Math.floor(quality.branchCount * spec.branchDensity);
  const color = new THREE.Color(spec.theme.stem);
  const pale = new THREE.Color(spec.theme.leafPalette[2]);

  for (let i = 0; i < branchCount; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.35, 1.42);
    const radius = rng.range(1.05, 2.02) * spec.theme.wildness;
    const end = bouquetPoint(spec, radius, rng.range(1.0, 1.62), theta, phi);
    end.y += spec.haloLift + rng.range(-0.18, 0.44);
    const start = new THREE.Vector3(rng.range(-0.1, 0.1), -0.58 + rng.range(-0.08, 0.06), rng.range(-0.1, 0.1));
    const bend = new THREE.Vector3(
      Math.cos(theta + rng.range(-0.45, 0.45)) * rng.range(0.28, 0.78),
      rng.range(-0.24, 0.42),
      Math.sin(theta + rng.range(-0.45, 0.45)) * rng.range(0.28, 0.78)
    );

    const points = [start];
    for (let j = 1; j <= 4; j += 1) {
      const t = j / 4;
      const p = start.clone().lerp(end, t);
      const sway = Math.sin(t * Math.PI) * rng.range(0.08, 0.38);
      p.addScaledVector(bend, sway);
      p.x += Math.sin(t * 9 + i) * rng.range(-0.035, 0.035);
      p.z += Math.cos(t * 8 + i) * rng.range(-0.035, 0.035);
      points.push(p);
    }

    for (let j = 0; j < points.length - 1; j += 1) {
      positions.push(points[j].x, points[j].y, points[j].z, points[j + 1].x, points[j + 1].y, points[j + 1].z);
      const segmentColor = color.clone().lerp(pale, rng.range(0.0, 0.42));
      for (let k = 0; k < 2; k += 1) {
        colors.push(segmentColor.r, segmentColor.g, segmentColor.b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}

function buildOuterLines(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:outer-lines`);
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(quality.outerLineCount * spec.theme.wildness * (spec.theme.outerLineBias ?? 1));
  const color = new THREE.Color(spec.theme.glow);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.32, 1.18);
    const start = bouquetPoint(spec, rng.range(1.0, 1.55), rng.range(0.9, 1.35), theta, phi);
    const end = start.clone().add(new THREE.Vector3(
      Math.cos(theta + rng.range(-0.9, 0.9)) * rng.range(0.28, 0.75),
      rng.range(0.08, 0.62),
      Math.sin(theta + rng.range(-0.9, 0.9)) * rng.range(0.28, 0.75)
    ));
    positions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    for (let k = 0; k < 2; k += 1) {
      colors.push(color.r, color.g, color.b);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  return new THREE.LineSegments(geometry, material);
}

function buildParticles(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:particles`);
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(quality.particleCount * spec.sparkleDensity);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.28, 1.82);
    const shell = rng.value() ** 0.32;
    const radius = rng.range(0.38, 1.92) * shell;
    const p = bouquetPoint(spec, radius, rng.range(0.72, 1.48), theta, phi);
    p.y += spec.haloLift + rng.range(-0.28, 0.36);
    const airy = rng.value();
    if (airy > 0.72) {
      p.multiplyScalar(rng.range(1.02, 1.28));
      p.y += rng.range(-0.12, 0.32);
    }
    positions.push(p.x, p.y, p.z);

    const base = new THREE.Color(pickColor(spec.theme.palette, rng.value()));
    const glow = new THREE.Color(spec.theme.glow);
    base.lerp(glow, rng.range(0.05, 0.38));
    colors.push(base.r, base.g, base.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.026,
    map: makeRadialTexture() ?? undefined,
    vertexColors: true,
    transparent: true,
    opacity: 0.76,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  return new THREE.Points(geometry, material);
}

function makeLowPolyFlowerGeometry(petalCount: number, radius: number) {
  const positions: number[] = [];

  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2;
    const length = radius * (0.9 + Math.sin(i * 1.7) * 0.08);
    const width = radius * (0.26 + (i % 2) * 0.04);
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const root = direction.clone().multiplyScalar(radius * 0.22).setZ(0.004);
    const left = direction.clone().multiplyScalar(radius * 0.58).addScaledVector(tangent, width).setZ(-0.004);
    const right = direction.clone().multiplyScalar(radius * 0.58).addScaledVector(tangent, -width).setZ(-0.004);
    const ridge = direction.clone().multiplyScalar(radius * 0.66).setZ(0.02);
    const tip = direction.clone().multiplyScalar(length).setZ(0.002);

    addTriangle(root, left, ridge);
    addTriangle(root, ridge, right);
    addTriangle(left, tip, ridge);
    addTriangle(ridge, tip, right);
  }

  const centerTop = new THREE.Vector3(0, 0, radius * 0.32);
  const centerBase: THREE.Vector3[] = [];
  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2;
    centerBase.push(new THREE.Vector3(Math.cos(angle) * radius * 0.25, Math.sin(angle) * radius * 0.25, radius * 0.05));
  }
  for (let i = 0; i < petalCount; i += 1) {
    addTriangle(centerTop, centerBase[i], centerBase[(i + 1) % petalCount]);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeDaisyGeometry(radius: number) {
  return makeLowPolyFlowerGeometry(12, radius);
}

function makeRoseGeometry(radius: number) {
  const positions: number[] = [];
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };

  for (let ring = 0; ring < 3; ring += 1) {
    const count = 6 + ring * 4;
    const innerRadius = radius * (0.16 + ring * 0.16);
    const outerRadius = radius * (0.42 + ring * 0.18);
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.34;
      const next = ((i + 0.78) / count) * Math.PI * 2 + ring * 0.34;
      const root = new THREE.Vector3(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius, radius * (0.22 - ring * 0.04));
      const left = new THREE.Vector3(Math.cos(angle - 0.18) * outerRadius, Math.sin(angle - 0.18) * outerRadius, radius * (0.1 + ring * 0.02));
      const right = new THREE.Vector3(Math.cos(next + 0.18) * outerRadius, Math.sin(next + 0.18) * outerRadius, radius * (0.06 + ring * 0.02));
      const curl = new THREE.Vector3(Math.cos((angle + next) / 2) * outerRadius * 0.86, Math.sin((angle + next) / 2) * outerRadius * 0.86, radius * 0.34);
      addTriangle(root, left, curl);
      addTriangle(root, curl, right);
    }
  }

  const bud = new THREE.ConeGeometry(radius * 0.24, radius * 0.42, 7, 1, false);
  bud.rotateX(Math.PI / 2);
  appendGeometryTriangles(positions, bud);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makePeonyGeometry(radius: number) {
  const geometry = makeRoseGeometry(radius * 1.08);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setXYZ(i, x * 1.12, y * 1.02, z * 0.72);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeOrchidGeometry(radius: number) {
  const positions: number[] = [];
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const petals = [
    { angle: Math.PI / 2, length: 1.05, width: 0.34 },
    { angle: Math.PI * 0.12, length: 0.86, width: 0.3 },
    { angle: Math.PI * 0.88, length: 0.86, width: 0.3 },
    { angle: Math.PI * 1.28, length: 0.76, width: 0.42 },
    { angle: Math.PI * 1.72, length: 0.76, width: 0.42 }
  ];

  petals.forEach((petal, index) => {
    const direction = new THREE.Vector3(Math.cos(petal.angle), Math.sin(petal.angle), 0);
    const tangent = new THREE.Vector3(-Math.sin(petal.angle), Math.cos(petal.angle), 0);
    const root = direction.clone().multiplyScalar(radius * 0.12).setZ(radius * 0.02);
    const mid = direction.clone().multiplyScalar(radius * petal.length * 0.58).setZ(radius * (0.1 + index * 0.01));
    const tip = direction.clone().multiplyScalar(radius * petal.length).setZ(radius * 0.04);
    const left = mid.clone().addScaledVector(tangent, radius * petal.width);
    const right = mid.clone().addScaledVector(tangent, -radius * petal.width);
    addTriangle(root, left, mid);
    addTriangle(root, mid, right);
    addTriangle(left, tip, mid);
    addTriangle(mid, tip, right);
  });

  const lip = new THREE.Vector3(0, -radius * 0.34, radius * 0.28);
  addTriangle(new THREE.Vector3(-radius * 0.18, -radius * 0.08, radius * 0.08), lip, new THREE.Vector3(radius * 0.18, -radius * 0.08, radius * 0.08));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeSpikeFlowerGeometry(radius: number) {
  const group = new THREE.Group();
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.055, radius * 0.075, radius * 1.8, 5),
    new THREE.MeshBasicMaterial()
  );
  stem.position.y = radius * 0.12;
  group.add(stem);
  for (let i = 0; i < 7; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(radius * (0.16 + (i % 2) * 0.035), radius * 0.34, 6), new THREE.MeshBasicMaterial());
    cone.position.set((i % 2 ? 1 : -1) * radius * 0.15, -radius * 0.68 + i * radius * 0.23, 0);
    cone.rotation.z = (i % 2 ? -1 : 1) * 0.66;
    group.add(cone);
  }
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  group.updateMatrixWorld(true);
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    appendGeometryTriangles(positions, child.geometry, child.matrix);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makeLiatrisGeometry(radius: number) {
  const geometry = makeSpikeFlowerGeometry(radius);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    position.setXYZ(i, position.getX(i) * 0.62, position.getY(i) * 1.22, position.getZ(i) * 0.62);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeHyacinthGeometry(radius: number) {
  const geometry = makeSpikeFlowerGeometry(radius);
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const taper = 0.82 + Math.max(0, y / radius) * 0.12;
    position.setXYZ(i, position.getX(i) * taper, y * 0.96, position.getZ(i) * taper);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeHydrangeaGeometry(radius: number) {
  const positions: number[] = [];
  const addTriangle = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const centers = [
    new THREE.Vector3(0, 0, radius * 0.2),
    new THREE.Vector3(radius * 0.34, radius * 0.06, radius * 0.1),
    new THREE.Vector3(-radius * 0.32, radius * 0.08, radius * 0.12),
    new THREE.Vector3(radius * 0.08, -radius * 0.32, radius * 0.1),
    new THREE.Vector3(-radius * 0.08, radius * 0.34, radius * 0.08)
  ];
  centers.forEach((center, index) => {
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2 + index * 0.2;
      const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
      const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
      const root = center.clone();
      const left = center.clone().addScaledVector(direction, radius * 0.12).addScaledVector(tangent, radius * 0.08);
      const right = center.clone().addScaledVector(direction, radius * 0.12).addScaledVector(tangent, -radius * 0.08);
      const tip = center.clone().addScaledVector(direction, radius * 0.26).setZ(center.z + radius * 0.04);
      addTriangle(root, left, tip);
      addTriangle(root, tip, right);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function makePomponGeometry(radius: number) {
  return new THREE.DodecahedronGeometry(radius * 0.72, 1);
}

function makeBellFruitGeometry(radius: number) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const bulb = new THREE.SphereGeometry(radius * 0.36, 8, 6);
  const stem = new THREE.CylinderGeometry(radius * 0.035, radius * 0.045, radius * 1.08, 5);
  const pieces = [
    { geometry: bulb, matrix: new THREE.Matrix4().makeTranslation(0, radius * 0.28, 0) },
    { geometry: bulb, matrix: new THREE.Matrix4().makeTranslation(radius * 0.24, -radius * 0.08, 0) },
    { geometry: bulb, matrix: new THREE.Matrix4().makeTranslation(-radius * 0.22, -radius * 0.16, 0) },
    { geometry: stem, matrix: new THREE.Matrix4().makeTranslation(0, -radius * 0.1, 0) }
  ];
  pieces.forEach((piece) => {
    appendGeometryTriangles(positions, piece.geometry, piece.matrix);
  });
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function geometryForFlowerType(typeId: FlowerTypeId, radius: number) {
  switch (typeId) {
    case 'lowPolyMass':
      return new THREE.IcosahedronGeometry(radius * 0.86, 0);
    case 'fivePetal':
      return makeLowPolyFlowerGeometry(5, radius);
    case 'rose':
      return makeRoseGeometry(radius);
    case 'camelliaPeony':
      return makePeonyGeometry(radius);
    case 'chamomile':
      return makeDaisyGeometry(radius);
    case 'orchid':
      return makeOrchidGeometry(radius);
    case 'snapdragon':
      return makeSpikeFlowerGeometry(radius);
    case 'hyacinth':
      return makeHyacinthGeometry(radius);
    case 'liatris':
      return makeLiatrisGeometry(radius);
    case 'hydrangea':
      return makeHydrangeaGeometry(radius);
    case 'pompon':
      return makePomponGeometry(radius);
    case 'bellFruit':
      return makeBellFruitGeometry(radius);
  }
}

function primitiveForPlanItem(item: FlowerPlanItem, planId: string): FloraPrimitiveName {
  if (planId === 'dewberry-morning-air') {
    if (item.typeId === 'chamomile') return 'CosmosOpenFlower';
    if (item.typeId === 'hydrangea') return 'UmbelMiniCluster';
    if (item.typeId === 'bellFruit') return 'FruitPodCluster';
    if (item.typeId === 'orchid' && item.role === 'main') return 'TulipCupFlower';
    if (item.typeId === 'orchid' && item.role === 'line') return 'StarPinwheelFlower';
    if (item.typeId === 'camelliaPeony') return 'RuffledRoseFlower';
    if (item.typeId === 'liatris') return 'SpikeFlower';
  }

  if (planId === 'her-real-bouquet-memory-v4') {
    if (item.typeId === 'chamomile') return 'CosmosOpenFlower';
    if (item.typeId === 'camelliaPeony') return 'RuffledRoseFlower';
    if (item.typeId === 'orchid' && item.role === 'line') return 'StarPinwheelFlower';
    if (item.typeId === 'orchid' && item.role === 'main') return 'TulipCupFlower';
    if (item.typeId === 'orchid' && item.role === 'secondary') return 'OrchidButterflyFlower';
    if (item.typeId === 'hydrangea') return 'UmbelMiniCluster';
    if (item.typeId === 'bellFruit') return 'AirFiller';
    if (item.typeId === 'liatris') return 'FoliageGrassBranch';
  }

  if (planId === 'her-january-sky-memory-v3') {
    if (item.typeId === 'camelliaPeony' || item.typeId === 'rose') return 'RuffledRoseFlower';
    if (item.typeId === 'orchid' && item.role === 'main') return 'TulipCupFlower';
    if (item.typeId === 'orchid' && item.role === 'secondary') return 'OrchidButterflyFlower';
    if (item.typeId === 'orchid' && item.role === 'line') return 'StarPinwheelFlower';
    if (item.typeId === 'hydrangea') return 'UmbelMiniCluster';
    if (item.typeId === 'bellFruit') return 'AirFiller';
    if (item.typeId === 'liatris') return 'FoliageGrassBranch';
  }

  if (planId === 'her-january-sky-memory-v2') {
    if (item.typeId === 'camelliaPeony') return 'RuffledRoseFlower';
    if (item.typeId === 'orchid' && item.role === 'main') return 'TulipCupFlower';
    if (item.typeId === 'orchid' && item.role === 'secondary') return 'CallaCurledBract';
    if (item.typeId === 'orchid' && item.role === 'line') return 'StarPinwheelFlower';
    if (item.typeId === 'hydrangea') return 'UmbelMiniCluster';
    if (item.typeId === 'bellFruit') return 'AirFiller';
    if (item.typeId === 'liatris') return 'FoliageGrassBranch';
  }

  if (planId === 'her-january-sky-memory') {
    if (item.typeId === 'orchid' && item.role === 'main') return 'TulipCupFlower';
    if (item.typeId === 'orchid' && item.role === 'line') return 'StarPinwheelFlower';
    if (item.typeId === 'camelliaPeony') return 'RuffledRoseFlower';
    if (item.typeId === 'hydrangea') return 'UmbelMiniCluster';
    if (item.typeId === 'bellFruit') return 'AirFiller';
    if (item.typeId === 'liatris') return 'FoliageGrassBranch';
  }

  if (item.typeId === 'bellFruit') {
    return planId === 'berry-grove' ? 'FruitPodCluster' : 'HangingBellFruit';
  }

  if (item.typeId === 'orchid') {
    if (planId === 'breathing-landscape') return 'TrumpetThroatFlower';
    if (planId === 'summer-pinwheel-detail') return 'StarPinwheelFlower';
    return 'OrchidButterflyFlower';
  }

  if (item.typeId === 'chamomile') {
    return planId === 'summer-pinwheel-detail' && item.role === 'filler' ? 'StarPinwheelFlower' : 'DiskFlower';
  }

  const primitiveByType: Record<FlowerTypeId, FloraPrimitiveName> = {
    lowPolyMass: 'FullHydrangeaCloud',
    fivePetal: 'DiskFlower',
    rose: 'RuffledRoseFlower',
    camelliaPeony: 'LayeredDahliaFlower',
    chamomile: 'DiskFlower',
    orchid: 'OrchidButterflyFlower',
    snapdragon: 'SpikeFlower',
    hyacinth: 'SpikeFlower',
    liatris: 'SpikeFlower',
    hydrangea: 'FullHydrangeaCloud',
    pompon: 'FullHydrangeaCloud',
    bellFruit: 'HangingBellFruit'
  };
  return primitiveByType[item.typeId];
}

function primitiveRoleForPlanItem(item: FlowerPlanItem): FloraPrimitiveRole {
  if (item.role === 'main') return 'hero';
  if (item.role === 'line') return 'line';
  if (item.role === 'cluster') return 'cluster';
  if (item.role === 'fruit') return 'fruit';
  if (item.role === 'filler') return 'filler';
  return 'secondary';
}

function spikeLeanRange(placement: FlowerPlanItem['placement']): [number, number] {
  if (placement === 'high') return [0.14, 0.42];
  if (placement === 'spray') return [0.22, 0.58];
  if (placement === 'outer') return [0.18, 0.5];
  if (placement === 'mixed') return [0.14, 0.46];
  return [0.1, 0.32];
}

function primitivePalette(
  spec: DailyBouquetSpec,
  primitive: FloraPrimitiveName,
  rng: ReturnType<typeof createRng>,
  item?: FlowerPlanItem
) {
  const flower = spec.theme.palette;
  const leaf = spec.theme.leafPalette;
  const color = (index: number) => flower[index % flower.length];
  const leafColor = (index: number) => leaf[index % leaf.length];
  const warm = color(Math.floor(rng.value() * flower.length));

  if (spec.flowerPlan.id === 'dewberry-morning-air' && item) {
    if (item.cn.includes('奶白')) return ['#fffaf0', '#f5ead6', '#f3ca43', leafColor(2)];
    if (item.cn.includes('柠檬黄')) return ['#ffdf50', '#fff5a6', '#f6f2dc', leafColor(1)];
    if (item.cn.includes('蓝紫')) return ['#8fd8ff', '#d9bcff', '#fffaf0', leafColor(2)];
    if (item.cn.includes('莓红')) return ['#ff78a8', '#c84b80', '#ffd8e6', leafColor(1)];
    if (item.cn.includes('象牙')) return ['#fffaf0', '#f7e6bf', '#ffd95a', leafColor(1)];
    if (item.cn.includes('粉莓')) return ['#f5adc6', '#fff1ec', '#ff78a8', leafColor(2)];
    if (item.cn.includes('嫩绿')) return ['#8eea92', '#bddf82', '#fffaf0', leafColor(1)];
    if (item.cn.includes('珊瑚')) return ['#ff8f5a', '#ffd95a', '#ff78a8', leafColor(2)];
  }

  if (spec.flowerPlan.id === 'her-real-bouquet-memory-v4' && item) {
    if (item.cn.includes('白色波斯菊')) return ['#fffdf2', '#f6efdc', '#f4cf2e', leafColor(2)];
    if (item.cn.includes('黄色春日')) return ['#ffe132', '#fff58c', '#7c691f', leafColor(1)];
    if (item.cn.includes('红黄嘉兰')) return ['#f36b45', '#ffe05c', '#c83f56', '#79a33d'];
    if (item.cn.includes('浅粉')) return ['#f5c0cf', '#f1d8e8', '#fff2e3', leafColor(2)];
    if (item.cn.includes('白色杯形')) return ['#fff8e6', '#f7ecd4', '#f3d36d', leafColor(1)];
    if (item.cn.includes('淡紫')) return ['#d8c4f0', '#f0e8fb', '#b7d6ff', leafColor(2)];
    if (item.cn.includes('蓝色')) return ['#84bdf4', '#b9d8f6', '#f0f6ff', leafColor(2)];
    if (item.cn.includes('满天星')) return ['#fffdf4', '#eff7ff', '#dfe9c9', leafColor(1)];
  }

  if (primitive === 'FoliageGrassBranch') return [leafColor(0), leafColor(1), leafColor(2), spec.theme.stem];
  if (primitive === 'FruitPodCluster') return [color(4), color(3), leafColor(1), color(2)];
  if (primitive === 'HangingBellFruit') return [color(0), color(1), leafColor(1), color(2)];
  if (primitive === 'TrumpetThroatFlower') return [color(2), '#fffdf2', color(0), color(1)];
  if (primitive === 'CallaCurledBract') return [color(2), color(1), color(0), leafColor(1)];
  if (primitive === 'SpikeFlower') return [warm, color(1), color(2), leafColor(1)];
  if (primitive === 'UmbelMiniCluster') return ['#fffdf4', color(2), color(3), leafColor(2)];
  if (primitive === 'FullHydrangeaCloud') return [color(3), color(2), color(4), '#f4ffd8'];
  return [warm, color(1), color(2), leafColor(2)];
}

function orientPrimitiveGroup(
  group: THREE.Group,
  primitive: FloraPrimitiveName,
  point: THREE.Vector3,
  theta: number,
  rng: ReturnType<typeof createRng>,
  placement: FlowerPlanItem['placement'] = 'mixed'
) {
  const outward = point.clone().setY(point.y * 0.55 + 0.48).normalize();
  const facePrimitives: FloraPrimitiveName[] = [
    'CosmosOpenFlower',
    'DiskFlower',
    'LayeredDahliaFlower',
    'RuffledRoseFlower',
    'StarPinwheelFlower',
    'TrumpetThroatFlower',
    'DaturaTrumpetFlower',
    'OrchidButterflyFlower'
  ];

  if (facePrimitives.includes(primitive)) {
    group.quaternion.setFromUnitVectors(forward, outward.lengthSq() ? outward : forward);
    group.rotateZ(rng.range(0, Math.PI * 2));
    group.rotateX(rng.range(-0.18, 0.18));
    return;
  }

  if (primitive === 'SpikeFlower') {
    const [minLean, maxLean] = spikeLeanRange(placement);
    const lean = rng.range(minLean, maxLean);
    const radial = new THREE.Vector3(point.x, 0, point.z);
    if (radial.lengthSq() < 0.0001) radial.set(Math.cos(theta), 0, Math.sin(theta));
    radial.normalize();
    const side = new THREE.Vector3(-radial.z, 0, radial.x).multiplyScalar(rng.range(-0.42, 0.42));
    const openBias = rng.value() < 0.86 ? rng.range(0.82, 1.2) : rng.range(0.28, 0.62);
    const horizontal = radial.multiplyScalar(openBias).add(side).normalize().multiplyScalar(lean);
    const target = new THREE.Vector3(
      horizontal.x,
      rng.range(0.92, 1.14),
      horizontal.z
    ).normalize();
    group.quaternion.setFromUnitVectors(up, target);
    group.rotateY(rng.range(-Math.PI, Math.PI));
    return;
  }

  if (primitive === 'FoliageGrassBranch') {
    group.quaternion.setFromUnitVectors(up, new THREE.Vector3(Math.cos(theta) * 0.22, 1, Math.sin(theta) * 0.22).normalize());
    group.rotateY(rng.range(-0.45, 0.45));
    return;
  }

  if (primitive === 'HangingBellFruit') {
    group.rotation.set(rng.range(-0.18, 0.18), theta + rng.range(-0.35, 0.35), rng.range(-0.12, 0.12));
    return;
  }

  group.quaternion.setFromUnitVectors(up, outward.lengthSq() ? outward : up);
  group.rotateY(rng.range(0, Math.PI * 2));
}

function buildPrimitiveFlowers(spec: DailyBouquetSpec, quality: QualityProfile) {
  const plannedCount = Math.floor(quality.flowerCount * spec.flowerDensity);
  const specialPrimitiveRatio = spec.flowerPlan.id === 'her-real-bouquet-memory-v4' ? 0.5 : 0.34;
  const count = Math.max(64, Math.floor(plannedCount * (spec.special ? specialPrimitiveRatio : 0.44)));
  const group = new THREE.Group();
  const batches = spec.flowerPlan.items;
  let used = 0;

  batches.forEach((batch, index) => {
    const batchCount = index === batches.length - 1 ? count - used : Math.max(1, Math.floor(count * batch.share));
    used += batchCount;
    const primitive = primitiveForPlanItem(batch, spec.flowerPlan.id);
    const factory = floraPrimitiveFactories[primitive];
    const localRng = createRng(`${spec.seed}:primitive-flowers:${spec.flowerPlan.id}:${batch.typeId}:${primitive}`);

    for (let i = 0; i < batchCount; i += 1) {
      const { p, theta } = placementPoint(spec, localRng, batch.placement);
      const roleScale =
        batch.role === 'main' ? 0.26 :
        batch.role === 'line' ? 0.25 :
        batch.role === 'cluster' ? 0.23 :
        batch.role === 'fruit' ? 0.2 :
        batch.role === 'filler' ? 0.16 :
        0.21;
      const bloom = spec.special?.bloomScale;
      const specialScale = bloom ? localRng.range(bloom.small, bloom.medium) * 0.52 : 1;
      const primitiveGroup = factory({
        seed: `${spec.seed}:bouquet-primitive:${primitive}:${batch.typeId}:${i}`,
        position: p,
        scale: roleScale * batch.scale * localRng.range(0.82, 1.22) * specialScale,
        colorPalette: primitivePalette(spec, primitive, localRng, batch),
        openness: ['OrchidButterflyFlower', 'TrumpetThroatFlower', 'DaturaTrumpetFlower', 'CallaCurledBract'].includes(primitive) ? 0.94 : localRng.range(0.62, 0.86),
        density: ['UmbelMiniCluster', 'FullHydrangeaCloud', 'FruitPodCluster'].includes(primitive) ? 1.08 : localRng.range(0.86, 1.02),
        curvature: ['SpikeFlower', 'FoliageGrassBranch', 'CallaCurledBract'].includes(primitive) ? 0.86 : 0.42,
        role: primitiveRoleForPlanItem(batch)
      });
      primitiveGroup.name = `${primitive}:${batch.cn}`;
      orientPrimitiveGroup(primitiveGroup, primitive, p, theta, localRng, batch.placement);
      group.add(primitiveGroup);
    }
  });

  const foliageFactory = floraPrimitiveFactories.FoliageGrassBranch;
  const foliageRng = createRng(`${spec.seed}:primitive-foliage-accents`);
  const foliageCount = Math.max(6, Math.floor(count * 0.08 * spec.theme.wildness));
  for (let i = 0; i < foliageCount; i += 1) {
    const { p, theta } = placementPoint(spec, foliageRng, i % 4 === 0 ? 'spray' : i % 2 === 0 ? 'outer' : 'mixed');
    p.y -= foliageRng.range(0.18, 0.42);
    p.multiplyScalar(foliageRng.range(0.9, 1.02));
    const foliage = foliageFactory({
      seed: `${spec.seed}:bouquet-foliage:${i}`,
      position: p,
      scale: foliageRng.range(0.2, 0.32),
      colorPalette: primitivePalette(spec, 'FoliageGrassBranch', foliageRng),
      openness: 0.74,
      density: 0.92,
      curvature: 0.86,
      role: 'line'
    });
    orientPrimitiveGroup(foliage, 'FoliageGrassBranch', p, theta, foliageRng);
    group.add(foliage);
  }

  return group;
}

function placementPoint(
  spec: DailyBouquetSpec,
  rng: ReturnType<typeof createRng>,
  placement: FlowerPlanItem['placement']
) {
  const theta = rng.range(0, Math.PI * 2);
  const phiRanges: Record<FlowerPlanItem['placement'], [number, number]> = {
    center: [0.58, 1.34],
    outer: [0.36, 1.6],
    high: [0.2, 1.04],
    low: [1.02, 1.78],
    spray: [0.26, 1.7],
    mixed: [0.36, 1.66]
  };
  const radiusRanges: Record<FlowerPlanItem['placement'], [number, number]> = {
    center: [0.42, 1.18],
    outer: [0.92, 1.92],
    high: [0.74, 1.82],
    low: [0.46, 1.5],
    spray: [1.02, 2.08],
    mixed: [0.5, 1.78]
  };
  const heightRanges: Record<FlowerPlanItem['placement'], [number, number]> = {
    center: [0.86, 1.36],
    outer: [0.82, 1.5],
    high: [1.08, 1.72],
    low: [0.68, 1.18],
    spray: [0.92, 1.62],
    mixed: [0.82, 1.46]
  };
  const [phiMin, phiMax] = phiRanges[placement];
  const [radiusMin, radiusMax] = radiusRanges[placement];
  const [heightMin, heightMax] = heightRanges[placement];
  const p = bouquetPoint(spec, rng.range(radiusMin, radiusMax), rng.range(heightMin, heightMax), theta, rng.range(phiMin, phiMax));
  const liftRanges: Record<FlowerPlanItem['placement'], [number, number]> = {
    center: [-0.18, 0.24],
    outer: [-0.24, 0.34],
    high: [0.12, 0.54],
    low: [-0.46, 0.1],
    spray: [-0.18, 0.46],
    mixed: [-0.26, 0.36]
  };
  const [liftMin, liftMax] = liftRanges[placement];
  p.y += spec.haloLift + rng.range(liftMin, liftMax);
  return { p, theta };
}

function buildFlowers(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:flowers`);
  const count = Math.floor(quality.flowerCount * spec.flowerDensity);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.82,
    metalness: 0.0,
    flatShading: true,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(spec.theme.glow),
    emissiveIntensity: 0.08
  });

  const place = (
    mesh: THREE.InstancedMesh,
    localRng: ReturnType<typeof createRng>,
    itemCount: number,
    scaleBias = 1,
    colorLift = 0.1,
    placement: FlowerPlanItem['placement'] = 'mixed'
  ) => {
    for (let i = 0; i < itemCount; i += 1) {
      const { p, theta } = placementPoint(spec, localRng, placement);
      const bloom = spec.special?.bloomScale;
      const large = bloom && localRng.value() < bloom.largeBias;
      const scale = (bloom
        ? localRng.range(bloom.small, large ? bloom.large : bloom.medium)
        : localRng.range(0.46, 0.9) * (localRng.value() > 0.96 ? 1.08 : 1)) * scaleBias;
      tempObject.position.copy(p);
      tempObject.quaternion.setFromUnitVectors(up, p.clone().normalize());
      tempObject.rotateZ(localRng.range(0, Math.PI * 2));
      tempObject.rotateX(localRng.range(-0.38, 0.38));
      if (spec.special) {
        tempObject.scale.set(scale * localRng.range(0.9, 1.28), scale * localRng.range(0.56, 0.82), scale * localRng.range(0.9, 1.18));
      } else {
        tempObject.scale.set(scale * localRng.range(0.82, 1.16), scale * localRng.range(0.82, 1.12), scale * localRng.range(0.72, 1.06));
      }
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
      mesh.setColorAt(i, tempColor.set(pickColor(spec.theme.palette, localRng.value())).lerp(new THREE.Color('#ffffff'), localRng.range(0.0, colorLift)));
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  if (quality.renderName === 'low') {
    const geometry = new THREE.IcosahedronGeometry(spec.special ? 0.066 : 0.058, 0);
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    place(mesh, rng, count, 0.96, 0.06);
    return mesh;
  }

  if (quality.renderName === 'medium') {
    const geometry = new THREE.SphereGeometry(spec.special ? 0.064 : 0.056, 16, 10);
    const mediumMaterial = material.clone();
    mediumMaterial.flatShading = false;
    mediumMaterial.transparent = true;
    mediumMaterial.opacity = 0.8;
    mediumMaterial.depthWrite = false;
    const mesh = new THREE.InstancedMesh(geometry, mediumMaterial, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    place(mesh, rng, count, 0.96, 0.1);
    return mesh;
  }

  return buildPrimitiveFlowers(spec, quality);
}

function buildLeaves(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:leaves`);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.13);
  shape.bezierCurveTo(0.11, 0.08, 0.13, -0.08, 0, -0.15);
  shape.bezierCurveTo(-0.13, -0.08, -0.11, 0.08, 0, 0.13);
  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.9,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    emissive: new THREE.Color('#123d28'),
    emissiveIntensity: 0.05
  });
  const count = Math.floor(quality.leafCount * spec.leafDensity * (spec.special ? 0.68 : 1));
  const mesh = new THREE.InstancedMesh(geometry, material, count);

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.38, 1.82);
    const p = bouquetPoint(spec, rng.range(0.44, 1.78), rng.range(0.7, 1.38), theta, phi);
    p.y += spec.haloLift + rng.range(-0.38, 0.24);
    const size = spec.special ? rng.range(0.32, 0.82) : rng.range(0.55, 1.28);
    tempObject.position.copy(p);
    tempObject.quaternion.setFromUnitVectors(up, p.clone().normalize());
    tempObject.rotateY(theta + rng.range(-0.8, 0.8));
    tempObject.rotateX(rng.range(-0.8, 0.8));
    tempObject.scale.set(
      size * rng.range(0.42, spec.special ? 0.7 : 0.92),
      size * rng.range(0.72, spec.special ? 1.12 : 1.45),
      size
    );
    tempObject.updateMatrix();
    mesh.setMatrixAt(i, tempObject.matrix);
    mesh.setColorAt(i, tempColor.set(pickColor(spec.theme.leafPalette, rng.value())));
  }
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

function buildStemBundle(spec: DailyBouquetSpec) {
  const rng = createRng(`${spec.seed}:stems`);
  const positions: number[] = [];
  const colors: number[] = [];
  const stem = new THREE.Color(spec.theme.stem);
  const count = Math.floor(24 * (spec.special?.shape.stemVisibility ?? 1));

  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const bottom = new THREE.Vector3(Math.cos(theta) * rng.range(0.04, 0.11), -1.24, Math.sin(theta) * rng.range(0.04, 0.11));
    const top = new THREE.Vector3(Math.cos(theta) * rng.range(0.14, 0.3), -0.44 + rng.range(-0.1, 0.08), Math.sin(theta) * rng.range(0.14, 0.3));
    positions.push(bottom.x, bottom.y, bottom.z, top.x, top.y, top.z);
    const c = stem.clone().lerp(new THREE.Color('#d5d09b'), rng.range(0, 0.24));
    for (let k = 0; k < 2; k += 1) colors.push(c.r, c.g, c.b);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24
  });
  const lines = new THREE.LineSegments(geometry, material);

  const bandGeometry = new THREE.CylinderGeometry(0.13, 0.11, 0.08, 20, 1, true);
  const bandMaterial = new THREE.MeshStandardMaterial({
    color: '#b8b08d',
    roughness: 0.86,
    metalness: 0,
    transparent: true,
    opacity: 0.07,
    side: THREE.DoubleSide
  });
  const band = new THREE.Mesh(bandGeometry, bandMaterial);
  band.position.y = -1.0;
  const group = new THREE.Group();
  group.add(lines, band);
  return group;
}

function buildSpecialBabyBreath(spec: DailyBouquetSpec, quality: QualityProfile) {
  const rng = createRng(`${spec.seed}:baby-breath`);
  const count = Math.floor(quality.particleCount * 0.22);
  const positions: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = rng.range(0.18, 1.42);
    const spray = rng.value() ** 0.18;
    const p = bouquetPoint(spec, rng.range(1.0, 2.2) * spray, rng.range(1.04, 1.78), theta, phi);
    p.y += spec.haloLift + rng.range(-0.08, 0.58);
    if (rng.value() > 0.78) p.x -= rng.range(0.1, 0.52);
    positions.push(p.x, p.y, p.z);
    const color = new THREE.Color(rng.value() > 0.82 ? '#dbe9ff' : '#fffcef');
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.018,
    map: makeRadialTexture() ?? undefined,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  return new THREE.Points(geometry, material);
}

function buildSpecialWrapping(spec: DailyBouquetSpec) {
  if (!spec.special) return new THREE.Group();
  const { wrapping } = spec.special;
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: wrapping.color,
    emissive: new THREE.Color(wrapping.edgeColor),
    emissiveIntensity: 0.03,
    roughness: 0.58,
    metalness: 0,
    transparent: true,
    opacity: wrapping.opacity,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: wrapping.edgeColor,
    transparent: true,
    opacity: 0.16,
    depthWrite: false
  });
  for (let i = 0; i < 7; i += 1) {
    const angle = (i / 7) * Math.PI * 2 + (i % 2) * 0.16;
    const width = 0.54 + (i % 3) * 0.08;
    const height = 1.78 + (i % 2) * 0.34;
    const shape = new THREE.Shape();
    shape.moveTo(-width * 0.22, -1.1);
    shape.lineTo(width, height - 1.14);
    shape.lineTo(-width * 0.78, height - 1.32);
    shape.lineTo(-width * 0.22, -1.1);
    const geometry = new THREE.ShapeGeometry(shape);
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(Math.cos(angle) * 0.22, -0.1, Math.sin(angle) * 0.22);
    panel.rotation.set(-0.12 + (i % 2) * 0.08, angle - Math.PI / 2, 0.12 - (i % 3) * 0.08);
    group.add(panel);

    const points = shape.getPoints();
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const edge = new THREE.Line(edgeGeometry, edgeMaterial);
    edge.position.copy(panel.position);
    edge.rotation.copy(panel.rotation);
    group.add(edge);
  }

  const ribbonGeometry = new THREE.TorusGeometry(0.2, 0.012, 8, 42);
  const ribbonMaterial = new THREE.MeshStandardMaterial({
    color: wrapping.ribbonColor,
    roughness: 0.74,
    transparent: true,
    opacity: 0.58
  });
  const ribbon = new THREE.Mesh(ribbonGeometry, ribbonMaterial);
  ribbon.position.y = -0.92;
  ribbon.rotation.x = Math.PI / 2;
  group.add(ribbon);
  return group;
}

function buildSpecialDustRings(spec: DailyBouquetSpec, quality: QualityProfile) {
  if (!spec.special) return new THREE.Group();
  const rng = createRng(`${spec.seed}:dust-rings`);
  const group = new THREE.Group();
  group.userData.spin = 0.018;
  const count = quality.renderName === 'low' ? 680 : quality.renderName === 'medium' ? 980 : 1320;
  const positions: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const ring = rng.value() > 0.58 ? 1 : 0;
    const theta = rng.range(0, Math.PI * 2);
    const radius = rng.range(ring ? 1.38 : 0.82, ring ? 2.34 : 1.52);
    positions.push(
      Math.cos(theta) * radius * rng.range(0.88, 1.12),
      rng.range(-0.18, 0.5) + Math.sin(theta * 2.0) * 0.05,
      Math.sin(theta) * radius * rng.range(0.24, 0.4)
    );
    const color = new THREE.Color(pickColor(spec.special.cosmic.dustColors, rng.value()));
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size: 0.012,
    map: makeRadialTexture() ?? undefined,
    vertexColors: true,
    transparent: true,
    opacity: 0.52,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  points.rotation.set(0.42, 0.1, -0.08);
  group.add(points);
  return group;
}

function buildSpecialCosmicLayer(spec: DailyBouquetSpec, quality: QualityProfile) {
  const group = new THREE.Group();
  if (!spec.special) return group;
  const rng = createRng(`${spec.seed}:cosmic-sky`);
  const starCount = quality.renderName === 'low' ? 260 : quality.renderName === 'medium' ? 420 : 620;
  const positions: number[] = [];
  const colors: number[] = [];
  for (let i = 0; i < starCount; i += 1) {
    const depth = rng.range(-10.8, -8.4);
    positions.push(rng.range(-7.5, 7.5), rng.range(-4.3, 4.3), depth);
    const color = new THREE.Color(pickColor(spec.special.cosmic.starColors, rng.value()));
    colors.push(color.r, color.g, color.b);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const stars = new THREE.Points(
    starGeometry,
    new THREE.PointsMaterial({
      size: 0.018,
      map: makeRadialTexture() ?? undefined,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
  );
  group.add(stars);

  const galaxyTexture = new THREE.TextureLoader().load(withBasePath(spec.special.hubbleImagePath));
  galaxyTexture.colorSpace = THREE.SRGBColorSpace;
  const galaxyScale = spec.special.cosmic.galaxyScale ?? 1;
  const galaxyPosition = spec.special.cosmic.galaxyPosition ?? [0.42, 0.62, -9.1];
  const galaxyMaterial = spec.special.cosmic.galaxyAlphaMap
    ? new THREE.ShaderMaterial({
        uniforms: {
          map: { value: galaxyTexture },
          tint: { value: new THREE.Color(spec.special.cosmic.galaxyTint) },
          opacity: { value: spec.special.cosmic.galaxyOpacity ?? 0.34 }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D map;
          uniform vec3 tint;
          uniform float opacity;
          varying vec2 vUv;

          void main() {
            vec4 tex = texture2D(map, vUv);
            float luminance = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
            float alpha = smoothstep(0.045, 0.42, luminance) * opacity;
            vec3 lifted = pow(tex.rgb, vec3(0.52)) * tint * 1.7;
            gl_FragColor = vec4(lifted, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        depthTest: spec.special.cosmic.galaxyDepthTest ?? true
      })
    : new THREE.MeshBasicMaterial({
        map: galaxyTexture,
        color: spec.special.cosmic.galaxyTint,
        transparent: true,
        opacity: spec.special.cosmic.galaxyOpacity ?? 0.34,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: spec.special.cosmic.galaxyDepthTest ?? true
      });
  const galaxy = new THREE.Mesh(
    new THREE.PlaneGeometry(4.5 * galaxyScale, 4.4 * galaxyScale),
    galaxyMaterial
  );
  galaxy.position.set(galaxyPosition[0], galaxyPosition[1], galaxyPosition[2]);
  galaxy.rotation.z = spec.special.cosmic.galaxyRotation ?? -0.2;
  group.add(galaxy);

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(spec.special.cosmic.coreRadius ?? 0.72, 48),
    new THREE.MeshBasicMaterial({
      color: spec.special.cosmic.warmCore,
      transparent: true,
      opacity: spec.special.cosmic.coreOpacity ?? 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: spec.special.cosmic.galaxyDepthTest ?? true
    })
  );
  core.position.set(galaxyPosition[0] - 0.18, galaxyPosition[1] - 0.04, galaxyPosition[2] + 0.05);
  group.add(core);
  return group;
}

export class BouquetScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  readonly bouquet = new THREE.Group();
  readonly cosmicLayer = new THREE.Group();

  private readonly clock = new THREE.Clock();
  private readonly canvas: HTMLCanvasElement;
  private spec: DailyBouquetSpec;
  private quality: QualityProfile;
  private frameInterval: number;
  private accumulator = 0;
  private isPaused = false;
  private isDragging = false;
  private dragX = 0;
  private dragY = 0;
  private routeSpeed: number;
  private routeDirection: 1 | -1 = 1;
  private routeMode: CameraRouteMode = 'orbit';
  private routeTime = 0;
  private routePausedByDrag = false;
  private cameraYaw = 0;
  private targetCameraYaw = 0;
  private cameraPitch = 0.38;
  private targetCameraPitch = 0.38;
  private baseCameraPitch = 0.38;
  private pitchAmplitude = 0;
  private yawAmplitude = 0;
  private distanceAmplitude = 0;
  private targetYAmplitude = 0;
  private zoomOffset = 0;
  private cameraDistance = 5.36;
  private baseCameraDistance = 5.36;
  private targetCameraDistance = 5.36;
  private cameraTargetY = 0.7;
  private baseCameraTargetY = 0.7;
  private targetCameraTargetY = 0.7;
  private floorMaterial?: THREE.MeshBasicMaterial;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement, spec: DailyBouquetSpec, quality: QualityProfile) {
    this.canvas = canvas;
    this.spec = spec;
    this.quality = quality;
    this.routeSpeed = spec.rotationSpeed;
    this.frameInterval = 1 / quality.targetFps;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: quality.renderName === 'low' ? 'low-power' : 'high-performance'
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(spec.theme.background);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    this.scene.fog = new THREE.Fog(spec.theme.background, 4.8, 9.2);
    this.cameraYaw = (hashString(spec.seed) % 628) / 100;
    this.targetCameraYaw = this.cameraYaw;
    this.scene.add(this.camera);
    this.camera.add(this.cosmicLayer);
    this.scene.add(this.bouquet);
    this.addLights();
    this.addStage();
    this.rebuild(spec, quality);
    this.bindPointer();
    this.resize();
  }

  rebuild(spec: DailyBouquetSpec, quality: QualityProfile) {
    this.spec = spec;
    this.quality = quality;
    this.frameInterval = 1 / quality.targetFps;
    this.renderer.setClearColor(spec.theme.background);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, quality.pixelRatio));
    this.scene.fog = new THREE.Fog(spec.theme.background, 4.8, 9.2);
    if (this.floorMaterial) {
      this.floorMaterial.color.set(spec.theme.floor);
    }

    while (this.bouquet.children.length) {
      const child = this.bouquet.children.pop();
      if (child) this.disposeObject(child);
    }
    while (this.cosmicLayer.children.length) {
      const child = this.cosmicLayer.children.pop();
      if (child) this.disposeObject(child);
    }

    this.bouquet.rotation.set(0, (hashString(spec.seed) % 628) / 100, 0);
    if (spec.special) {
      this.cosmicLayer.add(buildSpecialCosmicLayer(spec, quality));
    }
    this.bouquet.add(
      buildSpecialDustRings(spec, quality),
      buildStemBundle(spec),
      buildSpecialWrapping(spec),
      buildBranches(spec, quality),
      buildOuterLines(spec, quality),
      buildLeaves(spec, quality),
      buildFlowers(spec, quality),
      buildParticles(spec, quality),
      ...(spec.special ? [buildSpecialBabyBreath(spec, quality)] : [])
    );
  }

  start() {
    this.clock.start();
    const animate = () => {
      this.animationId = window.requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.accumulator += delta;
      if (this.accumulator < this.frameInterval) return;
      this.accumulator = 0;
      this.tick(delta);
    };
    animate();
  }

  stop() {
    window.cancelAnimationFrame(this.animationId);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  setRotationSettings(settings: {
    speed?: number;
    direction?: 1 | -1;
    pitch?: number;
    mode?: CameraRouteMode;
    pitchAmplitude?: number;
    yawAmplitude?: number;
    distanceAmplitude?: number;
    targetYAmplitude?: number;
  }) {
    if (settings.speed !== undefined) {
      this.routeSpeed = THREE.MathUtils.clamp(settings.speed, 0.006, 0.16);
    }
    if (settings.direction !== undefined) {
      this.routeDirection = settings.direction;
    }
    if (settings.pitch !== undefined) {
      this.baseCameraPitch = THREE.MathUtils.clamp(settings.pitch, minCameraPitch, maxCameraPitch);
      this.targetCameraPitch = this.baseCameraPitch;
    }
    if (settings.mode !== undefined) {
      this.routeMode = settings.mode;
      this.routeTime = 0;
      this.routePausedByDrag = false;
    }
    if (settings.pitchAmplitude !== undefined) {
      this.pitchAmplitude = THREE.MathUtils.clamp(settings.pitchAmplitude, 0, 0.42);
    }
    if (settings.yawAmplitude !== undefined) {
      this.yawAmplitude = THREE.MathUtils.clamp(settings.yawAmplitude, 0, 0.58);
    }
    if (settings.distanceAmplitude !== undefined) {
      this.distanceAmplitude = THREE.MathUtils.clamp(settings.distanceAmplitude, 0, 0.62);
    }
    if (settings.targetYAmplitude !== undefined) {
      this.targetYAmplitude = THREE.MathUtils.clamp(settings.targetYAmplitude, 0, 0.2);
    }
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;
    const phone = width < 720;
    const wide = ratio > 1.65;
    this.camera.aspect = width / height;
    this.camera.fov = phone ? 42 : wide ? 32 : 34;
    this.baseCameraDistance = phone ? 6.9 : wide ? 6.15 : 6.45;
    this.targetCameraDistance = this.baseCameraDistance + this.zoomOffset;
    this.cameraDistance = this.targetCameraDistance;
    this.baseCameraTargetY = phone ? 0.66 : wide ? 0.74 : 0.7;
    this.targetCameraTargetY = this.baseCameraTargetY;
    this.cameraTargetY = this.baseCameraTargetY;
    this.updateCamera(emptyRouteOffsets);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private tick(delta: number) {
    let routeOffsets = emptyRouteOffsets;
    if (!this.isPaused && !this.isDragging && !this.routePausedByDrag) {
      this.routeTime += delta * this.routeDirection;
      routeOffsets = this.routeOffsets();
      this.targetCameraYaw += this.routeSpeed * this.routeDirection * this.routePulse() * delta;
      this.targetCameraPitch = THREE.MathUtils.clamp(this.baseCameraPitch + routeOffsets.pitch, minCameraPitch, maxCameraPitch);
      this.targetCameraDistance = this.baseCameraDistance + this.zoomOffset + routeOffsets.distance;
      this.targetCameraTargetY = this.baseCameraTargetY + routeOffsets.targetY;
    }
    this.cameraYaw += (this.targetCameraYaw - this.cameraYaw) * 0.1;
    this.cameraPitch += (this.targetCameraPitch - this.cameraPitch) * 0.1;
    this.cameraDistance += (this.targetCameraDistance - this.cameraDistance) * 0.08;
    this.cameraTargetY += (this.targetCameraTargetY - this.cameraTargetY) * 0.08;
    this.bouquet.position.y = 0.06 + Math.sin(performance.now() * 0.00025) * 0.026;
    if (this.spec.special) {
      const elapsed = performance.now() * 0.001;
      this.bouquet.children.forEach((child) => {
        if (child.userData.spin) child.rotation.y = elapsed * child.userData.spin;
      });
    }
    this.updateCamera(routeOffsets);
    this.renderer.render(this.scene, this.camera);
  }

  private updateCamera(routeOffsets: CameraRouteOffsets) {
    const yaw = this.cameraYaw + routeOffsets.yaw;
    const pitch = THREE.MathUtils.clamp(this.cameraPitch, minCameraPitch, maxCameraPitch);
    const distance = THREE.MathUtils.clamp(this.cameraDistance, 3.2, 8.7);
    const target = new THREE.Vector3(0, this.cameraTargetY, 0);
    const horizontal = Math.cos(pitch) * distance;

    this.camera.position.set(
      Math.sin(yaw) * horizontal,
      target.y + Math.sin(pitch) * distance,
      Math.cos(yaw) * horizontal
    );
    this.camera.lookAt(target);
  }

  private routePulse() {
    if (this.routeMode === 'near-far') {
      return 0.78 + Math.sin(this.routeTime * 0.82) * 0.2;
    }
    if (this.routeMode === 'figure-eight') {
      return 0.54 + Math.sin(this.routeTime * 1.05) * 0.16 + Math.sin(this.routeTime * 0.37) * 0.12;
    }
    if (this.routeMode === 'high-arc') {
      return 0.74 + Math.sin(this.routeTime * 0.48) * 0.12;
    }
    if (this.routeMode === 'low-arc') {
      return 0.64 + Math.cos(this.routeTime * 0.54) * 0.12;
    }
    return 1;
  }

  private routeOffsets(): CameraRouteOffsets {
    if (this.routeMode === 'orbit') return emptyRouteOffsets;

    if (this.routeMode === 'figure-eight') {
      return {
        yaw: Math.sin(this.routeTime * 0.55) * this.yawAmplitude,
        pitch:
          Math.sin(this.routeTime * 0.42) * this.pitchAmplitude +
          Math.sin(this.routeTime * 0.9 + Math.PI / 3) * this.pitchAmplitude * 0.42,
        distance: Math.cos(this.routeTime * 0.38) * this.distanceAmplitude,
        targetY: Math.sin(this.routeTime * 0.31) * this.targetYAmplitude
      };
    }

    if (this.routeMode === 'near-far') {
      return {
        yaw: Math.sin(this.routeTime * 0.34) * this.yawAmplitude,
        pitch: Math.sin(this.routeTime * 0.5) * this.pitchAmplitude,
        distance: Math.sin(this.routeTime * 0.72) * this.distanceAmplitude,
        targetY: Math.cos(this.routeTime * 0.44) * this.targetYAmplitude
      };
    }

    if (this.routeMode === 'high-arc') {
      return {
        yaw: Math.sin(this.routeTime * 0.28) * this.yawAmplitude,
        pitch: Math.sin(this.routeTime * 0.36) * this.pitchAmplitude,
        distance: Math.cos(this.routeTime * 0.26) * this.distanceAmplitude,
        targetY: Math.sin(this.routeTime * 0.22) * this.targetYAmplitude
      };
    }

    return {
      yaw: Math.sin(this.routeTime * 0.38) * this.yawAmplitude,
      pitch: Math.sin(this.routeTime * 0.44) * this.pitchAmplitude,
      distance: Math.cos(this.routeTime * 0.48) * this.distanceAmplitude,
      targetY: Math.sin(this.routeTime * 0.3) * this.targetYAmplitude
    };
  }

  private addLights() {
    const ambient = new THREE.AmbientLight('#fff7e4', 0.96);
    const hemi = new THREE.HemisphereLight('#f4fff2', '#17402d', 0.72);
    const key = new THREE.DirectionalLight('#fff0c8', 1.7);
    key.position.set(2.4, 4.2, 3.4);
    const fill = new THREE.DirectionalLight('#eadcff', 0.82);
    fill.position.set(-3.2, 2.6, 2.2);
    const rim = new THREE.DirectionalLight('#9cf7d2', 0.72);
    rim.position.set(-4, 2.2, -3.5);
    this.scene.add(ambient, hemi, key, fill, rim);
  }

  private addStage() {
    const floorGeometry = new THREE.CircleGeometry(1.16, 80);
    const floorMaterial = new THREE.MeshBasicMaterial({
      color: this.spec.theme.floor,
      transparent: true,
      opacity: 0.035,
      depthWrite: false
    });
    this.floorMaterial = floorMaterial;
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.38;
    this.scene.add(floor);
  }

  private bindPointer() {
    this.canvas.addEventListener('pointerdown', (event) => {
      this.isDragging = true;
      this.routePausedByDrag = true;
      this.canvas.setPointerCapture(event.pointerId);
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.targetCameraYaw = this.cameraYaw;
      this.targetCameraPitch = this.cameraPitch;
      this.targetCameraDistance = this.cameraDistance;
      this.targetCameraTargetY = this.cameraTargetY;
    });

    this.canvas.addEventListener('pointermove', (event) => {
      if (!this.isDragging) return;
      const dx = event.clientX - this.dragX;
      const dy = event.clientY - this.dragY;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.targetCameraYaw -= dx * 0.008;
      this.targetCameraPitch = THREE.MathUtils.clamp(
        this.targetCameraPitch - dy * 0.0058,
        minCameraPitch,
        maxCameraPitch
      );
      this.baseCameraPitch = this.targetCameraPitch;
    });

    const release = (event: PointerEvent) => {
      this.isDragging = false;
      if (this.canvas.hasPointerCapture(event.pointerId)) {
        this.canvas.releasePointerCapture(event.pointerId);
      }
    };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  setZoomOffset(offset: number) {
    this.zoomOffset = THREE.MathUtils.clamp(offset, minZoomOffset, maxZoomOffset);
    this.targetCameraDistance = this.baseCameraDistance + this.zoomOffset;
    return this.zoomOffset;
  }

  zoomBy(delta: number) {
    return this.setZoomOffset(this.zoomOffset + delta);
  }

  getZoomOffset() {
    return this.zoomOffset;
  }

  private disposeObject(object: THREE.Object3D) {
    object.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      const disposeMaterial = (item: THREE.Material) => {
        const mapped = item as THREE.Material & { map?: THREE.Texture };
        if (mapped.map) mapped.map.dispose();
        item.dispose();
      };
      if (Array.isArray(material)) {
        material.forEach(disposeMaterial);
      } else if (material) {
        disposeMaterial(material);
      }
    });
  }
}
