const { defineConfig, devices } = require('@playwright/test')
const { loadEnv } = require('./e2e/env')

loadEnv()

// App talks to the LIVE prod backend (hardcoded submit URL + AuthContext fallback),
// so the only local piece is the vite dev server serving the SPA.
const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173'

module.exports = defineConfig({
  testDir: './e2e',
  // Mutations hit prod on a single self-created record — never parallelize or retry,
  // or we risk duplicate submissions / racing state transitions.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'e2e/.report', open: 'never' }]],
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
