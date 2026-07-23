import * as THREE from 'three';
import { createRng } from './random';
import { createCallaCurledBract, createFrilledNarcissusFlower } from './floraPrimitives';
import {
  createBabysBreath as createCalibratedBabysBreath,
  createDelphinium as createCalibratedDelphinium,
  createFoxtailLily as createCalibratedFoxtailLily,
  createHyacinth as createCalibratedHyacinth,
  createLaceFlower as createCalibratedLaceFlower,
  createLiatris as createCalibratedLiatris,
  createSnapdragon as createCalibratedSnapdragon
} from './realisticBotanicalForms';

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
  frozen?: boolean;
  cn: string;
  en: string;
  scientificName?: string;
  category: RealisticFlowerCategory;
  description: string;
  calibration?: string;
  scopeNote?: string;
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

function roundedSepalGeometry(length = 0.15, width = 0.11, cup = 0.012) {
  const positions: number[] = [];
  const rows = 9;
  const cols = 5;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const profile = v < 0.78
      ? Math.sin(v / 0.78 * Math.PI * 0.5) ** 0.72
      : Math.cos((v - 0.78) / 0.22 * Math.PI * 0.5) ** 0.62;
    return new THREE.Vector3(
      u * width * profile,
      v * length,
      Math.sin(v * Math.PI) * cup * (0.7 + Math.abs(u) * 0.3)
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

function stemAlong(points: THREE.Vector3[], radius: number, color: THREE.Color, segments = 18) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, radius, 7, false),
    flowerMaterial(color, 0.92)
  );
  return { curve, mesh };
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

type LegacySpikeKind = 'delphinium' | 'snapdragon' | 'hyacinth' | 'foxtail-lily' | 'liatris';

// Retained only as an archived comparison for the before/after study; the LAB no longer calls it.
function createLegacySpikeTemplate(options: BuildOptions, kind: LegacySpikeKind) {
  const rng = createRng(`${options.seed}:${kind}`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#587a4f');
  const height = kind === 'hyacinth' ? 1.72 : 2.2;
  const sway = kind === 'hyacinth' ? 0.07 : kind === 'liatris' ? 0.09 : kind === 'foxtail-lily' ? 0.08 : kind === 'snapdragon' ? 0.16 : 0.2;
  const baseY = -height * 0.62;
  const topY = height * 0.52;
  const stemPoints = [
    new THREE.Vector3(0, baseY, 0),
    new THREE.Vector3(rng.range(-0.06, 0.06), baseY + height * 0.28, rng.range(-0.04, 0.04)),
    new THREE.Vector3(rng.range(-sway, sway) * 0.48, baseY + height * 0.58, rng.range(-sway, sway) * 0.32),
    new THREE.Vector3(rng.range(-sway, sway), baseY + height * 0.82, rng.range(-sway, sway) * 0.7),
    new THREE.Vector3(rng.range(-sway, sway) * 1.18, topY, rng.range(-sway, sway))
  ];
  const stemRadius = kind === 'hyacinth' ? 0.036 : kind === 'liatris' ? 0.022 : 0.027;
  const stem = stemAlong(stemPoints, stemRadius, green, 22);
  group.add(stem.mesh);
  const count = kind === 'liatris' ? 48 : kind === 'foxtail-lily' ? 40 : kind === 'hyacinth' ? 28 : kind === 'snapdragon' ? 17 : 19;
  const petalsPerFloret = kind === 'snapdragon' ? 3 : kind === 'hyacinth' || kind === 'foxtail-lily' ? 6 : kind === 'liatris' ? 5 : 5;
  const totalPetals = count * petalsPerFloret;
  const petalLength = kind === 'liatris' ? 0.13 : kind === 'foxtail-lily' ? 0.17 : kind === 'hyacinth' ? 0.2 : 0.3;
  const petalWidthRatio = kind === 'snapdragon' ? 0.52 : kind === 'hyacinth' ? 0.28 : kind === 'liatris' ? 0.2 : 0.34;
  const petals = new THREE.InstancedMesh(
    petalGeometry(
      petalLength,
      petalLength * petalWidthRatio,
      kind === 'snapdragon' ? 0.075 : 0.04,
      kind === 'snapdragon' ? -0.075 : kind === 'liatris' ? 0.035 : 0.01,
      kind === 'snapdragon' ? 0.18 : kind === 'liatris' ? 0.68 : 0.45,
      kind === 'liatris' ? 0.012 : 0.006
    ),
    flowerMaterial(colorAt(options.palette, 0), 0.82),
    totalPetals
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(kind === 'liatris' ? 0.045 : 0.065, 9, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.88),
    count
  );
  const spurs = kind === 'delphinium'
    ? new THREE.InstancedMesh(
      petalGeometry(0.2, 0.035, 0.015, 0.025, 0.82, 0),
      flowerMaterial(colorAt(options.palette, 1), 0.86),
      count
    )
    : null;
  let petalIndex = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / Math.max(1, count - 1);
    const t = (kind === 'hyacinth' ? 0.39 : 0.32) + progress * (kind === 'hyacinth' ? 0.55 : 0.66);
    const taper = kind === 'foxtail-lily'
      ? 1 - progress ** 1.45 * 0.78
      : kind === 'snapdragon' ? 1 - progress * 0.48
        : 1 - progress * 0.32;
    const angle = kind === 'snapdragon'
      ? (i % 2) * Math.PI + rng.range(-0.42, 0.42)
      : i * 2.39996 + rng.range(-0.12, 0.12);
    const reach = kind === 'liatris' ? rng.range(0.045, 0.07)
        : kind === 'hyacinth' ? rng.range(0.13, 0.19)
          : kind === 'foxtail-lily' ? 0.08 + 0.13 * taper
            : kind === 'snapdragon' ? 0.12 + 0.13 * taper
              : rng.range(0.16, 0.25) * (0.82 + taper * 0.18);
    const axisPoint = stem.curve.getPoint(t);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const centerPos = axisPoint.clone().addScaledVector(radial, reach);
    const branchStart = stem.curve.getPoint(Math.max(0, t - 0.012));
    group.add(cylinderBetween(branchStart, centerPos, kind === 'liatris' ? 0.007 : kind === 'foxtail-lily' ? 0.009 : 0.012, green));
    const floretScale = kind === 'hyacinth' ? taper * 0.88
      : kind === 'liatris' ? taper * 0.72
        : taper;
    const centerScale = kind === 'snapdragon'
      ? new THREE.Vector3(floretScale * 0.78, floretScale * 1.45, floretScale * 0.9)
      : kind === 'hyacinth'
        ? new THREE.Vector3(floretScale * 0.72, floretScale * 1.35, floretScale * 0.72)
        : new THREE.Vector3(floretScale, floretScale, floretScale);
    setInstance(centers, i, centerPos, centerScale, colorAt(options.palette, i + 1), 0, radial);
    if (spurs) {
      const spurDirection = radial.clone().multiplyScalar(-1).add(new THREE.Vector3(0, -0.14, 0)).normalize();
      const spurBase = centerPos.clone().addScaledVector(radial, -0.035);
      setInstance(
        spurs,
        i,
        spurBase,
        new THREE.Vector3(taper * 0.82, taper * 0.9, 1),
        colorAt(options.palette, 1).clone().lerp(new THREE.Color('#ffffff'), 0.06),
        0,
        spurDirection
      );
    }
    for (let p = 0; p < petalsPerFloret; p += 1) {
      const pa = p / petalsPerFloret * Math.PI * 2 + angle;
      const normal = kind === 'hyacinth'
        ? radial.clone().normalize().add(new THREE.Vector3(Math.cos(pa) * 0.22, 0.08, Math.sin(pa) * 0.22))
        : radial.clone().normalize().add(new THREE.Vector3(Math.cos(pa) * 0.2, 0.34, Math.sin(pa) * 0.2));
      const lipScale = kind === 'snapdragon'
        ? (p === 0 ? new THREE.Vector3(floretScale * 1.32, floretScale * 1.08, 1) : new THREE.Vector3(floretScale * 0.82, floretScale * 0.92, 1))
        : new THREE.Vector3(floretScale, floretScale, 1);
      setInstance(
        petals,
        petalIndex,
        centerPos,
        lipScale,
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.16)),
        pa - Math.PI / 2,
        normal
      );
      petalIndex += 1;
    }
  }
  group.add(petals, centers);
  if (spurs) group.add(spurs);
  return group;
}

// FROZEN: do not modify Hydrangea geometry or parameters without explicit user unfreeze.
function createHydrangeaBaseline(options: BuildOptions) {
  const rng = createRng(`${options.seed}:hydrangea`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5d7f54');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.025, -0.72, 0.015),
    new THREE.Vector3(0.035, -0.28, -0.02),
    new THREE.Vector3(0, 0.02, 0)
  ], 0.028, green, 16);
  group.add(stem.mesh);

  const flowerCount = 104;
  const cloudCenter = new THREE.Vector3(0, 0.4, 0);
  const petals = new THREE.InstancedMesh(
    roundedSepalGeometry(0.15, 0.115, 0.014),
    flowerMaterial(colorAt(options.palette, 0), 0.84),
    flowerCount * 4
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.032, 8, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.9),
    flowerCount
  );
  let petalIndex = 0;
  for (let i = 0; i < flowerCount; i += 1) {
    const yNorm = 0.98 - (i / Math.max(1, flowerCount - 1)) * 1.38;
    const angle = i * 2.39996 + rng.range(-0.08, 0.08);
    const ring = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const normal = new THREE.Vector3(Math.cos(angle) * ring, yNorm, Math.sin(angle) * ring).normalize();
    const radius = rng.range(0.58, 0.65);
    const bloom = cloudCenter.clone().addScaledVector(normal, radius);
    const shortPedicel = bloom.clone().addScaledVector(normal, -0.1);
    group.add(cylinderBetween(shortPedicel, bloom, 0.0045, green));
    const scale = rng.range(0.9, 1.08);
    setInstance(centers, i, bloom, new THREE.Vector3(scale, scale, scale), colorAt(options.palette, i + 1), 0, normal);
    const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
    const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    for (let p = 0; p < 4; p += 1) {
      const pa = p / 4 * Math.PI * 2 + rng.range(-0.04, 0.04);
      const petalDirection = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(normal, 0.08)
        .normalize();
      setInstance(
        petals,
        petalIndex,
        bloom,
        new THREE.Vector3(scale, scale, 1),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.14)),
        0,
        petalDirection
      );
      petalIndex += 1;
    }
  }
  const supportHub = new THREE.Vector3(0, 0.05, 0);
  for (let i = 0; i < 9; i += 1) {
    const angle = i / 9 * Math.PI * 2;
    const inner = cloudCenter.clone().add(new THREE.Vector3(Math.cos(angle) * 0.28, -0.08 + (i % 3) * 0.13, Math.sin(angle) * 0.28));
    group.add(cylinderBetween(supportHub, inner, 0.007, green));
  }
  group.add(petals, centers);
  return group;
}

function createLegacyLaceFlower(options: BuildOptions) {
  const rng = createRng(`${options.seed}:lace-flower`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5e7d52');
  const hub = new THREE.Vector3(0, 0.22, 0);
  const stem = stemAlong([
    new THREE.Vector3(0, -1.16, 0),
    new THREE.Vector3(-0.035, -0.68, 0.018),
    new THREE.Vector3(0.025, -0.18, -0.015),
    hub
  ], 0.018, green, 16);
  group.add(stem.mesh);
  const umbelCount = 20;
  const floretsPerUmbel = 6;
  const floretCount = umbelCount * floretsPerUmbel;
  const petals = new THREE.InstancedMesh(
    petalGeometry(0.045, 0.018, 0.008, 0.002, 0.22, 0.002),
    flowerMaterial(colorAt(options.palette, 0), 0.88),
    floretCount * 5
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.014, 7, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.92),
    floretCount
  );
  let flowerIndex = 0;
  let petalIndex = 0;
  for (let i = 0; i < umbelCount; i += 1) {
    const angle = i * 2.39996;
    const radius = 0.18 + Math.sqrt((i + 0.5) / umbelCount) * 0.72;
    const miniHub = new THREE.Vector3(Math.cos(angle) * radius, 0.25 + (1 - radius / 0.9) * 0.12 + rng.range(-0.025, 0.025), Math.sin(angle) * radius);
    group.add(cylinderBetween(hub, miniHub, 0.0055, green));
    for (let f = 0; f < floretsPerUmbel; f += 1) {
      const fa = f / floretsPerUmbel * Math.PI * 2 + angle;
      const bloom = miniHub.clone().add(new THREE.Vector3(Math.cos(fa) * 0.052, rng.range(0.005, 0.028), Math.sin(fa) * 0.052));
      group.add(cylinderBetween(miniHub, bloom, 0.0028, green));
      setInstance(centers, flowerIndex, bloom, new THREE.Vector3(1, 1, 1), colorAt(options.palette, f + 1));
      for (let p = 0; p < 5; p += 1) {
        const pa = p / 5 * Math.PI * 2;
        setInstance(petals, petalIndex, bloom, new THREE.Vector3(1, 1, 1), colorAt(options.palette, p), pa - Math.PI / 2);
        petalIndex += 1;
      }
      flowerIndex += 1;
    }
  }
  group.add(petals, centers);
  return group;
}

function createLegacyBabysBreath(options: BuildOptions) {
  const rng = createRng(`${options.seed}:babys-breath`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#617e56');
  const main = stemAlong([
    new THREE.Vector3(0, -1.16, 0),
    new THREE.Vector3(0.02, -0.55, -0.015),
    new THREE.Vector3(-0.06, 0.08, 0.03),
    new THREE.Vector3(0.05, 0.72, -0.04)
  ], 0.016, green, 18);
  group.add(main.mesh);
  const branchCount = 12;
  const flowersPerBranch = 6;
  const total = branchCount * flowersPerBranch;
  const petals = new THREE.InstancedMesh(
    petalGeometry(0.065, 0.025, 0.01, 0.004, 0.16, 0.002),
    flowerMaterial(colorAt(options.palette, 0), 0.9),
    total * 5
  );
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 7, 5), flowerMaterial(colorAt(options.palette, 2), 0.94), total);
  let flowerIndex = 0;
  let petalIndex = 0;
  for (let b = 0; b < branchCount; b += 1) {
    const t = 0.34 + b / (branchCount - 1) * 0.6;
    const start = main.curve.getPoint(t);
    const angle = b * 2.39996 + rng.range(-0.2, 0.2);
    const reach = rng.range(0.28, 0.55) * (1 - b * 0.035);
    const tip = start.clone().add(new THREE.Vector3(Math.cos(angle) * reach, rng.range(0.12, 0.3), Math.sin(angle) * reach));
    const joint = start.clone().lerp(tip, 0.58).add(new THREE.Vector3(0, 0.055, 0));
    group.add(cylinderBetween(start, joint, 0.006, green), cylinderBetween(joint, tip, 0.004, green));
    for (let f = 0; f < flowersPerBranch; f += 1) {
      const ft = 0.45 + f / (flowersPerBranch - 1) * 0.55;
      const branchPoint = joint.clone().lerp(tip, ft);
      const fa = angle + (f % 2 ? 1 : -1) * rng.range(0.45, 0.95);
      const bloom = branchPoint.clone().add(new THREE.Vector3(Math.cos(fa) * 0.08, rng.range(0.025, 0.09), Math.sin(fa) * 0.08));
      group.add(cylinderBetween(branchPoint, bloom, 0.0028, green));
      setInstance(centers, flowerIndex, bloom, new THREE.Vector3(1, 1, 1), colorAt(options.palette, f + 1));
      for (let p = 0; p < 5; p += 1) {
        const pa = p / 5 * Math.PI * 2;
        setInstance(petals, petalIndex, bloom, new THREE.Vector3(1, 1, 1), colorAt(options.palette, p), pa - Math.PI / 2);
        petalIndex += 1;
      }
      flowerIndex += 1;
    }
  }
  group.add(petals, centers);
  return group;
}

function createRiceFlower(options: BuildOptions) {
  const rng = createRng(`${options.seed}:rice-flower`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#617e54');
  const mainTop = new THREE.Vector3(0, -0.08, 0);
  const main = stemAlong([
    new THREE.Vector3(0, -1.16, 0),
    new THREE.Vector3(-0.025, -0.72, 0.015),
    new THREE.Vector3(0.035, -0.32, -0.02),
    mainTop
  ], 0.02, green, 15);
  group.add(main.mesh);
  const clusterCount = 9;
  const budsPerCluster = 14;
  const total = clusterCount * budsPerCluster;
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.043, 9, 7),
    flowerMaterial(colorAt(options.palette, 0), 0.88),
    total
  );
  let budIndex = 0;
  for (let c = 0; c < clusterCount; c += 1) {
    const angle = c * 2.39996;
    const radius = c === 0 ? 0 : rng.range(0.18, 0.5);
    const tier = c % 3;
    const clusterHub = new THREE.Vector3(
      Math.cos(angle) * radius,
      0.24 + tier * 0.13 + rng.range(0.01, 0.08),
      Math.sin(angle) * radius
    );
    group.add(cylinderBetween(mainTop, clusterHub, 0.007, green));
    for (let b = 0; b < budsPerCluster; b += 1) {
      const ba = b * 2.39996;
      const br = Math.sqrt((b + 0.5) / budsPerCluster) * 0.125;
      const bloom = clusterHub.clone().add(new THREE.Vector3(Math.cos(ba) * br, rng.range(0.01, 0.085), Math.sin(ba) * br));
      group.add(cylinderBetween(clusterHub, bloom, 0.0026, green));
      const scale = rng.range(0.82, 1.12);
      setInstance(buds, budIndex, bloom, new THREE.Vector3(scale * 0.78, scale * 1.28, scale * 0.78), colorAt(options.palette, b + c), ba, bloom.clone().sub(clusterHub));
      budIndex += 1;
    }
  }
  group.add(buds);
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

const calibratedScopeNote = '程序化偏写实校准；用于物种识别与形态检查，不是植物学扫描模型。';

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
  { id: 'delphinium', cn: '飞燕草', en: 'Delphinium', scientificName: 'Delphinium elatum 园艺型', category: 'spike', description: '五枚花瓣状萼片围出不对称花面，上方萼片连续后伸成花距，内部保留较小真花瓣与深色中心。', calibration: '校准：萼片 / 真花瓣 / 花距分层；纤细总状花序含花蕾、半开与盛开。', scopeNote: calibratedScopeNote, palette: ['#6f95ed', '#9fb7ff', '#f4e7b9', '#55734e'], printStructure: '连续花轴、短花梗与花背花距相交，花距不再是悬浮尖片。' },
  { id: 'snapdragon', cn: '金鱼草', en: 'Snapdragon', scientificName: 'Antirrhinum majus', category: 'spike', description: '合生花冠筒连接两枚上唇与三枚下唇；下唇中部隆起并封住喉口，基部保留五裂花萼。', calibration: '校准：侧视可见花冠筒、上下两唇、隆起喉部与由大到小的开放梯度。', scopeNote: calibratedScopeNote, palette: ['#ff8877', '#ffb197', '#f7d07c', '#5b7d4e'], printStructure: '每朵由短花梗接入主轴，花萼、花冠筒和唇瓣连续相交。' },
  { id: 'hyacinth', cn: '风信子', en: 'Hyacinth', scientificName: 'Hyacinthus orientalis', category: 'spike', description: '短粗主轴上密生筒状钟形花；花被基部合生，顶部六裂并向外后反卷。', calibration: '校准：15–40 花的短密圆柱轮廓；短花梗、合生筒、六裂反卷与顶部花蕾。', scopeNote: calibratedScopeNote, palette: ['#9f86df', '#c2adef', '#f0d77b', '#55764e'], printStructure: '短花梗把每个合生花冠筒接回粗主轴，顶部花蕾保持连接。' },
  { id: 'foxtail-lily', frozen: true, cn: '狐尾百合', en: 'Foxtail Lily', scientificName: 'Eremurus × isabellinus 园艺型', category: 'spike', description: '挺拔圆柱状总状花序；下部六被片星形花盛开，六枚雄蕊与花药明显外伸，中部半开、顶部花蕾。', calibration: '冻结：已通过独立 LAB 复审；自下而上开放、花梗由下长上短，主轴只保留轻微自然偏摆。', scopeNote: calibratedScopeNote, palette: ['#f2a64a', '#f8c46d', '#ffe0a0', '#607d4e'], printStructure: '花梗、花被和外伸雄蕊均连接在近直立主轴上。' },
  { id: 'liatris', cn: '蛇鞭菊', en: 'Liatris', scientificName: 'Liatris spicata', category: 'spike', description: '无明显长花梗的头状花序紧贴主轴；每个花头由多枚细管状盘花和外伸花柱组成。', calibration: '校准：无普通五瓣花；顶部先开、下部留蕾，形成细长紧密的绒毛瓶刷轮廓。', scopeNote: calibratedScopeNote, palette: ['#a36bd1', '#c28ae2', '#e8b5f1', '#55734d'], printStructure: '管状小花、分叉花柱与苞片直接贴合连续主轴。' },
  { id: 'lace-flower', frozen: true, cn: '蕾丝花', en: 'Lace Flower', scientificName: 'Ammi majus', category: 'cluster', description: '共同茎顶节点发出 38 根细一级伞梗；每根末端形成含不等长二级短梗与极小五瓣花的小伞簇，叠成连续浅拱蕾丝花面。', calibration: '冻结：E 版已通过独立 LAB 复审；保留共同节点、38 个小伞簇、连续花面、11 条分裂状总苞片与 LOD 阅读顺序。', scopeNote: calibratedScopeNote, palette: ['#fffdf0', '#f5eed4', '#e6cf78', '#5e7d52'], printStructure: '所有微花经二级短梗、小伞簇和一级伞梗汇回共同茎顶节点；主茎、节点与总苞片连续连接。' },
  { id: 'hydrangea', frozen: true, cn: '绣球', en: 'Hydrangea', scientificName: 'Hydrangea macrophylla mophead 园艺型', category: 'cluster', description: '大量四萼片装饰花紧密重叠，形成半球至近球形 mophead 花球。', calibration: '冻结：完整恢复 commit 0b3655c 的花球分布、尺度与配色。', scopeNote: calibratedScopeNote, palette: ['#9dc9ef', '#bddcf6', '#e6d988', '#5d7f54'], printStructure: '短花梗藏在花球内部，由单根明确主茎承托整颗花球。' },
  { id: 'babys-breath', cn: '满天星', en: "Baby's Breath", scientificName: 'Gypsophila paniculata', category: 'cluster', description: '主轴发出不等距一级枝，继续分成二级枝与末端短花梗；五瓣小花和圆蕾集中在枝端。', calibration: '校准：不等长、不等角、不等花数的圆锥花序，远看形成空气花雾而非规则星点阵列。', scopeNote: calibratedScopeNote, palette: ['#fffdf4', '#f3eedf', '#e8d99c', '#617e56'], printStructure: '每朵花都通过末端花梗连接二级枝，再汇回主轴。' },
  { id: 'rice-flower', cn: '米花', en: 'Rice Flower', category: 'cluster', description: '米粒大小的椭圆花苞密集组成多个枝端伞房状小簇。', palette: ['#fff0dd', '#f2d8bd', '#dfbc83', '#617e54'], printStructure: '密集小花头由短梗汇入多个枝端簇，再连接单一主茎。' }
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
    case 'delphinium':
      return createCalibratedDelphinium(options);
    case 'snapdragon':
      return createCalibratedSnapdragon(options);
    case 'hyacinth':
      return createCalibratedHyacinth(options);
    case 'foxtail-lily':
      return createCalibratedFoxtailLily(options);
    case 'liatris':
      return createCalibratedLiatris(options);
    case 'lace-flower':
      return createCalibratedLaceFlower(options);
    case 'hydrangea':
      return createHydrangeaBaseline(options);
    case 'babys-breath':
      return createCalibratedBabysBreath(options);
    case 'rice-flower':
      return createRiceFlower(options);
  }
}
