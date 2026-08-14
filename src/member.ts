import {
  createReferenceTask,
  deleteGeneration,
  getMemberSnapshot,
  logoutAccount,
  removeCloudFavorite,
  renameGeneration,
  restoreAccount,
  saveCloudFavorite,
  type AccountSnapshot,
  type CloudFavorite,
  type CloudGeneration,
  type CloudTask
} from './dailyfloraCloud';
import { blobToDataUrl, prepareUserReferenceAssets, type PreparedUserReferenceAssets } from './userReferenceAssets';

const loading = document.querySelector<HTMLElement>('#member-loading');
const guest = document.querySelector<HTMLElement>('#member-auth-gate');
const workspace = document.querySelector<HTMLElement>('#member-workspace');
const status = document.querySelector<HTMLElement>('#member-status');
const favoriteList = document.querySelector<HTMLElement>('#favorite-list');
const generationList = document.querySelector<HTMLElement>('#generation-list');
const taskList = document.querySelector<HTMLElement>('#task-list');
const ledger = document.querySelector<HTMLElement>('#point-ledger');
const referenceForm = document.querySelector<HTMLFormElement>('#reference-form');
const referenceFile = document.querySelector<HTMLInputElement>('#reference-file');
const referencePreview = document.querySelector<HTMLImageElement>('#reference-preview');
const preparedMeta = document.querySelector<HTMLElement>('#prepared-image-meta');

let snapshot: AccountSnapshot | null = null;
let preparedAssets: PreparedUserReferenceAssets | null = null;
let previewUrl = '';

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function showStatus(message: string, isError = false) {
  if (!status) return;
  status.textContent = message;
  status.hidden = !message;
  status.dataset.error = String(isError);
}

function emptyState(title: string, body: string) {
  return `<article class="member-empty"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p></article>`;
}

function bouquetHref(favorite: CloudFavorite) {
  const params = new URLSearchParams({ date: favorite.date, seed: favorite.seed, theme: favorite.themeId || '' });
  return `../?${params.toString()}`;
}

function renderFavorites(items: CloudFavorite[]) {
  const count = document.querySelector<HTMLElement>('#favorite-count');
  if (count) count.textContent = String(items.length);
  if (!favoriteList) return;
  if (!items.length) {
    favoriteList.innerHTML = emptyState('还没有收藏', '回到今日花束，点击爱心或“收藏这束花”。这里不会显示虚构数据。');
    return;
  }
  favoriteList.innerHTML = items.map((favorite) => `<article class="member-card" data-favorite-card="${escapeHtml(favorite.id)}">
    <a class="member-card-link" href="${escapeHtml(bouquetHref(favorite))}">
      <span>${escapeHtml(favorite.date)}</span><strong>${escapeHtml(favorite.themeName || 'DailyFlora Bouquet')}</strong>
      <small>seed=${escapeHtml(favorite.seed)} · ${escapeHtml(favorite.flowerPlanName || '')}</small>
    </a>
    <button class="member-card-action" type="button" data-remove-favorite="${escapeHtml(favorite.id)}">取消收藏</button>
  </article>`).join('');
}

function renderGenerations(items: CloudGeneration[]) {
  const count = document.querySelector<HTMLElement>('#generation-count');
  if (count) count.textContent = String(items.length);
  if (!generationList) return;
  if (!items.length) {
    generationList.innerHTML = emptyState('还没有生成记录', '上传参考图并完成处理后，独立公开链接会出现在这里。');
    return;
  }
  generationList.innerHTML = items.map((item) => `<article class="member-card generation-card" data-generation-card="${escapeHtml(item.id)}">
    <a class="member-card-link" href="../bouquet/?id=${encodeURIComponent(item.publicId)}"><span>${escapeHtml(item.status)}</span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(formatDate(item.createdAt))} · seed=${escapeHtml(item.seed)}</small></a>
    <div class="member-card-buttons"><button type="button" data-rename-generation="${escapeHtml(item.id)}">修改名称</button><button type="button" data-delete-generation="${escapeHtml(item.id)}">删除</button></div>
  </article>`).join('');
}

function taskLabel(task: CloudTask) {
  if (task.status === 'completed') return '已完成';
  if (task.status === 'failed') return task.refunded ? '失败 · 已退款' : '失败';
  if (task.status === 'processing') return '处理中';
  return '排队中';
}

function renderTasks(items: CloudTask[]) {
  const count = document.querySelector<HTMLElement>('#task-count');
  if (count) count.textContent = String(items.length);
  if (!taskList) return;
  if (!items.length) {
    taskList.innerHTML = emptyState('没有参考图任务', '创建任务后，可在这里查看排队、处理和退款状态。');
    return;
  }
  taskList.innerHTML = items.map((task) => `<article class="member-card task-card">
    <span>${escapeHtml(taskLabel(task))}</span><strong>${escapeHtml(task.input?.bouquetName || '参考图花束')}</strong>
    <small>${escapeHtml(formatDate(task.createdAt))} · ${escapeHtml(task.id)}</small>
    <p>${escapeHtml(task.result?.summary || task.errorMessage || '等待 Admin 本机 Codex 处理')}</p>
    ${task.publicId ? `<a class="button" href="../bouquet/?id=${encodeURIComponent(task.publicId)}">打开唯一链接</a>` : ''}
  </article>`).join('');
}

function renderPoints(data: AccountSnapshot) {
  const balance = document.querySelector<HTMLElement>('#point-balance');
  if (balance) balance.textContent = String(data.pointAccount.balance || 0);
  if (!ledger) return;
  ledger.innerHTML = data.points.length
    ? data.points.map((entry) => `<div class="point-entry"><div><strong>${escapeHtml(entry.reason)}</strong><small>${escapeHtml(formatDate(entry.createdAt))}${entry.taskId ? ` · ${escapeHtml(entry.taskId)}` : ''}</small></div><span class="${entry.amount >= 0 ? 'positive' : 'negative'}">${entry.amount > 0 ? '+' : ''}${entry.amount} → ${entry.balanceAfter}</span></div>`).join('')
    : '<p class="muted">还没有积分记录。</p>';
}

function render(data: AccountSnapshot) {
  snapshot = data;
  const title = document.querySelector<HTMLElement>('#member-title');
  const email = document.querySelector<HTMLElement>('#member-email');
  const avatar = document.querySelector<HTMLElement>('#member-avatar');
  if (title) title.textContent = `${data.user.name}的花园`;
  if (email) email.textContent = data.user.email;
  if (avatar) avatar.textContent = Array.from(data.user.name).slice(0, 2).join('') || '花';
  renderFavorites(data.favorites);
  renderGenerations(data.generations);
  renderTasks(data.tasks);
  renderPoints(data);
}

async function refresh() {
  try {
    const data = await getMemberSnapshot();
    render(data);
    if (loading) loading.hidden = true;
    if (guest) guest.hidden = true;
    if (workspace) workspace.hidden = false;
  } catch (error) {
    const message = error instanceof Error ? error.message : '个人花园读取失败。';
    if (/需要登录|登录已过期/.test(message)) {
      if (loading) loading.hidden = true;
      if (workspace) workspace.hidden = true;
      if (guest) guest.hidden = false;
      return;
    }
    showStatus(message, true);
    if (loading) loading.textContent = message;
  }
}

document.querySelector<HTMLButtonElement>('#member-logout')?.addEventListener('click', async () => {
  await logoutAccount().catch(() => {});
  window.location.href = '../login/';
});

favoriteList?.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-remove-favorite]') : null;
  if (!button || !snapshot) return;
  const favorite = snapshot.favorites.find((item) => item.id === button.dataset.removeFavorite);
  if (!favorite) return;
  button.disabled = true;
  try {
    await removeCloudFavorite(favorite.id);
    snapshot.favorites = snapshot.favorites.filter((item) => item.id !== favorite.id);
    renderFavorites(snapshot.favorites);
    showStatus('已取消收藏。10 秒内可撤销。');
    window.setTimeout(() => showStatus(''), 10_000);
    const undo = document.createElement('button');
    undo.type = 'button';
    undo.className = 'inline-undo';
    undo.textContent = '撤销';
    status?.append(' ', undo);
    undo.addEventListener('click', async () => {
      await saveCloudFavorite(favorite);
      await refresh();
      showStatus('已恢复收藏。');
    }, { once: true });
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '取消收藏失败。', true);
    button.disabled = false;
  }
});

generationList?.addEventListener('click', async (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const rename = target?.closest<HTMLButtonElement>('[data-rename-generation]');
  const remove = target?.closest<HTMLButtonElement>('[data-delete-generation]');
  if (rename) {
    const current = snapshot?.generations.find((item) => item.id === rename.dataset.renameGeneration);
    if (!current) return;
    const name = window.prompt('输入新的私人名称', current.name)?.trim();
    if (!name) return;
    try { await renameGeneration(current.id, name); await refresh(); } catch (error) { showStatus(error instanceof Error ? error.message : '修改失败。', true); }
  }
  if (remove) {
    const current = snapshot?.generations.find((item) => item.id === remove.dataset.deleteGeneration);
    if (!current || !window.confirm(`删除“${current.name}”的私人记录？公开链接也会失效。`)) return;
    try { await deleteGeneration(current.id); await refresh(); } catch (error) { showStatus(error instanceof Error ? error.message : '删除失败。', true); }
  }
});

referenceFile?.addEventListener('change', async () => {
  const file = referenceFile.files?.[0];
  preparedAssets = null;
  if (!file) return;
  showStatus('正在浏览器内压缩图片…');
  try {
    preparedAssets = await prepareUserReferenceAssets(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(preparedAssets.thumbnail.blob);
    if (referencePreview) { referencePreview.src = previewUrl; referencePreview.hidden = false; }
    if (preparedMeta) preparedMeta.textContent = `主图 ${preparedAssets.reference.width}×${preparedAssets.reference.height} / ${Math.ceil(preparedAssets.reference.bytes / 1024)}KB；缩略图 ${preparedAssets.thumbnail.width}×${preparedAssets.thumbnail.height} / ${Math.ceil(preparedAssets.thumbnail.bytes / 1024)}KB`;
    showStatus('图片已准备好，尚未上传。');
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '图片处理失败。', true);
    referenceFile.value = '';
  }
});

referenceForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!preparedAssets || !referenceFile?.files?.[0]) {
    showStatus('请先选择并完成图片压缩。', true);
    return;
  }
  const submit = referenceForm.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (submit) submit.disabled = true;
  showStatus('正在上传私有图片并创建任务…');
  try {
    const [referenceDataUrl, thumbnailDataUrl] = await Promise.all([
      blobToDataUrl(preparedAssets.reference.blob),
      blobToDataUrl(preparedAssets.thumbnail.blob)
    ]);
    const task = await createReferenceTask({
      idempotencyKey: crypto.randomUUID(),
      referenceDataUrl,
      thumbnailDataUrl,
      sourceFileName: referenceFile.files[0].name,
      reference: { bytes: preparedAssets.reference.bytes, width: preparedAssets.reference.width, height: preparedAssets.reference.height },
      thumbnail: { bytes: preparedAssets.thumbnail.bytes, width: preparedAssets.thumbnail.width, height: preparedAssets.thumbnail.height },
      bouquetName: (document.querySelector<HTMLInputElement>('#bouquet-name')?.value || '').trim(),
      style: document.querySelector<HTMLSelectElement>('#style-select')?.value || 'auto',
      preference: (document.querySelector<HTMLTextAreaElement>('#preference-input')?.value || '').trim()
    });
    showStatus(`任务 ${task.id} 已排队，扣除 10 积分。`);
    referenceForm.reset();
    preparedAssets = null;
    if (referencePreview) referencePreview.hidden = true;
    if (preparedMeta) preparedMeta.textContent = '';
    await refresh();
  } catch (error) {
    showStatus(error instanceof Error ? error.message : '任务创建失败。', true);
  } finally {
    if (submit) submit.disabled = false;
  }
});

void restoreAccount().then((user) => user ? refresh() : refresh()).catch(() => refresh());
