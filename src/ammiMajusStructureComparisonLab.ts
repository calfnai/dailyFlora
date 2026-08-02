import * as THREE from 'three';
import { createRng, type Rng } from './random';

type ViewName = 'front' | 'side' | 'top';
type Variant = 'current' | 'rebuilt' | 'clustered' | 'lace';
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

function addMutedSegments(group: THREE.Group, segments: Segment[]) {
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.78, 1, 1, 5, 1, false),
    new THREE.MeshStandardMaterial({
      color: '#3d5238',
      roughness: 0.98,
      metalness: 0,
      transparent: true,
      opacity: 0.46
    }),
    segments.length
  );
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

function addBlooms(
  group: THREE.Group,
  blooms: Bloom[],
  rng: Rng,
  dimensions = { petalLength: 0.032, petalWidth: 0.0215, petalCup: 0.0018, centerRadius: 0.0072, budRadius: 0.017 }
) {
  const petals = new THREE.InstancedMesh(
    petalGeometry(dimensions.petalLength, dimensions.petalWidth, dimensions.petalCup),
    material(flowerWhite, 0.9),
    blooms.length * 5
  );
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(dimensions.centerRadius, 7, 5), material(centerGold, 0.92), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(dimensions.budRadius, 7, 5), material(flowerWarm, 0.92), blooms.length);
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

type DirectionGroup = {
  angle: number;
  reaches: number[];
  offsets: number[];
};

function createClusteredModel(seed: string) {
  const rng = createRng(`${seed}:clustered-lace-plane-v1`);
  const group = new THREE.Group();
  const branchBase = new THREE.Vector3(0, 0.02, 0);
  const branchTop = new THREE.Vector3(0.006, 0.16, -0.004);
  group.add(stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.028, -0.61, 0.012),
    branchBase,
    branchTop
  ], 0.015));

  const directionGroups: DirectionGroup[] = [
    { angle: -2.66, reaches: [0.08, 0.3, 0.53, 0.72, 0.88, 0.64], offsets: [-0.25, -0.13, -0.04, 0.06, 0.18, 0.31] },
    { angle: -1.43, reaches: [0.06, 0.27, 0.5, 0.79, 0.62], offsets: [-0.22, -0.08, 0.04, 0.17, 0.3] },
    { angle: -0.31, reaches: [0.09, 0.23, 0.43, 0.61, 0.86, 0.69, 0.5], offsets: [-0.3, -0.18, -0.08, 0.02, 0.12, 0.23, 0.34] },
    { angle: 1.04, reaches: [0.07, 0.29, 0.55, 0.82, 0.66, 0.46], offsets: [-0.27, -0.12, -0.01, 0.1, 0.22, 0.36] },
    { angle: 2.3, reaches: [0.1, 0.25, 0.47, 0.71, 0.9, 0.59], offsets: [-0.24, -0.1, 0.03, 0.15, 0.27, 0.38] }
  ];
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const layerCounts = { near: 0, middle: 0, far: 0 };
  let primaryIndex = 0;

  directionGroups.forEach((directionGroup, groupIndex) => {
    directionGroup.reaches.forEach((baseReach, memberIndex) => {
      const layerIndex = (primaryIndex * 2 + groupIndex) % 3;
      const layer = layerIndex === 0 ? 'near' : layerIndex === 1 ? 'middle' : 'far';
      layerCounts[layer] += 1;
      const angle = directionGroup.angle + directionGroup.offsets[memberIndex] + rng.range(-0.045, 0.045);
      const reach = THREE.MathUtils.clamp(baseReach + rng.range(-0.045, 0.045), 0.09, 0.92);
      const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
      const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
      const startHeight = rng.range(0.018, 0.215);
      const start = new THREE.Vector3(0, startHeight, 0)
        .addScaledVector(radial, rng.range(0.012, 0.046))
        .addScaledVector(tangent, rng.range(-0.024, 0.024));
      const layerLift = layer === 'near' ? 0.038 : layer === 'far' ? -0.034 : 0;
      const miniHub = radial.clone().multiplyScalar(reach)
        .addScaledVector(tangent, rng.range(-0.065, 0.065));
      miniHub.y = rng.range(0.38, 0.555) + layerLift + (0.42 - reach) * 0.02;
      segments.push({ start, end: miniHub, radius: rng.range(0.00068, 0.0012) });

      const band = reach < 0.32 ? 'center' : reach < 0.59 ? 'middle' : 'outer';
      const count = band === 'center' ? Math.round(rng.range(9, 12)) : band === 'middle' ? Math.round(rng.range(10, 14)) : Math.round(rng.range(11, 15));
      const spread = band === 'center' ? rng.range(0.108, 0.148) : band === 'middle' ? rng.range(0.148, 0.202) : rng.range(0.172, 0.23);
      const normal = up.clone().addScaledVector(radial, rng.range(0.02, 0.095)).addScaledVector(tangent, rng.range(-0.045, 0.045)).normalize();
      const frame = tangentFrame(normal);
      const clusterStretch = rng.range(1.14, 1.62);
      for (let f = 0; f < count; f += 1) {
        const fa = rng.range(0, Math.PI * 2);
        const localReach = spread * Math.sqrt(rng.range(0.025, 1));
        const offset = frame.tangent.clone().multiplyScalar(Math.cos(fa) * localReach * clusterStretch)
          .addScaledVector(frame.bitangent, Math.sin(fa) * localReach / clusterStretch);
        const bloom = miniHub.clone().add(offset);
        bloom.y += rng.range(-0.064, 0.07) + (f % 4 === 0 ? rng.range(0.012, 0.034) : 0);
        const bloomNormal = normal.clone().addScaledVector(offset.clone().normalize(), rng.range(0.08, 0.24)).normalize();
        segments.push({ start: miniHub, end: bloom, radius: rng.range(0.00038, 0.00068) });
        blooms.push({
          position: bloom,
          normal: bloomNormal,
          scale: rng.range(0.88, 1.13),
          bud: f === count - 1 && (primaryIndex + groupIndex) % 6 === 0
        });
      }
      primaryIndex += 1;
    });
  });

  addSegments(group, segments);
  addBlooms(group, blooms, rng);
  group.userData.structureStats = {
    primaryRays: primaryIndex,
    directionGroups: directionGroups.length,
    staggeredStarts: true,
    layers: layerCounts,
    blooms: blooms.length,
    readingOrder: 'continuous lace face, overlapping cluster groups, obscured fine support'
  };
  return group;
}

function createDensityLaceModel(seed: string) {
  const rng = createRng(`${seed}:density-lace-v1`);
  const group = new THREE.Group();
  const branchBase = new THREE.Vector3(0, 0.025, 0);
  const branchTop = new THREE.Vector3(0.004, 0.165, -0.003);
  group.add(stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.026, -0.61, 0.011),
    branchBase,
    branchTop
  ], 0.015));

  const primaryCount = 72;
  const angles = unevenAngles(primaryCount, rng);
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const miniHubs: THREE.Vector3[] = [];
  const bandCounts = { center: 0, middle: 0, outer: 0 };
  const bandOrder: Array<'center' | 'middle' | 'outer'> = [
    ...Array.from({ length: 18 }, () => 'center' as const),
    ...Array.from({ length: 36 }, () => 'middle' as const),
    ...Array.from({ length: 18 }, () => 'outer' as const)
  ];
  for (let i = bandOrder.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(rng.range(0, i + 1));
    [bandOrder[i], bandOrder[swapIndex]] = [bandOrder[swapIndex], bandOrder[i]];
  }

  for (let i = 0; i < primaryCount; i += 1) {
    const band = bandOrder[i];
    bandCounts[band] += 1;
    const angle = angles[i] + rng.range(-0.035, 0.035);
    const radius = band === 'center'
      ? Math.sqrt(rng.range(0.015, 1)) * 0.36
      : band === 'middle'
        ? rng.range(0.28, 0.72)
        : rng.range(0.66, 0.96);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const start = radial.clone().multiplyScalar(rng.range(0.008, 0.034))
      .addScaledVector(tangent, rng.range(-0.02, 0.02));
    start.y = rng.range(0.025, 0.165);

    let miniHub = radial.clone().multiplyScalar(radius)
      .addScaledVector(tangent, rng.range(-0.075, 0.075));
    if (i > 5 && i % 4 === 0) {
      const neighbor = miniHubs[i - 1];
      const neighborAngle = rng.range(-Math.PI, Math.PI);
      const neighborDistance = rng.range(0.015, 0.045);
      miniHub.lerp(neighbor, rng.range(0.22, 0.36)).add(new THREE.Vector3(
        Math.cos(neighborAngle) * neighborDistance,
        0,
        Math.sin(neighborAngle) * neighborDistance
      ));
    }
    miniHub.y = 0.46 + (1 - Math.min(radius, 0.96) / 0.96) * 0.055 + rng.range(-0.055, 0.06);
    miniHubs.push(miniHub);
    segments.push({ start, end: miniHub, radius: rng.range(0.00024, 0.00058) });

    const count = band === 'center'
      ? Math.round(rng.range(12, 16))
      : band === 'middle'
        ? Math.round(rng.range(11, 15))
        : Math.round(rng.range(10, 14));
    const spread = band === 'center'
      ? rng.range(0.07, 0.1)
      : band === 'middle'
        ? rng.range(0.09, 0.132)
        : rng.range(0.1, 0.145);
    const normal = up.clone()
      .addScaledVector(radial, rng.range(0.015, 0.075))
      .addScaledVector(tangent, rng.range(-0.035, 0.035))
      .normalize();
    const frame = tangentFrame(normal);
    const clusterStretch = rng.range(0.82, 1.36);

    for (let f = 0; f < count; f += 1) {
      const fa = rng.range(0, Math.PI * 2);
      const localReach = spread * Math.sqrt(rng.range(0.01, 1));
      const offset = frame.tangent.clone().multiplyScalar(Math.cos(fa) * localReach * clusterStretch)
        .addScaledVector(frame.bitangent, Math.sin(fa) * localReach / clusterStretch);
      const bloom = miniHub.clone().add(offset);
      bloom.y += rng.range(-0.038, 0.045);
      const tiltAngle = rng.range(-Math.PI, Math.PI);
      const horizontalTilt = rng.range(0.28, 0.78);
      const bloomNormal = normal.clone().multiplyScalar(rng.range(0.48, 0.78))
        .add(new THREE.Vector3(
          Math.cos(tiltAngle) * horizontalTilt,
          rng.range(-0.08, 0.2),
          Math.sin(tiltAngle) * horizontalTilt
        ))
        .normalize();
      segments.push({ start: miniHub, end: bloom, radius: rng.range(0.00016, 0.00034) });
      blooms.push({
        position: bloom,
        normal: bloomNormal,
        scale: rng.range(0.68, 0.86),
        bud: f === count - 1 && (i * 3 + f) % 11 === 0
      });
    }
  }

  addMutedSegments(group, segments);
  addBlooms(group, blooms, rng, {
    petalLength: 0.025,
    petalWidth: 0.0175,
    petalCup: 0.0013,
    centerRadius: 0.0035,
    budRadius: 0.0105
  });
  group.userData.structureStats = {
    primaryRays: primaryCount,
    bands: bandCounts,
    miniUmbels: primaryCount,
    blooms: blooms.length,
    readingOrder: 'continuous fine lace, partial micro-umbels, faint support'
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
  const model = variant === 'current'
    ? createCurrentErrorModel('ammi-comparison')
    : variant === 'rebuilt'
      ? createRebuiltModel('ammi-comparison')
      : variant === 'clustered'
        ? createClusteredModel('ammi-comparison')
        : createDensityLaceModel('ammi-comparison');
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
  createPanel('clustered', 'front'),
  createPanel('lace', 'front'),
  createPanel('current', 'side'),
  createPanel('rebuilt', 'side'),
  createPanel('clustered', 'side'),
  createPanel('lace', 'side'),
  createPanel('current', 'top'),
  createPanel('rebuilt', 'top'),
  createPanel('clustered', 'top'),
  createPanel('lace', 'top')
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  const distance = panel.camera.aspect < 1 ? 3.72 : 3.0;
  if (panel.view === 'side') panel.camera.position.set(distance, 0.08, 0);
  else if (panel.view === 'top') panel.camera.position.set(0, distance, 0.015);
  else panel.camera.position.set(0, 0.92, distance);
  panel.camera.lookAt(0, -0.02, 0);
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 1100;
  if (mobile) {
    const cellHeight = Math.floor(height / 12);
    return { left: 0, bottom: height - (index + 1) * cellHeight, width, height: index === 11 ? height - cellHeight * 11 : cellHeight };
  }
  const columnWidth = Math.floor(width / 4);
  const rowHeight = Math.floor(height / 3);
  return {
    left: (index % 4) * columnWidth,
    bottom: height - (Math.floor(index / 4) + 1) * rowHeight,
    width: index % 4 === 3 ? width - columnWidth * 3 : columnWidth,
    height: Math.floor(index / 4) === 2 ? height - rowHeight * 2 : rowHeight
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
    rebuilt: panels[1].model.userData.structureStats,
    clustered: panels[2].model.userData.structureStats,
    lace: panels[3].model.userData.structureStats
  }
});
