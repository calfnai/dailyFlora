import * as THREE from 'three';
import { createRng } from './random';
import {
  type BuildOptions,
  type Segment,
  basisFor,
  colorAt,
  finishInstances,
  flowerMaterial,
  petalGeometry,
  segmentMesh,
  setInstance,
  stemAlong
} from './researchedFlowerShared';

export function createResearchedLiatris(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-liatris`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#55734d');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.015, -0.42, -0.012),
    new THREE.Vector3(-0.025, 0.42, 0.018),
    new THREE.Vector3(0.025, 1.12, -0.015)
  ], 0.021, green, 22);
  group.add(stem.mesh);

  const headCount = 54;
  const floretsPerHead = 6;
  const heads = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.052, 9, 7),
    flowerMaterial(colorAt(options.palette, 0), 0.9),
    headCount
  );
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.012, 0.017, 0.075, 6),
    flowerMaterial(colorAt(options.palette, 1), 0.88),
    headCount * floretsPerHead
  );
  const styleSegments: Segment[] = [];
  let tubeIndex = 0;

  for (let i = 0; i < headCount; i += 1) {
    const progress = i / Math.max(1, headCount - 1);
    const t = 0.29 + progress * 0.69;
    const angle = i * 2.39996 + rng.range(-0.11, 0.11);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const axisPoint = stem.curve.getPoint(t);
    const head = axisPoint.clone().addScaledVector(radial, rng.range(0.038, 0.061));
    const openAmount = THREE.MathUtils.smoothstep(progress, 0.28, 0.6);
    const spentAmount = THREE.MathUtils.smoothstep(progress, 0.88, 1);
    const headScale = 0.78 + openAmount * 0.35;
    const headColor = colorAt(options.palette, progress > 0.88 ? 2 : progress > 0.48 ? 1 : 0)
      .clone().lerp(new THREE.Color('#80607e'), spentAmount * 0.26);
    setInstance(
      heads,
      i,
      head,
      new THREE.Vector3(headScale, headScale * 0.86, headScale),
      headColor,
      0,
      radial
    );

    for (let f = 0; f < floretsPerHead; f += 1) {
      const fa = f / floretsPerHead * Math.PI * 2 + angle;
      const { tangent, bitangent } = basisFor(radial);
      const lateral = tangent.clone().multiplyScalar(Math.cos(fa) * 0.032)
        .addScaledVector(bitangent, Math.sin(fa) * 0.032);
      const tubeDirection = radial.clone().multiplyScalar(0.74)
        .addScaledVector(lateral.clone().normalize(), 0.52)
        .add(new THREE.Vector3(0, rng.range(-0.08, 0.12), 0))
        .normalize();
      const tubeLengthScale = 0.25 + openAmount * 0.75;
      const tubeCenter = head.clone().addScaledVector(tubeDirection, 0.044 * tubeLengthScale);
      setInstance(
        tubes,
        tubeIndex,
        tubeCenter,
        new THREE.Vector3(tubeLengthScale, tubeLengthScale, tubeLengthScale),
        colorAt(options.palette, 1).clone().lerp(new THREE.Color('#e6b6ef'), rng.range(0.02, 0.18)),
        0,
        tubeDirection
      );
      if (openAmount > 0.35) {
        const styleStart = head.clone().addScaledVector(tubeDirection, 0.075 * tubeLengthScale);
        const styleEnd = styleStart.clone().addScaledVector(tubeDirection, 0.08 + openAmount * 0.06);
        styleSegments.push({
          start: styleStart,
          end: styleEnd,
          radius: 0.0042,
          color: colorAt(options.palette, 2).clone().lerp(new THREE.Color('#ffffff'), 0.08)
        });
      }
      tubeIndex += 1;
    }
  }

  group.add(
    finishInstances(heads),
    finishInstances(tubes),
    segmentMesh(styleSegments, colorAt(options.palette, 2), 5)
  );
  return group;
}

export function createResearchedHyacinth(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-hyacinth`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#55764e');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.06, 0),
    new THREE.Vector3(0.012, -0.42, -0.008),
    new THREE.Vector3(-0.015, 0.28, 0.012),
    new THREE.Vector3(0.018, 0.92, -0.008)
  ], 0.036, green, 20);
  group.add(stem.mesh);

  const count = 36;
  const openCount = 29;
  const tubes = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.075, 0.043, 0.23, 10, 1, false),
    flowerMaterial(colorAt(options.palette, 0), 0.86),
    openCount
  );
  const lobes = new THREE.InstancedMesh(
    petalGeometry(0.13, 0.037, 0.018, 0.02, 0.5, 0.004),
    flowerMaterial(colorAt(options.palette, 1), 0.84),
    openCount * 6
  );
  const throats = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.022, 8, 6),
    flowerMaterial(colorAt(options.palette, 1).clone().lerp(colorAt(options.palette, 2), 0.28), 0.9),
    openCount
  );
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.07, 10, 8),
    flowerMaterial(colorAt(options.palette, 0), 0.88),
    count - openCount
  );
  const pedicels: Segment[] = [];

  let tubeIndex = 0;
  let lobeIndex = 0;
  let budIndex = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / Math.max(1, count - 1);
    const t = 0.18 + progress * 0.78;
    const angle = i * 2.39996 + rng.range(-0.13, 0.13);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const axisPoint = stem.curve.getPoint(t);
    const pedicelLength = 0.1 + (1 - progress) * 0.055;
    const base = axisPoint.clone().addScaledVector(radial, pedicelLength);
    const forward = radial.clone().add(new THREE.Vector3(0, -0.22 + progress * 0.12, 0)).normalize();
    pedicels.push({ start: axisPoint, end: base, radius: 0.007 });

    if (i >= openCount) {
      setInstance(
        buds,
        budIndex,
        base.clone().addScaledVector(forward, 0.045),
        new THREE.Vector3(0.72, 1.12, 0.72),
        colorAt(options.palette, 0).clone().lerp(green, 0.08 + progress * 0.08),
        0,
        forward
      );
      budIndex += 1;
      continue;
    }

    const tubeScale = rng.range(0.88, 1.08) * (0.84 + progress * 0.15);
    const tubeCenter = base.clone().addScaledVector(forward, 0.115 * tubeScale);
    setInstance(
      tubes,
      tubeIndex,
      tubeCenter,
      new THREE.Vector3(tubeScale, tubeScale, tubeScale),
      colorAt(options.palette, i).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.12)),
      0,
      forward
    );
    const mouth = base.clone().addScaledVector(forward, 0.23 * tubeScale);
    setInstance(throats, tubeIndex, mouth, new THREE.Vector3(1, 0.7, 1), colorAt(options.palette, 2), 0, forward);
    const { tangent, bitangent } = basisFor(forward);
    for (let p = 0; p < 6; p += 1) {
      const pa = p / 6 * Math.PI * 2;
      const direction = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa))
        .addScaledVector(forward, -0.18)
        .normalize();
      setInstance(
        lobes,
        lobeIndex,
        mouth,
        new THREE.Vector3(tubeScale, tubeScale, 1),
        colorAt(options.palette, p + 1).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.16)),
        0,
        direction
      );
      lobeIndex += 1;
    }
    tubeIndex += 1;
  }

  group.add(
    segmentMesh(pedicels, green, 6),
    finishInstances(tubes),
    finishInstances(lobes),
    finishInstances(throats),
    finishInstances(buds)
  );
  return group;
}

export function createResearchedFoxtailLily(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-foxtail-lily`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#607d4e');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.28, 0),
    new THREE.Vector3(0.008, -0.44, -0.005),
    new THREE.Vector3(-0.01, 0.46, 0.008),
    new THREE.Vector3(0.012, 1.28, -0.006)
  ], 0.025, green, 24);
  group.add(stem.mesh);

  const count = 58;
  const openStart = 8;
  const openEnd = 44;
  const openCount = openEnd - openStart;
  const spentCount = openStart;
  const budCount = count - openEnd;
  const petals = new THREE.InstancedMesh(
    petalGeometry(0.16, 0.048, 0.015, 0.012, 0.42, 0.003),
    flowerMaterial(colorAt(options.palette, 0), 0.86),
    openCount * 6
  );
  const flowerCenters = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.045, 8, 6),
    flowerMaterial(colorAt(options.palette, 2), 0.9),
    openCount
  );
  const anthers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.014, 7, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.94),
    openCount * 6
  );
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.052, 9, 7),
    flowerMaterial(colorAt(options.palette, 0), 0.9),
    budCount
  );
  const spent = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.026, 7, 5),
    flowerMaterial(colorAt(options.palette, 2), 0.96),
    spentCount
  );
  const pedicels: Segment[] = [];
  const stamens: Segment[] = [];

  let openIndex = 0;
  let petalIndex = 0;
  let antherIndex = 0;
  let budIndex = 0;
  let spentIndex = 0;
  for (let i = 0; i < count; i += 1) {
    const progress = i / Math.max(1, count - 1);
    const t = 0.17 + progress * 0.8;
    const angle = i * 2.39996 + rng.range(-0.1, 0.1);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const axisPoint = stem.curve.getPoint(t);
    const pedicelLength = 0.2 - progress * 0.12;
    const center = axisPoint.clone().addScaledVector(radial, pedicelLength);
    pedicels.push({ start: axisPoint, end: center, radius: 0.0055 });

    if (i < openStart) {
      setInstance(
        spent,
        spentIndex,
        center,
        new THREE.Vector3(0.75, 1.18, 0.75),
        colorAt(options.palette, 2).clone().lerp(new THREE.Color('#8a7651'), 0.35),
        0,
        radial
      );
      spentIndex += 1;
      continue;
    }

    if (i >= openEnd) {
      const budScale = 0.72 + (1 - progress) * 0.22;
      setInstance(
        buds,
        budIndex,
        center,
        new THREE.Vector3(budScale * 0.72, budScale * 1.25, budScale * 0.72),
        colorAt(options.palette, 0).clone().lerp(green, 0.08 + progress * 0.08),
        0,
        radial.clone().add(new THREE.Vector3(0, 0.12, 0)).normalize()
      );
      budIndex += 1;
      continue;
    }

    const forward = radial.clone().add(new THREE.Vector3(0, -0.05, 0)).normalize();
    const scale = rng.range(0.86, 1.08);
    setInstance(
      flowerCenters,
      openIndex,
      center,
      new THREE.Vector3(scale, scale * 0.84, scale),
      colorAt(options.palette, 2),
      0,
      forward
    );
    const { tangent, bitangent } = basisFor(forward);
    for (let p = 0; p < 6; p += 1) {
      const pa = p / 6 * Math.PI * 2;
      const lateral = tangent.clone().multiplyScalar(Math.cos(pa))
        .addScaledVector(bitangent, Math.sin(pa));
      const petalDirection = lateral.clone().addScaledVector(forward, 0.12).normalize();
      setInstance(
        petals,
        petalIndex,
        center,
        new THREE.Vector3(scale, scale, 1),
        colorAt(options.palette, p).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.03, 0.16)),
        0,
        petalDirection
      );
      const stamenStart = center.clone().addScaledVector(lateral, 0.024).addScaledVector(forward, 0.018);
      const stamenEnd = stamenStart.clone().addScaledVector(forward, 0.17 * scale).addScaledVector(lateral, 0.018);
      stamens.push({
        start: stamenStart,
        end: stamenEnd,
        radius: 0.0038,
        color: colorAt(options.palette, 2).clone().lerp(new THREE.Color('#f7d38a'), 0.2)
      });
      setInstance(
        anthers,
        antherIndex,
        stamenEnd,
        new THREE.Vector3(1.22, 0.72, 0.72),
        colorAt(options.palette, 2).clone().lerp(new THREE.Color('#8f6b3a'), 0.22),
        pa,
        forward
      );
      petalIndex += 1;
      antherIndex += 1;
    }
    openIndex += 1;
  }

  group.add(
    segmentMesh(pedicels, green, 6),
    segmentMesh(stamens, colorAt(options.palette, 2), 5),
    finishInstances(petals),
    finishInstances(flowerCenters),
    finishInstances(anthers),
    finishInstances(buds),
    finishInstances(spent)
  );
  return group;
}
