const {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  net,
  powerMonitor,
  protocol,
  session,
  shell,
  Tray
} = require('electron');
const { existsSync, readFileSync, statSync, writeFileSync } = require('node:fs');
const { join, normalize, relative } = require('node:path');
const { pathToFileURL } = require('node:url');

const scheme = 'dailyflora';
protocol.registerSchemesAsPrivileged([
  {
    scheme,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
  }
]);

const args = process.argv.slice(1).map((value) => value.toLowerCase());
const isScreensaver = args.includes('/s') || args.includes('--screensaver') || args.includes('--display');
const isPreview = args.includes('/p') || args.includes('--preview');
const isConfigure = args.includes('/c') || args.includes('--configure');
const mode = isScreensaver ? 'screensaver' : isPreview ? 'preview' : isConfigure ? 'windowed' : 'windowed';
const distRoot = normalize(join(app.getAppPath(), 'dist'));
const screenSaverReadyAt = Date.now() + 1000;
const trayAutoDisplayChoices = [0, 5, 10, 15, 30, 60];
const defaultTraySettings = { autoDisplayMinutes: 10 };
const traySettingsPath = join(app.getPath('userData'), 'tray-settings.json');
let traySettings = { ...defaultTraySettings };
let tray = null;
let mainWindow = null;
let isQuitting = false;
let trayHidden = false;
let trayHiddenAt = 0;
let autoDisplayTriggered = false;
let autoDisplayActive = false;
let autoDisplayTimer = null;

function readTraySettings() {
  try {
    const stored = JSON.parse(readFileSync(traySettingsPath, 'utf8'));
    const minutes = Number(stored?.autoDisplayMinutes);
    if (trayAutoDisplayChoices.includes(minutes)) traySettings.autoDisplayMinutes = minutes;
  } catch {
    // The default is intentionally useful on a first install and remains local.
  }
}

function writeTraySettings() {
  try {
    writeFileSync(traySettingsPath, JSON.stringify(traySettings, null, 2), 'utf8');
  } catch (error) {
    console.warn('[DailyFlora] could not save tray settings', error);
  }
}

function createTrayIcon() {
  const pngData = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAIKADAAQAAAABAAAAIAAAAACshmLzAAADvElEQVRYCcVXWWgTYRD+drO7Sds0xvQwrdVUqVqPYvGggvigDypiRRFfpCAo+CAKPlTUN1E8QfB4ES+0D/oggqDFA0Wx3ogWFAM1Xq1atdrSHG2OTdb518a426TdjQanhO7M/DPft/8/87PDQSP2Els+v4kD6hUFVRwHu8adpUK5gpTLpwCXw32Jo0CwK5mKsH6JlGdfyXP8aTI4krZc/CcS/oSSWBvtD15k+VUCKji4CxxJLkD1ORWSBJRVjAQBqtvuy/WbDyJBO0HHUWWx5du2EfhC/YJc64RpFUQuzHNQluUaLFN+IlHP2fIcgX9V7ZmAMtlZdwhmwCePHYmNK2owt8aN950BbDh8F5yFx4mdy1BZMRItTz/gUNNDeN98z4SpsTNsLi/fQZ0xvCyp82Df+jkQCDAp9192QnA5MW+WJ2mCHE+gcf91XLnT9ts21IMhAqXOPFw7sBQ2SdDkYsylshLouzcckbFgzRl86w5p1qdTUq+TzjtgmzvNPQicuXhJHATO7DaroNkVZsskhgiEwnL6+CHurWBfNH2MzmqIwO3WT3jzuVcXmlSpmXTia+/G7cfvdNb0qkUUrTvSu1LWRELB9SftKKFaGOcuhIUKUbA74JoyE7YRxZAjIShxGZGojGYqvs17r8LoDhgqwhQVur5ECypKCrBvzxrMr6tRXecutuDI8WZ0fOklEvE/lw/7bOgI/swSicXpOPx41NaOcCwGf6APZy/cA9t2s+Asr2kCLEikdhSLC3Dj40e0fOlCRfVoSFaRuUyL6SOYOG0M1m9fjqLSEXAV2uEoyFdBv3Z2Y/e2Jrx49tYUCVM7UD3dgy0HGlRwhiKJqYtpVJkLB09uRO3sCbkhwFp+XWM9BCrClGhbUCRCW3etTns5pWK0T4Z3oNBZgGK3UxMdlWManSnu0UVwuox/Shom4O8JofXRaw1gjz+IYKBfY3tw5wV6fgQ0tqEU00U4ubYSnglulHuKUDW1FMd2NWNG3SRYqQvaXnXg+RMtyaHAmS9VRcOtHPB7W9+D/cZXu+m3CILE49L5FoPRg5cZPgJ9aGdHj2oqH1ukd5nSefZZZCpiYHF/KILurgDKK7MnkPwk81HO2mxIPLzphUJ/2Qq1tk+g8MvUzdkRuOXNFluNG8D+v4MJFWGwi81qbFz6q9cxEayOZoTJsNV7NS5HvbwovaSPy8V0HFYTuUwvpbf001zYkBxOf1/sjIQcE0+xcYmmJaeicHYqEsk0QpoAVu2U6xWBn6B5sCEuB58ml/0E8VI31wdlwjgAAAAASUVORK5CYII=';
  return nativeImage.createFromDataURL(`data:image/png;base64,${pngData}`).resize({ width: 16, height: 16 });
}

function trayAutoDisplayLabel(minutes) {
  return minutes === 0 ? '关闭自动显示' : `闲置 ${minutes} 分钟后自动显示`;
}

function refreshTrayMenu() {
  if (!tray) return;
  const autoDisplayItems = trayAutoDisplayChoices.map((minutes) => ({
    label: trayAutoDisplayLabel(minutes),
    type: 'radio',
    checked: traySettings.autoDisplayMinutes === minutes,
    click: () => setAutoDisplayMinutes(minutes)
  }));
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '打开 DailyFlora', click: showMainWindow },
    { label: '立即显示花束', click: showAutoDisplay },
    { type: 'separator' },
    { label: '关闭窗口后自动显示', enabled: false },
    ...autoDisplayItems,
    { type: 'separator' },
    { label: '退出 DailyFlora', click: () => app.quit() }
  ]));
  tray.setToolTip(`DailyFlora · ${trayAutoDisplayLabel(traySettings.autoDisplayMinutes)}`);
}

function setAutoDisplayMinutes(minutes) {
  if (!trayAutoDisplayChoices.includes(minutes)) return;
  traySettings.autoDisplayMinutes = minutes;
  autoDisplayTriggered = false;
  if (trayHidden) trayHiddenAt = Date.now();
  writeTraySettings();
  refreshTrayMenu();
}

function stopAutoDisplayTimer() {
  if (autoDisplayTimer) {
    clearInterval(autoDisplayTimer);
    autoDisplayTimer = null;
  }
}

function startAutoDisplayTimer() {
  stopAutoDisplayTimer();
  if (isScreensaver || isPreview) return;
  autoDisplayTimer = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || !trayHidden || autoDisplayTriggered) return;
    const minutes = traySettings.autoDisplayMinutes;
    if (!minutes) return;
    const requiredMs = minutes * 60 * 1000;
    const hiddenLongEnough = Date.now() - trayHiddenAt >= requiredMs;
    const systemIdleLongEnough = powerMonitor.getSystemIdleTime() >= minutes * 60;
    if (hiddenLongEnough && systemIdleLongEnough) showAutoDisplay();
  }, 5000);
}

function exitNativeFullscreen(win) {
  if (!win || win.isDestroyed()) return;
  if (win.isFullScreen()) win.setFullScreen(false);
  win.setMenuBarVisibility(true);
  win.setAlwaysOnTop(false);
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  exitNativeFullscreen(mainWindow);
  autoDisplayActive = false;
  mainWindow.hide();
  trayHidden = true;
  trayHiddenAt = Date.now();
  autoDisplayTriggered = false;
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createWindow();
  }
  autoDisplayActive = false;
  trayHidden = false;
  autoDisplayTriggered = false;
  exitNativeFullscreen(mainWindow);
  mainWindow.show();
  mainWindow.focus();
}

function showAutoDisplay() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  autoDisplayTriggered = true;
  autoDisplayActive = true;
  trayHidden = false;
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setFullScreen(true);
  mainWindow.focus();
}

function createTray() {
  if (isScreensaver || isPreview || tray) return;
  tray = new Tray(createTrayIcon());
  tray.on('click', showMainWindow);
  tray.on('double-click', showMainWindow);
  refreshTrayMenu();
}

function isInsideDist(targetPath) {
  const relativePath = relative(distRoot, targetPath);
  return relativePath === '' || (!relativePath.startsWith('..') && !relativePath.includes(`..${require('node:path').sep}`));
}

function resolveDistFile(pathname) {
  const decoded = decodeURIComponent(pathname || '/').replace(/^\/+/, '');
  const candidate = normalize(join(distRoot, decoded || 'index.html'));
  if (!isInsideDist(candidate)) return null;

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const indexPath = join(candidate, 'index.html');
    return existsSync(indexPath) ? indexPath : null;
  }
  if (existsSync(candidate)) return candidate;
  if (!candidate.includes('.')) {
    const indexPath = join(candidate, 'index.html');
    if (existsSync(indexPath)) return indexPath;
  }
  return null;
}

function dailyfloraUrl(pathname = '/index.html', query = '') {
  return `${scheme}://app${pathname}${query}`;
}

function createWindow() {
  const win = new BrowserWindow({
    width: isPreview ? 480 : 1440,
    height: isPreview ? 300 : 900,
    minWidth: isPreview ? 320 : 960,
    minHeight: isPreview ? 200 : 640,
    show: false,
    frame: !isScreensaver,
    fullscreen: isScreensaver,
    kiosk: isScreensaver,
    alwaysOnTop: isScreensaver ? 'screen-saver' : false,
    skipTaskbar: isScreensaver,
    autoHideMenuBar: isScreensaver,
    backgroundColor: '#090a0e',
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      additionalArguments: [`--dailyflora-mode=${mode}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.setFullScreenable(true);
  const reportFullscreenState = () => {
    if (!win.isDestroyed()) win.webContents.send('dailyflora:fullscreen-changed', win.isFullScreen());
  };
  win.on('enter-full-screen', () => {
    win.setMenuBarVisibility(false);
    reportFullscreenState();
  });
  win.on('leave-full-screen', () => {
    if (!isScreensaver) win.setMenuBarVisibility(true);
    if (!isScreensaver) win.setAlwaysOnTop(false);
    reportFullscreenState();
    if (autoDisplayActive && !isQuitting) {
      setTimeout(() => {
        if (!win.isDestroyed() && autoDisplayActive && !win.isFullScreen()) hideMainWindow();
      }, 160);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(`${scheme}://`)) return { action: 'allow' };
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('before-input-event', (event, input) => {
    const isEscape = input.type === 'keyDown' && (input.key === 'Escape' || input.code === 'Escape');
    if (!isScreensaver && isEscape && win.isFullScreen()) {
      // Chromium can consume Esc while a native Windows fullscreen transition
      // is active. Handle it before the renderer so Esc is always dependable.
      event.preventDefault();
      win.webContents.send('dailyflora:escape');
      exitNativeFullscreen(win);
      if (autoDisplayActive && !isQuitting) {
        setTimeout(() => {
          if (!win.isDestroyed() && autoDisplayActive && !win.isFullScreen()) hideMainWindow();
        }, 160);
      }
      return;
    }
    if (isScreensaver) {
      const movingAfterStartup = input.type === 'mouseMove' && Date.now() >= screenSaverReadyAt;
      if (input.type === 'keyDown' || input.type === 'mouseDown' || movingAfterStartup) app.quit();
    }
  });

  win.once('ready-to-show', () => win.show());
  win.on('close', (event) => {
    if (isQuitting || isScreensaver || isPreview) return;
    event.preventDefault();
    hideMainWindow();
  });
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
    if (isScreensaver || isPreview) app.quit();
  });

  const query = isScreensaver || isPreview ? '?preview=1&desktop=1' : '?desktop=1';
  void win.loadURL(dailyfloraUrl('/index.html', query));
  return win;
}

app.whenReady().then(() => {
  readTraySettings();
  ipcMain.handle('dailyflora:set-fullscreen', (event, enabled) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || isScreensaver || isPreview) return false;
    const targetState = Boolean(enabled);
    if (targetState) {
      autoDisplayActive = false;
      trayHidden = false;
      win.setMenuBarVisibility(false);
      win.setAlwaysOnTop(false);
    } else {
      exitNativeFullscreen(win);
    }
    win.setFullScreen(targetState);
    // Windows completes the native transition asynchronously. The renderer is
    // updated again by enter-full-screen / leave-full-screen below.
    return targetState;
  });

  protocol.handle(scheme, (request) => {
    const requestUrl = new URL(request.url);
    const target = resolveDistFile(requestUrl.pathname);
    if (!target) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(target).toString());
  });

  const appSession = session.defaultSession;
  appSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) => {
    return permission === 'media' && requestingOrigin.startsWith(`${scheme}://`);
  });
  appSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'media');
  });

  createTray();
  mainWindow = createWindow();
  startAutoDisplayTimer();
  app.on('activate', () => {
    showMainWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  stopAutoDisplayTimer();
  if (tray && !tray.isDestroyed()) tray.destroy();
  tray = null;
});

app.on('window-all-closed', () => {
  if (isScreensaver || isPreview) app.quit();
});
