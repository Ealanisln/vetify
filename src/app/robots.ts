import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo/config';

/**
 * Generate robots.txt file
 * This tells search engines which pages they can and cannot crawl
 *
 * Next.js will automatically serve this at /robots.txt
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

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
