import './styles.css';
import type { QualityName } from './types';
import { todayKey } from './random';
import { createDailySpec, readParams } from './spec';
import { resolveQuality } from './quality';
import { BouquetScene } from './bouquetScene';

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
let quality = resolveQuality(params.quality as QualityName);
let spec = createDailySpec(params.date, params.seed);
let scene = new BouquetScene(ui.canvas, spec, quality);
let hideTimer = 0;
let previewCount = 0;

function setLabels() {
  ui.dateLabel.textContent = spec.dateLabel;
  ui.themeLabel.textContent = spec.theme.name;
  ui.qualityLabel.textContent = quality.name;
  document.title = `DailyFlora - ${spec.theme.name}`;
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
  window.history.replaceState({}, '', next);
}

function rebuild(date: string, seed: string) {
  spec = createDailySpec(date, seed);
  scene.rebuild(spec, quality);
  setLabels();
  updateUrl(date, seed);
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

window.addEventListener('resize', () => {
  const nextQuality = resolveQuality((new URLSearchParams(window.location.search).get('quality') || 'auto') as QualityName);
  const qualityChanged = nextQuality.name !== quality.name;
  quality = nextQuality;
  scene.resize();
  if (qualityChanged) {
    scene.rebuild(spec, quality);
    setLabels();
  }
});

['pointermove', 'pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  window.addEventListener(eventName, revealUi, { passive: true });
});

window.addEventListener('beforeunload', () => scene.stop());

setLabels();
revealUi();
scene.start();
