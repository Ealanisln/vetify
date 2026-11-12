/** Shared by playwright.config.ts, auth.setup.ts, specs and the fake services. */

export const E2E_PORT = Number(process.env.E2E_PORT ?? 3000);
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export const FAKE_SERVICES_PORT = Number(process.env.E2E_FAKE_SERVICES_PORT ?? 4455);
/** Must equal KINDE_ISSUER_URL and RESEND_BASE_URL in the app's env. */
export const FAKE_SERVICES_URL = `http://127.0.0.1:${FAKE_SERVICES_PORT}`;
export const TEST_AUTH_SECRET_HEADER = 'x-test-auth-secret';

export const AUTH_STATE_PATH = 'tests/.auth/user.json';

/** Seeded by scripts/seed-ci-test-data.ts as the owner of the CI clinic. */
export const SEEDED_OWNER = {
  sub: 'kp_e2e_test_user_ci',
  email: 'e2e-test@vetify-ci.com',
  given_name: 'E2E',
  family_name: 'Owner',
};
export const SEEDED_CLINIC_SLUG = 'ci-test-clinic';
