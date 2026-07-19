type Point = {
  x: number;
  y: number;
};

type LeafKind = 'strap' | 'palmate';
type PalmateVariant = 'current-m2b' | 't1-traced';

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

function catmullRomToBezierPath(points: readonly Point[], closed = true) {
  if (points.length < 2) return '';

  const command = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  const count = points.length;
  const lastIndex = count - 1;

  for (let index = 0; index < (closed ? count : count - 1); index += 1) {
    const p0 = points[(index - 1 + count) % count];
    const p1 = points[index % count];
    const p2 = points[(index + 1) % count];
    const p3 = points[(index + 2) % count];

    if (!closed && index === 0) {
      const c1 = { x: p1.x + (p2.x - p1.x) / 6, y: p1.y + (p2.y - p1.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      command.push(`C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
      continue;
    }

    if (!closed && index === lastIndex - 1) {
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p2.x - p1.x) / 6, y: p2.y - (p2.y - p1.y) / 6 };
      command.push(`C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
      continue;
    }

    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    command.push(`C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
  }

  if (closed) command.push('Z');
  return command.join(' ');
}

type StrapVariant = 'current-c2' | 'd1-shouldered' | 'd2-late-taper' | 'd3-natural-asymmetry';

const strapWidthLandmarks: readonly Point[] = [
  { x: 0, y: 0.74 },
  { x: 0.04, y: 0.82 },
  { x: 0.1, y: 0.93 },
  { x: 0.16, y: 1 },
  { x: 0.32, y: 0.98 },
  { x: 0.5, y: 0.95 },
  { x: 0.68, y: 0.88 },
  { x: 0.8, y: 0.72 },
  { x: 0.9, y: 0.44 },
  { x: 0.96, y: 0.18 },
  { x: 1, y: 0 }
];

function strapWidthRatioAt(y: number) {
  for (let index = 0; index < strapWidthLandmarks.length - 1; index += 1) {
    const current = strapWidthLandmarks[index];
    const next = strapWidthLandmarks[index + 1];
    if (y >= current.x && y <= next.x) {
      return mix(current.y, next.y, smoothstep(current.x, next.x, y));
    }
  }
  return y <= 0 ? strapWidthLandmarks[0].y : 0;
}

function makeLandmarkStrapPath(variant: Exclude<StrapVariant, 'current-c2'>) {
  const length = 560;
  const maxWidth = variant === 'd1-shouldered' ? 92 : variant === 'd2-late-taper' ? 88 : 90;
  const ySamples = [0, 0.04, 0.1, 0.16, 0.24, 0.32, 0.42, 0.5, 0.58, 0.68, 0.74, 0.8, 0.86, 0.9, 0.94, 0.96, 0.985];
  const centerAt = (y: number) => {
    if (variant === 'd3-natural-asymmetry') return Math.sin(y * Math.PI * 0.9 - 0.18) * 2.2 + smoothstep(0.72, 1, y) * 2.6;
    if (variant === 'd1-shouldered') return Math.sin(y * Math.PI * 0.75 + 0.1) * 0.8 + smoothstep(0.82, 1, y) * 1.1;
    return Math.sin(y * Math.PI * 0.82 - 0.08) * 1.4 + smoothstep(0.76, 1, y) * 1.8;
  };
  const leftScaleAt = (y: number) => {
    if (variant === 'd3-natural-asymmetry') return 1 + Math.sin(y * Math.PI * 1.55 + 0.45) * 0.035 - smoothstep(0.68, 0.96, y) * 0.018;
    if (variant === 'd1-shouldered') return 1 + smoothstep(0, 0.08, y) * 0.035 - smoothstep(0.84, 0.98, y) * 0.02;
    return 1 + Math.sin(y * Math.PI * 1.2 + 0.35) * 0.018;
  };
  const rightScaleAt = (y: number) => {
    if (variant === 'd3-natural-asymmetry') return 1 + Math.sin(y * Math.PI * 1.35 + 2.1) * 0.032 + smoothstep(0.7, 0.92, y) * 0.012;
    if (variant === 'd1-shouldered') return 1 + smoothstep(0.03, 0.14, y) * 0.02 - smoothstep(0.78, 0.96, y) * 0.012;
    return 1 + Math.sin(y * Math.PI * 1.0 + 2.2) * 0.016;
  };
  const tipOffset = variant === 'd3-natural-asymmetry' ? 2.1 : variant === 'd2-late-taper' ? 1.2 : 0.7;
  const left = ySamples.map((y) => {
    const halfWidth = (strapWidthRatioAt(y) * maxWidth * leftScaleAt(y)) / 2;
    return { x: centerAt(y) - halfWidth, y: length * (1 - y) };
  });
  const right = ySamples
    .slice()
    .reverse()
    .map((y) => {
      const halfWidth = (strapWidthRatioAt(y) * maxWidth * rightScaleAt(y)) / 2;
      return { x: centerAt(y) + halfWidth, y: length * (1 - y) };
    });

  const tip = [
    { x: centerAt(0.992) - 1.8, y: 6 },
    { x: tipOffset, y: 0 },
    { x: centerAt(0.992) + 1.8, y: 6 }
  ];
  const base =
    variant === 'd1-shouldered'
      ? [
          { x: 34, y: length + 2 },
          { x: 18, y: length + 6 },
          { x: 2, y: length + 7 },
          { x: -16, y: length + 6 },
          { x: -34, y: length + 2 }
        ]
      : variant === 'd2-late-taper'
        ? [
            { x: 32, y: length + 2 },
            { x: 16, y: length + 5 },
            { x: 0, y: length + 6 },
            { x: -17, y: length + 5 },
            { x: -32, y: length + 2 }
          ]
        : [
            { x: 33, y: length + 2 },
            { x: 18, y: length + 6 },
            { x: 1, y: length + 8 },
            { x: -18, y: length + 7 },
            { x: -33, y: length + 2 }
          ];

  return catmullRomToBezierPath([...left, ...tip, ...right, ...base]);
}

function makeStrapSilhouettePath(variant: StrapVariant) {
  const directPaths: Partial<Record<StrapVariant, string>> = {
    'current-c2': [
      'M -36 571',
      'C -47 548 -45 500 -44 452',
      'C -43 374 -42 292 -39 218',
      'C -36 140 -24 66 -7 18',
      'C 0 1 9 2 14 20',
      'C 28 72 36 142 39 218',
      'C 42 306 41 394 39 474',
      'C 38 525 37 558 31 570',
      'C 12 578 -12 580 -36 571',
      'Z'
    ].join(' ')
  };

  const directPath = directPaths[variant];
  if (directPath) return directPath;
  return makeLandmarkStrapPath(variant as Exclude<StrapVariant, 'current-c2'>);
}

function makeCurrentM2bPoints() {
  return [
    { x: 0, y: 114 },
    { x: 16, y: 122 },
    { x: 44, y: 130 },
    { x: 112, y: 76 },
    { x: 96, y: 48 },
    { x: 122, y: -18 },
    { x: 90, y: -66 },
    { x: 44, y: -138 },
    { x: 0, y: -162 },
    { x: -44, y: -138 },
    { x: -90, y: -66 },
    { x: -122, y: -18 },
    { x: -96, y: 48 },
    { x: -112, y: 76 },
    { x: -44, y: 130 },
    { x: -16, y: 122 }
  ];
}

const palmateTraceLandmarks = {
  petioleInsertion: { x: 0, y: 86 },
  leftBasalShoulder: { x: -38, y: 74 },
  rightBasalShoulder: { x: 38, y: 74 },
  leftLowerLobeTip: { x: -154, y: 34 },
  rightLowerLobeTip: { x: 154, y: 34 },
  leftLowerSinus: { x: -108, y: 6 },
  rightLowerSinus: { x: 108, y: 6 },
  leftUpperLobeTip: { x: -152, y: -86 },
  rightUpperLobeTip: { x: 152, y: -86 },
  leftUpperSinus: { x: -72, y: -86 },
  rightUpperSinus: { x: 72, y: -86 },
  centralLobeTip: { x: 0, y: -170 },
  apexCentreAxis: { x: 0, y: -170 }
} satisfies Record<string, Point>;

const palmateTraceContourPoints: readonly Point[] = [
  palmateTraceLandmarks.petioleInsertion,
  { x: 18, y: 84 },
  palmateTraceLandmarks.rightBasalShoulder,
  { x: 82, y: 62 },
  palmateTraceLandmarks.rightLowerLobeTip,
  { x: 132, y: 24 },
  palmateTraceLandmarks.rightLowerSinus,
  { x: 118, y: -34 },
  palmateTraceLandmarks.rightUpperLobeTip,
  { x: 110, y: -82 },
  palmateTraceLandmarks.rightUpperSinus,
  { x: 52, y: -122 },
  palmateTraceLandmarks.centralLobeTip,
  { x: -52, y: -122 },
  palmateTraceLandmarks.leftUpperSinus,
  { x: -110, y: -82 },
  palmateTraceLandmarks.leftUpperLobeTip,
  { x: -118, y: -34 },
  palmateTraceLandmarks.leftLowerSinus,
  { x: -132, y: 24 },
  palmateTraceLandmarks.leftLowerLobeTip,
  { x: -82, y: 62 },
  palmateTraceLandmarks.leftBasalShoulder,
  { x: -18, y: 84 }
];

function makePalmateContourPoints(variant: PalmateVariant) {
  if (variant === 'current-m2b') return makeCurrentM2bPoints();
  return palmateTraceContourPoints;
}

function makePalmateSilhouettePath(variant: PalmateVariant) {
  return catmullRomToBezierPath(makePalmateContourPoints(variant));
}

function makePalmateTracePath() {
  return catmullRomToBezierPath(palmateTraceContourPoints);
}

function makePalmateTraceLabels() {
  return [
    ['PI', palmateTraceLandmarks.petioleInsertion],
    ['LBS', palmateTraceLandmarks.leftBasalShoulder],
    ['RBS', palmateTraceLandmarks.rightBasalShoulder],
    ['LLT', palmateTraceLandmarks.leftLowerLobeTip],
    ['RLT', palmateTraceLandmarks.rightLowerLobeTip],
    ['LLS', palmateTraceLandmarks.leftLowerSinus],
    ['RLS', palmateTraceLandmarks.rightLowerSinus],
    ['LULT', palmateTraceLandmarks.leftUpperLobeTip],
    ['RULT', palmateTraceLandmarks.rightUpperLobeTip],
    ['LUS', palmateTraceLandmarks.leftUpperSinus],
    ['RUS', palmateTraceLandmarks.rightUpperSinus],
    ['CLT', palmateTraceLandmarks.centralLobeTip],
    ['AXIS', palmateTraceLandmarks.apexCentreAxis]
  ] as const;
}

function polygonArea(points: readonly Point[]) {
  const twiceArea = points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);
  return Math.abs(twiceArea) / 2;
}

function boundsOf(points: readonly Point[]) {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return {
    width: maxX - minX,
    height: maxY - minY
  };
}

function makePalmateMetrics(variant: PalmateVariant) {
  const points = makePalmateContourPoints(variant);
  const finalArea = polygonArea(points);
  const bounds = boundsOf(points);
  const centralBodyWidth = variant === 'current-m2b' ? 180 : 152;
  const upperSinusDepth = variant === 'current-m2b' ? 32 : 66;
  const lowerSinusDepth = variant === 'current-m2b' ? 18 : 32;

  return [
    `blade width / height: ${(bounds.width / bounds.height).toFixed(2)}`,
    `central body width: ${Math.round(centralBodyWidth)} (${Math.round((centralBodyWidth / bounds.width) * 100)}%)`,
    `final silhouette area: ${Math.round(finalArea)}`,
    `area retention ratio: observation only`,
    `upper sinus depth: ${upperSinusDepth}`,
    `lower sinus depth: ${lowerSinusDepth}`,
    `reference method: traced landmarks, no retention gate`
  ];
}

function renderReferenceTrace(svg: SVGSVGElement) {
  const namespace = 'http://www.w3.org/2000/svg';
  const image = document.createElementNS(namespace, 'image');
  image.setAttribute('href', '/assets/leaf-silhouette-lab/reference/acer-platanoides-scanned-leaf-reference-900.jpg');
  image.setAttribute('x', '-152');
  image.setAttribute('y', '-176');
  image.setAttribute('width', '304');
  image.setAttribute('height', '386');
  image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  image.setAttribute('opacity', '0.22');

  const grid = document.createElementNS(namespace, 'g');
  grid.setAttribute('class', 'trace-grid');
  for (let value = -150; value <= 150; value += 50) {
    const vertical = document.createElementNS(namespace, 'line');
    vertical.setAttribute('x1', String(value));
    vertical.setAttribute('x2', String(value));
    vertical.setAttribute('y1', '-175');
    vertical.setAttribute('y2', '155');
    grid.append(vertical);

    const horizontal = document.createElementNS(namespace, 'line');
    horizontal.setAttribute('x1', '-160');
    horizontal.setAttribute('x2', '160');
    horizontal.setAttribute('y1', String(value));
    horizontal.setAttribute('y2', String(value));
    grid.append(horizontal);
  }

  const tracePath = document.createElementNS(namespace, 'path');
  tracePath.setAttribute('class', 'trace-outline');
  tracePath.setAttribute('d', makePalmateTracePath());

  const axis = document.createElementNS(namespace, 'line');
  axis.setAttribute('class', 'trace-axis');
  axis.setAttribute('x1', '0');
  axis.setAttribute('x2', '0');
  axis.setAttribute('y1', '150');
  axis.setAttribute('y2', '-175');

  const landmarkGroup = document.createElementNS(namespace, 'g');
  landmarkGroup.setAttribute('class', 'trace-landmarks');
  makePalmateTraceLabels().forEach(([label, point], index) => {
    const circle = document.createElementNS(namespace, 'circle');
    circle.setAttribute('cx', String(point.x));
    circle.setAttribute('cy', String(point.y));
    circle.setAttribute('r', label === 'PI' || label === 'CLT' ? '5' : '4');
    circle.setAttribute('aria-label', label);
    landmarkGroup.append(circle);

    const text = document.createElementNS(namespace, 'text');
    text.setAttribute('x', String(point.x + (point.x >= 0 ? 7 : -7)));
    text.setAttribute('y', String(point.y + (index % 2 === 0 ? -7 : 13)));
    text.setAttribute('text-anchor', point.x >= 0 ? 'start' : 'end');
    text.textContent = label;
    landmarkGroup.append(text);
  });

  svg.replaceChildren(image, grid, axis, tracePath, landmarkGroup);
}

function renderLeaf(svg: SVGSVGElement, pathData: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', 'leaf-fill');
  path.setAttribute('d', pathData);
  svg.replaceChildren(path);
}

function renderMetrics(container: HTMLElement, metrics: readonly string[]) {
  container.replaceChildren(
    ...metrics.map((line) => {
      const item = document.createElement('li');
      item.textContent = line;
      return item;
    })
  );
}

function setFilter(filter: LeafKind | 'all') {
  document.querySelectorAll<HTMLElement>('[data-specimen]').forEach((element) => {
    const specimen = element.dataset.specimen;
    element.classList.toggle('hidden', filter !== 'all' && specimen !== filter);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  });
}

const strapCurrentC2Svg = document.querySelector<SVGSVGElement>('#strap-current-c2');
const strapD1Svg = document.querySelector<SVGSVGElement>('#strap-d1');
const strapD2Svg = document.querySelector<SVGSVGElement>('#strap-d2');
const strapD3Svg = document.querySelector<SVGSVGElement>('#strap-d3');
const palmateCurrentM2bSvg = document.querySelector<SVGSVGElement>('#palmate-current-m2b');
const palmateReferenceTraceSvg = document.querySelector<SVGSVGElement>('#palmate-reference-trace');
const palmateT1Svg = document.querySelector<SVGSVGElement>('#palmate-t1');
const palmateCurrentM2bMetrics = document.querySelector<HTMLElement>('#palmate-current-m2b-metrics');
const palmateT1Metrics = document.querySelector<HTMLElement>('#palmate-t1-metrics');
if (
  !strapCurrentC2Svg ||
  !strapD1Svg ||
  !strapD2Svg ||
  !strapD3Svg ||
  !palmateCurrentM2bSvg ||
  !palmateReferenceTraceSvg ||
  !palmateT1Svg ||
  !palmateCurrentM2bMetrics ||
  !palmateT1Metrics
) {
  throw new Error('Leaf Silhouette Lab SVG targets are missing.');
}

renderLeaf(strapCurrentC2Svg, makeStrapSilhouettePath('current-c2'));
renderLeaf(strapD1Svg, makeStrapSilhouettePath('d1-shouldered'));
renderLeaf(strapD2Svg, makeStrapSilhouettePath('d2-late-taper'));
renderLeaf(strapD3Svg, makeStrapSilhouettePath('d3-natural-asymmetry'));
renderLeaf(palmateCurrentM2bSvg, makePalmateSilhouettePath('current-m2b'));
renderReferenceTrace(palmateReferenceTraceSvg);
renderLeaf(palmateT1Svg, makePalmateSilhouettePath('t1-traced'));
renderMetrics(palmateCurrentM2bMetrics, makePalmateMetrics('current-m2b'));
renderMetrics(palmateT1Metrics, makePalmateMetrics('t1-traced'));

const searchParams = new URLSearchParams(window.location.search);
const requestedLeaf = searchParams.get('leaf');
const initialFilter = requestedLeaf === 'strap' || requestedLeaf === 'palmate' ? requestedLeaf : 'all';

document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const nextFilter = button.dataset.filter === 'strap' || button.dataset.filter === 'palmate' ? button.dataset.filter : 'all';
    if (nextFilter === 'all') searchParams.delete('leaf');
    else searchParams.set('leaf', nextFilter);
    window.history.replaceState(null, '', `${window.location.pathname}?${searchParams.toString()}`);
    setFilter(nextFilter);
  });
});

setFilter(initialFilter);
