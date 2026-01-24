import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  timeout: 30 * 1000,
  // Global timeout for the entire test run (10 minutes max)
  globalTimeout: isCI ? 10 * 60 * 1000 : undefined,
  reporter: isCI
    ? [['github'], ['json', { outputFile: 'test-results/results.json' }]]
    : [['html'], ['json', { outputFile: 'test-results/results.json' }]],
  // Visual regression testing configuration
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.05,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.05,
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Project configurations for different test types */
  projects: [
    // Desktop browsers - E2E tests
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /e2e\/(?!mobile).*\.spec\.ts$/,
    },
    ...(isCI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: /e2e\/(?!mobile).*\.spec\.ts$/,
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: /e2e\/(?!mobile).*\.spec\.ts$/,
          },
        ]),
    // Mobile browsers - Mobile E2E tests
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /e2e\/mobile\/.*\.spec\.ts$/,
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /e2e\/mobile\/.*\.spec\.ts$/,
    },
    // Visual regression tests - Chromium only for consistency
    {
      name: 'visual',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /visual\/.*\.spec\.ts$/,
    },
    // Performance tests - Chromium only
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /performance\/.*\.spec\.ts$/,
    },
    // Contract tests - Chromium only
    {
      name: 'contracts',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /contracts\/.*\.spec\.ts$/,
    },
  ],

  webServer: {
    command: isCI ? 'pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
    timeout: 120 * 1000,
  },
})
