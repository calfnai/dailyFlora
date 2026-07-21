export type FingerName = 'index' | 'middle' | 'ring' | 'pinky';
export type HandName = 'left' | 'right';
export type HandControlMode = 'idle' | 'xy' | 'depth' | 'spread' | 'rotate' | 'cooldown';

export type ControllerHand = {
  tracked: boolean;
  active: boolean;
  confidence: number;
  x: number;
  y: number;
  depth: number;
  pinch: number;
  pinch_index: number;
  pinch_middle: number;
  pinch_ring: number;
  pinch_pinky: number;
  openness: number;
  velocity: number;
};

export type ControllerEvent = {
  name: string;
  hand: HandName | null;
  timestamp_ms: number;
};

export type ControllerFrame = {
  protocol: 'camera-controller/v1';
  sequence: number;
  timestamp_ms: number;
  fps: number;
  primary_hand: HandName;
  primary: ControllerHand;
  hands: Record<HandName, ControllerHand>;
  spread: number;
  spread_velocity: number;
  spread_acceleration: number;
  events: ControllerEvent[];
};

export type GestureActions = {
  cycleDensity: () => void;
  cycleRender: () => void;
  toggleClock: () => void;
  setAutomaticCameraEnabled: (enabled: boolean) => void;
  toggleImmersive: () => void;
  moveFramingBy: (deltaX: number, deltaY: number) => void;
  rotateBy: (deltaYaw: number, deltaPitch: number) => void;
  zoomBy: (delta: number) => void;
  setStatus: (connection: string, mode: HandControlMode, detail?: string) => void;
};

const fingers: FingerName[] = ['index', 'middle', 'ring', 'pinky'];
const pinchOn = 0.72;
const pinchAmbiguityMargin = 0.07;
const discreteCooldownMs = 450;
const continuousCooldownMs = 350;
const twoHandSettleMs = 250;

function clamp(value: number, lower: number, upper: number) {
  return Math.min(upper, Math.max(lower, value));
}

function pinchValue(hand: ControllerHand, finger: FingerName) {
  return hand[`pinch_${finger}`];
}

export function dominantPinch(hand: ControllerHand): FingerName | null {
  const ranked = fingers
    .map((finger) => ({ finger, value: pinchValue(hand, finger) }))
    .sort((a, b) => b.value - a.value);
  if (ranked[0].value < pinchOn) return null;
  if (ranked[1].value >= pinchOn && ranked[0].value - ranked[1].value < pinchAmbiguityMargin) return null;
  return ranked[0].finger;
}

function tracked(hand: ControllerHand) {
  return hand.tracked && hand.confidence >= 0.5;
}

export class DailyFloraGestureInterpreter {
  private readonly actions: GestureActions;
  private previousRight: ControllerHand | null = null;
  private previousSequence = -1;
  private suppressContinuousUntil = 0;
  private bothHandsSince: number | null = null;
  private autoCameraEnabled = true;
  private readonly lastDiscreteAt = new Map<string, number>();

  constructor(actions: GestureActions) {
    this.actions = actions;
  }

  private setMode(mode: HandControlMode, detail?: string) {
    this.actions.setStatus('connected', mode, detail);
  }

  private runDiscrete(key: string, timestampMs: number, action: () => void) {
    const previous = this.lastDiscreteAt.get(key) ?? -Infinity;
    if (timestampMs - previous < discreteCooldownMs) return false;
    this.lastDiscreteAt.set(key, timestampMs);
    this.suppressContinuousUntil = timestampMs + continuousCooldownMs;
    action();
    return true;
  }

  private handleDiscrete(frame: ControllerFrame) {
    const starts = frame.events.filter((event) => event.name.match(/^pinch_(index|middle|ring|pinky)_start$/));
    for (const handName of ['left', 'right'] as HandName[]) {
      const hand = frame.hands[handName];
      const dominant = tracked(hand) ? dominantPinch(hand) : null;
      if (!dominant) continue;
      const expected = `pinch_${dominant}_start`;
      if (!starts.some((event) => event.hand === handName && event.name === expected)) continue;
      const key = `${handName}:${dominant}`;
      if (handName === 'right' && dominant === 'middle') {
        this.runDiscrete(key, frame.timestamp_ms, this.actions.cycleDensity);
      } else if (handName === 'right' && dominant === 'ring') {
        this.runDiscrete(key, frame.timestamp_ms, this.actions.cycleRender);
      } else if (handName === 'right' && dominant === 'pinky') {
        this.runDiscrete(key, frame.timestamp_ms, this.actions.toggleClock);
      } else if (handName === 'left' && dominant === 'index') {
        this.runDiscrete(key, frame.timestamp_ms, () => {
          this.autoCameraEnabled = !this.autoCameraEnabled;
          this.actions.setAutomaticCameraEnabled(this.autoCameraEnabled);
        });
      } else if (handName === 'left' && dominant === 'pinky') {
        this.runDiscrete(key, frame.timestamp_ms, this.actions.toggleImmersive);
      }
    }
  }

  process(frame: ControllerFrame) {
    if (frame.protocol !== 'camera-controller/v1' || frame.sequence <= this.previousSequence) return;
    this.previousSequence = frame.sequence;
    this.handleDiscrete(frame);

    const right = frame.hands.right;
    const left = frame.hands.left;
    const rightTracked = tracked(right);
    const leftTracked = tracked(left);
    if (!rightTracked) {
      this.previousRight = null;
      this.bothHandsSince = null;
      this.setMode('idle', leftTracked ? 'LEFT ONLY' : 'NO HANDS');
      return;
    }

    if (leftTracked) {
      this.bothHandsSince ??= frame.timestamp_ms;
    } else {
      this.bothHandsSince = null;
    }

    const previous = this.previousRight;
    this.previousRight = { ...right };
    if (!previous) {
      this.setMode('idle', 'CALIBRATING');
      return;
    }
    if (frame.timestamp_ms < this.suppressContinuousUntil) {
      this.setMode('cooldown');
      return;
    }

    const rightPinch = dominantPinch(right);
    const leftPinch = leftTracked ? dominantPinch(left) : null;
    if (rightPinch === 'index') {
      const deltaX = clamp(right.x - previous.x, -0.035, 0.035) * 1.8;
      const deltaY = clamp(right.y - previous.y, -0.035, 0.035) * 1.8;
      if (Math.abs(deltaX) >= 0.004 || Math.abs(deltaY) >= 0.004) {
        this.actions.moveFramingBy(deltaX, deltaY);
      }
      this.setMode('xy');
      return;
    }
    if (rightPinch || leftPinch) {
      this.setMode('idle', 'PINCH');
      return;
    }

    const depthDelta = right.depth - previous.depth;
    const openForDepth = right.openness >= 0.82;
    const depthActive = openForDepth && Math.abs(depthDelta) >= 0.006;
    if (depthActive) {
      this.actions.zoomBy(clamp(-depthDelta * 2.8, -0.055, 0.055));
      this.setMode('depth');
      return;
    }

    const twoHandsReady =
      leftTracked && this.bothHandsSince !== null && frame.timestamp_ms - this.bothHandsSince >= twoHandSettleMs;
    if (twoHandsReady && Math.abs(frame.spread_acceleration) >= 0.08) {
      this.actions.zoomBy(clamp(-frame.spread_acceleration * 0.025, -0.022, 0.022));
      this.setMode('spread');
      return;
    }

    if (openForDepth) {
      this.setMode('depth', 'READY');
      return;
    }

    const rotateEnabled = right.openness >= 0.28 && right.openness <= 0.72;
    if (rotateEnabled) {
      if (this.autoCameraEnabled) {
        this.autoCameraEnabled = false;
        this.actions.setAutomaticCameraEnabled(false);
      }
      const deltaYaw = clamp(-(right.x - previous.x) * 2.6, -0.085, 0.085);
      const deltaPitch = clamp((right.y - previous.y) * 1.8, -0.055, 0.055);
      if (Math.abs(deltaYaw) >= 0.004 || Math.abs(deltaPitch) >= 0.004) {
        this.actions.rotateBy(deltaYaw, deltaPitch);
      }
      this.setMode('rotate');
      return;
    }

    this.setMode('idle');
  }

  reset() {
    this.previousRight = null;
    this.previousSequence = -1;
    this.bothHandsSince = null;
    this.actions.setStatus('disconnected', 'idle');
  }
}

export function connectCameraController(
  interpreter: DailyFloraGestureInterpreter,
  actions: GestureActions,
  urls = ['ws://127.0.0.1:8765', 'ws://localhost:8765']
) {
  let stopped = false;
  let socket: WebSocket | null = null;
  let retry = 0;
  let urlIndex = 0;

  const connect = () => {
    if (stopped) return;
    actions.setStatus('connecting', 'idle', urls[urlIndex]);
    try {
      socket = new WebSocket(urls[urlIndex]);
    } catch {
      scheduleReconnect();
      return;
    }
    socket.onopen = () => actions.setStatus('connected', 'idle');
    socket.onmessage = (message) => {
      try {
        interpreter.process(JSON.parse(String(message.data)) as ControllerFrame);
      } catch {
        actions.setStatus('invalid frame', 'idle');
      }
    };
    socket.onerror = () => socket?.close();
    socket.onclose = scheduleReconnect;
  };

  const scheduleReconnect = () => {
    if (stopped || retry) return;
    interpreter.reset();
    urlIndex = (urlIndex + 1) % urls.length;
    retry = window.setTimeout(() => {
      retry = 0;
      connect();
    }, 900);
  };

  connect();
  return () => {
    stopped = true;
    if (retry) window.clearTimeout(retry);
    socket?.close();
    interpreter.reset();
  };
}

export function bindHandControlKeyboard(actions: GestureActions) {
  const onKey = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
    if (event.code === 'Digit1' || event.key === '1') actions.cycleDensity();
    else if (event.code === 'Digit2' || event.key === '2') actions.cycleRender();
    else if (event.code === 'Digit3' || event.key === '3') actions.toggleClock();
    else if (event.code === 'Digit4' || event.key === '4') actions.setAutomaticCameraEnabled(true);
    else if (event.code === 'Digit5' || event.key === '5') actions.toggleImmersive();
    else return;
    event.preventDefault();
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}
