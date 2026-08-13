import {
  createWorkerBatch,
  getAdminReference,
  getAdminSummary,
  grantPoints,
  listAdminTasks,
  listAdminUsers,
  restoreAccount,
  workerBridgeUrl,
  type CloudAccount,
  type CloudTask
} from './dailyfloraCloud';
import './accountHeader';

const state = document.querySelector<HTMLElement>('#admin-state');
const content = document.querySelector<HTMLElement>('#admin-content');
const metrics = document.querySelector<HTMLElement>('#admin-metrics');
const users = document.querySelector<HTMLTableSectionElement>('#admin-users');
const tasks = document.querySelector<HTMLElement>('#admin-tasks');
const filter = document.querySelector<HTMLSelectElement>('#admin-task-filter');
const workerState = document.querySelector<HTMLElement>('#admin-worker-state');

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN');
}

function showState(message: string, error = false) {
  if (!state) return;
  state.textContent = message;
  state.classList.toggle('admin-error', error);
}

function renderMetrics(summary: Record<string, unknown>) {
  if (!metrics) return;
  const labels: Array<[string, string]> = [['users', 'Beta 账户'], ['favorites', '收藏'], ['generations', '生成'], ['tasks', '任务'], ['pointAccounts', '积分账户']];
  metrics.innerHTML = labels.map(([key, label]) => `<article class="admin-metric"><span class="eyebrow">${label}</span><strong>${escapeHtml(summary[key] ?? 0)}</strong></article>`).join('');
}

function renderUsers(items: Array<CloudAccount & { balance?: number }>) {
  if (!users) return;
  users.innerHTML = items.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.balance || 0)}</td><td>${escapeHtml(formatDate(user.createdAt))}</td><td><button class="button admin-grant-button" type="button" data-grant-user="${escapeHtml(user.id)}" data-grant-name="${escapeHtml(user.name)}">赠送 20 分</button></td></tr>`).join('');
}

function renderTasks(items: CloudTask[]) {
  if (!tasks) return;
  if (!items.length) { tasks.innerHTML = '<p class="muted">当前没有符合条件的任务。</p>'; return; }
  tasks.innerHTML = items.map((task) => `<article class="admin-task">
    <div class="admin-task-head"><strong>${escapeHtml(task.input?.bouquetName || '参考图任务')}</strong><span>${escapeHtml(task.status)} · ${escapeHtml(task.id)}</span></div>
    <small>创建：${escapeHtml(formatDate(task.createdAt))} · 费用：${escapeHtml(task.cost || 10)} 分${task.refunded ? ' · 已退款' : ''}</small>
    <p>${escapeHtml(task.result?.summary || task.errorMessage || '等待本机 Codex 处理')}</p>
    <div class="button-row"><button class="button" type="button" data-reference-task="${escapeHtml(task.id)}">读取私有参考图</button>${task.publicId ? `<a class="button" href="../bouquet/?id=${encodeURIComponent(task.publicId)}">公开链接</a>` : ''}<span data-reference-result></span></div>
  </article>`).join('');
}

async function load() {
  const account = await restoreAccount();
  if (!account) { showState('请先登录 Beta 账户，再访问后台。', true); return; }
  try {
    const [summary, adminUsers, adminTasks] = await Promise.all([getAdminSummary(), listAdminUsers(), listAdminTasks(filter?.value || '')]);
    renderMetrics(summary); renderUsers(adminUsers); renderTasks(adminTasks);
    if (content) content.hidden = false;
    showState(`已验证 0.72 Beta 后台账户：${account.email}`);
  } catch (error) {
    showState(error instanceof Error ? error.message : '后台暂时不可用。', true);
  }
}

document.querySelector<HTMLButtonElement>('#admin-refresh')?.addEventListener('click', () => void load());
filter?.addEventListener('change', () => void load());

users?.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-grant-user]') : null;
  if (!button) return;
  button.disabled = true;
  try {
    await grantPoints(button.dataset.grantUser || '', 20, `Admin 赠送 20 分给 ${button.dataset.grantName || 'Beta 用户'}`, crypto.randomUUID());
    await load();
  } catch (error) {
    showState(error instanceof Error ? error.message : '赠分失败。', true);
    button.disabled = false;
  }
});

tasks?.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-reference-task]') : null;
  if (!button) return;
  const result = button.closest<HTMLElement>('.admin-task')?.querySelector<HTMLElement>('[data-reference-result]');
  button.disabled = true;
  try {
    const reference = await getAdminReference(button.dataset.referenceTask || '') as { referenceUrl?: string; thumbnailUrl?: string } | null;
    if (result && reference?.referenceUrl) result.innerHTML = `<a href="${escapeHtml(reference.referenceUrl)}" target="_blank" rel="noopener">打开临时私有链接</a>`;
  } catch (error) {
    if (result) result.textContent = error instanceof Error ? error.message : '读取失败';
  } finally { button.disabled = false; }
});

document.querySelector<HTMLButtonElement>('#admin-process-queue')?.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.disabled = true;
  if (workerState) workerState.textContent = '正在签发短期批次凭证…';
  try {
    const batch = await createWorkerBatch();
    if (!batch.taskCount) { if (workerState) workerState.textContent = '当前没有 queued 任务。'; return; }
    if (workerState) workerState.textContent = `已签发 ${batch.taskCount} 个任务，正在交给本机桥接器…`;
    const response = await fetch(`${workerBridgeUrl}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchToken: batch.token }) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || `本机桥接器返回 ${response.status}`);
    if (workerState) workerState.textContent = `本机处理完成：成功 ${result.completed || 0}，失败 ${result.failed || 0}。`;
    await load();
  } catch (error) {
    if (workerState) workerState.textContent = `${error instanceof Error ? error.message : '本机处理失败。'} 请先在终端运行 npm run worker:beta。`;
  } finally { button.disabled = false; }
});

void load();
