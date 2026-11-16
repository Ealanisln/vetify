import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo/config';
import { PRODUCTION_APP_URL } from '@/lib/app-url';

// Hosts that serve production. The apex redirects to www, but either may be
// configured as the base URL.
const PRODUCTION_HOSTS = new Set(['https://vetify.pro', PRODUCTION_APP_URL]);

/**
 * Generate robots.txt file
 * This tells search engines which pages they can and cannot crawl
 *
 * Next.js will automatically serve this at /robots.txt
 *
 * IMPORTANT: Non-production domains (development, preview) are blocked
 * to prevent Google from indexing preview deployments that have
 * Vercel deployment protection enabled (which returns 401).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl().trim().replace(/\/+$/, '');

  // Block all crawling on non-production domains
  // This prevents 401 errors in Search Console from preview deployments
  const isProduction = PRODUCTION_HOSTS.has(baseUrl);

  if (!isProduction) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  // Production robots.txt - allow public pages, block private areas
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/', // Private dashboard area
          '/api/', // API routes
          '/admin/', // Admin area
          '/auth/', // Authentication routes
          '/*.json', // JSON files
          '/*?*', // Pages with query parameters (optional, remove if you want params indexed)
        ],
      },
      {
        userAgent: 'GPTBot', // OpenAI's crawler
        disallow: ['/'], // Disallow AI scraping (optional)
      },
      {
        userAgent: 'CCBot', // Common Crawl bot
        disallow: ['/'], // Disallow AI scraping (optional)
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
