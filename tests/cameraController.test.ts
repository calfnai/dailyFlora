import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GestureInterpreter,
  dominantPinch,
  extractHandSignal,
  resolvePhysicalHand,
  type HandControlAction,
  type HandSignal,
  type HandSignalFrame
} from '../src/hand-control/index.ts';
import type { NormalizedLandmark } from '@mediapipe/tasks-vision';
import {
  createDailyFloraActionRouter,
  type DailyFloraHandActions
} from '../src/dailyFloraHandControl.ts';

test('raw webcam handedness is corrected to physical left and right by default', () => {
  assert.equal(resolvePhysicalHand('Left'), 'right');
  assert.equal(resolvePhysicalHand('Right'), 'left');
  assert.equal(resolvePhysicalHand('Left', false), 'left');
  assert.equal(resolvePhysicalHand('Right', false), 'right');
});

function hand(values: Partial<HandSignal> = {}): HandSignal {
  return {
    tracked: true,
    confidence: 0.96,
    x: 0.5,
    y: 0.5,
    depth: 0.5,
    pinch_index: 0,
    pinch_middle: 0,
    pinch_ring: 0,
    pinch_pinky: 0,
    openness: 0.9,
    velocity: 0,
    landmarks: [],
    ...values
  };
}

function frame(
  sequence: number,
  timestampMs: number,
  right: HandSignal,
  left = hand({ tracked: false, confidence: 0 }),
  values: Partial<HandSignalFrame> = {}
): HandSignalFrame {
  return {
    source: 'browser-camera',
    sequence,
    timestamp_ms: timestampMs,
    fps: 30,
    hands: { left, right },
    spread: 0,
    spread_velocity: 0,
    spread_acceleration: 0,
    ...values
  };
}

function interpreterRecorder() {
  const actions: HandControlAction[] = [];
  let mode = 'idle';
  const interpreter = new GestureInterpreter({
    onAction: (action) => actions.push(action),
    onMode: (next) => { mode = next; }
  });
  return { interpreter, actions, mode: () => mode };
}

function dailyRecorder() {
  const calls: Array<{ name: string; values: unknown[] }> = [];
  const record = (name: string) => (...values: unknown[]) => calls.push({ name, values });
  const actions: DailyFloraHandActions = {
    cycleDensity: record('density'),
    cycleRender: record('render'),
    toggleClock: record('clock'),
    setAutomaticCameraEnabled: record('auto'),
    toggleImmersive: record('immersive'),
    moveFramingBy: record('xy'),
    rotateBy: record('rotate'),
    zoomBy: record('zoom')
  };
  return { calls, route: createDailyFloraActionRouter(actions) };
}

test('dominant pinch rejects ambiguous neighboring fingers', () => {
  assert.equal(dominantPinch(hand({ pinch_middle: 0.88, pinch_ring: 0.73 })), 'middle');
  assert.equal(dominantPinch(hand({ pinch_middle: 0.82, pinch_ring: 0.79 })), null);
});

test('browser landmark extraction distinguishes thumb-to-middle pinch', () => {
  const points = Array.from({ length: 21 }, (_, index): NormalizedLandmark => ({
    x: 0.5 + (index % 4) * 0.02,
    y: 0.75 - Math.floor(index / 4) * 0.08,
    z: 0
  }));
  points[0] = { x: 0.5, y: 0.86, z: 0 };
  points[5] = { x: 0.32, y: 0.62, z: 0 };
  points[9] = { x: 0.46, y: 0.58, z: 0 };
  points[13] = { x: 0.58, y: 0.6, z: 0 };
  points[17] = { x: 0.72, y: 0.64, z: 0 };
  points[4] = { x: 0.5, y: 0.34, z: 0 };
  points[8] = { x: 0.24, y: 0.14, z: 0 };
  points[12] = { x: 0.505, y: 0.345, z: 0 };
  points[16] = { x: 0.7, y: 0.18, z: 0 };
  points[20] = { x: 0.8, y: 0.28, z: 0 };
  const signal = extractHandSignal(points, 0.97);
  assert.ok(signal.pinch_middle > 0.95);
  assert.ok(signal.pinch_middle > signal.pinch_index + 0.5);
  assert.equal(signal.confidence, 0.97);
  assert.equal(signal.landmarks.length, 21);
});

test('right middle pinch emits one discrete action until released', () => {
  const recorded = interpreterRecorder();
  recorded.interpreter.process(frame(1, 100, hand({ pinch_middle: 0.9 })));
  recorded.interpreter.process(frame(2, 600, hand({ pinch_middle: 0.9 })));
  assert.deepEqual(recorded.actions.filter((action) => action.type === 'pinch'), [
    { type: 'pinch', hand: 'right', finger: 'middle' }
  ]);
});

test('DailyFlora adapter maps personalized right-hand pinches', () => {
  const recorded = dailyRecorder();
  recorded.route({ type: 'pinch', hand: 'right', finger: 'middle' });
  recorded.route({ type: 'pinch', hand: 'right', finger: 'ring' });
  recorded.route({ type: 'pinch', hand: 'right', finger: 'pinky' });
  assert.deepEqual(recorded.calls.map((call) => call.name), ['density', 'render', 'clock']);
});

test('DailyFlora adapter maps left index toggle and left pinky immersive mode', () => {
  const recorded = dailyRecorder();
  recorded.route({ type: 'pinch', hand: 'left', finger: 'index' });
  recorded.route({ type: 'pinch', hand: 'left', finger: 'index' });
  recorded.route({ type: 'pinch', hand: 'left', finger: 'pinky' });
  assert.deepEqual(
    recorded.calls.filter((call) => call.name === 'auto').map((call) => call.values),
    [[false], [true]]
  );
  assert.equal(recorded.calls.filter((call) => call.name === 'immersive').length, 1);
});

test('open hand depth has priority over two-hand spread', () => {
  const recorded = interpreterRecorder();
  const left = hand({ x: 0.2 });
  recorded.interpreter.process(frame(1, 0, hand({ depth: 0.4 }), left));
  recorded.interpreter.process(frame(2, 300, hand({ depth: 0.44 }), left, { spread_acceleration: 0.8 }));
  const zoom = recorded.actions.find((action) => action.type === 'zoom');
  assert.deepEqual(zoom && { type: zoom.type, source: zoom.source }, { type: 'zoom', source: 'depth' });
  assert.ok(zoom?.type === 'zoom' && zoom.delta < 0);
  assert.equal(recorded.mode(), 'depth');
});

test('spread acceleration controls zoom when depth is stable', () => {
  const recorded = interpreterRecorder();
  const left = hand({ x: 0.2 });
  recorded.interpreter.process(frame(1, 0, hand(), left));
  recorded.interpreter.process(frame(2, 300, hand(), left, { spread_acceleration: -0.6 }));
  const zoom = recorded.actions.find((action) => action.type === 'zoom');
  assert.ok(zoom?.type === 'zoom' && zoom.source === 'spread' && zoom.delta > 0);
  assert.equal(recorded.mode(), 'spread');
});

test('index pinch moves framing and suppresses depth', () => {
  const recorded = interpreterRecorder();
  recorded.interpreter.process(frame(1, 0, hand({ pinch_index: 0.9, x: 0.5 })));
  recorded.interpreter.process(frame(2, 400, hand({ pinch_index: 0.9, x: 0.53, depth: 0.56 })));
  assert.equal(recorded.actions.some((action) => action.type === 'move_xy'), true);
  assert.equal(recorded.actions.some((action) => action.type === 'zoom'), false);
  assert.equal(recorded.mode(), 'xy');
});

test('semi-closed palm rotates while fully open palm does not', () => {
  const recorded = interpreterRecorder();
  recorded.interpreter.process(frame(1, 0, hand({ openness: 0.55, x: 0.5 })));
  recorded.interpreter.process(frame(2, 33, hand({ openness: 0.55, x: 0.53 })));
  assert.equal(recorded.actions.some((action) => action.type === 'rotate'), true);

  const open = interpreterRecorder();
  open.interpreter.process(frame(1, 0, hand({ openness: 0.9, x: 0.5 })));
  open.interpreter.process(frame(2, 33, hand({ openness: 0.9, x: 0.53 })));
  assert.equal(open.actions.some((action) => action.type === 'rotate'), false);
});

test('continuous values stay inside per-frame limiters', () => {
  const recorded = interpreterRecorder();
  recorded.interpreter.process(frame(1, 0, hand({ openness: 0.55, x: 0.1, y: 0.1 })));
  recorded.interpreter.process(frame(2, 33, hand({ openness: 0.55, x: 0.9, y: 0.9 })));
  const rotate = recorded.actions.find((action) => action.type === 'rotate');
  assert.ok(rotate?.type === 'rotate');
  assert.ok(Math.abs(rotate.deltaYaw) <= 0.085);
  assert.ok(Math.abs(rotate.deltaPitch) <= 0.055);
});
