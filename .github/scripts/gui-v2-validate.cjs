const { chromium } = require('playwright');

const previewUrl = `https://calfnai.github.io/dailyFlora/ui-v1/?diagnostic=${Date.now()}`;
const styleSnapshot = (element) => {
  const style = getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return {
    rect: {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      right: rect.right,
      bottom: rect.bottom
    },
    display: style.display,
    position: style.position,
    right: style.right,
    bottom: style.bottom,
    width: style.width,
    height: style.height,
    padding: style.padding,
    border: style.border,
    transform: style.transform,
    animationName: style.animationName,
    animationDuration: style.animationDuration,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems
  };
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    timezoneId: 'America/Los_Angeles'
  });
  const page = await context.newPage();
  await page.goto(previewUrl, { waitUntil: 'networkidle' });
  await page.waitForSelector('#daily-theme-en:not(:empty)');
  await page.waitForTimeout(1200);

  const toggle = page.locator('#controls-toggle');
  const parent = page.locator('#controls');
  const panel = page.locator('#controls-panel');
  const before = {
    toggle: await toggle.evaluate(styleSnapshot),
    parent: await parent.evaluate(styleSnapshot),
    panel: await panel.evaluate(styleSnapshot)
  };
  const point = {
    x: before.toggle.rect.x + before.toggle.rect.width / 2,
    y: before.toggle.rect.y + before.toggle.rect.height / 2
  };
  const hitBefore = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element ? { id: element.id, className: String(element.className), tagName: element.tagName } : null;
  }, point);

  await page.mouse.click(point.x, point.y);
  await page.waitForTimeout(300);
  const after = {
    toggle: await toggle.evaluate(styleSnapshot),
    parent: await parent.evaluate(styleSnapshot),
    panel: await panel.evaluate(styleSnapshot),
    ariaExpanded: await toggle.getAttribute('aria-expanded'),
    panelVisible: await panel.isVisible()
  };
  const hitAfter = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return element ? { id: element.id, className: String(element.className), tagName: element.tagName } : null;
  }, point);

  console.log(JSON.stringify({ point, hitBefore, before, hitAfter, after }, null, 2));
  await page.screenshot({ path: 'validation/gui-v2-view-diagnostic.png', fullPage: true });
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
