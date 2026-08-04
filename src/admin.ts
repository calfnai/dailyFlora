import {
  getCloudAdminSummary,
  getCloudAdminReference,
  listCloudAdminTasks,
  listCloudAdminUsers,
  restoreAccount,
  writeCloudProcessingResult,
  type CloudAccount,
  type CloudTask
} from './dailyfloraCloud';

const state = document.querySelector<HTMLElement>('#admin-state');
const content = document.querySelector<HTMLElement>('#admin-content');
const metrics = document.querySelector<HTMLElement>('#admin-metrics');
const users = document.querySelector<HTMLTableSectionElement>('#admin-users');
const tasks = document.querySelector<HTMLElement>('#admin-tasks');
const refresh = document.querySelector<HTMLButtonElement>('#admin-refresh');
const filter = document.querySelector<HTMLSelectElement>('#admin-task-filter');

function escapeHtml(value: unknown) {
  const entities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
  return String(value ?? '').replace(/[&<>'"]/g, (character) => entities[character] || character);
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
  const labels: Array<[string, string]> = [
    ['users', '账户'],
    ['favorites', '收藏'],
    ['generations', '生成历史'],
    ['tasks', '处理任务'],
    ['demoOrders', '演示订单']
  ];
  metrics.innerHTML = labels.map(([key, label]) => `<article class="admin-metric"><span class="eyebrow">${label}</span><strong>${escapeHtml(summary[key] ?? 0)}</strong></article>`).join('');
}

function renderUsers(items: CloudAccount[]) {
  if (!users) return;
  users.innerHTML = items.map((user) => `<tr><td>${escapeHtml(user.name)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(formatDate(user.createdAt))}</td></tr>`).join('');
}

function renderTasks(items: CloudTask[]) {
  if (!tasks) return;
  if (!items.length) {
    tasks.innerHTML = '<p class="muted">当前没有符合条件的任务。</p>';
    return;
  }
  tasks.innerHTML = items.map((task) => {
    const result = task.result || {};
    return `<form class="admin-task" data-task-form="${escapeHtml(task.id)}">
      <div class="admin-task-head"><strong>${escapeHtml(task.input?.bouquetName || '参考图任务')}</strong><span>${escapeHtml(task.status)} · ${escapeHtml(task.id)}</span></div>
      <small>偏好：${escapeHtml(task.input?.preference || '未填写')} · 创建：${escapeHtml(formatDate(task.createdAt))}</small>
      <div class="admin-task-grid">
        <label>状态<select name="status"><option value="processing"${task.status === 'processing' ? ' selected' : ''}>processing</option><option value="completed"${task.status === 'completed' ? ' selected' : ''}>completed</option><option value="failed"${task.status === 'failed' ? ' selected' : ''}>failed</option></select></label>
        <label>标题<input name="title" value="${escapeHtml(result.title || '')}" maxlength="160" /></label>
        <label>摘要<textarea name="summary" maxlength="1000">${escapeHtml(result.summary || '')}</textarea></label>
        <label>花材（每行一项）<textarea name="flowers">${escapeHtml((result.flowers || []).join('\n'))}</textarea></label>
        <label>色彩（每行一个）<textarea name="colors">${escapeHtml((result.colors || []).join('\n'))}</textarea></label>
        <label>构图<textarea name="composition" maxlength="1000">${escapeHtml(result.composition || '')}</textarea></label>
        <label>seed<input name="seed" value="${escapeHtml(result.seed || '')}" maxlength="180" /></label>
      </div>
      <div class="button-row"><button class="button" type="button" data-reference-task="${escapeHtml(task.id)}">读取私有参考图</button><button class="button primary" type="submit">写回任务结果</button><span class="muted" data-task-message></span></div>
      <div class="admin-reference-preview" data-reference-preview hidden></div>
    </form>`;
  }).join('');
}

async function load() {
  if (!content) return;
  const account = await restoreAccount();
  if (!account) {
    showState('请先在 /login/ 登录，再访问后台。', true);
    return;
  }
  try {
    const [summary, adminUsers, adminTasks] = await Promise.all([
      getCloudAdminSummary(),
      listCloudAdminUsers(),
      listCloudAdminTasks(filter?.value || '')
    ]);
    renderMetrics(summary);
    renderUsers(adminUsers);
    renderTasks(adminTasks);
    content.hidden = false;
    showState(`已验证后台账户：${account.email}`);
  } catch (error) {
    showState(error instanceof Error ? error.message : '后台暂时不可用。', true);
  }
}

refresh?.addEventListener('click', () => void load());
filter?.addEventListener('change', () => void load());
tasks?.addEventListener('submit', async (event) => {
  const form = event.target instanceof HTMLFormElement ? event.target : null;
  if (!form?.dataset.taskForm) return;
  event.preventDefault();
  const message = form.querySelector<HTMLElement>('[data-task-message]');
  const data = new FormData(form);
  const status = String(data.get('status') || 'completed') as 'processing' | 'completed' | 'failed';
  const result = {
    title: String(data.get('title') || ''),
    summary: String(data.get('summary') || ''),
    flowers: String(data.get('flowers') || '').split('\n').map((item) => item.trim()).filter(Boolean),
    colors: String(data.get('colors') || '').split('\n').map((item) => item.trim()).filter(Boolean),
    composition: String(data.get('composition') || ''),
    seed: String(data.get('seed') || '')
  };
  try {
    if (message) message.textContent = '写回中…';
    await writeCloudProcessingResult({ taskId: form.dataset.taskForm, status, result });
    if (message) message.textContent = '已写回';
    await load();
  } catch (error) {
    if (message) message.textContent = error instanceof Error ? error.message : '写回失败';
  }
});

tasks?.addEventListener('click', async (event) => {
  const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-reference-task]') : null;
  if (!button) return;
  const task = button.dataset.referenceTask || '';
  const form = button.closest<HTMLElement>('[data-task-form]');
  const preview = form?.querySelector<HTMLElement>('[data-reference-preview]');
  try {
    button.disabled = true;
    const reference = await getCloudAdminReference(task);
    if (preview && reference?.temporaryUrl) {
      preview.hidden = false;
      preview.innerHTML = `<a href="${escapeHtml(reference.temporaryUrl)}" target="_blank" rel="noopener">打开私有参考图（临时链接，约 5 分钟有效）</a>`;
    }
  } catch (error) {
    if (preview) {
      preview.hidden = false;
      preview.textContent = error instanceof Error ? error.message : '私有图读取失败';
    }
  } finally {
    button.disabled = false;
  }
});

void load();
