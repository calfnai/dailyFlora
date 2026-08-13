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
  if (frame) {
    frame.src = `../?${params.toString()}`;
    frame.hidden = false;
  }
  if (title) title.textContent = generation.name;
  if (summary) summary.textContent = `${generation.status} · seed=${generation.seed}`;
  if (caption) caption.hidden = false;
  if (state) state.hidden = true;
  document.title = `${generation.name} — DailyFlora`;
}

void load().catch((error) => {
  if (state) state.textContent = error instanceof Error ? error.message : '公开花束读取失败。';
});
