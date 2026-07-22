export type FingerName = 'index' | 'middle' | 'ring' | 'pinky';
export type HandName = 'left' | 'right';
export type HandControlMode = 'idle' | 'xy' | 'depth' | 'spread' | 'rotate' | 'cooldown';

export type HandLandmark = {
  x: number;
  y: number;
  z: number;
};

export type HandSignal = {
  tracked: boolean;
  confidence: number;
  x: number;
  y: number;
  depth: number;
  pinch_index: number;
  pinch_middle: number;
  pinch_ring: number;
  pinch_pinky: number;
  openness: number;
  velocity: number;
  landmarks: HandLandmark[];
};

export type HandSignalFrame = {
  source: 'browser-camera';
  sequence: number;
  timestamp_ms: number;
  fps: number;
  hands: Record<HandName, HandSignal>;
  spread: number;
  spread_velocity: number;
  spread_acceleration: number;
};

export type HandControlAction =
  | { type: 'pinch'; hand: HandName; finger: FingerName }
  | { type: 'move_xy'; deltaX: number; deltaY: number }
  | { type: 'zoom'; source: 'depth' | 'spread'; delta: number }
  | { type: 'rotate'; deltaYaw: number; deltaPitch: number };

export type HandTrackerStatus = 'off' | 'loading' | 'requesting-camera' | 'running' | 'error';

export const EMPTY_HAND_SIGNAL: HandSignal = {
  tracked: false,
  confidence: 0,
  x: 0.5,
  y: 0.5,
  depth: 0,
  pinch_index: 0,
  pinch_middle: 0,
  pinch_ring: 0,
  pinch_pinky: 0,
  openness: 0,
  velocity: 0,
  landmarks: []
};
