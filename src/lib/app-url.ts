/**
 * Public base URL of the app, for links in emails and server-side redirects.
 *
 * Production lives at https://www.vetify.pro; the apex redirects there, so
 * links must never fall back to the apex (one extra hop, and it breaks exact
 * URL allowlists such as Kinde's) or to localhost.
 */
export const PRODUCTION_APP_URL = 'https://www.vetify.pro';

const LOCAL_APP_URL = 'http://localhost:3000';

function fromEnv(value: string | undefined): string | null {
  const trimmed = value?.trim().replace(/\/+$/, '');
  return trimmed ? trimmed : null;
}

/**
 * NEXT_PUBLIC_APP_URL, then NEXT_PUBLIC_BASE_URL. Without either: the
 * deployment URL on a Vercel preview, localhost outside production, and the
 * www host in production.
 */
export function getAppUrl(): string {
  const configured =
    fromEnv(process.env.NEXT_PUBLIC_APP_URL) ?? fromEnv(process.env.NEXT_PUBLIC_BASE_URL);
  if (configured) return configured;

  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (process.env.NODE_ENV !== 'production') return LOCAL_APP_URL;

  return PRODUCTION_APP_URL;
}
