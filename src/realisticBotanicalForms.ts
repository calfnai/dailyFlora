import * as THREE from 'three';
import { createRng } from './random';

export type BotanicalBuildOptions = {
  seed: string;
  palette: string[];
};

type BloomStage = 'bud' | 'half' | 'open';
type Segment = { start: THREE.Vector3; end: THREE.Vector3; radius: number };
type Bloom = {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  stage: BloomStage;
  scale: number;
  source: THREE.Vector3;
};

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const temp = new THREE.Object3D();

function colorAt(palette: string[], index: number, fallback = '#ffffff') {
  return new THREE.Color(palette[index % palette.length] || fallback);
}

function material(color: THREE.Color | string, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function petalGeometry(length: number, width: number, cup: number, reflex = 0, pointed = 0.25) {
  const positions: number[] = [];
  const rows = 7;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const taper = 1 - pointed * v ** 1.45;
    const halfWidth = Math.sin(v * Math.PI) ** 0.72 * width * taper;
    return new THREE.Vector3(
      u * halfWidth,
      v * length,
      Math.sin(v * Math.PI) * cup - reflex * v * v
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

function cylinderInstances(count: number, color: THREE.Color, radialSegments = 7, topRatio = 0.9) {
  return new THREE.InstancedMesh(
    new THREE.CylinderGeometry(topRatio, 1, 1, radialSegments, 1, false),
    material(color, 0.91),
    Math.max(1, count)
  );
}

function setCylinder(
  mesh: THREE.InstancedMesh,
  index: number,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color?: THREE.Color
) {
  const direction = end.clone().sub(start);
  temp.position.copy(start).add(end).multiplyScalar(0.5);
  temp.quaternion.setFromUnitVectors(up, direction.clone().normalize());
  temp.scale.set(radius, direction.length(), radius);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
  if (color) mesh.setColorAt(index, color);
}

function setVolume(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  color: THREE.Color,
  axis = up,
  roll = 0
) {
  temp.position.copy(position);
  temp.quaternion.setFromUnitVectors(up, axis.clone().normalize());
  temp.rotateY(roll);
  temp.scale.copy(scale);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
  mesh.setColorAt(index, color);
}

function setPlanar(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  scale: THREE.Vector3,
  color: THREE.Color,
  faceNormal: THREE.Vector3,
  angle: number
) {
  temp.position.copy(position);
  temp.quaternion.setFromUnitVectors(forward, faceNormal.clone().normalize());
  temp.rotateZ(angle);
  temp.scale.copy(scale);
  temp.updateMatrix();
  mesh.setMatrixAt(index, temp.matrix);
  mesh.setColorAt(index, color);
}

function finish(mesh: THREE.InstancedMesh, used: number) {
  mesh.count = used;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

function stemAlong(points: THREE.Vector3[], radius: number, color: THREE.Color, segments = 20) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, segments, radius, 7, false),
    material(color, 0.93)
  );
  return { curve, mesh };
}

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function stageBottomUp(progress: number): BloomStage {
  if (progress > 0.83) return 'bud';
  if (progress > 0.67) return 'half';
  return 'open';
}

function addSegmentMesh(group: THREE.Group, segments: Segment[], color: THREE.Color) {
  const mesh = cylinderInstances(segments.length, color, 6, 0.82);
  segments.forEach((segment, index) => setCylinder(mesh, index, segment.start, segment.end, segment.radius));
  finish(mesh, segments.length);
  group.add(mesh);
}

function assertBloomConnections(species: string, blooms: Bloom[], segments: Segment[]) {
  const missing = blooms.filter((bloom) => !segments.some((segment) => segment.end.distanceToSquared(bloom.position) < 1e-8));
  if (missing.length) throw new Error(`${species} has ${missing.length} blooms without terminal pedicels.`);
  const stageCounts = blooms.reduce<Record<BloomStage, number>>(
    (counts, bloom) => ({ ...counts, [bloom.stage]: counts[bloom.stage] + 1 }),
    { bud: 0, half: 0, open: 0 }
  );
  if (!stageCounts.bud || !stageCounts.half || !stageCounts.open) {
    throw new Error(`${species} must include bud, half-open, and open stages.`);
  }
  return stageCounts;
}

export function createDelphinium(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:delphinium-v2`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#55734e');
  const axis = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.015, -0.55, -0.01),
    new THREE.Vector3(-0.035, 0.1, 0.02),
    new THREE.Vector3(0.045, 0.65, -0.02),
    new THREE.Vector3(0.015, 1.16, 0.015)
  ], 0.022, green, 24);
  group.add(axis.mesh);

  const count = 19;
  const pedicels = cylinderInstances(count, green, 7, 0.84);
  const sepals = new THREE.InstancedMesh(
    petalGeometry(0.25, 0.105, 0.035, 0.008, 0.22),
    material(colorAt(options.palette, 0), 0.82),
    count * 5
  );
  const innerPetals = new THREE.InstancedMesh(
    petalGeometry(0.13, 0.055, 0.03, 0.006, 0.18),
    material(colorAt(options.palette, 1), 0.8),
    count * 4
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.055, 9, 7),
    material(colorAt(options.palette, 2), 0.9),
    count
  );
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.09, 10, 8),
    material(colorAt(options.palette, 0), 0.86),
    count
  );
  const spurs = cylinderInstances(count, colorAt(options.palette, 0), 7, 0.16);

  let sepalUsed = 0;
  let innerUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  let spurUsed = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1);
    const t = 0.28 + progress * 0.68;
    const axisPoint = axis.curve.getPoint(t);
    const angle = i * 2.24 + rng.range(-0.22, 0.22);
    const radial = new THREE.Vector3(Math.cos(angle), rng.range(-0.05, 0.08), Math.sin(angle)).normalize();
    const stage = stageBottomUp(progress);
    const reach = stage === 'bud' ? 0.09 : rng.range(0.15, 0.22) * (1 - progress * 0.16);
    const bloom = axisPoint.clone().addScaledVector(radial, reach);
    setCylinder(pedicels, i, axisPoint, bloom, stage === 'bud' ? 0.006 : 0.009);

    if (stage === 'bud') {
      setVolume(
        buds,
        budUsed,
        bloom,
        new THREE.Vector3(0.72, 1.08, 0.8).multiplyScalar(0.72 + (1 - progress) * 0.18),
        colorAt(options.palette, i).clone().lerp(new THREE.Color('#6c79c8'), 0.2),
        radial
      );
      const spurEnd = bloom.clone().addScaledVector(radial, -0.1).add(new THREE.Vector3(0, 0.04, 0));
      setCylinder(spurs, spurUsed, bloom.clone().addScaledVector(radial, -0.015), spurEnd, 0.018);
      budUsed += 1;
      spurUsed += 1;
      continue;
    }

    const openness = stage === 'half' ? 0.66 : 1;
    const centerColor = colorAt(options.palette, 2).clone().lerp(new THREE.Color('#263d8f'), 0.34);
    setVolume(centers, centerUsed, bloom.clone().addScaledVector(radial, 0.018), new THREE.Vector3(0.82, 0.82, 0.55).multiplyScalar(openness), centerColor, radial);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      const pa = p / 5 * Math.PI * 2 + (p === 0 ? 0.14 : rng.range(-0.05, 0.05));
      const scale = openness * (p === 0 ? 1.04 : rng.range(0.9, 1.05));
      setPlanar(
        sepals,
        sepalUsed,
        bloom,
        new THREE.Vector3(scale, scale, 1),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.1)),
        radial,
        pa
      );
      sepalUsed += 1;
    }
    for (let p = 0; p < 4; p += 1) {
      const pa = Math.PI * (0.16 + p * 0.22);
      setPlanar(
        innerPetals,
        innerUsed,
        bloom.clone().addScaledVector(radial, 0.025),
        new THREE.Vector3(openness * (p < 2 ? 0.92 : 0.72), openness, 1),
        p < 2 ? centerColor : colorAt(options.palette, 1).clone().lerp(new THREE.Color('#ffffff'), 0.24),
        radial,
        pa
      );
      innerUsed += 1;
    }
    const upperInPlane = tangentFrame(radial).bitangent;
    const spurBase = bloom.clone().addScaledVector(radial, -0.015).addScaledVector(upperInPlane, 0.075 * openness);
    const spurEnd = spurBase.clone().addScaledVector(radial, -0.24 * openness).addScaledVector(upperInPlane, 0.055);
    setCylinder(spurs, spurUsed, spurBase, spurEnd, 0.024 * openness);
    spurUsed += 1;
  }
  finish(pedicels, count);
  finish(sepals, sepalUsed);
  finish(innerPetals, innerUsed);
  finish(centers, centerUsed);
  finish(buds, budUsed);
  finish(spurs, spurUsed);
  group.add(pedicels, sepals, innerPetals, centers, buds, spurs);
  return group;
}

export function createSnapdragon(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:snapdragon-v2`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#5b7d4e');
  const axis = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(-0.02, -0.45, 0.015),
    new THREE.Vector3(0.025, 0.25, -0.02),
    new THREE.Vector3(-0.015, 1.12, 0.01)
  ], 0.015, green, 23);
  group.add(axis.mesh);
  const count = 13 + Math.floor(rng.range(0, 6));
  const pedicels = cylinderInstances(count, green, 7, 0.86);
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.095, 0.036, 1, 12, 2, false),
    material(colorAt(options.palette, 0), 0.78),
    count
  );
  const upperLips = new THREE.InstancedMesh(
    petalGeometry(0.17, 0.085, 0.045, -0.012, 0.12),
    material(colorAt(options.palette, 0), 0.78),
    count * 2
  );
  const lowerLips = new THREE.InstancedMesh(
    petalGeometry(0.16, 0.075, 0.055, 0.018, 0.08),
    material(colorAt(options.palette, 1), 0.78),
    count * 3
  );
  const calyx = new THREE.InstancedMesh(
    petalGeometry(0.095, 0.03, 0.012, 0, 0.62),
    material(green, 0.9),
    count * 5
  );
  const throats = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.08, 10, 8),
    material(colorAt(options.palette, 2), 0.8),
    count
  );
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.1, 10, 8),
    material(colorAt(options.palette, 0), 0.82),
    count
  );
  let tubeUsed = 0;
  let upperUsed = 0;
  let lowerUsed = 0;
  let calyxUsed = 0;
  let throatUsed = 0;
  let budUsed = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1);
    const axisPoint = axis.curve.getPoint(0.28 + progress * 0.68);
    const angle = (i % 2) * Math.PI + (Math.floor(i / 2) % 2 ? 0.32 : -0.28) + rng.range(-0.12, 0.12);
    const face = new THREE.Vector3(Math.cos(angle), rng.range(-0.02, 0.08), Math.sin(angle)).normalize();
    const stage = stageBottomUp(progress);
    const base = axisPoint.clone().addScaledVector(face, stage === 'bud' ? 0.075 : 0.12);
    setCylinder(pedicels, i, axisPoint, base, stage === 'bud' ? 0.0038 : 0.0054);
    for (let s = 0; s < 5; s += 1) {
      setPlanar(calyx, calyxUsed, base, new THREE.Vector3(0.76, 0.82, 1), green.clone().lerp(new THREE.Color('#8e9c55'), 0.12), face, s / 5 * Math.PI * 2);
      calyxUsed += 1;
    }
    if (stage === 'bud') {
      setVolume(buds, budUsed, base.clone().addScaledVector(face, 0.07), new THREE.Vector3(0.72, 1.14, 0.8).multiplyScalar(0.78), colorAt(options.palette, i), face);
      budUsed += 1;
      continue;
    }
    const openness = stage === 'half' ? 0.7 : 1;
    const mouth = base.clone().addScaledVector(face, 0.2 * openness);
    setCylinder(tubes, tubeUsed, base, mouth, openness, colorAt(options.palette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.08)));
    tubeUsed += 1;
    setVolume(
      throats,
      throatUsed,
      mouth.clone().addScaledVector(face, 0.012),
      new THREE.Vector3(1.18, 0.68, 0.78).multiplyScalar(openness),
      colorAt(options.palette, 2).clone().lerp(colorAt(options.palette, 1), 0.38),
      face
    );
    throatUsed += 1;
    for (const angleOffset of [-0.34, 0.34]) {
      setPlanar(upperLips, upperUsed, mouth, new THREE.Vector3(openness, openness, 1), colorAt(options.palette, 0).clone().lerp(new THREE.Color('#ffffff'), 0.08), face, angleOffset);
      upperUsed += 1;
    }
    for (const angleOffset of [Math.PI - 0.55, Math.PI, Math.PI + 0.55]) {
      const middle = Math.abs(angleOffset - Math.PI) < 0.01;
      setPlanar(lowerLips, lowerUsed, mouth.clone().addScaledVector(face, middle ? 0.018 : 0), new THREE.Vector3(openness * (middle ? 1.25 : 0.9), openness, 1), colorAt(options.palette, middle ? 2 : 1), face, angleOffset);
      lowerUsed += 1;
    }
  }
  finish(pedicels, count);
  finish(tubes, tubeUsed);
  finish(upperLips, upperUsed);
  finish(lowerLips, lowerUsed);
  finish(calyx, calyxUsed);
  finish(throats, throatUsed);
  finish(buds, budUsed);
  group.add(pedicels, tubes, upperLips, lowerLips, calyx, throats, buds);
  return group;
}

export function createHyacinth(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:hyacinth-v2`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#55764e');
  const axis = stemAlong([
    new THREE.Vector3(0, -1.15, 0),
    new THREE.Vector3(-0.01, -0.45, 0.01),
    new THREE.Vector3(0.018, 0.25, -0.01),
    new THREE.Vector3(0, 0.82, 0)
  ], 0.018, green, 18);
  group.add(axis.mesh);
  const count = 18 + Math.floor(rng.range(0, 12));
  const pedicels = cylinderInstances(count, green, 7, 0.88);
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.064, 0.026, 1, 12, 2, false),
    material(colorAt(options.palette, 0), 0.76),
    count
  );
  const lobes = new THREE.InstancedMesh(
    petalGeometry(0.13, 0.036, 0.022, 0.1, 0.4),
    material(colorAt(options.palette, 1), 0.76),
    count * 6
  );
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.085, 10, 8),
    material(colorAt(options.palette, 0), 0.8),
    count
  );
  let tubeUsed = 0;
  let lobeUsed = 0;
  let budUsed = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1);
    const t = 0.24 + progress * 0.69;
    const axisPoint = axis.curve.getPoint(t);
    const angle = i * 2.39996 + rng.range(-0.11, 0.11);
    const face = new THREE.Vector3(Math.cos(angle), rng.range(-0.04, 0.08), Math.sin(angle)).normalize();
    const stage: BloomStage = progress > 0.82 ? 'bud' : progress > 0.67 ? 'half' : 'open';
    const base = axisPoint.clone().addScaledVector(face, 0.075);
    setCylinder(pedicels, i, axisPoint, base, 0.0042);
    if (stage === 'bud') {
      setVolume(buds, budUsed, base.clone().addScaledVector(face, 0.055), new THREE.Vector3(0.72, 1.12, 0.72), colorAt(options.palette, i), face);
      budUsed += 1;
      continue;
    }
    const openness = stage === 'half' ? 0.68 : 1;
    const mouth = base.clone().addScaledVector(face, 0.17 * openness);
    setCylinder(tubes, tubeUsed, base, mouth, openness, colorAt(options.palette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.09)));
    tubeUsed += 1;
    for (let p = 0; p < 6; p += 1) {
      setPlanar(lobes, lobeUsed, mouth, new THREE.Vector3(openness, openness, 1), colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.12)), face, p / 6 * Math.PI * 2);
      lobeUsed += 1;
    }
  }
  finish(pedicels, count);
  finish(tubes, tubeUsed);
  finish(lobes, lobeUsed);
  finish(buds, budUsed);
  group.add(pedicels, tubes, lobes, buds);
  return group;
}

type FoxtailLilyMeshes = {
  tepals: THREE.InstancedMesh;
  ovaries: THREE.InstancedMesh;
  stamens: THREE.InstancedMesh;
  anthers: THREE.InstancedMesh;
  buds: THREE.InstancedMesh;
};

type FoxtailLilyCounters = {
  tepal: number;
  ovary: number;
  stamen: number;
  anther: number;
  bud: number;
};

type FoxtailStamenProfile = 'full' | 'reduced' | 'minimal';

function createFoxtailLilyFlower(
  meshes: FoxtailLilyMeshes,
  counters: FoxtailLilyCounters,
  position: THREE.Vector3,
  face: THREE.Vector3,
  size: number,
  openness: number,
  stamenProfile: FoxtailStamenProfile,
  palette: string[],
  rng: ReturnType<typeof createRng>
) {
  const { tangent, bitangent } = tangentFrame(face);
  const flowerScale = size * (0.92 + openness * 0.08);
  const stamenCount = stamenProfile === 'full' ? 6 : stamenProfile === 'reduced' ? 3 : 2;
  const stamenLength = stamenProfile === 'full' ? 0.94 : stamenProfile === 'reduced' ? 0.56 : 0.42;
  const stamenSpread = stamenProfile === 'full' ? 0.94 : stamenProfile === 'reduced' ? 0.58 : 0.44;
  for (let p = 0; p < 6; p += 1) {
    const angle = p / 6 * Math.PI * 2;
    setPlanar(
      meshes.tepals,
      counters.tepal,
      position,
      new THREE.Vector3(flowerScale * openness, flowerScale * openness, 1),
      colorAt(palette, p % 2).clone().lerp(new THREE.Color('#fff2d4'), rng.range(0.025, 0.11)),
      face,
      angle
    );
    counters.tepal += 1;

    // Stamens follow the individual flower axis. They do not form a global horizontal ring.
    if (p < stamenCount) {
      const lateral = tangent.clone().multiplyScalar(Math.cos(angle) * 0.018 * size)
        .addScaledVector(bitangent, Math.sin(angle) * 0.018 * size);
      const start = position.clone().add(lateral).addScaledVector(face, 0.018 * size);
      const end = start.clone().addScaledVector(face, 0.052 * size * stamenLength)
        .addScaledVector(lateral, stamenSpread * 0.1);
      setCylinder(meshes.stamens, counters.stamen, start, end, 0.0022 * size);
      setVolume(
        meshes.anthers,
        counters.anther,
        end,
        new THREE.Vector3(0.62, 1.05, 0.62).multiplyScalar(size),
        colorAt(palette, 2).clone().lerp(new THREE.Color('#9f6d35'), 0.16),
        face
      );
      counters.stamen += 1;
      counters.anther += 1;
    }
  }
  setVolume(
    meshes.ovaries,
    counters.ovary,
    position.clone().addScaledVector(face, 0.016),
    new THREE.Vector3(0.78, 1.02, 0.78).multiplyScalar(0.9 * size),
    colorAt(palette, 2).clone().lerp(new THREE.Color('#70905b'), 0.28),
    face
  );
  counters.ovary += 1;
}

function createFoxtailLilyBud(
  mesh: THREE.InstancedMesh,
  index: number,
  position: THREE.Vector3,
  face: THREE.Vector3,
  scale: number,
  color: THREE.Color
) {
  setVolume(mesh, index, position, new THREE.Vector3(0.72, 1.12, 0.72).multiplyScalar(scale), color, face);
}

export function createFoxtailLily(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:foxtail-approved-v4`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#607d4e');
  const axisPoint = (y: number) => {
    const t = (y + 1.55) / 3.1;
    return new THREE.Vector3(Math.sin(t * Math.PI * 1.35) * 0.018, y, Math.sin(t * Math.PI * 1.05 + 0.8) * 0.012);
  };
  const axis = stemAlong([
    new THREE.Vector3(0, -2.02, 0), axisPoint(-0.7), axisPoint(0.22), axisPoint(1.06), new THREE.Vector3(0.006, 1.55, -0.002)
  ], 0.022, green, 32);
  group.add(axis.mesh);

  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const meshes: FoxtailLilyMeshes = {
    tepals: new THREE.InstancedMesh(
      petalGeometry(0.15, 0.062, 0.018, 0.004, 0.3),
      material(colorAt(options.palette, 0), 0.8),
      (15 + 24) * 6
    ),
    ovaries: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.028, 8, 6),
      material(colorAt(options.palette, 2), 0.88),
      15 + 24
    ),
    stamens: cylinderInstances(15 * 6, colorAt(options.palette, 2), 6, 0.84),
    anthers: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.014, 7, 5),
      material(colorAt(options.palette, 2), 0.88),
      15 * 6
    ),
    buds: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.058, 9, 7),
      material(colorAt(options.palette, 0), 0.84),
      24
    )
  };
  const counters: FoxtailLilyCounters = { tepal: 0, ovary: 0, stamen: 0, anther: 0, bud: 0 };

  const attach = (y: number, angle: number, radius: number, size: number, stage: BloomStage, stamenProfile: FoxtailStamenProfile = 'full', openness = 1) => {
    const source = axisPoint(y);
    const upward = stage === 'bud' ? 0.38 : stage === 'half' ? 0.2 : 0.27;
    const face = new THREE.Vector3(Math.cos(angle), upward + rng.range(-0.025, 0.035), Math.sin(angle)).normalize();
    const position = source.clone().addScaledVector(face, radius);
    segments.push({ start: source, end: position, radius: stage === 'open' ? 0.0054 : stage === 'half' ? 0.0043 : 0.0035 });
    blooms.push({ position, normal: face, stage, scale: size, source });
    if (stage === 'bud') {
      createFoxtailLilyBud(meshes.buds, counters.bud, position, face, size, colorAt(options.palette, counters.bud).lerp(new THREE.Color('#7b914f'), 0.14));
      counters.bud += 1;
      return;
    }
    createFoxtailLilyFlower(meshes, counters, position, face, size, openness, stamenProfile, options.palette, rng);
  };

  const frontAngles = [-0.18, 0.16, -0.46, 0.42, -0.72, 0.66, -0.05, 0.28, -0.34, 0.52, -0.62, 0.08, -0.22, 0.38, -0.5];
  for (let i = 0; i < 15; i += 1) {
    const progress = i / 14;
    const sideAmount = Math.abs(frontAngles[i]);
    const profile: FoxtailStamenProfile = sideAmount > 0.5 ? 'minimal' : sideAmount > 0.32 ? 'reduced' : 'full';
    attach(-0.84 + progress * 1.17 + rng.range(-0.025, 0.025), Math.PI / 2 + frontAngles[i] * 0.78, (0.262 - progress * 0.078 + rng.range(-0.009, 0.009)) * (i % 3 === 0 ? 0.87 : 0.92), rng.range(0.68, 0.78) + progress * 0.035, 'open', profile);
  }
  for (let i = 0; i < 24; i += 1) {
    const progress = i / 23;
    attach(-0.6 + progress * 1.72 + rng.range(-0.034, 0.034), i * 2.39996 + rng.range(-0.16, 0.16), (0.204 - progress * 0.096 + rng.range(-0.008, 0.008)) * (i % 4 === 0 || i % 7 === 0 ? 0.86 : 0.94), rng.range(0.76, 0.9) - progress * 0.05, 'half', 'minimal', 0.78 - progress * 0.32 + rng.range(-0.04, 0.04));
  }
  for (let i = 0; i < 24; i += 1) {
    const progress = i / 23;
    attach(0.72 + progress * 0.8 + rng.range(-0.018, 0.018), i * 2.19 + rng.range(-0.12, 0.12), Math.max(0.025, 0.09 - progress * 0.055 + rng.range(-0.006, 0.006)), 0.72 - progress * 0.25, 'bud');
  }

  group.userData.botanicalAudit = {
    species: 'Eremurus',
    connectedBlooms: blooms.length,
    stages: assertBloomConnections('Foxtail Lily', blooms, segments)
  };
  addSegmentMesh(group, segments, green);
  finish(meshes.tepals, counters.tepal);
  finish(meshes.ovaries, counters.ovary);
  finish(meshes.stamens, counters.stamen);
  finish(meshes.anthers, counters.anther);
  finish(meshes.buds, counters.bud);
  group.add(meshes.tepals, meshes.ovaries, meshes.stamens, meshes.anthers, meshes.buds);
  return group;
}

export function createLiatris(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:liatris-v2`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#55734d');
  const axis = stemAlong([
    new THREE.Vector3(0, -1.22, 0),
    new THREE.Vector3(-0.01, -0.4, 0.008),
    new THREE.Vector3(0.015, 0.42, -0.01),
    new THREE.Vector3(0, 1.18, 0)
  ], 0.012, green, 24);
  group.add(axis.mesh);
  const headCount = 24 + Math.floor(rng.range(0, 11));
  const floretsPerHead = 4;
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.008, 0.012, 1, 7, 1, false),
    material(colorAt(options.palette, 0), 0.8),
    headCount * floretsPerHead
  );
  const styles = cylinderInstances(headCount * floretsPerHead, colorAt(options.palette, 2), 5, 0.72);
  const styleForks = cylinderInstances(headCount * floretsPerHead * 2, colorAt(options.palette, 2), 5, 0.65);
  const budHeads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.042, 9, 7),
    material(colorAt(options.palette, 1), 0.86),
    headCount
  );
  const bracts = new THREE.InstancedMesh(
    petalGeometry(0.052, 0.012, 0.004, 0, 0.72),
    material(green, 0.9),
    headCount * 7
  );
  let tubeUsed = 0;
  let styleUsed = 0;
  let forkUsed = 0;
  let budUsed = 0;
  let bractUsed = 0;
  for (let i = 0; i < headCount; i += 1) {
    const progress = i / (headCount - 1);
    const axisPoint = axis.curve.getPoint(0.25 + progress * 0.71);
    const angle = i * 2.39996 + rng.range(-0.09, 0.09);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const head = axisPoint.clone().addScaledVector(radial, 0.026);
    const stage: BloomStage = progress > 0.58 ? 'open' : progress > 0.43 ? 'half' : 'bud';
    for (let b = 0; b < 7; b += 1) {
      setPlanar(bracts, bractUsed, head, new THREE.Vector3(0.72, 0.72, 1), green.clone().lerp(colorAt(options.palette, 1), 0.2), radial, b / 7 * Math.PI * 2);
      bractUsed += 1;
    }
    if (stage === 'bud') {
      setVolume(budHeads, budUsed, head, new THREE.Vector3(0.82, 1.06, 0.82), colorAt(options.palette, 1).clone().lerp(new THREE.Color('#70459c'), 0.16), radial);
      budUsed += 1;
      continue;
    }
    const openness = stage === 'half' ? 0.67 : 1;
    const { tangent, bitangent } = tangentFrame(radial);
    for (let f = 0; f < floretsPerHead; f += 1) {
      const fa = f / floretsPerHead * Math.PI * 2;
      const offset = tangent.clone().multiplyScalar(Math.cos(fa) * 0.018).addScaledVector(bitangent, Math.sin(fa) * 0.018);
      const direction = radial.clone().multiplyScalar(0.48).addScaledVector(offset, 2.2).add(new THREE.Vector3(0, 0.22, 0)).normalize();
      const start = head.clone().add(offset.multiplyScalar(0.66));
      const tubeEnd = start.clone().addScaledVector(direction, 0.052 * openness);
      setCylinder(tubes, tubeUsed, start, tubeEnd, openness, colorAt(options.palette, f).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.07)));
      const styleEnd = tubeEnd.clone().addScaledVector(direction, 0.035 * openness);
      setCylinder(styles, styleUsed, tubeEnd, styleEnd, 0.0018);
      const forkSide = tangent.clone().multiplyScalar(0.006 * openness);
      setCylinder(styleForks, forkUsed, styleEnd, styleEnd.clone().addScaledVector(direction, 0.012 * openness).add(forkSide), 0.0013);
      setCylinder(styleForks, forkUsed + 1, styleEnd, styleEnd.clone().addScaledVector(direction, 0.012 * openness).sub(forkSide), 0.0013);
      tubeUsed += 1;
      styleUsed += 1;
      forkUsed += 2;
    }
  }
  finish(tubes, tubeUsed);
  finish(styles, styleUsed);
  finish(styleForks, forkUsed);
  finish(budHeads, budUsed);
  finish(bracts, bractUsed);
  group.add(tubes, styles, styleForks, budHeads, bracts);
  return group;
}

export function createHydrangea(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:hydrangea-restored-v1`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#5d7f54');
  const cloudCenter = new THREE.Vector3(0, 0.4, 0);
  const supportHub = new THREE.Vector3(0, 0.04, 0);
  const stem = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.025, -0.72, 0.015),
    new THREE.Vector3(0.035, -0.28, -0.02),
    supportHub
  ], 0.028, green, 16);
  group.add(stem.mesh);

  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const supportHubs: THREE.Vector3[] = [];
  for (let i = 0; i < 9; i += 1) {
    const angle = i / 9 * Math.PI * 2;
    const inner = cloudCenter.clone().add(new THREE.Vector3(
      Math.cos(angle) * 0.27,
      -0.09 + (i % 3) * 0.12,
      Math.sin(angle) * 0.25
    ));
    supportHubs.push(inner);
    segments.push({ start: supportHub, end: inner, radius: 0.0068 });
  }

  const flowerCount = 104;
  for (let i = 0; i < flowerCount; i += 1) {
    // Restored from the 0b3655c cap distribution: a mophead dome, not a full sphere.
    const yNorm = 0.98 - (i / (flowerCount - 1)) * 1.38;
    const angle = i * 2.39996 + rng.range(-0.075, 0.075);
    const ring = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
    const normal = new THREE.Vector3(Math.cos(angle) * ring * 1.03, yNorm, Math.sin(angle) * ring * 0.96).normalize();
    const radius = rng.range(0.585, 0.645);
    const position = cloudCenter.clone().addScaledVector(normal, radius);
    const stage: BloomStage = i % 23 === 0 ? 'bud' : i % 17 === 0 ? 'half' : 'open';
    const scale = rng.range(0.94, 1.055) * (stage === 'bud' ? 0.72 : stage === 'half' ? 0.86 : 1);
    const source = supportHubs[i % supportHubs.length];
    blooms.push({ position, normal, stage, scale, source });
    const pedicelStart = position.clone().addScaledVector(normal, -0.09);
    segments.push({ start: source, end: pedicelStart, radius: 0.0032 });
    segments.push({ start: pedicelStart, end: position, radius: 0.0038 });
  }
  // One restrained crown bloom closes the axial opening visible only from top view.
  const crownNormal = new THREE.Vector3(0, 1, 0);
  const crownPosition = cloudCenter.clone().addScaledVector(crownNormal, 0.642);
  const crownPedicel = crownPosition.clone().addScaledVector(crownNormal, -0.09);
  blooms.push({ position: crownPosition, normal: crownNormal, stage: 'open', scale: 1.02, source: supportHubs[0] });
  segments.push({ start: supportHubs[0], end: crownPedicel, radius: 0.0032 });
  segments.push({ start: crownPedicel, end: crownPosition, radius: 0.0038 });

  group.userData.botanicalAudit = {
    species: 'Hydrangea macrophylla mophead',
    restoredFrom: '0b3655c cap distribution',
    connectedBlooms: blooms.length,
    stages: assertBloomConnections('Hydrangea', blooms, segments)
  };
  addSegmentMesh(group, segments, green);
  const sepals = new THREE.InstancedMesh(
    petalGeometry(0.15, 0.112, 0.014, 0.002, 0.08),
    material(colorAt(options.palette, 0), 0.82),
    blooms.length * 4
  );
  const softCenterColor = colorAt(options.palette, 1).clone().lerp(colorAt(options.palette, 0), 0.58);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 8, 6), material(softCenterColor, 0.9), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.046, 9, 7), material(colorAt(options.palette, 1), 0.86), blooms.length);
  let sepalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom, index) => {
    if (bloom.stage === 'bud') {
      setVolume(buds, budUsed, bloom.position, new THREE.Vector3(1, 1.08, 1).multiplyScalar(bloom.scale), colorAt(options.palette, 1).clone().lerp(colorAt(options.palette, 0), 0.45), bloom.normal);
      budUsed += 1;
    } else {
      setVolume(centers, centerUsed, bloom.position.clone().addScaledVector(bloom.normal, 0.009), new THREE.Vector3(0.92, 0.92, 0.62).multiplyScalar(bloom.scale), softCenterColor, bloom.normal);
      centerUsed += 1;
    }
    const openness = bloom.stage === 'bud' ? 0.52 : bloom.stage === 'half' ? 0.72 : 1;
    for (let p = 0; p < 4; p += 1) {
      setPlanar(
        sepals,
        sepalUsed,
        bloom.position,
        new THREE.Vector3(bloom.scale * openness * rng.range(0.97, 1.035), bloom.scale * openness * rng.range(0.96, 1.04), 1),
        colorAt(options.palette, p % 2).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.025, 0.105)),
        bloom.normal,
        p / 4 * Math.PI * 2 + rng.range(-0.045, 0.045)
      );
      sepalUsed += 1;
    }
  });
  finish(sepals, sepalUsed);
  finish(centers, centerUsed);
  finish(buds, budUsed);
  group.add(sepals, centers, buds);
  return group;
}

export function createBabysBreath(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:babys-breath-v2`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#617e56');
  const main = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.015, -0.55, -0.01),
    new THREE.Vector3(-0.035, 0.08, 0.025),
    new THREE.Vector3(0.04, 0.72, -0.02),
    new THREE.Vector3(0.01, 1.1, 0.01)
  ], 0.015, green, 20);
  group.add(main.mesh);
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const primaryCount = 28;
  for (let b = 0; b < primaryCount; b += 1) {
    const t = 0.25 + (b / (primaryCount - 1)) ** 0.92 * 0.68 + rng.range(-0.018, 0.018);
    const start = main.curve.getPoint(Math.min(0.95, t));
    const angle = b * 2.39996 + rng.range(-0.38, 0.38);
    const reach = rng.range(0.28, 0.58) * (1 - b * 0.025);
    const lift = rng.range(0.18, 0.42) * (0.86 + b * 0.018);
    const elbow = start.clone().add(new THREE.Vector3(Math.cos(angle) * reach * rng.range(0.38, 0.58), lift * 0.42, Math.sin(angle) * reach * rng.range(0.38, 0.58)));
    const primaryTip = start.clone().add(new THREE.Vector3(Math.cos(angle) * reach, lift, Math.sin(angle) * reach));
    segments.push({ start, end: elbow, radius: 0.0055 }, { start: elbow, end: primaryTip, radius: 0.0041 });
    const secondaryCount = 2 + Math.floor(rng.range(0, 2.99));
    for (let s = 0; s < secondaryCount; s += 1) {
      const along = rng.range(0.28, 0.82);
      const secondaryStart = elbow.clone().lerp(primaryTip, along);
      const side = s % 2 ? 1 : -1;
      const sa = angle + side * rng.range(0.42, 1.02);
      const secondaryReach = reach * rng.range(0.22, 0.46);
      const secondaryJoint = secondaryStart.clone().add(new THREE.Vector3(Math.cos(sa) * secondaryReach * 0.55, rng.range(0.06, 0.13), Math.sin(sa) * secondaryReach * 0.55));
      const terminal = secondaryStart.clone().add(new THREE.Vector3(Math.cos(sa) * secondaryReach, rng.range(0.12, 0.26), Math.sin(sa) * secondaryReach));
      segments.push({ start: secondaryStart, end: secondaryJoint, radius: 0.0033 }, { start: secondaryJoint, end: terminal, radius: 0.0024 });
      const terminalCount = 3 + Math.floor(rng.range(0, 4.99));
      for (let f = 0; f < terminalCount; f += 1) {
        const fa = sa + (f - (terminalCount - 1) / 2) * rng.range(0.45, 0.85);
        const pedicelLength = rng.range(0.055, 0.12);
        const position = terminal.clone().add(new THREE.Vector3(Math.cos(fa) * pedicelLength, rng.range(0.025, 0.085), Math.sin(fa) * pedicelLength));
        const normal = position.clone().sub(terminal).normalize();
        const roll = rng.value();
        const stage: BloomStage = roll < 0.22 ? 'bud' : roll < 0.4 ? 'half' : 'open';
        blooms.push({ position, normal, stage, scale: rng.range(0.68, 0.98), source: terminal });
        segments.push({ start: terminal, end: position, radius: 0.0019 });
      }
    }
  }
  group.userData.botanicalAudit = {
    species: 'Gypsophila paniculata',
    connectedBlooms: blooms.length,
    stages: assertBloomConnections("Baby's Breath", blooms, segments)
  };
  addSegmentMesh(group, segments, green);
  const petals = new THREE.InstancedMesh(
    petalGeometry(0.055, 0.021, 0.007, 0.002, 0.12),
    material(colorAt(options.palette, 0), 0.9),
    blooms.length * 5
  );
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 7, 5), material(colorAt(options.palette, 2), 0.94), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.03, 8, 6), material(colorAt(options.palette, 1), 0.9), blooms.length);
  let petalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom, index) => {
    if (bloom.stage === 'bud') {
      setVolume(buds, budUsed, bloom.position, new THREE.Vector3(0.8, 1.08, 0.8).multiplyScalar(bloom.scale), colorAt(options.palette, index + 1), bloom.normal);
      budUsed += 1;
      return;
    }
    const openness = bloom.stage === 'half' ? 0.62 : 1;
    setVolume(centers, centerUsed, bloom.position, new THREE.Vector3(1, 1, 0.72).multiplyScalar(bloom.scale), colorAt(options.palette, 2), bloom.normal);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      setPlanar(petals, petalUsed, bloom.position, new THREE.Vector3(bloom.scale * openness, bloom.scale * openness, 1), colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.1)), bloom.normal, p / 5 * Math.PI * 2 + rng.range(-0.06, 0.06));
      petalUsed += 1;
    }
  });
  finish(petals, petalUsed);
  finish(centers, centerUsed);
  finish(buds, budUsed);
  group.add(petals, centers, buds);
  return group;
}

type FrozenAmmiBloom = {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  scale: number;
  bud: boolean;
};

function frozenAmmiAngles(count: number, rng: ReturnType<typeof createRng>) {
  const gaps = Array.from({ length: count }, (_, index) => {
    let gap = rng.range(0.58, 1.48);
    if (index === 5 || index === 23) gap *= 1.45;
    if (index === 11 || index === 12 || index === 29) gap *= 0.62;
    return gap;
  });
  const total = gaps.reduce((sum, gap) => sum + gap, 0);
  const angles: number[] = [];
  let angle = -2.82;
  gaps.forEach((gap) => {
    angle += gap / total * Math.PI * 2;
    angles.push(angle);
  });
  return angles;
}

function frozenAmmiShuffle<T>(values: T[], rng: ReturnType<typeof createRng>) {
  for (let i = values.length - 1; i > 0; i -= 1) {
    const swapIndex = Math.floor(rng.range(0, i + 1));
    [values[i], values[swapIndex]] = [values[swapIndex], values[i]];
  }
  return values;
}

function frozenAmmiPetalGeometry() {
  const positions: number[] = [];
  const rows = 5;
  const cols = 4;
  const length = 0.0105;
  const width = 0.0074;
  const cup = 0.00065;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    const shoulder = Math.sin(v * Math.PI * 0.72);
    return new THREE.Vector3(
      u * width * shoulder,
      v * length,
      Math.sin(v * Math.PI * 0.88) * cup
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

function frozenAmmiJunction(node: THREE.Vector3, green: THREE.Color) {
  const profile = [
    new THREE.Vector2(0.0135, -0.038),
    new THREE.Vector2(0.0155, -0.014),
    new THREE.Vector2(0.0162, 0.004),
    new THREE.Vector2(0.0125, 0.026),
    new THREE.Vector2(0.0065, 0.046)
  ];
  const junction = new THREE.Mesh(new THREE.LatheGeometry(profile, 9), material(green, 0.96));
  junction.position.copy(node);
  junction.rotation.y = 0.18;
  return junction;
}

function frozenAmmiSegments(segments: Segment[], color: THREE.Color, opacity: number, sides: number) {
  const mesh = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.76, 1, 1, sides, 1, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0, side: THREE.DoubleSide, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 }),
    segments.length
  );
  segments.forEach((segment, index) => setCylinder(mesh, index, segment.start, segment.end, segment.radius));
  finish(mesh, segments.length);
  return mesh;
}

function frozenAmmiFlowers(blooms: FrozenAmmiBloom[], rng: ReturnType<typeof createRng>, palette: string[]) {
  const detailed = new THREE.Group();
  const petalColor = colorAt(palette, 0, '#fffdf1');
  const warmColor = colorAt(palette, 1, '#f2ead4');
  const centerColor = colorAt(palette, 2, '#cab969');
  const petals = new THREE.InstancedMesh(frozenAmmiPetalGeometry(), material(petalColor, 0.96), blooms.length * 5);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.00215, 6, 4), material(centerColor, 0.96), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0048, 6, 4), material(warmColor, 0.96), blooms.length);
  let petalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom) => {
    if (bloom.bud) {
      setVolume(buds, budUsed, bloom.position, new THREE.Vector3(0.72, 1.08, 0.72).multiplyScalar(bloom.scale), warmColor, bloom.normal);
      budUsed += 1;
      return;
    }
    setVolume(centers, centerUsed, bloom.position.clone().addScaledVector(bloom.normal, 0.0017), new THREE.Vector3(1, 0.72, 1).multiplyScalar(bloom.scale), centerColor, bloom.normal);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      setPlanar(
        petals,
        petalUsed,
        bloom.position,
        new THREE.Vector3(bloom.scale, bloom.scale, 1),
        petalColor.clone().lerp(warmColor, rng.range(0, 0.12)),
        bloom.normal,
        p / 5 * Math.PI * 2 + rng.range(-0.04, 0.04)
      );
      petalUsed += 1;
    }
  });
  finish(petals, petalUsed);
  finish(centers, centerUsed);
  finish(buds, budUsed);
  detailed.add(petals, centers, buds);

  const simplified = new THREE.Group();
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0082, 5, 4), material(petalColor, 0.96), blooms.length);
  blooms.forEach((bloom, index) => {
    setVolume(
      dots,
      index,
      bloom.position,
      new THREE.Vector3(1, bloom.bud ? 1.2 : 0.65, 1).multiplyScalar(bloom.scale),
      bloom.bud ? warmColor : petalColor,
      bloom.normal
    );
  });
  finish(dots, blooms.length);
  simplified.add(dots);

  const lod = new THREE.LOD();
  lod.addLevel(detailed, 0);
  lod.addLevel(simplified, 1.32);
  return lod;
}

// Frozen after E-version visual approval. Do not change morphology without explicit owner unfreeze.
export function createLaceFlower(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:ammi-e-hierarchy-v1`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#527348');
  const bractGreen = green.clone().lerp(new THREE.Color('#7d976a'), 0.28);
  const node = new THREE.Vector3(0, 0.04, 0);
  const stem = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(-0.028, -0.66, 0.014),
    new THREE.Vector3(-0.012, -0.22, -0.006),
    node.clone().add(new THREE.Vector3(0, 0.034, 0))
  ], 0.0145, green, 24);
  group.add(stem.mesh, frozenAmmiJunction(node, green));

  const primaryCount = 38;
  const angles = frozenAmmiAngles(primaryCount, rng);
  const bands = frozenAmmiShuffle<Array<'center' | 'middle' | 'outer'>[number]>([
    ...Array.from({ length: 14 }, () => 'center' as const),
    ...Array.from({ length: 14 }, () => 'middle' as const),
    ...Array.from({ length: 10 }, () => 'outer' as const)
  ], rng);
  const primarySegments: Segment[] = [];
  const secondarySegments: Segment[] = [];
  const bractSegments: Segment[] = [];
  const blooms: FrozenAmmiBloom[] = [];

  angles.forEach((baseAngle, i) => {
    const angle = baseAngle + rng.range(-0.045, 0.045);
    const band = bands[i];
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const radius = band === 'center'
      ? rng.range(0.035, 0.28)
      : band === 'middle'
        ? rng.range(0.23, 0.52)
        : rng.range(0.48, 0.82);
    const start = node.clone()
      .addScaledVector(radial, rng.range(0.0015, 0.0065))
      .addScaledVector(tangent, rng.range(-0.004, 0.004))
      .add(new THREE.Vector3(0, rng.range(0.004, 0.022), 0));
    const miniHub = radial.clone().multiplyScalar(radius)
      .addScaledVector(tangent, rng.range(-0.055, 0.055));
    miniHub.y = 0.42 + (1 - radius / 0.82) * 0.092 + rng.range(-0.026, 0.034);
    const midpoint = start.clone().lerp(miniHub, rng.range(0.42, 0.58))
      .addScaledVector(tangent, rng.range(-0.035, 0.035))
      .add(new THREE.Vector3(0, rng.range(0.012, 0.05), 0));
    primarySegments.push(
      { start, end: midpoint, radius: rng.range(0.00082, 0.00135) },
      { start: midpoint, end: miniHub, radius: rng.range(0.0005, 0.00088) }
    );

    const count = band === 'center'
      ? Math.round(rng.range(22, 24))
      : band === 'middle'
        ? Math.round(rng.range(20, 24))
        : Math.round(rng.range(17, 22));
    const spread = band === 'center'
      ? rng.range(0.074, 0.094)
      : band === 'middle'
        ? rng.range(0.082, 0.104)
        : rng.range(0.09, 0.116);
    const clusterNormal = up.clone()
      .addScaledVector(radial, rng.range(0.03, 0.11))
      .addScaledVector(tangent, rng.range(-0.04, 0.04))
      .normalize();
    const frame = tangentFrame(clusterNormal);
    const clusterStretch = rng.range(0.84, 1.18);
    for (let f = 0; f < count; f += 1) {
      const floretAngle = rng.range(-Math.PI, Math.PI);
      const localRadius = spread * Math.sqrt(rng.range(0.012, 1));
      const offset = frame.tangent.clone().multiplyScalar(Math.cos(floretAngle) * localRadius * clusterStretch)
        .addScaledVector(frame.bitangent, Math.sin(floretAngle) * localRadius / clusterStretch);
      const bloom = miniHub.clone().add(offset);
      const dome = (1 - Math.min(1, localRadius / spread)) * rng.range(0.015, 0.034);
      bloom.y += dome + rng.range(-0.018, 0.022);
      const tiltAngle = rng.range(-Math.PI, Math.PI);
      const bloomNormal = clusterNormal.clone().multiplyScalar(rng.range(0.62, 0.9))
        .add(new THREE.Vector3(Math.cos(tiltAngle), rng.range(-0.05, 0.14), Math.sin(tiltAngle)).multiplyScalar(rng.range(0.12, 0.42)))
        .normalize();
      secondarySegments.push({ start: miniHub, end: bloom, radius: rng.range(0.00018, 0.00034) });
      blooms.push({
        position: bloom,
        normal: bloomNormal,
        scale: rng.range(0.72, 1.02),
        bud: f >= count - 2 && (i + f) % 7 === 0
      });
    }
  });

  const bractCount = 11;
  for (let b = 0; b < bractCount; b += 1) {
    const angle = b / bractCount * Math.PI * 2 + rng.range(-0.22, 0.22);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
    const length = rng.range(0.27, 0.47);
    const start = node.clone().addScaledVector(radial, rng.range(0.006, 0.016)).add(new THREE.Vector3(0, rng.range(-0.03, -0.012), 0));
    const fork = start.clone().addScaledVector(radial, length * rng.range(0.48, 0.64))
      .addScaledVector(tangent, rng.range(-0.035, 0.035))
      .add(new THREE.Vector3(0, rng.range(-0.055, 0.005), 0));
    const tip = start.clone().addScaledVector(radial, length)
      .addScaledVector(tangent, rng.range(-0.075, 0.075))
      .add(new THREE.Vector3(0, rng.range(-0.16, -0.04), 0));
    bractSegments.push(
      { start, end: fork, radius: rng.range(0.0013, 0.0019) },
      { start: fork, end: tip, radius: rng.range(0.00062, 0.001) }
    );
    const lobeCount = b % 3 === 0 ? 3 : 2;
    for (let l = 0; l < lobeCount; l += 1) {
      const lobeDirection = radial.clone().multiplyScalar(rng.range(0.08, 0.16))
        .addScaledVector(tangent, (l - (lobeCount - 1) / 2) * rng.range(0.05, 0.095))
        .add(new THREE.Vector3(0, rng.range(-0.065, 0.035), 0));
      bractSegments.push({ start: fork, end: fork.clone().add(lobeDirection), radius: rng.range(0.00045, 0.00072) });
    }
  }

  group.add(
    frozenAmmiSegments(primarySegments, green, 0.78, 6),
    frozenAmmiSegments(secondarySegments, green, 0.5, 5),
    frozenAmmiSegments(bractSegments, bractGreen, 0.9, 5),
    frozenAmmiFlowers(blooms, rng, options.palette)
  );
  group.userData.botanicalAudit = {
    species: 'Ammi majus',
    frozen: true,
    baseline: 'E',
    primaryRays: primaryCount,
    miniUmbels: primaryCount,
    flowersAndBuds: blooms.length,
    dividedBracts: bractCount,
    hierarchy: 'main stem → common node → primary rays → mini umbels → secondary pedicels → tiny florets'
  };
  return group;
}
