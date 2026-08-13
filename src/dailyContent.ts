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

const dailyContentCacheKey = 'dailyflora.desktop.daily-content.v1';
const defaultDailyContentUrls = [
  'https://raw.githubusercontent.com/calfnai/dailyFlora/codex/dailyflora-072-beta/data/daily-content.json',
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

function readCachedManifest() {
  if (typeof window === 'undefined') return null;
  try {
    return validateDailyContentManifest(JSON.parse(window.localStorage.getItem(dailyContentCacheKey) || 'null'));
  } catch {
    return null;
  }
}

function cacheManifest(manifest: DailyContentManifest) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(dailyContentCacheKey, JSON.stringify(manifest));
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

  let lastError = '';
  for (const url of getDailyContentUrls(window.__DAILYFLORA_CONFIG__)) {
    try {
      const { manifest, latencyMs } = await fetchManifest(url);
      const entry = manifest.entries[dateKey];
      cacheManifest(manifest);
      if (!entry) {
        lastError = `GitHub 内容没有 ${dateKey} 条目`;
        continue;
      }
      writeAudit({ source: 'github', url, latencyMs, date: dateKey, contentVersion: entry.contentVersion });
      return { entry, source: 'github', url, latencyMs };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  const cached = readCachedManifest();
  const entry = cached?.entries[dateKey];
  if (entry) {
    writeAudit({ source: 'cache', date: dateKey, error: lastError });
    return { entry, source: 'cache', error: lastError };
  }

  writeAudit({ source: 'local', date: dateKey, error: lastError || '没有可用的远程或缓存内容' });
  return null;
}
