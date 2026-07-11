import * as THREE from 'three';
import { createRng } from './random';
import { createCallaCurledBract, createFrilledNarcissusFlower } from './floraPrimitives';

export type RealisticFlowerId =
  | 'daisy'
  | 'chamomile'
  | 'gerbera'
  | 'sunflower'
  | 'anemone'
  | 'cosmos'
  | 'dahlia'
  | 'rose'
  | 'ranunculus'
  | 'camellia'
  | 'peony'
  | 'pompon-mum'
  | 'tulip'
  | 'narcissus'
  | 'phalaenopsis'
  | 'calla'
  | 'delphinium'
  | 'snapdragon'
  | 'hyacinth'
  | 'foxtail-lily'
  | 'liatris'
  | 'lace-flower'
  | 'hydrangea'
  | 'babys-breath'
  | 'rice-flower';

export type RealisticFlowerCategory = 'face' | 'layered' | 'sculptural' | 'spike' | 'cluster';

export interface RealisticFlowerDefinition {
  id: RealisticFlowerId;
  cn: string;
  en: string;
  category: RealisticFlowerCategory;
  description: string;
  palette: string[];
  printStructure: string;
}

type BuildOptions = {
  seed: string;
  palette: string[];
};

const up = new THREE.Vector3(0, 1, 0);
const tempObject = new THREE.Object3D();

function colorAt(palette: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(palette[index % palette.length] || fallback);
}

function flowerMaterial(color: THREE.Color | string, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function petalGeometry(
  length = 0.8,
  width = 0.2,
  cup = 0.08,
  droop = 0.04,
  pointed = 0.4,
  ruffle = 0
) {
  const positions: number[] = [];
  const rows = 9;
  const cols = 5;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const taper = 1 - pointed * v ** 1.6;
    const halfWidth = Math.sin(v * Math.PI) ** 0.78 * width * taper;
    const edge = Math.abs(u) ** 1.7;
    const wave = Math.sin(v * Math.PI * 3 + u * 2.4) * ruffle * edge * v;
    return new THREE.Vector3(
      u * halfWidth,
      0.1 + v * length,
      Math.sin(v * Math.PI) * cup * (0.35 + edge * 0.65) - droop * v * v + wave
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

function setInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  color: THREE.Color,
  rotationZ = 0,
  normal = up
) {
  tempObject.position.copy(position);
  tempObject.quaternion.setFromUnitVectors(up, normal.clone().normalize());
  tempObject.rotateZ(rotationZ);
  tempObject.scale.copy(scale);
  tempObject.updateMatrix();
  mesh.setMatrixAt(index, tempObject.matrix);
  mesh.setColorAt(index, color);
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: THREE.Color) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.92, direction.length(), 10),
    flowerMaterial(color, 0.9)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function addPrintCore(group: THREE.Group, palette: string[], radius = 0.18, stemLength = 0.72) {
  const green = colorAt(palette, palette.length - 1, '#668857');
  const receptacle = new THREE.Mesh(
    new THREE.SphereGeometry(radius, 18, 12),
    flowerMaterial(green, 0.94)
  );
  receptacle.position.z = -0.05;
  receptacle.scale.set(1, 0.88, 0.7);
  const stem = cylinderBetween(
    new THREE.Vector3(0, 0, -0.08),
    new THREE.Vector3(0, 0, -stemLength),
    Math.max(0.055, radius * 0.42),
    green.clone().lerp(new THREE.Color('#365a39'), 0.28)
  );
  group.add(receptacle, stem);
}

type FaceConfig = {
  petals: number;
  layers: number;
  length: number;
  width: number;
  disk: number;
  cup: number;
  droop: number;
  pointed: number;
  ruffle?: number;
  darkCenter?: boolean;
  seedRing?: boolean;
};

function createFaceFlower(options: BuildOptions, config: FaceConfig) {
  const rng = createRng(`${options.seed}:face`);
  const group = new THREE.Group();
  addPrintCore(group, options.palette, 0.2, 0.74);
  let total = 0;
  for (let layer = 0; layer < config.layers; layer += 1) total += Math.max(6, config.petals - layer * 4);
  const petals = new THREE.InstancedMesh(
    petalGeometry(config.length, config.width, config.cup, config.droop, config.pointed, config.ruffle || 0),
    flowerMaterial(colorAt(options.palette, 0), 0.86),
    total
  );
  let used = 0;
  for (let layer = 0; layer < config.layers; layer += 1) {
    const count = Math.max(6, config.petals - layer * 4);
    const radius = 0.12 + layer * 0.035;
    for (let i = 0; i < count; i += 1) {
      const angle = i / count * Math.PI * 2 + layer * 0.13 + rng.range(-0.025, 0.025);
      const scale = 1 - layer * 0.12;
      setInstance(
        petals,
        used,
        new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, -layer * 0.02),
        new THREE.Vector3(rng.range(0.94, 1.06) * scale, rng.range(0.96, 1.08) * scale, 1),
        colorAt(options.palette, layer).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.13)),
        angle - Math.PI / 2
      );
      used += 1;
    }
  }
  const centerColor = config.darkCenter ? colorAt(options.palette, 2, '#3f2d2d') : colorAt(options.palette, 2, '#e7bd36');
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(config.disk, 24, 14),
    flowerMaterial(centerColor, 0.96)
  );
  center.position.z = 0.07;
  center.scale.set(1, 1, config.seedRing ? 0.44 : 0.58);
  group.add(petals, center);

  if (config.seedRing) {
    const seeds = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.022, 7, 5),
      flowerMaterial(centerColor.clone().lerp(new THREE.Color('#17140f'), 0.28), 1),
      48
    );
    for (let i = 0; i < 48; i += 1) {
      const ring = Math.floor(i / 12) + 1;
      const angle = i * 2.39996;
      const radius = config.disk * 0.17 * ring;
      setInstance(
        seeds,
        i,
        new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.22),
        new THREE.Vector3(1, 1, 0.7),
        centerColor.clone().lerp(new THREE.Color('#201a12'), rng.range(0.15, 0.45))
      );
    }
    group.add(seeds);
  }
  return group;
}

type LayeredConfig = {
  rings: Array<{ count: number; radius: number; length: number; width: number; cup: number; lift: number }>;
  pointed: number;
  ruffle: number;
  center?: 'stamens' | 'closed';
};

function createLayeredFlower(options: BuildOptions, config: LayeredConfig) {
  const rng = createRng(`${options.seed}:layered`);
  const group = new THREE.Group();
  addPrintCore(group, options.palette, 0.22, 0.76);
  config.rings.forEach((ring, ringIndex) => {
    const petals = new THREE.InstancedMesh(
      petalGeometry(ring.length, ring.width, ring.cup, -ring.lift, config.pointed, config.ruffle),
      flowerMaterial(colorAt(options.palette, ringIndex), 0.84),
      ring.count
    );
    for (let i = 0; i < ring.count; i += 1) {
      const angle = i / ring.count * Math.PI * 2 + ringIndex * 0.31 + rng.range(-0.045, 0.045);
      setInstance(
        petals,
        i,
        new THREE.Vector3(Math.cos(angle) * ring.radius, Math.sin(angle) * ring.radius, ringIndex * 0.035),
        new THREE.Vector3(rng.range(0.9, 1.08), rng.range(0.92, 1.1), 1),
        colorAt(options.palette, ringIndex).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.18)),
        angle - Math.PI / 2,
        new THREE.Vector3(Math.cos(angle) * ring.cup * 1.8, 1, Math.sin(angle) * ring.cup * 1.8)
      );
    }
    group.add(petals);
  });
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(config.center === 'stamens' ? 0.18 : 0.13, 18, 12),
    flowerMaterial(config.center === 'stamens' ? colorAt(options.palette, 2, '#e6bd43') : colorAt(options.palette, 0), 0.9)
  );
  center.position.z = 0.2;
  center.scale.z = 0.62;
  group.add(center);
  return group;
}

function createTulip(options: BuildOptions) {
  const rng = createRng(`${options.seed}:tulip`);
  const group = new THREE.Group();
  addPrintCore(group, options.palette, 0.19, 1.05);
  const petals = new THREE.InstancedMesh(
    petalGeometry(0.92, 0.3, 0.24, -0.08, 0.18, 0.01),
    flowerMaterial(colorAt(options.palette, 0), 0.82),
    6
  );
  for (let i = 0; i < 6; i += 1) {
    const angle = i / 6 * Math.PI * 2 + (i % 2 ? 0.12 : -0.05);
    const outer = i % 2 === 0;
    setInstance(
      petals,
      i,
      new THREE.Vector3(Math.cos(angle) * (outer ? 0.14 : 0.08), Math.sin(angle) * (outer ? 0.14 : 0.08), 0.02),
      new THREE.Vector3(outer ? 1.05 : 0.92, outer ? 1.02 : 0.94, 1),
      colorAt(options.palette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.12)),
      angle - Math.PI / 2,
      new THREE.Vector3(Math.cos(angle) * 0.34, 1.15, Math.sin(angle) * 0.34)
    );
  }
  group.add(petals);
  return group;
}

function createNarcissus(options: BuildOptions) {
  const group = createFrilledNarcissusFlower({
    seed: options.seed,
    position: new THREE.Vector3(),
    scale: 1,
    colorPalette: options.palette,
    openness: 0.95,
    density: 1,
    curvature: 0.55,
    role: 'hero'
  });
  const green = colorAt(options.palette, options.palette.length - 1, '#6e995b');
  group.add(cylinderBetween(new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, -0.95), 0.065, green));
  return group;
}

function createPhalaenopsis(options: BuildOptions) {
  const group = new THREE.Group();
  addPrintCore(group, options.palette, 0.17, 0.72);
  const largePetals = new THREE.InstancedMesh(
    petalGeometry(0.76, 0.38, 0.13, 0.01, 0.12, 0.012),
    flowerMaterial(colorAt(options.palette, 0), 0.78),
    5
  );
  const angles = [0, 72, 144, 216, 288].map((value) => value * Math.PI / 180);
  angles.forEach((angle, i) => {
    setInstance(
      largePetals,
      i,
      new THREE.Vector3(Math.cos(angle) * 0.1, Math.sin(angle) * 0.1, 0),
      new THREE.Vector3(i < 2 ? 1.18 : 0.92, i < 2 ? 1.08 : 0.9, 1),
      colorAt(options.palette, i).clone().lerp(new THREE.Color('#ffffff'), i * 0.025),
      angle - Math.PI / 2
    );
  });
  const lip = new THREE.Mesh(
    petalGeometry(0.42, 0.18, 0.18, -0.06, 0.25, 0.025),
    flowerMaterial(colorAt(options.palette, 2), 0.74)
  );
  lip.position.set(0, -0.12, 0.2);
  lip.rotation.z = Math.PI;
  const column = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), flowerMaterial(colorAt(options.palette, 3), 0.72));
  column.position.z = 0.24;
  column.scale.set(0.72, 1.1, 0.72);
  group.add(largePetals, lip, column);
  return group;
}

function createCalla(options: BuildOptions) {
  const group = createCallaCurledBract({
    seed: options.seed,
    position: new THREE.Vector3(),
    scale: 1,
    colorPalette: options.palette,
    openness: 0.9,
    density: 1,
    curvature: 0.82,
    role: 'hero'
  });
  const green = colorAt(options.palette, options.palette.length - 1, '#6d9458');
  group.add(cylinderBetween(new THREE.Vector3(0, -0.28, -0.02), new THREE.Vector3(0, -1.05, -0.05), 0.072, green));
  return group;
}

type SpikeKind = 'delphinium' | 'snapdragon' | 'hyacinth' | 'foxtail-lily' | 'liatris';

function createSpike(options: BuildOptions, kind: SpikeKind) {
  const rng = createRng(`${options.seed}:${kind}`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#587a4f');
  const height = kind === 'hyacinth' ? 1.7 : 2.2;
  group.add(cylinderBetween(new THREE.Vector3(0, -height * 0.55, 0), new THREE.Vector3(0, height * 0.5, 0), 0.055, green));
  const count = kind === 'liatris' ? 34 : kind === 'foxtail-lily' ? 28 : kind === 'hyacinth' ? 18 : 15;
  const petalsPerFloret = kind === 'snapdragon' ? 3 : kind === 'liatris' ? 4 : 5;
  const totalPetals = count * petalsPerFloret;
  const petalLength = kind === 'liatris' ? 0.16 : kind === 'foxtail-lily' ? 0.2 : kind === 'hyacinth' ? 0.24 : 0.3;
  const petals = new THREE.InstancedMesh(
    petalGeometry(petalLength, petalLength * 0.34, 0.04, kind === 'snapdragon' ? -0.05 : 0.01, 0.45, 0.006),
    flowerMaterial(colorAt(options.palette, 0), 0.82),
    totalPetals
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(kind === 'liatris' ? 0.045 : 0.065, 9, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.88),
    count
  );
  let petalIndex = 0;
  for (let i = 0; i < count; i += 1) {
    const t = i / Math.max(1, count - 1);
    const y = -height * 0.18 + t * height * 0.66;
    const taper = 1 - t * (kind === 'foxtail-lily' ? 0.7 : 0.36);
    const angle = i * 2.39996 + rng.range(-0.08, 0.08);
    const reach = (kind === 'liatris' ? 0.1 : 0.16 + 0.1 * taper);
    const centerPos = new THREE.Vector3(Math.cos(angle) * reach, y, Math.sin(angle) * reach);
    const branchStart = new THREE.Vector3(0, y - 0.03, 0);
    group.add(cylinderBetween(branchStart, centerPos, kind === 'liatris' ? 0.018 : 0.025, green));
    setInstance(centers, i, centerPos, new THREE.Vector3(taper, taper, taper), colorAt(options.palette, i + 1));
    for (let p = 0; p < petalsPerFloret; p += 1) {
      const pa = p / petalsPerFloret * Math.PI * 2 + angle;
      const normal = centerPos.clone().normalize().add(new THREE.Vector3(Math.cos(pa) * 0.28, 0.34, Math.sin(pa) * 0.28));
      setInstance(
        petals,
        petalIndex,
        centerPos,
        new THREE.Vector3(taper, taper, taper),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.16)),
        pa - Math.PI / 2,
        normal
      );
      petalIndex += 1;
    }
  }
  group.add(petals, centers);
  return group;
}

type ClusterKind = 'lace-flower' | 'hydrangea' | 'babys-breath' | 'rice-flower';

function createCluster(options: BuildOptions, kind: ClusterKind) {
  const rng = createRng(`${options.seed}:${kind}`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5e7e53');
  group.add(cylinderBetween(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -0.02, 0), 0.06, green));
  const count = kind === 'hydrangea' ? 34 : kind === 'rice-flower' ? 38 : kind === 'babys-breath' ? 24 : 20;
  const petalsPer = kind === 'hydrangea' ? 4 : 5;
  const petalLength = kind === 'hydrangea' ? 0.2 : kind === 'lace-flower' ? 0.13 : 0.095;
  const petals = new THREE.InstancedMesh(
    petalGeometry(petalLength, petalLength * 0.38, 0.025, 0.008, 0.38, 0.003),
    flowerMaterial(colorAt(options.palette, 0), 0.86),
    count * petalsPer
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(kind === 'rice-flower' ? 0.075 : 0.048, 8, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.9),
    count
  );
  let petalIndex = 0;
  for (let i = 0; i < count; i += 1) {
    const angle = i * 2.39996;
    const radial = kind === 'lace-flower'
      ? rng.range(0.5, 0.88)
      : kind === 'hydrangea' ? rng.range(0.12, 0.86) : rng.range(0.28, 0.82);
    const vertical = kind === 'lace-flower'
      ? rng.range(0.05, 0.22)
      : kind === 'hydrangea' ? Math.sqrt(Math.max(0, 0.86 ** 2 - radial ** 2)) * rng.range(0.55, 1) : rng.range(0.1, 0.7);
    const end = new THREE.Vector3(Math.cos(angle) * radial, vertical, Math.sin(angle) * radial);
    const joint = new THREE.Vector3(Math.cos(angle) * radial * 0.38, -0.04 + vertical * 0.28, Math.sin(angle) * radial * 0.38);
    group.add(
      cylinderBetween(new THREE.Vector3(0, -0.03, 0), joint, kind === 'babys-breath' ? 0.018 : 0.024, green),
      cylinderBetween(joint, end, kind === 'babys-breath' ? 0.015 : 0.021, green)
    );
    setInstance(centers, i, end, new THREE.Vector3(1, 1, 1), colorAt(options.palette, i + 1));
    if (kind !== 'rice-flower') {
      for (let p = 0; p < petalsPer; p += 1) {
        const pa = p / petalsPer * Math.PI * 2;
        setInstance(
          petals,
          petalIndex,
          end,
          new THREE.Vector3(1, 1, 1),
          colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.18)),
          pa - Math.PI / 2,
          new THREE.Vector3(Math.cos(pa) * 0.12, 1, Math.sin(pa) * 0.12)
        );
        petalIndex += 1;
      }
    }
  }
  if (kind !== 'rice-flower') group.add(petals);
  group.add(centers);
  return group;
}

const layeredConfigs: Record<'dahlia' | 'rose' | 'ranunculus' | 'camellia' | 'peony' | 'pompon-mum', LayeredConfig> = {
  dahlia: {
    pointed: 0.82,
    ruffle: 0.008,
    rings: [
      { count: 18, radius: 0.34, length: 0.78, width: 0.16, cup: 0.05, lift: 0.08 },
      { count: 15, radius: 0.25, length: 0.62, width: 0.14, cup: 0.08, lift: 0.12 },
      { count: 12, radius: 0.16, length: 0.45, width: 0.12, cup: 0.14, lift: 0.16 }
    ],
    center: 'closed'
  },
  rose: {
    pointed: 0.12,
    ruffle: 0.018,
    rings: [
      { count: 9, radius: 0.36, length: 0.7, width: 0.3, cup: 0.16, lift: 0.04 },
      { count: 8, radius: 0.25, length: 0.56, width: 0.26, cup: 0.25, lift: 0.1 },
      { count: 7, radius: 0.14, length: 0.4, width: 0.2, cup: 0.34, lift: 0.18 }
    ],
    center: 'closed'
  },
  ranunculus: {
    pointed: 0.04,
    ruffle: 0.006,
    rings: [
      { count: 12, radius: 0.38, length: 0.62, width: 0.28, cup: 0.08, lift: 0.02 },
      { count: 11, radius: 0.28, length: 0.5, width: 0.25, cup: 0.13, lift: 0.07 },
      { count: 10, radius: 0.19, length: 0.38, width: 0.21, cup: 0.19, lift: 0.12 },
      { count: 8, radius: 0.11, length: 0.27, width: 0.17, cup: 0.25, lift: 0.16 }
    ],
    center: 'closed'
  },
  camellia: {
    pointed: 0.16,
    ruffle: 0.004,
    rings: [
      { count: 8, radius: 0.36, length: 0.68, width: 0.31, cup: 0.1, lift: 0.02 },
      { count: 8, radius: 0.24, length: 0.52, width: 0.27, cup: 0.16, lift: 0.08 },
      { count: 7, radius: 0.14, length: 0.36, width: 0.21, cup: 0.22, lift: 0.12 }
    ],
    center: 'stamens'
  },
  peony: {
    pointed: 0.08,
    ruffle: 0.045,
    rings: [
      { count: 10, radius: 0.4, length: 0.78, width: 0.34, cup: 0.12, lift: 0.05 },
      { count: 10, radius: 0.28, length: 0.62, width: 0.3, cup: 0.19, lift: 0.11 },
      { count: 9, radius: 0.17, length: 0.44, width: 0.24, cup: 0.27, lift: 0.17 }
    ],
    center: 'stamens'
  },
  'pompon-mum': {
    pointed: 0.62,
    ruffle: 0.008,
    rings: [
      { count: 18, radius: 0.36, length: 0.54, width: 0.12, cup: 0.2, lift: 0.12 },
      { count: 16, radius: 0.26, length: 0.46, width: 0.11, cup: 0.28, lift: 0.18 },
      { count: 14, radius: 0.16, length: 0.36, width: 0.1, cup: 0.36, lift: 0.22 }
    ],
    center: 'closed'
  }
};

export const realisticFlowerDefinitions: RealisticFlowerDefinition[] = [
  { id: 'daisy', cn: '雏菊', en: 'Daisy', category: 'face', description: '白色窄瓣、清楚黄心、轻薄平展。', palette: ['#fffdf0', '#f7f0d8', '#efc83f', '#71945b'], printStructure: '花瓣根部插入花托，黄心覆盖连接区。' },
  { id: 'chamomile', cn: '洋甘菊', en: 'Chamomile', category: 'face', description: '较少且略下垂的白瓣，黄心更高、更圆。', palette: ['#fff8e4', '#f8efd6', '#e6bd2d', '#698a52'], printStructure: '短瓣与拱形花心相交，连接短花梗。' },
  { id: 'gerbera', cn: '非洲菊', en: 'Gerbera Daisy', category: 'face', description: '双层密集长瓣，彩色花面和深色中心。', palette: ['#ff806f', '#ffad73', '#5b3b36', '#66834d'], printStructure: '双层花瓣共同插入加宽花托。' },
  { id: 'sunflower', cn: '太阳花', en: 'Sunflower', category: 'face', description: '金黄宽瓣围绕大型深色籽盘。', palette: ['#ffc62f', '#f2a921', '#493622', '#5d7d45'], printStructure: '花瓣被厚籽盘和花托双向夹持。' },
  { id: 'anemone', cn: '银莲花', en: 'Anemone', category: 'face', description: '少量宽瓣与醒目的暗色圆心。', palette: ['#f3e9ff', '#d9c7ef', '#252333', '#66814f'], printStructure: '宽瓣深插花托，暗色花心形成中心锁定。' },
  { id: 'cosmos', cn: '波斯菊', en: 'Cosmos', category: 'face', description: '八片轻薄宽瓣，花面松、中心小。', palette: ['#fff7e8', '#f5ded7', '#e1b52f', '#6d8b54'], printStructure: '八瓣根部交叠并进入中心花托。' },
  { id: 'dahlia', cn: '大丽花', en: 'Dahlia', category: 'layered', description: '尖瓣多层放射，中心收紧。', palette: ['#ff9eba', '#f27eaa', '#e66091', '#66894f'], printStructure: '多环花瓣逐层重叠并与中心花托相交。' },
  { id: 'rose', cn: '玫瑰', en: 'Rose', category: 'layered', description: '宽瓣内卷，外松内紧的螺旋层次。', palette: ['#ef879f', '#f7a9b9', '#ffd0d8', '#66864e'], printStructure: '每层花瓣插入连续花托，中心闭合。' },
  { id: 'ranunculus', cn: '花毛茛', en: 'Ranunculus', category: 'layered', description: '大量薄圆瓣同心叠合，层层收拢。', palette: ['#ffc477', '#ffad68', '#ffe0a0', '#6f8b52'], printStructure: '四层花瓣环互相重叠并覆盖花托。' },
  { id: 'camellia', cn: '山茶', en: 'Camellia', category: 'layered', description: '蜡质宽瓣、对称展开、中心可见花蕊。', palette: ['#f06067', '#ff8a8a', '#f2c446', '#58794b'], printStructure: '厚瓣与花托相交，花蕊固定在中心芯体。' },
  { id: 'peony', cn: '牡丹', en: 'Peony', category: 'layered', description: '大而蓬松的褶皱瓣，层次松散饱满。', palette: ['#f5a8c7', '#f8bfd6', '#efc84d', '#64844f'], printStructure: '褶皱瓣根部加厚并嵌入宽花托。' },
  { id: 'pompon-mum', cn: '乒乓菊', en: 'Pompon Chrysanthemum', category: 'layered', description: '短窄瓣向内包合成紧密球头。', palette: ['#cbe99f', '#a9d776', '#e7f5bd', '#5d7f4a'], printStructure: '球形多层瓣与中心芯体连续相交。' },
  { id: 'tulip', cn: '郁金香', en: 'Tulip', category: 'sculptural', description: '六片勺形花瓣包成半闭合杯。', palette: ['#ffb447', '#ffd17a', '#f08d67', '#62864f'], printStructure: '内外花瓣与球形花托、粗花梗相交。' },
  { id: 'narcissus', cn: '洋水仙', en: 'Narcissus', category: 'sculptural', description: '六片花被、褶边副冠、深喉和可见花蕊。', palette: ['#fff2bc', '#ffe4a0', '#f3b13e', '#ffd46c', '#6f9658'], printStructure: '副冠、花蕊、花被、花托与花梗连续连接。' },
  { id: 'phalaenopsis', cn: '蝴蝶兰', en: 'Phalaenopsis Orchid', category: 'sculptural', description: '左右展开的大瓣、上下萼片和中央唇瓣。', palette: ['#f3c6ea', '#fff1fb', '#d56cad', '#f1b44f', '#64834d'], printStructure: '五片主瓣与中央柱体相交，唇瓣连接柱体。' },
  { id: 'calla', cn: '马蹄莲', en: 'Calla Lily', category: 'sculptural', description: '单片卷曲苞片包围肉穗花序。', palette: ['#fff4d5', '#f5df9e', '#e9b742', '#6a8b57'], printStructure: '苞片基部闭合连接粗花梗，肉穗固定在内部。' },
  { id: 'delphinium', cn: '飞燕草', en: 'Delphinium', category: 'spike', description: '蓝色开放小花沿高直花轴分层分布。', palette: ['#6f95ed', '#9fb7ff', '#f4e7b9', '#55734e'], printStructure: '每朵小花通过短花梗连接中央花轴。' },
  { id: 'snapdragon', cn: '金鱼草', en: 'Snapdragon', category: 'spike', description: '密集唇形花沿花轴排列，底密顶疏。', palette: ['#ff8877', '#ffb197', '#f7d07c', '#5b7d4e'], printStructure: '每个唇形花头以加厚短梗连接主轴。' },
  { id: 'hyacinth', cn: '风信子', en: 'Hyacinth', category: 'spike', description: '短粗花轴上聚集密集星形小花。', palette: ['#9f86df', '#c2adef', '#f0d77b', '#55764e'], printStructure: '所有星形小花由短梗接入粗花轴。' },
  { id: 'foxtail-lily', cn: '狐尾百合', en: 'Foxtail Lily', category: 'spike', description: '细长锥形花穗，密集小花向上渐疏。', palette: ['#f2a64a', '#f8c46d', '#ffe0a0', '#607d4e'], printStructure: '渐缩花梗和小花共同围绕连续主轴。' },
  { id: 'liatris', cn: '蛇鞭菊', en: 'Liatris', category: 'spike', description: '紫色细密绒穗紧贴直立花轴。', palette: ['#a36bd1', '#c28ae2', '#e8b5f1', '#55734d'], printStructure: '短花丝簇紧贴加粗花轴，无悬浮花点。' },
  { id: 'lace-flower', cn: '蕾丝花', en: 'Lace Flower', category: 'cluster', description: '伞形分枝托起一层细小白花。', palette: ['#fffdf0', '#f5eed4', '#e6cf78', '#5e7d52'], printStructure: '每个小花头通过两段实体分枝连接主梗。' },
  { id: 'hydrangea', cn: '绣球', en: 'Hydrangea', category: 'cluster', description: '四瓣小花组成饱满球形云团。', palette: ['#9dc9ef', '#bddcf6', '#e6d988', '#5d7f54'], printStructure: '小花通过实体分枝汇入中央主梗。' },
  { id: 'babys-breath', cn: '满天星', en: "Baby's Breath", category: 'cluster', description: '极细分枝托起疏松白色小花点。', palette: ['#fffdf4', '#f3eedf', '#e8d99c', '#617e56'], printStructure: '细枝仍保留最小实体直径，小花固定在枝端。' },
  { id: 'rice-flower', cn: '米花', en: 'Rice Flower', category: 'cluster', description: '细密米粒状花苞形成紧凑小簇。', palette: ['#fff0dd', '#f2d8bd', '#dfbc83', '#617e54'], printStructure: '米粒花苞直接连接实体分枝，不使用悬空粒子。' }
];

export function createRealisticFlower(definition: RealisticFlowerDefinition, seed: string) {
  const options: BuildOptions = { seed, palette: definition.palette };
  switch (definition.id) {
    case 'daisy':
      return createFaceFlower(options, { petals: 20, layers: 1, length: 0.78, width: 0.13, disk: 0.27, cup: 0.06, droop: 0.05, pointed: 0.58 });
    case 'chamomile':
      return createFaceFlower(options, { petals: 14, layers: 1, length: 0.62, width: 0.12, disk: 0.31, cup: 0.04, droop: 0.16, pointed: 0.5 });
    case 'gerbera':
      return createFaceFlower(options, { petals: 34, layers: 2, length: 0.86, width: 0.12, disk: 0.28, cup: 0.04, droop: 0.04, pointed: 0.62, darkCenter: true });
    case 'sunflower':
      return createFaceFlower(options, { petals: 24, layers: 1, length: 0.78, width: 0.2, disk: 0.43, cup: 0.05, droop: 0.07, pointed: 0.42, darkCenter: true, seedRing: true });
    case 'anemone':
      return createFaceFlower(options, { petals: 9, layers: 1, length: 0.78, width: 0.29, disk: 0.36, cup: 0.09, droop: 0.03, pointed: 0.08, darkCenter: true, seedRing: true });
    case 'cosmos':
      return createFaceFlower(options, { petals: 8, layers: 1, length: 0.86, width: 0.3, disk: 0.2, cup: 0.05, droop: 0.07, pointed: 0.18, ruffle: 0.015 });
    case 'dahlia': case 'rose': case 'ranunculus': case 'camellia': case 'peony': case 'pompon-mum':
      return createLayeredFlower(options, layeredConfigs[definition.id]);
    case 'tulip':
      return createTulip(options);
    case 'narcissus':
      return createNarcissus(options);
    case 'phalaenopsis':
      return createPhalaenopsis(options);
    case 'calla':
      return createCalla(options);
    case 'delphinium': case 'snapdragon': case 'hyacinth': case 'foxtail-lily': case 'liatris':
      return createSpike(options, definition.id);
    case 'lace-flower': case 'hydrangea': case 'babys-breath': case 'rice-flower':
      return createCluster(options, definition.id);
  }
}
