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

function curvedPetalGeometry(length = 1, width = 0.24, cup = 0.12, curl = 0.06, taper = 0.28) {
  const positions: number[] = [];
  const rows = 7;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const edgeTuck = Math.abs(u) ** 1.7;
    const halfWidth = Math.sin(v * Math.PI) * width * (1 - taper * v);
    return new THREE.Vector3(
      u * halfWidth,
      v * length,
      Math.sin(v * Math.PI) * cup * edgeTuck + v * v * curl
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

function flaredTrumpetGeometry(length = 1.1, throatRadius = 0.12, rimRadius = 0.48) {
  const profile = [
    new THREE.Vector2(throatRadius * 0.74, -length * 0.48),
    new THREE.Vector2(throatRadius, -length * 0.24),
    new THREE.Vector2(rimRadius * 0.54, length * 0.16),
    new THREE.Vector2(rimRadius, length * 0.46)
  ];
  const geometry = new THREE.LatheGeometry(profile, 40);
  geometry.computeVertexNormals();
  return geometry;
}

function callaSpatheGeometry(length = 1.08, baseRadius = 0.12, rimRadius = 0.48) {
  const positions: number[] = [];
  const rows = 10;
  const cols = 12;
  const thetaMin = -2.46;
  const thetaMax = 2.34;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols;
    const edge = Math.abs(u - 0.5) * 2;
    const closingCurl = (u > 0.66 ? (u - 0.66) * 2.8 : 0) * v * v;
    const theta = thetaMin + (thetaMax - thetaMin) * u + v * 0.62 + closingCurl;
    const radius = baseRadius + (rimRadius - baseRadius) * Math.sin(v * Math.PI * 0.5) * (1 - edge * 0.08);
    const curl = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * 0.08 + closingCurl * 0.08;
    return new THREE.Vector3(
      Math.cos(theta) * radius,
      v * length - length * 0.46,
      Math.sin(theta) * radius * 0.72 + curl
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

function bellFruitGeometry(height = 0.34, waist = 0.07, shoulder = 0.13, mouth = 0.1) {
  const profile = [
    new THREE.Vector2(0.018, height * 0.5),
    new THREE.Vector2(waist, height * 0.34),
    new THREE.Vector2(shoulder, height * 0.02),
    new THREE.Vector2(mouth, -height * 0.42),
    new THREE.Vector2(mouth * 0.68, -height * 0.5)
  ];
  const geometry = new THREE.LatheGeometry(profile, 24);
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

export function createCosmosOpenFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:cosmos-open`);
  const group = new THREE.Group();
  const petalCount = Math.max(7, Math.round(8 * options.density));
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.92, 0.18, 0.08 + options.openness * 0.035, 0.08),
    material(colorAt(options.colorPalette, 0)),
    petalCount
  );
  const petalBase = colorAt(options.colorPalette, 0);

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2 + rng.range(-0.08, 0.08);
    const length = rng.range(0.86, 1.16);
    const width = rng.range(0.86, 1.12);
    const p = new THREE.Vector3(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, rng.range(-0.015, 0.02));
    setInstance(
      petals,
      i,
      p,
      new THREE.Vector3(width, length, 1),
      petalBase.clone().lerp(colorAt(options.colorPalette, 1), rng.range(0.04, 0.22)),
      angle - Math.PI / 2 + rng.range(-0.06, 0.06)
    );
  }

  const center = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 10), material(colorAt(options.colorPalette, 2), 0.92));
  center.scale.set(1, 1, 0.42);
  center.position.z = 0.04;
  group.add(petals, center);
  return applyRoot(group, options);
}

export function createLayeredRoundFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:layered`);
  const group = new THREE.Group();
  const ringCount = 7;
  const totalPetals = Array.from({ length: ringCount }, (_, ring) => 10 + ring * 8).reduce((sum, count) => sum + count, 0);
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.5, 0.115, 0.18 + options.openness * 0.04, 0.01),
    material(colorAt(options.colorPalette, 0)),
    totalPetals
  );

  let cursor = 0;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const count = 10 + ring * 8;
    const radius = 0.025 + ring * 0.065;
    const petalLength = 0.22 + ring * 0.095;
    const domeLift = 0.42 - ring * 0.052;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.46 + rng.range(-0.06, 0.06);
      const p = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, domeLift + rng.range(-0.018, 0.018));
      const normal = new THREE.Vector3(Math.cos(angle) * (0.42 + ring * 0.2), 0.92 - ring * 0.05, Math.sin(angle) * (0.42 + ring * 0.2));
      setInstance(
        petals,
        cursor,
        p,
        new THREE.Vector3(rng.range(0.78, 1.12), petalLength * rng.range(0.88, 1.18), 1),
        colorAt(options.colorPalette, ring).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.16)),
        angle - Math.PI / 2 + (ring % 2 ? 0.13 : -0.13),
        normal
      );
      cursor += 1;
    }
  }

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), material(colorAt(options.colorPalette, 2), 0.9));
  core.scale.set(0.8, 0.8, 1.1);
  core.position.z = 0.44;
  group.add(petals, core);
  return applyRoot(group, options);
}

export const createLayeredRoseFlower = createLayeredRoundFlower;

export function createLayeredDahliaFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:layered-dahlia`);
  const group = new THREE.Group();
  const ringCount = 6;
  const counts = [12, 18, 26, 34, 42, 50];
  const totalPetals = counts.reduce((sum, count) => sum + count, 0);
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.56, 0.062, 0.07, 0.008),
    material(colorAt(options.colorPalette, 0)),
    totalPetals
  );

  let cursor = 0;
  counts.forEach((count, ring) => {
    const radius = 0.02 + ring * 0.068;
    const petalLength = 0.38 + ring * 0.12;
    const lift = 0.34 - ring * 0.04;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.31 + rng.range(-0.025, 0.025);
      const normal = new THREE.Vector3(Math.cos(angle) * (0.34 + ring * 0.16), 0.9 - ring * 0.045, Math.sin(angle) * (0.34 + ring * 0.16));
      setInstance(
        petals,
        cursor,
        new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, lift + rng.range(-0.012, 0.012)),
        new THREE.Vector3(rng.range(0.78, 1.04), petalLength * rng.range(0.94, 1.08), 1),
        colorAt(options.colorPalette, ring).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.18)),
        angle - Math.PI / 2,
        normal
      );
      cursor += 1;
    }
  });

  const button = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), material(colorAt(options.colorPalette, 2), 0.9));
  button.scale.set(1, 1, 0.58);
  button.position.z = 0.35;
  group.add(petals, button);
  return applyRoot(group, options);
}

export function createRuffledRoundFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:ruffled`);
  const group = new THREE.Group();
  const ringCount = 5;
  const totalPetals = Array.from({ length: ringCount }, (_, ring) => 6 + ring * 4).reduce((sum, count) => sum + count, 0);
  const petals = new THREE.InstancedMesh(
    curvedPetalGeometry(0.5, 0.18, 0.2, 0.07, 0.12),
    material(colorAt(options.colorPalette, 0)),
    totalPetals
  );

  let cursor = 0;
  for (let ring = 0; ring < ringCount; ring += 1) {
    const count = 6 + ring * 4;
    const radius = 0.025 + ring * 0.058;
    const lift = 0.35 - ring * 0.044;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + ring * 0.86 + rng.range(-0.08, 0.08);
      const wave = 1 + Math.sin(i * 2.7 + ring * 1.8) * 0.18;
      const inward = ring < 2 ? -0.18 : 0.08;
      const normal = new THREE.Vector3(Math.cos(angle) * (0.2 + ring * 0.1 + inward), 1.04 - ring * 0.04, Math.sin(angle) * (0.2 + ring * 0.1 + inward));
      setInstance(
        petals,
        cursor,
        new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, lift + rng.range(-0.025, 0.025)),
        new THREE.Vector3(rng.range(0.9, 1.18) * wave, rng.range(0.62, 0.82) + ring * 0.045, 1),
        colorAt(options.colorPalette, ring).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.24)),
        angle - Math.PI / 2 + Math.sin(i * 1.7) * 0.22,
        normal
      );
      cursor += 1;
    }
  }

  const core = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 18, 1, true), material(colorAt(options.colorPalette, 2), 0.86));
  core.rotation.x = Math.PI / 2;
  core.scale.set(1, 0.76, 1);
  core.position.z = 0.34;
  group.add(petals, core);
  return applyRoot(group, options);
}

export const createRuffledRoseFlower = createRuffledRoundFlower;

export function createStarPinwheelFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:pinwheel`);
  const group = new THREE.Group();
  const petalCount = 9;
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(1.06, 0.058, 0.085, 0.028),
    material(colorAt(options.colorPalette, 0)),
    petalCount
  );

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2 + rng.range(-0.035, 0.035);
    setInstance(
      petals,
      i,
      new THREE.Vector3(Math.cos(angle) * 0.095, Math.sin(angle) * 0.095, rng.range(-0.018, 0.018)),
      new THREE.Vector3(rng.range(0.74, 0.98), rng.range(0.94, 1.18), 1),
      colorAt(options.colorPalette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.12)),
      angle - Math.PI / 2 + 0.1
    );
  }

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 8), material(colorAt(options.colorPalette, 2), 0.9));
  core.scale.set(1, 1, 0.42);
  core.position.z = 0.05;
  group.add(petals, core);
  return applyRoot(group, options);
}

export function createTulipCupFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:tulip`);
  const group = new THREE.Group();
  const petalCount = 7;
  const petals = new THREE.InstancedMesh(
    curvedPetalGeometry(0.92, 0.26, 0.18, 0.18, 0.12),
    material(colorAt(options.colorPalette, 0)),
    petalCount
  );

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2 + rng.range(-0.05, 0.05);
    const outer = i > 3;
    const normal = new THREE.Vector3(Math.cos(angle) * (outer ? 0.36 : 0.22), 1.12, Math.sin(angle) * (outer ? 0.36 : 0.22));
    setInstance(
      petals,
      i,
      new THREE.Vector3(Math.cos(angle) * (outer ? 0.13 : 0.07), -0.26 + (outer ? 0 : 0.08), Math.sin(angle) * (outer ? 0.13 : 0.07)),
      new THREE.Vector3(rng.range(0.86, 1.08), rng.range(0.86, 1.08), 1),
      colorAt(options.colorPalette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.18)),
      angle - Math.PI / 2 + (outer ? 0 : 0.08),
      normal
    );
  }

  const cupBase = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.22, 0.26, 14, 1, true), material(colorAt(options.colorPalette, 1), 0.9));
  cupBase.rotation.x = Math.PI / 2;
  cupBase.position.set(0, -0.18, 0.05);
  cupBase.scale.set(0.86, 0.86, 1);
  group.rotation.x = -0.16;
  group.add(petals, cupBase);
  return applyRoot(group, options);
}

export function createTrumpetThroatFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:trumpet`);
  const group = new THREE.Group();
  const petalCount = 6;
  const petals = new THREE.InstancedMesh(
    taperedPetalGeometry(0.7, 0.13, 0.08, 0.04),
    material(colorAt(options.colorPalette, 0)),
    petalCount
  );

  for (let i = 0; i < petalCount; i += 1) {
    const angle = (i / petalCount) * Math.PI * 2 + rng.range(-0.04, 0.04);
    setInstance(
      petals,
      i,
      new THREE.Vector3(Math.cos(angle) * 0.18, Math.sin(angle) * 0.18, 0),
      new THREE.Vector3(rng.range(0.88, 1.08), rng.range(0.9, 1.18), 1),
      colorAt(options.colorPalette, 0).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.12, 0.3)),
      angle - Math.PI / 2
    );
  }

  const throat = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.54, 24, 1, true), material(colorAt(options.colorPalette, 2), 0.84));
  throat.rotation.x = Math.PI / 2;
  throat.position.z = 0.16;
  throat.scale.set(0.82, 0.82, 0.92);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.014, 6, 28), material(colorAt(options.colorPalette, 3), 0.86));
  rim.position.z = 0.4;
  group.add(petals, throat, rim);
  return applyRoot(group, options);
}

export function createDaturaTrumpetFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:datura`);
  const group = new THREE.Group();
  const throat = new THREE.Mesh(flaredTrumpetGeometry(0.72, 0.07, 0.28), material(colorAt(options.colorPalette, 0), 0.82));
  throat.rotation.x = Math.PI / 2;
  throat.position.z = 0.04;
  throat.scale.set(0.86, 0.78, 0.9);

  const lobes = new THREE.InstancedMesh(curvedPetalGeometry(0.82, 0.2, 0.08, 0.14, 0.04), material(colorAt(options.colorPalette, 1), 0.82), 5);
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2 + Math.PI / 5 + rng.range(-0.045, 0.045);
    setInstance(
      lobes,
      i,
      new THREE.Vector3(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0.22),
      new THREE.Vector3(rng.range(0.92, 1.08), rng.range(1.02, 1.16), 1),
      colorAt(options.colorPalette, i + 1).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.06, 0.2)),
      angle - Math.PI / 2 + rng.range(-0.07, 0.07),
      new THREE.Vector3(Math.cos(angle) * 0.56, 0.54, Math.sin(angle) * 0.56)
    );
  }

  const throatDot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), material(colorAt(options.colorPalette, 2), 0.78));
  throatDot.scale.set(0.7, 0.7, 0.28);
  throatDot.position.z = -0.24;
  group.add(lobes, throat, throatDot);
  return applyRoot(group, options);
}

export function createSpikeFlower(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:spike`);
  const group = new THREE.Group();
  const height = 1.76 + options.openness * 0.22;
  const lean = new THREE.Vector3(rng.range(-0.025, 0.025), 0, rng.range(-0.025, 0.025));
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -height * 0.52, 0),
    new THREE.Vector3(lean.x * 0.35, -height * 0.15, lean.z * 0.35),
    new THREE.Vector3(lean.x * 0.72, height * 0.18, lean.z * 0.72),
    new THREE.Vector3(lean.x, height * 0.52, lean.z)
  ]);
  const stem = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 8, 0.018, 6),
    material(colorAt(options.colorPalette, 2), 0.9)
  );
  const floretCount = Math.max(30, Math.round(40 * options.density));
  const florets = new THREE.InstancedMesh(petalGeometry(0.16, 0.045, 0.026), material(colorAt(options.colorPalette, 0)), floretCount * 4);

  let cursor = 0;
  for (let i = 0; i < floretCount; i += 1) {
    const t = i / Math.max(1, floretCount - 1);
    const base = curve.getPoint(t);
    const taper = (1.16 - t * 0.66) * (0.78 + Math.sin(t * Math.PI) * 0.18);
    const angle = (i % 7) * (Math.PI / 3.5) + i * 0.16 + rng.range(-0.14, 0.14);
    const center = base.add(new THREE.Vector3(Math.cos(angle) * 0.105 * taper, rng.range(-0.012, 0.012), Math.sin(angle) * 0.105 * taper));
    for (let petal = 0; petal < 4; petal += 1) {
      const petalAngle = angle + (petal / 4) * Math.PI * 2;
      setInstance(
        florets,
        cursor,
        center.clone().add(new THREE.Vector3(Math.cos(petalAngle) * 0.018 * taper, Math.sin(petalAngle) * 0.012 * taper, Math.sin(petalAngle) * 0.014 * taper)),
        new THREE.Vector3(taper * rng.range(0.72, 0.98), taper * rng.range(0.72, 1), 1),
        colorAt(options.colorPalette, i + petal).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.22)),
        petalAngle - Math.PI / 2,
        new THREE.Vector3(Math.cos(angle) * 0.22, 0.96, Math.sin(angle) * 0.22)
      );
      cursor += 1;
    }
  }
  group.add(stem, florets);
  return applyRoot(group, options);
}

export function createOpenSculptureFlower(options: FloraPrimitiveOptions) {
  const group = new THREE.Group();
  const petalsSpec = [
    { angle: 0, y: 0.1, z: 0.04, width: 0.74, length: 1.08, normal: new THREE.Vector3(0.02, 0.68, 0.74), color: 0 },
    { angle: -1.08, y: -0.02, z: 0.0, width: 1.16, length: 0.92, normal: new THREE.Vector3(-0.46, 0.64, 0.62), color: 1 },
    { angle: 1.08, y: -0.02, z: 0.0, width: 1.14, length: 0.9, normal: new THREE.Vector3(0.46, 0.64, 0.62), color: 1 },
    { angle: Math.PI, y: -0.14, z: -0.02, width: 0.84, length: 0.7, normal: new THREE.Vector3(0, 0.72, 0.36), color: 0 }
  ];
  const petals = new THREE.InstancedMesh(
    curvedPetalGeometry(0.82 + options.openness * 0.2, 0.18, 0.12 + options.curvature * 0.06, 0.04, 0.18),
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
  group.rotation.x = -0.12;
  group.add(petals, throat, stamen);
  return applyRoot(group, options);
}

export const createOrchidButterflyFlower = createOpenSculptureFlower;

export function createCallaCurledBract(options: FloraPrimitiveOptions) {
  const group = new THREE.Group();
  const bract = new THREE.Mesh(callaSpatheGeometry(1.16, 0.1, 0.52), material(colorAt(options.colorPalette, 0), 0.78));
  bract.rotation.x = -0.15;
  bract.rotation.z = -0.38;
  bract.scale.set(1.12, 1.12, 1);

  const spadix = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.44, 6, 10), material(colorAt(options.colorPalette, 2), 0.72));
  spadix.rotation.z = -0.42;
  spadix.position.set(0.06, 0.1, 0.04);
  group.add(bract, spadix);
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

export function createUmbelMiniCluster(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:umbel`);
  const group = new THREE.Group();
  const stemColor = colorAt(options.colorPalette, 3);
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const flowerCount = Math.max(34, Math.round(48 * options.density));
  const flowers = new THREE.InstancedMesh(petalGeometry(0.11, 0.032, 0.012), material(colorAt(options.colorPalette, 0)), flowerCount * 6);
  const cores = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 8, 6), material(colorAt(options.colorPalette, 1), 0.9), flowerCount);
  let cursor = 0;

  for (let i = 0; i < flowerCount; i += 1) {
    const theta = (i / flowerCount) * Math.PI * 2 + rng.range(-0.12, 0.12);
    const phi = rng.range(0.18, 1.22);
    const radius = rng.range(0.34, 0.62);
    const tip = new THREE.Vector3(Math.cos(theta) * Math.sin(phi) * radius, Math.cos(phi) * 0.42 + 0.24, Math.sin(theta) * Math.sin(phi) * radius);
    const stemBase = tip.clone().multiplyScalar(rng.range(0.24, 0.42));
    stemBase.y = Math.max(-0.02, tip.y - rng.range(0.1, 0.18));
    linePositions.push(stemBase.x, stemBase.y, stemBase.z, tip.x, tip.y, tip.z);
    lineColors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
    setInstance(
      cores,
      i,
      tip,
      new THREE.Vector3(rng.range(0.82, 1.08), rng.range(0.82, 1.08), rng.range(0.82, 1.08)),
      colorAt(options.colorPalette, 1).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.08, 0.26)),
      0
    );
    for (let petal = 0; petal < 6; petal += 1) {
      const petalAngle = (petal / 6) * Math.PI * 2;
      const normal = new THREE.Vector3(Math.cos(theta) * 0.38 + Math.cos(petalAngle) * 0.28, 0.78, Math.sin(theta) * 0.38 + Math.sin(petalAngle) * 0.28);
      setInstance(
        flowers,
        cursor,
        tip.clone().add(new THREE.Vector3(Math.cos(petalAngle) * 0.022, Math.sin(petalAngle) * 0.014, Math.sin(petalAngle + theta) * 0.018)),
        new THREE.Vector3(rng.range(0.82, 1.08), rng.range(0.82, 1.08), 1),
        colorAt(options.colorPalette, petal).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.16, 0.36)),
        petalAngle - Math.PI / 2,
        normal
      );
      cursor += 1;
    }
  }

  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
  group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.24 })), flowers, cores);
  return applyRoot(group, options);
}

export const createHydrangeaCloudCluster = createClusterFlower;

export function createFullHydrangeaCloud(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:hydrangea-full`);
  const group = new THREE.Group();
  const count = Math.max(54, Math.round(76 * options.density));
  const micro = new THREE.InstancedMesh(petalGeometry(0.16, 0.045, 0.018), material(colorAt(options.colorPalette, 0)), count * 4);
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const theta = rng.range(0, Math.PI * 2);
    const phi = Math.acos(rng.range(-0.72, 0.92));
    const radius = rng.range(0.42, 0.66) * (1 + Math.sin(i * 1.9) * 0.08);
    const center = new THREE.Vector3(Math.cos(theta) * Math.sin(phi) * radius, Math.cos(phi) * radius * 0.86, Math.sin(theta) * Math.sin(phi) * radius);
    for (let petal = 0; petal < 4; petal += 1) {
      const angle = (petal / 4) * Math.PI * 2 + rng.range(-0.1, 0.1);
      setInstance(
        micro,
        cursor,
        center.clone().add(new THREE.Vector3(Math.cos(angle) * 0.032, Math.sin(angle) * 0.032, rng.range(-0.01, 0.02))),
        new THREE.Vector3(rng.range(0.82, 1.18), rng.range(0.82, 1.18), 1),
        colorAt(options.colorPalette, i + petal).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.22)),
        angle - Math.PI / 2,
        center.clone().normalize()
      );
      cursor += 1;
    }
  }
  const hazePositions: number[] = [];
  const hazeColors: number[] = [];
  for (let i = 0; i < 90; i += 1) {
    const p = new THREE.Vector3(rng.range(-0.56, 0.56), rng.range(-0.38, 0.52), rng.range(-0.5, 0.5));
    if (p.length() > 0.68) p.setLength(rng.range(0.42, 0.66));
    hazePositions.push(p.x, p.y, p.z);
    const c = colorAt(options.colorPalette, i).lerp(new THREE.Color('#ffffff'), rng.range(0.18, 0.42));
    hazeColors.push(c.r, c.g, c.b);
  }
  const hazeGeometry = new THREE.BufferGeometry();
  hazeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(hazePositions, 3));
  hazeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(hazeColors, 3));
  group.add(micro, new THREE.Points(hazeGeometry, pointMaterial(0.025, 0.48)));
  return applyRoot(group, options);
}

export function createBerryCluster(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:berries`);
  const group = new THREE.Group();
  const branchCount = 7;
  const berriesPerBranch = 5;
  const berryCount = branchCount * berriesPerBranch;
  const berries = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.058, 12, 8),
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
    const joint = new THREE.Vector3(Math.cos(angle) * rng.range(0.07, 0.16), rng.range(-0.3, 0.14), Math.sin(angle) * rng.range(0.07, 0.16));
    positions.push(0, -0.48, 0, joint.x, joint.y, joint.z);
    colors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
    for (let tip = 0; tip < berriesPerBranch; tip += 1) {
      const side = angle + (tip - 2) * 0.22 + rng.range(-0.1, 0.1);
      const p = joint.clone().add(new THREE.Vector3(Math.cos(side) * rng.range(0.14, 0.28), rng.range(0.12, 0.46), Math.sin(side) * rng.range(0.14, 0.28)));
      positions.push(joint.x, joint.y, joint.z, p.x, p.y, p.z);
      colors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
      setInstance(
        berries,
        berryIndex,
        p,
        new THREE.Vector3(rng.range(0.82, 1.18), rng.range(0.82, 1.14), rng.range(0.82, 1.12)),
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

export const createFruitPodCluster = createBerryCluster;

export function createHangingBellFruit(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:hanging-bell`);
  const group = new THREE.Group();
  const fruitCount = 9;
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const stemColor = colorAt(options.colorPalette, 2);
  const fruits = new THREE.InstancedMesh(bellFruitGeometry(0.32, 0.055, 0.12, 0.095), material(colorAt(options.colorPalette, 0), 0.78), fruitCount);
  const caps = new THREE.InstancedMesh(new THREE.ConeGeometry(0.065, 0.09, 5), material(stemColor, 0.88), fruitCount);

  for (let i = 0; i < fruitCount; i += 1) {
    const angle = (i / fruitCount) * Math.PI * 2 + rng.range(-0.16, 0.16);
    const anchor = new THREE.Vector3(Math.cos(angle) * rng.range(0.05, 0.16), rng.range(0.22, 0.48), Math.sin(angle) * rng.range(0.05, 0.16));
    const tip = anchor.clone().add(new THREE.Vector3(Math.cos(angle) * rng.range(0.12, 0.32), -rng.range(0.34, 0.62), Math.sin(angle) * rng.range(0.08, 0.24)));
    linePositions.push(anchor.x, anchor.y, anchor.z, tip.x, tip.y, tip.z);
    lineColors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
    setInstance(
      fruits,
      i,
      tip,
      new THREE.Vector3(rng.range(0.88, 1.12), rng.range(0.92, 1.18), rng.range(0.88, 1.12)),
      colorAt(options.colorPalette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.14)),
      rng.range(-0.12, 0.12),
      new THREE.Vector3(0, -1, 0)
    );
    setInstance(
      caps,
      i,
      tip.clone().add(new THREE.Vector3(0, 0.15, 0)),
      new THREE.Vector3(rng.range(0.86, 1.08), rng.range(0.72, 0.98), rng.range(0.86, 1.08)),
      stemColor.clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.12)),
      angle,
      new THREE.Vector3(0, 1, 0)
    );
  }
  const lineGeometry = new THREE.BufferGeometry();
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
  group.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.66 })), fruits, caps);
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

export function createFoliageGrassBranch(options: FloraPrimitiveOptions) {
  const rng = createRng(`${options.seed}:foliage`);
  const group = new THREE.Group();
  const stemColor = colorAt(options.colorPalette, 0);
  const linePositions: number[] = [];
  const lineColors: number[] = [];
  const leafCount = Math.max(12, Math.round(16 * options.density));
  const grassCount = Math.max(10, Math.round(14 * options.density));
  const leaves = new THREE.InstancedMesh(taperedPetalGeometry(0.28, 0.04, 0.024, 0.012), material(colorAt(options.colorPalette, 1), 0.92), leafCount);
  const spine = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.58, -0.16, rng.range(-0.04, 0.04)),
    new THREE.Vector3(-0.24, rng.range(-0.04, 0.08), rng.range(-0.08, 0.08)),
    new THREE.Vector3(0.16, rng.range(-0.02, 0.12), rng.range(-0.08, 0.08)),
    new THREE.Vector3(0.62, 0.18, rng.range(-0.04, 0.04))
  ]);

  const spinePoints = spine.getPoints(12);
  for (let i = 0; i < spinePoints.length - 1; i += 1) {
    const a = spinePoints[i];
    const b = spinePoints[i + 1];
    linePositions.push(a.x, a.y, a.z, b.x, b.y, b.z);
    lineColors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
  }

  for (let i = 0; i < leafCount; i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const t = (i + 0.55) / (leafCount + 1);
    const base = spine.getPoint(t);
    const tangent = spine.getTangent(t).normalize();
    const sideVector = new THREE.Vector3(-tangent.y, tangent.x, rng.range(-0.25, 0.25)).normalize();
    const length = rng.range(0.18, 0.34) * (0.78 + Math.sin(t * Math.PI) * 0.18);
    const tip = base.clone().addScaledVector(sideVector, side * length).add(new THREE.Vector3(rng.range(-0.015, 0.015), rng.range(-0.02, 0.04), rng.range(-0.04, 0.04)));
    linePositions.push(base.x, base.y, base.z, tip.x, tip.y, tip.z);
    lineColors.push(stemColor.r, stemColor.g, stemColor.b, stemColor.r, stemColor.g, stemColor.b);
    const normal = sideVector.multiplyScalar(side).add(new THREE.Vector3(0, 0.72, rng.range(-0.12, 0.12))).normalize();
    setInstance(
      leaves,
      i,
      tip,
      new THREE.Vector3(rng.range(0.66, 1.04), rng.range(0.72, 1.12), 1),
      colorAt(options.colorPalette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.0, 0.14)),
      side > 0 ? -0.42 : 0.42,
      normal
    );
  }

  const grassPositions: number[] = [];
  const grassColors: number[] = [];
  for (let i = 0; i < grassCount; i += 1) {
    const t = rng.range(0.08, 0.96);
    const start = spine.getPoint(t);
    const tangent = spine.getTangent(t).normalize();
    const drift = new THREE.Vector3(-tangent.y, tangent.x, rng.range(-0.35, 0.35)).normalize().multiplyScalar(rng.range(-0.16, 0.16));
    const end = start.clone().addScaledVector(tangent, rng.range(0.18, 0.46)).add(drift).add(new THREE.Vector3(0, rng.range(-0.02, 0.12), rng.range(-0.04, 0.04)));
    grassPositions.push(start.x, start.y, start.z, end.x, end.y, end.z);
    const c = colorAt(options.colorPalette, i + 2);
    grassColors.push(c.r, c.g, c.b, c.r, c.g, c.b);
  }

  const branchGeometry = new THREE.BufferGeometry();
  branchGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  branchGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));
  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute('position', new THREE.Float32BufferAttribute(grassPositions, 3));
  grassGeometry.setAttribute('color', new THREE.Float32BufferAttribute(grassColors, 3));
  group.add(
    new THREE.LineSegments(branchGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6 })),
    new THREE.LineSegments(grassGeometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.42 })),
    leaves
  );
  return applyRoot(group, options);
}

export const floraPrimitiveFactories = {
  DiskFlower: createDiskFlower,
  CosmosOpenFlower: createCosmosOpenFlower,
  LayeredDahliaFlower: createLayeredDahliaFlower,
  RuffledRoseFlower: createRuffledRoseFlower,
  StarPinwheelFlower: createStarPinwheelFlower,
  TulipCupFlower: createTulipCupFlower,
  TrumpetThroatFlower: createTrumpetThroatFlower,
  DaturaTrumpetFlower: createDaturaTrumpetFlower,
  OrchidButterflyFlower: createOrchidButterflyFlower,
  CallaCurledBract: createCallaCurledBract,
  SpikeFlower: createSpikeFlower,
  UmbelMiniCluster: createUmbelMiniCluster,
  FullHydrangeaCloud: createFullHydrangeaCloud,
  FruitPodCluster: createFruitPodCluster,
  HangingBellFruit: createHangingBellFruit,
  FoliageGrassBranch: createFoliageGrassBranch,
  LayeredRoseFlower: createLayeredRoseFlower,
  RuffledRoundFlower: createRuffledRoundFlower,
  HydrangeaCloudCluster: createHydrangeaCloudCluster,
  LayeredRoundFlower: createLayeredRoundFlower,
  OpenSculptureFlower: createOpenSculptureFlower,
  ClusterFlower: createClusterFlower,
  BerryCluster: createBerryCluster,
  AirFiller: createAirFiller
};

export type FloraPrimitiveName = keyof typeof floraPrimitiveFactories;
