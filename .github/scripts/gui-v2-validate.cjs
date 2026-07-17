const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const previewUrl = `https://calfnai.github.io/dailyFlora/ui-v1/?validation=${Date.now()}`;
const specialUrl = `https://calfnai.github.io/dailyFlora/special0629/?validation=${Date.now()}`;
const closeEnough = (a, b) => Math.abs(a - b) < 1;
const losAngelesToday = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const revealAndSettle = async (page) => {
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
  await page.waitForTimeout(1200);

  assert.equal(await page.locator('.interface-status').count(), 0, 'top status strip should be removed');
  assert.equal(await page.locator('.interface-corner').count(), 3, 'three animated corner signals should exist');
  assert.equal(await page.locator('#daily-theme-en').evaluate((el) => getComputedStyle(el).display), 'block');
  assert.equal(await page.locator('#daily-theme-cn').evaluate((el) => getComputedStyle(el).display), 'none');
  assert.equal(await page.locator('[data-language-choice="en"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.site-menu-legacy-icon').evaluate((el) => getComputedStyle(el).display), 'none');
  await page.screenshot({ path: 'validation/gui-v2-desktop-en.png', fullPage: true });

  await revealAndSettle(page);
  const viewToggle = page.locator('#controls-toggle');
  const viewBefore = await viewToggle.boundingBox();
  assert(viewBefore, 'View toggle must have a hit target');
  assert.equal(
    await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, {
      x: viewBefore.x + viewBefore.width / 2,
      y: viewBefore.y + viewBefore.height / 2
    }),
    'controls-toggle',
    'View trigger must be clickable before expansion'
  );
  const viewPoint = {
    x: viewBefore.x + viewBefore.width / 2,
    y: viewBefore.y + viewBefore.height / 2
  };
  await page.mouse.click(viewPoint.x, viewPoint.y);
  await page.waitForTimeout(360);
  assert.equal(await page.locator('#controls-panel').isVisible(), true, 'View panel should open');
  const viewAfter = await viewToggle.boundingBox();
  assert(viewAfter, 'View toggle must remain measurable after opening');
  assert(
    closeEnough(viewBefore.x, viewAfter.x) && closeEnough(viewBefore.y, viewAfter.y),
    `View toggle moved after opening: before=${JSON.stringify(viewBefore)} after=${JSON.stringify(viewAfter)}`
  );
  assert.equal(
    await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, viewPoint),
    'controls-toggle',
    'the original View coordinate must still hit the trigger after expansion'
  );
  await page.screenshot({ path: 'validation/gui-v2-view-open.png', fullPage: true });
  await page.mouse.click(viewPoint.x, viewPoint.y);
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#controls-panel').isVisible(), false, 'same coordinate should close View');

  await page.mouse.click(viewPoint.x, viewPoint.y);
  await page.waitForTimeout(7300);
  assert.equal(await page.locator('#controls-panel').isVisible(), false, 'auto-hide must close View panel');
  assert.equal(await viewToggle.getAttribute('aria-expanded'), 'false', 'auto-hide must reset View state');

  await revealAndSettle(page);
  const indexToggle = page.locator('#site-menu-toggle');
  await indexToggle.click();
  assert.equal(await page.locator('#site-menu-panel').isVisible(), true, 'Index should open');
  await page.screenshot({ path: 'validation/gui-v2-index-open.png', fullPage: true });
  await page.waitForTimeout(3700);
  assert.equal(await page.locator('#site-menu-panel').isVisible(), false, 'auto-hide must close Index panel');
  assert.equal(await indexToggle.getAttribute('aria-expanded'), 'false', 'auto-hide must reset Index state');

  await revealAndSettle(page);
  await viewToggle.click();
  await page.locator('#today-button').click();
  await page.waitForTimeout(260);
  assert.equal(await page.locator('#date-picker').getAttribute('max'), losAngelesToday());
  assert.equal(
    await page.locator('.calendar-nav-button[data-calendar-nav="1"]').isDisabled(),
    true,
    'next month must be disabled in the current month'
  );
  assert(
    (await page.locator('.calendar-day[data-calendar-date]:disabled').count()) > 0,
    'future dates must be disabled'
  );
  const latestEnabledDate = await page
    .locator('.calendar-day[data-calendar-date]:not(:disabled)')
    .last()
    .getAttribute('data-calendar-date');
  assert(latestEnabledDate <= losAngelesToday(), 'latest enabled custom-calendar date must not exceed today');
  await page.screenshot({ path: 'validation/gui-v2-calendar.png', fullPage: true });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(180);

  await page.locator('[data-language-choice="zh"]').click();
  assert.equal(await page.locator('#daily-theme-cn').evaluate((el) => getComputedStyle(el).display), 'block');
  assert.equal(await page.locator('#daily-theme-en').evaluate((el) => getComputedStyle(el).display), 'none');
  assert.equal(await page.locator('[data-language-choice="zh"]').getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: 'validation/gui-v2-desktop-zh.png', fullPage: true });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('#daily-theme-cn:not(:empty)');
  assert.equal(await page.locator('#daily-theme-cn').evaluate((el) => getComputedStyle(el).display), 'block');
  assert.equal(await page.locator('[data-language-choice="zh"]').getAttribute('aria-pressed'), 'true');
  await desktop.close();

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto(`${previewUrl}&mobile=1`, { waitUntil: 'networkidle' });
  await mobilePage.waitForSelector('#daily-theme-en:not(:empty)');
  await mobilePage.waitForTimeout(800);
  await revealAndSettle(mobilePage);
  const mobileView = mobilePage.locator('#controls-toggle');
  const mobileBefore = await mobileView.boundingBox();
  assert(mobileBefore);
  const mobilePoint = {
    x: mobileBefore.x + mobileBefore.width / 2,
    y: mobileBefore.y + mobileBefore.height / 2
  };
  await mobilePage.mouse.click(mobilePoint.x, mobilePoint.y);
  await mobilePage.waitForTimeout(360);
  const mobileAfter = await mobileView.boundingBox();
  assert(mobileAfter);
  assert(
    closeEnough(mobileBefore.x, mobileAfter.x) && closeEnough(mobileBefore.y, mobileAfter.y),
    `mobile View toggle moved after opening: before=${JSON.stringify(mobileBefore)} after=${JSON.stringify(mobileAfter)}`
  );
  assert.equal(
    await mobilePage.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, mobilePoint),
    'controls-toggle',
    'mobile original View coordinate must remain clickable'
  );
  await mobilePage.screenshot({ path: 'validation/gui-v2-mobile.png', fullPage: true });
  await mobilePage.mouse.click(mobilePoint.x, mobilePoint.y);
  await mobilePage.waitForTimeout(180);
  assert.equal(await mobilePage.locator('#controls-panel').isVisible(), false);
  await mobile.close();

  const special = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const specialPage = await special.newPage();
  await specialPage.goto(specialUrl, { waitUntil: 'networkidle' });
  await specialPage.waitForTimeout(1000);
  for (const selector of ['.interface-frame', '.language-toggle', '.site-menu-mark', '.controls-glyph']) {
    const locator = specialPage.locator(selector);
    if ((await locator.count()) > 0) {
      assert.equal(
        await locator.first().evaluate((el) => getComputedStyle(el).display),
        'none',
        `${selector} must stay hidden on Special Edition`
      );
    }
  }
  assert.notEqual(
    await specialPage.locator('#site-menu-toggle svg').first().evaluate((el) => getComputedStyle(el).display),
    'none',
    'Special Edition menu icon must remain'
  );
  await specialPage.screenshot({ path: 'validation/special-edition-safeguard-v2.png', fullPage: true });
  await special.close();

  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
