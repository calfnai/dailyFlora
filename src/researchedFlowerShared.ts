import * as THREE from 'three';
import type { Rng } from './random';

export const UP = new THREE.Vector3(0, 1, 0);
const X_AXIS = new THREE.Vector3(1, 0, 0);
const tempObject = new THREE.Object3D();

export type BuildOptions = {
  seed: string;
  palette: string[];
};

export type Segment = {
  start: THREE.Vector3;
  end: THREE.Vector3;
  radius: number;
  color?: THREE.Color;
};

type Basis = {
  tangent: THREE.Vector3;
  bitangent: THREE.Vector3;
};

export function colorAt(palette: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(palette[index % palette.length] || fallback);
}

export function flowerMaterial(color: THREE.Color | string, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: 0,
    side: THREE.DoubleSide
  });
}

export function petalGeometry(
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

export function roundedSepalGeometry(length = 0.16, width = 0.12, cup = 0.015) {
  const positions: number[] = [];
  const rows = 9;
  const cols = 5;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const profile = v < 0.76
      ? Math.sin(v / 0.76 * Math.PI * 0.5) ** 0.68
      : Math.cos((v - 0.76) / 0.24 * Math.PI * 0.5) ** 0.58;
    return new THREE.Vector3(
      u * width * profile,
      v * length,
      Math.sin(v * Math.PI) * cup * (0.72 + Math.abs(u) * 0.28)
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

export function broadLeafGeometry(length = 0.76, width = 0.3) {
  const positions: number[] = [];
  const rows = 14;
  const cols = 6;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const serration = 1 + Math.sin(v * Math.PI * 14) * 0.045 * Math.abs(u);
    const halfWidth = Math.sin(v * Math.PI) ** 0.74 * width * serration;
    return new THREE.Vector3(
      u * halfWidth,
      v * length,
      Math.sin(v * Math.PI) * 0.045 - Math.abs(u) * 0.02
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

export function setInstance(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  color: THREE.Color,
  rotationZ = 0,
  direction = UP
) {
  tempObject.position.copy(position);
  tempObject.quaternion.setFromUnitVectors(UP, direction.clone().normalize());
  tempObject.rotateZ(rotationZ);
  tempObject.scale.copy(scale);
  tempObject.updateMatrix();
  mesh.setMatrixAt(index, tempObject.matrix);
  mesh.setColorAt(index, color);
}

export function finishInstances(mesh: THREE.InstancedMesh) {
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

export function basisFor(direction: THREE.Vector3): Basis {
  const normal = direction.clone().normalize();
  const reference = Math.abs(normal.dot(UP)) > 0.88 ? X_AXIS : UP;
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

export function stemAlong(points: THREE.Vector3[], radius: number, color: THREE.Color, segments = 18) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, radius, 7, false),
    flowerMaterial(color, 0.94)
  );
  return { curve, mesh };
}

export function segmentMesh(segments: Segment[], defaultColor: THREE.Color, radialSegments = 7) {
  const geometry = new THREE.CylinderGeometry(1, 0.92, 1, radialSegments);
  const mesh = new THREE.InstancedMesh(geometry, flowerMaterial(defaultColor, 0.94), segments.length);
  segments.forEach((segment, index) => {
    const direction = segment.end.clone().sub(segment.start);
    const length = direction.length();
    setInstance(
      mesh,
      index,
      segment.start.clone().add(segment.end).multiplyScalar(0.5),
      new THREE.Vector3(segment.radius, length, segment.radius),
      segment.color || defaultColor,
      0,
      direction
    );
  });
  return finishInstances(mesh);
}

export function orientGroup(group: THREE.Group, position: THREE.Vector3, forward: THREE.Vector3, scale = 1) {
  group.position.copy(position);
  group.quaternion.setFromUnitVectors(UP, forward.clone().normalize());
  group.scale.setScalar(scale);
  return group;
}

export function addStemAndOppositeLeaves(group: THREE.Group, green: THREE.Color, rng: Rng) {
  const stem = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(-0.02, -0.74, 0.012),
    new THREE.Vector3(0.028, -0.28, -0.015),
    new THREE.Vector3(0, 0.03, 0)
  ], 0.034, green, 18);
  group.add(stem.mesh);

  const leaves = new THREE.InstancedMesh(
    broadLeafGeometry(),
    flowerMaterial(green.clone().lerp(new THREE.Color('#2f5d37'), 0.22), 0.96),
    2
  );
  [-1, 1].forEach((side, index) => {
    const direction = new THREE.Vector3(side * 0.94, 0.24, rng.range(-0.16, 0.16)).normalize();
    setInstance(
      leaves,
      index,
      new THREE.Vector3(side * 0.025, -0.58 + index * 0.05, 0),
      new THREE.Vector3(0.82, 0.82, 0.82),
      green.clone().lerp(new THREE.Color(index ? '#6e925c' : '#486d43'), 0.35),
      side > 0 ? -0.12 : 0.12,
      direction
    );
  });
  group.add(finishInstances(leaves));
}
