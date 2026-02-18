import { test as setup } from '@playwright/test';
// import { prisma } from './helpers/test-db'; // Will be needed when auth setup is fully implemented

/**
 * Playwright Auth Setup
 *
 * This setup creates a test session for E2E tests that require authentication.
 * It uses the test-auth bypass API (only available when NODE_ENV=test) to
 * create an authenticated session without going through the full OAuth flow.
 *
 * The authenticated state is saved to storageState and reused across tests.
 *
 * Prerequisites:
 * - TEST_AUTH_ENABLED=true environment variable
 * - Test user seeded in the database (via seed-ci-test-data.ts)
 * - /api/test-auth route available (NODE_ENV=test only)
 */

const TEST_USER = {
  email: 'e2e-test@vetify-ci.com',
  kindeId: 'kp_e2e_test_user_ci',
};

setup('authenticate', async ({ page }) => {
  // Skip if auth tests are not enabled
  if (process.env.TEST_AUTH_ENABLED !== 'true') {
    return;
  }

  // Use the test-auth bypass to create an authenticated session
  const response = await page.request.post('/api/test-auth', {
    data: {
      email: TEST_USER.email,
      kindeId: TEST_USER.kindeId,
    },
    headers: {
      'x-test-secret': process.env.TEST_AUTH_SECRET || 'ci-test-secret',
    },
  });

  if (response.ok()) {
    // Navigate to dashboard to establish cookies
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Save authenticated state
    await page.context().storageState({
      path: 'tests/.auth/user.json',
    });
  } else {
    console.warn(
      `Auth setup failed with status ${response.status()}. ` +
      'Ensure /api/test-auth route exists and TEST_AUTH_SECRET is set.'
    );
  }
});
