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
  ], 0.027, green, 23);
  group.add(axis.mesh);
  const count = 17;
  const pedicels = cylinderInstances(count, green, 7, 0.86);
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.12, 0.052, 1, 12, 2, false),
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
    setCylinder(pedicels, i, axisPoint, base, stage === 'bud' ? 0.0065 : 0.0095);
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
  ], 0.04, green, 18);
  group.add(axis.mesh);
  const count = 30;
  const pedicels = cylinderInstances(count, green, 7, 0.88);
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.085, 0.04, 1, 12, 2, false),
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
    setCylinder(pedicels, i, axisPoint, base, 0.008);
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

function createFoxtailLilyFlower(
  meshes: FoxtailLilyMeshes,
  counters: FoxtailLilyCounters,
  position: THREE.Vector3,
  face: THREE.Vector3,
  openness: number,
  palette: string[],
  rng: ReturnType<typeof createRng>
) {
  const { tangent, bitangent } = tangentFrame(face);
  const flowerScale = 0.92 + openness * 0.08;
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
    const lateral = tangent.clone().multiplyScalar(Math.cos(angle) * 0.018 * openness)
      .addScaledVector(bitangent, Math.sin(angle) * 0.018 * openness);
    const start = position.clone().add(lateral).addScaledVector(face, 0.018);
    const end = start.clone().addScaledVector(face, 0.064 * openness)
      .addScaledVector(lateral, 0.16);
    setCylinder(meshes.stamens, counters.stamen, start, end, 0.0028);
    setVolume(
      meshes.anthers,
      counters.anther,
      end,
      new THREE.Vector3(0.72, 1.2, 0.72).multiplyScalar(0.72 + openness * 0.28),
      colorAt(palette, 2).clone().lerp(new THREE.Color('#9f6d35'), 0.16),
      face
    );
    counters.stamen += 1;
    counters.anther += 1;
  }
  setVolume(
    meshes.ovaries,
    counters.ovary,
    position.clone().addScaledVector(face, 0.016),
    new THREE.Vector3(0.78, 1.02, 0.78).multiplyScalar(0.9),
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
  const rng = createRng(`${options.seed}:foxtail-rebuilt-v1`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#607d4e');
  const axis = stemAlong([
    new THREE.Vector3(0, -1.22, 0),
    new THREE.Vector3(0.008, -0.42, -0.006),
    new THREE.Vector3(-0.012, 0.38, 0.009),
    new THREE.Vector3(0.012, 1.22, -0.008)
  ], 0.025, green, 25);
  group.add(axis.mesh);

  const flowerCount = 21;
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const meshes: FoxtailLilyMeshes = {
    tepals: new THREE.InstancedMesh(
      petalGeometry(0.15, 0.062, 0.018, 0.004, 0.3),
      material(colorAt(options.palette, 0), 0.8),
      16 * 6
    ),
    ovaries: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.028, 8, 6),
      material(colorAt(options.palette, 2), 0.88),
      16
    ),
    stamens: cylinderInstances(16 * 6, colorAt(options.palette, 2), 6, 0.84),
    anthers: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.014, 7, 5),
      material(colorAt(options.palette, 2), 0.88),
      16 * 6
    ),
    buds: new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.058, 9, 7),
      material(colorAt(options.palette, 0), 0.84),
      5
    )
  };
  const counters: FoxtailLilyCounters = { tepal: 0, ovary: 0, stamen: 0, anther: 0, bud: 0 };

  for (let i = 0; i < flowerCount; i += 1) {
    const progress = i / (flowerCount - 1);
    const axisPoint = axis.curve.getPoint(0.27 + progress * 0.69);
    const angle = i * 2.39996 + rng.range(-0.12, 0.12);
    const face = new THREE.Vector3(Math.cos(angle), rng.range(0.055, 0.15), Math.sin(angle)).normalize();
    const stage: BloomStage = i < 12 ? 'open' : i < 16 ? 'half' : 'bud';
    const pedicelLength = stage === 'open'
      ? 0.155 - progress * 0.045
      : stage === 'half' ? 0.082 - (i - 12) * 0.007 : 0.045 - (i - 16) * 0.004;
    const position = axisPoint.clone().addScaledVector(face, pedicelLength);
    segments.push({ start: axisPoint, end: position, radius: stage === 'open' ? 0.0052 : stage === 'half' ? 0.0044 : 0.0038 });
    blooms.push({ position, normal: face, stage, scale: 1, source: axisPoint });
    if (stage === 'bud') {
      createFoxtailLilyBud(
        meshes.buds,
        counters.bud,
        position,
        face,
        0.82 - (i - 16) * 0.065,
        colorAt(options.palette, i).clone().lerp(new THREE.Color('#7b914f'), 0.12 + (i - 16) * 0.03)
      );
      counters.bud += 1;
    } else {
      createFoxtailLilyFlower(meshes, counters, position, face, stage === 'half' ? 0.58 : 1, options.palette, rng);
    }
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
  ], 0.023, green, 24);
  group.add(axis.mesh);
  const headCount = 34;
  const floretsPerHead = 6;
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.014, 0.022, 1, 7, 1, false),
    material(colorAt(options.palette, 0), 0.8),
    headCount * floretsPerHead
  );
  const styles = cylinderInstances(headCount * floretsPerHead, colorAt(options.palette, 2), 5, 0.72);
  const styleForks = cylinderInstances(headCount * floretsPerHead * 2, colorAt(options.palette, 2), 5, 0.65);
  const budHeads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.064, 9, 7),
    material(colorAt(options.palette, 1), 0.86),
    headCount
  );
  const bracts = new THREE.InstancedMesh(
    petalGeometry(0.075, 0.018, 0.006, 0, 0.72),
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
    const head = axisPoint.clone().addScaledVector(radial, 0.045);
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
      const offset = tangent.clone().multiplyScalar(Math.cos(fa) * 0.034).addScaledVector(bitangent, Math.sin(fa) * 0.034);
      const direction = radial.clone().addScaledVector(offset, 4.6).add(new THREE.Vector3(0, 0.12, 0)).normalize();
      const start = head.clone().add(offset.multiplyScalar(0.66));
      const tubeEnd = start.clone().addScaledVector(direction, 0.105 * openness);
      setCylinder(tubes, tubeUsed, start, tubeEnd, openness, colorAt(options.palette, f).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.07)));
      const styleEnd = tubeEnd.clone().addScaledVector(direction, 0.095 * openness);
      setCylinder(styles, styleUsed, tubeEnd, styleEnd, 0.0045);
      const forkSide = tangent.clone().multiplyScalar(0.018 * openness);
      setCylinder(styleForks, forkUsed, styleEnd, styleEnd.clone().addScaledVector(direction, 0.035 * openness).add(forkSide), 0.0032);
      setCylinder(styleForks, forkUsed + 1, styleEnd, styleEnd.clone().addScaledVector(direction, 0.035 * openness).sub(forkSide), 0.0032);
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
  const primaryCount = 10;
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
      const terminalCount = 1 + Math.floor(rng.range(0, 2.99));
      for (let f = 0; f < terminalCount; f += 1) {
        const fa = sa + (f - (terminalCount - 1) / 2) * rng.range(0.45, 0.85);
        const pedicelLength = rng.range(0.055, 0.12);
        const position = terminal.clone().add(new THREE.Vector3(Math.cos(fa) * pedicelLength, rng.range(0.025, 0.085), Math.sin(fa) * pedicelLength));
        const normal = position.clone().sub(terminal).normalize();
        const roll = rng.value();
        const stage: BloomStage = roll < 0.22 ? 'bud' : roll < 0.4 ? 'half' : 'open';
        blooms.push({ position, normal, stage, scale: rng.range(0.82, 1.12), source: terminal });
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

export function createLaceFlower(options: BotanicalBuildOptions) {
  const rng = createRng(`${options.seed}:ammi-majus-rebuilt-v1`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, 3, '#5e7d52');
  const hub = new THREE.Vector3(0, 0.22, 0);
  const stem = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.025, -0.65, 0.012),
    new THREE.Vector3(0.02, -0.12, -0.01),
    hub
  ], 0.018, green, 17);
  group.add(stem.mesh);
  const segments: Segment[] = [];
  const blooms: Bloom[] = [];
  const umbelCount = 15;
  const miniHubs: THREE.Vector3[] = [];
  for (let i = 0; i < umbelCount; i += 1) {
    const angle = i / umbelCount * Math.PI * 2 + rng.range(-0.12, 0.12);
    const radius = rng.range(0.47, 0.83) * (i % 5 === 0 ? 0.9 : 1);
    const normalizedRadius = (radius - 0.42) / 0.45;
    const miniHub = new THREE.Vector3(
      Math.cos(angle) * radius,
      hub.y + 0.13 + (1 - normalizedRadius) * 0.31 + rng.range(-0.055, 0.065),
      Math.sin(angle) * radius
    );
    miniHubs.push(miniHub);
    segments.push({ start: hub, end: miniHub, radius: 0.0054 });
    const floretCount = 5 + (i % 4);
    const clusterTilt = new THREE.Vector3(Math.cos(angle) * rng.range(0.08, 0.18), 1, Math.sin(angle) * rng.range(0.08, 0.18)).normalize();
    const { tangent, bitangent } = tangentFrame(clusterTilt);
    for (let f = 0; f < floretCount; f += 1) {
      const fa = f / floretCount * Math.PI * 2 + rng.range(-0.16, 0.16);
      const reach = rng.range(0.085, 0.14);
      const secondaryDirection = tangent.clone().multiplyScalar(Math.cos(fa))
        .addScaledVector(bitangent, Math.sin(fa))
        .addScaledVector(clusterTilt, rng.range(0.24, 0.48))
        .normalize();
      const position = miniHub.clone().addScaledVector(secondaryDirection, reach);
      const stage: BloomStage = f === 0 && i % 5 === 0 ? 'bud' : f === 1 && i % 4 === 0 ? 'half' : 'open';
      blooms.push({ position, normal: clusterTilt, stage, scale: rng.range(0.9, 1.08), source: miniHub });
      segments.push({ start: miniHub, end: position, radius: 0.0023 });
    }
  }
  group.userData.botanicalAudit = {
    species: 'Ammi majus',
    connectedBlooms: blooms.length,
    stages: assertBloomConnections('Ammi majus', blooms, segments)
  };
  addSegmentMesh(group, segments, green);
  const petals = new THREE.InstancedMesh(petalGeometry(0.047, 0.019, 0.006, 0.001, 0.2), material(colorAt(options.palette, 0), 0.9), blooms.length * 5);
  const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.011, 7, 5), material(colorAt(options.palette, 2), 0.94), blooms.length);
  const buds = new THREE.InstancedMesh(new THREE.SphereGeometry(0.025, 8, 6), material(colorAt(options.palette, 1), 0.9), blooms.length);
  const involucralBracts = new THREE.InstancedMesh(petalGeometry(0.13, 0.014, 0.003, 0.018, 0.84), material(green, 0.92), 8);
  const bractlets = new THREE.InstancedMesh(petalGeometry(0.052, 0.007, 0.002, 0.008, 0.84), material(green, 0.92), miniHubs.length * 2);
  for (let i = 0; i < 8; i += 1) setPlanar(involucralBracts, i, hub, new THREE.Vector3(1, 1, 1), green, up, i / 8 * Math.PI * 2 + 0.16);
  let bractletUsed = 0;
  miniHubs.forEach((miniHub, index) => {
    for (let b = 0; b < 2; b += 1) {
      setPlanar(bractlets, bractletUsed, miniHub, new THREE.Vector3(0.88, 0.88, 1), green, up, b * Math.PI + index * 0.21);
      bractletUsed += 1;
    }
  });
  let petalUsed = 0;
  let centerUsed = 0;
  let budUsed = 0;
  blooms.forEach((bloom, index) => {
    if (bloom.stage === 'bud') {
      setVolume(buds, budUsed, bloom.position, new THREE.Vector3(0.82, 1.05, 0.82).multiplyScalar(bloom.scale), colorAt(options.palette, 1), bloom.normal);
      budUsed += 1;
      return;
    }
    const openness = bloom.stage === 'half' ? 0.62 : 1;
    setVolume(centers, centerUsed, bloom.position, new THREE.Vector3(1, 1, 0.7).multiplyScalar(bloom.scale), colorAt(options.palette, 2), bloom.normal);
    centerUsed += 1;
    for (let p = 0; p < 5; p += 1) {
      setPlanar(petals, petalUsed, bloom.position, new THREE.Vector3(bloom.scale * openness, bloom.scale * openness, 1), colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.12)), bloom.normal, p / 5 * Math.PI * 2 + rng.range(-0.08, 0.08));
      petalUsed += 1;
    }
  });
  finish(petals, petalUsed);
  finish(centers, centerUsed);
  finish(buds, budUsed);
  finish(involucralBracts, 8);
  finish(bractlets, bractletUsed);
  group.add(petals, centers, buds, involucralBracts, bractlets);
  return group;
}
