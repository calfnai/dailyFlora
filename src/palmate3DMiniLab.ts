import * as THREE from 'three';
import {
  PALMATE_MAJOR_STRUCTURE_BASELINE_ID,
  PALMATE_MAJOR_STRUCTURE_LANDMARKS,
  samplePalmateMajorStructure
} from './palmateMajorStructure';

type ViewMode = 'front' | 'back' | 'side' | 'top' | 'perspective' | 'base-detail' | 'section';
type MaterialMode = 'normal' | 'silhouette' | 'wireframe';

type Triangle = [number, number, number];

type PlanarMesh = {
  points: THREE.Vector2[];
  triangles: Triangle[];
  boundary: number[];
};

type PrimaryVein = {
  target: THREE.Vector2;
  control: THREE.Vector2;
  strength: number;
  width: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('#palmate-canvas');
if (!canvas) throw new Error('Palmate 3D Mini Lab canvas is missing.');
const canvasElement = canvas;

const infoPanel = document.querySelector<HTMLElement>('#info');
const params = new URLSearchParams(window.location.search);
const requestedView = params.get('view');
const view: ViewMode =
  requestedView === 'front' ||
  requestedView === 'back' ||
  requestedView === 'side' ||
  requestedView === 'top' ||
  requestedView === 'perspective' ||
  requestedView === 'base-detail' ||
  requestedView === 'section'
    ? requestedView
    : 'perspective';
const requestedMode = params.get('mode');
const mode: MaterialMode = requestedMode === 'normal' || requestedMode === 'silhouette' || requestedMode === 'wireframe' ? requestedMode : 'normal';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x10160f);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  if (infoPanel) {
    infoPanel.textContent = [
      'Palmate 3D Mini Lab',
      'WebGL context failed in this browser/runtime.',
      'The source is valid, but this environment disabled WebGL.',
      error instanceof Error ? error.message : String(error)
    ].join('\n');
  }
  throw error;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const leafMaterial = new THREE.MeshStandardMaterial({
  color: mode === 'silhouette' ? 0x020402 : 0x4b7334,
  roughness: 0.86,
  metalness: 0.005,
  side: THREE.DoubleSide
});
const sectionMaterial = new THREE.MeshStandardMaterial({
  color: mode === 'silhouette' ? 0x020402 : 0xa7c889,
  roughness: 0.78,
  metalness: 0,
  side: THREE.DoubleSide
});

if (mode === 'wireframe') {
  leafMaterial.wireframe = true;
  sectionMaterial.wireframe = true;
}

scene.add(new THREE.HemisphereLight(0xe8f6dc, 0x172210, mode === 'silhouette' ? 1.3 : 1.65));
const keyLight = new THREE.DirectionalLight(0xffffff, mode === 'silhouette' ? 0.25 : 2.15);
keyLight.position.set(5, 7, 8);
scene.add(keyLight);
const backLight = new THREE.DirectionalLight(0xd9efc5, mode === 'silhouette' ? 0.15 : 1.15);
backLight.position.set(-4, 3, -7);
scene.add(backLight);
const baseLight = new THREE.DirectionalLight(0xb7d99e, mode === 'silhouette' ? 0.12 : 0.55);
baseLight.position.set(1, -6, 4);
scene.add(baseLight);
const grazingLight = new THREE.DirectionalLight(0xc9e9b1, mode === 'silhouette' ? 0.08 : 0.9);
grazingLight.position.set(-9, 1.5, 3);
scene.add(grazingLight);

const root = new THREE.Group();
scene.add(root);

// The owner-approved 24-landmark Major Structure Envelope is the immutable
// front-outline source. The petiole transition replaces only its basal closure.
const referencePetiole = PALMATE_MAJOR_STRUCTURE_LANDMARKS[0];
const referenceCenterX = referencePetiole.x;
const referenceScale = 5.35 / 366;
const bladeBaseY = -1.66;
const toLocal = (point: { x: number; y: number }) =>
  new THREE.Vector2(
    (point.x - referenceCenterX) * referenceScale,
    bladeBaseY + (referencePetiole.y - point.y) * referenceScale
  );

const sampledMajorEnvelope = samplePalmateMajorStructure(7);
const samplesPerSegment = 7;
const rightBasalStart = samplesPerSegment;
const leftBasalStart = samplesPerSegment * (PALMATE_MAJOR_STRUCTURE_LANDMARKS.length - 1);
const bladeContour = [
  ...sampledMajorEnvelope.slice(rightBasalStart, leftBasalStart).map(toLocal),
  toLocal(PALMATE_MAJOR_STRUCTURE_LANDMARKS[23])
];
const petioleInsertion = toLocal(referencePetiole);

const integratedContour = [
  ...bladeContour,
  new THREE.Vector2(-0.76, -1.87),
  new THREE.Vector2(-0.39, -2.03),
  new THREE.Vector2(-0.17, -2.28),
  new THREE.Vector2(-0.11, -2.57),
  new THREE.Vector2(-0.085, -2.69),
  new THREE.Vector2(0, -2.73),
  new THREE.Vector2(0.085, -2.69),
  new THREE.Vector2(0.11, -2.57),
  new THREE.Vector2(0.17, -2.28),
  new THREE.Vector2(0.39, -2.03),
  new THREE.Vector2(0.76, -1.87)
];

const landmarkLocal = new Map(
  PALMATE_MAJOR_STRUCTURE_LANDMARKS.map((landmark) => [landmark.id, toLocal(landmark)] as const)
);

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

function distanceToSegment(point: THREE.Vector2, start: THREE.Vector2, end: THREE.Vector2) {
  const segment = new THREE.Vector2().subVectors(end, start);
  const lengthSq = segment.lengthSq();
  if (lengthSq === 0) return point.distanceTo(start);
  const t = clamp01(new THREE.Vector2().subVectors(point, start).dot(segment) / lengthSq);
  const projected = start.clone().add(segment.multiplyScalar(t));
  return point.distanceTo(projected);
}

function distanceToQuadratic(point: THREE.Vector2, start: THREE.Vector2, control: THREE.Vector2, end: THREE.Vector2) {
  let minimum = Number.POSITIVE_INFINITY;
  let previous = start;
  const samples = 18;
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples;
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

const primaryStart = petioleInsertion.clone().add(new THREE.Vector2(0, 0.12));
const veinTarget = (id: number) => landmarkLocal.get(id)?.clone() ?? new THREE.Vector2();
const primaryVeins: readonly PrimaryVein[] = [
  { target: veinTarget(13), control: new THREE.Vector2(-0.03, 0.72), strength: 0.0042, width: 0.12 },
  { target: veinTarget(8), control: new THREE.Vector2(1.08, 0.22), strength: 0.0028, width: 0.14 },
  { target: veinTarget(18), control: new THREE.Vector2(-1.04, 0.18), strength: 0.0028, width: 0.14 },
  { target: veinTarget(4), control: new THREE.Vector2(1.18, -0.92), strength: 0.0016, width: 0.15 },
  { target: veinTarget(22), control: new THREE.Vector2(-1.16, -0.88), strength: 0.0016, width: 0.15 }
];

function primaryVeinField(point: THREE.Vector2) {
  let relief = 0;
  let support = 0;
  for (const vein of primaryVeins) {
    const distance = distanceToQuadratic(point, primaryStart, vein.control, vein.target);
    const influence = gaussian(distance, vein.width);
    relief += influence * vein.strength;
    support = Math.max(support, influence);
  }
  const baseFade = smoothstep(-1.72, -1.36, point.y);
  return { relief: relief * baseFade, support: support * baseFade };
}

function tipField(point: THREE.Vector2, target: THREE.Vector2, radius: number) {
  return gaussian(point.distanceTo(target), radius);
}

function midSurfaceAt(point: THREE.Vector2) {
  const bladeBlend = smoothstep(-1.92, -1.48, point.y);
  const yT = clamp01((point.y + 1.66) / 5.35);
  const longitudinalArch = Math.sin(yT * Math.PI) * 0.026 * bladeBlend;
  const extremelyShallowCup = Math.pow(Math.abs(point.x) / 3.6, 2) * 0.0015 * bladeBlend;
  const { support } = primaryVeinField(point);
  const membraneDrape = -0.042 * (1 - support) * Math.sin(yT * Math.PI) * bladeBlend;

  const centralTipField = tipField(point, primaryVeins[0].target, 0.72);
  const rightUpperTipField = tipField(point, primaryVeins[1].target, 0.7);
  const leftUpperTipField = tipField(point, primaryVeins[2].target, 0.7);
  const centralLift = centralTipField * 0.042;
  const rightUpperLift = rightUpperTipField * 0.052;
  const leftUpperLift = leftUpperTipField * 0.036;
  const rightLowerDrape = tipField(point, primaryVeins[3].target, 0.72) * -0.074;
  const leftLowerDrape = tipField(point, primaryVeins[4].target, 0.72) * -0.058;
  const upperTwist =
    rightUpperTipField * (point.x - primaryVeins[1].target.x) * 0.044 -
    leftUpperTipField * (point.x - primaryVeins[2].target.x) * 0.034;

  const petioleT = clamp01((point.y + 2.79) / 1.05);
  const petioleCurve = (1 - bladeBlend) * (Math.sin(petioleT * Math.PI) * 0.018 - 0.012);

  return (
    longitudinalArch +
    extremelyShallowCup +
    membraneDrape +
    centralLift +
    rightUpperLift +
    leftUpperLift +
    rightLowerDrape +
    leftLowerDrape +
    upperTwist +
    petioleCurve
  );
}

function thicknessAt(point: THREE.Vector2) {
  const edgeDistance = distanceToContour(point, integratedContour);
  const edgeBlend = smoothstep(0, 0.24, edgeDistance);
  const bladeBlend = smoothstep(-1.96, -1.46, point.y);
  const bladeThickness = mix(0.0045, 0.032, edgeBlend);
  const petioleThickness = mix(0.009, 0.044, edgeBlend);
  return mix(petioleThickness, bladeThickness, bladeBlend);
}

function topAndBottomAt(point: THREE.Vector2) {
  const mid = midSurfaceAt(point);
  const thickness = thicknessAt(point);
  const { relief } = primaryVeinField(point);
  return {
    top: mid + thickness * 0.5 - relief * 0.42,
    bottom: mid - thickness * 0.5 - relief * 0.8
  };
}

function signedTriangleArea(points: readonly THREE.Vector2[], triangle: Triangle) {
  const [a, b, c] = triangle.map((index) => points[index]);
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function makeInitialPlanarMesh(contour: readonly THREE.Vector2[]): PlanarMesh {
  const points = contour.map((point) => point.clone());
  const triangles = THREE.ShapeUtils.triangulateShape(points, []).map((face) => {
    const triangle: Triangle = [face[0], face[1], face[2]];
    const oriented: Triangle = signedTriangleArea(points, triangle) >= 0 ? triangle : [triangle[0], triangle[2], triangle[1]];
    return oriented;
  });
  return { points, triangles, boundary: points.map((_, index) => index) };
}

function subdividePlanarMesh(mesh: PlanarMesh, rounds: number): PlanarMesh {
  let current = mesh;
  for (let round = 0; round < rounds; round += 1) {
    const points = current.points.map((point) => point.clone());
    const midpointCache = new Map<string, number>();
    const midpoint = (a: number, b: number) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const cached = midpointCache.get(key);
      if (cached !== undefined) return cached;
      const index = points.length;
      points.push(current.points[a].clone().add(current.points[b]).multiplyScalar(0.5));
      midpointCache.set(key, index);
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

function relaxInteriorPoints(mesh: PlanarMesh, iterations: number, amount: number): PlanarMesh {
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
      average.multiplyScalar(1 / neighbours[index].size);
      next[index].lerp(average, amount);
    }
    points = next;
  }
  return { points, triangles: mesh.triangles, boundary: mesh.boundary };
}

function createPalmateLeafGeometry() {
  const subdivided = subdividePlanarMesh(makeInitialPlanarMesh(integratedContour), 3);
  const planar = relaxInteriorPoints(subdivided, 4, 0.34);
  const positions: number[] = [];
  const indices: number[] = [];
  for (const side of ['top', 'bottom'] as const) {
    for (const point of planar.points) {
      const surfaces = topAndBottomAt(point);
      positions.push(point.x, point.y, surfaces[side]);
    }
  }

  const sideOffset = planar.points.length;
  for (const [a, b, c] of planar.triangles) {
    indices.push(a, b, c);
    indices.push(sideOffset + a, sideOffset + c, sideOffset + b);
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

function createSectionStrip(width: number, displayX: number, displayZ: number, kind: 'mid' | 'basal') {
  const widthSegments = 36;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let side = 0; side < 2; side += 1) {
    for (let index = 0; index <= widthSegments; index += 1) {
      const u = index / widthSegments;
      const signed = u * 2 - 1;
      const edge = Math.abs(signed);
      const x = displayX + signed * width * 0.5;
      const edgeBlend = smoothstep(0.7, 1, edge);
      const thickness = kind === 'mid' ? mix(0.032, 0.0045, edgeBlend) : mix(0.044, 0.009, edgeBlend);
      const mid = kind === 'mid' ? Math.pow(edge, 2) * 0.005 : Math.pow(edge, 1.6) * 0.012;
      const centralRelief = gaussian(Math.abs(signed), kind === 'mid' ? 0.09 : 0.16) * (kind === 'mid' ? 0.0048 : 0.0022);
      const actual = side === 0 ? mid + thickness * 0.5 - centralRelief * 0.42 : mid - thickness * 0.5 - centralRelief * 0.8;
      positions.push(x, -5, displayZ + actual * 9);
    }
  }

  const row = widthSegments + 1;
  for (let index = 0; index < widthSegments; index += 1) {
    const a = index;
    const b = index + 1;
    const c = row + index;
    const d = row + index + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, sectionMaterial);
}

function createSectionSamples() {
  const group = new THREE.Group();
  group.name = 'mid-blade-and-basal-sections';
  group.add(createSectionStrip(3.8, -1.12, 0.48, 'mid'));
  group.add(createSectionStrip(1.3, 2.15, -0.14, 'basal'));
  group.visible = view === 'section';
  return group;
}

const leaf = new THREE.Mesh(createPalmateLeafGeometry(), leafMaterial);
leaf.name = 'Accepted major-structure palmate blade with integrated flattened petiole';
leaf.visible = view !== 'section';
root.add(leaf);

const sectionSamples = createSectionSamples();
root.add(sectionSamples);

const contourBounds = new THREE.Box2().setFromPoints(integratedContour);
const bladeWidth = contourBounds.max.x - contourBounds.min.x;
const bladeHeight = contourBounds.max.y - contourBounds.min.y;
const petioleLength = 1.0;
const thicknessRange = '0.0045-0.044';

function setCamera(nextView: ViewMode) {
  const target = new THREE.Vector3(0, 0.35, 0);
  camera.fov = nextView === 'section' ? 18 : nextView === 'base-detail' ? 24 : 34;
  camera.up.set(0, 1, 0);

  if (nextView === 'front') camera.position.set(0, 0.35, 14);
  if (nextView === 'back') camera.position.set(0, 0.35, -14);
  if (nextView === 'side') camera.position.set(8.5, 0.15, 0.55);
  if (nextView === 'top') {
    camera.position.set(0, 8.8, 0.72);
    camera.up.set(0, 0, 1);
  }
  if (nextView === 'perspective') camera.position.set(7.2, 2.7, 8.4);
  if (nextView === 'base-detail') {
    camera.position.set(2.1, -3.2, 4.4);
    target.set(0, -2.0, -0.01);
  }
  if (nextView === 'section') {
    camera.position.set(0, -17, 0.42);
    target.set(0, -5, 0.2);
    camera.up.set(0, 0, 1);
  }
  camera.lookAt(target);
  camera.updateProjectionMatrix();
}

function updateButtons() {
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
  });
  document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
  });
}

function updateInfo() {
  if (!infoPanel) return;
  infoPanel.textContent = [
    'Palmate 3D Mini Lab',
    `baseline: ${PALMATE_MAJOR_STRUCTURE_BASELINE_ID} (24 landmarks frozen)`,
    `view / mode: ${view} / ${mode}`,
    `blade width / height: ${bladeWidth.toFixed(2)} / ${bladeHeight.toFixed(2)}`,
    `petiole length: ${petioleLength.toFixed(2)} (flattened + integrated transition)`,
    `thickness range: ${thicknessRange}`,
    'meshTopology: subdivided + relaxed continuous surface, no centre fan',
    'hasPrimaryRelief: yes, extremely shallow and graded',
    'venation relief: central > upper lateral > lower lateral',
    'surfaceForm: slight longitudinal arch / interveinal drape / lobe-local pose / minimal global cup',
    view === 'section'
      ? 'section display: mid-blade (left) + basal transition (right); vertical scale x9'
      : 'section display: available via section view',
    "prototypeStatus: 'direction-validated-3d-mini-lab-frozen-not-system-integrated'"
  ].join('\n');
}

function resize() {
  const rect = canvasElement.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
}

function navigate(nextParams: Record<string, string>) {
  const next = new URLSearchParams(window.location.search);
  Object.entries(nextParams).forEach(([key, value]) => next.set(key, value));
  window.location.href = `${window.location.pathname}?${next.toString()}`;
}

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    const nextView = button.dataset.view;
    if (nextView) navigate({ view: nextView });
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => {
    const nextMode = button.dataset.mode;
    if (nextMode) navigate({ mode: nextMode });
  });
});

setCamera(view);
updateButtons();
updateInfo();
window.addEventListener('resize', resize);
resize();
