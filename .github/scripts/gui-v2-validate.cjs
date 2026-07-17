const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const previewUrl = `https://calfnai.github.io/dailyFlora/ui-v1/?capture=${Date.now()}`;
const specialUrl = `https://calfnai.github.io/dailyFlora/special0629/?capture=${Date.now()}`;

const reveal = async (page) => {
  await page.mouse.move(620, 430);
  await page.waitForTimeout(560);
};

(async () => {
  const browser = await chromium.launch({ headless: true });

  const desktop = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const page = await desktop.newPage();
  await page.goto(previewUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#daily-theme-en:not(:empty)');
  await reveal(page);
  assert.equal(await page.locator('.quality-mark').evaluate((el) => getComputedStyle(el).display), 'none');
  await page.screenshot({ path: 'validation/gui-v2-desktop-en.png', fullPage: true });

  await reveal(page);
  await page.locator('#controls-toggle').click();
  await page.waitForTimeout(360);
  await page.screenshot({ path: 'validation/gui-v2-view-open.png', fullPage: true });
  await page.locator('#controls-toggle').click();
  await page.waitForTimeout(220);

  await reveal(page);
  await page.locator('#site-menu-toggle').click();
  await page.waitForTimeout(260);
  await page.screenshot({ path: 'validation/gui-v2-index-open.png', fullPage: true });
  await page.locator('#site-menu-toggle').click();
  await page.waitForTimeout(220);

  await reveal(page);
  await page.locator('#controls-toggle').click();
  await page.locator('#today-button').click();
  await page.waitForTimeout(300);
  assert((await page.locator('.calendar-day[data-calendar-date]:disabled').count()) > 0);
  await page.screenshot({ path: 'validation/gui-v2-calendar.png', fullPage: true });
  await page.keyboard.press('Escape');
  if (await page.locator('#controls-panel').isVisible()) {
    await page.locator('#controls-toggle').click();
    await page.waitForTimeout(220);
  }

  await reveal(page);
  await page.locator('[data-language-choice="zh"]').click();
  await page.waitForTimeout(220);
  await page.screenshot({ path: 'validation/gui-v2-desktop-zh.png', fullPage: true });
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${previewUrl}&mobile=1`, { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('#daily-theme-en:not(:empty)');
  await reveal(mobilePage);
  await mobilePage.screenshot({ path: 'validation/gui-v2-mobile-default.png', fullPage: true });
  await reveal(mobilePage);
  await mobilePage.locator('#controls-toggle').click();
  await mobilePage.waitForTimeout(560);
  assert(Number(await mobilePage.locator('#hud').evaluate((el) => getComputedStyle(el).opacity)) < 0.05);
  await mobilePage.screenshot({ path: 'validation/gui-v2-mobile-view-open.png', fullPage: true });
  await mobile.close();

  const special = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const specialPage = await special.newPage();
  await specialPage.goto(specialUrl, { waitUntil: 'networkidle' });
  await specialPage.waitForTimeout(1000);
  await specialPage.screenshot({ path: 'validation/special-edition-safeguard-v2.png', fullPage: true });
  await special.close();

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
