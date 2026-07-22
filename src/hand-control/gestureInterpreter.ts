import type {
  FingerName,
  HandControlAction,
  HandControlMode,
  HandName,
  HandSignal,
  HandSignalFrame
} from './types.ts';

const fingers: FingerName[] = ['index', 'middle', 'ring', 'pinky'];
const pinchOn = 0.72;
const pinchOff = 0.56;
const pinchAmbiguityMargin = 0.07;
const discreteCooldownMs = 450;
const continuousCooldownMs = 350;
const twoHandSettleMs = 250;

function clamp(value: number, lower: number, upper: number) {
  return Math.min(upper, Math.max(lower, value));
}

function pinchValue(hand: HandSignal, finger: FingerName) {
  return hand[`pinch_${finger}`];
}

export function dominantPinch(hand: HandSignal): FingerName | null {
  const ranked = fingers
    .map((finger) => ({ finger, value: pinchValue(hand, finger) }))
    .sort((a, b) => b.value - a.value);
  if (ranked[0].value < pinchOn) return null;
  if (ranked[1].value >= pinchOn && ranked[0].value - ranked[1].value < pinchAmbiguityMargin) return null;
  return ranked[0].finger;
}

function tracked(hand: HandSignal) {
  return hand.tracked && hand.confidence >= 0.5;
}

export type GestureInterpreterOptions = {
  onAction: (action: HandControlAction) => void;
  onMode?: (mode: HandControlMode, detail?: string) => void;
};

export class GestureInterpreter {
  private readonly onAction: (action: HandControlAction) => void;
  private readonly onMode: (mode: HandControlMode, detail?: string) => void;
  private previousRight: HandSignal | null = null;
  private previousSequence = -1;
  private suppressContinuousUntil = 0;
  private bothHandsSince: number | null = null;
  private readonly activePinch: Record<HandName, FingerName | null> = { left: null, right: null };
  private readonly lastDiscreteAt = new Map<string, number>();

  constructor(options: GestureInterpreterOptions) {
    this.onAction = options.onAction;
    this.onMode = options.onMode ?? (() => undefined);
  }

  private updatePinch(handName: HandName, hand: HandSignal, timestampMs: number) {
    const previous = this.activePinch[handName];
    if (!tracked(hand)) {
      this.activePinch[handName] = null;
      return null;
    }
    if (previous && pinchValue(hand, previous) >= pinchOff) return previous;

    this.activePinch[handName] = null;
    const next = dominantPinch(hand);
    if (!next) return null;
    this.activePinch[handName] = next;
    const key = `${handName}:${next}`;
    const last = this.lastDiscreteAt.get(key) ?? -Infinity;
    if (timestampMs - last >= discreteCooldownMs) {
      this.lastDiscreteAt.set(key, timestampMs);
      this.suppressContinuousUntil = timestampMs + continuousCooldownMs;
      this.onAction({ type: 'pinch', hand: handName, finger: next });
    }
    return next;
  }

  process(frame: HandSignalFrame) {
    if (frame.sequence <= this.previousSequence) return;
    this.previousSequence = frame.sequence;
    const right = frame.hands.right;
    const left = frame.hands.left;
    const rightTracked = tracked(right);
    const leftTracked = tracked(left);
    const rightPinch = this.updatePinch('right', right, frame.timestamp_ms);
    const leftPinch = this.updatePinch('left', left, frame.timestamp_ms);

    if (!rightTracked) {
      this.previousRight = null;
      this.bothHandsSince = null;
      this.onMode('idle', leftTracked ? 'LEFT ONLY' : 'NO HANDS');
      return;
    }
    if (leftTracked) this.bothHandsSince ??= frame.timestamp_ms;
    else this.bothHandsSince = null;

    const previous = this.previousRight;
    this.previousRight = { ...right, landmarks: right.landmarks };
    if (!previous) {
      this.onMode('idle', 'CALIBRATING');
      return;
    }
    if (frame.timestamp_ms < this.suppressContinuousUntil) {
      this.onMode('cooldown');
      return;
    }

    if (rightPinch === 'index') {
      const deltaX = clamp(right.x - previous.x, -0.035, 0.035) * 1.8;
      const deltaY = clamp(right.y - previous.y, -0.035, 0.035) * 1.8;
      if (Math.abs(deltaX) >= 0.004 || Math.abs(deltaY) >= 0.004) {
        this.onAction({ type: 'move_xy', deltaX, deltaY });
      }
      this.onMode('xy');
      return;
    }
    if (rightPinch || leftPinch) {
      this.onMode('idle', 'PINCH');
      return;
    }

    const depthDelta = right.depth - previous.depth;
    const openForDepth = right.openness >= 0.82;
    if (openForDepth && Math.abs(depthDelta) >= 0.006) {
      this.onAction({ type: 'zoom', source: 'depth', delta: clamp(-depthDelta * 2.8, -0.055, 0.055) });
      this.onMode('depth');
      return;
    }

    const twoHandsReady =
      leftTracked && this.bothHandsSince !== null && frame.timestamp_ms - this.bothHandsSince >= twoHandSettleMs;
    if (twoHandsReady && Math.abs(frame.spread_acceleration) >= 0.08) {
      this.onAction({
        type: 'zoom',
        source: 'spread',
        delta: clamp(-frame.spread_acceleration * 0.025, -0.022, 0.022)
      });
      this.onMode('spread');
      return;
    }

    if (openForDepth) {
      this.onMode('depth', 'READY');
      return;
    }

    if (right.openness >= 0.28 && right.openness <= 0.72) {
      const deltaYaw = clamp(-(right.x - previous.x) * 2.6, -0.085, 0.085);
      const deltaPitch = clamp((right.y - previous.y) * 1.8, -0.055, 0.055);
      if (Math.abs(deltaYaw) >= 0.004 || Math.abs(deltaPitch) >= 0.004) {
        this.onAction({ type: 'rotate', deltaYaw, deltaPitch });
      }
      this.onMode('rotate');
      return;
    }

    this.onMode('idle');
  }

  reset() {
    this.previousRight = null;
    this.previousSequence = -1;
    this.bothHandsSince = null;
    this.activePinch.left = null;
    this.activePinch.right = null;
    this.onMode('idle');
  }
}
