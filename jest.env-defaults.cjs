// Environment defaults for Jest, mirroring what CI sets in .github/workflows.
// Fresh worktrees have no .env files, and src/lib/payments/stripe.ts throws on
// import without a Stripe key. A real key (from the shell or .env files loaded
// by next/jest) always wins.

const FAKE_STRIPE_SECRET_KEY = 'sk_test_fake_key_for_ci';

function applyTestEnvDefaults(env) {
  if (!env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY_LIVE) {
    env.STRIPE_SECRET_KEY = FAKE_STRIPE_SECRET_KEY;
  }
}

applyTestEnvDefaults(process.env);

module.exports = { applyTestEnvDefaults, FAKE_STRIPE_SECRET_KEY };
