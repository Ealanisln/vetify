/**
 * Slugs a clinic can't take. A clinic's public page lives at /{slug}, so a
 * slug equal to a static route (or a public asset folder) would be shadowed by
 * it. Keep in sync with the top-level folders in src/app — a unit test
 * (__tests__/unit/lib/tenant/reserved-slugs.test.ts) fails if one is missing.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // Top-level routes in src/app
  'acerca',
  'actions',
  'actualizaciones',
  'admin',
  'api',
  'contacto',
  'dashboard',
  'funcionalidades',
  'invite',
  'offline',
  'onboarding',
  'precios',
  'privacidad',
  'sentry-example-page',
  'setup',
  'sign-in',
  'sign-up',
  'test-whatsapp',
  // Public asset folders
  'clients',
  'favicon',
  'hero',
  'images',
  'logo',
  // Likely future routes and generic reserved words
  'about',
  'account',
  'app',
  'auth',
  'ayuda',
  'blog',
  'cuenta',
  'docs',
  'help',
  'login',
  'logout',
  'monitoring',
  'pricing',
  'public',
  'register',
  'registro',
  'settings',
  'soporte',
  'static',
  'support',
  'terminos',
  'vetify',
  'www',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
