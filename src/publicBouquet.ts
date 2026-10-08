import { getPublicGeneration } from './dailyfloraCloud';

const state = document.querySelector<HTMLElement>('#public-bouquet-state');
const frame = document.querySelector<HTMLIFrameElement>('#public-bouquet-frame');
const caption = document.querySelector<HTMLElement>('#public-bouquet-caption');
const title = document.querySelector<HTMLElement>('#public-bouquet-title');
const summary = document.querySelector<HTMLElement>('#public-bouquet-summary');

async function load() {
  const publicId = new URLSearchParams(window.location.search).get('id')?.trim() || '';
  if (!publicId) throw new Error('公开链接缺少花束 ID。');
  const generation = await getPublicGeneration(publicId);
  const params = new URLSearchParams({
    preview: '1',
    date: generation.date || new Date().toISOString().slice(0, 10),
    seed: generation.seed,
    theme: generation.themeId || 'dewberry-morning',
    render: 'high',
    density: 'high'
  });
  params.set('colors', generation.colors.join(','));
  for (const key of ['density', 'render', 'spread', 'height', 'airiness']) {
    const value = generation.renderParams?.[key];
    if (value !== undefined) params.set(key, String(value));
  }
  if (frame) {
    frame.src = `../?${params.toString()}`;
    frame.hidden = false;
  }
  if (title) title.textContent = generation.name;
  if (summary) summary.textContent = '专属花束 · 可收藏此链接再次欣赏';
  if (caption) caption.hidden = false;
  if (state) state.hidden = true;
  document.title = `${generation.name} — DailyFlora`;
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (description) description.content = `${generation.name}，一束专属的 DailyFlora 数字花束。`;
}

void load().catch((error) => {
  if (state) state.textContent = error instanceof Error ? error.message : '公开花束读取失败。';
});
