/**
 * Content-Security-Policy single source of truth.
 *
 * Regression: the middleware (`securityHeaders`) and next.config.js each built
 * their own CSP string and drifted apart. Pages behind the middleware enforced
 * a connect-src without https://www.facebook.com, so Meta Pixel events to
 * https://www.facebook.com/tr/ were blocked and ad attribution broke.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildContentSecurityPolicy } from '@/lib/security/content-security-policy';
import { securityHeaders } from '@/lib/security/input-sanitization';

function directives(policy: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const part of policy.split(';')) {
    const [name, ...sources] = part.trim().split(/\s+/);
    if (name) map.set(name, sources);
  }
  return map;
}

describe('Content-Security-Policy', () => {
  const production = directives(buildContentSecurityPolicy({ dev: false }));
  const development = directives(buildContentSecurityPolicy({ dev: true }));

  it('lets Meta Pixel send events (connect-src)', () => {
    for (const policy of [production, development]) {
      expect(policy.get('connect-src')).toEqual(
        expect.arrayContaining(['https://www.facebook.com', 'https://connect.facebook.net'])
      );
    }
  });

  it('lets the Meta Pixel script and noscript image load', () => {
    expect(production.get('script-src')).toContain('https://connect.facebook.net');
    // https: already covers the https://www.facebook.com/tr noscript pixel
    expect(production.get('img-src')).toContain('https:');
  });

  it('keeps the browser-side services the app relies on', () => {
    expect(production.get('connect-src')).toEqual(
      expect.arrayContaining([
        "'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://*.stripe.com',
        'https://*.sentry.io',
        'https://glitchtip.alanis.dev',
        'https://analytics.alanis.dev',
      ])
    );
    expect(production.get('script-src')).toEqual(
      expect.arrayContaining(['https://js.stripe.com', 'https://analytics.alanis.dev'])
    );
  });

  it('keeps the hardening directives', () => {
    expect(production.get('default-src')).toEqual(["'self'"]);
    expect(production.get('object-src')).toEqual(["'none'"]);
    expect(production.get('base-uri')).toEqual(["'self'"]);
    expect(production.get('form-action')).toEqual(["'self'"]);
    expect(production.get('frame-ancestors')).toEqual(["'none'"]);
    expect(production.has('upgrade-insecure-requests')).toBe(true);
  });

  it('never allows a bare wildcard or localhost in production', () => {
    for (const [, sources] of production) {
      expect(sources).not.toContain('*');
      expect(sources.join(' ')).not.toContain('localhost');
    }
  });

  it('allows the local dev server only in development', () => {
    expect(development.get('connect-src')).toEqual(
      expect.arrayContaining(['http://localhost:*', 'ws://localhost:*'])
    );
    expect(development.has('upgrade-insecure-requests')).toBe(false);
  });

  it('is the policy the middleware sends', () => {
    expect(securityHeaders['Content-Security-Policy']).toBe(buildContentSecurityPolicy());
  });

  it('is the policy next.config.js sends (no inline copy to drift)', () => {
    const nextConfig = readFileSync(join(process.cwd(), 'next.config.js'), 'utf-8');
    expect(nextConfig).toContain('buildContentSecurityPolicy');
    expect(nextConfig).not.toMatch(/connect-src|script-src 'self'/);
  });
});
