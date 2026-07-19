import * as THREE from 'three';

type ViewMode = 'front' | 'back' | 'side' | 'top' | 'perspective' | 'base-detail' | 'section';
type MaterialMode = 'normal' | 'silhouette' | 'wireframe';

type Point = {
  x: number;
  y: number;
};

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

// Frozen T1 traced blade outline from Leaf Silhouette Lab, mapped to local +Y apex space.
const t1TracePixels: readonly Point[] = [
  { x: 0, y: 86 },
  { x: 18, y: 84 },
  { x: 38, y: 74 },
  { x: 82, y: 62 },
  { x: 154, y: 34 },
  { x: 132, y: 24 },
  { x: 108, y: 6 },
  { x: 118, y: -34 },
  { x: 152, y: -86 },
  { x: 110, y: -82 },
  { x: 72, y: -86 },
  { x: 52, y: -122 },
  { x: 0, y: -170 },
  { x: -52, y: -122 },
  { x: -72, y: -86 },
  { x: -110, y: -82 },
  { x: -152, y: -86 },
  { x: -118, y: -34 },
  { x: -108, y: 6 },
  { x: -132, y: 24 },
  { x: -154, y: 34 },
  { x: -82, y: 62 },
  { x: -38, y: 74 },
  { x: -18, y: 84 }
];

const traceScale = 1 / 48;
const petioleInsertion = new THREE.Vector2(0, -86 * traceScale);

function sampleClosedCatmull(points: readonly Point[], samplesPerSegment = 5) {
  const sampled: THREE.Vector2[] = [];
  const count = points.length;
  for (let index = 0; index < count; index += 1) {
    const p0 = points[(index - 1 + count) % count];
    const p1 = points[index];
    const p2 = points[(index + 1) % count];
    const p3 = points[(index + 2) % count];
    for (let sample = 0; sample < samplesPerSegment; sample += 1) {
      const t = sample / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      sampled.push(new THREE.Vector2(x * traceScale, -y * traceScale));
    }
  }
  return sampled;
}

const bladeContour = sampleClosedCatmull(t1TracePixels);

// Replace only the tiny basal closure with a continuous, flattened petiole transition.
// The visible T1 blade outline above both basal shoulders remains unchanged.
const integratedContour = [
  ...bladeContour.slice(5, 116),
  new THREE.Vector2(-0.29, -1.9),
  new THREE.Vector2(-0.2, -2.08),
  new THREE.Vector2(-0.13, -2.31),
  new THREE.Vector2(-0.105, -2.62),
  new THREE.Vector2(-0.085, -2.72),
  new THREE.Vector2(0, -2.75),
  new THREE.Vector2(0.085, -2.72),
  new THREE.Vector2(0.105, -2.62),
  new THREE.Vector2(0.13, -2.31),
  new THREE.Vector2(0.2, -2.08),
  new THREE.Vector2(0.29, -1.9)
];

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

const primaryStart = new THREE.Vector2(0, -1.68);
const primaryVeins: readonly PrimaryVein[] = [
  { target: new THREE.Vector2(0, 3.54), control: new THREE.Vector2(-0.04, 0.7), strength: 0.0048, width: 0.115 },
  { target: new THREE.Vector2(3.16, 1.79), control: new THREE.Vector2(0.84, 0.5), strength: 0.0032, width: 0.13 },
  { target: new THREE.Vector2(-3.16, 1.79), control: new THREE.Vector2(-0.78, 0.58), strength: 0.0032, width: 0.13 },
  { target: new THREE.Vector2(3.2, -0.71), control: new THREE.Vector2(1.1, -0.78), strength: 0.0019, width: 0.145 },
  { target: new THREE.Vector2(-3.2, -0.71), control: new THREE.Vector2(-1.02, -0.72), strength: 0.0019, width: 0.145 }
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
  const yT = clamp01((point.y + 1.8) / 5.35);
  const longitudinalArch = Math.sin(yT * Math.PI) * 0.032 * bladeBlend;
  const extremelyShallowCup = Math.pow(Math.abs(point.x) / 3.25, 2) * 0.003 * bladeBlend;
  const { support } = primaryVeinField(point);
  const membraneDrape = -0.036 * (1 - support) * Math.sin(yT * Math.PI) * bladeBlend;

  const centralTipField = tipField(point, primaryVeins[0].target, 0.72);
  const rightUpperTipField = tipField(point, primaryVeins[1].target, 0.7);
  const leftUpperTipField = tipField(point, primaryVeins[2].target, 0.7);
  const centralLift = centralTipField * 0.09;
  const rightUpperLift = rightUpperTipField * 0.075;
  const leftUpperLift = leftUpperTipField * 0.052;
  const rightLowerDrape = tipField(point, primaryVeins[3].target, 0.62) * -0.1;
  const leftLowerDrape = tipField(point, primaryVeins[4].target, 0.62) * -0.078;
  const upperTwist =
    rightUpperTipField * (point.x - primaryVeins[1].target.x) * 0.07 -
    leftUpperTipField * (point.x - primaryVeins[2].target.x) * 0.052;

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
leaf.name = 'T1 traced palmate blade with integrated flattened petiole';
leaf.visible = view !== 'section';
root.add(leaf);

const sectionSamples = createSectionSamples();
root.add(sectionSamples);

const bladeWidth = 6.42;
const bladeHeight = 5.33;
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
    'baseline: T1 traced silhouette (blade outline frozen)',
    `view / mode: ${view} / ${mode}`,
    `blade width / height: ${bladeWidth.toFixed(2)} / ${bladeHeight.toFixed(2)}`,
    `petiole length: ${petioleLength.toFixed(2)} (flattened + integrated transition)`,
    `thickness range: ${thicknessRange}`,
    'meshTopology: subdivided + relaxed continuous surface, no centre fan',
    'hasPrimaryRelief: yes, extremely shallow and graded',
    'venation relief: central > upper lateral > lower lateral',
    'surfaceForm: slight longitudinal arch / lobe-local drape / minimal global cup',
    view === 'section'
      ? 'section display: mid-blade (left) + basal transition (right); vertical scale x9'
      : 'section display: available via section view',
    "prototypeStatus: '3d-mini-lab-not-system-integrated'"
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

