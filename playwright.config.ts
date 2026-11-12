import { defineConfig, devices } from '@playwright/test'
import {
  AUTH_STATE_PATH,
  E2E_BASE_URL,
  E2E_PORT,
  FAKE_SERVICES_URL,
} from './tests/e2e/support/constants'

const isCI = !!process.env.CI

/**
 * Authenticated runs (TEST_AUTH_ENABLED=true) start the fake Kinde/Resend
 * services, log in once in the `setup` project and reuse that session in the
 * desktop projects. See tests/e2e/support/test-auth.ts for the guards.
 */
const isAuthEnabled = process.env.TEST_AUTH_ENABLED === 'true'
const authenticated = isAuthEnabled
  ? { dependencies: ['setup'], use: { storageState: AUTH_STATE_PATH } }
  : { dependencies: [] as string[], use: {} }

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
  // Clean up test data after all tests complete (CI only)
  globalTeardown: isCI ? './tests/global-teardown.ts' : undefined,
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
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  /* Project configurations for different test types */
  projects: [
    // Logs in as the seeded clinic owner (authenticated runs only)
    ...(isAuthEnabled
      ? [{ name: 'setup', testMatch: /auth\.setup\.ts$/ }]
      : []),
    // Desktop browsers - E2E tests
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...authenticated.use },
      dependencies: authenticated.dependencies,
      testMatch: /e2e\/(?!mobile).*\.spec\.ts$/,
    },
    ...(isCI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'], ...authenticated.use },
            dependencies: authenticated.dependencies,
            testMatch: /e2e\/(?!mobile).*\.spec\.ts$/,
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'], ...authenticated.use },
            dependencies: authenticated.dependencies,
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

  webServer: [
    ...(isAuthEnabled
      ? [
          {
            command: 'npx --yes tsx tests/e2e/support/fake-services.ts',
            url: `${FAKE_SERVICES_URL}/health`,
            reuseExistingServer: false,
            timeout: 60 * 1000,
          },
        ]
      : []),
    {
      command: isCI ? 'pnpm start' : 'pnpm dev',
      url: E2E_BASE_URL,
      env: { PORT: String(E2E_PORT) },
      reuseExistingServer: !isCI,
      timeout: 120 * 1000,
    },
  ],
})
