import { expect, test, type Page, type Route } from '@playwright/test';

const apiPattern = '**/dailyflora-api-beta';

type MockState = {
  user: { id: string; name: string; email: string; role?: string } | null;
  favorites: Array<Record<string, string>>;
  generations: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  balance: number;
  points: Array<Record<string, unknown>>;
  favoriteWrites: number;
};

function json(route: Route, status: number, value: Record<string, unknown>) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(value) });
}

async function mockApi(page: Page, state: MockState) {
  await page.route(apiPattern, async (route) => {
    const body = JSON.parse(route.request().postData() || '{}');
    const action = body.action;
    if (action === 'register' || action === 'login') {
      state.user ||= { id: 'beta-user-1', name: body.name || 'Beta User', email: body.email, role: 'admin' };
      return json(route, 200, { code: 0, token: 'beta-token', tokenExpired: '2099-01-01T00:00:00.000Z', user: state.user });
    }
    if (action === 'me') return state.user ? json(route, 200, { code: 0, user: state.user }) : json(route, 401, { code: 401, message: '需要登录。' });
    if (action === 'logout') { state.user = null; return json(route, 200, { code: 0, ok: true }); }
    if (action === 'memberDashboard') {
      if (!state.user) return json(route, 401, { code: 401, message: '需要登录。' });
      return json(route, 200, { code: 0, snapshot: { user: state.user, favorites: state.favorites, generations: state.generations, tasks: state.tasks, pointAccount: { balance: state.balance }, points: state.points } });
    }
    if (action === 'listFavorites') return json(route, 200, { code: 0, favorites: state.favorites });
    if (action === 'saveFavorite') { state.favoriteWrites += 1; state.favorites = [body.favorite, ...state.favorites.filter((item) => item.id !== body.favorite.id)]; return json(route, 200, { code: 0, favorite: body.favorite }); }
    if (action === 'removeFavorite') { state.favorites = state.favorites.filter((item) => item.id !== body.favoriteId); return json(route, 200, { code: 0, ok: true }); }
    if (action === 'getPublicGeneration') return json(route, 200, { code: 0, generation: { id: 'g1', publicId: body.publicId, name: 'Beta Unique Bouquet', seed: 'beta-public-seed', themeId: 'dewberry-morning', date: '2026-08-05', status: 'completed', colors: ['#FFEEDD'] } });
    return json(route, 200, { code: 0, ok: true });
  });
}

function createState(): MockState {
  return { user: null, favorites: [], generations: [], tasks: [], balance: 20, points: [], favoriteWrites: 0 };
}

test('首页语言菜单不产生横向长滚动', async ({ page }) => {
  await page.goto('/');
  await page.locator('#site-menu-toggle').click();
  const metrics = await page.locator('#language-switcher').evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    buttonWidths: Array.from(element.querySelectorAll('button')).map((button) => button.getBoundingClientRect().width)
  }));
  expect(metrics.clientWidth).toBeGreaterThan(0);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  expect(metrics.buttonWidths).toHaveLength(7);
  expect(Math.max(...metrics.buttonWidths)).toBeLessThan(metrics.clientWidth / 2);
});

test('注册、登录状态、真实收藏和退出形成闭环', async ({ page }) => {
  const state = createState();
  await mockApi(page, state);
  await page.goto('/signup/');
  await expect(page.getByRole('link', { name: 'Sign in to an existing account' })).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Sign in to an existing account' }).first()).toBeVisible();
  await page.getByLabel('怎么称呼你').fill('Beta 花友');
  await page.getByLabel('邮箱').fill('beta@example.com');
  await page.getByLabel('密码').fill('beta-pass-123');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /创建账户/ }).click();
  await page.waitForURL('**/member/');
  await expect(page.getByRole('heading', { name: '我的收藏' })).toBeVisible();
  await expect(page.getByRole('link', { name: /登录/ })).toHaveCount(0);
  await expect(page.getByText('SIMULATED COLLECTION')).toHaveCount(0);
  await expect(page.getByText('还没有收藏')).toBeVisible();

  state.favorites.push({ id: 'DF-DATE-20260805', date: '2026-08-05', seed: 'beta-seed', themeId: 'dewberry-morning', themeName: '晨露莓园', themeEnglishName: 'Dewberry Morning', flowerPlanName: '空气感小花束', flowers: 'Cosmos', savedAt: new Date().toISOString() });
  await page.reload();
  const favoriteCard = page.getByRole('link', { name: /晨露莓园/ });
  await expect(favoriteCard).toBeVisible();
  await expect(favoriteCard).toHaveAttribute('href', /date=2026-08-05.*seed=beta-seed.*theme=dewberry-morning/);
  await page.getByRole('button', { name: '退出' }).click();
  await page.waitForURL('**/login/');
  await expect(page.getByRole('button', { name: /登录并打开花园/ })).toBeVisible();
});

test('登录后首页保留个人中心入口，收藏菜单不跳离当前花束', async ({ page }) => {
  const state = createState();
  state.user = { id: 'beta-user-1', name: 'Beta User', email: 'beta@example.com' };
  await mockApi(page, state);
  await page.addInitScript(() => localStorage.setItem('dailyflora.beta072.cloud.token.v1', 'beta-token'));
  await page.goto('/');

  await expect(page.locator('#account-dock')).toBeVisible();
  await page.locator('#account-open-button').click();
  await expect(page.locator('#account-profile-link')).toBeVisible();
  await expect(page.locator('#account-profile-link')).toHaveAttribute('href', './member/');

  await page.locator('#site-menu-toggle').click();
  await page.locator('#site-menu-favorite-link').click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#favorite-button')).toHaveAttribute('aria-pressed', 'true');
  expect(state.favoriteWrites).toBe(1);
});

test('Member 不加载 3D、手势模型或 MediaPipe', async ({ page }) => {
  const state = createState();
  state.user = { id: 'beta-user-1', name: 'Beta User', email: 'beta@example.com' };
  await mockApi(page, state);
  const urls: string[] = [];
  page.on('request', (request) => urls.push(request.url()));
  await page.addInitScript(() => localStorage.setItem('dailyflora.beta072.cloud.token.v1', 'beta-token'));
  await page.goto('/member/');
  await expect(page.getByRole('heading', { name: '我的收藏' })).toBeVisible();
  expect(urls.some((url) => /gesture_recognizer|mediapipe|vision_bundle|floraPrimitives|main-.*\.js/.test(url))).toBeFalsy();
  await expect(page.locator('iframe')).toHaveCount(0);
});

test('公开唯一链接退出登录后仍可访问且响应不展示私人数据', async ({ page }) => {
  const state = createState();
  await mockApi(page, state);
  await page.goto('/bouquet/?id=public-beta-id');
  await expect(page.getByRole('heading', { name: 'Beta Unique Bouquet' })).toBeVisible();
  await expect(page.getByText('beta@example.com')).toHaveCount(0);
  await expect(page.getByText(/reference\.webp|thumbnail\.webp/)).toHaveCount(0);
  await expect(page.locator('iframe')).toHaveAttribute('src', /seed=beta-public-seed/);
});

test('Credits 可见，重置入口只在登录页', async ({ page }) => {
  const state = createState();
  await mockApi(page, state);
  await page.goto('/legal/credits/');
  await expect(page.getByText(/Credits|Attributions|鸣谢与署名/).first()).toBeVisible();
  await page.goto('/signup/');
  await expect(page.getByText('忘记密码？')).toHaveCount(0);
  await page.goto('/login/');
  await expect(page.getByText('忘记密码？')).toBeVisible();
});
