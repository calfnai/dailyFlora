import type {
  GestureRecognizer,
  GestureRecognizerResult,
  NormalizedLandmark
} from '@mediapipe/tasks-vision';
import {
  EMPTY_HAND_SIGNAL,
  type FingerName,
  type HandName,
  type HandPose,
  type HandSignal,
  type HandSignalFrame,
  type HandTrackerStatus
} from './types.ts';

const connections: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const clamp = (value: number, lower: number, upper: number) => Math.min(upper, Math.max(lower, value));
const mix = (previous: number, next: number, amount: number) => previous + (next - previous) * amount;
const distance = (a: NormalizedLandmark, b: NormalizedLandmark) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const pinchDistanceScale = 1.12;

export function resolvePhysicalHand(categoryName: string | undefined, swapHandedness = true): HandName {
  const reported: HandName = categoryName?.toLowerCase() === 'left' ? 'left' : 'right';
  if (!swapHandedness) return reported;
  return reported === 'left' ? 'right' : 'left';
}

function straightness(points: NormalizedLandmark[], mcp: number, pip: number, tip: number) {
  const first = {
    x: points[pip].x - points[mcp].x,
    y: points[pip].y - points[mcp].y,
    z: points[pip].z - points[mcp].z
  };
  const second = {
    x: points[tip].x - points[pip].x,
    y: points[tip].y - points[pip].y,
    z: points[tip].z - points[pip].z
  };
  const firstLength = Math.hypot(first.x, first.y, first.z);
  const secondLength = Math.hypot(second.x, second.y, second.z);
  if (firstLength < 1e-5 || secondLength < 1e-5) return -1;
  return (first.x * second.x + first.y * second.y + first.z * second.z) / (firstLength * secondLength);
}

function fingerExtended(points: NormalizedLandmark[], mcp: number, pip: number, tip: number) {
  return straightness(points, mcp, pip, tip) >= 0.62 &&
    distance(points[0], points[tip]) >= distance(points[0], points[pip]) * 1.04;
}

export function detectsThreeFingersUp(points: NormalizedLandmark[]) {
  if (points.length < 21) return false;
  return fingerExtended(points, 5, 6, 8) &&
    fingerExtended(points, 9, 10, 12) &&
    fingerExtended(points, 13, 14, 16) &&
    !fingerExtended(points, 17, 18, 20);
}

export function detectsFourFingersUp(points: NormalizedLandmark[]) {
  if (points.length < 21) return false;
  const palmWidth = Math.max(0.025, distance(points[5], points[17]));
  const thumbFolded = distance(points[4], points[9]) <= palmWidth * 0.9;
  return thumbFolded &&
    fingerExtended(points, 5, 6, 8) &&
    fingerExtended(points, 9, 10, 12) &&
    fingerExtended(points, 13, 14, 16) &&
    fingerExtended(points, 17, 18, 20);
}

export function classifyHandPose(
  points: NormalizedLandmark[],
  categoryName: string | undefined,
  categoryConfidence: number,
  handConfidence: number
): { pose: HandPose; confidence: number } {
  if (detectsThreeFingersUp(points)) {
    return { pose: 'three_up', confidence: Math.min(handConfidence, 0.82) };
  }
  if (detectsFourFingersUp(points)) {
    return { pose: 'four_up', confidence: Math.min(handConfidence, 0.82) };
  }
  const normalized = categoryName?.toLowerCase();
  const pose: HandPose = normalized === 'thumb_up' ? 'thumb_up'
    : normalized === 'closed_fist' ? 'fist'
      : normalized === 'pointing_up' ? 'pointing_up'
        : normalized === 'victory' ? 'victory'
          : normalized === 'open_palm' ? 'open_palm'
            : normalized && normalized !== 'none' ? 'unknown' : 'none';
  return { pose, confidence: pose === 'none' ? 0 : categoryConfidence };
}

export function extractHandSignal(
  points: NormalizedLandmark[],
  confidence: number,
  pose: HandPose = 'none',
  poseConfidence = 0
): HandSignal {
  const palm = [0, 5, 9, 13, 17];
  const palmX = palm.reduce((sum, index) => sum + points[index].x, 0) / palm.length;
  const palmY = palm.reduce((sum, index) => sum + points[index].y, 0) / palm.length;
  const palmWidth = Math.max(0.025, distance(points[5], points[17]));
  // Landmark centers cannot overlap when two fingertips with real thickness touch.
  // Normalize by palm size and allow a comfortable near-touch before hysteresis.
  const pinch = (tip: number) => clamp01(1 - distance(points[4], points[tip]) / (palmWidth * pinchDistanceScale));
  const extensions = ([8, 12, 16, 20] as const).map((tip, index) => {
    const mcp = [5, 9, 13, 17][index];
    return distance(points[0], points[tip]) / Math.max(0.025, distance(points[0], points[mcp]));
  });
  return {
    tracked: true,
    confidence,
    pose,
    pose_confidence: poseConfidence,
    x: clamp01(1 - palmX),
    y: clamp01(palmY),
    depth: clamp01((palmWidth - 0.055) / 0.2),
    pinch_index: pinch(8),
    pinch_middle: pinch(12),
    pinch_ring: pinch(16),
    pinch_pinky: pinch(20),
    openness: clamp01((extensions.reduce((sum, value) => sum + value, 0) / extensions.length - 1.08) / 0.74),
    velocity: 0,
    landmarks: points.map((point) => ({ x: 1 - point.x, y: point.y, z: point.z }))
  };
}

function smoothHand(previous: HandSignal, next: HandSignal, deltaSeconds: number): HandSignal {
  if (!next.tracked) return { ...EMPTY_HAND_SIGNAL, landmarks: [] };
  if (!previous.tracked) return next;
  const smooth = (key: keyof Pick<HandSignal, 'x' | 'y' | 'depth' | 'openness'>) =>
    mix(previous[key], next[key], 0.3);
  const smoothPinch = (finger: FingerName) => mix(previous[`pinch_${finger}`], next[`pinch_${finger}`], 0.42);
  const x = smooth('x');
  const y = smooth('y');
  return {
    ...next,
    x,
    y,
    depth: smooth('depth'),
    openness: smooth('openness'),
    pinch_index: smoothPinch('index'),
    pinch_middle: smoothPinch('middle'),
    pinch_ring: smoothPinch('ring'),
    pinch_pinky: smoothPinch('pinky'),
    velocity: clamp(Math.hypot(x - previous.x, y - previous.y) / Math.max(deltaSeconds, 1 / 120), 0, 1)
  };
}

function drawHands(canvas: HTMLCanvasElement, result: GestureRecognizerResult, swapHandedness: boolean) {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  result.landmarks.forEach((points, index) => {
    const label = resolvePhysicalHand(result.handedness[index]?.[0]?.categoryName, swapHandedness);
    const color = label === 'left' ? '#67e0d0' : '#e8ff69';
    context.strokeStyle = color;
    context.fillStyle = color;
    context.lineWidth = Math.max(2, canvas.width / 240);
    for (const [from, to] of connections) {
      context.beginPath();
      context.moveTo((1 - points[from].x) * canvas.width, points[from].y * canvas.height);
      context.lineTo((1 - points[to].x) * canvas.width, points[to].y * canvas.height);
      context.stroke();
    }
    for (const point of points) {
      context.beginPath();
      context.arc((1 - point.x) * canvas.width, point.y * canvas.height, Math.max(2.5, canvas.width / 180), 0, Math.PI * 2);
      context.fill();
    }
  });
}

export type BrowserHandTrackerOptions = {
  video: HTMLVideoElement;
  overlay: HTMLCanvasElement;
  onFrame: (frame: HandSignalFrame) => void;
  onStatus: (status: HandTrackerStatus, message: string) => void;
};

export class BrowserHandTracker {
  private readonly options: BrowserHandTrackerOptions;
  private recognizer: GestureRecognizer | null = null;
  private stream: MediaStream | null = null;
  private requestId = 0;
  private generation = 0;
  private sequence = 0;
  private previousTimestamp = 0;
  private previousHands: Record<HandName, HandSignal> = {
    left: { ...EMPTY_HAND_SIGNAL, landmarks: [] },
    right: { ...EMPTY_HAND_SIGNAL, landmarks: [] }
  };
  private previousSpread: number | null = null;
  private spreadVelocity = 0;
  private spreadAcceleration = 0;
  private fpsWindow = { started: 0, frames: 0, value: 0 };
  private swapHandedness = true;

  constructor(options: BrowserHandTrackerOptions) {
    this.options = options;
  }

  setSwapHandedness(enabled: boolean) {
    if (this.swapHandedness === enabled) return;
    this.swapHandedness = enabled;
    this.previousHands = {
      left: { ...EMPTY_HAND_SIGNAL, landmarks: [] },
      right: { ...EMPTY_HAND_SIGNAL, landmarks: [] }
    };
    this.previousSpread = null;
    this.spreadVelocity = 0;
    this.spreadAcceleration = 0;
  }

  private async loadRecognizer() {
    if (this.recognizer) return this.recognizer;
    const wasmPath = new URL('mediapipe/wasm/', document.baseURI).toString();
    const modelPath = new URL('models/gesture_recognizer.task', document.baseURI).toString();
    const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(wasmPath);
    const common = {
      runningMode: 'VIDEO' as const,
      numHands: 2,
      minHandDetectionConfidence: 0.6,
      minHandPresenceConfidence: 0.6,
      minTrackingConfidence: 0.6
    };
    try {
      this.recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...common,
        baseOptions: { modelAssetPath: modelPath, delegate: 'GPU' }
      });
    } catch {
      this.recognizer = await GestureRecognizer.createFromOptions(vision, {
        ...common,
        baseOptions: { modelAssetPath: modelPath, delegate: 'CPU' }
      });
    }
    return this.recognizer;
  }

  async start() {
    this.stop(false);
    const generation = this.generation;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器不支持摄像头访问');
      this.options.onStatus('loading', '正在按需加载手部识别模型…');
      const recognizer = await this.loadRecognizer();
      if (generation !== this.generation) return;
      this.options.onStatus('requesting-camera', '请允许网页使用摄像头');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30, max: 30 }
        },
        audio: false
      });
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      this.options.video.srcObject = this.stream;
      await this.options.video.play();
      const now = performance.now();
      this.previousTimestamp = now;
      this.fpsWindow = { started: now, frames: 0, value: 0 };
      this.options.onStatus('running', '摄像头已开启，请把双手放进画面');

      const process = () => {
        if (!this.stream || !this.options.video.videoWidth) return;
        const timestamp = performance.now();
        const deltaSeconds = clamp((timestamp - this.previousTimestamp) / 1000, 1 / 120, 0.1);
        this.previousTimestamp = timestamp;
        const result = recognizer.recognizeForVideo(this.options.video, timestamp);
        const overlay = this.options.overlay;
        if (overlay.width !== this.options.video.videoWidth || overlay.height !== this.options.video.videoHeight) {
          overlay.width = this.options.video.videoWidth;
          overlay.height = this.options.video.videoHeight;
        }
        drawHands(overlay, result, this.swapHandedness);

        const raw: Record<HandName, HandSignal> = {
          left: { ...EMPTY_HAND_SIGNAL, landmarks: [] },
          right: { ...EMPTY_HAND_SIGNAL, landmarks: [] }
        };
        result.landmarks.forEach((points, index) => {
          const category = result.handedness[index]?.[0];
          // MediaPipe's handedness convention assumes a mirrored selfie image.
          // The recognizer receives the raw webcam frame, so swap by default.
          const name = resolvePhysicalHand(category?.categoryName, this.swapHandedness);
          const gesture = result.gestures[index]?.[0];
          const classified = classifyHandPose(points, gesture?.categoryName, gesture?.score ?? 0, category?.score ?? 0);
          raw[name] = extractHandSignal(points, category?.score ?? 0, classified.pose, classified.confidence);
        });
        const hands: Record<HandName, HandSignal> = {
          left: smoothHand(this.previousHands.left, raw.left, deltaSeconds),
          right: smoothHand(this.previousHands.right, raw.right, deltaSeconds)
        };
        this.previousHands = hands;

        let spread = 0;
        if (hands.left.tracked && hands.right.tracked) {
          spread = clamp01(Math.hypot(hands.left.x - hands.right.x, hands.left.y - hands.right.y) / 0.75);
          if (this.previousSpread !== null) {
            const rawVelocity = clamp((spread - this.previousSpread) / deltaSeconds / 2.5, -1, 1);
            const nextVelocity = mix(this.spreadVelocity, rawVelocity, 0.25);
            const rawAcceleration = clamp((nextVelocity - this.spreadVelocity) / deltaSeconds / 8, -1, 1);
            this.spreadAcceleration = mix(this.spreadAcceleration, rawAcceleration, 0.2);
            this.spreadVelocity = nextVelocity;
          }
          this.previousSpread = spread;
        } else {
          this.previousSpread = null;
          this.spreadVelocity = 0;
          this.spreadAcceleration = 0;
        }

        this.fpsWindow.frames += 1;
        if (timestamp - this.fpsWindow.started >= 500) {
          this.fpsWindow.value = this.fpsWindow.frames * 1000 / (timestamp - this.fpsWindow.started);
          this.fpsWindow.frames = 0;
          this.fpsWindow.started = timestamp;
        }
        this.options.onFrame({
          source: 'browser-camera',
          sequence: ++this.sequence,
          timestamp_ms: timestamp,
          fps: this.fpsWindow.value,
          hands,
          spread,
          spread_velocity: this.spreadVelocity,
          spread_acceleration: this.spreadAcceleration
        });
        this.requestId = requestAnimationFrame(process);
      };
      this.requestId = requestAnimationFrame(process);
    } catch (error) {
      this.stop(false);
      this.options.onStatus('error', error instanceof Error ? error.message : '无法启动摄像头');
    }
  }

  stop(report = true) {
    this.generation += 1;
    cancelAnimationFrame(this.requestId);
    this.requestId = 0;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.options.video.srcObject = null;
    const context = this.options.overlay.getContext('2d');
    context?.clearRect(0, 0, this.options.overlay.width, this.options.overlay.height);
    this.previousHands = {
      left: { ...EMPTY_HAND_SIGNAL, landmarks: [] },
      right: { ...EMPTY_HAND_SIGNAL, landmarks: [] }
    };
    this.previousSpread = null;
    this.spreadVelocity = 0;
    this.spreadAcceleration = 0;
    if (report) this.options.onStatus('off', '摄像头已关闭');
  }

  dispose() {
    this.stop(false);
    this.recognizer?.close();
    this.recognizer = null;
  }
}
