/**
 * The Jest setup must provide the same fake Stripe key CI uses when none is
 * set (fresh worktrees have no .env files), without overriding a real key.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { applyTestEnvDefaults, FAKE_STRIPE_SECRET_KEY } = require('../../../jest.env-defaults.cjs');

describe('applyTestEnvDefaults', () => {
  it('uses the CI fake key', () => {
    expect(FAKE_STRIPE_SECRET_KEY).toBe('sk_test_fake_key_for_ci');
  });

  it('sets the fake Stripe key when no key is configured', () => {
    const env: Record<string, string | undefined> = {};
    applyTestEnvDefaults(env);
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_fake_key_for_ci');
  });

  it('treats an empty key as missing', () => {
    const env: Record<string, string | undefined> = { STRIPE_SECRET_KEY: '' };
    applyTestEnvDefaults(env);
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_fake_key_for_ci');
  });

  it('never overrides a real STRIPE_SECRET_KEY', () => {
    const env: Record<string, string | undefined> = { STRIPE_SECRET_KEY: 'sk_test_real' };
    applyTestEnvDefaults(env);
    expect(env.STRIPE_SECRET_KEY).toBe('sk_test_real');
  });

  it('leaves STRIPE_SECRET_KEY unset when STRIPE_SECRET_KEY_LIVE is configured', () => {
    const env: Record<string, string | undefined> = { STRIPE_SECRET_KEY_LIVE: 'sk_live_real' };
    applyTestEnvDefaults(env);
    expect(env.STRIPE_SECRET_KEY).toBeUndefined();
    expect(env.STRIPE_SECRET_KEY_LIVE).toBe('sk_live_real');
  });

  it('is applied to process.env by the Jest setup', () => {
    expect(process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY_LIVE).toBeTruthy();
  });
});
