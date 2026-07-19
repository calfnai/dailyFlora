export type ClockDisplaySource = 'auto' | 'manual';

export type IdleClockSettings = {
  autoEnabled: boolean;
  intervalMinutes: number;
};

type IdleClockCallbacks = {
  onShow: (source: ClockDisplaySource) => void;
  onHide: () => void;
};

const minIntervalMinutes = 1;
const maxIntervalMinutes = 120;

export function normalizeClockInterval(value: number) {
  if (!Number.isFinite(value)) return 5;
  return Math.min(maxIntervalMinutes, Math.max(minIntervalMinutes, Math.round(value)));
}

export class IdleClockController {
  private settings: IdleClockSettings;
  private timer = 0;
  private visibleSource: ClockDisplaySource | null = null;

  constructor(initialSettings: IdleClockSettings, private readonly callbacks: IdleClockCallbacks) {
    this.settings = { ...initialSettings, intervalMinutes: normalizeClockInterval(initialSettings.intervalMinutes) };
  }

  start() {
    this.schedule();
  }

  stop() {
    window.clearTimeout(this.timer);
  }

  getSettings() {
    return { ...this.settings };
  }

  updateSettings(next: Partial<IdleClockSettings>) {
    this.settings = {
      ...this.settings,
      ...next,
      intervalMinutes: normalizeClockInterval(next.intervalMinutes ?? this.settings.intervalMinutes)
    };
    this.schedule();
  }

  noteActivity() {
    if (this.visibleSource === 'auto') this.hide();
    this.schedule();
  }

  toggleManual() {
    if (this.visibleSource === 'manual') {
      this.hide();
      this.schedule();
      return false;
    }
    if (this.visibleSource === 'auto') this.hide();
    window.clearTimeout(this.timer);
    this.visibleSource = 'manual';
    this.callbacks.onShow('manual');
    return true;
  }

  private schedule() {
    window.clearTimeout(this.timer);
    if (!this.settings.autoEnabled || this.visibleSource === 'manual' || this.visibleSource === 'auto') return;
    this.timer = window.setTimeout(() => {
      this.visibleSource = 'auto';
      this.callbacks.onShow('auto');
    }, this.settings.intervalMinutes * 60_000);
  }

  private hide() {
    if (!this.visibleSource) return;
    this.visibleSource = null;
    this.callbacks.onHide();
  }
}
