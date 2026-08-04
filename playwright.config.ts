import { defineConfig } from '@playwright/test';

const liveBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  fullyParallel: false,
  use: {
    baseURL: liveBaseURL || 'http://127.0.0.1:5192',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: liveBaseURL ? undefined : {
    command: 'npm run dev -- --host 127.0.0.1 --port 5192',
    url: 'http://127.0.0.1:5192',
    reuseExistingServer: true,
    timeout: 120_000
  }
});
