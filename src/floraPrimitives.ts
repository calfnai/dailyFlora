import * as THREE from 'three';
import { createRng } from './random';

export type FloraPrimitiveRole = 'hero' | 'secondary' | 'line' | 'cluster' | 'fruit' | 'filler';

export interface FloraPrimitiveOptions {
  seed: string;
  position: THREE.Vector3;
  scale: number;
  colorPalette: string[];
  openness: number;
  density: number;
  curvature: number;
  role: FloraPrimitiveRole;
}

const tempObject = new THREE.Object3D();
const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);

function colorAt(palette: string[], index: number) {
  return new THREE.Color(palette[index % palette.length] ?? '#ffffff');
}

function material(color: string | THREE.Color, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    side: THREE.DoubleSide
  });
}

function pointMaterial(size: number, opacity = 0.78) {
  return new THREE.PointsMaterial({
    size,
    transparent: true,
    opacity,
    vertexColors: true,
    depthWrite: false,
    sizeAttenuation: true
  });
}

function petalGeometry(length = 1, width = 0.32, lift = 0.12) {
  const positions: number[] = [];
  const segments = 5;
  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const w0 = Math.sin(t0 * Math.PI) * width;
    const w1 = Math.sin(t1 * Math.PI) * width;
    const z0 = Math.sin(t0 * Math.PI) * lift;
    const z1 = Math.sin(t1 * Math.PI) * lift;
    positions.push(
      -w0, t0 * length, z0,
      w0, t0 * length, z0,
      -w1, t1 * length, z1,
      w0, t0 * length, z0,
      w1, t1 * length, z1,
      -w1, t1 * length, z1
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function taperedPetalGeometry(length = 1, width = 0.24, lift = 0.16, droop = 0) {
  const positions: number[] = [];
  const segments = 6;
  for (let i = 0; i < segments; i += 1) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const w0 = Math.sin(t0 * Math.PI) * width * (1 - t0 * 0.18);
    const w1 = Math.sin(t1 * Math.PI) * width * (1 - t1 * 0.18);
    const z0 = Math.sin(t0 * Math.PI) * lift - t0 * t0 * droop;
    const z1 = Math.sin(t1 * Math.PI) * lift - t1 * t1 * droop;
    positions.push(
      -w0, t0 * length, z0,
      w0, t0 * length, z0,
      -w1, t1 * length, z1,
      w0, t0 * length, z0,
      w1, t1 * length, z1,
      -w1, t1 * length, z1
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function applyRoot(group: THREE.Group, options: FloraPrimitiveOptions) {
  group.position.copy(options.position);
  group.scale.setScalar(options.scale);
  return group;
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

function makeStemCurve(height: number, curvature: number, lean = 0) {
  return new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -height * 0.5, 0),
    new THREE.Vector3(curvature * 0.16 + lean, -height * 0.12, curvature * 0.08),
    new THREE.Vector3(-curvature * 0.12 + lean * 0.5, height * 0.18, -curvature * 0.06),
    new THREE.Vector3(curvature * 0.1, height * 0.5, 0)
  ]);
}

export function createDiskFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:disk`);
  const group = new THREE.Group();
  const petalCount = Math.max(16, Math.round(22 * options.density));
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.82, 0.105, 0.09 + options.openness * 0.04, 0.12),
    material(colorAt(options.colorPalette, 0)),
    petalCount
  );
  const edgeCount = petalCount * 3;
  const edgePositions: number[] = [];
  const edgeColors: number[] = [];
  const petalColor = colorAt(options.colorPalette, 0);

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2 + rng.range(-0.065, 0.065);
    const length = rng.range(0.82, 1.26);
    const width = rng.range(0.72, 1.14);
    const root = new THREE.Vector3(Math.cos(angle) * 0.22, Math.sin(angle) * 0.22, rng.range(-0.015, 0.025));
    setInstance(
      petals,
      i,
      root,
      new THREE.Vector3(width, length, 1),
      petalColor.clone().lerp(colorAt(options.colorPalette, 1), rng.range(0, 0.18)),
      angle - Math.PI / 2
    );
    for (let j = 0; j < 3; j += 1) {
      const r = 0.84 * length + rng.range(-0.03, 0.04);
      const p = new THREE.Vector3(Math.cos(angle + rng.range(-0.035, 0.035)) * r, Math.sin(angle + rng.range(-0.035, 0.035)) * r, rng.range(-0.08, 0.02));
      edgePositions.push(p.x, p.y, p.z);
      const c = petalColor.clone().lerp(new THREE.Color('#ffffff'), rng.range(0.12, 0.42));
      edgeColors.push(c.r, c.g, c.b);
    }
  }

  const disk = new THREE.Mesh(
    new THREE.SphereGeometry(0.31, 22, 12),
    material(colorAt(options.colorPalette, 2), 0.94)
  );
  disk.scale.set(1, 1, 0.42);
  disk.position.z = 0.04;
  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(edgeColors, 3));
  group.add(petals, disk, new THREE.Points(edgeGeometry, pointMaterial(0.025, 0.72)));
  return applyRoot(group, options);
}

export function createLayeredRoundFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:layered`);
  const group = new THREE.Group();
  const ringCount = Math.max(4, Math.round(5 + options.density));
  const totalPetals = Array.from({ length: ringCount }, (_, ring) => 6 + ring * 5).reduce((sum, count) => sum + count, 0);
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.58, 0.2, 0.24 + options.openness * 0.04, 0.04),
    material(colorAt(options.colorPalette, 0)),
    totalPetals
  );

  let cursor = 0;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const count = 6 + ring * 5;
    const radius = 0.04 + ring * 0.085;
    const petalLength = 0.32 + ring * 0.12;
    const cupLift = 0.3 - ring * 0.055;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.46 + rng.range(-0.06, 0.06);
      const p = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, cupLift);
      const normal = new THREE.Vector3(Math.cos(angle) * (0.3 + ring * 0.16), 0.82 - ring * 0.06, Math.sin(angle) * (0.3 + ring * 0.16));
      setInstance(
        petals,
        cursor,
        p,
        new THREE.Vector3(rng.range(0.72, 1.18), petalLength * rng.range(0.86, 1.18), 1),
        colorAt(options.colorPalette, ring).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.16)),
        angle - Math.PI / 2 + (ring % 2 ? 0.08 : -0.08),
        normal
      );
      cursor += 1;
    }
  }

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), material(colorAt(options.colorPalette, 2), 0.9));
  core.scale.set(0.74, 0.74, 1.45);
  core.position.z = 0.36;
  group.add(petals, core);
  return applyRoot(group, options);
}

export function createSpikeFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:spike`);
  const group = new THREE.Group();
  const height = 1.72 + options.openness * 0.28;
  const curve = makeStemCurve(height, options.curvature, rng.range(-0.04, 0.04));
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 18, 0.018, 6),
    material(colorAt(options.colorPalette, 2), 0.9)
  );
  const count = Math.max(20, Math.round(30 * options.density));
  const florets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 8, 6), material(colorAt(options.colorPalette, 0)), count);

  for (let i = 0; i < count; i += 1) {
    const t = i / Math.max(1, count - 1);
    const base = curve.getPoint(t);
    const bottomSize = 1.28 - t * 0.68;
    const middleDensity = 0.72 + Math.sin(t * Math.PI) * 0.36;
    const taper = bottomSize * middleDensity;
    const angle = (i % 4) * (Math.PI / 2) + t * Math.PI * 1.2 + rng.range(-0.18, 0.18);
    const offset = new THREE.Vector3(Math.cos(angle) * 0.15 * taper, rng.range(-0.025, 0.025), Math.sin(angle) * 0.15 * taper);
    setInstance(
      florets,
      i,
      base.add(offset),
      new THREE.Vector3(taper * rng.range(0.88, 1.18), taper * rng.range(0.76, 1.08), taper * rng.range(0.82, 1.08)),
      colorAt(options.colorPalette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.22)),
      angle
    );
  }
  group.add(stem, florets);
  return applyRoot(group, options);
}

export function createOpenSculptureFlower(options: FloraPrimitiveOptions) {
  const group = new THREE.Group();
  const petalsSpec = [
    { angle: 0, y: 0.02, z: 0, width: 1.35, length: 1.24, normal: new THREE.Vector3(0.1, 0.9, 0.52), color: 0 },
    { angle: -0.72, y: -0.04, z: -0.02, width: 0.9, length: 0.92, normal: new THREE.Vector3(-0.62, 0.64, 0.34), color: 1 },
    { angle: 0.78, y: -0.04, z: -0.02, width: 0.86, length: 0.9, normal: new THREE.Vector3(0.64, 0.64, 0.3), color: 1 },
    { angle: -1.78, y: -0.12, z: -0.08, width: 0.56, length: 0.62, normal: new THREE.Vector3(-0.4, 0.62, -0.28), color: 0 },
    { angle: 1.84, y: -0.12, z: -0.08, width: 0.58, length: 0.64, normal: new THREE.Vector3(0.42, 0.62, -0.28), color: 0 }
  ];
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.86 + options.openness * 0.26, 0.2, 0.24 + options.curvature * 0.08, 0.02),
    material(colorAt(options.colorPalette, 0)),
    petalsSpec.length
  );

  petalsSpec.forEach((petal, i) => {
    setInstance(
      petals,
      i,
      new THREE.Vector3(Math.sin(petal.angle) * 0.1, petal.y, petal.z),
      new THREE.Vector3(petal.width, petal.length, 1),
      colorAt(options.colorPalette, petal.color).clone().lerp(new THREE.Color('#ffffff'), i === 0 ? 0.08 : 0.0),
      petal.angle,
      petal.normal
    );
  });

  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.38, 16, 1, true), material(colorAt(options.colorPalette, 2), 0.9));
  throat.rotation.x = Math.PI / 2;
  throat.position.set(0, 0.18, 0.12);
  const stamen = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), material(colorAt(options.colorPalette, 3), 0.7));
  stamen.position.set(0, 0.35, 0.16);
  group.rotation.x = -0.28;
  group.add(petals, throat, stamen);
  return applyRoot(group, options);
}

export function createClusterFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:cluster`);
  const group = new THREE.Group();
  const count = Math.max(28, Math.round(42 * options.density));
  const micro = new THREE.InstancedMesh(petalGeometry(0.18, 0.05, 0.02), material(colorAt(options.colorPalette, 0)), count * 4);
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const direction = new THREE.Vector3(rng.range(-1, 1), rng.range(-0.8, 0.9), rng.range(-0.85, 0.85)).normalize();
    const lumpyRadius = rng.range(0.34, 0.52) * (1 + Math.sin(i * 1.7) * 0.12);
    const center = direction.multiplyScalar(lumpyRadius);
    center.y *= 0.82;
    const radius = rng.range(0.72, 1.18);
    for (let petal = 0; petal < 4; petal += 1) {
      const angle = (petal / 4) * Math.PI * 2 + rng.range(-0.12, 0.12);
      const offset = new THREE.Vector3(Math.cos(angle) * 0.035, Math.sin(angle) * 0.035, rng.range(-0.01, 0.02));
      setInstance(
        micro,
        cursor,
        center.clone().add(offset),
        new THREE.Vector3(radius, radius, 1),
        colorAt(options.colorPalette, i + petal).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.24)),
        angle - Math.PI / 2,
        center.clone().normalize()
      );
      cursor += 1;
    }
  }
  group.add(micro);
  return applyRoot(group, options);
}

export function createBerryCluster(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:berries`);
  const group = new THREE.Group();
  const branchCount = 5;
  const berriesPerBranch = 3;
  const berryCount = branchCount * berriesPerBranch;
  const berries = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.09, 12, 8),
    new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05 }),
    berryCount
  );
  const positions: number[] = [];
  const colors: number[] = [];
  const stemColor = colorAt(options.colorPalette, 2);

  const highlightPositions: number[] = [];
  const highlightColors: number[] = [];
  let berryIndex = 0;
  for (let branch = 0; branch < branchCount; branch += 1) {
    const angle = (branch / branchCount) * Math.PI * 2 + rng.range(-0.24, 0.24);
    const joint = new THREE.Vector3(Math.cos(angle) * rng.range(0.08, 0.18), rng.range(-0.24, 0.18), Math.sin(angle) * rng.range(0.08, 0.18));
    positions.push(0, -0.48, 0, joint.x, joint.y, joint.z);
    colors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
    for (let tip = 0; tip < berriesPerBranch; tip += 1) {
      const side = angle + (tip - 1) * 0.34 + rng.range(-0.08, 0.08);
      const p = joint.clone().add(new THREE.Vector3(Math.cos(side) * rng.range(0.18, 0.34), rng.range(0.14, 0.42), Math.sin(side) * rng.range(0.18, 0.34)));
      positions.push(joint.x, joint.y, joint.z, p.x, p.y, p.z);
      colors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
      setInstance(
        berries,
        berryIndex,
        p,
        new THREE.Vector3(rng.range(0.78, 1.24), rng.range(0.78, 1.2), rng.range(0.78, 1.18)),
        colorAt(options.colorPalette, berryIndex).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.0, 0.12)),
        0
      );
      highlightPositions.push(p.x + 0.026, p.y + 0.034, p.z + 0.035);
      highlightColors.push(1, 1, 1);
      berryIndex += 1;
    }
  }

  const stemGeometry = new THREE.BufferGeometry();
  stemGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  stemGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const highlightGeometry = new THREE.BufferGeometry();
  highlightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(highlightPositions, 3));
  highlightGeometry.setAttribute('color', new THREE.Float32BufferAttribute(highlightColors, 3));
  group.add(
    new THREE.LineSegments(stemGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.72 })),
    berries,
    new THREE.Points(highlightGeometry, pointMaterial(0.022, 0.9))
  );
  return applyRoot(group, options);
}

export function createAirFiller(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:air`);
  const group = new THREE.Group();
  const branchCount = Math.max(11, Math.round(18 * options.density));
  const pointPositions: number[] = [];
  const pointColors: number[] = [];
  const linePositions: number[] = [];
  const lineColors: number[] = [];

  for (let i = 0; i < branchCount; i += 1) {
    const start = new THREE.Vector3(rng.range(-0.16, 0.16), rng.range(-0.34, 0.08), rng.range(-0.14, 0.14));
    const end = start.clone().add(new THREE.Vector3(rng.range(-0.58, 0.58), rng.range(0.3, 0.78), rng.range(-0.42, 0.42)));
    const mid = start.clone().lerp(end, rng.range(0.45, 0.68)).add(new THREE.Vector3(rng.range(-0.1, 0.1), rng.range(-0.02, 0.08), rng.range(-0.08, 0.08)));
    linePositions.push(start.x, start.y, start.z, mid.x, mid.y, mid.z, mid.x, mid.y, mid.z, end.x, end.y, end.z);
    const c = colorAt(options.colorPalette, i + 1);
    lineColors.push(c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b, c.r, c.g, c.b);
    const dots = rng.integer(3, 6);
    for (let dot = 0; dot < dots; dot += 1) {
      const t = rng.range(0.42, 1);
      const p = mid.clone().lerp(end, t).add(new THREE.Vector3(rng.range(-0.035, 0.035), rng.range(-0.025, 0.025), rng.range(-0.035, 0.035)));
      pointPositions.push(p.x, p.y, p.z);
      const pc = colorAt(options.colorPalette, dot).lerp(new THREE.Color('#ffffff'), rng.range(0.16, 0.42));
      pointColors.push(pc.r, pc.g, pc.b);
    }
  }

  const pointGeometry = new THREE.BufferGeometry();
  pointGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pointPositions, 3));
  pointGeometry.setAttribute('color', new THREE.Float32BufferAttribute(pointColors, 3));
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
  group.add(
    new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42 })),
    new THREE.Points(pointGeometry, pointMaterial(0.035, 0.82))
  );
  return applyRoot(group, options);
}

export const floraPrimitiveFactories = {
  DiskFlower: createDiskFlower,
  LayeredRoundFlower: createLayeredRoundFlower,
  SpikeFlower: createSpikeFlower,
  OpenSculptureFlower: createOpenSculptureFlower,
  ClusterFlower: createClusterFlower,
  BerryCluster: createBerryCluster,
  AirFiller: createAirFiller
};

export type FloraPrimitiveName = keyof typeof floraPrimitiveFactories;
