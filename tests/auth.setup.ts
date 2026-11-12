import { test as setup, expect } from '@playwright/test';
import {
  AUTH_STATE_PATH,
  FAKE_SERVICES_URL,
  SEEDED_OWNER,
  TEST_AUTH_SECRET_HEADER,
} from './e2e/support/constants';

/**
 * Logs in as the seeded clinic owner and saves the session for the desktop
 * projects (playwright.config.ts only adds this project when
 * TEST_AUTH_ENABLED=true).
 *
 * The fake Kinde issuer (tests/e2e/support/fake-services.ts) mints the
 * access_token and id_token cookies Kinde would set after a real login. The
 * app validates them against the issuer's JWKS, as it does in production.
 *
 * Prerequisites: scripts/seed-ci-test-data.ts has run, and the app runs with
 * KINDE_ISSUER_URL and RESEND_BASE_URL pointing at FAKE_SERVICES_URL.
 */
setup('authenticate as the seeded clinic owner', async ({ page, baseURL }) => {
  const response = await page.request.post(`${FAKE_SERVICES_URL}/test-auth/token`, {
    data: SEEDED_OWNER,
    headers: { [TEST_AUTH_SECRET_HEADER]: process.env.TEST_AUTH_SECRET ?? '' },
  });
  expect(response.status(), 'fake issuer refused to mint a session').toBe(200);
  const { access_token, id_token } = await response.json();

  const cookie = { url: baseURL!, httpOnly: true, sameSite: 'Lax' as const };
  await page.context().addCookies([
    { ...cookie, name: 'access_token', value: access_token },
    { ...cookie, name: 'id_token', value: id_token },
  ]);

  await page.goto('/dashboard');
  // A rejected session redirects to /api/auth/login (and on to the issuer)
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  // Only owners/managers see Configuración, so this also proves the role
  await expect(page.locator('a[href="/dashboard/settings"]').filter({ visible: true }).first()).toBeVisible();

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
