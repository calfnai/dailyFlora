import * as THREE from 'three';
import { floraPrimitiveFactories, type FloraPrimitiveName } from './floraPrimitives';
import { createRng } from './random';
import { createSciFiFlower, sciFiFlowerDefinitions, type SciFiFlowerDefinition, type SciFiFlowerId } from './scifiFlowerForms';

export type SciFiBouquetDefinition = {
  id: string;
  cn: string;
  en: string;
  brief: string;
  focus: SciFiFlowerId[];
  support: FloraPrimitiveName[];
  mood: string;
  density: number;
  height: number;
  spread: number;
};

export const sciFiPalettePresets: Record<string, string[]> = {
  '晨雾异种': ['#e8fff5', '#9ad8ff', '#ff9fb8', '#d9ff9a', '#526b63'],
  '黑金信号': ['#050504', '#17130c', '#d7b95f', '#7a6634', '#0d1311'],
  '量子珊瑚': ['#ff746c', '#ffb36b', '#e76bff', '#fff0c2', '#4e6574'],
  '星云花火': ['#62f6ff', '#ff5fc8', '#f6ff6d', '#8d74ff', '#2ad49e'],
  '深空冷光': ['#65f4ff', '#8174ff', '#ff5ed2', '#dcff6b', '#365b58'],
  '酸性温室': ['#c6ff37', '#29e69b', '#ff7b38', '#fff06a', '#315a3d']
};

export const sciFiPaletteOrder = Object.keys(sciFiPalettePresets);

export const sciFiBouquetDefinitions: SciFiBouquetDefinition[] = [
  { id: 'orbital-collar', cn: '星云领口花束', en: 'Nebula Orbital Collar', brief: '星环与晶格棱镜共同形成主体，写实小花只留作边缘支撑，轮廓从结构上就有科幻感。', focus: ['orbital-color-control', 'prism-lattice'], support: ['AirFiller', 'FruitPodCluster'], mood: 'orbital prism collar', density: 0.9, height: 1.0, spread: 1.22 },
  { id: 'signal-meadow', cn: '信号草甸花束', en: 'Signal Meadow Bouquet', brief: '星栅天线与双螺旋信标密集穿插，少量果点和空气簇只负责维持花束呼吸感。', focus: ['signal-antenna', 'helix-beacon', 'orbital-color-control'], support: ['UmbelMiniCluster', 'BerryCluster'], mood: 'antenna beacon meadow', density: 0.92, height: 0.98, spread: 1.3 },
  { id: 'halo-branch', cn: '光轨枝形花束', en: 'Halo Branch Bouquet', brief: '高低错落的螺旋信标和星环主花拉开枝形，科幻实体花与开放光轨共同定义外轮廓。', focus: ['helix-beacon', 'orbital-color-control', 'signal-antenna'], support: ['FoliageGrassBranch', 'AirFiller'], mood: 'helix halo branches', density: 0.76, height: 1.28, spread: 1.28 },
  { id: 'orbital-fan', cn: '晶格风扇花束', en: 'Prism Signal Fan Bouquet', brief: '晶格棱镜和星栅天线组成扇形主体，不再依靠旧风车花与郁金香换成霓虹色。', focus: ['prism-lattice', 'signal-antenna'], support: ['StarPinwheelFlower', 'FoliageGrassBranch'], mood: 'radiant prism fan', density: 0.88, height: 1.0, spread: 1.36 },
  { id: 'dark-core-cloud', cn: '暗核晶云花束', en: 'Dark-Core Prism Cloud', brief: '棱镜、天线和星环围合暗核云团，少量空气簇仅填补层次，不再用旧绣球撑满主体。', focus: ['prism-lattice', 'signal-antenna', 'orbital-color-control'], support: ['AirFiller', 'FruitPodCluster'], mood: 'dark-core signal cloud', density: 0.96, height: 0.98, spread: 1.08 },
  { id: 'comet-signal', cn: '螺旋彗尾花束', en: 'Helix Comet Bouquet', brief: '双螺旋信标沿非对称彗尾外放，星栅天线形成连续信号带，写实枝线退到辅助位置。', focus: ['helix-beacon', 'signal-antenna'], support: ['FoliageGrassBranch', 'HangingBellFruit'], mood: 'helix comet tail', density: 0.82, height: 1.18, spread: 1.44 },
  { id: 'orbital-orchid', cn: '棱镜异种花束', en: 'Prism Alien Bouquet', brief: '晶格棱镜、星环和螺旋信标形成异种花感，只用少量兰形轮廓提示生物性。', focus: ['prism-lattice', 'orbital-color-control', 'helix-beacon'], support: ['OrchidButterflyFlower', 'AirFiller'], mood: 'prismatic alien floral', density: 0.86, height: 1.08, spread: 1.16 },
  { id: 'approved-handful', cn: '深空信标手捧花', en: 'Deep-Space Beacon Handful', brief: '四种科幻主体混合成完整手捧花，写实支撑压到少数，直接检验结构科幻是否成立。', focus: ['signal-antenna', 'helix-beacon', 'prism-lattice', 'orbital-color-control'], support: ['AirFiller', 'BerryCluster', 'FoliageGrassBranch'], mood: 'structural sci-fi mix', density: 1.0, height: 1.02, spread: 1.22 }
];

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
export const sciFiFlowerById = Object.fromEntries(sciFiFlowerDefinitions.map((definition) => [definition.id, definition])) as Record<SciFiFlowerId, SciFiFlowerDefinition>;

function colorAt(palette: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(palette[index % palette.length] || fallback);
}

function material(color: THREE.Color | string, emissive = 0, opacity = 1) {
  const base = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: base,
    emissive: base,
    emissiveIntensity: emissive,
    roughness: emissive > 0 ? 0.32 : 0.78,
    metalness: emissive > 0 ? 0.16 : 0.02,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 0.72
  });
}

function steelMaterial(color: THREE.Color | string, emissive = 0.08, opacity = 1) {
  const base = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: base,
    emissive: base,
    emissiveIntensity: emissive,
    roughness: 0.24,
    metalness: 0.72,
    transparent: opacity < 1,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: opacity >= 0.72
  });
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: THREE.Color | string, emissive = 0) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.82, Math.max(0.001, direction.length()), 7), material(color, emissive));
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function steelRodBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: THREE.Color | string, emissive = 0.1) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.92, Math.max(0.001, direction.length()), 8),
    steelMaterial(color, emissive)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function varyPalette(base: string[], rng: ReturnType<typeof createRng>) {
  return base.map((hex, index) => {
    const color = new THREE.Color(hex);
    if (index < 4) color.offsetHSL(rng.range(-0.035, 0.035), rng.range(-0.05, 0.08), rng.range(-0.04, 0.08));
    return `#${color.getHexString()}`;
  });
}

function silhouette(definition: SciFiBouquetDefinition) {
  if (definition.id === 'halo-branch') return { low: 0.48, high: 1.2, lift: 0.18, side: 0, fan: 0, tail: 0, cloud: 0.1 };
  if (definition.id === 'orbital-fan') return { low: 0.34, high: 1.04, lift: 0.08, side: 0, fan: 0.62, tail: 0, cloud: 0 };
  if (definition.id === 'comet-signal') return { low: 0.42, high: 1.24, lift: 0.1, side: -0.48, fan: 0, tail: 0.72, cloud: 0 };
  if (definition.id === 'dark-core-cloud') return { low: 0.18, high: 0.9, lift: -0.02, side: 0, fan: 0, tail: 0, cloud: 0.35 };
  if (definition.id === 'signal-meadow') return { low: 0.38, high: 1.16, lift: 0.03, side: 0, fan: 0.16, tail: 0, cloud: 0.05 };
  if (definition.id === 'orbital-orchid') return { low: 0.34, high: 1.08, lift: 0.14, side: 0.1, fan: 0.08, tail: 0, cloud: 0 };
  if (definition.id === 'approved-handful') return { low: 0.26, high: 1.04, lift: 0, side: 0, fan: 0.2, tail: 0, cloud: 0.18 };
  return { low: 0.28, high: 1.06, lift: 0.08, side: 0, fan: 0.12, tail: 0, cloud: 0 };
}

function bouquetPoint(definition: SciFiBouquetDefinition, rng: ReturnType<typeof createRng>, index: number, count: number) {
  const profile = silhouette(definition);
  const angleBase = index / count * Math.PI * 2;
  const fanOffset = Math.sin(index / Math.max(1, count - 1) * Math.PI - Math.PI / 2) * profile.fan;
  const angle = angleBase + fanOffset + rng.range(-0.28, 0.28);
  const outer = index % 4 === 0 ? profile.high + rng.range(0.02, 0.22) : rng.range(profile.low, profile.high);
  const ring = Math.min(1.42, Math.max(0.12, outer));
  const x = Math.cos(angle) * ring * definition.spread * 0.86 + profile.side * Math.max(0, ring - 0.36);
  const z = Math.sin(angle) * ring * (0.42 + definition.spread * 0.22);
  const dome = Math.max(0, 1 - Math.abs(ring - profile.cloud) * 0.54);
  const tailLift = definition.id === 'comet-signal' && x < 0 ? Math.abs(x) * profile.tail : 0;
  const y = rng.range(-0.06, 0.72) + dome * 0.86 * definition.height + profile.lift + tailLift + ring * 0.1;
  return new THREE.Vector3(x, y, z);
}

function orientFlower(group: THREE.Group, point: THREE.Vector3, rng: ReturnType<typeof createRng>) {
  const outward = new THREE.Vector3(point.x * 0.36, point.y * 0.52 + 0.62, point.z + 1.2).normalize();
  group.quaternion.setFromUnitVectors(forward, outward.lengthSq() ? outward : forward);
  group.rotateZ(rng.range(0, Math.PI * 2));
  group.rotateX(rng.range(-0.1, 0.18));
}

function addSupportFlower(group: THREE.Group, definition: SciFiBouquetDefinition, primitive: FloraPrimitiveName, point: THREE.Vector3, seed: string, scale: number, rng: ReturnType<typeof createRng>, palette: string[]) {
  const factory = floraPrimitiveFactories[primitive];
  const supportPalette = [palette[rng.range(0, 4) | 0], palette[(rng.range(1, 5) | 0) % palette.length], palette[3], palette[4]];
  const support = factory({
    seed,
    position: point,
    scale,
    colorPalette: supportPalette,
    openness: rng.range(0.66, 0.92),
    density: rng.range(0.82, 1.08),
    curvature: primitive === 'FoliageGrassBranch' || primitive === 'SpikeFlower' ? 0.86 : 0.45,
    role: primitive === 'FoliageGrassBranch' || primitive === 'SpikeFlower' ? 'line' : 'filler'
  });
  if (primitive === 'SpikeFlower' || primitive === 'FoliageGrassBranch') {
    const target = point.clone().sub(new THREE.Vector3(0, -1.05, 0)).normalize();
    support.quaternion.setFromUnitVectors(up, target);
    support.rotateY(rng.range(-0.4, 0.4));
  } else {
    orientFlower(support, point, rng);
  }
  group.add(support);
  if (primitive === 'SpikeFlower') group.add(cylinderBetween(new THREE.Vector3(0, -1.05, 0), point.clone().setY(point.y - 0.35), 0.01, palette[4]));
  if (definition.id === 'comet-signal') support.position.x -= rng.range(0.08, 0.24);
}

function addSignalTrails(group: THREE.Group, definition: SciFiBouquetDefinition, rng: ReturnType<typeof createRng>, palette: string[]) {
  const trailCount = definition.id === 'halo-branch' || definition.id === 'comet-signal' ? 11 : 8;
  for (let i = 0; i < trailCount; i += 1) {
    const angle = i / trailCount * Math.PI * 2 + rng.range(-0.22, 0.22);
    const radius = rng.range(0.5, 1.26) * definition.spread;
    const lean = definition.id === 'comet-signal' && i > trailCount * 0.45 ? -rng.range(0.45, 1.05) : 0;
    const start = new THREE.Vector3(0, -0.98, 0);
    const mid = new THREE.Vector3(Math.cos(angle) * radius * 0.42 + lean * 0.45, rng.range(0.22, 1.0) * definition.height, Math.sin(angle) * radius * 0.26);
    const end = new THREE.Vector3(Math.cos(angle + rng.range(-0.14, 0.14)) * radius + lean, rng.range(0.9, 1.72) * definition.height, Math.sin(angle) * radius * 0.52);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    const color = colorAt(palette, i).lerp(colorAt(palette, 2), rng.range(0.18, 0.58));
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 30, rng.range(0.007, 0.014), 6, false), steelMaterial(color, 0.34, 0.76)));
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(rng.range(0.032, 0.058), 0), material(color, 0.72, 0.92));
    node.position.copy(end);
    node.rotation.set(rng.range(0, Math.PI), rng.range(0, Math.PI), rng.range(0, Math.PI));
    group.add(node);
  }
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.024, 8, 42), steelMaterial(colorAt(palette, 3), 0.28, 0.92));
  tie.position.y = -0.98;
  tie.rotation.x = Math.PI / 2;
  group.add(tie);
}

function addRebarGrowth(group: THREE.Group, definition: SciFiBouquetDefinition, points: THREE.Vector3[], rng: ReturnType<typeof createRng>, palette: string[]) {
  const tie = new THREE.Vector3(0, -1.08, 0);
  const steel = colorAt(palette, 1).lerp(new THREE.Color('#030302'), 0.72);
  const accent = colorAt(palette, 2);
  const spineTop = new THREE.Vector3(definition.id === 'comet-signal' ? -0.18 : 0.02, 1.28 * definition.height, 0.02);
  group.add(steelRodBetween(tie, spineTop, 0.032, steel, 0.12));
  for (let i = 0; i < 5; i += 1) {
    const angle = i / 5 * Math.PI * 2 + rng.range(-0.12, 0.12);
    const low = new THREE.Vector3(Math.cos(angle) * 0.08, -0.95 + i * 0.06, Math.sin(angle) * 0.04);
    const high = new THREE.Vector3(Math.cos(angle) * 0.24, 1.02 + rng.range(-0.04, 0.16), Math.sin(angle) * 0.14);
    group.add(steelRodBetween(low, high, 0.016, steel, 0.08));
  }

  const ranked = [...points].sort((a, b) => b.y - a.y);
  ranked.slice(0, Math.min(14, ranked.length)).forEach((point, index) => {
    const base = new THREE.Vector3(point.x * 0.18, -0.92 + (index % 3) * 0.08, point.z * 0.14);
    const joint = point.clone().lerp(spineTop, 0.16);
    group.add(steelRodBetween(base, joint, rng.range(0.012, 0.02), index % 3 === 0 ? accent : steel, index % 3 === 0 ? 0.22 : 0.1));
    if (index % 2 === 0) {
      const collar = new THREE.Mesh(new THREE.TorusGeometry(rng.range(0.07, 0.12), 0.008, 6, 22), steelMaterial(colorAt(palette, index + 3), 0.2, 0.88));
      collar.position.copy(joint);
      collar.rotation.set(rng.range(0.4, 1.2), rng.range(0, Math.PI), rng.range(0, Math.PI));
      group.add(collar);
    }
  });

  for (let i = 0; i < ranked.length - 3; i += 3) {
    const a = ranked[i];
    const b = ranked[i + 2];
    if (!a || !b) continue;
    group.add(steelRodBetween(a.clone().lerp(spineTop, 0.28), b.clone().lerp(spineTop, 0.2), 0.007, colorAt(palette, i + 1), 0.16));
  }
}

function addParticles(group: THREE.Group, definition: SciFiBouquetDefinition, rng: ReturnType<typeof createRng>, palette: string[]) {
  const positions: number[] = [];
  const colors: number[] = [];
  const count = Math.floor(90 * definition.density);
  for (let i = 0; i < count; i += 1) {
    const point = bouquetPoint(definition, rng, i, count);
    point.multiplyScalar(rng.range(0.9, 1.36));
    point.y += rng.range(-0.02, 0.36);
    positions.push(point.x, point.y, point.z);
    const color = colorAt(palette, rng.range(0, 4) | 0).lerp(colorAt(palette, 2), rng.range(0.12, 0.55));
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending, depthWrite: false })));
}

export function createSciFiBouquet(definition: SciFiBouquetDefinition, palette: string[], variant = 'default') {
  const rng = createRng(`scifi-bouquet:${definition.id}:${variant}:${palette.join('-')}`);
  const group = new THREE.Group();
  const flowerCount = Math.floor(15 + definition.density * 5);
  const tie = new THREE.Vector3(0, -1.05, 0);
  const flowerPoints: THREE.Vector3[] = [];

  for (let i = 0; i < flowerCount; i += 1) {
    const flowerId = definition.focus[i % definition.focus.length];
    const point = bouquetPoint(definition, rng, i, flowerCount);
    flowerPoints.push(point.clone());
    const stemEnd = point.clone().lerp(tie, 0.14);
    group.add(steelRodBetween(tie, stemEnd, rng.range(0.012, 0.022), colorAt(palette, 4).lerp(new THREE.Color('#070907'), 0.5), 0.1));
    const flower = createSciFiFlower(sciFiFlowerById[flowerId], varyPalette(palette, rng), `${definition.id}:${variant}:${flowerId}:${i}`);
    const baseScale = flowerId === 'orbital-color-control' ? 0.2 : flowerId === 'helix-beacon' ? 0.2 : flowerId === 'signal-antenna' ? 0.21 : 0.2;
    flower.position.copy(point);
    flower.scale.setScalar(baseScale * rng.range(0.84, 1.2));
    orientFlower(flower, point, rng);
    group.add(flower);
  }

  addRebarGrowth(group, definition, flowerPoints, rng, palette);

  const supportCount = Math.floor(4 + definition.density * 3);
  for (let i = 0; i < supportCount; i += 1) {
    const primitive = definition.support[i % definition.support.length];
    const point = bouquetPoint(definition, rng, i + flowerCount, supportCount + flowerCount);
    point.multiplyScalar(rng.range(0.72, 0.98));
    point.y -= rng.range(0.16, 0.36);
    addSupportFlower(group, definition, primitive, point, `${definition.id}:${variant}:support:${primitive}:${i}`, rng.range(0.11, 0.2), rng, palette);
  }

  addParticles(group, definition, rng, palette);
  addSignalTrails(group, definition, rng, palette);
  group.rotation.x = -0.08;
  group.scale.setScalar(1.02);
  return group;
}

export function disposeSciFiBouquet(model: THREE.Group) {
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh) && !(child instanceof THREE.InstancedMesh) && !(child instanceof THREE.Points) && !(child instanceof THREE.Line)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((item) => item.dispose());
  });
}

export function countSciFiBouquetGeometry(model: THREE.Group) {
  let draws = 0;
  let triangles = 0;
  model.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.InstancedMesh) {
      draws += 1;
      const faces = child.geometry.index ? child.geometry.index.count / 3 : child.geometry.getAttribute('position').count / 3;
      triangles += Math.floor(faces * (child instanceof THREE.InstancedMesh ? child.count : 1));
    }
  });
  return { draws, triangles };
}
