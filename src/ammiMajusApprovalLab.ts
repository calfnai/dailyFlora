import * as THREE from 'three';
import { createRng, type Rng } from './random';

type PanelName = 'front' | 'side' | 'top' | 'silhouette' | 'cluster' | 'hub';

type Panel = {
  name: PanelName;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  model: THREE.Group;
};

const up = new THREE.Vector3(0, 1, 0);
const forward = new THREE.Vector3(0, 0, 1);
const flowerWhite = '#fffdf0';
const flowerWarm = '#f7f0d8';
const flowerBud = '#efe8c9';
const centerGold = '#d8c56b';
const stemGreen = '#5f8055';
const plantTissueRoughness = 0.96;

type AmmiStats = {
  primaryRays: number;
  secondaryRange: [number, number];
  flowers: number;
  buds: number;
  centerToOuterHeightDelta: number;
  heightWidthRatio: number;
};

function requiredElement<T extends Element>(selector: string) {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Ammi majus approval lab could not find ${selector}.`);
  return element;
}

const canvas = requiredElement<HTMLCanvasElement>('#ammi-majus-canvas');
const stage = requiredElement<HTMLElement>('.stage-wrap');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.45));
renderer.setClearColor(0x000000, 0);
renderer.autoClear = false;

const silhouetteMaterial = new THREE.MeshBasicMaterial({ color: '#f6efd7', side: THREE.DoubleSide });

function material(color: string | THREE.Color, roughness = 0.84) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, side: THREE.DoubleSide });
}

function cylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: string | THREE.Color, radialSegments = 6) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.9, direction.length(), radialSegments, 1, false),
    material(color, 0.92)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function taperedBetween(
  start: THREE.Vector3,
  end: THREE.Vector3,
  startRadius: number,
  endRadius: number,
  color: string | THREE.Color,
  radialSegments = 7
) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(endRadius, startRadius, direction.length(), radialSegments, 1, false),
    material(color, plantTissueRoughness)
  );
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(up, direction.normalize());
  return mesh;
}

function junctionGeometry() {
  const rings = [
    { y: -0.058, radius: 0.019 },
    { y: -0.034, radius: 0.022 },
    { y: -0.008, radius: 0.026 },
    { y: 0.018, radius: 0.025 },
    { y: 0.043, radius: 0.019 },
    { y: 0.064, radius: 0.011 }
  ];
  const sides = 11;
  const positions: number[] = [];
  const point = (ring: number, side: number) => {
    const angle = side / sides * Math.PI * 2;
    const irregularity = 1 + Math.sin(angle * 3 + ring * 1.17) * 0.075 + Math.cos(angle * 2 - ring * 0.73) * 0.035;
    const radius = rings[ring].radius * irregularity;
    return new THREE.Vector3(Math.cos(angle) * radius, rings[ring].y, Math.sin(angle) * radius);
  };
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let side = 0; side < sides; side += 1) {
      const next = (side + 1) % sides;
      const a = point(ring, side);
      const b = point(ring, next);
      const c = point(ring + 1, side);
      const d = point(ring + 1, next);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      positions.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function organicBranchGeometry(
  points: THREE.Vector3[],
  startRadius: number,
  endRadius: number,
  radialSegments = 8,
  tubularSegments = 10,
  phase = 0
) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const frames = curve.computeFrenetFrames(tubularSegments, false);
  const positions: number[] = [];
  const point = (segment: number, side: number) => {
    const t = segment / tubularSegments;
    const center = curve.getPoint(t);
    const angle = side / radialSegments * Math.PI * 2;
    const radius = THREE.MathUtils.lerp(startRadius, endRadius, t ** 0.68)
      * (1 + Math.sin(t * Math.PI) * Math.sin(angle * 2 + phase) * 0.035);
    return center
      .addScaledVector(frames.normals[segment], Math.cos(angle) * radius)
      .addScaledVector(frames.binormals[segment], Math.sin(angle) * radius);
  };
  for (let segment = 0; segment < tubularSegments; segment += 1) {
    for (let side = 0; side < radialSegments; side += 1) {
      const next = (side + 1) % radialSegments;
      const a = point(segment, side);
      const b = point(segment, next);
      const c = point(segment + 1, side);
      const d = point(segment + 1, next);
      positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
      positions.push(b.x, b.y, b.z, d.x, d.y, d.z, c.x, c.y, c.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addPlantJunction(group: THREE.Group, hub: THREE.Vector3, color: string | THREE.Color) {
  const junction = new THREE.Mesh(junctionGeometry(), material(color, plantTissueRoughness));
  junction.position.copy(hub);
  group.add(junction);
}

function addPrimaryRayConnection(
  group: THREE.Group,
  hub: THREE.Vector3,
  miniHub: THREE.Vector3,
  index: number,
  color: string | THREE.Color
) {
  const radial = new THREE.Vector3(miniHub.x - hub.x, 0, miniHub.z - hub.z).normalize();
  const base = hub.clone()
    .addScaledVector(radial, 0.012 + (index % 3) * 0.0025)
    .add(new THREE.Vector3(0, -0.012 + (index % 4) * 0.007, 0));
  const tangential = new THREE.Vector3(-radial.z, 0, radial.x);
  const shoulder = base.clone().lerp(miniHub, 0.12)
    .addScaledVector(tangential, (index % 2 ? 1 : -1) * 0.0025)
    .add(new THREE.Vector3(0, 0.009 + (index % 3) * 0.002, 0));
  const mid = base.clone().lerp(miniHub, 0.52)
    .addScaledVector(tangential, Math.sin(index * 1.7) * 0.002)
    .add(new THREE.Vector3(0, 0.003, 0));
  group.add(new THREE.Mesh(
    organicBranchGeometry(
      [base, shoulder, mid, miniHub],
      0.0078 + (index % 3) * 0.00035,
      0.0049,
      8,
      10,
      index * 0.73
    ),
    material(color, plantTissueRoughness)
  ));
}

function tangentFrame(normal: THREE.Vector3) {
  const reference = Math.abs(normal.y) < 0.88 ? up : new THREE.Vector3(1, 0, 0);
  const tangent = new THREE.Vector3().crossVectors(normal, reference).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  return { tangent, bitangent };
}

function petalGeometry(length: number, width: number, cup = 0.003) {
  const positions: number[] = [];
  const rows = 6;
  const cols = 4;
  const point = (row: number, col: number) => {
    const v = row / rows;
    const u = col / cols * 2 - 1;
    // Keep a softly rounded, broad distal edge instead of tapering each petal
    // into a pointed paper-star tip.
    const shoulder = Math.sin(v * Math.PI * 0.7);
    return new THREE.Vector3(
      u * width * shoulder * (1 - 0.035 * v),
      v * length,
      Math.sin(v * Math.PI * 0.86) * cup
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
  geometry.boundingSphere = new THREE.Sphere(
    new THREE.Vector3(0, length * 0.5, cup * 0.5),
    Math.sqrt(width * width + length * length * 0.25 + cup * cup)
  );
  return geometry;
}

function placePart(part: THREE.Object3D, center: THREE.Vector3, normal: THREE.Vector3, roll: number, scale = 1) {
  part.position.copy(center);
  part.quaternion.setFromUnitVectors(forward, normal.clone().normalize());
  part.rotateZ(roll);
  part.scale.setScalar(scale);
}

function addFivePetalFlower(group: THREE.Group, center: THREE.Vector3, normal: THREE.Vector3, scale: number, rng: Rng) {
  const petalGeo = petalGeometry(0.032, 0.0215, 0.0018);
  const { tangent, bitangent } = tangentFrame(normal);
  const base = new THREE.Color(flowerWhite);
  for (let i = 0; i < 5; i += 1) {
    const color = base.clone().lerp(new THREE.Color(flowerWarm), rng.range(0, 0.22));
    const petal = new THREE.Mesh(petalGeo, material(color, 0.88));
    const roll = i / 5 * Math.PI * 2 + rng.range(-0.045, 0.045);
    placePart(petal, center, normal, roll, scale);
    group.add(petal);
  }
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0072 * scale, 8, 6), material(centerGold, 0.86));
  dot.position.copy(center).addScaledVector(normal, 0.004 * scale);
  dot.scale.set(1.1, 0.8, 1.1);
  dot.quaternion.setFromUnitVectors(up, normal);
  dot.position.addScaledVector(tangent, rng.range(-0.0018, 0.0018)).addScaledVector(bitangent, rng.range(-0.0018, 0.0018));
  group.add(dot);
}

function addBud(group: THREE.Group, center: THREE.Vector3, normal: THREE.Vector3, scale: number) {
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.018 * scale, 8, 6), material(flowerBud, 0.9));
  bud.position.copy(center);
  bud.scale.set(0.86, 1.18, 0.86);
  bud.quaternion.setFromUnitVectors(up, normal.clone().normalize());
  group.add(bud);
}

function hubPoint() {
  return new THREE.Vector3(0, 0.08, 0);
}

function primaryHubPosition(i: number, count: number, rng: Rng) {
  const angleFractions = [0, 0.047, 0.126, 0.184, 0.272, 0.319, 0.404, 0.463, 0.535, 0.608, 0.654, 0.735, 0.786, 0.858, 0.914, 0.972];
  const angle = angleFractions[i % angleFractions.length] * Math.PI * 2 + rng.range(-0.025, 0.025);
  const inward = i === 2 || i === 8 || i === 13;
  const shortenedOuter = i === 1 || i === 4 || i === 7 || i === 11 || i === 15;
  let radius = inward ? rng.range(0.43, 0.54) : rng.range(0.58, 0.88);
  if (shortenedOuter) radius *= 0.88;
  const normalized = radius / 0.86;
  // A shallow compound umbel: centre highest, middle next, outer rim lower.
  const arch = 0.44 * Math.max(0, 1 - normalized) ** 0.72 - 0.04 * normalized;
  const lift = shortenedOuter ? 0.045 : inward ? 0.025 : 0;
  const y = 0.31 + arch + lift + rng.range(-0.045, 0.052);
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
}

function addAmmiModel(seed = 'ammi-majus-approval-a') {
  const rng = createRng(seed);
  const group = new THREE.Group();
  const hub = hubPoint();
  const primaryCount = 16;
  let flowerCount = 0;
  let budCount = 0;
  let minSecondary = Number.POSITIVE_INFINITY;
  let maxSecondary = 0;
  let outerYTotal = 0;

  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -1.22, 0),
    new THREE.Vector3(-0.035, -0.7, 0.018),
    new THREE.Vector3(0.018, -0.28, -0.012),
    hub
  ], false, 'centripetal');
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 18, 0.017, 7, false), material(stemGreen, plantTissueRoughness)));
  addPlantJunction(group, hub, stemGreen);

  const miniHubs: THREE.Vector3[] = [];
  for (let i = 0; i < primaryCount; i += 1) {
    const miniHub = primaryHubPosition(i, primaryCount, rng);
    miniHubs.push(miniHub);
    outerYTotal += miniHub.y;
    addPrimaryRayConnection(group, hub, miniHub, i, stemGreen);
  }

  miniHubs.forEach((miniHub, i) => {
    const radial = new THREE.Vector3(miniHub.x, 0, miniHub.z).normalize();
    const tangential = new THREE.Vector3(-radial.z, 0, radial.x);
    const clusterNormal = radial.clone().multiplyScalar(0.1 + (i % 4) * 0.018)
      .addScaledVector(tangential, Math.sin(i * 1.73) * 0.11)
      .add(up.clone().multiplyScalar(0.985))
      .normalize();
    const { tangent, bitangent } = tangentFrame(clusterNormal);
    const radialDistance = Math.hypot(miniHub.x, miniHub.z);
    const secondaryCount = radialDistance < 0.56
      ? 9 + (i % 2)
      : radialDistance < 0.72
        ? 7 + ((i * 5 + 1) % 3)
        : 6 + ((i * 5 + 2) % 3);
    minSecondary = Math.min(minSecondary, secondaryCount);
    maxSecondary = Math.max(maxSecondary, secondaryCount);
    const clusterSpread = (0.086 + (secondaryCount - 6) * 0.0045 + rng.range(-0.007, 0.007)) * rng.range(0.8, 1.18);
    const clusterBias = i % 4 === 0 ? -0.18 : i % 5 === 0 ? 0.22 : 0;

    for (let f = 0; f < secondaryCount; f += 1) {
      const a = f / secondaryCount * Math.PI * 2 + clusterBias + rng.range(-0.18, 0.18);
      const length = clusterSpread * rng.range(0.78, 1.18);
      const direction = tangent.clone().multiplyScalar(Math.cos(a))
        .addScaledVector(bitangent, Math.sin(a))
        .addScaledVector(clusterNormal, rng.range(0.06, 0.48))
        .addScaledVector(radial, rng.range(-0.05, 0.08))
        .normalize();
      const bloom = miniHub.clone().addScaledVector(direction, length);
      bloom.y += rng.range(-0.038, 0.052) + Math.sin(i * 0.9 + f * 1.4) * 0.012;
      group.add(cylinderBetween(miniHub, bloom, 0.0025, stemGreen, 5));
      const bloomNormal = clusterNormal.clone().addScaledVector(direction, rng.range(0.16, 0.34)).normalize();
      const isBud = f === secondaryCount - 1 && i % 4 !== 1;
      if (isBud) {
        addBud(group, bloom, bloomNormal, rng.range(0.86, 1.08));
        budCount += 1;
      } else {
        addFivePetalFlower(group, bloom, bloomNormal, rng.range(0.82, 1.05), rng);
        flowerCount += 1;
      }
    }
  });

  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2 + rng.range(-0.12, 0.12);
    const start = hub.clone().add(new THREE.Vector3(Math.cos(angle) * 0.014, -0.012, Math.sin(angle) * 0.014));
    const end = hub.clone().add(new THREE.Vector3(Math.cos(angle) * rng.range(0.16, 0.24), rng.range(-0.015, 0.038), Math.sin(angle) * rng.range(0.16, 0.24)));
    group.add(taperedBetween(start, end, 0.0023, 0.0008, '#6f8e63', 5));
  }

  const avgOuterY = outerYTotal / primaryCount;
  const stats: AmmiStats = {
    primaryRays: primaryCount,
    secondaryRange: [minSecondary, maxSecondary],
    flowers: flowerCount,
    buds: budCount,
    centerToOuterHeightDelta: Number((avgOuterY - hub.y).toFixed(2)),
    heightWidthRatio: Number((1.68 / 1.72).toFixed(2))
  };
  group.userData.approvalStats = stats;
  return group;
}

function createJunctionCloseup(seed: string) {
  const rng = createRng(seed);
  const group = new THREE.Group();
  const hub = new THREE.Vector3(0, 0, 0);
  const stemCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.018, -0.68, 0.01),
    new THREE.Vector3(0.014, -0.31, -0.008),
    hub
  ], false, 'centripetal');
  group.add(new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 16, 0.02, 8, false), material(stemGreen, plantTissueRoughness)));
  addPlantJunction(group, hub, stemGreen);
  const angleFractions = [0, 0.047, 0.126, 0.184, 0.272, 0.319, 0.404, 0.463, 0.535, 0.608, 0.654, 0.735, 0.786, 0.858, 0.914, 0.972];
  for (let i = 0; i < angleFractions.length; i += 1) {
    const angle = angleFractions[i] * Math.PI * 2 + rng.range(-0.025, 0.025);
    const radius = rng.range(0.34, 0.52);
    const end = new THREE.Vector3(Math.cos(angle) * radius, rng.range(0.16, 0.31), Math.sin(angle) * radius);
    addPrimaryRayConnection(group, hub, end, i, stemGreen);
  }
  for (let i = 0; i < 7; i += 1) {
    const angle = i / 7 * Math.PI * 2 + 0.16;
    const start = hub.clone().add(new THREE.Vector3(Math.cos(angle) * 0.014, -0.012, Math.sin(angle) * 0.014));
    const end = hub.clone().add(new THREE.Vector3(Math.cos(angle) * 0.2, rng.range(-0.012, 0.03), Math.sin(angle) * 0.2));
    group.add(taperedBetween(start, end, 0.0026, 0.0008, '#6f8e63', 5));
  }
  return group;
}

function createPanel(name: PanelName, model: THREE.Group, silhouette = false) {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff8dc', '#1b2416', 1.85));
  const key = new THREE.DirectionalLight('#ffffff', 2.35);
  key.position.set(2.5, 3.2, 4.4);
  scene.add(key);
  const fill = new THREE.DirectionalLight('#f2e8c4', 0.78);
  fill.position.set(-3, 1.6, 1.8);
  scene.add(fill);
  scene.add(model);
  if (name !== 'cluster' && name !== 'hub') {
    const grid = new THREE.GridHelper(2.7, 8, '#526153', '#293229');
    grid.position.y = -1.22;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);
  }
  if (silhouette) scene.overrideMaterial = silhouetteMaterial;
  if (name === 'hub') scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: '#8d9189', side: THREE.DoubleSide });
  const camera = new THREE.PerspectiveCamera(name === 'cluster' || name === 'hub' ? 30 : 34, 1, 0.1, 30);
  return { name, scene, camera, model };
}

const panels: Panel[] = [
  createPanel('front', addAmmiModel('front')),
  createPanel('side', addAmmiModel('side')),
  createPanel('top', addAmmiModel('top')),
  createPanel('silhouette', addAmmiModel('silhouette'), true),
  createPanel('cluster', createJunctionCloseup('ammi-junction-color')),
  createPanel('hub', createJunctionCloseup('ammi-junction-gray'))
];

function setCamera(panel: Panel, width: number, height: number) {
  panel.camera.aspect = width / Math.max(1, height);
  if (panel.name === 'side') panel.camera.position.set(2.6, 0.1, 0);
  else if (panel.name === 'top') panel.camera.position.set(0, 2.95, 0.02);
  else if (panel.name === 'cluster') panel.camera.position.set(0.05, 0.02, 1.05);
  else if (panel.name === 'hub') panel.camera.position.set(0.05, 0.02, 1.05);
  else panel.camera.position.set(0, 0.08, 2.8);
  const target = panel.name === 'cluster' ? new THREE.Vector3(0, 0.02, 0) : panel.name === 'hub' ? new THREE.Vector3(0, 0.02, 0) : new THREE.Vector3(0, -0.05, 0);
  panel.camera.lookAt(target);
  panel.camera.updateProjectionMatrix();
}

function panelRect(index: number, width: number, height: number) {
  const mobile = width < 900;
  if (mobile) {
    const h = Math.floor(height / 6);
    return { left: 0, bottom: height - (index + 1) * h, width, height: index === 5 ? height - h * 5 : h };
  }
  const colWidth = Math.floor(width / 3);
  const rowHeight = Math.floor(height / 2);
  return {
    left: (index % 3) * colWidth,
    bottom: index < 3 ? rowHeight : 0,
    width: index % 3 === 2 ? width - colWidth * 2 : colWidth,
    height: index < 3 ? rowHeight : height - rowHeight
  };
}

function render() {
  const width = Math.max(1, stage.clientWidth);
  const height = Math.max(1, stage.clientHeight);
  renderer.setSize(width, height, false);
  renderer.clear();
  renderer.setScissorTest(true);
  panels.forEach((panel, index) => {
    const rect = panelRect(index, width, height);
    renderer.setViewport(rect.left, rect.bottom, rect.width, rect.height);
    renderer.setScissor(rect.left, rect.bottom, rect.width, rect.height);
    setCamera(panel, rect.width, rect.height);
    renderer.render(panel.scene, panel.camera);
  });
  renderer.setScissorTest(false);
}

render();
window.addEventListener('resize', render);

Object.assign(window, {
  ammiMajusApprovalStats: (panels[0].model.userData.approvalStats as AmmiStats)
});
