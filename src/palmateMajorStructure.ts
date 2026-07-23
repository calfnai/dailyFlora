export type PalmateBaselinePoint = {
  x: number;
  y: number;
};

export type PalmateEnvelopeLandmark = PalmateBaselinePoint & {
  id: number;
  label: string;
};

export type PalmateEnvelopeControls = {
  control1: PalmateBaselinePoint;
  control2: PalmateBaselinePoint;
};

export const PALMATE_MAJOR_STRUCTURE_BASELINE_ID = 'major-structure-envelope-v1';

// Frozen after the owner accepted the Major Structure Envelope on 2026-07-22.
// Coordinates stay in the Leaf Silhouette Lab reference-image space.
export const PALMATE_MAJOR_STRUCTURE_LANDMARKS: readonly PalmateEnvelopeLandmark[] = [
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

const CONTROL_OVERRIDES = new Map<string, PalmateEnvelopeControls>([
  ['11-12', { control1: { x: 328, y: 173 }, control2: { x: 324, y: 148 } }],
  ['12-13', { control1: { x: 326, y: 91 }, control2: { x: 274, y: 27 } }],
  ['13-14', { control1: { x: 221, y: 25 }, control2: { x: 178, y: 86 } }],
  ['14-15', { control1: { x: 181, y: 148 }, control2: { x: 186, y: 181 } }]
]);

function distance(a: PalmateBaselinePoint, b: PalmateBaselinePoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function direction(a: PalmateBaselinePoint, b: PalmateBaselinePoint) {
  const length = distance(a, b) || 1;
  return { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
}

export function getPalmateEnvelopeControls(
  previous: PalmateEnvelopeLandmark,
  current: PalmateEnvelopeLandmark,
  next: PalmateEnvelopeLandmark,
  afterNext: PalmateEnvelopeLandmark
): PalmateEnvelopeControls {
  const segmentLength = distance(current, next);
  const incomingLength = distance(previous, current);
  const outgoingLength = distance(next, afterNext);
  const currentTangent = direction(previous, next);
  const nextTangent = direction(current, afterNext);
  const currentHandle = Math.min(segmentLength * 0.22, incomingLength * 0.16, 16);
  const nextHandle = Math.min(segmentLength * 0.22, outgoingLength * 0.16, 16);
  return CONTROL_OVERRIDES.get(`${current.id}-${next.id}`) ?? {
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

export function samplePalmateMajorStructure(samplesPerSegment = 7) {
  const output: PalmateBaselinePoint[] = [];
  const points = PALMATE_MAJOR_STRUCTURE_LANDMARKS;
  for (let index = 0; index < points.length; index += 1) {
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const afterNext = points[(index + 2) % points.length];
    const { control1, control2 } = getPalmateEnvelopeControls(previous, current, next, afterNext);
    for (let sample = 0; sample < samplesPerSegment; sample += 1) {
      const t = sample / samplesPerSegment;
      const inverse = 1 - t;
      output.push({
        x:
          inverse ** 3 * current.x +
          3 * inverse ** 2 * t * control1.x +
          3 * inverse * t ** 2 * control2.x +
          t ** 3 * next.x,
        y:
          inverse ** 3 * current.y +
          3 * inverse ** 2 * t * control1.y +
          3 * inverse * t ** 2 * control2.y +
          t ** 3 * next.y
      });
    }
  }
  return output;
}
