(function () {
  const KEY = 'dailyflora.mock.v2';
  const now = new Date().toISOString();
  const seed = {
    settings: { registrationOpen: true, registrationMessage: '注册暂时关闭，请稍后再来。', updatedAt: now, updatedBy: 'local-dev' },
    users: [{
      id: 'user-gardenia', name: '小花', email: 'gardenia@example.com', bio: '喜欢清透、外扩、有一点果点的花。', avatar: '花', status: 'active', plan: 'supporter', language: '中文', timezone: 'Asia/Shanghai', credits: 128, registeredAt: '2026-07-03T12:30:00+08:00', lastSeenAt: now, generated: 2, favorites: 3, adopted: 1, paidTotal: 128
    }, {
      id: 'user-guest', name: '访客用户', email: 'guest-local', bio: '', avatar: '访', status: 'unverified', plan: 'visitor', language: '中文', timezone: 'Asia/Shanghai', credits: 0, registeredAt: '2026-07-01T10:00:00+08:00', lastSeenAt: '2026-07-31T16:00:00+08:00', generated: 0, favorites: 0, adopted: 0, paidTotal: 0
    }],
    favorites: [
      { id: 'fav-1', userId: 'user-gardenia', title: '晨露莓园空气束', seed: 'dewberry-morning-air', date: '2026-06-26', image: ['#fff7df', '#bfe878', '#7dc9ff'], note: '清透一点。' },
      { id: 'fav-2', userId: 'user-gardenia', title: '荔枝花园彩虹束', seed: 'lychee-garden-rainbow', date: '2026-07-02', image: ['#fff6e7', '#ff9fbd', '#8ee9d0'], note: '' },
      { id: 'fav-3', userId: 'user-gardenia', title: '她的一月天空', seed: 'january-sky', date: '2026-01-14', image: ['#e9efff', '#b79cff', '#8ee9d0'], note: '想留给冬天。' }
    ],
    generations: [
      { id: 'gen-1', userId: 'user-gardenia', title: '晨露莓园空气束', createdAt: '2026-07-03T20:30:00+08:00', source: '上传参考图 + 文字偏好', input: '更清透，枝条外扩，不要太满。', status: 'adopted', credits: 12, seed: 'dewberry-morning-air', adoptedAt: '2026-07-08', publicTitle: '晨露莓园空气束', reward: 120 },
      { id: 'gen-2', userId: 'user-gardenia', title: '荔枝花园彩虹束', createdAt: '2026-07-02T19:10:00+08:00', source: '参考图库 + 彩虹多色', input: '颜色更丰富，但保留空气感。', status: 'approved', credits: 12, seed: 'lychee-garden-rainbow', reward: 0 }
    ],
    creditLedger: [
      { id: 'credit-1', userId: 'user-gardenia', type: 'adoption-reward', amount: 120, label: '平台采纳奖励', createdAt: '2026-07-08T09:00:00+08:00', ref: 'gen-1' },
      { id: 'credit-2', userId: 'user-gardenia', type: 'generation', amount: -12, label: '生成花花消耗', createdAt: '2026-07-03T20:30:00+08:00', ref: 'gen-1' },
      { id: 'credit-3', userId: 'user-gardenia', type: 'generation', amount: -12, label: '生成花花消耗', createdAt: '2026-07-02T19:10:00+08:00', ref: 'gen-2' },
      { id: 'credit-4', userId: 'user-gardenia', type: 'manual-grant', amount: 32, label: '测试活动赠送', createdAt: '2026-07-01T12:00:00+08:00', ref: 'local-dev' }
    ],
    orders: [{ id: 'order-1', userId: 'user-gardenia', type: 'credits', amount: 128, paid: 128, status: 'paid', paidAt: '2026-07-01T12:00:00+08:00', credits: 128 }],
    products: [
      { id: 'product-1', title: '晨露莓园帆布袋', sku: 'DF-TOTE-001', price: 129, stock: 24, status: 'published', bouquet: 'dewberry-morning-air', image: ['#f2cb62', '#87d486', '#7dc9ff'] },
      { id: 'product-2', title: '每日花束明信片组', sku: 'DF-CARD-007', price: 39, stock: 68, status: 'published', bouquet: 'lychee-garden-rainbow', image: ['#fff6e7', '#ff9fbd', '#8ee9d0'] },
      { id: 'product-3', title: '花园贴纸试作版', sku: 'DF-STICKER-001', price: 19, stock: 0, status: 'draft', bouquet: '', image: ['#b79cff', '#8ee9d0', '#f2cb62'] }
    ],
    productOrders: [{ id: 'shop-order-1', userId: 'user-gardenia', productId: 'product-1', quantity: 1, total: 129, status: 'paid', createdAt: '2026-07-28T14:20:00+08:00' }],
    addresses: [{ id: 'address-1', userId: 'user-gardenia', label: '家', recipient: '小花', phone: '138****8000', detail: '上海市浦东新区花园路 18 号', isDefault: true }],
    analytics: { visits: 286, visitors: 119, registrations: 12, payers: 8, revenue: 1088, topPages: [['/', 186], ['/member/', 52], ['/bouquet-shop/', 27], ['/about/', 21]], events: 642 },
    resourceUsage: [
      { label: '数据库', used: 38, limit: 100, unit: 'MB' }, { label: '文件存储', used: 214, limit: 1000, unit: 'MB' }, { label: '云函数调用', used: 18200, limit: 50000, unit: '次' }, { label: '带宽 / 请求', used: 1.8, limit: 5, unit: 'GB' }, { label: '邮件发送', used: 42, limit: 100, unit: '封' }
    ],
    auditLogs: [{ id: 'audit-1', userId: 'user-gardenia', action: 'credits +120', reason: '平台采纳奖励', by: 'operator: local-dev', at: '2026-07-08T09:00:00+08:00' }],
    dev: { version: '0.70', build: 'release', branch: 'codex/dailyflora-integration', preview: 'online', knownIssues: 0, todo: 0 }
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || clone(seed); } catch (_) { return clone(seed); }
  }
  function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); window.dispatchEvent(new CustomEvent('dailyflora-mock-change', { detail: state })); return state; }
  function update(mutator) { const state = read(); mutator(state); return write(state); }
  function user(state, id) { return state.users.find((item) => item.id === id) || state.users[0]; }
  function fmtDate(value) { return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)); }
  function money(value) { return `¥${Number(value || 0).toFixed(2)}`; }
  window.DailyFloraMock = { KEY, seed, clone, read, write, update, user, fmtDate, money };
  if (!localStorage.getItem(KEY)) write(clone(seed));
})();
