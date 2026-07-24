import * as THREE from 'three';
import { samplePalmateMajorStructure, PALMATE_MAJOR_STRUCTURE_LANDMARKS } from './palmateMajorStructure';
import { createRng } from './random';
import type { LeafInstanceRecord, PlantStemInstance } from './plantOwnership';

type Triangle = [number, number, number];

type PlanarMesh = {
  points: THREE.Vector2[];
  triangles: Triangle[];
  boundary: number[];
};

export type ConfirmedFoliageBuild = {
  object: THREE.Group;
  leaves: LeafInstanceRecord[];
};

export type ConfirmedFoliageContext = 'bouquet' | 'realistic-lab';

const STRAP_PROFILE = 'confirmed:strap-d2-basal-v1' as const;
const PALMATE_PROFILE = 'confirmed:palmate-major-envelope-v1' as const;
const worldUp = new THREE.Vector3(0, 1, 0);
const worldForward = new THREE.Vector3(0, 0, 1);
const confirmedLeafPalette = ['#52764b', '#648858', '#456943'] as const;

const strapWidthLandmarks = [
  [0, 0.74],
  [0.04, 0.82],
  [0.1, 0.93],
  [0.16, 1],
  [0.32, 0.98],
  [0.5, 0.95],
  [0.68, 0.88],
  [0.8, 0.72],
  [0.9, 0.44],
  [0.96, 0.18],
  [1, 0]
] as const;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp01((value - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function gaussian(distance: number, width: number) {
  return Math.exp(-(distance * distance) / (2 * width * width));
}

function strapWidthRatio(t: number) {
  for (let index = 0; index < strapWidthLandmarks.length - 1; index += 1) {
    const [aT, aW] = strapWidthLandmarks[index];
    const [bT, bW] = strapWidthLandmarks[index + 1];
    if (t >= aT && t <= bT) return mix(aW, bW, smoothstep(aT, bT, t));
  }
  return t <= 0 ? strapWidthLandmarks[0][1] : 0;
}

export function createConfirmedStrapGeometry(age: 'mature' | 'young' = 'mature') {
  const length = age === 'young' ? 4.72 : 5.6;
  const maxWidth = age === 'young' ? 0.48 : 0.58;
  const lengthSegments = 48;
  const widthSegments = 10;
  const positions: number[] = [];
  const indices: number[] = [];
  const rowStride = widthSegments + 1;

  for (let side = 0; side < 2; side += 1) {
    for (let iy = 0; iy <= lengthSegments; iy += 1) {
      const t = iy / lengthSegments;
      const transition = smoothstep(age === 'young' ? 0.18 : 0.14, 0.3, t);
      const edgeClosure = mix(age === 'young' ? 0.72 : 0.52, age === 'young' ? 0.2 : 0.08, transition);
      const width = Math.max(0.008, strapWidthRatio(t) * maxWidth * mix(age === 'young' ? 0.58 : 0.72, 1, transition));
      const tipDroop = age === 'young' ? 0.07 : 0.18;
      const bend = Math.sin(t * Math.PI * 0.5) * (age === 'young' ? 0.06 : 0.12) - Math.pow(t, 2.6) * tipDroop;
      const y = length * t - Math.pow(t, 2.15) * tipDroop * 0.38;
      const rootFade = 1 - smoothstep(0, 0.12, t);

      for (let ix = 0; ix <= widthSegments; ix += 1) {
        const u = ix / widthSegments;
        const signed = u * 2 - 1;
        const edge = Math.abs(signed);
        const edgeFade = Math.pow(edge, 2.45);
        const x = signed * width * 0.5 * (1 - rootFade * edgeClosure * 0.1);
        const shallowGroove = -0.009 * (1 - edgeFade) * smoothstep(0, 0.08, t) * (1 - smoothstep(0.92, 1, t));
        const sheathCup = edgeClosure * Math.pow(edge, 1.65) * mix(0.25, 0.1, transition);
        const lowerRib = (0.022 + edgeClosure * 0.01) * (1 - edgeFade) * (0.7 + 0.3 * (1 - t));
        const laminaThickness = 0.004 + 0.017 * (1 - edgeFade) * (0.55 + 0.45 * (1 - t));
        const topZ = bend + shallowGroove + sheathCup + edge * 0.003;
        const bottomZ = bend - laminaThickness - lowerRib + sheathCup * 0.62;
        positions.push(x, y, side === 0 ? topZ : bottomZ);
      }
    }
  }

  const vertex = (side: number, iy: number, ix: number) => side * (lengthSegments + 1) * rowStride + iy * rowStride + ix;
  for (let side = 0; side < 2; side += 1) {
    for (let iy = 0; iy < lengthSegments; iy += 1) {
      for (let ix = 0; ix < widthSegments; ix += 1) {
        const a = vertex(side, iy, ix);
        const b = vertex(side, iy + 1, ix);
        const c = vertex(side, iy + 1, ix + 1);
        const d = vertex(side, iy, ix + 1);
        if (side === 0) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
  }
  for (let iy = 0; iy < lengthSegments; iy += 1) {
    for (const ix of [0, widthSegments]) {
      const topA = vertex(0, iy, ix);
      const topB = vertex(0, iy + 1, ix);
      const bottomA = vertex(1, iy, ix);
      const bottomB = vertex(1, iy + 1, ix);
      if (ix === 0) indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
      else indices.push(topA, topB, bottomA, topB, bottomB, bottomA);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function distanceToSegment(point: THREE.Vector2, start: THREE.Vector2, end: THREE.Vector2) {
  const segment = new THREE.Vector2().subVectors(end, start);
  const lengthSq = segment.lengthSq();
  if (lengthSq === 0) return point.distanceTo(start);
  const t = clamp01(new THREE.Vector2().subVectors(point, start).dot(segment) / lengthSq);
  return point.distanceTo(start.clone().add(segment.multiplyScalar(t)));
}

function distanceToQuadratic(point: THREE.Vector2, start: THREE.Vector2, control: THREE.Vector2, end: THREE.Vector2) {
  let minimum = Number.POSITIVE_INFINITY;
  let previous = start;
  for (let index = 1; index <= 14; index += 1) {
    const t = index / 14;
    const inverse = 1 - t;
    const next = new THREE.Vector2(
      inverse * inverse * start.x + 2 * inverse * t * control.x + t * t * end.x,
      inverse * inverse * start.y + 2 * inverse * t * control.y + t * t * end.y
    );
    minimum = Math.min(minimum, distanceToSegment(point, previous, next));
    previous = next;
  }
  return minimum;
}

function distanceToContour(point: THREE.Vector2, contour: readonly THREE.Vector2[]) {
  let minimum = Number.POSITIVE_INFINITY;
  for (let index = 0; index < contour.length; index += 1) {
    minimum = Math.min(minimum, distanceToSegment(point, contour[index], contour[(index + 1) % contour.length]));
  }
  return minimum;
}

function signedTriangleArea(points: readonly THREE.Vector2[], triangle: Triangle) {
  const [a, b, c] = triangle.map((index) => points[index]);
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function initialPlanarMesh(contour: readonly THREE.Vector2[]): PlanarMesh {
  const points = contour.map((point) => point.clone());
  const triangles = THREE.ShapeUtils.triangulateShape(points, []).map((face) => {
    const triangle: Triangle = [face[0], face[1], face[2]];
    return signedTriangleArea(points, triangle) >= 0 ? triangle : [triangle[0], triangle[2], triangle[1]] as Triangle;
  });
  return { points, triangles, boundary: points.map((_, index) => index) };
}

function subdividePlanarMesh(mesh: PlanarMesh, rounds: number): PlanarMesh {
  let current = mesh;
  for (let round = 0; round < rounds; round += 1) {
    const points = current.points.map((point) => point.clone());
    const cache = new Map<string, number>();
    const midpoint = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const existing = cache.get(key);
      if (existing !== undefined) return existing;
      const index = points.length;
      points.push(current.points[a].clone().add(current.points[b]).multiplyScalar(0.5));
      cache.set(key, index);
      return index;
    };
    const boundary: number[] = [];
    for (let index = 0; index < current.boundary.length; index += 1) {
      const a = current.boundary[index];
      const b = current.boundary[(index + 1) % current.boundary.length];
      boundary.push(a, midpoint(a, b));
    }
    const triangles: Triangle[] = [];
    for (const [a, b, c] of current.triangles) {
      const ab = midpoint(a, b);
      const bc = midpoint(b, c);
      const ca = midpoint(c, a);
      triangles.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
    }
    current = { points, triangles, boundary };
  }
  return current;
}

function relaxInterior(mesh: PlanarMesh, iterations: number, amount: number): PlanarMesh {
  const boundary = new Set(mesh.boundary);
  const neighbours = mesh.points.map(() => new Set<number>());
  for (const [a, b, c] of mesh.triangles) {
    neighbours[a].add(b).add(c);
    neighbours[b].add(a).add(c);
    neighbours[c].add(a).add(b);
  }
  let points = mesh.points.map((point) => point.clone());
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const next = points.map((point) => point.clone());
    for (let index = 0; index < points.length; index += 1) {
      if (boundary.has(index) || neighbours[index].size === 0) continue;
      const average = new THREE.Vector2();
      neighbours[index].forEach((neighbour) => average.add(points[neighbour]));
      next[index].lerp(average.multiplyScalar(1 / neighbours[index].size), amount);
    }
    points = next;
  }
  return { points, triangles: mesh.triangles, boundary: mesh.boundary };
}

export function createConfirmedPalmateGeometry() {
  const insertion = PALMATE_MAJOR_STRUCTURE_LANDMARKS[0];
  const scale = 5.35 / 366;
  const toLocal = (point: { x: number; y: number }) => new THREE.Vector2(
    (point.x - insertion.x) * scale,
    -1.66 + (insertion.y - point.y) * scale
  );
  const samplesPerSegment = 6;
  const sampled = samplePalmateMajorStructure(samplesPerSegment);
  const bladeContour = [
    ...sampled.slice(samplesPerSegment, samplesPerSegment * (PALMATE_MAJOR_STRUCTURE_LANDMARKS.length - 1)).map(toLocal),
    toLocal(PALMATE_MAJOR_STRUCTURE_LANDMARKS[23])
  ];
  const contour = [
    ...bladeContour,
    new THREE.Vector2(-0.76, -1.87), new THREE.Vector2(-0.39, -2.03),
    new THREE.Vector2(-0.17, -2.28), new THREE.Vector2(-0.1, -2.58),
    new THREE.Vector2(0, -2.72), new THREE.Vector2(0.1, -2.58),
    new THREE.Vector2(0.17, -2.28), new THREE.Vector2(0.39, -2.03),
    new THREE.Vector2(0.76, -1.87)
  ];
  const landmarkLocal = new Map(PALMATE_MAJOR_STRUCTURE_LANDMARKS.map((landmark) => [landmark.id, toLocal(landmark)] as const));
  const start = toLocal(insertion).add(new THREE.Vector2(0, 0.12));
  const veins = [
    { target: landmarkLocal.get(13)!, control: new THREE.Vector2(-0.03, 0.72), strength: 0.0042, width: 0.12 },
    { target: landmarkLocal.get(8)!, control: new THREE.Vector2(1.08, 0.22), strength: 0.0028, width: 0.14 },
    { target: landmarkLocal.get(18)!, control: new THREE.Vector2(-1.04, 0.18), strength: 0.0028, width: 0.14 },
    { target: landmarkLocal.get(4)!, control: new THREE.Vector2(1.18, -0.92), strength: 0.0016, width: 0.15 },
    { target: landmarkLocal.get(22)!, control: new THREE.Vector2(-1.16, -0.88), strength: 0.0016, width: 0.15 }
  ];
  const veinField = (point: THREE.Vector2) => {
    let relief = 0;
    let support = 0;
    for (const vein of veins) {
      const influence = gaussian(distanceToQuadratic(point, start, vein.control, vein.target), vein.width);
      relief += influence * vein.strength;
      support = Math.max(support, influence);
    }
    const fade = smoothstep(-1.72, -1.36, point.y);
    return { relief: relief * fade, support: support * fade };
  };
  const surface = (point: THREE.Vector2) => {
    const bladeBlend = smoothstep(-1.92, -1.48, point.y);
    const yT = clamp01((point.y + 1.66) / 5.35);
    const { support } = veinField(point);
    const tip = (target: THREE.Vector2, radius: number) => gaussian(point.distanceTo(target), radius);
    return Math.sin(yT * Math.PI) * 0.026 * bladeBlend
      + Math.pow(Math.abs(point.x) / 3.6, 2) * 0.0015 * bladeBlend
      - 0.042 * (1 - support) * Math.sin(yT * Math.PI) * bladeBlend
      + tip(veins[0].target, 0.72) * 0.042
      + tip(veins[1].target, 0.7) * 0.052
      + tip(veins[2].target, 0.7) * 0.036
      - tip(veins[3].target, 0.72) * 0.074
      - tip(veins[4].target, 0.72) * 0.058;
  };
  const thickness = (point: THREE.Vector2) => {
    const edgeBlend = smoothstep(0, 0.24, distanceToContour(point, contour));
    const bladeBlend = smoothstep(-1.96, -1.46, point.y);
    return mix(mix(0.009, 0.044, edgeBlend), mix(0.0045, 0.032, edgeBlend), bladeBlend);
  };
  const planar = relaxInterior(subdividePlanarMesh(initialPlanarMesh(contour), 2), 3, 0.32);
  const positions: number[] = [];
  const indices: number[] = [];
  for (const side of ['top', 'bottom'] as const) {
    for (const point of planar.points) {
      const middle = surface(point);
      const halfThickness = thickness(point) * 0.5;
      const relief = veinField(point).relief;
      positions.push(point.x, point.y, side === 'top'
        ? middle + halfThickness - relief * 0.42
        : middle - halfThickness - relief * 0.8);
    }
  }
  const sideOffset = planar.points.length;
  for (const [a, b, c] of planar.triangles) {
    indices.push(a, b, c, sideOffset + a, sideOffset + c, sideOffset + b);
  }
  for (let index = 0; index < planar.boundary.length; index += 1) {
    const a = planar.boundary[index];
    const b = planar.boundary[(index + 1) % planar.boundary.length];
    indices.push(a, sideOffset + a, b, b, sideOffset + a, sideOffset + b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function pointOnStem(stem: PlantStemInstance, t: number) {
  const curve = new THREE.CatmullRomCurve3(stem.curvePoints.map((point) => point.clone()));
  return { position: curve.getPointAt(t), tangent: curve.getTangentAt(t).normalize() };
}

function radialForStem(stem: PlantStemInstance, angle: number) {
  const terminal = stem.curvePoints[stem.curvePoints.length - 1];
  const radial = new THREE.Vector3(terminal.x, 0, terminal.z);
  if (radial.lengthSq() < 0.0001) radial.set(Math.cos(angle), 0, Math.sin(angle));
  radial.normalize().applyAxisAngle(worldUp, angle);
  return radial;
}

function orientLeaf(mesh: THREE.Object3D, position: THREE.Vector3, axisInput: THREE.Vector3, normalInput: THREE.Vector3) {
  const axis = axisInput.clone().normalize();
  const normal = normalInput.clone().addScaledVector(axis, -normalInput.dot(axis));
  if (normal.lengthSq() < 0.0001) normal.copy(worldForward).addScaledVector(axis, -worldForward.dot(axis));
  normal.normalize();
  const right = new THREE.Vector3().crossVectors(axis, normal).normalize();
  normal.crossVectors(right, axis).normalize();
  mesh.position.copy(position);
  mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, axis, normal));
}

function materialForPalette(palette: readonly string[], offset: number) {
  return new THREE.MeshStandardMaterial({
    color: palette[offset % palette.length] ?? '#66854f',
    roughness: 0.88,
    metalness: 0,
    side: THREE.DoubleSide
  });
}

function recordLeaf(mesh: THREE.Object3D, stem: PlantStemInstance, index: number, node: THREE.Vector3, stage: number, color: string): LeafInstanceRecord {
  mesh.updateMatrix();
  return {
    leafId: `${stem.stemId}:confirmed-leaf:${index}`,
    stemId: stem.stemId,
    foliageProfile: stem.foliageProfile,
    leafArrangement: stem.leafArrangement,
    nodeIndex: index,
    nodePosition: node.toArray() as [number, number, number],
    growthStage: stage,
    matrix: mesh.matrix.toArray(),
    color
  };
}

export function buildConfirmedFoliage(options: {
  stems: readonly PlantStemInstance[];
  seed: string;
  palette: readonly string[];
  density: number;
  context?: ConfirmedFoliageContext;
}) : ConfirmedFoliageBuild {
  const group = new THREE.Group();
  group.name = 'confirmed-realistic-foliage';
  const leaves: LeafInstanceRecord[] = [];
  const context = options.context ?? 'bouquet';
  const strapMature = createConfirmedStrapGeometry('mature');
  const strapYoung = createConfirmedStrapGeometry('young');
  const palmate = createConfirmedPalmateGeometry();
  const eligible = options.stems.filter((stem) => stem.leafMode === 'attached' && stem.status === 'confirmed');
  let renderedLeafCount = 0;
  const maxLeaves = context === 'realistic-lab' ? 6 : Math.max(8, Math.round(14 * options.density));

  eligible.forEach((stem) => {
    if (renderedLeafCount >= maxLeaves) return;
    const rng = createRng(`${options.seed}:foliage-layout:${stem.stemId}`);
    const retain = context === 'realistic-lab' || rng.value() < Math.min(0.68, 0.24 + options.density * 0.28);
    if (!retain) return;

    if (stem.foliageProfile === STRAP_PROFILE) {
      const count = context === 'realistic-lab' ? 3 : 2;
      for (let index = 0; index < count && renderedLeafCount < maxLeaves; index += 1) {
        const age = index === count - 1 ? 'young' : 'mature';
        const nodeT = 0.045 + index * 0.018;
        const node = pointOnStem(stem, nodeT);
        const angle = (index - (count - 1) / 2) * 0.58 + rng.range(-0.12, 0.12);
        const radial = radialForStem(stem, angle);
        const axis = context === 'realistic-lab'
          ? new THREE.Vector3((index - 1) * 0.34, 0.94, index === 1 ? 0.02 : 0.08).normalize()
          : node.tangent.clone().multiplyScalar(index === 0 ? 0.82 : 0.9)
            .addScaledVector(radial, age === 'young' ? 0.18 : 0.42)
            .normalize();
        const normal = context === 'realistic-lab'
          ? new THREE.Vector3(0.02, 0.08, 1).normalize()
          : worldUp.clone().multiplyScalar(0.58).addScaledVector(radial, 0.42).normalize();
        const color = confirmedLeafPalette[(renderedLeafCount + index) % confirmedLeafPalette.length];
        const mesh = new THREE.Mesh(age === 'young' ? strapYoung : strapMature, materialForPalette(confirmedLeafPalette, renderedLeafCount + index));
        mesh.name = `${stem.plantMemberId}:strap:${index}`;
        mesh.scale.setScalar(context === 'realistic-lab' ? 0.19 : 0.105 * rng.range(0.88, 1.08));
        orientLeaf(mesh, node.position, axis, normal);
        group.add(mesh);
        leaves.push(recordLeaf(mesh, stem, index, node.position, age === 'young' ? 0.48 : 0.92, color));
        renderedLeafCount += 1;
      }
    }

    if (stem.foliageProfile === PALMATE_PROFILE && renderedLeafCount < maxLeaves) {
      const nodeT = context === 'realistic-lab' ? 0.22 : rng.range(0.18, 0.32);
      const node = pointOnStem(stem, nodeT);
      const radial = radialForStem(stem, rng.range(-0.4, 0.4));
      const axis = context === 'realistic-lab'
        ? new THREE.Vector3(0.72, 0.55, 0.06).normalize()
        : node.tangent.clone().multiplyScalar(0.36).addScaledVector(radial, 0.86).normalize();
      const normal = context === 'realistic-lab'
        ? new THREE.Vector3(0.02, 0.08, 1).normalize()
        : worldUp.clone().multiplyScalar(0.65).addScaledVector(radial, 0.35).normalize();
      const color = confirmedLeafPalette[renderedLeafCount % confirmedLeafPalette.length];
      const mesh = new THREE.Mesh(palmate, materialForPalette(confirmedLeafPalette, renderedLeafCount));
      mesh.name = `${stem.plantMemberId}:palmate-lobed`;
      mesh.scale.setScalar(context === 'realistic-lab' ? 0.17 : 0.096 * rng.range(0.9, 1.05));
      orientLeaf(mesh, node.position, axis, normal);
      group.add(mesh);
      leaves.push(recordLeaf(mesh, stem, 0, node.position, 0.88, color));
      renderedLeafCount += 1;
    }
  });

  group.userData.confirmedLeafCount = leaves.length;
  group.userData.profileIds = [...new Set(leaves.map((leaf) => leaf.foliageProfile))];
  return { object: group, leaves };
}
