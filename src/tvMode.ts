type DailyFloraWindow = Window & { __DAILYFLORA_DEVICE__?: string };

const tvWindow = window as DailyFloraWindow;
const tvSearchParams = new URLSearchParams(window.location.search);
const isTvMode =
  tvWindow.__DAILYFLORA_DEVICE__ === 'tv' ||
  tvSearchParams.get('device') === 'tv' ||
  tvSearchParams.has('tv');

const focusSelector = [
  '.special-start-button',
  '.special-mute-button:not([hidden])',
  '.site-menu-toggle',
  '.site-menu-panel a',
  '#controls-toggle',
  '#today-button',
  '#shuffle-button',
  '#fullscreen-button',
  '#zoom-out-button',
  '#zoom-in-button',
  '[data-density-choice]',
  '[data-render-choice]',
  '#pause-button',
  '#rotation-direction-button',
  '#rotation-speed',
  '#rotation-preset-button',
  '.calendar-nav-button',
  '.calendar-day:not(.is-empty)'
].join(',');

function injectTvCss() {
  const style = document.createElement('style');
  style.id = 'dailyflora-tv-mode-style';
  style.textContent = `
    body.is-tv-mode .hud,
    body.is-tv-mode .controls,
    body.is-tv-mode .hud.is-hidden,
    body.is-tv-mode .controls.is-hidden {
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
    }

    body.is-tv-mode .controls {
      right: 32px;
      bottom: 32px;
      max-width: min(960px, calc(100vw - 64px));
      padding: 12px;
      border-radius: 28px;
      background: rgb(8 9 12 / 62%);
    }

    body.is-tv-mode .controls-panel {
      display: flex !important;
    }

    body.is-tv-mode .icon-button:focus,
    body.is-tv-mode .segment-button:focus,
    body.is-tv-mode .site-menu-toggle:focus,
    body.is-tv-mode .site-menu-panel a:focus,
    body.is-tv-mode .calendar-nav-button:focus,
    body.is-tv-mode .calendar-day:focus,
    body.is-tv-mode .rotation-slider:focus,
    body.is-tv-mode [data-tv-focus='true'] {
      box-shadow: 0 0 0 3px rgb(255 216 101 / 92%), 0 0 0 8px rgb(255 216 101 / 18%) !important;
      transform: translateY(-1px) scale(1.04);
    }

    body.is-tv-mode .site-menu {
      top: 32px;
      right: 32px;
    }

    body.is-tv-mode .hud {
      top: 32px;
      left: 32px;
      max-width: calc(100vw - 220px);
    }

    body.is-tv-mode .daily-date {
      font-size: 16px;
    }

    body.is-tv-mode .daily-theme {
      font-size: clamp(28px, 3.4vw, 52px);
    }

    body.is-tv-mode .flower-plan-mark {
      max-width: min(920px, calc(100vw - 260px));
      font-size: 15px;
    }

    body.is-tv-mode .quality-mark {
      font-size: 14px;
      padding: 8px 12px;
    }

    body.is-tv-mode .icon-button,
    body.is-tv-mode .date-control {
      width: 56px;
      height: 56px;
    }

    body.is-tv-mode .compact-button {
      width: 48px;
      height: 48px;
    }

    body.is-tv-mode .segment-button {
      min-width: 52px;
      height: 46px;
      padding: 0 16px;
      font-size: 16px;
    }

    body.is-tv-mode .rotation-slider {
      width: 180px;
      height: 42px;
    }

    body.is-tv-mode .tv-remote-hint {
      position: fixed;
      left: 32px;
      bottom: 32px;
      z-index: 4;
      max-width: 560px;
      padding: 12px 16px;
      border: 1px solid rgb(255 255 255 / 12%);
      border-radius: 999px;
      color: rgb(255 250 235 / 76%);
      background: rgb(8 9 12 / 58%);
      box-shadow: 0 18px 60px rgb(0 0 0 / 30%);
      font-size: 15px;
      pointer-events: none;
    }
  `;
  document.head.append(style);
}

function isVisible(element: HTMLElement) {
  if (element.hidden || element.hasAttribute('disabled')) return false;
  if (element.classList.contains('date-picker')) return false;
  let node: HTMLElement | null = element;
  while (node) {
    if (node.hidden) return false;
    node = node.parentElement;
  }
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden';
}

function getFocusableElements() {
  return Array.from(document.querySelectorAll<HTMLElement>(focusSelector)).filter(isVisible);
}

function focusElement(element: HTMLElement) {
  document.querySelectorAll<HTMLElement>('[data-tv-focus="true"]').forEach((item) => item.removeAttribute('data-tv-focus'));
  element.setAttribute('data-tv-focus', 'true');
  element.focus({ preventScroll: true });
}

function focusByDelta(delta: number) {
  const focusables = getFocusableElements();
  if (!focusables.length) return;
  const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const activeIndex = active ? focusables.indexOf(active) : -1;
  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + delta + focusables.length) % focusables.length;
  focusElement(focusables[nextIndex]);
}

function ensureControlsExpanded() {
  const controls = document.querySelector<HTMLElement>('#controls');
  const controlsToggleButton = document.querySelector<HTMLButtonElement>('#controls-toggle');
  const controlsPanel = document.querySelector<HTMLElement>('#controls-panel');
  const hud = document.querySelector<HTMLElement>('#hud');

  hud?.classList.remove('is-hidden');
  if (!controls || !controlsToggleButton || !controlsPanel) return;
  controls.classList.remove('is-hidden', 'is-collapsed');
  controls.classList.add('is-expanded');
  controlsPanel.hidden = false;
  controlsToggleButton.setAttribute('aria-expanded', 'true');
  controlsToggleButton.setAttribute('aria-label', 'TV controls pinned');
  controlsToggleButton.title = 'TV controls pinned';
}

function createRemoteHint() {
  if (document.querySelector('.tv-remote-hint')) return;
  const hint = document.createElement('aside');
  hint.className = 'tv-remote-hint';
  hint.textContent = '遥控器：←/→ 选择 · OK 确认 · ↑/↓ 调整滑杆 · 返回关闭面板';
  document.body.append(hint);
}

function adjustRange(element: HTMLInputElement, delta: number) {
  const min = Number(element.min || '0');
  const max = Number(element.max || '100');
  const current = Number(element.value || '0');
  const next = Math.min(max, Math.max(min, current + delta));
  element.value = String(next);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

function clickActiveElement() {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) {
    focusByDelta(1);
    return;
  }
  if (active instanceof HTMLInputElement && active.type === 'range') return;
  active.click();
}

function closeTopLayer() {
  const siteMenuPanel = document.querySelector<HTMLElement>('#site-menu-panel');
  const siteMenuToggle = document.querySelector<HTMLButtonElement>('#site-menu-toggle');
  const calendarPanel = document.querySelector<HTMLElement>('#date-calendar');
  const todayButton = document.querySelector<HTMLButtonElement>('#today-button');

  if (siteMenuPanel && !siteMenuPanel.hidden) {
    siteMenuPanel.hidden = true;
    siteMenuToggle?.setAttribute('aria-expanded', 'false');
    siteMenuToggle && focusElement(siteMenuToggle);
    return;
  }

  if (calendarPanel && !calendarPanel.hidden) {
    calendarPanel.hidden = true;
    todayButton?.setAttribute('aria-expanded', 'false');
    todayButton && focusElement(todayButton);
    return;
  }

  ensureControlsExpanded();
  focusByDelta(1);
}

function bindRemoteKeys() {
  window.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    const activeInput = active instanceof HTMLInputElement ? active : null;
    const activeRange = activeInput?.type === 'range' ? activeInput : null;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      ensureControlsExpanded();
      activeRange ? adjustRange(activeRange, 5) : focusByDelta(1);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      ensureControlsExpanded();
      activeRange ? adjustRange(activeRange, -5) : focusByDelta(-1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      ensureControlsExpanded();
      activeRange ? adjustRange(activeRange, 10) : focusByDelta(-3);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      ensureControlsExpanded();
      activeRange ? adjustRange(activeRange, -10) : focusByDelta(3);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      ensureControlsExpanded();
      clickActiveElement();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeTopLayer();
    }
  }, true);
}

function bootTvMode() {
  document.body.classList.add('is-tv-mode');
  injectTvCss();
  createRemoteHint();
  ensureControlsExpanded();
  bindRemoteKeys();
  window.setTimeout(() => {
    ensureControlsExpanded();
    const pauseButton = document.querySelector<HTMLButtonElement>('#pause-button');
    const controlsToggleButton = document.querySelector<HTMLButtonElement>('#controls-toggle');
    const first = pauseButton || controlsToggleButton || getFocusableElements()[0];
    if (first) focusElement(first);
  }, 800);
  window.setInterval(ensureControlsExpanded, 1200);
}

if (isTvMode) bootTvMode();
