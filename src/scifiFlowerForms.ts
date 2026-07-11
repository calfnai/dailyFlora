import * as THREE from 'three';
import { createOrbitalPulseFlower } from './floraPrimitives';
import { createRng } from './random';

export type SciFiFlowerId =
  | 'orbital-color-control'
  | 'mobius-bloom'
  | 'fractal-rift'
  | 'phase-fold'
  | 'singularity-bloom';

export type SciFiFlowerDefinition = {
  id: SciFiFlowerId;
  cn: string;
  en: string;
  kind: 'control' | 'morphology';
  hypothesis: string;
  structure: string;
};

export const sciFiFlowerDefinitions: SciFiFlowerDefinition[] = [
  {
    id: 'orbital-color-control',
    cn: '星环脉冲花',
    en: 'Orbital Pulse Flower',
    kind: 'control',
    hypothesis: '现实花朵骨架不变，只用非现实配色、发光和轨道装饰。',
    structure: '作为配色对照组保留，不再代表真正的科幻形态。'
  },
  {
    id: 'mobius-bloom',
    cn: '莫比乌斯翻面花',
    en: 'Möbius Inversion Bloom',
    kind: 'morphology',
    hypothesis: '花瓣不是一片片展开，而是三条只有一个表面的连续花瓣环。',
    structure: '莫比乌斯带内缘嵌入核心，旋转一周后花瓣正反面互换。'
  },
  {
    id: 'fractal-rift',
    cn: '递归裂枝花',
    en: 'Recursive Rift Flower',
    kind: 'morphology',
    hypothesis: '每片花瓣在生长途中连续分叉，形成没有现实花瓣边界的递归生命网络。',
    structure: '一级、二级枝瓣逐层实体连接，每个末端都有生长节点。'
  },
  {
    id: 'phase-fold',
    cn: '相位折叠花',
    en: 'Phase-Fold Flower',
    kind: 'morphology',
    hypothesis: '同一片花瓣同时穿过前后两个相位平面，形成交错翻转的连续折带。',
    structure: '七条扭转折带从核心连续长出，不依赖独立漂浮薄片。'
  },
  {
    id: 'singularity-bloom',
    cn: '奇点内向花',
    en: 'Singularity Inward Bloom',
    kind: 'morphology',
    hypothesis: '花瓣不是向外开放，而是被中心奇点吸引，围绕空洞向内卷曲。',
    structure: '根环、结状核心与内卷花瓣连续相交，中心暗核是实体而非透明洞。'
  }
];

const up = new THREE.Vector3(0, 1, 0);

function colorAt(palette: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(palette[index % palette.length] || fallback);
}

function surfaceMaterial(color: THREE.Color | string, emissive = 0, transparent = false) {
  const base = color instanceof THREE.Color ? color : new THREE.Color(color);
  return new THREE.MeshStandardMaterial({
    color: base,
    emissive: base,
    emissiveIntensity: emissive,
    roughness: emissive > 0 ? 0.3 : 0.72,
    metalness: emissive > 0 ? 0.16 : 0.02,
    transparent,
    opacity: transparent ? 0.78 : 1,
    side: THREE.DoubleSide,
    depthWrite: !transparent
  });
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: THREE.Color, emissive = 0) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.84, Math.max(0.001, direction.length()), 8),
    surfaceMaterial(color, emissive)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function addBiologicalBack(group: THREE.Group, palette: string[]) {
  const base = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), surfaceMaterial(colorAt(palette, 4)));
  base.position.z = -0.18;
  base.scale.set(1, 1, 0.62);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.12, 0.34, 12), surfaceMaterial(colorAt(palette, 4)));
  neck.rotation.x = Math.PI / 2;
  neck.position.z = -0.36;
  group.add(base, neck);
}

function mobiusGeometry(radius = 0.47, halfWidth = 0.2, segments = 96, strips = 8) {
  const positions: number[] = [];
  const point = (uIndex: number, vIndex: number) => {
    const u = uIndex / segments * Math.PI * 2;
    const v = (vIndex / strips * 2 - 1) * halfWidth;
    return new THREE.Vector3(
      (radius + v * Math.cos(u * 0.5)) * Math.cos(u),
      (radius + v * Math.cos(u * 0.5)) * Math.sin(u),
      v * Math.sin(u * 0.5)
    );
  };
  for (let u = 0; u < segments; u += 1) {
    for (let v = 0; v < strips; v += 1) {
      const a = point(u, v);
      const b = point(u + 1, v);
      const c = point(u, v + 1);
      const d = point(u + 1, v + 1);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      positions.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function foldedRibbonGeometry(length = 1.02, width = 0.18, phase = 0) {
  const positions: number[] = [];
  const rows = 28;
  const cols = 5;
  const point = (row: number, col: number) => {
    const t = row / rows;
    const across = col / cols * 2 - 1;
    const twist = t * Math.PI * 1.7 + phase;
    const radial = 0.12 + t * length;
    const fold = Math.sin(t * Math.PI * 3 + phase) * 0.13 * (0.2 + t);
    return new THREE.Vector3(
      across * width * Math.cos(twist),
      radial,
      across * width * Math.sin(twist) + fold
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

function makeCore(group: THREE.Group, palette: string[], radius = 0.27, z = 0.12) {
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), surfaceMaterial(colorAt(palette, 2), 0.7));
  core.position.z = z;
  group.add(core);
  return core;
}

function createMobiusBloom(palette: string[]) {
  const group = new THREE.Group();
  makeCore(group, palette, 0.3, 0.12);
  for (let i = 0; i < 3; i += 1) {
    const band = new THREE.Mesh(mobiusGeometry(0.44 + i * 0.035, 0.19 - i * 0.018), surfaceMaterial(colorAt(palette, i), 0.22, i === 1));
    band.position.z = 0.14;
    band.rotation.x = i * 0.72 - 0.42;
    band.rotation.y = i * 0.56;
    group.add(band);
  }
  addBiologicalBack(group, palette);
  return group;
}

function createFractalRift(palette: string[], seed: string) {
  const rng = createRng(`${seed}:fractal-rift`);
  const group = new THREE.Group();
  makeCore(group, palette, 0.24, 0.1);
  for (let root = 0; root < 5; root += 1) {
    const angle = root / 5 * Math.PI * 2;
    const start = new THREE.Vector3(Math.cos(angle) * 0.16, Math.sin(angle) * 0.16, 0.08);
    const trunk = new THREE.Vector3(Math.cos(angle) * 0.5, Math.sin(angle) * 0.5, rng.range(-0.08, 0.16));
    group.add(cylinderBetween(start, trunk, 0.055, colorAt(palette, root), 0.18));
    for (const fork of [-1, 1]) {
      const branchAngle = angle + fork * 0.31;
      const branch = new THREE.Vector3(Math.cos(branchAngle) * 0.78, Math.sin(branchAngle) * 0.78, trunk.z + fork * 0.08);
      group.add(cylinderBetween(trunk, branch, 0.036, colorAt(palette, root + 1), 0.3));
      for (const leafFork of [-1, 1]) {
        const tipAngle = branchAngle + leafFork * 0.18;
        const tip = new THREE.Vector3(Math.cos(tipAngle) * 1.02, Math.sin(tipAngle) * 1.02, branch.z + leafFork * 0.055);
        group.add(cylinderBetween(branch, tip, 0.021, colorAt(palette, root + 2), 0.42));
        const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), surfaceMaterial(colorAt(palette, root + 3), 0.66));
        node.position.copy(tip);
        node.rotation.z = tipAngle;
        group.add(node);
      }
    }
  }
  addBiologicalBack(group, palette);
  return group;
}

function createPhaseFold(palette: string[]) {
  const group = new THREE.Group();
  makeCore(group, palette, 0.25, 0.1);
  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2;
    const ribbon = new THREE.Mesh(foldedRibbonGeometry(0.9, 0.15, i * 0.62), surfaceMaterial(colorAt(palette, i), 0.28, i % 3 === 0));
    ribbon.rotation.z = angle - Math.PI / 2;
    ribbon.position.set(Math.cos(angle) * 0.06, Math.sin(angle) * 0.06, i % 2 === 0 ? 0.04 : 0.14);
    group.add(ribbon);
  }
  const phaseRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 8, 40), surfaceMaterial(colorAt(palette, 3), 0.54));
  phaseRing.position.z = 0.18;
  group.add(phaseRing);
  addBiologicalBack(group, palette);
  return group;
}

function createSingularityBloom(palette: string[]) {
  const group = new THREE.Group();
  const rootRing = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 10, 48), surfaceMaterial(colorAt(palette, 1), 0.36));
  rootRing.position.z = 0.08;
  group.add(rootRing);
  const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.22, 0.055, 96, 10, 2, 3), surfaceMaterial(colorAt(palette, 2), 0.7));
  knot.position.z = 0.14;
  group.add(knot);
  const darkCore = new THREE.Mesh(new THREE.SphereGeometry(0.13, 20, 14), new THREE.MeshStandardMaterial({color:'#060913',roughness:0.18,metalness:0.35}));
  darkCore.position.z = 0.26;
  group.add(darkCore);
  for (let i = 0; i < 8; i += 1) {
    const angle = i / 8 * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(angle) * 0.25, Math.sin(angle) * 0.25, 0.08),
      new THREE.Vector3(Math.cos(angle + 0.2) * 0.72, Math.sin(angle + 0.2) * 0.72, 0.18),
      new THREE.Vector3(Math.cos(angle + 0.72) * 0.56, Math.sin(angle + 0.72) * 0.56, 0.36),
      new THREE.Vector3(Math.cos(angle + 1.1) * 0.2, Math.sin(angle + 1.1) * 0.2, 0.42)
    ]);
    const petal = new THREE.Mesh(new THREE.TubeGeometry(curve, 32, 0.055, 7, false), surfaceMaterial(colorAt(palette, i), 0.26));
    group.add(petal);
  }
  addBiologicalBack(group, palette);
  return group;
}

export function createSciFiFlower(definition: SciFiFlowerDefinition, palette: string[], seed: string) {
  if (definition.id === 'orbital-color-control') {
    return createOrbitalPulseFlower({
      seed,
      position: new THREE.Vector3(),
      scale: 1,
      colorPalette: palette,
      openness: 0.9,
      density: 1,
      curvature: 0.7,
      role: 'hero'
    });
  }
  if (definition.id === 'mobius-bloom') return createMobiusBloom(palette);
  if (definition.id === 'fractal-rift') return createFractalRift(palette, seed);
  if (definition.id === 'phase-fold') return createPhaseFold(palette);
  return createSingularityBloom(palette);
}
