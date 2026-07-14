import * as THREE from 'three';
import { createRng, type Rng } from './random';
import {
  UP,
  type BuildOptions,
  type Segment,
  colorAt,
  finishInstances,
  flowerMaterial,
  orientGroup,
  petalGeometry,
  roundedSepalGeometry,
  segmentMesh,
  setInstance,
  stemAlong
} from './researchedFlowerShared';

function createSnapdragonFloret(options: BuildOptions, rng: Rng, green: THREE.Color) {
  const group = new THREE.Group();
  const corolla = colorAt(options.palette, 0).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.02, 0.1));
  const accent = colorAt(options.palette, 1).clone().lerp(corolla, 0.25);
  const palateColor = colorAt(options.palette, 2, '#f7d07c');

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.105, 0.068, 0.28, 10),
    flowerMaterial(corolla, 0.84)
  );
  tube.position.y = 0.14;
  tube.scale.z = 0.82;
  group.add(tube);

  const petalGeo = roundedSepalGeometry(0.22, 0.115, 0.025);
  const petalSpecs = [
    { direction: new THREE.Vector3(-0.34, 0.72, 0.32), scale: new THREE.Vector3(0.92, 0.92, 1), color: accent },
    { direction: new THREE.Vector3(0.34, 0.72, 0.32), scale: new THREE.Vector3(0.92, 0.92, 1), color: accent },
    { direction: new THREE.Vector3(-0.42, 0.6, -0.34), scale: new THREE.Vector3(0.78, 0.8, 1), color: corolla },
    { direction: new THREE.Vector3(0, 0.64, -0.48), scale: new THREE.Vector3(1.22, 1.02, 1), color: corolla },
    { direction: new THREE.Vector3(0.42, 0.6, -0.34), scale: new THREE.Vector3(0.78, 0.8, 1), color: corolla }
  ];
  petalSpecs.forEach((spec) => {
    const petal = new THREE.Mesh(petalGeo, flowerMaterial(spec.color, 0.82));
    petal.position.set(0, 0.23, 0);
    petal.quaternion.setFromUnitVectors(UP, spec.direction.normalize());
    petal.scale.copy(spec.scale);
    group.add(petal);
  });

  const palate = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 9), flowerMaterial(palateColor, 0.86));
  palate.position.set(0, 0.29, -0.025);
  palate.scale.set(1.18, 0.6, 0.62);
  group.add(palate);

  const calyxGeo = petalGeometry(0.11, 0.026, 0.012, 0.01, 0.74, 0);
  for (let i = 0; i < 5; i += 1) {
    const angle = i / 5 * Math.PI * 2;
    const sepal = new THREE.Mesh(calyxGeo, flowerMaterial(green, 0.94));
    sepal.position.set(0, -0.01, 0);
    sepal.quaternion.setFromUnitVectors(
      UP,
      new THREE.Vector3(Math.cos(angle) * 0.45, -0.55, Math.sin(angle) * 0.45).normalize()
    );
    group.add(sepal);
  }
  return group;
}

export function createResearchedSnapdragon(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-snapdragon`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#5b7d4e');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.02, -0.42, -0.012),
    new THREE.Vector3(-0.04, 0.42, 0.02),
    new THREE.Vector3(0.03, 1.14, -0.018)
  ], 0.027, green, 22);
  group.add(stem.mesh);

  const flowerCount = 21;
  const openCount = 16;
  const pedicels: Segment[] = [];
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.095, 11, 8),
    flowerMaterial(colorAt(options.palette, 0), 0.88),
    flowerCount - openCount
  );
  let budIndex = 0;

  for (let i = 0; i < flowerCount; i += 1) {
    const progress = i / Math.max(1, flowerCount - 1);
    const t = 0.24 + progress * 0.72;
    const angle = i * 2.54 + rng.range(-0.2, 0.2);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const axisPoint = stem.curve.getPoint(t);
    const reach = 0.09 + (1 - progress) * 0.065;
    const base = axisPoint.clone().addScaledVector(radial, reach);
    pedicels.push({ start: axisPoint, end: base, radius: 0.008 });
    const forward = radial.clone().add(new THREE.Vector3(0, -0.04 + progress * 0.08, 0)).normalize();
    const scale = 0.69 + (1 - progress) * 0.31;

    if (i >= openCount) {
      setInstance(
        buds,
        budIndex,
        base.clone().addScaledVector(forward, 0.06),
        new THREE.Vector3(scale * 0.75, scale * 1.35, scale * 0.86),
        colorAt(options.palette, i).clone().lerp(green, 0.09),
        0,
        forward
      );
      budIndex += 1;
      continue;
    }

    group.add(orientGroup(createSnapdragonFloret(options, rng, green), base, forward, scale));
  }

  group.add(segmentMesh(pedicels, green, 6), finishInstances(buds));
  return group;
}

function taperedSegment(start: THREE.Vector3, end: THREE.Vector3, radiusStart: number, radiusEnd: number, color: THREE.Color) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusEnd, radiusStart, direction.length(), 8),
    flowerMaterial(color, 0.9)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  return mesh;
}

function createDelphiniumFloret(options: BuildOptions, rng: Rng) {
  const group = new THREE.Group();
  const sepalGeometry = roundedSepalGeometry(0.26, 0.108, 0.025);
  const innerGeometry = roundedSepalGeometry(0.13, 0.052, 0.015);
  const blue = colorAt(options.palette, 0).clone().lerp(new THREE.Color('#ffffff'), rng.range(0.01, 0.1));
  const lightBlue = colorAt(options.palette, 1);

  const sepalAngles = [0, 72, 144, 216, 288].map((degrees) => degrees * Math.PI / 180);
  sepalAngles.forEach((angle, index) => {
    const radial = new THREE.Vector3(Math.cos(angle), 0.18, Math.sin(angle)).normalize();
    const sepal = new THREE.Mesh(sepalGeometry, flowerMaterial(index === 1 ? lightBlue : blue, 0.84));
    sepal.position.set(Math.cos(angle) * 0.018, 0.035, Math.sin(angle) * 0.018);
    sepal.quaternion.setFromUnitVectors(UP, radial);
    sepal.scale.setScalar(index === 1 ? 1.08 : rng.range(0.94, 1.05));
    group.add(sepal);
  });

  const spurStart = new THREE.Vector3(0, -0.02, 0.075);
  const spurEnd = new THREE.Vector3(0, -0.34, 0.17);
  group.add(taperedSegment(spurStart, spurEnd, 0.055, 0.012, lightBlue));

  const innerSpecs = [
    { angle: 58, color: colorAt(options.palette, 2), scale: 0.9 },
    { angle: 122, color: colorAt(options.palette, 2), scale: 0.9 },
    { angle: 238, color: lightBlue.clone().lerp(new THREE.Color('#ffffff'), 0.2), scale: 0.78 },
    { angle: 302, color: lightBlue.clone().lerp(new THREE.Color('#ffffff'), 0.2), scale: 0.78 }
  ];
  innerSpecs.forEach((spec) => {
    const angle = spec.angle * Math.PI / 180;
    const direction = new THREE.Vector3(Math.cos(angle), 0.62, Math.sin(angle)).normalize();
    const petal = new THREE.Mesh(innerGeometry, flowerMaterial(spec.color, 0.84));
    petal.position.set(0, 0.075, 0);
    petal.quaternion.setFromUnitVectors(UP, direction);
    petal.scale.setScalar(spec.scale);
    group.add(petal);
  });

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.052, 10, 8),
    flowerMaterial(colorAt(options.palette, 2), 0.92)
  );
  center.position.y = 0.085;
  center.scale.set(1, 0.78, 1);
  group.add(center);
  return group;
}

export function createResearchedDelphinium(options: BuildOptions) {
  const rng = createRng(`${options.seed}:researched-delphinium`);
  const group = new THREE.Group();
  const green = colorAt(options.palette, options.palette.length - 1, '#55734e');
  const stem = stemAlong([
    new THREE.Vector3(0, -1.2, 0),
    new THREE.Vector3(0.025, -0.42, -0.014),
    new THREE.Vector3(-0.055, 0.42, 0.025),
    new THREE.Vector3(0.04, 1.16, -0.02)
  ], 0.024, green, 22);
  group.add(stem.mesh);

  const flowerCount = 17;
  const openCount = 13;
  const pedicels: Segment[] = [];
  const buds = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.082, 10, 8),
    flowerMaterial(colorAt(options.palette, 0), 0.88),
    flowerCount - openCount
  );
  let budIndex = 0;

  for (let i = 0; i < flowerCount; i += 1) {
    const progress = i / Math.max(1, flowerCount - 1);
    const t = 0.23 + progress * 0.73;
    const angle = i * 2.39996 + rng.range(-0.18, 0.18);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const axisPoint = stem.curve.getPoint(t);
    const reach = rng.range(0.18, 0.25) * (1 - progress * 0.22);
    const base = axisPoint.clone().addScaledVector(radial, reach).add(new THREE.Vector3(0, rng.range(-0.02, 0.03), 0));
    pedicels.push({ start: axisPoint, end: base, radius: 0.007 });
    const forward = radial.clone().add(new THREE.Vector3(0, -0.06 + progress * 0.13, 0)).normalize();
    const scale = 0.78 + (1 - progress) * 0.3;

    if (i >= openCount) {
      setInstance(
        buds,
        budIndex,
        base,
        new THREE.Vector3(scale * 0.75, scale * 1.22, scale * 0.9),
        colorAt(options.palette, i).clone().lerp(green, 0.06),
        0,
        forward
      );
      budIndex += 1;
      continue;
    }

    group.add(orientGroup(createDelphiniumFloret(options, rng), base, forward, scale));
  }

  group.add(segmentMesh(pedicels, green, 6), finishInstances(buds));
  return group;
}
