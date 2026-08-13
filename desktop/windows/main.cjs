const { app, BrowserWindow, ipcMain, net, protocol, session, shell } = require('electron');
const { existsSync, statSync } = require('node:fs');
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
  win.on('enter-full-screen', reportFullscreenState);
  win.on('leave-full-screen', reportFullscreenState);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(`${scheme}://`)) return { action: 'allow' };
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isScreensaver) {
    win.webContents.on('before-input-event', (_event, input) => {
      const movingAfterStartup = input.type === 'mouseMove' && Date.now() >= screenSaverReadyAt;
      if (input.type === 'keyDown' || input.type === 'mouseDown' || movingAfterStartup) app.quit();
    });
  }

  win.once('ready-to-show', () => win.show());
  win.on('closed', () => {
    if (!isScreensaver) return;
    app.quit();
  });

  const query = isScreensaver || isPreview ? '?preview=1&desktop=1' : '?desktop=1';
  void win.loadURL(dailyfloraUrl('/index.html', query));
  return win;
}

app.whenReady().then(() => {
  ipcMain.handle('dailyflora:set-fullscreen', (event, enabled) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win || isScreensaver || isPreview) return false;
    const targetState = Boolean(enabled);
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

  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());
