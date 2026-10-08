import {
  createWorkerBatch,
  cancelAdminTask,
  getAdminReference,
  getCloudHealth,
  getAdminSummary,
  grantPoints,
  listAdminTasks,
  listAdminUsers,
  logoutAccount,
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
if (window.__DAILYFLORA_CONFIG__?.generationEnabled === false) {
  const processButton = document.querySelector<HTMLButtonElement>('#admin-process-queue');
  if (processButton) processButton.disabled = true;
  if (workerState) workerState.textContent = '云端参考图处理尚未接通；此测试入口不调用本机桥接器。';
}
const runtime = document.querySelector<HTMLElement>('#admin-runtime');
const identity = document.querySelector<HTMLElement>('#admin-identity');

let loadSequence = 0;
let userOffset = 0;
let taskOffset = 0;
const userSearch = document.querySelector<HTMLInputElement>('#admin-user-search');

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
  users.innerHTML = items.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.balance || 0)}</td><td>${escapeHtml(formatDate(user.createdAt))}</td><td><button class="button admin-grant-button" type="button" data-grant-user="${escapeHtml(user.id)}" data-grant-name="${escapeHtml(user.name)}">手动加积分</button></td></tr>`).join('');
}

function renderTasks(items: CloudTask[]) {
  if (!tasks) return;
  if (!items.length) { tasks.innerHTML = '<p class="muted">当前没有符合条件的任务。</p>'; return; }
  tasks.innerHTML = items.map((task) => `<article class="admin-task">
    <div class="admin-task-head"><strong>${escapeHtml(task.input?.bouquetName || '参考图任务')}</strong><span>${escapeHtml(task.status)} · ${escapeHtml(task.id)}</span></div>
    <small>创建：${escapeHtml(formatDate(task.createdAt))} · 费用：${escapeHtml(task.cost || 10)} 分${task.refunded ? ' · 已退款' : ''}</small>
    <p>${escapeHtml(task.result?.summary || task.errorMessage || '等待本机 Codex 处理')}</p>
    <div class="button-row"><button class="button" type="button" data-reference-task="${escapeHtml(task.id)}">读取私有参考图</button>${task.publicId ? `<a class="button" href="../bouquet/?id=${encodeURIComponent(task.publicId)}">公开链接</a>` : ''}${['preparing', 'queued', 'processing'].includes(task.status) ? `<button class="button" type="button" data-cancel-task="${escapeHtml(task.id)}">取消并退回积分</button>` : ''}<span data-reference-result></span></div>
  </article>`).join('');
}

async function load() {
  const sequence = ++loadSequence;
  try {
    const account = await restoreAccount();
    if (!account) { showState('请先登录 Beta 账户，再访问后台。', true); if (content) content.hidden = true; return; }
    if (identity) identity.textContent = `${account.name} · ${account.email}`;
    const [health, summary, adminUsers, adminTasks] = await Promise.all([getCloudHealth(), getAdminSummary(), listAdminUsers(userOffset, userSearch?.value || ''), listAdminTasks(filter?.value || '', taskOffset)]);
    if (sequence !== loadSequence) return;
    if (runtime) runtime.textContent = `${health.service} · ${health.version} · ${health.isolated ? 'Beta 数据隔离已开启' : '请检查数据隔离配置'}`;
    renderMetrics(summary); renderUsers(adminUsers); renderTasks(adminTasks);
    (document.querySelector('#admin-users-next') as HTMLButtonElement).disabled = adminUsers.length < 50;
    (document.querySelector('#admin-users-prev') as HTMLButtonElement).disabled = userOffset === 0;
    (document.querySelector('#admin-tasks-next') as HTMLButtonElement).disabled = adminTasks.length < 50;
    (document.querySelector('#admin-tasks-prev') as HTMLButtonElement).disabled = taskOffset === 0;
    if (content) content.hidden = false;
    showState(`已验证 0.73 Beta 后台账户：${account.email}`);
  } catch (error) {
    if (content) content.hidden = true;
    if (runtime) runtime.textContent = 'Beta API 状态读取失败。';
    showState(error instanceof Error ? error.message : '后台暂时不可用。', true);
  }
}

document.querySelector<HTMLButtonElement>('#admin-refresh')?.addEventListener('click', () => void load());
filter?.addEventListener('change', () => { taskOffset = 0; void load(); });

document.querySelector<HTMLButtonElement>('#admin-logout')?.addEventListener('click', async (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  button.disabled = true;
  try {
    await logoutAccount();
    window.location.href = '../login/';
  } catch {
    button.disabled = false;
    showState('退出失败，请稍后重试。', true);
  }
});

users?.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-grant-user]') : null;
  if (!button) return;
  button.disabled = true;
  try {
    const amountText = window.prompt(`给 ${button.dataset.grantName || '用户'} 增加多少积分？`);
    if (amountText === null) return;
    const amount = Number(amountText);
    if (!Number.isInteger(amount) || amount < 1 || amount > 10000) throw new Error('请输入 1–10000 的整数积分。');
    const reason = window.prompt('请输入充值备注（已核实付款金额、方式等）：')?.trim();
    if (!reason) return;
    const reference = window.prompt('请输入唯一付款流水号；重复处理同笔付款请使用相同流水号：')?.trim();
    if (!reference) return;
    if (!window.confirm(`确认已收款，并给 ${button.dataset.grantName || '用户'} 增加 ${amount} 积分？\n流水号：${reference}`)) return;
    await grantPoints(button.dataset.grantUser || '', amount, reason, reference);
    await load();
  } catch (error) {
    showState(error instanceof Error ? error.message : '赠分失败。', true);
    button.disabled = false;
  } finally { button.disabled = false; }
});

tasks?.addEventListener('click', async (event) => {
  const cancel = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-cancel-task]') : null;
  if (cancel) {
    if (!window.confirm('取消此任务并退回已扣积分？')) return;
    cancel.disabled = true;
    try { await cancelAdminTask(cancel.dataset.cancelTask || ''); await load(); }
    catch (error) { showState(error instanceof Error ? error.message : '取消失败。', true); cancel.disabled = false; }
    return;
  }
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
  if (workerState) workerState.textContent = '正在检查本机桥接器…';
  try {
    const healthResponse = await fetch(`${workerBridgeUrl.replace(/\/$/, '')}/health`, { credentials: 'omit' });
    const healthResult = await healthResponse.json().catch(() => ({}));
    if (!healthResponse.ok || !healthResult.ok) throw new Error('本机桥接器未启动');
    if (workerState) workerState.textContent = '本机桥接器已连接，正在签发短期批次凭证…';
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

for (const [id, action] of [
  ['admin-users-prev', () => { userOffset = Math.max(0, userOffset - 50); }],
  ['admin-users-next', () => { userOffset += 50; }],
  ['admin-tasks-prev', () => { taskOffset = Math.max(0, taskOffset - 50); }],
  ['admin-tasks-next', () => { taskOffset += 50; }],
  ['admin-user-search-submit', () => { userOffset = 0; }]
] as const) document.getElementById(id)?.addEventListener('click', () => { action(); void load(); });
