/**
 * @jest-environment node
 *
 * Links in emails and server redirects must point at the canonical public
 * host. Production is https://www.vetify.pro (the apex redirects there), so a
 * missing env var must never send people to localhost or the apex.
 */
import { getAppUrl, PRODUCTION_APP_URL } from '@/lib/app-url';

const KEYS = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_BASE_URL', 'VERCEL_ENV', 'VERCEL_URL', 'NODE_ENV'] as const;

describe('getAppUrl', () => {
  const originalEnv = process.env;

  function setEnv(values: Partial<Record<(typeof KEYS)[number], string>>) {
    const env: Record<string, string | undefined> = { ...originalEnv };
    for (const key of KEYS) delete env[key];
    process.env = { ...env, ...values } as NodeJS.ProcessEnv;
  }

  afterEach(() => {
    process.env = originalEnv;
  });

  it('is the www host', () => {
    expect(PRODUCTION_APP_URL).toBe('https://www.vetify.pro');
  });

  it('uses NEXT_PUBLIC_APP_URL when set, so local dev keeps working', () => {
    setEnv({ NEXT_PUBLIC_APP_URL: 'http://localhost:3000', NODE_ENV: 'development' });
    expect(getAppUrl()).toBe('http://localhost:3000');
  });

  it('prefers NEXT_PUBLIC_APP_URL over NEXT_PUBLIC_BASE_URL', () => {
    setEnv({
      NEXT_PUBLIC_APP_URL: 'https://www.vetify.pro',
      NEXT_PUBLIC_BASE_URL: 'https://vetify.pro',
      NODE_ENV: 'production',
    });
    expect(getAppUrl()).toBe('https://www.vetify.pro');
  });

  it('falls back to NEXT_PUBLIC_BASE_URL', () => {
    setEnv({ NEXT_PUBLIC_BASE_URL: 'https://development.vetify.pro', NODE_ENV: 'production' });
    expect(getAppUrl()).toBe('https://development.vetify.pro');
  });

  it('strips whitespace and trailing slashes', () => {
    setEnv({ NEXT_PUBLIC_APP_URL: ' https://www.vetify.pro/ ', NODE_ENV: 'production' });
    expect(getAppUrl()).toBe('https://www.vetify.pro');
  });

  it('ignores an empty variable', () => {
    setEnv({ NEXT_PUBLIC_APP_URL: '', NODE_ENV: 'production' });
    expect(getAppUrl()).toBe('https://www.vetify.pro');
  });

  it('falls back to www in production, never to localhost or the apex', () => {
    setEnv({ NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL_URL: 'vetify-prod-abc.vercel.app' });
    expect(getAppUrl()).toBe('https://www.vetify.pro');
  });

  it('uses the deployment URL on a Vercel preview', () => {
    setEnv({ NODE_ENV: 'production', VERCEL_ENV: 'preview', VERCEL_URL: 'vetify-git-x.vercel.app' });
    expect(getAppUrl()).toBe('https://vetify-git-x.vercel.app');
  });

  it('falls back to localhost outside production', () => {
    setEnv({ NODE_ENV: 'development' });
    expect(getAppUrl()).toBe('http://localhost:3000');
  });
});
