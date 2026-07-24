import { realisticFlowerDefinitions } from './realisticFlowerForms';
import { realisticFlowerFoliageStatus } from './plantOwnership';

type Decision = 'pending' | 'pass' | 'reject';
type ReviewLayer = 'abstract' | 'realistic' | 'hybrid' | 'candidate';

interface ReviewEntry {
  id: string;
  layer: ReviewLayer;
  cn: string;
  en: string;
  description: string;
  lab: string;
}

interface SavedReview {
  decision: Decision;
  comment: string;
  updatedAt: string;
}

const STORAGE_KEY = 'dailyflora.flower-system-review.v1';

const abstractEntries: ReviewEntry[] = [
  ['disk-face-flower', '盘状花', 'Disk / Face Flower', '清楚的脸盘识别与明亮停顿；覆盖雏菊、洋甘菊、非洲菊等角色。'],
  ['cosmos-open-face', '波斯菊/小面花型', 'Cosmos Open-Face Flower', '轻薄、少瓣的小花矩阵呼吸点。'],
  ['layered-dahlia-form', '层叠大丽花/团瓣型', 'Layered Dahlia Form', '多层放射、饱满但不玫瑰化的大型团瓣。'],
  ['ruffled-rose-form', '褶皱玫瑰型', 'Ruffled Rose Form', '宽瓣内卷、柔软褶皱与玫瑰感。'],
  ['star-pinwheel-form', '星形/风车型', 'Star / Pinwheel Flower', '长窄瓣放射，承担多色花束的局部记忆点。'],
  ['tulip-cup-form', '郁金香/杯型', 'Tulip / Cup Form', '半闭合、含蓄的杯状体积。'],
  ['trumpet-throat-form', '洋水仙管心型', 'Narcissus Trumpet-Throat Form', '小型管心与外围花被共同形成洋水仙识别。'],
  ['datura-trumpet-form', '大喇叭型', 'Datura Trumpet Form', '深喉、外翻口缘的大型喇叭体积。'],
  ['orchid-butterfly-form', '兰花/蝴蝶型', 'Orchid / Butterfly Form', '不对称、轻盈的雕塑开口花。'],
  ['calla-curled-bract', '马蹄莲/卷曲苞片型', 'Calla Curled-Bract Form', '单片卷曲苞片与中央肉穗结构。'],
  ['spike-vertical-form', '穗状花', 'Spike / Vertical Flower', '提供竖向节奏、高度与空间方向。'],
  ['umbel-mini-cluster', '伞状/小簇型', 'Umbel / Mini-Cluster Form', '承担蕾丝花、米花等细小填充簇。'],
  ['hydrangea-cloud-cluster', '绣球/云团型', 'Hydrangea Cloud Cluster', '柔软云团与密集簇状体积。'],
  ['fruit-pod-form', '果材/荚果型', 'Fruit / Pod Form', '枝端果点、浆果与荚果角色。'],
  ['hanging-bell-fruit', '吊坠风铃果型', 'Hanging Bell Fruit', '向下悬挂的灯笼或风铃状果材。'],
  ['foliage-grass-branch', '叶材/草线/枝条型', 'Foliage / Grass / Branch Form', '原有词表中的绿色空间材料，不是具名花朵。']
].map(([id, cn, en, description]) => ({
  id: `abstract:${id}`,
  layer: 'abstract',
  cn,
  en,
  description,
  lab: './primitive-lab.html'
}));

const realisticEntries: ReviewEntry[] = realisticFlowerDefinitions.map((definition) => ({
  id: `realistic:${definition.id}`,
  layer: 'realistic',
  cn: definition.cn,
  en: definition.en,
  description: definition.calibration || definition.description,
  lab: './realistic-flower-lab.html'
}));

const specialEntries: ReviewEntry[] = [
  {
    id: 'hybrid:orbital-pulse-flower',
    layer: 'hybrid',
    cn: '星环脉冲花型',
    en: 'Orbital Pulse Flower',
    description: '已通过的“写实骨架 × 非现实配色”混合花型；不等于结构科幻形态。',
    lab: './primitive-lab.html'
  },
  {
    id: 'candidate:frilled-narcissus-corona',
    layer: 'candidate',
    cn: '褶边副冠水仙型',
    en: 'Frilled Narcissus Corona Flower',
    description: '待验收候选：六片花被、明显副冠、褶边、深喉与绿色连接点。',
    lab: './primitive-lab.html'
  }
];

const entries = [...abstractEntries, ...realisticEntries, ...specialEntries];
const reviews = loadReviews();
let activeFilter: ReviewLayer | 'all' = 'all';

const layerCopy: Record<ReviewLayer, string> = {
  abstract: '原有抽象',
  realistic: '偏写实',
  hybrid: '混合已通过',
  candidate: '候选'
};

function loadReviews(): Record<string, SavedReview> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveReviews() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

function getReview(id: string): SavedReview {
  return reviews[id] || { decision: 'pending', comment: '', updatedAt: '' };
}

function setReview(id: string, patch: Partial<SavedReview>) {
  reviews[id] = {
    ...getReview(id),
    ...patch,
    updatedAt: new Date().toISOString()
  };
  saveReviews();
  renderFlowerGrid();
  updateProgress();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[character] || character);
}

function renderFilters() {
  const container = document.querySelector<HTMLDivElement>('#flower-filters');
  if (!container) return;
  const choices: Array<{ id: ReviewLayer | 'all'; label: string; count: number }> = [
    { id: 'all', label: '全部', count: entries.length },
    { id: 'abstract', label: '原有抽象', count: abstractEntries.length },
    { id: 'realistic', label: '偏写实', count: realisticEntries.length },
    { id: 'hybrid', label: '混合', count: 1 },
    { id: 'candidate', label: '候选', count: 1 }
  ];
  container.innerHTML = choices.map((choice) =>
    `<button type="button" data-filter="${choice.id}" aria-pressed="${activeFilter === choice.id}">${choice.label} · ${choice.count}</button>`
  ).join('');
  container.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.filter as ReviewLayer | 'all';
      renderFilters();
      renderFlowerGrid();
    });
  });
}

function renderFlowerGrid() {
  const container = document.querySelector<HTMLDivElement>('#flower-grid');
  if (!container) return;
  const visibleEntries = activeFilter === 'all' ? entries : entries.filter((entry) => entry.layer === activeFilter);
  if (!visibleEntries.length) {
    container.innerHTML = '<p class="empty">这一分类暂无条目。</p>';
    return;
  }
  container.innerHTML = visibleEntries.map((entry) => {
    const review = getReview(entry.id);
    const index = entries.findIndex((candidate) => candidate.id === entry.id) + 1;
    return `<article class="card" data-entry="${entry.id}" data-decision="${review.decision}">
      <div class="card-top"><span class="index">${String(index).padStart(2, '0')} / ${entries.length}</span><span class="badge">${layerCopy[entry.layer]}</span></div>
      <h3>${escapeHtml(entry.cn)}</h3>
      <p class="english">${escapeHtml(entry.en)}</p>
      <p class="description">${escapeHtml(entry.description)}</p>
      <a class="link" href="${entry.lab}" target="_blank" rel="noopener">打开对应 3D LAB</a>
      <div class="review">
        <div class="decision-row" aria-label="${escapeHtml(entry.cn)} 验收状态">
          ${(['pass', 'reject', 'pending'] as Decision[]).map((choice) => {
            const label = choice === 'pass' ? '通过' : choice === 'reject' ? '不通过' : '待定';
            return `<button type="button" data-choice="${choice}" aria-pressed="${review.decision === choice}">${label}</button>`;
          }).join('')}
        </div>
        <textarea data-comment placeholder="如果不通过，请填写具体意见；通过也可留下备注。">${escapeHtml(review.comment)}</textarea>
      </div>
    </article>`;
  }).join('');

  container.querySelectorAll<HTMLElement>('[data-entry]').forEach((card) => {
    const id = card.dataset.entry || '';
    card.querySelectorAll<HTMLButtonElement>('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => setReview(id, { decision: button.dataset.choice as Decision }));
    });
    const textarea = card.querySelector<HTMLTextAreaElement>('[data-comment]');
    textarea?.addEventListener('change', () => {
      setReview(id, { comment: textarea.value.trim() });
      showToast('意见已保存在本机');
    });
  });
}

function updateProgress() {
  const decided = entries.filter((entry) => {
    const decision = getReview(entry.id).decision;
    return decision === 'pass' || decision === 'reject';
  }).length;
  const output = document.querySelector<HTMLOutputElement>('#flower-progress');
  const fill = document.querySelector<HTMLDivElement>('#flower-progress-fill');
  if (output) output.value = `${decided} / ${entries.length} 已决定`;
  if (fill) fill.style.width = `${(decided / entries.length) * 100}%`;
}

function renderLeafSystem() {
  const confirmed = realisticFlowerDefinitions.filter((definition) =>
    realisticFlowerFoliageStatus[definition.id].status === 'confirmed'
  );
  const examples = document.querySelector<HTMLDivElement>('#leaf-examples');
  if (examples) {
    examples.innerHTML = confirmed.map((definition) => {
      const foliage = realisticFlowerFoliageStatus[definition.id];
      const profileName = foliage.foliageProfile.includes('strap') ? 'Strap D2 基生叶' : 'Palmate Major Structure Envelope';
      return `<article class="example">
        <p class="eyebrow">${escapeHtml(definition.id)} · confirmed</p>
        <h3>${escapeHtml(definition.cn)} <span class="english">${escapeHtml(definition.en)}</span></h3>
        <p><b>${profileName}</b> · ${foliage.leafArrangement}。花朵仍由原 flower plan 和 flower RNG 决定；叶片只读取成员身份后补入同一根花茎。</p>
        <div class="code">stem.plantMemberId = "${definition.id}"
foliageProfile = "${foliage.foliageProfile}"
leafMode = "${foliage.leafMode}"
leafArrangement = "${foliage.leafArrangement}"
leafRng = independent(stemId)</div>
      </article>`;
    }).join('');
  }

  const body = document.querySelector<HTMLTableSectionElement>('#leaf-progress-body');
  if (body) {
    body.innerHTML = realisticFlowerDefinitions.map((definition) => {
      const foliage = realisticFlowerFoliageStatus[definition.id];
      const confirmedStatus = foliage.status === 'confirmed';
      return `<tr>
        <td><b>${escapeHtml(definition.cn)}</b><br><span class="english">${escapeHtml(definition.en)}</span></td>
        <td>${escapeHtml(foliage.foliageProfile)}</td>
        <td>${escapeHtml(foliage.leafArrangement)}</td>
        <td class="${confirmedStatus ? 'status-confirmed' : 'status-unresolved'}">${confirmedStatus ? '已确认并接入' : '未研究 · 不生成叶片'}</td>
        <td>${confirmedStatus ? '进入整束遮挡与空气感复验' : '先研究物种叶型，再做独立原型验收'}</td>
      </tr>`;
    }).join('');
  }
  const fill = document.querySelector<HTMLDivElement>('#leaf-progress-fill');
  if (fill) fill.style.width = `${(confirmed.length / realisticFlowerDefinitions.length) * 100}%`;
}

function exportReview(format: 'json' | 'markdown') {
  const payload = entries.map((entry) => ({ ...entry, ...getReview(entry.id) }));
  const text = format === 'json'
    ? `${JSON.stringify({ exportedAt: new Date().toISOString(), total: entries.length, reviews: payload }, null, 2)}\n`
    : [
        '# DailyFlora 花型验收',
        '',
        `导出时间：${new Date().toLocaleString('zh-CN')}`,
        '',
        '| 分类 | 花型 | 状态 | 意见 |',
        '| --- | --- | --- | --- |',
        ...payload.map((entry) => `| ${layerCopy[entry.layer]} | ${entry.cn} / ${entry.en} | ${entry.decision} | ${(entry.comment || '').replace(/\|/g, '\\|')} |`)
      ].join('\n');
  const blob = new Blob([text], { type: format === 'json' ? 'application/json' : 'text/markdown' });
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(blob);
  anchor.download = `dailyflora-flower-review-${new Date().toISOString().slice(0, 10)}.${format === 'json' ? 'json' : 'md'}`;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
  showToast(`已导出 ${format.toUpperCase()}`);
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLDivElement>('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('is-visible');
  window.setTimeout(() => toast.classList.remove('is-visible'), 1800);
}

function bindTabs() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-tab]');
  const panels = document.querySelectorAll<HTMLElement>('[data-panel]');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.tab;
      buttons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== target; });
    });
  });
}

document.querySelector('#export-json')?.addEventListener('click', () => exportReview('json'));
document.querySelector('#export-markdown')?.addEventListener('click', () => exportReview('markdown'));
document.querySelector('#clear-reviews')?.addEventListener('click', () => {
  if (!window.confirm('只清空当前浏览器里的花型审核记录，继续吗？')) return;
  Object.keys(reviews).forEach((key) => delete reviews[key]);
  saveReviews();
  renderFlowerGrid();
  updateProgress();
  showToast('本机审核记录已清空');
});

bindTabs();
renderFilters();
renderFlowerGrid();
renderLeafSystem();
updateProgress();
