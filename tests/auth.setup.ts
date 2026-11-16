import { test as setup, expect, type Page } from '@playwright/test';
import {
  AUTH_STATE_PATH,
  CORPORATIVO_AUTH_STATE_PATH,
  FAKE_SERVICES_URL,
  SEEDED_CORPORATIVO_OWNER,
  SEEDED_OWNER,
  SEEDED_VET,
  TEST_AUTH_SECRET_HEADER,
  VET_AUTH_STATE_PATH,
} from './e2e/support/constants';
import type { TestAuthUser } from './e2e/support/test-auth';

/**
 * Logs in as each seeded user and saves one session per user for the desktop
 * projects (playwright.config.ts only adds this project when
 * TEST_AUTH_ENABLED=true). The owner's session is the default storageState;
 * specs opt into the others with test.use({ storageState }).
 *
 * The fake Kinde issuer (tests/e2e/support/fake-services.ts) mints the
 * access_token and id_token cookies Kinde would set after a real login. The
 * app validates them against the issuer's JWKS, as it does in production.
 *
 * Prerequisites: scripts/seed-ci-test-data.ts has run, and the app runs with
 * KINDE_ISSUER_URL and RESEND_BASE_URL pointing at FAKE_SERVICES_URL.
 */
async function logIn(page: Page, baseURL: string, user: TestAuthUser) {
  const response = await page.request.post(`${FAKE_SERVICES_URL}/test-auth/token`, {
    data: user,
    headers: { [TEST_AUTH_SECRET_HEADER]: process.env.TEST_AUTH_SECRET ?? '' },
  });
  expect(response.status(), 'fake issuer refused to mint a session').toBe(200);
  const { access_token, id_token } = await response.json();

  const cookie = { url: baseURL, httpOnly: true, sameSite: 'Lax' as const };
  await page.context().addCookies([
    { ...cookie, name: 'access_token', value: access_token },
    { ...cookie, name: 'id_token', value: id_token },
  ]);

  await page.goto('/dashboard');
  // A rejected session redirects to /api/auth/login (and on to the issuer)
  await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
}

const settingsLink = (page: Page) => page.locator('a[href="/dashboard/settings"]').filter({ visible: true });

setup('authenticate as the seeded clinic owner', async ({ page, baseURL }) => {
  await logIn(page, baseURL!, SEEDED_OWNER);
  // Only owners/managers see Configuración, so this also proves the role
  await expect(settingsLink(page).first()).toBeVisible();
  await page.context().storageState({ path: AUTH_STATE_PATH });
});

setup('authenticate as the seeded veterinarian', async ({ page, baseURL }) => {
  await logIn(page, baseURL!, SEEDED_VET);
  // Dashboard rendered, and no Configuración link: the session is not an admin
  await expect(page.getByRole('heading', { level: 1, name: /Hola, E2E/ })).toBeVisible();
  await expect(settingsLink(page)).toHaveCount(0);
  await page.context().storageState({ path: VET_AUTH_STATE_PATH });
});

setup('authenticate as the seeded CORPORATIVO clinic owner', async ({ page, baseURL }) => {
  await logIn(page, baseURL!, SEEDED_CORPORATIVO_OWNER);
  await expect(settingsLink(page).first()).toBeVisible();
  await page.context().storageState({ path: CORPORATIVO_AUTH_STATE_PATH });
});
