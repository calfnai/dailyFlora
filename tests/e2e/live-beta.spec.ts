import { expect, test } from '@playwright/test';

const liveBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const liveEmail = process.env.DAILYFLORA_BETA_TEST_EMAIL;
const livePassword = process.env.DAILYFLORA_BETA_TEST_PASSWORD;
const apiURL = 'https://fc-mp-7937f272-ccea-46ee-ac33-3e23abb1fa49.next.bspapp.com/dailyflora-api-beta';

test.skip(!liveBaseURL || !liveEmail || !livePassword, 'Live Beta credentials are required.');

test('线上 Beta 登录、收藏、公开链接、退出及 Member 资源边界', async ({ page, request }) => {
  const memberRequests: string[] = [];
  page.on('request', (entry) => memberRequests.push(entry.url()));

  await page.goto('/beta-072/login/');
  await page.getByLabel('邮箱', { exact: true }).fill(liveEmail!);
  await page.getByLabel('密码', { exact: true }).fill(livePassword!);
  await page.getByRole('button', { name: /登录并打开花园/ }).click();
  await page.waitForURL('**/beta-072/member/');

  await expect(page.getByRole('heading', { name: '我的收藏' })).toBeVisible();
  await expect(page.getByRole('link', { name: /登录|创建账户/ })).toHaveCount(0);
  await expect(page.getByText('SIMULATED COLLECTION')).toHaveCount(0);
  const realFavorite = page.getByRole('link', { name: /Beta Live/ });
  await expect(realFavorite).toBeVisible();
  await expect(realFavorite).toHaveAttribute('href', /date=2026-08-05.*seed=beta-live-seed-0721.*theme=dewberry-morning/);
  expect(memberRequests.some((url) => /gesture_recognizer|mediapipe|vision_bundle|floraPrimitives/.test(url))).toBeFalsy();
  await expect(page.locator('iframe')).toHaveCount(0);

  const token = await page.evaluate(() => localStorage.getItem('dailyflora.beta072.cloud.token.v1'));
  expect(token).toBeTruthy();
  await request.post(apiURL, { headers: { Authorization: `Bearer ${token}` }, data: { action: 'removeFavorite', favoriteId: 'DF-DATE-20260805' } });
  await page.goto('/beta-072/');
  const favoriteButton = page.locator('#favorite-button');
  await expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#site-menu-toggle').click();
  await page.locator('#site-menu-favorite-link').click();
  await expect(page.getByText('已保存到你的云端收藏。')).toBeVisible();
  const favoritesResponse = await request.post(apiURL, { headers: { Authorization: `Bearer ${token}` }, data: { action: 'listFavorites' } });
  const favoriteData = await favoritesResponse.json();
  expect(favoriteData.favorites.some((item: { id: string }) => item.id === 'DF-DATE-20260805')).toBeTruthy();

  const dashboardResponse = await request.post(apiURL, { headers: { Authorization: `Bearer ${token}` }, data: { action: 'memberDashboard' } });
  const dashboard = await dashboardResponse.json();
  const completed = dashboard.snapshot.tasks.find((item: { status: string; publicId?: string }) => item.status === 'completed' && item.publicId);
  expect(completed?.publicId).toBeTruthy();

  await page.goto(`/beta-072/bouquet/?id=${encodeURIComponent(completed.publicId)}`);
  await expect(page.locator('iframe')).toHaveAttribute('src', /seed=/);
  await expect(page.getByText(liveEmail!)).toHaveCount(0);
  await expect(page.getByText(/reference\.webp|thumbnail\.webp|积分/)).toHaveCount(0);

  await page.goto('/beta-072/member/');
  await page.getByRole('button', { name: '退出' }).click();
  await page.waitForURL('**/beta-072/login/');
  await expect(page.getByRole('button', { name: /登录并打开花园/ })).toBeVisible();
});

test('线上 Credits 有内容，注册页不放密码重置', async ({ page }) => {
  await page.goto('/beta-072/legal/credits/');
  await expect(page.getByText(/Credits|Attributions|鸣谢与署名/).first()).toBeVisible();
  await page.goto('/beta-072/signup/');
  await expect(page.getByText('忘记密码？')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '登录已有账户' })).toBeVisible();
});
