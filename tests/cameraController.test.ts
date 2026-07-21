import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DailyFloraGestureInterpreter,
  dominantPinch,
  type ControllerFrame,
  type ControllerHand,
  type GestureActions,
  type HandControlMode
} from '../src/cameraController.ts';

function hand(values: Partial<ControllerHand> = {}): ControllerHand {
  return {
    tracked: true,
    active: true,
    confidence: 0.96,
    x: 0.5,
    y: 0.5,
    depth: 0.5,
    pinch: 0,
    pinch_index: 0,
    pinch_middle: 0,
    pinch_ring: 0,
    pinch_pinky: 0,
    openness: 0.9,
    velocity: 0,
    ...values
  };
}

function frame(
  sequence: number,
  timestampMs: number,
  right: ControllerHand,
  left = hand({ tracked: false, active: false, confidence: 0 }),
  values: Partial<ControllerFrame> = {}
): ControllerFrame {
  return {
    protocol: 'camera-controller/v1',
    sequence,
    timestamp_ms: timestampMs,
    fps: 30,
    primary_hand: 'right',
    primary: right,
    hands: { left, right },
    spread: 0,
    spread_velocity: 0,
    spread_acceleration: 0,
    events: [],
    ...values
  };
}

function recorder() {
  const calls: Array<{ name: string; values: unknown[] }> = [];
  let latestMode: HandControlMode = 'idle';
  const record = (name: string) => (...values: unknown[]) => calls.push({ name, values });
  const actions: GestureActions = {
    cycleDensity: record('density'),
    cycleRender: record('render'),
    toggleClock: record('clock'),
    setAutomaticCameraEnabled: record('auto'),
    toggleImmersive: record('immersive'),
    moveFramingBy: record('xy'),
    rotateBy: record('rotate'),
    zoomBy: record('zoom'),
    setStatus: (_connection, mode) => { latestMode = mode; }
  };
  return { actions, calls, mode: () => latestMode };
}

test('dominant pinch rejects ambiguous neighboring fingers', () => {
  assert.equal(dominantPinch(hand({ pinch_middle: 0.88, pinch_ring: 0.73 })), 'middle');
  assert.equal(dominantPinch(hand({ pinch_middle: 0.82, pinch_ring: 0.79 })), null);
});

test('right middle pinch cycles density only once', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  const pinched = hand({ pinch_middle: 0.9 });
  interpreter.process(frame(1, 100, pinched, undefined, {
    events: [{ name: 'pinch_middle_start', hand: 'right', timestamp_ms: 100 }]
  }));
  interpreter.process(frame(2, 133, pinched));
  assert.equal(recorded.calls.filter((call) => call.name === 'density').length, 1);
});

test('right ring and pinky pinches map to detail and clock', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  interpreter.process(frame(1, 100, hand({ pinch_ring: 0.91 }), undefined, {
    events: [{ name: 'pinch_ring_start', hand: 'right', timestamp_ms: 100 }]
  }));
  interpreter.process(frame(2, 700, hand({ pinch_pinky: 0.93 }), undefined, {
    events: [{ name: 'pinch_pinky_start', hand: 'right', timestamp_ms: 700 }]
  }));
  assert.equal(recorded.calls.filter((call) => call.name === 'render').length, 1);
  assert.equal(recorded.calls.filter((call) => call.name === 'clock').length, 1);
  assert.equal(recorded.calls.some((call) => call.name === 'density'), false);
});

test('left index toggles auto camera and left pinky toggles immersive mode', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  const leftIndex = hand({ pinch_index: 0.9 });
  interpreter.process(frame(1, 100, hand(), leftIndex, {
    events: [{ name: 'pinch_index_start', hand: 'left', timestamp_ms: 100 }]
  }));
  interpreter.process(frame(2, 600, hand(), leftIndex, {
    events: [{ name: 'pinch_index_start', hand: 'left', timestamp_ms: 600 }]
  }));
  interpreter.process(frame(3, 1100, hand(), hand({ pinch_pinky: 0.92 }), {
    events: [{ name: 'pinch_pinky_start', hand: 'left', timestamp_ms: 1100 }]
  }));
  assert.deepEqual(
    recorded.calls.filter((call) => call.name === 'auto').map((call) => call.values),
    [[false], [true]]
  );
  assert.equal(recorded.calls.filter((call) => call.name === 'immersive').length, 1);
});

test('open hand depth has priority over two-hand spread', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  const left = hand({ x: 0.2 });
  interpreter.process(frame(1, 0, hand({ depth: 0.4 }), left));
  interpreter.process(frame(2, 300, hand({ depth: 0.44 }), left, { spread_acceleration: 0.8 }));
  const zoom = recorded.calls.find((call) => call.name === 'zoom');
  assert.ok(zoom);
  assert.ok(Number(zoom.values[0]) < 0);
  assert.equal(recorded.mode(), 'depth');
});

test('spread acceleration controls zoom when depth is stable', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  const left = hand({ x: 0.2 });
  interpreter.process(frame(1, 0, hand(), left));
  interpreter.process(frame(2, 300, hand(), left, { spread_acceleration: -0.6 }));
  const zoom = recorded.calls.find((call) => call.name === 'zoom');
  assert.ok(zoom);
  assert.ok(Number(zoom.values[0]) > 0);
  assert.equal(recorded.mode(), 'spread');
});

test('index pinch moves framing and suppresses depth', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  interpreter.process(frame(1, 0, hand({ pinch_index: 0.9, x: 0.5 })));
  interpreter.process(frame(2, 33, hand({ pinch_index: 0.9, x: 0.53, depth: 0.56 })));
  assert.equal(recorded.calls.some((call) => call.name === 'xy'), true);
  assert.equal(recorded.calls.some((call) => call.name === 'zoom'), false);
  assert.equal(recorded.mode(), 'xy');
});

test('semi-closed palm rotates while fully open palm does not', () => {
  const recorded = recorder();
  const interpreter = new DailyFloraGestureInterpreter(recorded.actions);
  interpreter.process(frame(1, 0, hand({ openness: 0.55, x: 0.5 })));
  interpreter.process(frame(2, 33, hand({ openness: 0.55, x: 0.53 })));
  assert.equal(recorded.calls.some((call) => call.name === 'rotate'), true);
  assert.deepEqual(recorded.calls.find((call) => call.name === 'auto')?.values, [false]);

  const openRecorded = recorder();
  const openInterpreter = new DailyFloraGestureInterpreter(openRecorded.actions);
  openInterpreter.process(frame(1, 0, hand({ openness: 0.9, x: 0.5 })));
  openInterpreter.process(frame(2, 33, hand({ openness: 0.9, x: 0.53 })));
  assert.equal(openRecorded.calls.some((call) => call.name === 'rotate'), false);
});
