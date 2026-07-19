import * as THREE from 'three';

type ViewMode = 'front' | 'side' | 'top' | 'perspective' | 'base' | 'base-side' | 'base-top' | 'section';
type MaterialMode = 'normal' | 'silhouette' | 'wireframe';

type LeafSpec = {
  name: string;
  age: 'mature' | 'young';
  yaw: number;
  spread: number;
  lean: number;
  lengthScale: number;
  widthScale: number;
  forwardBend: number;
  tipDroop: number;
  twist: number;
  sheathOffset: number;
  sheathLength: number;
  transitionEnd: number;
  sheathClosure: number;
  bladeClosure: number;
  rootLift: number;
  rootDepth: number;
  rootSlope: number;
  rootArc: number;
};

const canvas = document.querySelector<HTMLCanvasElement>('#strap-canvas');
if (!canvas) throw new Error('Strap 3D Mini Lab canvas is missing.');
const canvasElement = canvas;

const infoPanel = document.querySelector<HTMLElement>('#info');
const params = new URLSearchParams(window.location.search);
const requestedView = params.get('view');
const view: ViewMode =
  requestedView === 'side' ||
  requestedView === 'top' ||
  requestedView === 'perspective' ||
  requestedView === 'base' ||
  requestedView === 'base-side' ||
  requestedView === 'base-top' ||
  requestedView === 'section' ||
  requestedView === 'front'
    ? requestedView
    : 'perspective';
const requestedMode = params.get('mode');
const mode: MaterialMode = requestedMode === 'silhouette' || requestedMode === 'wireframe' || requestedMode === 'normal' ? requestedMode : 'normal';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11170f);

const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
let renderer: THREE.WebGLRenderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: canvasElement, antialias: true, alpha: false, powerPreference: 'high-performance' });
} catch (error) {
  if (infoPanel) {
    infoPanel.textContent = [
      'Strap 3D Mini Lab',
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
  color: mode === 'silhouette' ? 0x020402 : 0x496f32,
  roughness: 0.78,
  metalness: 0.02,
  side: THREE.DoubleSide
});
const baseMaterial = new THREE.MeshStandardMaterial({
  color: mode === 'silhouette' ? 0x020402 : 0x36522a,
  roughness: 0.86,
  metalness: 0
});
const sectionMaterial = new THREE.MeshStandardMaterial({
  color: mode === 'silhouette' ? 0x020402 : 0x9fc17c,
  roughness: 0.72,
  metalness: 0
});

if (mode === 'wireframe') {
  leafMaterial.wireframe = true;
  baseMaterial.wireframe = true;
  sectionMaterial.wireframe = true;
}

scene.add(new THREE.HemisphereLight(0xe8f6dc, 0x172210, mode === 'silhouette' ? 1.25 : 1.8));
const keyLight = new THREE.DirectionalLight(0xffffff, mode === 'silhouette' ? 0.25 : 2.4);
keyLight.position.set(5, 8, 7);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0xbddca0, mode === 'silhouette' ? 0.15 : 0.7);
rimLight.position.set(-5, 4, -6);
scene.add(rimLight);

const root = new THREE.Group();
scene.add(root);

const widthLandmarks = [
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

function d2WidthRatio(t: number) {
  for (let index = 0; index < widthLandmarks.length - 1; index += 1) {
    const [aT, aW] = widthLandmarks[index];
    const [bT, bW] = widthLandmarks[index + 1];
    if (t >= aT && t <= bT) return mix(aW, bW, smoothstep(aT, bT, t));
  }
  return t <= 0 ? widthLandmarks[0][1] : 0;
}

function createD2StrapLeafGeometry(spec: LeafSpec) {
  const length = 5.6 * spec.lengthScale;
  const maxWidth = 0.64 * spec.widthScale;
  const lengthSegments = 72;
  const widthSegments = 16;
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const rowStride = widthSegments + 1;

  for (let side = 0; side < 2; side += 1) {
    const sideSign = side === 0 ? 1 : -1;
    for (let iy = 0; iy <= lengthSegments; iy += 1) {
      const t = iy / lengthSegments;
      const transition = smoothstep(spec.sheathLength, spec.transitionEnd, t);
      const basalProgress = smoothstep(0, spec.sheathLength, t);
      const basalGather = 1 - smoothstep(0, spec.transitionEnd, t);
      const rootFade = 1 - smoothstep(0, 0.11, t);
      const youngFold = spec.age === 'young' ? 0.08 * (1 - smoothstep(0.28, 0.82, t)) : 0;
      const sheathWidth = spec.age === 'young' ? 0.48 : 0.72;
      const widthScale = mix(sheathWidth, 1, transition) - youngFold;
      const width = Math.max(0.012, d2WidthRatio(t) * maxWidth * widthScale);
      const closure = mix(spec.sheathClosure, spec.bladeClosure, transition);
      const centerShift = Math.sin(t * Math.PI * 0.92 + spec.yaw * 0.7) * 0.035 + smoothstep(0.74, 1, t) * 0.035 * Math.sign(spec.yaw || 1);
      const axisTwist = Math.sin(t * Math.PI) * spec.twist;
      const bend = Math.sin(t * Math.PI * 0.5) * spec.forwardBend - Math.pow(t, 2.6) * spec.tipDroop;
      const baseY = spec.rootLift * rootFade + spec.rootArc * rootFade * Math.sin(Math.PI * basalProgress);
      const y = length * t - Math.pow(t, 2.15) * spec.tipDroop * 0.38 - basalGather * 0.06 + baseY;

      for (let ix = 0; ix <= widthSegments; ix += 1) {
        const u = ix / widthSegments;
        const signed = u * 2 - 1;
        const edge = Math.abs(signed);
        const edgeFade = Math.pow(edge, 2.45);
        const xRaw = signed * width * 0.5;
        const basalShoulder = 1 + basalGather * 0.08 * Math.sin(Math.PI * basalProgress) * Math.sign(signed + 0.01) * Math.sign(spec.yaw || 1);
        const nestedPinch = 1 - basalGather * closure * (0.08 + 0.06 * edge);
        const x = centerShift * (1 - basalGather * 0.45) + xRaw * basalShoulder * nestedPinch * Math.cos(axisTwist);
        const lateralTwist = xRaw * Math.sin(axisTwist) * 0.12;
        const longitudinalBlend = smoothstep(0, 0.08, t) * (1 - smoothstep(0.92, 1, t));
        const shallowGroove = -0.009 * (1 - edgeFade) * longitudinalBlend;
        const rootEdgeLift = rootFade * (edge * 0.052 + spec.rootSlope * signed);
        const sheathCup = closure * Math.pow(edge, 1.65) * mix(0.28, 0.13, transition);
        const rootDepth = rootFade * spec.rootDepth * (0.55 + 0.45 * (1 - edge));
        const bottomRib = (0.026 + closure * 0.012) * (1 - edgeFade) * (0.7 + 0.3 * (1 - t));
        const laminaThickness = 0.006 + 0.02 * (1 - edgeFade) * (0.55 + 0.45 * (1 - t));
        const basalBackWrap = basalGather * Math.sign(spec.yaw || 1) * signed * 0.025;
        const topZ = bend + lateralTwist + shallowGroove + sheathCup + edge * 0.004 + basalBackWrap + rootDepth;
        const bottomZ = bend + lateralTwist - laminaThickness - bottomRib + sheathCup * 0.62 + basalBackWrap + rootDepth;
        positions.push(x, y + rootEdgeLift, side === 0 ? topZ : bottomZ);
        normals.push(0, 0, sideSign);
      }
    }
  }

  const makeIndex = (side: number, iy: number, ix: number) => side * (lengthSegments + 1) * rowStride + iy * rowStride + ix;
  for (let side = 0; side < 2; side += 1) {
    for (let iy = 0; iy < lengthSegments; iy += 1) {
      for (let ix = 0; ix < widthSegments; ix += 1) {
        const a = makeIndex(side, iy, ix);
        const b = makeIndex(side, iy + 1, ix);
        const c = makeIndex(side, iy + 1, ix + 1);
        const d = makeIndex(side, iy, ix + 1);
        if (side === 0) indices.push(a, b, d, b, c, d);
        else indices.push(a, d, b, b, d, c);
      }
    }
  }

  for (let iy = 0; iy < lengthSegments; iy += 1) {
    for (const ix of [0, widthSegments]) {
      const topA = makeIndex(0, iy, ix);
      const topB = makeIndex(0, iy + 1, ix);
      const bottomA = makeIndex(1, iy, ix);
      const bottomB = makeIndex(1, iy + 1, ix);
      if (ix === 0) indices.push(topA, bottomA, topB, topB, bottomA, bottomB);
      else indices.push(topA, topB, bottomA, topB, bottomB, bottomA);
    }
  }

  for (let ix = 0; ix < widthSegments; ix += 1) {
    const topA = makeIndex(0, lengthSegments, ix);
    const topB = makeIndex(0, lengthSegments, ix + 1);
    const bottomA = makeIndex(1, lengthSegments, ix);
    const bottomB = makeIndex(1, lengthSegments, ix + 1);
    indices.push(topA, topB, bottomA, topB, bottomB, bottomA);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function createLeaf(spec: LeafSpec) {
  const mesh = new THREE.Mesh(createD2StrapLeafGeometry(spec), leafMaterial);
  mesh.rotation.order = 'YXZ';
  mesh.rotation.y = spec.yaw;
  mesh.rotation.x = spec.lean;
  mesh.rotation.z = spec.spread;
  mesh.position.set(Math.sin(spec.yaw) * spec.sheathOffset, 0.02, Math.cos(spec.yaw) * spec.sheathOffset * 0.42 + spec.rootDepth * 0.35);
  mesh.name = spec.name;
  return mesh;
}

const leafSpecs: LeafSpec[] = [
  {
    name: 'central-upright',
    age: 'mature',
    yaw: 0.02,
    spread: 0.01,
    lean: -0.05,
    lengthScale: 1.06,
    widthScale: 0.78,
    forwardBend: 0.12,
    tipDroop: 0.18,
    twist: 0.012,
    sheathOffset: 0.018,
    sheathLength: 0.14,
    transitionEnd: 0.3,
    sheathClosure: 0.58,
    bladeClosure: 0.08,
    rootLift: 0.02,
    rootDepth: -0.045,
    rootSlope: 0.01,
    rootArc: 0.018
  },
  {
    name: 'left-major',
    age: 'mature',
    yaw: -0.98,
    spread: 0.24,
    lean: -0.2,
    lengthScale: 1,
    widthScale: 0.76,
    forwardBend: 0.23,
    tipDroop: 0.3,
    twist: -0.04,
    sheathOffset: 0.055,
    sheathLength: 0.15,
    transitionEnd: 0.31,
    sheathClosure: 0.52,
    bladeClosure: 0.1,
    rootLift: -0.035,
    rootDepth: 0.025,
    rootSlope: -0.018,
    rootArc: 0.026
  },
  {
    name: 'right-major',
    age: 'mature',
    yaw: 0.96,
    spread: -0.22,
    lean: -0.18,
    lengthScale: 0.98,
    widthScale: 0.74,
    forwardBend: 0.21,
    tipDroop: 0.27,
    twist: 0.038,
    sheathOffset: 0.06,
    sheathLength: 0.15,
    transitionEnd: 0.3,
    sheathClosure: 0.54,
    bladeClosure: 0.1,
    rootLift: 0.035,
    rootDepth: -0.005,
    rootSlope: 0.02,
    rootArc: 0.022
  },
  {
    name: 'front-inner',
    age: 'young',
    yaw: 0.38,
    spread: -0.05,
    lean: -0.4,
    lengthScale: 0.7,
    widthScale: 0.58,
    forwardBend: 0.28,
    tipDroop: 0.24,
    twist: 0.022,
    sheathOffset: 0.018,
    sheathLength: 0.2,
    transitionEnd: 0.42,
    sheathClosure: 0.88,
    bladeClosure: 0.48,
    rootLift: 0.015,
    rootDepth: 0.07,
    rootSlope: 0.006,
    rootArc: 0.014
  },
  {
    name: 'rear-inner',
    age: 'young',
    yaw: -0.36,
    spread: 0.06,
    lean: 0.0,
    lengthScale: 0.76,
    widthScale: 0.56,
    forwardBend: 0.04,
    tipDroop: 0.14,
    twist: -0.018,
    sheathOffset: 0.024,
    sheathLength: 0.19,
    transitionEnd: 0.4,
    sheathClosure: 0.84,
    bladeClosure: 0.44,
    rootLift: 0.075,
    rootDepth: -0.08,
    rootSlope: -0.008,
    rootArc: 0.012
  }
];

for (const spec of leafSpecs) root.add(createLeaf(spec));

function addSectionReference() {
  if (view !== 'section') return;
  const section = new THREE.Group();
  section.position.set(-2.8, 1.4, 0.1);
  const shape = new THREE.Shape();
  shape.moveTo(-0.7, 0);
  shape.quadraticCurveTo(-0.18, -0.05, 0, -0.16);
  shape.quadraticCurveTo(0.2, -0.05, 0.7, 0);
  shape.lineTo(0.68, 0.05);
  shape.quadraticCurveTo(0.18, 0.03, 0, 0.01);
  shape.quadraticCurveTo(-0.18, 0.03, -0.68, 0.05);
  shape.closePath();
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), sectionMaterial);
  mesh.rotation.x = -0.15;
  section.add(mesh);
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.42, 8), sectionMaterial);
  label.rotation.z = Math.PI / 2;
  label.position.y = -0.22;
  section.add(label);
  root.add(section);
}

addSectionReference();

function setCamera() {
  const aspect = canvasElement.clientWidth / Math.max(1, canvasElement.clientHeight);
  camera.aspect = aspect;
  camera.updateProjectionMatrix();

  if (view === 'front') camera.position.set(0, 3.1, 10.5);
  else if (view === 'side') camera.position.set(9.5, 3.2, 0.1);
  else if (view === 'top') camera.position.set(0.1, 11.5, 0.1);
  else if (view === 'base') camera.position.set(0, 1.6, 4.2);
  else if (view === 'base-side') camera.position.set(4.2, 1.55, 0.05);
  else if (view === 'base-top') camera.position.set(0.05, 8.2, 0.05);
  else if (view === 'section') camera.position.set(0, 2.7, 8.8);
  else camera.position.set(6.2, 4.5, 8);

  const target = view === 'base' || view === 'base-side' || view === 'base-top' ? new THREE.Vector3(0, 0.55, 0) : new THREE.Vector3(0, 2.75, 0);
  if (view === 'top' || view === 'base-top') {
    camera.up.set(0, 0, -1);
    camera.lookAt(view === 'base-top' ? new THREE.Vector3(0, 0.35, 0) : new THREE.Vector3(0, 0.8, 0));
  } else {
    camera.up.set(0, 1, 0);
    camera.lookAt(target);
  }
}

function resize() {
  const width = canvasElement.clientWidth;
  const height = canvasElement.clientHeight;
  renderer.setSize(width, height, false);
  setCamera();
}

function render() {
  if (view === 'perspective') root.rotation.y += 0.0025;
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

window.addEventListener('resize', resize);
resize();
render();

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
  const buttonView = button.dataset.view || 'perspective';
  button.setAttribute('aria-pressed', String(buttonView === view));
  button.addEventListener('click', () => {
    params.set('view', buttonView);
    window.location.search = params.toString();
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
  const buttonMode = button.dataset.mode || 'normal';
  button.setAttribute('aria-pressed', String(buttonMode === mode));
  button.addEventListener('click', () => {
    params.set('mode', buttonMode);
    window.location.search = params.toString();
  });
});

if (infoPanel) {
  infoPanel.textContent = [
    'Strap 3D Mini Lab',
    'baseline: D2 silhouette only',
    `view: ${view}`,
    `mode: ${mode}`,
    `leafCount: ${leafSpecs.length}`,
    'cluster: common sheathing base',
    'section: thick midrib / thin edges',
    '',
    ...leafSpecs.map((spec) => `${spec.name}: yaw ${spec.yaw.toFixed(2)}, lean ${spec.lean.toFixed(2)}, length ${spec.lengthScale}`)
  ].join('\n');
}
