import {
  BrowserHandTracker,
  GestureInterpreter,
  createHandMonitor,
  type HandControlAction,
  type HandControlMode
} from './hand-control/index.ts';

export type DailyFloraHandActions = {
  cycleDensity: () => void;
  cycleRender: () => void;
  toggleClock: () => void;
  setAutomaticCameraEnabled: (enabled: boolean) => void;
  toggleImmersive: () => void;
  moveFramingBy: (deltaX: number, deltaY: number) => void;
  rotateBy: (deltaYaw: number, deltaPitch: number) => void;
  zoomBy: (delta: number) => void;
};

export function createDailyFloraActionRouter(
  actions: DailyFloraHandActions,
  onOutput: (message: string) => void = () => undefined
) {
  let automaticCameraEnabled = true;
  return (action: HandControlAction) => {
    onOutput(outputLabel(action));
    if (action.type === 'pose') {
      if (action.hand === 'right' && action.pose === 'pointing_up') actions.cycleDensity();
      else if (action.hand === 'right' && action.pose === 'victory') actions.cycleRender();
      else if (action.hand === 'right' && action.pose === 'three_up') actions.toggleClock();
      else if (action.hand === 'left' && action.pose === 'thumb_up') {
        automaticCameraEnabled = !automaticCameraEnabled;
        actions.setAutomaticCameraEnabled(automaticCameraEnabled);
        onOutput(`AUTO CAMERA · ${automaticCameraEnabled ? 'ON' : 'OFF'}`);
      } else if (action.hand === 'left' && action.pose === 'victory') actions.toggleImmersive();
      return;
    }
    if (action.type === 'move_xy') actions.moveFramingBy(action.deltaX, action.deltaY);
    else if (action.type === 'zoom') actions.zoomBy(action.delta);
    else if (action.type === 'rotate') {
      if (automaticCameraEnabled) {
        automaticCameraEnabled = false;
        actions.setAutomaticCameraEnabled(false);
      }
      actions.rotateBy(action.deltaYaw, action.deltaPitch);
    }
  };
}

const outputLabel = (action: HandControlAction) => {
  if (action.type === 'pose') {
    const label = action.pose === 'thumb_up' ? '👍 THUMB UP'
      : action.pose === 'fist' ? '✊ BRAKE'
        : action.pose === 'pointing_up' ? '☝ POINTING'
          : action.pose === 'victory' ? '✌ VICTORY' : '3F THREE UP';
    return `${action.hand.toUpperCase()} · ${label}`;
  }
  if (action.type === 'move_xy') return `XY · ${action.deltaX.toFixed(3)}, ${action.deltaY.toFixed(3)}`;
  if (action.type === 'rotate') return `ROTATE · ${action.deltaYaw.toFixed(3)}, ${action.deltaPitch.toFixed(3)}`;
  return `${action.source.toUpperCase()} ZOOM · ${action.delta.toFixed(3)}`;
};

export function bindHandControlKeyboard(actions: DailyFloraHandActions) {
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

export function startDailyFloraHandControl(actions: DailyFloraHandActions) {
  const monitor = createHandMonitor();
  const applyAction = createDailyFloraActionRouter(actions, (message) => monitor.setOutput(message));

  const interpreter = new GestureInterpreter({
    onAction: applyAction,
    onMode: (mode: HandControlMode, detail?: string) => monitor.setMode(mode, detail)
  });
  const tracker = new BrowserHandTracker({
    video: monitor.video,
    overlay: monitor.overlay,
    onFrame: (frame) => {
      monitor.renderFrame(frame);
      interpreter.process(frame);
    },
    onStatus: (status, message) => {
      monitor.setTrackerStatus(status, message);
      if (status !== 'running') interpreter.reset();
    }
  });
  monitor.bind({
    start: () => void tracker.start(),
    stop: () => tracker.stop(),
    setSwapHandedness: (enabled) => {
      tracker.setSwapHandedness(enabled);
      interpreter.reset();
      monitor.setOutput(`左右手校正 · ${enabled ? 'ON' : 'OFF'}`);
    }
  });
  const unbindKeyboard = bindHandControlKeyboard(actions);

  return () => {
    unbindKeyboard();
    tracker.dispose();
    interpreter.reset();
    monitor.destroy();
  };
}
