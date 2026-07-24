type Point = {
  x: number;
  y: number;
};

type LeafKind = 'strap' | 'palmate';

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

const PALMATE_REFERENCE_URL = '/assets/leaf-silhouette-lab/reference/acer-platanoides-scanned-leaf-reference-500.jpg';

// T2 is an explicit clockwise trace in the 500 × 634 reference-image coordinate system.
// These 60 points were placed along the visible blade edge; no edge detector or mirrored half-outline is used.
const palmateT2PreviousRawPoints: readonly Point[] = [
  { x: 260, y: 344 },
  { x: 283, y: 353 },
  { x: 311, y: 351 },
  { x: 329, y: 364 },
  { x: 341, y: 350 },
  { x: 382, y: 354 },
  { x: 390, y: 368 },
  { x: 419, y: 350 },
  { x: 462, y: 339 },
  { x: 498, y: 326 },
  { x: 459, y: 307 },
  { x: 425, y: 278 },
  { x: 409, y: 257 },
  { x: 430, y: 241 },
  { x: 460, y: 220 },
  { x: 488, y: 197 },
  { x: 460, y: 190 },
  { x: 476, y: 145 },
  { x: 455, y: 151 },
  { x: 452, y: 79 },
  { x: 421, y: 95 },
  { x: 392, y: 120 },
  { x: 369, y: 112 },
  { x: 354, y: 153 },
  { x: 327, y: 197 },
  { x: 312, y: 177 },
  { x: 299, y: 135 },
  { x: 288, y: 93 },
  { x: 314, y: 70 },
  { x: 286, y: 76 },
  { x: 265, y: 40 },
  { x: 246, y: 2 },
  { x: 231, y: 29 },
  { x: 211, y: 42 },
  { x: 209, y: 74 },
  { x: 198, y: 119 },
  { x: 176, y: 176 },
  { x: 190, y: 198 },
  { x: 169, y: 177 },
  { x: 158, y: 136 },
  { x: 158, y: 87 },
  { x: 139, y: 101 },
  { x: 127, y: 96 },
  { x: 129, y: 116 },
  { x: 94, y: 113 },
  { x: 59, y: 107 },
  { x: 68, y: 143 },
  { x: 64, y: 175 },
  { x: 44, y: 199 },
  { x: 73, y: 222 },
  { x: 103, y: 241 },
  { x: 104, y: 259 },
  { x: 77, y: 281 },
  { x: 39, y: 306 },
  { x: 1, y: 320 },
  { x: 44, y: 336 },
  { x: 80, y: 349 },
  { x: 126, y: 355 },
  { x: 174, y: 353 },
  { x: 221, y: 350 }
];

// Major-structure review moves only 28 of the existing 60 explicit points.
// Minor serration points that do not decide lobe, sinus, or base mass stay frozen.
const palmateT2MajorStructureEdits = new Map<number, Point>([
  [3, { x: 333, y: 354 }],
  [7, { x: 416, y: 338 }],
  [9, { x: 486, y: 310 }],
  [10, { x: 452, y: 296 }],
  [11, { x: 427, y: 276 }],
  [12, { x: 422, y: 264 }],
  [17, { x: 464, y: 143 }],
  [19, { x: 438, y: 82 }],
  [21, { x: 386, y: 126 }],
  [23, { x: 362, y: 150 }],
  [24, { x: 338, y: 188 }],
  [25, { x: 326, y: 168 }],
  [26, { x: 314, y: 132 }],
  [27, { x: 302, y: 92 }],
  [30, { x: 270, y: 42 }],
  [32, { x: 223, y: 40 }],
  [35, { x: 184, y: 122 }],
  [37, { x: 178, y: 190 }],
  [38, { x: 158, y: 171 }],
  [40, { x: 166, y: 96 }],
  [44, { x: 102, y: 118 }],
  [45, { x: 74, y: 103 }],
  [51, { x: 91, y: 266 }],
  [52, { x: 82, y: 276 }],
  [53, { x: 48, y: 294 }],
  [54, { x: 14, y: 305 }],
  [55, { x: 52, y: 323 }],
  [57, { x: 132, y: 347 }]
]);

const palmateT2DensePoints: readonly Point[] = palmateT2PreviousRawPoints.map((point, index) => ({
  ...(palmateT2MajorStructureEdits.get(index) ?? point)
}));

const palmateOldMajorStructurePointIndices = [
  0, 3, 7, 9, 10, 12, 15, 17, 19, 21, 23, 24, 25, 27, 30, 31, 32, 35, 37, 38, 40, 45, 47, 49, 51, 52, 54, 55, 57, 59
] as const;

const palmateOldMajorStructurePoints = palmateOldMajorStructurePointIndices.map((index) => palmateT2DensePoints[index]);

type PalmateEnvelopeLandmark = Point & {
  id: number;
  label: string;
};

// Independent major-lobe envelope landmarks, placed directly against the reference image.
// They intentionally do not reuse the 60-point trace or any minor serration tip/notch.
const palmateEnvelopeLandmarks: readonly PalmateEnvelopeLandmark[] = [
  { id: 1, x: 258, y: 349, label: 'petiole insertion' },
  { id: 2, x: 318, y: 358, label: 'right basal shoulder' },
  { id: 3, x: 374, y: 365, label: 'right lower lobe lower shoulder' },
  { id: 4, x: 494, y: 325, label: 'right lower lobe tip' },
  { id: 5, x: 444, y: 291, label: 'right lower lobe upper shoulder' },
  { id: 6, x: 408, y: 257, label: 'right lower sinus' },
  { id: 7, x: 468, y: 205, label: 'right upper lobe outer shoulder' },
  { id: 8, x: 451, y: 80, label: 'right upper lobe tip' },
  { id: 9, x: 408, y: 116, label: 'right upper lobe apex shoulder' },
  { id: 10, x: 365, y: 150, label: 'right upper lobe inner shoulder' },
  { id: 11, x: 327, y: 197, label: 'right upper sinus' },
  { id: 12, x: 318, y: 132, label: 'central lobe right shoulder' },
  { id: 13, x: 246, y: 3, label: 'central lobe tip' },
  { id: 14, x: 188, y: 126, label: 'central lobe left shoulder' },
  { id: 15, x: 190, y: 198, label: 'left upper sinus' },
  { id: 16, x: 168, y: 154, label: 'left upper lobe inner shoulder' },
  { id: 17, x: 135, y: 120, label: 'left upper lobe apex shoulder' },
  { id: 18, x: 60, y: 108, label: 'left upper lobe tip' },
  { id: 19, x: 65, y: 176, label: 'left upper lobe outer shoulder' },
  { id: 20, x: 103, y: 241, label: 'left lower sinus' },
  { id: 21, x: 50, y: 287, label: 'left lower lobe upper shoulder' },
  { id: 22, x: 3, y: 320, label: 'left lower lobe tip' },
  { id: 23, x: 118, y: 369, label: 'left lower lobe lower shoulder' },
  { id: 24, x: 188, y: 362, label: 'left basal shoulder' }
];

type PalmatePointRole = 'locked-major-landmark' | 'protected-structural' | 'minor-serration';

type PalmatePointMeta = {
  index: number;
  role: PalmatePointRole;
  label?: string;
};

// The 60-point trace is frozen. These explicit index lists are the only source of
// truth for which points may move during T2a/T2b contour processing.
const palmateLockedMajorLandmarks = [
  { index: 0, role: 'locked-major-landmark', label: 'petiole insertion' },
  { index: 3, role: 'locked-major-landmark', label: 'right basal shoulder' },
  { index: 9, role: 'locked-major-landmark', label: 'right lower lobe tip' },
  { index: 12, role: 'locked-major-landmark', label: 'right lower sinus' },
  { index: 19, role: 'locked-major-landmark', label: 'right upper lobe tip' },
  { index: 24, role: 'locked-major-landmark', label: 'right upper sinus' },
  { index: 31, role: 'locked-major-landmark', label: 'central lobe tip' },
  { index: 37, role: 'locked-major-landmark', label: 'left upper sinus' },
  { index: 45, role: 'locked-major-landmark', label: 'left upper lobe tip' },
  { index: 51, role: 'locked-major-landmark', label: 'left lower sinus' },
  { index: 54, role: 'locked-major-landmark', label: 'left lower lobe tip' },
  { index: 57, role: 'locked-major-landmark', label: 'left basal shoulder' }
] as const satisfies readonly PalmatePointMeta[];

const palmateProtectedStructuralPointIndices = [
  1, 2, 5, 7, 8, 10, 11, 15, 17, 20, 21, 23, 25, 27, 30, 32, 35, 36, 38, 40, 44, 46, 50, 52, 53, 55, 58, 59
] as const;

const palmateMinorSerrationPointIndices = [
  4, 6, 13, 14, 16, 18, 22, 26, 28, 29, 33, 34, 39, 41, 42, 43, 47, 48, 49, 56
] as const;

const palmateRepresentativeSerrationIndices = [13, 16, 18, 22, 26, 29, 34, 39, 42, 47, 49, 56] as const;

const palmatePointMeta: readonly PalmatePointMeta[] = [
  ...palmateLockedMajorLandmarks,
  ...palmateProtectedStructuralPointIndices.map((index) => ({ index, role: 'protected-structural' as const })),
  ...palmateMinorSerrationPointIndices.map((index) => ({ index, role: 'minor-serration' as const }))
].sort((a, b) => a.index - b.index);

if (
  palmatePointMeta.length !== palmateT2DensePoints.length ||
  palmatePointMeta.some((meta, index) => meta.index !== index)
) {
  throw new Error('Palmate T2 point classification must cover each of the 60 trace points exactly once.');
}

const palmatePointMetaByIndex = new Map(palmatePointMeta.map((meta) => [meta.index, meta] as const));
const palmateRepresentativeSerrationSet = new Set<number>(palmateRepresentativeSerrationIndices);

type PalmateMajorReviewZone = {
  id: string;
  label: string;
  viewBox: string;
  landmarkIds: readonly number[];
};

const palmateMajorReviewZones: readonly PalmateMajorReviewZone[] = [
  {
    id: 'central-lobe',
    label: 'central lobe',
    viewBox: '145 0 205 215',
    landmarkIds: [11, 12, 13, 14, 15]
  },
  {
    id: 'left-upper-lobe',
    label: 'left upper lobe',
    viewBox: '38 54 190 202',
    landmarkIds: [14, 15, 16, 17, 18, 19, 20]
  },
  {
    id: 'right-upper-lobe',
    label: 'right upper lobe',
    viewBox: '285 50 190 205',
    landmarkIds: [7, 8, 9, 10, 11, 12]
  },
  {
    id: 'left-lower-lobe-base',
    label: 'left lower lobe and base',
    viewBox: '0 205 250 190',
    landmarkIds: [18, 19, 20, 21, 22, 23, 24]
  },
  {
    id: 'right-lower-lobe-base',
    label: 'right lower lobe and base',
    viewBox: '250 205 250 190',
    landmarkIds: [1, 2, 3, 4, 5, 6, 7]
  },
  {
    id: 'petiole-insertion-basal-edge',
    label: 'petiole insertion and basal edge',
    viewBox: '92 304 325 90',
    landmarkIds: [1, 2, 23, 24]
  }
];

function pointDistance(a: Point, b: Point) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function normalizedDirection(from: Point, to: Point) {
  const distance = pointDistance(from, to) || 1;
  return { x: (to.x - from.x) / distance, y: (to.y - from.y) / distance };
}

function moveTowardBounded(current: Point, target: Point, amount: number, maxDistance: number): Point {
  const dx = (target.x - current.x) * amount;
  const dy = (target.y - current.y) * amount;
  const distance = Math.hypot(dx, dy);
  const scale = distance > maxDistance ? maxDistance / distance : 1;
  return {
    x: current.x + dx * scale,
    y: current.y + dy * scale
  };
}

function localContourTarget(points: readonly Point[], index: number): Point {
  const count = points.length;
  const previous = points[(index - 1 + count) % count];
  const current = points[index];
  const next = points[(index + 1) % count];
  return {
    x: previous.x * 0.25 + current.x * 0.5 + next.x * 0.25,
    y: previous.y * 0.25 + current.y * 0.5 + next.y * 0.25
  };
}

function makeT2aStructuralPoints(points: readonly Point[]) {
  return points.map((point, index) => {
    const meta = palmatePointMetaByIndex.get(index);
    if (!meta || meta.role === 'locked-major-landmark') return { ...point };
    const target = localContourTarget(points, index);
    if (meta.role === 'protected-structural') return moveTowardBounded(point, target, 0.08, 1.25);
    return moveTowardBounded(point, target, 0.62, 6);
  });
}

function makeT2bLightSerrationPoints(rawPoints: readonly Point[], structuralPoints: readonly Point[]) {
  return structuralPoints.map((point, index) => {
    if (!palmateRepresentativeSerrationSet.has(index)) return { ...point };
    const rawPoint = rawPoints[index];
    return {
      x: mix(point.x, rawPoint.x, 0.58),
      y: mix(point.y, rawPoint.y, 0.58)
    };
  });
}

function makeBoundedContourPath(points: readonly Point[]) {
  const commands = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];
  const count = points.length;

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const current = points[index];
    const next = points[(index + 1) % count];
    const afterNext = points[(index + 2) % count];
    const currentRole = palmatePointMetaByIndex.get(index)?.role ?? 'protected-structural';
    const nextRole = palmatePointMetaByIndex.get((index + 1) % count)?.role ?? 'protected-structural';
    const segmentLength = pointDistance(current, next);
    const currentTangent = normalizedDirection(previous, next);
    const nextTangent = normalizedDirection(current, afterNext);
    const handleFor = (role: PalmatePointRole) => {
      if (role === 'locked-major-landmark') return 0;
      if (role === 'protected-structural') return Math.min(segmentLength * 0.07, 2.25);
      return Math.min(segmentLength * 0.11, 3.6);
    };
    const currentHandle = handleFor(currentRole);
    const nextHandle = handleFor(nextRole);
    const c1 = {
      x: current.x + currentTangent.x * currentHandle,
      y: current.y + currentTangent.y * currentHandle
    };
    const c2 = {
      x: next.x - nextTangent.x * nextHandle,
      y: next.y - nextTangent.y * nextHandle
    };
    commands.push(
      `C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`
    );
  }

  commands.push('Z');
  return commands.join(' ');
}

const palmateRejectedT2aPoints = makeT2aStructuralPoints(palmateT2PreviousRawPoints);
const palmateRejectedT2bPoints = makeT2bLightSerrationPoints(
  palmateT2PreviousRawPoints,
  palmateRejectedT2aPoints
);
const palmateRejectedT2aPath = makeBoundedContourPath(palmateRejectedT2aPoints);
const palmateRejectedT2bPath = makeBoundedContourPath(palmateRejectedT2bPoints);

function makeT2LocalSmoothPath(points: readonly Point[]) {
  const commands = [`M ${points[0].x} ${points[0].y}`];
  const count = points.length;

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const current = points[index];
    const next = points[(index + 1) % count];
    const afterNext = points[(index + 2) % count];
    const segmentLength = pointDistance(current, next);
    const currentTangent = normalizedDirection(previous, next);
    const nextTangent = normalizedDirection(current, afterNext);
    const handleLength = Math.min(segmentLength * 0.1, 4.5);
    const c1 = {
      x: current.x + currentTangent.x * handleLength,
      y: current.y + currentTangent.y * handleLength
    };
    const c2 = {
      x: next.x - nextTangent.x * handleLength,
      y: next.y - nextTangent.y * handleLength
    };
    commands.push(`C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${next.x} ${next.y}`);
  }

  commands.push('Z');
  return commands.join(' ');
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

type PalmateCandidateMetrics = {
  lockedLandmarkDisplacement: number;
  maxStructuralPointDisplacement: number;
  meanContourDisplacement: number;
  areaChangeRatio: number;
  widthChangeRatio: number;
  heightChangeRatio: number;
  passed: boolean;
};

function percentChange(candidate: number, baseline: number) {
  return ((candidate - baseline) / baseline) * 100;
}

function makeCandidateMetrics(candidatePoints: readonly Point[], baselinePoints: readonly Point[]): PalmateCandidateMetrics {
  const rawBounds = boundsOf(baselinePoints);
  const candidateBounds = boundsOf(candidatePoints);
  const displacements = candidatePoints.map((point, index) => pointDistance(baselinePoints[index], point));
  const lockedLandmarkDisplacement = Math.max(
    ...palmateLockedMajorLandmarks.map(({ index }) => displacements[index])
  );
  const maxStructuralPointDisplacement = Math.max(
    ...palmateProtectedStructuralPointIndices.map((index) => displacements[index])
  );
  const meanContourDisplacement = displacements.reduce((sum, value) => sum + value, 0) / displacements.length;
  const areaChangeRatio = percentChange(polygonArea(candidatePoints), polygonArea(baselinePoints));
  const widthChangeRatio = percentChange(candidateBounds.width, rawBounds.width);
  const heightChangeRatio = percentChange(candidateBounds.height, rawBounds.height);
  const passed =
    lockedLandmarkDisplacement <= 0.0001 &&
    Math.abs(areaChangeRatio) <= 4 &&
    Math.abs(widthChangeRatio) <= 3 &&
    Math.abs(heightChangeRatio) <= 3;
  return {
    lockedLandmarkDisplacement,
    maxStructuralPointDisplacement,
    meanContourDisplacement,
    areaChangeRatio,
    widthChangeRatio,
    heightChangeRatio,
    passed
  };
}

function signedPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

const palmateRejectedT2aMetrics = makeCandidateMetrics(
  palmateRejectedT2aPoints,
  palmateT2PreviousRawPoints
);
const palmateRejectedT2bMetrics = makeCandidateMetrics(
  palmateRejectedT2bPoints,
  palmateT2PreviousRawPoints
);

function makeReferenceImage(className: string) {
  const namespace = 'http://www.w3.org/2000/svg';
  const image = document.createElementNS(namespace, 'image');
  image.setAttribute('href', PALMATE_REFERENCE_URL);
  image.setAttribute('x', '0');
  image.setAttribute('y', '0');
  image.setAttribute('width', '500');
  image.setAttribute('height', '634');
  image.setAttribute('preserveAspectRatio', 'none');
  image.setAttribute('class', className);
  return image;
}

function makeTraceGrid() {
  const namespace = 'http://www.w3.org/2000/svg';
  const grid = document.createElementNS(namespace, 'g');
  grid.setAttribute('class', 'trace-grid');
  for (let value = 0; value <= 500; value += 50) {
    const vertical = document.createElementNS(namespace, 'line');
    vertical.setAttribute('x1', String(value));
    vertical.setAttribute('x2', String(value));
    vertical.setAttribute('y1', '0');
    vertical.setAttribute('y2', '420');
    grid.append(vertical);

    if (value <= 400) {
      const horizontal = document.createElementNS(namespace, 'line');
      horizontal.setAttribute('x1', '0');
      horizontal.setAttribute('x2', '500');
      horizontal.setAttribute('y1', String(value));
      horizontal.setAttribute('y2', String(value));
      grid.append(horizontal);
    }
  }
  return grid;
}

function makeRawTracePolygon(
  points: readonly Point[] = palmateT2DensePoints,
  className = 'trace-raw'
) {
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('class', className);
  polygon.setAttribute('points', points.map((point) => `${point.x},${point.y}`).join(' '));
  return polygon;
}

function makeOldMajorStructureTrace(className = 'old-major-structure-trace') {
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('class', className);
  polygon.setAttribute('points', palmateOldMajorStructurePoints.map((point) => `${point.x},${point.y}`).join(' '));
  return polygon;
}

function makeEnvelopeLandmarkPolyline(className = 'direct-major-polyline') {
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('class', className);
  polygon.setAttribute('points', palmateEnvelopeLandmarks.map((point) => `${point.x},${point.y}`).join(' '));
  return polygon;
}

type EnvelopeControlOverride = {
  control1: Point;
  control2: Point;
};

// Only the central-lobe segments need explicit handles: the landmarks stay fixed,
// while the controls create the reference leaf's slight outward belly before tapering.
const palmateEnvelopeControlOverrides = new Map<string, EnvelopeControlOverride>([
  ['11-12', { control1: { x: 328, y: 173 }, control2: { x: 324, y: 148 } }],
  ['12-13', { control1: { x: 326, y: 91 }, control2: { x: 274, y: 27 } }],
  ['13-14', { control1: { x: 221, y: 25 }, control2: { x: 178, y: 86 } }],
  ['14-15', { control1: { x: 181, y: 148 }, control2: { x: 186, y: 181 } }]
]);

function getMajorEnvelopeControls(
  previous: PalmateEnvelopeLandmark,
  current: PalmateEnvelopeLandmark,
  next: PalmateEnvelopeLandmark,
  afterNext: PalmateEnvelopeLandmark
) {
  const segmentLength = pointDistance(current, next);
  const incomingLength = pointDistance(previous, current);
  const outgoingLength = pointDistance(next, afterNext);
  const currentTangent = normalizedDirection(previous, next);
  const nextTangent = normalizedDirection(current, afterNext);
  const currentHandle = Math.min(segmentLength * 0.22, incomingLength * 0.16, 16);
  const nextHandle = Math.min(segmentLength * 0.22, outgoingLength * 0.16, 16);
  const override = palmateEnvelopeControlOverrides.get(`${current.id}-${next.id}`);
  return override ?? {
    control1: {
      x: current.x + currentTangent.x * currentHandle,
      y: current.y + currentTangent.y * currentHandle
    },
    control2: {
      x: next.x - nextTangent.x * nextHandle,
      y: next.y - nextTangent.y * nextHandle
    }
  };
}

function makeBoundedMajorEnvelopePath(points: readonly PalmateEnvelopeLandmark[]) {
  if (points.length < 3) return '';
  const count = points.length;
  const segments: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < count; index += 1) {
    const previous = points[(index - 1 + count) % count];
    const current = points[index];
    const next = points[(index + 1) % count];
    const afterNext = points[(index + 2) % count];
    const { control1, control2 } = getMajorEnvelopeControls(previous, current, next, afterNext);
    segments.push(
      `C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)} ${control2.x.toFixed(2)} ${control2.y.toFixed(2)} ${next.x} ${next.y}`
    );
  }

  return `${segments.join(' ')} Z`;
}

const palmateMajorEnvelopePath = makeBoundedMajorEnvelopePath(palmateEnvelopeLandmarks);

type PalmateSerrationSpec = {
  segment: `${number}-${number}`;
  amplitude: number;
  position: number;
};

// Representative teeth are limited to the exposed edges of the five primary lobes.
// No serration is allowed inside a primary sinus, along the basal edge, or at the
// petiole insertion. The accepted 24 landmarks remain the segment endpoints.
const palmateLightSerrationSpecs: readonly PalmateSerrationSpec[] = [
  { segment: '3-4', amplitude: 3.2, position: 0.54 },
  { segment: '4-5', amplitude: 2.8, position: 0.46 },
  { segment: '7-8', amplitude: 3.4, position: 0.56 },
  { segment: '8-9', amplitude: 2.8, position: 0.48 },
  { segment: '12-13', amplitude: 2.8, position: 0.58 },
  { segment: '13-14', amplitude: 2.8, position: 0.42 },
  { segment: '17-18', amplitude: 2.8, position: 0.52 },
  { segment: '18-19', amplitude: 3.4, position: 0.46 },
  { segment: '21-22', amplitude: 2.8, position: 0.54 },
  { segment: '22-23', amplitude: 3.2, position: 0.46 }
];

const palmateLightSerrationBySegment = new Map(
  palmateLightSerrationSpecs.map((spec) => [spec.segment, spec] as const)
);

function mixPoint(a: Point, b: Point, t: number): Point {
  return { x: mix(a.x, b.x, t), y: mix(a.y, b.y, t) };
}

function makeLightSerrationGeometry(
  previous: PalmateEnvelopeLandmark,
  current: PalmateEnvelopeLandmark,
  next: PalmateEnvelopeLandmark,
  afterNext: PalmateEnvelopeLandmark,
  spec: PalmateSerrationSpec
) {
  const { control1, control2 } = getMajorEnvelopeControls(previous, current, next, afterNext);
  const p01 = mixPoint(current, control1, spec.position);
  const p12 = mixPoint(control1, control2, spec.position);
  const p23 = mixPoint(control2, next, spec.position);
  const p012 = mixPoint(p01, p12, spec.position);
  const p123 = mixPoint(p12, p23, spec.position);
  const curvePoint = mixPoint(p012, p123, spec.position);
  const tangent = normalizedDirection(p012, p123);
  const outward = { x: -tangent.y, y: tangent.x };
  const tooth = {
    x: curvePoint.x + outward.x * spec.amplitude,
    y: curvePoint.y + outward.y * spec.amplitude
  };
  const shoulderOffset = spec.amplitude * 0.48;
  return {
    curvePoint,
    tooth,
    leftControl1: p01,
    leftControl2: {
      x: p012.x + outward.x * shoulderOffset,
      y: p012.y + outward.y * shoulderOffset
    },
    rightControl1: {
      x: p123.x + outward.x * shoulderOffset,
      y: p123.y + outward.y * shoulderOffset
    },
    rightControl2: p23
  };
}

function makeLightSerrationPath(points: readonly PalmateEnvelopeLandmark[]) {
  if (points.length < 3) return '';
  const count = points.length;
  const commands: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let index = 0; index < count; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % count];
    const segmentKey = `${current.id}-${next.id}` as const;
    const serration = palmateLightSerrationBySegment.get(segmentKey);
    const previous = points[(index - 1 + count) % count];
    const afterNext = points[(index + 2) % count];
    if (!serration) {
      const { control1, control2 } = getMajorEnvelopeControls(previous, current, next, afterNext);
      commands.push(
        `C ${control1.x.toFixed(2)} ${control1.y.toFixed(2)} ${control2.x.toFixed(2)} ${control2.y.toFixed(2)} ${next.x} ${next.y}`
      );
      continue;
    }

    const geometry = makeLightSerrationGeometry(previous, current, next, afterNext, serration);
    commands.push(
      `C ${geometry.leftControl1.x.toFixed(2)} ${geometry.leftControl1.y.toFixed(2)} ${geometry.leftControl2.x.toFixed(2)} ${geometry.leftControl2.y.toFixed(2)} ${geometry.tooth.x.toFixed(2)} ${geometry.tooth.y.toFixed(2)}`,
      `C ${geometry.rightControl1.x.toFixed(2)} ${geometry.rightControl1.y.toFixed(2)} ${geometry.rightControl2.x.toFixed(2)} ${geometry.rightControl2.y.toFixed(2)} ${next.x} ${next.y}`
    );
  }

  return `${commands.join(' ')} Z`;
}

function makeLightSerrationMetricPoints(points: readonly PalmateEnvelopeLandmark[]) {
  return points.flatMap((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const serration = palmateLightSerrationBySegment.get(`${current.id}-${next.id}`);
    return serration
      ? [{ ...current }, makeLightSerrationGeometry(previous, current, next, afterNext, serration).tooth]
      : [{ ...current }];
  });
}

function makeStructuralMetricPoints(points: readonly PalmateEnvelopeLandmark[]) {
  return points.flatMap((current, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const serration = palmateLightSerrationBySegment.get(`${current.id}-${next.id}`);
    return serration
      ? [{ ...current }, makeLightSerrationGeometry(previous, current, next, afterNext, serration).curvePoint]
      : [{ ...current }];
  });
}

function makeEnvelopeCandidateMetrics(kind: 'T2a' | 'T2b'): PalmateCandidateMetrics {
  if (kind === 'T2a') {
    return {
      lockedLandmarkDisplacement: 0,
      maxStructuralPointDisplacement: 0,
      meanContourDisplacement: 0,
      areaChangeRatio: 0,
      widthChangeRatio: 0,
      heightChangeRatio: 0,
      passed: true
    };
  }

  const baselinePoints = makeStructuralMetricPoints(palmateEnvelopeLandmarks);
  const candidatePoints = makeLightSerrationMetricPoints(palmateEnvelopeLandmarks);
  const baselineBounds = boundsOf(baselinePoints);
  const candidateBounds = boundsOf(candidatePoints);
  const meanContourDisplacement =
    palmateLightSerrationSpecs.reduce((sum, spec) => sum + spec.amplitude, 0) / candidatePoints.length;
  const areaChangeRatio = percentChange(polygonArea(candidatePoints), polygonArea(baselinePoints));
  const widthChangeRatio = percentChange(candidateBounds.width, baselineBounds.width);
  const heightChangeRatio = percentChange(candidateBounds.height, baselineBounds.height);
  return {
    lockedLandmarkDisplacement: 0,
    maxStructuralPointDisplacement: 0,
    meanContourDisplacement,
    areaChangeRatio,
    widthChangeRatio,
    heightChangeRatio,
    passed:
      Math.abs(areaChangeRatio) <= 4 &&
      Math.abs(widthChangeRatio) <= 3 &&
      Math.abs(heightChangeRatio) <= 3
  };
}

const palmateT2aPath = palmateMajorEnvelopePath;
const palmateT2bPath = makeLightSerrationPath(palmateEnvelopeLandmarks);
const palmateT2aMetrics = makeEnvelopeCandidateMetrics('T2a');
const palmateT2bMetrics = makeEnvelopeCandidateMetrics('T2b');

function makeEnvelopeLandmarkGroup(options: { labels: boolean; landmarkIds?: readonly number[] }) {
  const namespace = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(namespace, 'g');
  group.setAttribute('class', 'envelope-landmarks');
  group.setAttribute('aria-label', 'Major lobe envelope landmarks');
  const selectedIds = options.landmarkIds ? new Set(options.landmarkIds) : null;
  palmateEnvelopeLandmarks.forEach((point) => {
    if (selectedIds && !selectedIds.has(point.id)) return;
    const circle = document.createElementNS(namespace, 'circle');
    circle.setAttribute('cx', String(point.x));
    circle.setAttribute('cy', String(point.y));
    circle.setAttribute('r', '4.2');
    group.append(circle);

    if (options.labels) {
      const text = document.createElementNS(namespace, 'text');
      text.setAttribute('x', String(point.x + 6));
      text.setAttribute('y', String(point.y - 6));
      text.textContent = `${point.id} · ${point.label}`;
      group.append(text);
    }
  });
  return group;
}

function makeContourPath(pathData: string, className: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('class', className);
  path.setAttribute('d', pathData);
  return path;
}

function makeClassifiedPointGroup(options: {
  labels: boolean;
  overlay?: boolean;
  indices?: readonly number[];
  showOnlyModified?: boolean;
}) {
  const namespace = 'http://www.w3.org/2000/svg';
  const pointGroup = document.createElementNS(namespace, 'g');
  pointGroup.setAttribute('class', options.overlay ? 'classified-points overlay-landmarks' : 'classified-points');
  pointGroup.setAttribute('aria-label', '60 classified contour points');
  const selectedIndices = options.indices ? new Set(options.indices) : null;
  palmateT2DensePoints.forEach((point, index) => {
    if (selectedIndices && !selectedIndices.has(index)) return;
    if (options.showOnlyModified && !palmateT2MajorStructureEdits.has(index)) return;
    const meta = palmatePointMetaByIndex.get(index);
    if (!meta) return;
    const circle = document.createElementNS(namespace, 'circle');
    const modifiedClass = palmateT2MajorStructureEdits.has(index) ? ' point-major-adjusted' : '';
    circle.setAttribute('class', `trace-point point-${meta.role}${modifiedClass}`);
    circle.setAttribute('cx', String(point.x));
    circle.setAttribute('cy', String(point.y));
    circle.setAttribute('r', meta.role === 'locked-major-landmark' ? '4.2' : meta.role === 'protected-structural' ? '3' : '2.2');
    pointGroup.append(circle);

    if (options.labels) {
      const text = document.createElementNS(namespace, 'text');
      text.setAttribute('class', 'trace-point-index');
      text.setAttribute('x', String(point.x + 6));
      text.setAttribute('y', String(point.y - 6));
      text.textContent = meta.label ? `${index} · ${meta.label}` : String(index);
      pointGroup.append(text);
    }
  });
  return pointGroup;
}

function makeUnifiedOverlay() {
  const namespace = 'http://www.w3.org/2000/svg';
  const group = document.createElementNS(namespace, 'g');
  group.setAttribute('class', 'overlay-comparison');
  group.setAttribute('aria-label', 'Reference, accepted major structure, T2a, and T2b overlay');
  group.append(
    makeReferenceImage('overlay-reference-image'),
    makeContourPath(palmateMajorEnvelopePath, 'overlay-accepted-envelope'),
    makeContourPath(palmateT2aPath, 'overlay-t2a'),
    makeContourPath(palmateT2bPath, 'overlay-t2b'),
    makeEnvelopeLandmarkGroup({ labels: false })
  );
  return group;
}

function renderReferenceImage(svg: SVGSVGElement) {
  svg.replaceChildren(makeReferenceImage('reference-image'), makeTraceGrid(), makeUnifiedOverlay());
}

function renderExistingRaw(svg: SVGSVGElement) {
  svg.replaceChildren(
    makeReferenceImage('reference-image faint'),
    makeTraceGrid(),
    makeRawTracePolygon(palmateT2DensePoints, 'trace-revised-raw'),
    makeUnifiedOverlay()
  );
}

function renderMajorStructurePoints(svg: SVGSVGElement) {
  svg.replaceChildren(
    makeReferenceImage('reference-image faint'),
    makeTraceGrid(),
    makeOldMajorStructureTrace('old-major-structure-trace faint-trace'),
    makeEnvelopeLandmarkPolyline(),
    makeEnvelopeLandmarkGroup({ labels: true }),
    makeUnifiedOverlay()
  );
}

function renderMajorStructureTrace(svg: SVGSVGElement) {
  svg.replaceChildren(
    makeContourPath(palmateMajorEnvelopePath, 'leaf-fill candidate-fill'),
    makeUnifiedOverlay()
  );
}

function renderAcceptedCandidate(svg: SVGSVGElement, pathData: string) {
  svg.replaceChildren(makeContourPath(pathData, 'leaf-fill candidate-fill'), makeUnifiedOverlay());
}

function renderMajorStructureOverlay(svg: SVGSVGElement) {
  svg.replaceChildren(
    makeReferenceImage('reference-image'),
    makeTraceGrid(),
    makeContourPath(palmateMajorEnvelopePath, 'overlay-accepted-envelope always-visible'),
    makeContourPath(palmateT2aPath, 'overlay-t2a always-visible'),
    makeContourPath(palmateT2bPath, 'overlay-t2b always-visible'),
    makeEnvelopeLandmarkGroup({ labels: false })
  );
}

function renderMajorReviewZone(svg: SVGSVGElement, zone: PalmateMajorReviewZone) {
  svg.setAttribute('viewBox', zone.viewBox);
  svg.replaceChildren(
    makeReferenceImage('reference-image'),
    makeContourPath(palmateMajorEnvelopePath, 'zone-accepted-envelope'),
    makeContourPath(palmateT2aPath, 'zone-t2a'),
    makeContourPath(palmateT2bPath, 'zone-t2b'),
    makeEnvelopeLandmarkGroup({ labels: true, landmarkIds: zone.landmarkIds })
  );
}

function renderCandidateTrace(svg: SVGSVGElement, pathData: string) {
  svg.replaceChildren(makeContourPath(pathData, 'leaf-fill candidate-fill'));
}

function renderOldSmoothedTrace(svg: SVGSVGElement) {
  svg.replaceChildren(
    makeReferenceImage('reference-image reference-overlay'),
    makeContourPath(makeT2LocalSmoothPath(palmateT2PreviousRawPoints), 'leaf-fill')
  );
}

function makeRawMetrics() {
  const bounds = boundsOf(palmateT2DensePoints);
  return [
    `explicit contour points: ${palmateT2DensePoints.length}`,
    `blade width / height: ${(bounds.width / bounds.height).toFixed(2)}`,
    `raw polygon area: ${Math.round(polygonArea(palmateT2DensePoints))}`,
    'trace source: Acer platanoides 500 px scan',
    'automatic edge detection: no',
    'status: revised 60-point trace · not moved this round'
  ];
}

function makeMajorPointsMetrics() {
  return [
    `new envelope landmarks: ${palmateEnvelopeLandmarks.length}`,
    'source: direct reference-image placement',
    'minor serration tips/notches: excluded',
    'direct polyline: shown for point-position review',
    'review zones: 6',
    'automatic edge detection: no'
  ];
}

function makeMajorTraceMetrics() {
  return [
    `connected envelope landmarks: ${palmateEnvelopeLandmarks.length}`,
    'interpolation: local bounded cubic segments',
    'landmark displacement: 0',
    'minor serrations: hidden',
    'purpose: accepted primary-lobe structure baseline',
    'validation gate: owner visual acceptance',
    'status: accepted and frozen'
  ];
}

function makeMajorOverlayMetrics() {
  return [
    'magenta: accepted major structure',
    'cyan dashed: T2a structural smooth',
    'orange: T2b light serration',
    'yellow points: locked major structure landmarks',
    'automatic metrics do not prove botanical correctness',
    'acceptance source: direct reference-image overlay and owner review'
  ];
}

function makeAcceptedCandidateMetricLines(label: 'T2a' | 'T2b', metrics: PalmateCandidateMetrics) {
  return [
    `locked landmark displacement: ${metrics.lockedLandmarkDisplacement.toFixed(2)} px`,
    `max structural displacement: ${metrics.maxStructuralPointDisplacement.toFixed(2)} px`,
    `mean contour displacement: ${metrics.meanContourDisplacement.toFixed(2)} px`,
    `area change ratio: ${signedPercent(metrics.areaChangeRatio)}`,
    `width change ratio: ${signedPercent(metrics.widthChangeRatio)}`,
    `height change ratio: ${signedPercent(metrics.heightChangeRatio)}`,
    `validation: ${metrics.passed ? 'pass' : 'failed'}`,
    'metric baseline: accepted major structure',
    label === 'T2a' ? 'minor serrations: hidden' : `representative serrations: ${palmateLightSerrationSpecs.length}`,
    `prototypeStatus: ${label.toLowerCase()}-candidate-awaiting-owner-selection`
  ];
}

function makeRejectedCandidateMetricLines(label: 'T2a' | 'T2b', metrics: PalmateCandidateMetrics) {
  return [
    `locked landmark displacement: ${metrics.lockedLandmarkDisplacement.toFixed(2)} px`,
    `max structural point displacement: ${metrics.maxStructuralPointDisplacement.toFixed(2)} px`,
    `mean contour displacement: ${metrics.meanContourDisplacement.toFixed(2)} px`,
    `area change ratio: ${signedPercent(metrics.areaChangeRatio)}`,
    `width change ratio: ${signedPercent(metrics.widthChangeRatio)}`,
    `height change ratio: ${signedPercent(metrics.heightChangeRatio)}`,
    `numeric gate relative to old raw: ${metrics.passed ? 'pass' : 'failed'}`,
    'botanical structure validation: failed',
    'history status: derived from structurally inaccurate raw trace',
    `prototypeStatus: ${label.toLowerCase()}-rejected-history-only`
  ];
}

function makeOldSmoothMetrics() {
  return [
    'status: error control only',
    'failure: unconstrained cubic smoothing reshaped major lobes',
    'failure: sinus and global proportion drift',
    'history status: derived from structurally inaccurate raw trace',
    'not eligible for 2D baseline selection'
  ];
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
const palmateReferenceImageSvg = document.querySelector<SVGSVGElement>('#palmate-reference-image');
const palmateExistingRawSvg = document.querySelector<SVGSVGElement>('#palmate-existing-raw');
const palmateMajorPointsSvg = document.querySelector<SVGSVGElement>('#palmate-major-points');
const palmateMajorTraceSvg = document.querySelector<SVGSVGElement>('#palmate-major-trace');
const palmateT2aSvg = document.querySelector<SVGSVGElement>('#palmate-t2a');
const palmateT2bSvg = document.querySelector<SVGSVGElement>('#palmate-t2b');
const palmateMajorOverlaySvg = document.querySelector<SVGSVGElement>('#palmate-major-overlay');
const palmateHistoryT2aSvg = document.querySelector<SVGSVGElement>('#palmate-history-t2a');
const palmateHistoryT2bSvg = document.querySelector<SVGSVGElement>('#palmate-history-t2b');
const palmateOldSmoothedTraceSvg = document.querySelector<SVGSVGElement>('#palmate-old-smoothed-trace');
const palmateExistingRawMetrics = document.querySelector<HTMLElement>('#palmate-existing-raw-metrics');
const palmateMajorPointsMetrics = document.querySelector<HTMLElement>('#palmate-major-points-metrics');
const palmateMajorTraceMetrics = document.querySelector<HTMLElement>('#palmate-major-trace-metrics');
const palmateT2aMetricsElement = document.querySelector<HTMLElement>('#palmate-t2a-metrics');
const palmateT2bMetricsElement = document.querySelector<HTMLElement>('#palmate-t2b-metrics');
const palmateMajorOverlayMetrics = document.querySelector<HTMLElement>('#palmate-major-overlay-metrics');
const palmateHistoryT2aMetrics = document.querySelector<HTMLElement>('#palmate-history-t2a-metrics');
const palmateHistoryT2bMetrics = document.querySelector<HTMLElement>('#palmate-history-t2b-metrics');
const palmateOldSmoothedMetrics = document.querySelector<HTMLElement>('#palmate-old-smoothed-metrics');
const palmateReviewZoneSvgs = Array.from(document.querySelectorAll<SVGSVGElement>('[data-major-review-zone]'));
const traceOverlayButton = document.querySelector<HTMLButtonElement>('[data-trace-overlay]');
if (
  !strapCurrentC2Svg ||
  !strapD1Svg ||
  !strapD2Svg ||
  !strapD3Svg ||
  !palmateReferenceImageSvg ||
  !palmateExistingRawSvg ||
  !palmateMajorPointsSvg ||
  !palmateMajorTraceSvg ||
  !palmateT2aSvg ||
  !palmateT2bSvg ||
  !palmateMajorOverlaySvg ||
  !palmateHistoryT2aSvg ||
  !palmateHistoryT2bSvg ||
  !palmateOldSmoothedTraceSvg ||
  !palmateExistingRawMetrics ||
  !palmateMajorPointsMetrics ||
  !palmateMajorTraceMetrics ||
  !palmateT2aMetricsElement ||
  !palmateT2bMetricsElement ||
  !palmateMajorOverlayMetrics ||
  !palmateHistoryT2aMetrics ||
  !palmateHistoryT2bMetrics ||
  !palmateOldSmoothedMetrics ||
  palmateReviewZoneSvgs.length !== palmateMajorReviewZones.length ||
  !traceOverlayButton
) {
  throw new Error('Leaf Silhouette Lab SVG targets are missing.');
}

renderLeaf(strapCurrentC2Svg, makeStrapSilhouettePath('current-c2'));
renderLeaf(strapD1Svg, makeStrapSilhouettePath('d1-shouldered'));
renderLeaf(strapD2Svg, makeStrapSilhouettePath('d2-late-taper'));
renderLeaf(strapD3Svg, makeStrapSilhouettePath('d3-natural-asymmetry'));
renderReferenceImage(palmateReferenceImageSvg);
renderExistingRaw(palmateExistingRawSvg);
renderMajorStructurePoints(palmateMajorPointsSvg);
renderMajorStructureTrace(palmateMajorTraceSvg);
renderAcceptedCandidate(palmateT2aSvg, palmateT2aPath);
renderAcceptedCandidate(palmateT2bSvg, palmateT2bPath);
renderMajorStructureOverlay(palmateMajorOverlaySvg);
renderCandidateTrace(palmateHistoryT2aSvg, palmateRejectedT2aPath);
renderCandidateTrace(palmateHistoryT2bSvg, palmateRejectedT2bPath);
renderOldSmoothedTrace(palmateOldSmoothedTraceSvg);
renderMetrics(palmateExistingRawMetrics, makeRawMetrics());
renderMetrics(palmateMajorPointsMetrics, makeMajorPointsMetrics());
renderMetrics(palmateMajorTraceMetrics, makeMajorTraceMetrics());
renderMetrics(palmateT2aMetricsElement, makeAcceptedCandidateMetricLines('T2a', palmateT2aMetrics));
renderMetrics(palmateT2bMetricsElement, makeAcceptedCandidateMetricLines('T2b', palmateT2bMetrics));
renderMetrics(palmateMajorOverlayMetrics, makeMajorOverlayMetrics());
renderMetrics(palmateHistoryT2aMetrics, makeRejectedCandidateMetricLines('T2a', palmateRejectedT2aMetrics));
renderMetrics(palmateHistoryT2bMetrics, makeRejectedCandidateMetricLines('T2b', palmateRejectedT2bMetrics));
renderMetrics(palmateOldSmoothedMetrics, makeOldSmoothMetrics());
palmateReviewZoneSvgs.forEach((svg, index) => renderMajorReviewZone(svg, palmateMajorReviewZones[index]));

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

traceOverlayButton.addEventListener('click', () => {
  const nextState = !document.body.classList.contains('trace-overlay-enabled');
  document.body.classList.toggle('trace-overlay-enabled', nextState);
  traceOverlayButton.setAttribute('aria-pressed', String(nextState));
});

setFilter(initialFilter);
