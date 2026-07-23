import type {
  FingerName,
  HandControlAction,
  HandControlMode,
  HandName,
  HandPose,
  HandSignal,
  HandSignalFrame
} from './types.ts';

const fingers: FingerName[] = ['index', 'middle', 'ring', 'pinky'];
const pinchOn = 0.72;
const pinchOff = 0.56;
const pinchAmbiguityMargin = 0.07;
const continuousCooldownMs = 350;
const twoHandSettleMs = 250;
const poseHoldMs = 280;
const fistHoldMs = 120;
const poseReleaseMs = 180;

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

type CommandPose = Exclude<HandPose, 'none' | 'unknown' | 'open_palm'>;
type PoseState = { candidate: HandPose; since: number; active: CommandPose | null };

const commandPoses: ReadonlySet<HandPose> = new Set(['thumb_up', 'fist', 'pointing_up', 'victory', 'three_up', 'four_up']);
const poseLabel: Record<CommandPose, string> = {
  thumb_up: '👍 THUMB UP',
  fist: '✊ FIST',
  pointing_up: '☝ POINTING',
  victory: '✌ VICTORY',
  three_up: '3F THREE UP',
  four_up: '4F FOUR UP'
};

function sensedPose(hand: HandSignal): HandPose {
  return tracked(hand) && hand.pose_confidence >= 0.52 ? hand.pose : 'none';
}

export class GestureInterpreter {
  private readonly onAction: (action: HandControlAction) => void;
  private readonly onMode: (mode: HandControlMode, detail?: string) => void;
  private previousHands: Record<HandName, HandSignal | null> = { left: null, right: null };
  private activeContinuousHand: HandName | null = null;
  private previousSequence = -1;
  private suppressContinuousUntil = 0;
  private bothHandsSince: number | null = null;
  private readonly activePinch: Record<HandName, FingerName | null> = { left: null, right: null };
  private readonly poseState: Record<HandName, PoseState> = {
    left: { candidate: 'none', since: 0, active: null },
    right: { candidate: 'none', since: 0, active: null }
  };

  constructor(options: GestureInterpreterOptions) {
    this.onAction = options.onAction;
    this.onMode = options.onMode ?? (() => undefined);
  }

  private updatePinch(handName: HandName, hand: HandSignal) {
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
    return next;
  }

  private updatePose(handName: HandName, hand: HandSignal, timestampMs: number) {
    const state = this.poseState[handName];
    const next = sensedPose(hand);
    if (next !== state.candidate) {
      state.candidate = next;
      state.since = timestampMs;
      return state.active;
    }

    const isCommand = commandPoses.has(next);
    const requiredMs = next === 'fist' ? fistHoldMs : isCommand ? poseHoldMs : poseReleaseMs;
    if (timestampMs - state.since < requiredMs) return state.active;
    if (!isCommand) {
      state.active = null;
      return null;
    }

    const command = next as CommandPose;
    if (state.active !== command) {
      state.active = command;
      this.suppressContinuousUntil = timestampMs + continuousCooldownMs;
      this.onAction({ type: 'pose', hand: handName, pose: command });
    }
    return state.active;
  }

  private selectContinuousHand(
    right: HandSignal,
    left: HandSignal,
    accepts: (hand: HandSignal) => boolean
  ): HandName | null {
    if (this.activeContinuousHand) {
      const active = this.activeContinuousHand === 'right' ? right : left;
      if (tracked(active) && accepts(active)) return this.activeContinuousHand;
    }
    if (tracked(right) && accepts(right)) return 'right';
    if (tracked(left) && accepts(left)) return 'left';
    return null;
  }

  process(frame: HandSignalFrame) {
    if (frame.sequence <= this.previousSequence) return;
    this.previousSequence = frame.sequence;
    const right = frame.hands.right;
    const left = frame.hands.left;
    const rightTracked = tracked(right);
    const leftTracked = tracked(left);
    const previousRight = this.previousHands.right;
    const previousLeft = this.previousHands.left;
    this.previousHands.right = rightTracked ? { ...right, landmarks: right.landmarks } : null;
    this.previousHands.left = leftTracked ? { ...left, landmarks: left.landmarks } : null;
    const rightPinch = this.updatePinch('right', right);
    const rightPose = this.updatePose('right', right, frame.timestamp_ms);
    const leftPose = this.updatePose('left', left, frame.timestamp_ms);
    const rightCandidate = this.poseState.right.candidate;
    const leftCandidate = this.poseState.left.candidate;
    const fistPresented = rightCandidate === 'fist' || leftCandidate === 'fist' || rightPose === 'fist' || leftPose === 'fist';
    const commandPresented = commandPoses.has(rightCandidate) || commandPoses.has(leftCandidate) || rightPose || leftPose;

    if (fistPresented) {
      this.activeContinuousHand = null;
      this.bothHandsSince = null;
      this.onMode('brake', '✊ ALL CONTROL STOP');
      return;
    }

    if (commandPresented) {
      this.activeContinuousHand = null;
      const activeHand = rightPose || commandPoses.has(rightCandidate) ? 'RIGHT' : 'LEFT';
      const activePose = (rightPose ?? leftPose ?? (commandPoses.has(rightCandidate) ? rightCandidate : leftCandidate)) as CommandPose;
      this.onMode(frame.timestamp_ms < this.suppressContinuousUntil ? 'cooldown' : 'gesture', `${activeHand} · ${poseLabel[activePose]}`);
      return;
    }

    if (!rightTracked && !leftTracked) {
      this.activeContinuousHand = null;
      this.bothHandsSince = null;
      this.onMode('idle', 'NO HANDS');
      return;
    }
    if (leftTracked && rightTracked) this.bothHandsSince ??= frame.timestamp_ms;
    else this.bothHandsSince = null;

    if (frame.timestamp_ms < this.suppressContinuousUntil) {
      this.onMode('cooldown');
      return;
    }

    if (rightPinch === 'index') {
      if (!previousRight) {
        this.onMode('idle', 'CALIBRATING RIGHT PINCH');
        return;
      }
      this.activeContinuousHand = 'right';
      const deltaX = clamp(right.x - previousRight.x, -0.035, 0.035) * 1.8;
      const deltaY = clamp(right.y - previousRight.y, -0.035, 0.035) * 1.8;
      if (Math.abs(deltaX) >= 0.004 || Math.abs(deltaY) >= 0.004) {
        this.onAction({ type: 'move_xy', deltaX, deltaY });
      }
      this.onMode('xy');
      return;
    }
    if (rightPinch) {
      this.onMode('idle', 'PINCH');
      return;
    }

    const depthHandName = this.selectContinuousHand(right, left, (hand) => hand.openness >= 0.82);
    const depthHand = depthHandName === 'right' ? right : depthHandName === 'left' ? left : null;
    const previousDepthHand = depthHandName === 'right' ? previousRight : depthHandName === 'left' ? previousLeft : null;
    const depthDelta = depthHand && previousDepthHand ? depthHand.depth - previousDepthHand.depth : 0;
    if (depthHandName && previousDepthHand && Math.abs(depthDelta) >= 0.006) {
      this.activeContinuousHand = depthHandName;
      this.onAction({ type: 'zoom', source: 'depth', delta: clamp(depthDelta * 2.8, -0.055, 0.055) });
      this.onMode('depth', depthHandName.toUpperCase());
      return;
    }

    const twoHandsReady =
      rightTracked && leftTracked && this.bothHandsSince !== null && frame.timestamp_ms - this.bothHandsSince >= twoHandSettleMs;
    if (twoHandsReady && Math.abs(frame.spread_acceleration) >= 0.08) {
      this.onAction({
        type: 'zoom',
        source: 'spread',
        delta: clamp(-frame.spread_acceleration * 0.025, -0.022, 0.022)
      });
      this.onMode('spread');
      return;
    }

    if (depthHandName) {
      this.activeContinuousHand = depthHandName;
      this.onMode('depth', `${depthHandName.toUpperCase()} · READY`);
      return;
    }

    const rotateHandName = this.selectContinuousHand(
      right,
      left,
      (hand) => hand.openness >= 0.28 && hand.openness <= 0.72
    );
    const rotateHand = rotateHandName === 'right' ? right : rotateHandName === 'left' ? left : null;
    const previousRotateHand = rotateHandName === 'right' ? previousRight : rotateHandName === 'left' ? previousLeft : null;
    if (rotateHandName && rotateHand && previousRotateHand) {
      this.activeContinuousHand = rotateHandName;
      const deltaYaw = clamp(-(rotateHand.x - previousRotateHand.x) * 2.6, -0.085, 0.085);
      const deltaPitch = clamp((rotateHand.y - previousRotateHand.y) * 1.8, -0.055, 0.055);
      if (Math.abs(deltaYaw) >= 0.004 || Math.abs(deltaPitch) >= 0.004) {
        this.onAction({ type: 'rotate', deltaYaw, deltaPitch });
      }
      this.onMode('rotate', rotateHandName.toUpperCase());
      return;
    }

    this.activeContinuousHand = null;
    this.onMode('idle');
  }

  reset() {
    this.previousHands = { left: null, right: null };
    this.activeContinuousHand = null;
    this.previousSequence = -1;
    this.bothHandsSince = null;
    this.activePinch.left = null;
    this.activePinch.right = null;
    this.poseState.left = { candidate: 'none', since: 0, active: null };
    this.poseState.right = { candidate: 'none', since: 0, active: null };
    this.suppressContinuousUntil = 0;
    this.onMode('idle');
  }
}
