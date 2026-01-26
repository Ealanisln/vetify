import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright configuration for weekly smoke tests
 *
 * This configuration is optimized for stability over speed:
 * - Single worker execution for consistency
 * - More retries for flaky tests
 * - Extended timeouts
 * - Dedicated report output
 *
 * Usage:
 *   pnpm test:e2e:weekly          # Run full suite
 *   pnpm test:e2e:weekly:p0       # Run P0 (critical) tests only
 */
export default defineConfig({
  testDir: './tests/e2e/weekly',
  fullyParallel: false, // Sequential execution for stability
  forbidOnly: true,
  retries: 2, // More retries for weekly tests
  workers: 1, // Single worker for consistency
  timeout: 60 * 1000, // 60s per test (extended for stability)
  globalTimeout: 30 * 60 * 1000, // 30 minutes max for entire run
  reporter: [
    ['html', { outputFolder: 'playwright-report-weekly', open: 'never' }],
    ['json', { outputFile: 'test-results/weekly-results.json' }],
    ['list'], // Console output for CI visibility
  ],
  expect: {
    timeout: 15 * 1000, // 15s for assertions
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Slower actions for stability
    actionTimeout: 30 * 1000,
    navigationTimeout: 30 * 1000,
  },

  projects: [
    // Primary: Chromium only for weekly smoke tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Mobile viewport for responsive tests
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
      },
      // Only run tests tagged with @mobile
      grep: /@mobile/,
    },
  ],

  webServer: {
    command: process.env.CI ? 'pnpm start' : 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
