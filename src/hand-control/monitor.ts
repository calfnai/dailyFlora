import type { HandControlMode, HandSignalFrame, HandTrackerStatus } from './types.ts';

const percent = (value: number) => `${Math.round(value * 100)}%`;
type HandTranslator = (key: string, fallback: string) => string;

const poseLabel = (pose: HandSignalFrame['hands']['right']['pose'], translate: HandTranslator) => pose === 'thumb_up' ? `👍 ${translate('poseThumb', 'Thumb up')}`
  : pose === 'fist' ? `✊ ${translate('poseFist', 'Fist')}`
    : pose === 'pointing_up' ? `☝ ${translate('posePoint', 'Pointing')}`
      : pose === 'victory' ? `✌ ${translate('poseVictory', 'Victory')}`
        : pose === 'three_up' ? translate('poseThree', 'Three fingers')
          : pose === 'four_up' ? translate('poseFour', 'Four fingers')
            : pose === 'open_palm' ? translate('poseOpen', 'Open palm') : pose === 'unknown' ? translate('poseUnknown', 'Unknown') : translate('poseNone', 'No gesture');

export type HandMonitor = {
  root: HTMLElement;
  video: HTMLVideoElement;
  overlay: HTMLCanvasElement;
  bind: (actions: { start: () => void; stop: () => void; setSwapHandedness: (enabled: boolean) => void }) => void;
  setTrackerStatus: (status: HandTrackerStatus, message: string) => void;
  setMode: (mode: HandControlMode, detail?: string) => void;
  setOutput: (message: string) => void;
  renderFrame: (frame: HandSignalFrame) => void;
  destroy: () => void;
};

export function createHandMonitor(): HandMonitor {
  const root = document.createElement('aside');
  root.className = 'hand-camera-panel';
  root.innerHTML = `
    <button class="hand-camera-toggle" type="button" aria-expanded="true">
      <svg class="hand-camera-collapsed-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 12V6.8a1.45 1.45 0 0 1 2.9 0v3.7-6.1a1.45 1.45 0 0 1 2.9 0v6.1-5a1.45 1.45 0 0 1 2.9 0v5.6-3.5a1.45 1.45 0 0 1 2.9 0v6.2c0 4.1-2.7 7.2-6.8 7.2h-.6c-2.3 0-4.1-1-5.5-2.8l-2.3-3a1.7 1.7 0 0 1 2.5-2.3L7.2 14Z" /></svg>
      <span class="hand-camera-dot" data-status="off"></span><span class="hand-camera-title" data-hand-copy="title">摄像头手势</span>
    </button>
    <div class="hand-camera-body">
      <div class="hand-camera-preview">
        <video playsinline muted></video><canvas></canvas>
        <span class="hand-camera-fps" data-hand-camera-state>CAMERA OFF</span>
      </div>
      <p class="hand-camera-message" data-hand-status-message>点击启用后，识别完全在当前网页中运行。</p>
      <a class="hand-camera-privacy" href="./legal/privacy/#camera-and-mediapipe" target="_blank" rel="noopener" data-hand-copy="privacyLink">摄像头与隐私说明</a>
      <div class="hand-camera-actions">
        <button type="button" data-action="start">启用摄像头</button>
        <button type="button" data-action="stop" class="quiet" data-hand-copy="close">关闭</button>
        <button type="button" data-action="guide" class="quiet" data-hand-copy="guideButton">手势教程</button>
      </div>
      <label class="hand-camera-swap">
        <input type="checkbox" data-action="swap-hands" checked>
        <span data-hand-copy="swapLabel">左右手校正</span><i data-hand-copy="swapHint">默认开启；识别反了可关闭</i>
      </label>
      <div class="hand-camera-detected">
        <span data-hand="right">RIGHT · 未检测</span>
        <span data-hand="left">LEFT · 未检测</span>
      </div>
      <div class="hand-camera-values">
        <span><b data-hand-copy="rightGesture">右手势</b><i data-value="right-pose">—</i></span>
        <span><b data-hand-copy="leftGesture">左手势</b><i data-value="left-pose">—</i></span>
        <span><b data-hand-copy="indexPinch">食指 PINCH</b><i data-value="right-index">0%</i></span>
        <span><b data-hand-copy="rightDepth">右 DEPTH</b><i data-value="right-depth">0%</i></span>
        <span><b data-hand-copy="leftDepth">左 DEPTH</b><i data-value="left-depth">0%</i></span>
        <span><b data-hand-copy="rightOpen">右张开</b><i data-value="right-openness">0%</i></span>
        <span><b data-hand-copy="leftOpen">左张开</b><i data-value="left-openness">0%</i></span>
        <span><b data-hand-copy="spreadAcceleration">双手加速度</b><i data-value="spread">0%</i></span>
      </div>
      <div class="hand-camera-output"><span data-hand-copy="actualOutput">ACTUAL OUTPUT</span><b data-hand-output>等待摄像头</b></div>
      <p class="hand-camera-mode" data-hand-mode>MODE · IDLE</p>
    </div>`;
  (document.querySelector('.app-shell') ?? document.body).append(root);
  const video = root.querySelector('video') as HTMLVideoElement;
  const overlay = root.querySelector('canvas') as HTMLCanvasElement;
  const body = root.querySelector('.hand-camera-body') as HTMLElement;
  const toggle = root.querySelector('.hand-camera-toggle') as HTMLButtonElement;
  const dot = root.querySelector('.hand-camera-dot') as HTMLElement;
  const message = root.querySelector('.hand-camera-message') as HTMLElement;
  const fps = root.querySelector('.hand-camera-fps') as HTMLElement;
  const output = root.querySelector('.hand-camera-output b') as HTMLElement;
  const modeLabel = root.querySelector('.hand-camera-mode') as HTMLElement;
  const value = (name: string) => root.querySelector(`[data-value="${name}"]`) as HTMLElement;
  const start = root.querySelector('[data-action="start"]') as HTMLButtonElement;
  const stop = root.querySelector('[data-action="stop"]') as HTMLButtonElement;
  const guide = root.querySelector('[data-action="guide"]') as HTMLButtonElement;
  const swapHands = root.querySelector('[data-action="swap-hands"]') as HTMLInputElement;
  const rightStatus = root.querySelector('[data-hand="right"]') as HTMLElement;
  const leftStatus = root.querySelector('[data-hand="left"]') as HTMLElement;
  let collapsed = false;
  let trackerStatus: HandTrackerStatus = 'off';
  let latestFrame: HandSignalFrame | null = null;
  let currentMode: HandControlMode | null = null;
  let currentModeDetail = '';
  let outputIsWaiting = true;

  const translate = (key: string, fallback: string) => window.dailyfloraT?.(`hand.${key}`) || fallback;
  const syncTrackerCopy = () => {
    const statusKeys: Record<HandTrackerStatus, [string, string]> = {
      off: ['statusOff', 'Enable the camera; recognition runs only in this page.'],
      loading: ['statusLoading', 'Loading the hand-recognition model…'],
      'requesting-camera': ['statusRequesting', 'Allow this page to use the camera.'],
      running: ['statusRunning', 'Camera is on. Place both hands in view.'],
      error: ['statusError', 'The camera could not be started.']
    };
    const [key, fallback] = statusKeys[trackerStatus];
    message.textContent = translate(key, fallback);
    start.textContent = trackerStatus === 'running'
      ? translate('restart', 'Restart')
      : translate('enable', 'Enable camera');
    if (trackerStatus !== 'running') {
      const cameraKeys: Record<Exclude<HandTrackerStatus, 'running'>, [string, string]> = {
        off: ['cameraOff', 'CAMERA OFF'],
        loading: ['cameraLoading', 'LOADING'],
        'requesting-camera': ['cameraRequesting', 'ALLOW CAMERA'],
        error: ['cameraError', 'CAMERA ERROR']
      };
      const [cameraKey, cameraFallback] = cameraKeys[trackerStatus];
      fps.textContent = translate(cameraKey, cameraFallback);
    }
  };
  const syncDetectedHands = () => {
    const notDetected = translate('notDetected', 'Not detected');
    const right = latestFrame?.hands.right;
    const left = latestFrame?.hands.left;
    rightStatus.textContent = `${translate('rightHand', 'RIGHT')} · ${right?.tracked ? poseLabel(right.pose, translate) : notDetected}`;
    leftStatus.textContent = `${translate('leftHand', 'LEFT')} · ${left?.tracked ? poseLabel(left.pose, translate) : notDetected}`;
  };
  const syncModeCopy = () => {
    const modeKeys: Record<HandControlMode, [string, string]> = {
      idle: ['modeIdle', 'IDLE'],
      gesture: ['modeGesture', 'GESTURE'],
      brake: ['modeBrake', 'BRAKE'],
      xy: ['modeXy', 'XY MOVE'],
      depth: ['modeDepth', 'DEPTH'],
      spread: ['modeSpread', 'SPREAD'],
      rotate: ['modeRotate', 'ROTATE'],
      cooldown: ['modeCooldown', 'COOLDOWN']
    };
    const [modeKey, modeFallback] = currentMode ? modeKeys[currentMode] : modeKeys.idle;
    const detail = currentModeDetail
      .replace('ALL CONTROL STOP', translate('allControlStop', 'ALL CONTROL STOP'))
      .replace('NO HANDS', translate('noHands', 'NO HANDS'))
      .replace('CALIBRATING RIGHT PINCH', translate('calibratingPinch', 'CALIBRATING RIGHT PINCH'))
      .replace('RIGHT', translate('rightHand', 'RIGHT'))
      .replace('LEFT', translate('leftHand', 'LEFT'))
      .replace('READY', translate('ready', 'READY'))
      .replace('PINCH', translate('pinch', 'PINCH'));
    modeLabel.textContent = `${translate('mode', 'MODE')} · ${translate(modeKey, modeFallback)}${detail ? ` · ${detail}` : ''}`;
  };
  const localize = () => {
    root.querySelectorAll<HTMLElement>('[data-hand-copy]').forEach((element) => {
      const key = element.dataset.handCopy || '';
      element.textContent = translate(key, element.textContent || '');
    });
    const gestureKeys = ['index', 'victory', 'three', 'thumb', 'four', 'fist', 'pinch', 'open', 'curled', 'twoHands'];
    gestureKeys.forEach((key) => {
      const label = root.querySelector<HTMLElement>(`[data-hand-gesture-label="${key}"]`);
      const action = root.querySelector<HTMLElement>(`[data-hand-gesture-action="${key}"]`);
      if (label) label.textContent = translate(`${key}Label`, label.textContent || '');
      if (action) action.textContent = translate(`${key}Action`, action.textContent || '');
    });
    toggle.setAttribute('aria-label', translate('title', 'Camera gestures'));
    toggle.title = translate('title', 'Camera gestures');
    syncTrackerCopy();
    syncDetectedHands();
    syncModeCopy();
    if (outputIsWaiting) output.textContent = translate('waitingCamera', 'Waiting for camera');
  };
  localize();
  window.addEventListener('dailyflora:localechange', localize);

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    body.hidden = collapsed;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    root.classList.toggle('is-collapsed', collapsed);
  });
  guide.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('dailyflora:opentutorial', { detail: { kind: 'gesture' } }));
  });

  return {
    root,
    video,
    overlay,
    bind: (actions) => {
      start.addEventListener('click', actions.start);
      stop.addEventListener('click', actions.stop);
      swapHands.addEventListener('change', () => actions.setSwapHandedness(swapHands.checked));
    },
    setTrackerStatus: (status, text) => {
      void text;
      trackerStatus = status;
      dot.dataset.status = status;
      start.disabled = status === 'loading' || status === 'requesting-camera';
      syncTrackerCopy();
    },
    setMode: (mode, detail = '') => {
      currentMode = mode;
      currentModeDetail = detail;
      syncModeCopy();
      root.dataset.mode = mode;
    },
    setOutput: (text) => {
      outputIsWaiting = false;
      output.textContent = text;
    },
    renderFrame: (frame) => {
      latestFrame = frame;
      const right = frame.hands.right;
      const left = frame.hands.left;
      value('right-index').textContent = percent(right.pinch_index);
      value('right-pose').textContent = poseLabel(right.pose, translate);
      value('left-pose').textContent = poseLabel(left.pose, translate);
      value('right-depth').textContent = percent(right.depth);
      value('left-depth').textContent = percent(left.depth);
      value('right-openness').textContent = percent(right.openness);
      value('left-openness').textContent = percent(left.openness);
      value('spread').textContent = `${frame.spread_acceleration >= 0 ? '+' : ''}${frame.spread_acceleration.toFixed(2)}`;
      syncDetectedHands();
      rightStatus.classList.toggle('is-tracked', right.tracked);
      leftStatus.classList.toggle('is-tracked', left.tracked);
      fps.textContent = `${frame.fps.toFixed(0)} FPS · ${Number(left.tracked) + Number(right.tracked)} ${translate('handsUnit', 'HAND')}`;
    },
    destroy: () => root.remove()
  };
}
