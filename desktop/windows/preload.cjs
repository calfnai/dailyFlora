const { contextBridge, ipcRenderer } = require('electron');

const args = process.argv.slice(1).map((value) => value.toLowerCase());
const modeArgument = args.find((value) => value.startsWith('--dailyflora-mode='));
const requestedMode = modeArgument ? modeArgument.split('=', 2)[1] : '';
const isScreensaver = requestedMode === 'screensaver' || args.includes('/s') || args.includes('--screensaver') || args.includes('--display');
const isPreview = requestedMode === 'preview' || args.includes('/p') || args.includes('--preview');

contextBridge.exposeInMainWorld('dailyfloraDesktop', {
  isDesktop: true,
  mode: isScreensaver ? 'screensaver' : isPreview ? 'preview' : 'windowed',
  isScreensaver,
  setFullscreen: async (enabled) => ipcRenderer.invoke('dailyflora:set-fullscreen', Boolean(enabled)),
  onFullscreenChange: (callback) => {
    const listener = (_event, enabled) => callback(Boolean(enabled));
    ipcRenderer.on('dailyflora:fullscreen-changed', listener);
    return () => ipcRenderer.removeListener('dailyflora:fullscreen-changed', listener);
  },
  onEscape: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('dailyflora:escape', listener);
    return () => ipcRenderer.removeListener('dailyflora:escape', listener);
  }
});
