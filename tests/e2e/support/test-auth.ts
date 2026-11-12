/**
 * E2E test session: a fake Kinde issuer for Playwright.
 *
 * The app validates Kinde session cookies (access_token, id_token) by fetching
 * `${KINDE_ISSUER_URL}/.well-known/jwks.json` and checking the token's `iss`.
 * In the E2E CI job, KINDE_ISSUER_URL points at this fake issuer on loopback,
 * so tokens it signs with an in-memory key are accepted. No app code changes:
 * on Vercel KINDE_ISSUER_URL is the real Kinde domain and these tokens fail
 * signature and issuer checks.
 *
 * This module lives under tests/ and is never imported by the app bundle.
 * It still refuses to run unless every guard in getTestAuthBlockReason passes.
 */
import { createSign, generateKeyPairSync, randomUUID, timingSafeEqual } from 'node:crypto';

export const TEST_AUTH_MIN_SECRET_LENGTH = 32;

/** Matches Kinde's own session length closely enough for a test run. */
const TOKEN_TTL_SECONDS = 12 * 60 * 60;

type Env = Record<string, string | undefined>;

/**
 * Returns why the test session must stay off, or null when all guards pass:
 * 1. TEST_AUTH_ENABLED is exactly "true".
 * 2. Not on Vercel: VERCEL_ENV and VERCEL are both unset.
 * 3. TEST_AUTH_SECRET is set and at least TEST_AUTH_MIN_SECRET_LENGTH chars.
 */
export function getTestAuthBlockReason(env: Env = process.env): string | null {
  if (env.TEST_AUTH_ENABLED !== 'true') {
    return 'TEST_AUTH_ENABLED is not "true"';
  }
  if (env.VERCEL_ENV || env.VERCEL) {
    return 'running on Vercel (VERCEL_ENV or VERCEL is set)';
  }
  if (!env.TEST_AUTH_SECRET || env.TEST_AUTH_SECRET.length < TEST_AUTH_MIN_SECRET_LENGTH) {
    return `TEST_AUTH_SECRET must be at least ${TEST_AUTH_MIN_SECRET_LENGTH} characters`;
  }
  return null;
}

/** Constant-time check of a caller-provided secret; false whenever a guard fails. */
export function hasValidTestAuthSecret(provided: string | null | undefined, env: Env = process.env): boolean {
  if (getTestAuthBlockReason(env) !== null || !provided) return false;
  const expected = Buffer.from(env.TEST_AUTH_SECRET as string);
  const actual = Buffer.from(provided);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export interface TestAuthUser {
  sub: string;
  email: string;
  given_name?: string;
  family_name?: string;
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

/**
 * Creates the issuer: an ephemeral RSA key, its JWKS and a token minter.
 * Throws when a guard fails or the issuer URL is not loopback.
 */
export function createTestAuthIssuer(issuerUrl: string, env: Env = process.env) {
  const blockReason = getTestAuthBlockReason(env);
  if (blockReason) {
    throw new Error(`Test auth is disabled: ${blockReason}`);
  }
  if (!LOOPBACK_HOSTS.has(new URL(issuerUrl).hostname)) {
    throw new Error(`Test auth issuer must be a loopback URL, got ${issuerUrl}`);
  }

  const kid = `e2e-${randomUUID()}`;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid, use: 'sig', alg: 'RS256' };

  const sign = (claims: Record<string, unknown>) => {
    const unsigned = `${base64url({ alg: 'RS256', typ: 'JWT', kid })}.${base64url(claims)}`;
    const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey).toString('base64url');
    return `${unsigned}.${signature}`;
  };

  return {
    jwks: () => ({ keys: [jwk] }),
    mint(user: TestAuthUser) {
      const now = Math.floor(Date.now() / 1000);
      const common = { iss: issuerUrl, sub: user.sub, iat: now, exp: now + TOKEN_TTL_SECONDS, jti: randomUUID() };
      return {
        access_token: sign({ ...common, aud: [], scp: ['openid', 'profile', 'email'], permissions: [], roles: [] }),
        id_token: sign({
          ...common,
          aud: [env.KINDE_CLIENT_ID ?? 'e2e'],
          email: user.email,
          given_name: user.given_name,
          family_name: user.family_name,
        }),
      };
    },
  };
}
