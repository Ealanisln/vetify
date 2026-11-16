/** Shared by playwright.config.ts, auth.setup.ts, specs and the fake services. */

export const E2E_PORT = Number(process.env.E2E_PORT ?? 3000);
export const E2E_BASE_URL = `http://localhost:${E2E_PORT}`;

export const FAKE_SERVICES_PORT = Number(process.env.E2E_FAKE_SERVICES_PORT ?? 4455);
/** Must equal KINDE_ISSUER_URL and RESEND_BASE_URL in the app's env. */
export const FAKE_SERVICES_URL = `http://127.0.0.1:${FAKE_SERVICES_PORT}`;
export const TEST_AUTH_SECRET_HEADER = 'x-test-auth-secret';

/** Session of SEEDED_OWNER; the default storageState of the desktop projects. */
export const AUTH_STATE_PATH = 'tests/.auth/user.json';
/** Session of SEEDED_VET. Opt in per describe with test.use({ storageState }). */
export const VET_AUTH_STATE_PATH = 'tests/.auth/vet.json';
/** Session of SEEDED_CORPORATIVO_OWNER. Opt in per describe with test.use({ storageState }). */
export const CORPORATIVO_AUTH_STATE_PATH = 'tests/.auth/corporativo.json';

/**
 * Users and clinics seeded by scripts/seed-ci-test-data.ts. Each `sub` is the
 * User id in the database and the Kinde `sub` the fake issuer puts in the token.
 */

/** Owner of the CI clinic (PROFESIONAL plan, in trial). Has the admin role. */
export const SEEDED_OWNER = {
  sub: 'kp_e2e_test_user_ci',
  email: 'e2e-test@vetify-ci.com',
  given_name: 'E2E',
  family_name: 'Owner',
};
export const SEEDED_CLINIC_SLUG = 'ci-test-clinic';

/** Veterinarian on the CI clinic: no admin role, not the owner, so no settings access. */
export const SEEDED_VET = {
  sub: 'kp_e2e_test_vet_ci',
  email: 'e2e-vet@vetify-ci.com',
  given_name: 'E2E',
  family_name: 'Vet',
};

/** Owner of a second clinic on the CORPORATIVO plan (API access). */
export const SEEDED_CORPORATIVO_OWNER = {
  sub: 'kp_e2e_corporativo_owner_ci',
  email: 'e2e-corporativo@vetify-ci.com',
  given_name: 'E2E',
  family_name: 'Corporativo',
};
export const SEEDED_CORPORATIVO_CLINIC_SLUG = 'ci-corporativo-clinic';
/** The CORPORATIVO clinic's only location, so the API key modal offers a location. */
export const SEEDED_CORPORATIVO_LOCATION_NAME = 'Sucursal Centro';
