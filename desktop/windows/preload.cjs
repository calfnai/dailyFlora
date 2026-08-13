const { contextBridge } = require('electron');

const args = process.argv.slice(1).map((value) => value.toLowerCase());
const modeArgument = args.find((value) => value.startsWith('--dailyflora-mode='));
const requestedMode = modeArgument ? modeArgument.split('=', 2)[1] : '';
const isScreensaver = requestedMode === 'screensaver' || args.includes('/s') || args.includes('--screensaver') || args.includes('--display');
const isPreview = requestedMode === 'preview' || args.includes('/p') || args.includes('--preview');

contextBridge.exposeInMainWorld('dailyfloraDesktop', {
  isDesktop: true,
  mode: isScreensaver ? 'screensaver' : isPreview ? 'preview' : 'windowed',
  isScreensaver
});
