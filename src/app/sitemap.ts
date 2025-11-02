import type { MetadataRoute } from 'next';
import { getBaseUrl } from '@/lib/seo/config';
import { SUPPORTED_LANGUAGES } from '@/lib/seo/language';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';

// Revalidate sitemap every hour to reduce database load from crawlers
export const revalidate = 3600;

/**
 * Generate sitemap.xml with static and dynamic routes
 * This helps search engines discover and index your pages
 *
 * Next.js will automatically serve this at /sitemap.xml
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const currentDate = new Date();
  const defaultLanguage = 'es'; // Current default language

  // Static pages configuration (using Spanish routes)
  const staticPages = [
    {
      path: '',
      priority: 1.0,
      changeFrequency: 'daily' as const,
    },
    {
      path: '/precios',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/funcionalidades',
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
    {
      path: '/contacto',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    // Add more static pages as needed
  ];

  // Generate sitemap entries for static pages
  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    // Alternate language URLs (currently only Spanish, ready for English)
    alternates: {
      languages: SUPPORTED_LANGUAGES.reduce(
        (acc, lang) => {
          if (lang === defaultLanguage) {
            acc[lang] = `${baseUrl}${page.path}`;
          }
          // Future: when English is added
          // else {
          //   acc[lang] = `${baseUrl}/${lang}${page.path}`;
          // }
          return acc;
        },
        {} as Record<string, string>
      ),
    },
  }));

  // Fetch dynamic clinic routes from database
  const clinicEntries = await fetchPublicClinicRoutes(baseUrl, defaultLanguage);

  // Combine all entries
  return [
    ...staticEntries,
    ...clinicEntries,
  ];
}

/**
 * Fetch public clinic pages for sitemap
 * Includes both main clinic pages and booking pages
 */
async function fetchPublicClinicRoutes(
  baseUrl: string,
  defaultLanguage: string
): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch all tenants with public pages enabled
    const publicClinics = await prisma.tenant.findMany({
      where: {
        publicPageEnabled: true,
        status: 'ACTIVE',
      },
      select: {
        slug: true,
        publicBookingEnabled: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const clinicRoutes: MetadataRoute.Sitemap = [];

    for (const clinic of publicClinics) {
      // Main clinic page
      clinicRoutes.push({
        url: `${baseUrl}/${clinic.slug}`,
        lastModified: clinic.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
        alternates: {
          languages: SUPPORTED_LANGUAGES.reduce(
            (acc, lang) => {
              if (lang === defaultLanguage) {
                acc[lang] = `${baseUrl}/${clinic.slug}`;
              }
              return acc;
            },
            {} as Record<string, string>
          ),
        },
      });

      // Booking page (if enabled)
      if (clinic.publicBookingEnabled) {
        clinicRoutes.push({
          url: `${baseUrl}/${clinic.slug}/agendar`,
          lastModified: clinic.updatedAt || new Date(),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: SUPPORTED_LANGUAGES.reduce(
              (acc, lang) => {
                if (lang === defaultLanguage) {
                  acc[lang] = `${baseUrl}/${clinic.slug}/agendar`;
                }
                return acc;
              },
              {} as Record<string, string>
            ),
          },
        });
      }
    }

    return clinicRoutes;
  } catch (error) {
    // Track error in Sentry with elevated severity for production monitoring
    Sentry.captureException(error, {
      level: 'error',
      tags: {
        context: 'sitemap-generation',
        critical: true,
        impact: 'seo',
      },
      extra: {
        message: 'Failed to fetch clinic routes for sitemap',
      },
    });

    // Log with CRITICAL prefix for visibility
    console.error('[CRITICAL] Sitemap clinic fetch failed:', error);

    // Throw in development to surface issues early
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }

    // Return empty array on error to prevent sitemap generation failure in production
    return [];
  }
}
