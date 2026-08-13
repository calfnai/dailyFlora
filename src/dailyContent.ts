export type RemoteDailyContentEntry = {
  date: string;
  seed: string;
  themeId?: string;
  density?: 'low' | 'medium' | 'high';
  render?: 'low' | 'medium' | 'high';
  contentVersion?: string;
};

export type DailyContentManifest = {
  schemaVersion: 1;
  generatedAt: string;
  source: string;
  entries: Record<string, RemoteDailyContentEntry>;
};

export type DailyContentLoadResult = {
  entry: RemoteDailyContentEntry;
  source: 'github' | 'cache';
  url?: string;
  latencyMs?: number;
  error?: string;
};

type DailyContentCache = {
  schemaVersion: 1;
  checkedDate: string;
  checkedAt: string;
  sourceUrl?: string;
  networkSucceeded: boolean;
  manifest: DailyContentManifest | null;
};

const dailyContentCacheKey = 'dailyflora.desktop.daily-content.v1';
const defaultDailyContentUrls = [
  'https://raw.githubusercontent.com/calfnai/dailyFlora/codex/dailyflora-desktop-windows/data/daily-content.json',
  'https://calfnai.github.io/dailyFlora/daily-content.json'
];

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isSafeSeed(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 160;
}

function isEntry(value: unknown): value is RemoteDailyContentEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<RemoteDailyContentEntry>;
  return isDateKey(entry.date) && isSafeSeed(entry.seed);
}

export function validateDailyContentManifest(value: unknown): DailyContentManifest | null {
  if (!value || typeof value !== 'object') return null;
  const manifest = value as Partial<DailyContentManifest>;
  if (manifest.schemaVersion !== 1 || typeof manifest.generatedAt !== 'string' || typeof manifest.source !== 'string') {
    return null;
  }
  if (!manifest.entries || typeof manifest.entries !== 'object') return null;

  const entries: Record<string, RemoteDailyContentEntry> = {};
  for (const [date, entry] of Object.entries(manifest.entries)) {
    if (!isDateKey(date) || !isEntry(entry) || entry.date !== date) return null;
    entries[date] = entry;
  }
  return { schemaVersion: 1, generatedAt: manifest.generatedAt, source: manifest.source, entries };
}

export function getDailyContentUrls(config: Window['__DAILYFLORA_CONFIG__'] = undefined) {
  const configured = [
    ...(config?.dailyContentUrls || []),
    ...(config?.dailyContentUrl ? [config.dailyContentUrl] : []),
    ...defaultDailyContentUrls
  ];
  return [...new Set(configured.map((url) => url.trim()).filter(Boolean))];
}

function writeAudit(audit: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const target = window as Window & { __dailyfloraDailyContentAudit?: Record<string, unknown> };
  target.__dailyfloraDailyContentAudit = { ...audit, checkedAt: new Date().toISOString() };
  document.body.dataset.dailyContentSource = String(audit.source || 'local');
}

function readCachedContent(): DailyContentCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(dailyContentCacheKey) || 'null');
    const manifest = validateDailyContentManifest(value);
    if (manifest) {
      // Keep accepting the old cache format created before the once-per-day gate.
      return {
        schemaVersion: 1,
        checkedDate: '',
        checkedAt: '',
        networkSucceeded: true,
        manifest
      };
    }
    if (
      !value ||
      typeof value !== 'object' ||
      value.schemaVersion !== 1 ||
      typeof value.checkedDate !== 'string' ||
      typeof value.checkedAt !== 'string' ||
      typeof value.networkSucceeded !== 'boolean'
    ) {
      return null;
    }
    return {
      schemaVersion: 1,
      checkedDate: value.checkedDate,
      checkedAt: value.checkedAt,
      sourceUrl: typeof value.sourceUrl === 'string' ? value.sourceUrl : undefined,
      networkSucceeded: value.networkSucceeded,
      manifest: validateDailyContentManifest(value.manifest)
    };
  } catch {
    return null;
  }
}

function cacheContent(
  manifest: DailyContentManifest | null,
  checkedDate: string,
  sourceUrl: string | undefined,
  networkSucceeded: boolean
) {
  if (typeof window === 'undefined') return;
  try {
    const cache: DailyContentCache = {
      schemaVersion: 1,
      checkedDate,
      checkedAt: new Date().toISOString(),
      sourceUrl,
      networkSucceeded,
      manifest
    };
    window.localStorage.setItem(dailyContentCacheKey, JSON.stringify(cache));
  } catch {
    // A full or disabled localStorage must not prevent the online content from applying.
  }
}

async function fetchManifest(url: string) {
  const startedAt = performance.now();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const manifest = validateDailyContentManifest(await response.json());
    if (!manifest) throw new Error('daily-content.json 格式不受支持');
    return { manifest, latencyMs: Math.round(performance.now() - startedAt) };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadDailyContent(dateKey: string): Promise<DailyContentLoadResult | null> {
  if (typeof window === 'undefined' || !window.dailyfloraDesktop?.isDesktop) return null;

  const cached = readCachedContent();
  if (cached?.checkedDate === dateKey) {
    const entry = cached.manifest?.entries[dateKey];
    if (entry) {
      writeAudit({
        source: 'cache',
        date: dateKey,
        contentVersion: entry.contentVersion,
        sourceUrl: cached.sourceUrl,
        checkedDate: dateKey,
        networkSkipped: true,
        error: cached.networkSucceeded ? '今日已检查线上内容' : '今日线上检查失败，使用缓存内容'
      });
      return { entry, source: 'cache', url: cached.sourceUrl, error: '今日已检查线上内容' };
    }

    writeAudit({
      source: 'local',
      date: dateKey,
      checkedDate: dateKey,
      networkSkipped: true,
      error: cached.networkSucceeded ? `GitHub 内容没有 ${dateKey} 条目` : '今日线上检查失败，使用本地内容'
    });
    return null;
  }

  let lastError = '';
  let lastManifest: DailyContentManifest | null = null;
  let lastUrl: string | undefined;
  for (const url of getDailyContentUrls(window.__DAILYFLORA_CONFIG__)) {
    try {
      const { manifest, latencyMs } = await fetchManifest(url);
      const entry = manifest.entries[dateKey];
      lastManifest = manifest;
      lastUrl = url;
      if (!entry) {
        lastError = `GitHub 内容没有 ${dateKey} 条目`;
        continue;
      }
      cacheContent(manifest, dateKey, url, true);
      writeAudit({ source: 'github', url, latencyMs, date: dateKey, contentVersion: entry.contentVersion });
      return { entry, source: 'github', url, latencyMs };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  const entry = cached?.manifest?.entries[dateKey];
  const fallbackManifest = entry && cached?.manifest && lastManifest
    ? {
        ...lastManifest,
        entries: { ...lastManifest.entries, [dateKey]: entry }
      }
    : lastManifest || cached?.manifest || null;
  cacheContent(fallbackManifest, dateKey, lastUrl || cached?.sourceUrl, false);
  if (entry) {
    writeAudit({ source: 'cache', date: dateKey, error: lastError });
    return { entry, source: 'cache', url: cached?.sourceUrl, error: lastError };
  }

  writeAudit({ source: 'local', date: dateKey, error: lastError || '没有可用的远程或缓存内容' });
  return null;
}
