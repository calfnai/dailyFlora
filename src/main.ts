import './styles.css';
import type { QualityName } from './types';
import { todayKey } from './random';
import { createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';

type RotationDirection = 1 | -1;

const minRotationSpeed = 0.012;
const maxRotationSpeed = 0.13;
const rotationPresets: Array<{ speed: number; direction: RotationDirection; tilt: number }> = [
  { speed: 0.038, direction: 1, tilt: -0.28 },
  { speed: 0.052, direction: -1, tilt: 0.18 },
  { speed: 0.072, direction: 1, tilt: -0.42 },
  { speed: 0.046, direction: -1, tilt: 0.36 },
  { speed: 0.092, direction: 1, tilt: -0.12 }
];

const canvas = document.querySelector<HTMLCanvasElement>('#flora-canvas');
const hud = document.querySelector<HTMLElement>('#hud');
const controls = document.querySelector<HTMLElement>('#controls');
const dateLabel = document.querySelector<HTMLElement>('#daily-date');
const themeLabel = document.querySelector<HTMLElement>('#daily-theme');
const qualityLabel = document.querySelector<HTMLElement>('#quality-mark');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
const todayButton = document.querySelector<HTMLButtonElement>('#today-button');
const shuffleButton = document.querySelector<HTMLButtonElement>('#shuffle-button');
const fullscreenButton = document.querySelector<HTMLButtonElement>('#fullscreen-button');
const qualityButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-quality-choice]'));
const rotationSpeedInput = document.querySelector<HTMLInputElement>('#rotation-speed');
const rotationDirectionButton = document.querySelector<HTMLButtonElement>('#rotation-direction-button');
const rotationPresetButton = document.querySelector<HTMLButtonElement>('#rotation-preset-button');

if (!canvas || !hud || !controls || !dateLabel || !themeLabel || !qualityLabel) {
  throw new Error('DailyFlora could not find the required page elements.');
}

const ui = {
  canvas,
  hud,
  controls,
  dateLabel,
  themeLabel,
  qualityLabel
};

let params = readParams();
let selectedQuality = normalizeQuality(params.quality);
let quality = resolveQuality(selectedQuality);
let spec = createDailySpec(params.date, params.seed);
let scene = new BouquetScene(ui.canvas, spec, quality);
let hideTimer = 0;
let previewCount = 0;
let rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
let rotationDirection: RotationDirection = 1;
let presetIndex = 0;
let manualRotation = false;

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeQuality(value: string): QualityName {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'auto' ? value : 'auto';
}

function speedToSlider(speed: number) {
  return Math.round(((speed - minRotationSpeed) / (maxRotationSpeed - minRotationSpeed)) * 100);
}

function sliderToSpeed(value: string) {
  const ratio = Number(value) / 100;
  return minRotationSpeed + (maxRotationSpeed - minRotationSpeed) * ratio;
}

function setLabels() {
  ui.dateLabel.textContent = spec.dateLabel;
  ui.themeLabel.textContent = spec.theme.name;
  ui.qualityLabel.textContent = selectedQuality === 'auto' ? `auto/${quality.name}` : quality.name;
  document.title = `DailyFlora - ${spec.theme.name}`;
}

function syncControls() {
  qualityButtons.forEach((button) => {
    const active = button.dataset.qualityChoice === selectedQuality;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });

  if (rotationSpeedInput) {
    rotationSpeedInput.value = String(speedToSlider(rotationSpeed));
    rotationSpeedInput.setAttribute('aria-valuetext', `${Math.round(rotationSpeed * 1000)}`);
  }

  if (rotationDirectionButton) {
    const reverse = rotationDirection === -1;
    rotationDirectionButton.classList.toggle('is-reverse', reverse);
    rotationDirectionButton.setAttribute('aria-label', reverse ? 'Clockwise rotation' : 'Counterclockwise rotation');
    rotationDirectionButton.title = reverse ? 'Clockwise rotation' : 'Counterclockwise rotation';
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
  if (selectedQuality === 'auto') {
    next.searchParams.delete('quality');
  } else {
    next.searchParams.set('quality', selectedQuality);
  }
  window.history.replaceState({}, '', next);
}

function applyRotationSettings(tilt?: number) {
  scene.setRotationSettings({ speed: rotationSpeed, direction: rotationDirection, tilt });
  syncControls();
}

function rebuild(date: string, seed: string) {
  spec = createDailySpec(date, seed);
  if (!manualRotation) {
    rotationSpeed = THREEClamp(spec.rotationSpeed, minRotationSpeed, maxRotationSpeed);
  }
  scene.rebuild(spec, quality);
  applyRotationSettings();
  setLabels();
  updateUrl(date, seed);
  params = { date, seed, quality: selectedQuality };
  revealUi();
}

function setQuality(nextQuality: QualityName) {
  selectedQuality = nextQuality;
  const next = resolveQuality(selectedQuality);
  const changed = next.name !== quality.name;
  quality = next;
  if (changed) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
  }
  setLabels();
  syncControls();
  updateUrl(spec.dateLabel, spec.seed);
  revealUi();
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
  const today = todayKey();
  previewCount = 0;
  rebuild(today, today);
});

shuffleButton?.addEventListener('click', () => {
  previewCount += 1;
  const date = params.date || todayKey();
  rebuild(date, `${date}:preview:${previewCount}:${Math.random().toString(36).slice(2, 7)}`);
});

fullscreenButton?.addEventListener('click', async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen();
  } else {
    await document.exitFullscreen();
  }
  revealUi();
});

qualityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setQuality(normalizeQuality(button.dataset.qualityChoice || 'auto'));
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
  manualRotation = true;
  const preset = rotationPresets[presetIndex % rotationPresets.length];
  presetIndex += 1;
  rotationSpeed = preset.speed;
  rotationDirection = preset.direction;
  applyRotationSettings(preset.tilt);
  revealUi();
});

window.addEventListener('resize', () => {
  const nextQuality = resolveQuality(selectedQuality);
  const qualityChanged = nextQuality.name !== quality.name;
  quality = nextQuality;
  scene.resize();
  if (qualityChanged) {
    scene.rebuild(spec, quality);
    applyRotationSettings();
    setLabels();
  }
});

['pointermove', 'pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, revealUi, { passive: true });
});

window.addEventListener('beforeunload', () => scene.stop());

setLabels();
applyRotationSettings();
revealUi();
scene.start();
