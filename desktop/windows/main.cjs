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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#090a0e"/><path d="M16 26c-1.4-6.1-1.3-10.4 0-15.2" fill="none" stroke="#8da66d" stroke-width="1.5" stroke-linecap="round"/><path d="M16 14c-6.8 1.4-8.7-4.7-3.3-6.8 3.4-1.3 4.1 3.6 3.3 6.8Z" fill="#dfaa67"/><path d="M16 14c6.8 1.4 8.7-4.7 3.3-6.8-3.4-1.3-4.1 3.6-3.3 6.8Z" fill="#e5c47d"/><path d="M16 16c-5.5 1.6-7.1 6.2-2.2 6.5 3.2.2 3.7-3.8 2.2-6.5Z" fill="#a8c58a"/><path d="M16 16c5.5 1.6 7.1 6.2 2.2 6.5-3.2.2-3.7-3.8-2.2-6.5Z" fill="#c8dda0"/><circle cx="16" cy="14.5" r="1.6" fill="#f5e1a8"/></svg>`;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  return nativeImage.createFromDataURL(dataUrl).resize({ width: 16, height: 16 });
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
