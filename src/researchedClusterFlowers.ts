import * as THREE from 'three';
import { createRng } from './random';
import {
  type BuildOptions,
  type Segment,
  addStemAndOppositeLeaves,
  basisFor,
  colorAt,
  finishInstances,
  flowerMaterial,
  petalGeometry,
  roundedSepalGeometry,
  segmentMesh,
  setInstance,
  stemAlong
} from './researchedFlowerShared';

export function createResearchedHydrangea(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-hydrangea`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5d7f54');
  addStemAndOppositeLeaves(group, green, rng);

  const headCenter = new THREE.Vector3(0, 0.43, 0);
  const rootHub = new THREE.Vector3(0, 0.05, 0);
  const branchSegments: Segment[] = [];
  const supportDirections: THREE.Vector3[] = [];
  const supportHubs: THREE.Vector3[] = [];
  const supportCount = 14;

  for (let i = 0; i < supportCount; i += 1) {
    const y = 0.82 - (i / Math.max(1, supportCount - 1)) * 1.28;
    const angle = i * 2.39996 + rng.range(-0.1, 0.1);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const direction = new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring).normalize();
    const hub = headCenter.clone().add(new THREE.Vector3(direction.x * 0.29, direction.y * 0.23, direction.z * 0.29));
    supportDirections.push(direction);
    supportHubs.push(hub);
    branchSegments.push({ start: rootHub, end: hub, radius: 0.0075 });
  }

  const showyCount = 92;
  const showyPetals = new THREE.InstancedMesh(
    roundedSepalGeometry(0.17, 0.126, 0.017),
    flowerMaterial(colorAt(options.palette, 0), 0.86),
    showyCount * 4
  );
  const showyCenters = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.019, 8, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.92),
    showyCount
  );

  let petalIndex = 0;
  for (let i = 0; i < showyCount; i += 1) {
    const y = 0.96 - (i / Math.max(1, showyCount - 1)) * 1.52;
    const angle = i * 2.39996 + rng.range(-0.11, 0.11);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const normal = new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring).normalize();
    const radialJitter = rng.range(0.88, 1.08);
    const bloom = headCenter.clone().add(new THREE.Vector3(
      normal.x * 0.62 * radialJitter,
      normal.y * 0.49 * radialJitter,
      normal.z * 0.58 * radialJitter
    ));

    let supportIndex = 0;
    let bestDot = -Infinity;
    supportDirections.forEach((candidate, candidateIndex) => {
      const dot = candidate.dot(normal);
      if (dot > bestDot) {
        bestDot = dot;
        supportIndex = candidateIndex;
      }
    });
    branchSegments.push({ start: supportHubs[supportIndex], end: bloom, radius: 0.0034 });

    const scale = rng.range(0.84, 1.12);
    setInstance(
      showyCenters,
      i,
      bloom,
      new THREE.Vector3(scale, scale, scale * 0.72),
      colorAt(options.palette, 1).clone().lerp(colorAt(options.palette, 2), 0.14),
      0,
      normal
    );

    const { tangent, bitangent } = basisFor(normal);
    for (let p = 0; p < 4; p += 1) {
      const pa = p / 4 * Math.PI * 2 + rng.range(-0.055, 0.055);
      const direction = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(normal, 0.1)
        .normalize();
      setInstance(
        showyPetals,
        petalIndex,
        bloom,
        new THREE.Vector3(scale * rng.range(0.93, 1.07), scale * rng.range(0.9, 1.08), 1),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.17)),
        0,
        direction
      );
      petalIndex += 1;
    }
  }

  const fertileCount = 28;
  const fertilePetals = new THREE.InstancedMesh(
    petalGeometry(0.052, 0.018, 0.007, 0, 0.22, 0.002),
    flowerMaterial(colorAt(options.palette, 1), 0.9),
    fertileCount * 5
  );
  const fertileCenters = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.017, 7, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.95),
    fertileCount
  );
  let fertilePetalIndex = 0;
  for (let i = 0; i < fertileCount; i += 1) {
    const y = rng.range(-0.45, 0.82);
    const angle = i * 2.39996 + rng.range(-0.22, 0.22);
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const normal = new THREE.Vector3(Math.cos(angle) * ring, y, Math.sin(angle) * ring).normalize();
    const bloom = headCenter.clone().add(new THREE.Vector3(normal.x * 0.49, normal.y * 0.39, normal.z * 0.46));
    const supportIndex = i % supportCount;
    branchSegments.push({ start: supportHubs[supportIndex], end: bloom, radius: 0.0026 });
    setInstance(fertileCenters, i, bloom, new THREE.Vector3(1, 1, 0.75), colorAt(options.palette, 2), 0, normal);
    const { tangent, bitangent } = basisFor(normal);
    for (let p = 0; p < 5; p += 1) {
      const pa = p / 5 * Math.PI * 2;
      const direction = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(normal, 0.18)
        .normalize();
      setInstance(
        fertilePetals,
        fertilePetalIndex,
        bloom,
        new THREE.Vector3(0.8, 0.8, 1),
        colorAt(options.palette, 1).clone().lerp(new THREE.Color('#f6f0c5'), 0.42),
        0,
        direction
      );
      fertilePetalIndex += 1;
    }
  }

  group.add(
    segmentMesh(branchSegments, green, 6),
    finishInstances(showyPetals),
    finishInstances(showyCenters),
    finishInstances(fertilePetals),
    finishInstances(fertileCenters)
  );
  return group;
}

export function createResearchedBabysBreath(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-babys-breath`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#617e56');
  const main = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(0.018, -0.56, -0.012),
    new THREE.Vector3(-0.045, 0.05, 0.025),
    new THREE.Vector3(0.04, 0.74, -0.035)
  ], 0.015, green, 20);
  group.add(main.mesh);

  const branchSegments: Segment[] = [];
  const blooms: Array<{ position: THREE.Vector3; direction: THREE.Vector3; scale: number; bud: boolean }> = [];
  const primaryCount = 13;

  for (let b = 0; b < primaryCount; b += 1) {
    const t = 0.27 + b / Math.max(1, primaryCount - 1) * 0.68;
    const start = main.curve.getPoint(t);
    const angle = b * 2.39996 + rng.range(-0.26, 0.26);
    const reach = rng.range(0.27, 0.55) * (1 - b * 0.021);
    const primaryTip = start.clone().add(new THREE.Vector3(
      Math.cos(angle) * reach,
      rng.range(0.19, 0.39),
      Math.sin(angle) * reach
    ));
    const primaryJoint = start.clone().lerp(primaryTip, 0.5).add(new THREE.Vector3(0, rng.range(0.035, 0.09), 0));
    branchSegments.push(
      { start, end: primaryJoint, radius: 0.0048 },
      { start: primaryJoint, end: primaryTip, radius: 0.0035 }
    );

    const secondaryCount = 3 + (b % 2);
    for (let s = 0; s < secondaryCount; s += 1) {
      const st = 0.34 + s / Math.max(1, secondaryCount - 1) * 0.56;
      const secondaryStart = primaryJoint.clone().lerp(primaryTip, st);
      const secondaryAngle = angle + (s % 2 ? 1 : -1) * rng.range(0.58, 1.08);
      const secondaryReach = rng.range(0.11, 0.24);
      const secondaryTip = secondaryStart.clone().add(new THREE.Vector3(
        Math.cos(secondaryAngle) * secondaryReach,
        rng.range(0.09, 0.2),
        Math.sin(secondaryAngle) * secondaryReach
      ));
      branchSegments.push({ start: secondaryStart, end: secondaryTip, radius: 0.0025 });

      const flowersOnTwig = 2 + (s === secondaryCount - 1 ? 1 : 0);
      for (let f = 0; f < flowersOnTwig; f += 1) {
        const ft = flowersOnTwig === 1 ? 1 : 0.64 + f / (flowersOnTwig - 1) * 0.36;
        const base = secondaryStart.clone().lerp(secondaryTip, ft);
        const flowerAngle = secondaryAngle + rng.range(-0.75, 0.75);
        const bloom = base.clone().add(new THREE.Vector3(
          Math.cos(flowerAngle) * rng.range(0.025, 0.065),
          rng.range(0.025, 0.075),
          Math.sin(flowerAngle) * rng.range(0.025, 0.065)
        ));
        branchSegments.push({ start: base, end: bloom, radius: 0.0017 });
        blooms.push({
          position: bloom,
          direction: bloom.clone().sub(base).normalize(),
          scale: rng.range(0.72, 1.12),
          bud: rng.value() < 0.22
        });
      }
    }
  }

  const openBlooms = blooms.filter((bloom) => !bloom.bud);
  const buds = blooms.filter((bloom) => bloom.bud);
  const petals = new THREE.InstancedMesh(
    roundedSepalGeometry(0.055, 0.026, 0.006),
    flowerMaterial(colorAt(options.palette, 0), 0.92),
    openBlooms.length * 5
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.014, 7, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.96),
    openBlooms.length
  );
  const budMesh = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.022, 8, 6),
    flowerMaterial(colorAt(options.palette, 1), 0.94),
    buds.length
  );

  let openIndex = 0;
  let petalIndex = 0;
  let budIndex = 0;
  blooms.forEach((bloom) => {
    if (bloom.bud) {
      setInstance(
        budMesh,
        budIndex,
        bloom.position,
        new THREE.Vector3(bloom.scale * 0.72, bloom.scale * 1.15, bloom.scale * 0.72),
        colorAt(options.palette, 1).clone().lerp(green, 0.12),
        0,
        bloom.direction
      );
      budIndex += 1;
      return;
    }

    setInstance(
      centers,
      openIndex,
      bloom.position,
      new THREE.Vector3(bloom.scale, bloom.scale, bloom.scale * 0.72),
      colorAt(options.palette, 2),
      0,
      bloom.direction
    );
    const { tangent, bitangent } = basisFor(bloom.direction);
    for (let p = 0; p < 5; p += 1) {
      const pa = p / 5 * Math.PI * 2 + rng.range(-0.035, 0.035);
      const direction = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(bloom.direction, 0.14)
        .normalize();
      setInstance(
        petals,
        petalIndex,
        bloom.position,
        new THREE.Vector3(bloom.scale, bloom.scale, 1),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.2)),
        0,
        direction
      );
      petalIndex += 1;
    }
    openIndex += 1;
  });

  group.add(
    segmentMesh(branchSegments, green, 5),
    finishInstances(petals),
    finishInstances(centers),
    finishInstances(budMesh)
  );
  return group;
}

export function createResearchedLaceFlower(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-lace-flower`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5e7d52');
  const hub = new THREE.Vector3(0, 0.18, 0);
  const stem = stemAlong([
    new THREE.Vector3(0, -1.18, 0),
    new THREE.Vector3(-0.025, -0.66, 0.012),
    new THREE.Vector3(0.018, -0.18, -0.01),
    hub
  ], 0.017, green, 17);
  group.add(stem.mesh);

  const primaryCount = 24;
  const floretsPerUmbel = 8;
  const floretCount = primaryCount * floretsPerUmbel;
  const segments: Segment[] = [];
  const petals = new THREE.InstancedMesh(
    roundedSepalGeometry(0.038, 0.017, 0.004),
    flowerMaterial(colorAt(options.palette, 0), 0.92),
    floretCount * 5
  );
  const centers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.01, 6, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.96),
    floretCount
  );
  const bracts = new THREE.InstancedMesh(
    petalGeometry(0.28, 0.025, 0.01, 0.035, 0.82, 0),
    flowerMaterial(green, 0.96),
    10
  );

  for (let i = 0; i < 10; i += 1) {
    const angle = i / 10 * Math.PI * 2;
    const direction = new THREE.Vector3(Math.cos(angle), -0.3, Math.sin(angle)).normalize();
    setInstance(bracts, i, hub, new THREE.Vector3(0.82, 0.82, 1), green, 0, direction);
  }

  let flowerIndex = 0;
  let petalIndex = 0;
  for (let i = 0; i < primaryCount; i += 1) {
    const angle = i * 2.39996 + rng.range(-0.06, 0.06);
    const radius = 0.16 + Math.sqrt((i + 0.5) / primaryCount) * 0.66;
    const miniHub = new THREE.Vector3(
      Math.cos(angle) * radius,
      0.28 + (1 - (radius / 0.84) ** 2) * 0.13 + rng.range(-0.018, 0.018),
      Math.sin(angle) * radius
    );
    segments.push({ start: hub, end: miniHub, radius: 0.0045 });

    for (let f = 0; f < floretsPerUmbel; f += 1) {
      const centerFloret = f === 0;
      const fa = f / Math.max(1, floretsPerUmbel - 1) * Math.PI * 2 + angle;
      const localRadius = centerFloret ? 0 : rng.range(0.048, 0.076);
      const bloom = miniHub.clone().add(new THREE.Vector3(
        Math.cos(fa) * localRadius,
        rng.range(0.012, 0.036),
        Math.sin(fa) * localRadius
      ));
      segments.push({ start: miniHub, end: bloom, radius: 0.0018 });
      const normal = bloom.clone().sub(miniHub).add(new THREE.Vector3(0, 0.08, 0)).normalize();
      const edgeScale = radius > 0.65 ? 1.18 : 1;
      setInstance(centers, flowerIndex, bloom, new THREE.Vector3(edgeScale, edgeScale, edgeScale * 0.72), colorAt(options.palette, 2), 0, normal);
      const { tangent, bitangent } = basisFor(normal);
      for (let p = 0; p < 5; p += 1) {
        const pa = p / 5 * Math.PI * 2;
        const direction = tangent.clone().multiplyScalar(Math.cos(pa))
          .addScaledVector(bitangent, Math.sin(pa))
          .addScaledVector(normal, 0.1)
          .normalize();
        setInstance(
          petals,
          petalIndex,
          bloom,
          new THREE.Vector3(edgeScale, edgeScale, 1),
          colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.04, 0.16)),
          0,
          direction
        );
        petalIndex += 1;
      }
      flowerIndex += 1;
    }
  }

  group.add(
    segmentMesh(segments, green, 5),
    finishInstances(bracts),
    finishInstances(petals),
    finishInstances(centers)
  );
  return group;
}
