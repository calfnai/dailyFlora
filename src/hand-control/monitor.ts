import type { HandControlMode, HandSignalFrame, HandTrackerStatus } from './types.ts';

const percent = (value: number) => `${Math.round(value * 100)}%`;

export type HandMonitor = {
  root: HTMLElement;
  video: HTMLVideoElement;
  overlay: HTMLCanvasElement;
  bind: (actions: { start: () => void; stop: () => void }) => void;
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
      <span class="hand-camera-dot" data-status="off"></span><span>摄像头手势</span>
    </button>
    <div class="hand-camera-body">
      <div class="hand-camera-preview">
        <video playsinline muted></video><canvas></canvas>
        <span class="hand-camera-fps">CAMERA OFF</span>
      </div>
      <p class="hand-camera-message">点击启用后，识别完全在当前网页中运行。</p>
      <div class="hand-camera-actions">
        <button type="button" data-action="start">启用摄像头</button>
        <button type="button" data-action="stop" class="quiet">关闭</button>
      </div>
      <div class="hand-camera-values">
        <span><b>右食指</b><i data-value="right-index">0%</i></span>
        <span><b>右中指</b><i data-value="right-middle">0%</i></span>
        <span><b>右无名指</b><i data-value="right-ring">0%</i></span>
        <span><b>右小指</b><i data-value="right-pinky">0%</i></span>
        <span><b>左食指</b><i data-value="left-index">0%</i></span>
        <span><b>左小指</b><i data-value="left-pinky">0%</i></span>
        <span><b>深度</b><i data-value="depth">0%</i></span>
        <span><b>张开</b><i data-value="openness">0%</i></span>
        <span><b>双手加速度</b><i data-value="spread">0%</i></span>
      </div>
      <div class="hand-camera-output"><span>ACTUAL OUTPUT</span><b>等待摄像头</b></div>
      <p class="hand-camera-mode">MODE · IDLE</p>
    </div>`;
  document.body.append(root);
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
  let collapsed = false;

  toggle.addEventListener('click', () => {
    collapsed = !collapsed;
    body.hidden = collapsed;
    toggle.setAttribute('aria-expanded', String(!collapsed));
    root.classList.toggle('is-collapsed', collapsed);
  });

  return {
    root,
    video,
    overlay,
    bind: (actions) => {
      start.addEventListener('click', actions.start);
      stop.addEventListener('click', actions.stop);
    },
    setTrackerStatus: (status, text) => {
      dot.dataset.status = status;
      message.textContent = text;
      start.disabled = status === 'loading' || status === 'requesting-camera';
      start.textContent = status === 'running' ? '重新启用' : '启用摄像头';
      if (status !== 'running') fps.textContent = status === 'off' ? 'CAMERA OFF' : status.toUpperCase();
    },
    setMode: (mode, detail = '') => {
      modeLabel.textContent = `MODE · ${mode.toUpperCase()}${detail ? ` · ${detail}` : ''}`;
      root.dataset.mode = mode;
    },
    setOutput: (text) => { output.textContent = text; },
    renderFrame: (frame) => {
      const right = frame.hands.right;
      const left = frame.hands.left;
      value('right-index').textContent = percent(right.pinch_index);
      value('right-middle').textContent = percent(right.pinch_middle);
      value('right-ring').textContent = percent(right.pinch_ring);
      value('right-pinky').textContent = percent(right.pinch_pinky);
      value('left-index').textContent = percent(left.pinch_index);
      value('left-pinky').textContent = percent(left.pinch_pinky);
      value('depth').textContent = percent(right.depth);
      value('openness').textContent = percent(right.openness);
      value('spread').textContent = `${frame.spread_acceleration >= 0 ? '+' : ''}${frame.spread_acceleration.toFixed(2)}`;
      fps.textContent = `${frame.fps.toFixed(0)} FPS · ${Number(left.tracked) + Number(right.tracked)} HAND`;
    },
    destroy: () => root.remove()
  };
}
