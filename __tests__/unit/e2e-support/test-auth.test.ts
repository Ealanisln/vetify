/**
 * @jest-environment node
 */
import { createPublicKey, createVerify } from 'node:crypto';
import {
  TEST_AUTH_MIN_SECRET_LENGTH,
  createTestAuthIssuer,
  getTestAuthBlockReason,
  hasValidTestAuthSecret,
} from '../../../tests/e2e/support/test-auth';

const SECRET = 'x'.repeat(TEST_AUTH_MIN_SECRET_LENGTH);

const allowedEnv = (overrides: Record<string, string | undefined> = {}) => ({
  TEST_AUTH_ENABLED: 'true',
  TEST_AUTH_SECRET: SECRET,
  ...overrides,
});

describe('getTestAuthBlockReason (guards)', () => {
  it('allows only when every guard passes', () => {
    expect(getTestAuthBlockReason(allowedEnv())).toBeNull();
  });

  describe('guard 1: TEST_AUTH_ENABLED must be exactly "true"', () => {
    it.each([undefined, '', 'false', '1', 'TRUE', 'yes'])('blocks when it is %p', (value) => {
      expect(getTestAuthBlockReason(allowedEnv({ TEST_AUTH_ENABLED: value }))).toMatch(/TEST_AUTH_ENABLED/);
    });
  });

  describe('guard 2: never on Vercel', () => {
    it.each(['production', 'preview', 'development'])('blocks when VERCEL_ENV is %p', (value) => {
      expect(getTestAuthBlockReason(allowedEnv({ VERCEL_ENV: value }))).toMatch(/Vercel/);
    });

    it('blocks when VERCEL is set (also present during Vercel builds)', () => {
      expect(getTestAuthBlockReason(allowedEnv({ VERCEL: '1' }))).toMatch(/Vercel/);
    });
  });

  describe('guard 3: TEST_AUTH_SECRET must be set and long enough', () => {
    it.each([undefined, '', 'short'])('blocks when it is %p', (value) => {
      expect(getTestAuthBlockReason(allowedEnv({ TEST_AUTH_SECRET: value }))).toMatch(/TEST_AUTH_SECRET/);
    });

    it('blocks a secret one character under the minimum', () => {
      const secret = 'x'.repeat(TEST_AUTH_MIN_SECRET_LENGTH - 1);
      expect(getTestAuthBlockReason(allowedEnv({ TEST_AUTH_SECRET: secret }))).toMatch(/TEST_AUTH_SECRET/);
    });
  });
});

describe('hasValidTestAuthSecret', () => {
  it('accepts the exact secret', () => {
    expect(hasValidTestAuthSecret(SECRET, allowedEnv())).toBe(true);
  });

  it.each([undefined, null, '', `${SECRET}x`, SECRET.slice(1), 'y'.repeat(SECRET.length)])(
    'rejects %p',
    (provided) => {
      expect(hasValidTestAuthSecret(provided, allowedEnv())).toBe(false);
    }
  );

  it('rejects even the right secret when another guard fails', () => {
    expect(hasValidTestAuthSecret(SECRET, allowedEnv({ VERCEL_ENV: 'preview' }))).toBe(false);
    expect(hasValidTestAuthSecret(SECRET, allowedEnv({ TEST_AUTH_ENABLED: 'false' }))).toBe(false);
  });
});

describe('createTestAuthIssuer', () => {
  const ISSUER = 'http://127.0.0.1:4455';

  it('refuses to start when a guard fails', () => {
    expect(() => createTestAuthIssuer(ISSUER, allowedEnv({ VERCEL_ENV: 'production' }))).toThrow(/Vercel/);
    expect(() => createTestAuthIssuer(ISSUER, allowedEnv({ TEST_AUTH_ENABLED: undefined }))).toThrow(
      /TEST_AUTH_ENABLED/
    );
    expect(() => createTestAuthIssuer(ISSUER, allowedEnv({ TEST_AUTH_SECRET: undefined }))).toThrow(
      /TEST_AUTH_SECRET/
    );
  });

  it('refuses a non-loopback issuer URL', () => {
    expect(() => createTestAuthIssuer('https://vetify.kinde.com', allowedEnv())).toThrow(/loopback/);
  });

  it('mints Kinde-shaped tokens signed by the published JWKS key', () => {
    const issuer = createTestAuthIssuer(ISSUER, allowedEnv());
    const { access_token, id_token } = issuer.mint({
      sub: 'kp_e2e_owner',
      email: 'owner@example.test',
      given_name: 'E2E',
      family_name: 'Owner',
    });

    const [jwk] = issuer.jwks().keys;
    expect(jwk).toMatchObject({ kty: 'RSA', use: 'sig', alg: 'RS256' });
    const publicKey = createPublicKey({ key: jwk, format: 'jwk' });

    for (const token of [access_token, id_token]) {
      const [header, payload, signature] = token.split('.');
      const verifier = createVerify('RSA-SHA256');
      verifier.update(`${header}.${payload}`);
      expect(verifier.verify(publicKey, Buffer.from(signature, 'base64url'))).toBe(true);

      expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toMatchObject({ alg: 'RS256', kid: jwk.kid });
      const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
      expect(claims).toMatchObject({ iss: ISSUER, sub: 'kp_e2e_owner' });
      expect(claims.exp).toBeGreaterThan(Date.now() / 1000);
    }

    const idClaims = JSON.parse(Buffer.from(id_token.split('.')[1], 'base64url').toString());
    expect(idClaims).toMatchObject({ email: 'owner@example.test', given_name: 'E2E', family_name: 'Owner' });
  });
});
