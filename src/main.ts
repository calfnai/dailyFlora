import './styles.css';
import type { DensityName, RenderQualityName } from './types';
import { todayKey } from './random';
import { createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';
import { createSpecialSpec, readSpecialId, specialReferences, withBasePath } from './special';

type RotationDirection = 1 | -1;
type CameraRouteMode = 'orbit' | 'high-arc' | 'low-arc' | 'near-far' | 'figure-eight';

const minRotationSpeed = 0.012;
const maxRotationSpeed = 0.13;
const densityLabels: Record<DensityName, string> = {
  low: '疏',
  medium: '中',
  high: '密'
};
const renderLabels: Record<Exclude<RenderQualityName, 'auto'>, string> = {
  low: '省',
  medium: '清',
  high: '精'
};
const themeEnglishNames: Record<string, string> = {
  'tropical-forest': 'Tropical Forest',
  'moon-white': 'Moon White Hand-Tied',
  'fairy-violet': 'Fairy Violet Mist',
  'sea-salt-lemon': 'Sea Salt Lemon',
  'hillside-wild': 'Hillside Wildflowers',
  'summer-pinwheel': 'Summer Pinwheel',
  'dopamine-field': 'Dopamine Field',
  'starry-night': 'Starry Night',
  'her-january-sky': 'Her January Sky'
};
const rotationPresets: Array<{
  speed: number;
  direction: RotationDirection;
  pitch: number;
  mode: CameraRouteMode;
  pitchAmplitude: number;
  yawAmplitude: number;
  distanceAmplitude: number;
  targetYAmplitude: number;
}> = [
  {
    speed: 0.036,
    direction: 1,
    pitch: 0.38,
    mode: 'orbit',
    pitchAmplitude: 0,
    yawAmplitude: 0,
    distanceAmplitude: 0,
    targetYAmplitude: 0
  },
  {
    speed: 0.052,
    direction: 1,
    pitch: 0.78,
    mode: 'high-arc',
    pitchAmplitude: 0.28,
    yawAmplitude: 0.16,
    distanceAmplitude: 0.16,
    targetYAmplitude: 0.08
  },
  {
    speed: 0.044,
    direction: -1,
    pitch: 0.24,
    mode: 'low-arc',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.2,
    distanceAmplitude: 0.24,
    targetYAmplitude: 0.06
  },
  {
    speed: 0.064,
    direction: 1,
    pitch: 0.52,
    mode: 'near-far',
    pitchAmplitude: 0.18,
    yawAmplitude: 0.24,
    distanceAmplitude: 0.52,
    targetYAmplitude: 0.12
  },
  {
    speed: 0.046,
    direction: -1,
    pitch: 0.62,
    mode: 'figure-eight',
    pitchAmplitude: 0.26,
    yawAmplitude: 0.48,
    distanceAmplitude: 0.32,
    targetYAmplitude: 0.1
  }
];

const canvas = document.querySelector<HTMLCanvasElement>('#flora-canvas');
const hud = document.querySelector<HTMLElement>('#hud');
const controls = document.querySelector<HTMLElement>('#controls');
const dateLabel = document.querySelector<HTMLElement>('#daily-date');
const themeLabel = document.querySelector<HTMLElement>('#daily-theme');
const flowerPlanLabel = document.querySelector<HTMLElement>('#flower-plan-mark');
const qualityLabel = document.querySelector<HTMLElement>('#quality-mark');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const todayButton = document.querySelector<HTMLButtonElement>('#today-button');
const datePicker = document.querySelector<HTMLInputElement>('#date-picker');
const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-button');
const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen-button');
const zoomInButton = document.querySelector<HTMLButtonElement>('#zoom-in-button');
const zoomOutButton = document.querySelector<HTMLButtonElement>('#zoom-out-button');
const densityButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-density-choice]'));
const renderButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-render-choice]'));
const rotationSpeedInput = document.querySelector<HTMLInputElement>('#rotation-speed');
const rotationDirectionButton = document.querySelector<HTMLButtonElement>('#rotation-direction-button');
const rotationPresetButton = document.querySelector<HTMLButtonElement>('#rotation-preset-button');

if (!canvas || !hud || !controls || !dateLabel || !themeLabel || !flowerPlanLabel || !qualityLabel) {
  throw new Error('DailyFlora could not find the required page elements.');
}

const ui = {
  canvas,
  hud,
  controls,
  dateLabel,
  themeLabel,
  flowerPlanLabel,
  qualityLabel
};

let params = readParams();
const specialId = readSpecialId();
const specialReference = specialId ? specialReferences[specialId] : null;
let selectedDensity = specialReference ? 'medium' : normalizeDensity(params.density);
let selectedRender = normalizeRender(params.render);
let selectedTheme = specialReference ? specialReference.theme.id : params.theme;
let quality = resolveQuality(selectedDensity, selectedRender);
let spec = specialReference
  ? createSpecialSpec(specialReference, new URLSearchParams(window.location.search).get('date') || undefined)
  : createDailySpec(params.date, params.seed, selectedTheme);
let scene = new BouquetScene(ui.canvas, spec, quality);
let hideTimer = 0;
let previewCount = 0;
let rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
let rotationDirection: RotationDirection = 1;
let cameraRouteMode: CameraRouteMode = 'orbit';
let pitchAmplitude = 0;
let yawAmplitude = 0;
let distanceAmplitude = 0;
let targetYAmplitude = 0;
let manualRotation = false;
let manualZoom = 0;
let specialAudio: HTMLAudioElement | null = null;

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeDensity(value: string): DensityName {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

function normalizeRender(value: string): RenderQualityName {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'auto' ? value : 'auto';
}

function speedToSlider(speed: number) {
  return Math.round(((speed - minRotationSpeed) / (maxRotationSpeed - minRotationSpeed)) * 100);
}

function sliderToSpeed(value: string) {
  const ratio = Number(value) / 100;
  return minRotationSpeed + (maxRotationSpeed - minRotationSpeed) * ratio;
}

function bouquetHoverTitle() {
  const english = themeEnglishNames[spec.theme.id] || spec.theme.id;
  return `${spec.theme.name} / ${english}`;
}

function flowerPlanText() {
  return spec.flowerPlan.items.map((item) => item.cn).join(' / ');
}

function setLabels() {
  ui.dateLabel.textContent = spec.dateLabel;
  ui.themeLabel.textContent = spec.theme.name;
  ui.flowerPlanLabel.textContent = `${spec.flowerPlan.cnName} · ${flowerPlanText()}`;
  ui.flowerPlanLabel.title = `${spec.flowerPlan.reference}\n${spec.flowerPlan.silhouette}\n避免：${spec.flowerPlan.avoid}`;
  if (datePicker) datePicker.value = spec.dateLabel;
  ui.themeLabel.title = bouquetHoverTitle();
  ui.dateLabel.title = bouquetHoverTitle();
  todayButton?.setAttribute('title', `选择日期 · ${bouquetHoverTitle()}`);
  todayButton?.setAttribute('aria-label', `Pick bouquet date: ${bouquetHoverTitle()}`);
  shuffleButton?.setAttribute('title', `随机日期花束 · ${bouquetHoverTitle()}`);
  const renderLabel =
    selectedRender === 'auto' ? `自/${renderLabels[quality.renderName]}` : renderLabels[quality.renderName];
  ui.qualityLabel.textContent = `${densityLabels[quality.densityName]} · ${renderLabel}`;
  document.title = `DailyFlora - ${spec.theme.name}`;
}

function syncControls() {
  densityButtons.forEach((button) => {
    const active = button.dataset.densityChoice === selectedDensity;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  renderButtons.forEach((button) => {
    const active = button.dataset.renderChoice === selectedRender;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (rotationSpeedInput) {
    rotationSpeedInput.value = String(speedToSlider(rotationSpeed));
    rotationSpeedInput.setAttribute('aria-valuetext', `${Math.round(rotationSpeed * 1000)}`);
  }

  if (rotationDirectionButton) {
    rotationDirectionButton.classList.toggle('is-reverse', rotationDirection === -1);
    rotationDirectionButton.setAttribute('aria-label', 'Reverse current camera route');
    rotationDirectionButton.title = 'Reverse current camera route';
  }
}

function revealUi() {
  ui.hud.classList.remove('is-hidden');
  ui.controls.classList.remove('is-hidden');
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    ui.hud.classList.add('is-hidden');
    ui.controls.classList.add('is-hidden');
  }, 3200);
}

function positionDatePicker() {
  if (!datePicker || !todayButton) return;
  const rect = todayButton.getBoundingClientRect();
  datePicker.style.left = `${Math.round(rect.left)}px`;
  datePicker.style.top = `${Math.round(rect.top)}px`;
}

function updateUrl(date: string, seed: string) {
  const next = new URL(window.location.href);
  if (date === todayKey()) {
    next.searchParams.delete('date');
  } else {
    next.searchParams.set('date', date);
  }
  if (seed === date) {
    next.searchParams.delete('seed');
  } else {
    next.searchParams.set('seed', seed);
  }
  next.searchParams.delete('quality');
  if (selectedDensity === 'medium') {
    next.searchParams.delete('density');
  } else {
    next.searchParams.set('density', selectedDensity);
  }
  if (selectedRender === 'auto') {
    next.searchParams.delete('render');
  } else {
    next.searchParams.set('render', selectedRender);
  }
  if (selectedTheme === 'random') {
    next.searchParams.delete('theme');
  } else {
    next.searchParams.set('theme', selectedTheme);
  }
  if (specialReference) {
    next.searchParams.set('special', specialReference.id);
    next.searchParams.set('date', date);
  }
  window.history.replaceState({}, '', next);
}

function applyRotationSettings(pitch?: number) {
  scene.setRotationSettings({
    speed: rotationSpeed,
    direction: rotationDirection,
    pitch,
    mode: cameraRouteMode,
    pitchAmplitude,
    yawAmplitude,
    distanceAmplitude,
    targetYAmplitude
  });
  syncControls();
}

function applyZoom(nextZoom: number) {
  manualZoom = scene.setZoomOffset(THREEClamp(nextZoom, -1.35, 1.65));
  revealUi();
}

function zoomBy(delta: number) {
  manualZoom = scene.zoomBy(delta);
  revealUi();
}

function applyRoutePreset(preset: (typeof rotationPresets)[number]) {
  manualRotation = true;
  rotationSpeed = preset.speed;
  rotationDirection = preset.direction;
  cameraRouteMode = preset.mode;
  pitchAmplitude = preset.pitchAmplitude;
  yawAmplitude = preset.yawAmplitude;
  distanceAmplitude = preset.distanceAmplitude;
  targetYAmplitude = preset.targetYAmplitude;
  applyRotationSettings(preset.pitch);
}

function randomDateKey() {
  const start = new Date('2026-01-01T00:00:00');
  const end = new Date('2026-12-31T00:00:00');
  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((end.getTime() - start.getTime()) / dayMs);
  const date = new Date(start.getTime() + Math.floor(Math.random() * (days + 1)) * dayMs);
  return date.toISOString().slice(0, 10);
}

function rebuild(date: string, seed: string) {
  spec = specialReference ? createSpecialSpec(specialReference, date) : createDailySpec(date, seed, selectedTheme);
  if (!manualRotation) {
    rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
    cameraRouteMode = 'orbit';
    pitchAmplitude = 0;
    yawAmplitude = 0;
    distanceAmplitude = 0;
    targetYAmplitude = 0;
  }
  scene.rebuild(spec, quality);
  applyRotationSettings();
  setLabels();
  updateUrl(date, seed);
  params = { date, seed, density: selectedDensity, render: selectedRender, theme: selectedTheme };
  revealUi();
}

function createSpecialOverlay() {
  if (!specialReference) return;
  document.body.classList.add('is-special');

  const overlay = document.createElement('section');
  overlay.className = 'special-start-overlay';
  overlay.setAttribute('aria-label', 'Start special bouquet');
  overlay.innerHTML = `
    <div class="special-start-copy">
      <p class="special-date">1997.01.29</p>
      <h1>A galaxy, wound around its own light.</h1>
      <button class="special-start-button" type="button">Start the bouquet</button>
    </div>
  `;

  const caption = document.createElement('aside');
  caption.className = 'special-caption';
  caption.innerHTML = `
    <p>NGC 2787 · seen by Hubble</p>
    <p>A bouquet remembered for 2026.06.29</p>
  `;

  const quote = document.createElement('aside');
  quote.className = 'special-quote';
  quote.innerHTML = `
    <p>Some flowers last for days.<br />Some light travels long enough to arrive as a memory.</p>
    <p lang="zh-CN">有些花会谢。<br />有些光，会走很久才抵达。</p>
  `;

  const credit = document.createElement('aside');
  credit.className = 'special-credit';
  credit.textContent = 'Image source: NASA / ESA / Hubble';

  document.body.append(overlay, caption, quote, credit);

  try {
    specialAudio = new Audio(withBasePath(specialReference.audioPath));
    specialAudio.loop = true;
    specialAudio.preload = 'auto';
    specialAudio.volume = 0.42;
  } catch {
    specialAudio = null;
  }

  overlay.querySelector<HTMLButtonElement>('.special-start-button')?.addEventListener('click', async () => {
    overlay.classList.add('is-dismissed');
    try {
      await specialAudio?.play();
    } catch {
      specialAudio = null;
    }
    window.setTimeout(() => overlay.remove(), 900);
  });
}

function rebuildQuality(nextDensity = selectedDensity, nextRender = selectedRender) {
  const next = resolveQuality(nextDensity, nextRender);
  const changed = next.densityName !== quality.densityName || next.renderName !== quality.renderName;
  quality = next;
  if (changed) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    scene.setZoomOffset(manualZoom);
  }
  setLabels();
  syncControls();
  updateUrl(spec.dateLabel, spec.seed);
  revealUi();
}

function setDensity(nextDensity: DensityName) {
  selectedDensity = nextDensity;
  rebuildQuality();
}

function setRender(nextRender: RenderQualityName) {
  selectedRender = nextRender;
  rebuildQuality();
}

pauseButton?.addEventListener('click', () => {
  const paused = scene.togglePause();
  pauseButton.setAttribute('aria-label', paused ? 'Resume rotation' : 'Pause rotation');
  pauseButton.title = paused ? 'Resume rotation' : 'Pause rotation';
  pauseButton.innerHTML = paused
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z" /></svg>';
  revealUi();
});

todayButton?.addEventListener('click', () => {
  if (datePicker) {
    positionDatePicker();
    datePicker.value = spec.dateLabel;
    if (typeof datePicker.showPicker === 'function') {
      datePicker.showPicker();
    } else {
      datePicker.click();
    }
  }
  revealUi();
});

datePicker?.addEventListener('change', () => {
  if (!datePicker.value) return;
  previewCount = 0;
  rebuild(datePicker.value, datePicker.value);
  datePicker.blur();
});

shuffleButton?.addEventListener('click', () => {
  const date = randomDateKey();
  previewCount = 0;
  rebuild(date, date);
});

fullscreenButton?.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
  revealUi();
});

zoomInButton?.addEventListener('click', () => {
  zoomBy(-0.28);
});

zoomOutButton?.addEventListener('click', () => {
  zoomBy(0.28);
});

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const normalized = THREEClamp(event.deltaY / 520, -0.42, 0.42);
    applyZoom(manualZoom + normalized);
  },
  { passive: false }
);

densityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setDensity(normalizeDensity(button.dataset.densityChoice || 'medium'));
  });
});

renderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setRender(normalizeRender(button.dataset.renderChoice || 'auto'));
  });
});

rotationSpeedInput?.addEventListener('input', () => {
  manualRotation = true;
  rotationSpeed = sliderToSpeed(rotationSpeedInput.value);
  applyRotationSettings();
  revealUi();
});

rotationDirectionButton?.addEventListener('click', () => {
  manualRotation = true;
  rotationDirection = rotationDirection === 1 ? -1 : 1;
  applyRotationSettings();
  revealUi();
});

rotationPresetButton?.addEventListener('click', () => {
  const preset = rotationPresets[Math.floor(Math.random() * rotationPresets.length)];
  applyRoutePreset({
    ...preset,
    direction: Math.random() > 0.5 ? 1 : -1,
    speed: THREEClamp(preset.speed * (0.78 + Math.random() * 0.58), minRotationSpeed, maxRotationSpeed)
  });
  revealUi();
});

window.addEventListener('resize', () => {
  const nextQuality = resolveQuality(selectedDensity, selectedRender);
  const qualityChanged = nextQuality.densityName !== quality.densityName || nextQuality.renderName !== quality.renderName;
  quality = nextQuality;
  scene.resize();
  if (qualityChanged) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    setLabels();
  }
  positionDatePicker();
});

['pointermove', 'pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, revealUi, { passive: true });
});

window.addEventListener('beforeunload', () => scene.stop());

setLabels();
if (specialReference) {
  rotationSpeed = 0.024;
  cameraRouteMode = 'figure-eight';
  pitchAmplitude = 0.16;
  yawAmplitude = 0.2;
  distanceAmplitude = 0.18;
  targetYAmplitude = 0.08;
  createSpecialOverlay();
}
applyRotationSettings();
scene.setZoomOffset(manualZoom);
revealUi();
scene.start();
