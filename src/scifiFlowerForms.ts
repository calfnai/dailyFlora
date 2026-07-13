import * as THREE from 'three';
import { createOrbitalPulseFlower } from './floraPrimitives';
import { createRng } from './random';

export type SciFiFlowerId =
  | 'orbital-color-control'
  | 'signal-antenna'
  | 'helix-beacon'
  | 'prism-lattice'
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
    id: 'signal-antenna',
    cn: '星栅天线花',
    en: 'Signal Antenna Bloom',
    kind: 'morphology',
    hypothesis: '花瓣被替换成从生物核心连续长出的弧形信号臂，枝端以能量节点和轨道环收束。',
    structure: '六条实体弧形信号臂连接花心、节点与外环，不使用漂浮薄片。'
  },
  {
    id: 'helix-beacon',
    cn: '双螺旋信标花',
    en: 'Double-Helix Beacon Bloom',
    kind: 'morphology',
    hypothesis: '花瓣沿双螺旋生长轨迹向外展开，像有机体发出的导航信标。',
    structure: '成对螺旋管从花心连续生长，末端由发光节点和实体花托闭合。'
  },
  {
    id: 'prism-lattice',
    cn: '晶格棱镜花',
    en: 'Prism Lattice Bloom',
    kind: 'morphology',
    hypothesis: '花瓣形成放射状晶格与棱镜舱体，呈现现实花朵没有的机械生长秩序。',
    structure: '八枚实体棱镜瓣通过辐条和内外晶格环连接核心，不依赖换色制造科幻感。'
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
    roughness: emissive > 0 ? 0.24 : 0.46,
    metalness: emissive > 0 ? 0.44 : 0.28,
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

function createSignalAntenna(palette: string[]) {
  const group = new THREE.Group();
  makeCore(group, palette, 0.25, 0.12);
  const armCount = 6;
  for (let i = 0; i < armCount; i += 1) {
    const angle = i / armCount * Math.PI * 2;
    const radial = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const tangent = new THREE.Vector3(-Math.sin(angle), Math.cos(angle), 0);
    const start = radial.clone().multiplyScalar(0.16).setZ(0.08);
    const mid = radial.clone().multiplyScalar(0.48).add(tangent.clone().multiplyScalar(i % 2 ? -0.13 : 0.13)).setZ(0.22);
    const end = radial.clone().multiplyScalar(0.82).add(tangent.clone().multiplyScalar(i % 2 ? -0.08 : 0.08)).setZ(0.08);
    const curve = new THREE.CatmullRomCurve3([start, mid, end]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.048, 7, false), surfaceMaterial(colorAt(palette, i), 0.34)));

    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), surfaceMaterial(colorAt(palette, i + 2), 0.7));
    node.position.copy(end);
    node.rotation.set(angle * 0.4, angle, angle + Math.PI / 4);
    group.add(node);

    const receiver = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 7, 28), surfaceMaterial(colorAt(palette, i + 1), 0.5));
    receiver.position.copy(end);
    receiver.rotation.set(Math.PI / 2, angle, 0);
    group.add(receiver);
  }
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.038, 8, 42), surfaceMaterial(colorAt(palette, 3), 0.46));
  innerRing.position.z = 0.1;
  group.add(innerRing);
  addBiologicalBack(group, palette);
  return group;
}

function createHelixBeacon(palette: string[]) {
  const group = new THREE.Group();
  makeCore(group, palette, 0.23, 0.13);
  const pairCount = 5;
  for (let pair = 0; pair < pairCount; pair += 1) {
    const baseAngle = pair / pairCount * Math.PI * 2;
    for (const phase of [0, Math.PI]) {
      const points: THREE.Vector3[] = [];
      for (let step = 0; step <= 24; step += 1) {
        const t = step / 24;
        const travel = 0.16 + t * 0.78;
        const twist = baseAngle + phase + t * Math.PI * 2.2;
        const side = Math.sin(t * Math.PI * 2.2 + phase) * 0.085 * (0.4 + t);
        points.push(new THREE.Vector3(
          Math.cos(baseAngle) * travel - Math.sin(baseAngle) * side,
          Math.sin(baseAngle) * travel + Math.cos(baseAngle) * side,
          0.08 + Math.cos(twist) * 0.12
        ));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 0.036, 7, false), surfaceMaterial(colorAt(palette, pair + (phase ? 1 : 0)), 0.42)));
    }
    const tip = new THREE.Vector3(Math.cos(baseAngle) * 0.96, Math.sin(baseAngle) * 0.96, 0.08);
    const beacon = new THREE.Mesh(new THREE.IcosahedronGeometry(0.1, 1), surfaceMaterial(colorAt(palette, pair + 2), 0.82));
    beacon.position.copy(tip);
    group.add(beacon);
  }
  const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.032, 8, 40), surfaceMaterial(colorAt(palette, 3), 0.58));
  beaconRing.position.z = 0.16;
  group.add(beaconRing);
  addBiologicalBack(group, palette);
  return group;
}

function createPrismLattice(palette: string[]) {
  const group = new THREE.Group();
  makeCore(group, palette, 0.28, 0.16);
  const petalCount = 8;
  for (let i = 0; i < petalCount; i += 1) {
    const angle = i / petalCount * Math.PI * 2;
    const direction = new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
    const joint = direction.clone().multiplyScalar(0.24).setZ(0.1);
    const center = direction.clone().multiplyScalar(0.62).setZ(i % 2 ? 0.04 : 0.18);
    group.add(cylinderBetween(joint, center, 0.04, colorAt(palette, i), 0.3));

    const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.3, 0), surfaceMaterial(colorAt(palette, i + 1), 0.32));
    prism.position.copy(center);
    prism.scale.set(1.5, 0.62, 0.42);
    prism.rotation.z = angle;
    prism.rotation.y = i % 2 ? 0.28 : -0.22;
    group.add(prism);

    const outerNode = new THREE.Mesh(new THREE.TetrahedronGeometry(0.11, 0), surfaceMaterial(colorAt(palette, i + 3), 0.72));
    outerNode.position.copy(direction.multiplyScalar(0.94)).setZ(0.1);
    outerNode.rotation.set(angle, angle * 0.5, angle);
    group.add(outerNode);
  }
  const latticeRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.026, 7, 48), surfaceMaterial(colorAt(palette, 3), 0.52));
  latticeRing.position.z = 0.1;
  group.add(latticeRing);
  addBiologicalBack(group, palette);
  return group;
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
  if (definition.id === 'signal-antenna') return createSignalAntenna(palette);
  if (definition.id === 'helix-beacon') return createHelixBeacon(palette);
  if (definition.id === 'prism-lattice') return createPrismLattice(palette);
  if (definition.id === 'mobius-bloom') return createMobiusBloom(palette);
  if (definition.id === 'fractal-rift') return createFractalRift(palette, seed);
  if (definition.id === 'phase-fold') return createPhaseFold(palette);
  return createSingularityBloom(palette);
}
