/**
 * Single source of truth for the Content-Security-Policy header.
 *
 * Used by both next.config.js `headers()` (every route) and the middleware
 * `securityHeaders` (dashboard, onboarding, admin and API routes, where it
 * replaces the next.config value). Plain ESM JavaScript so next.config.js can
 * import it without a TypeScript loader.
 *
 * Browser-side origins only: server-to-server calls (Upstash, WhatsApp Graph
 * API) are not subject to CSP and do not belong here.
 */

const DEV_SERVER = 'http://localhost:*';

/**
 * @param {{ dev?: boolean }} [options] dev defaults to NODE_ENV !== 'production'
 * @returns {string}
 */
export function buildContentSecurityPolicy({ dev = process.env.NODE_ENV !== 'production' } = {}) {
  const devOnly = (...sources) => (dev ? sources : []);

  const directives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://js.stripe.com',
      'https://checkout.stripe.com',
      'https://m.stripe.network',
      'https://analytics.alanis.dev', // Umami
      'https://connect.facebook.net', // Meta Pixel fbevents.js
      ...devOnly(DEV_SERVER),
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    // https: covers the Meta Pixel noscript image (https://www.facebook.com/tr)
    'img-src': ["'self'", 'data:', 'blob:', 'https:', ...devOnly(DEV_SERVER)],
    'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.stripe.com',
      // TODO(glitchtip-cutover): remove the sentry.io hosts once prod DSN is confirmed on GlitchTip
      'https://*.sentry.io',
      'https://*.ingest.sentry.io',
      'https://glitchtip.alanis.dev',
      'https://analytics.alanis.dev', // Umami
      'https://www.facebook.com', // Meta Pixel events (/tr)
      'https://connect.facebook.net',
      ...devOnly(DEV_SERVER, 'ws://localhost:*'),
    ],
    'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, sources]) => `${name} ${sources.join(' ')}`);
  // Upgrading would break the plain-http local dev server.
  if (!dev) policy.push('upgrade-insecure-requests');

  return policy.join('; ');
}
