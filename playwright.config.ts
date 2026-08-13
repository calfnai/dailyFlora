import { defineConfig } from '@playwright/test';

const liveBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const previewBuild = process.env.PLAYWRIGHT_PREVIEW === '1';
const localPort = previewBuild ? 5193 : 5192;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL: liveBaseURL || `http://127.0.0.1:${localPort}`,
    launchOptions: {
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: liveBaseURL ? undefined : {
    command: previewBuild
      ? `npm run preview -- --host 127.0.0.1 --port ${localPort}`
      : `npm run dev -- --host 127.0.0.1 --port ${localPort}`,
    url: `http://127.0.0.1:${localPort}`,
    reuseExistingServer: true,
    timeout: 120_000
  }
});
