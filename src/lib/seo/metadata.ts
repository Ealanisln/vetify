import type { Metadata } from 'next';
import type { SEOConfig, SupportedLanguage } from './types';
import {
  SITE_METADATA,
  getBaseUrl,
  OG_IMAGE_WIDTH,
  OG_IMAGE_HEIGHT,
  ROBOTS_CONFIG,
} from './config';
import { getLocaleForLanguage, getLocalizedContent } from './language';

/**
 * Generate Next.js metadata object from SEO configuration
 * Language-aware metadata generation with Spanish as default
 */
export function generateMetadata(
  config: SEOConfig,
  lang: SupportedLanguage = 'es'
): Metadata {
  const baseUrl = getBaseUrl();
  const locale = getLocaleForLanguage(lang);
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);

  // Build full title with site name
  const fullTitle = config.title
    ? `${config.title} | ${siteName}`
    : siteName;

  // Determine OG image
  const ogImageUrl = config.ogImage?.url || SITE_METADATA.defaultOGImage;
  const fullOgImageUrl = ogImageUrl.startsWith('http')
    ? ogImageUrl
    : `${baseUrl}${ogImageUrl}`;

  // Build metadata object
  const metadata: Metadata = {
    title: fullTitle,
    description: config.description,
    keywords: config.keywords,

    // Robots configuration
    robots: {
      index: !config.noindex,
      follow: !config.nofollow,
      ...ROBOTS_CONFIG.googleBot,
    },

    // Open Graph
    openGraph: {
      type: config.ogType || 'website',
      locale,
      siteName,
      title: config.ogTitle || config.title,
      description: config.ogDescription || config.description,
      url: config.canonical || baseUrl,
      images: [
        {
          url: fullOgImageUrl,
          width: config.ogImage?.width || OG_IMAGE_WIDTH,
          height: config.ogImage?.height || OG_IMAGE_HEIGHT,
          alt: config.ogImage?.alt || config.title,
          type: config.ogImage?.type || 'image/png',
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: config.twitterCard || 'summary_large_image',
      site: SITE_METADATA.twitterHandle,
      title: config.twitterTitle || config.title,
      description: config.twitterDescription || config.description,
      images: config.twitterImage
        ? [
            {
              url: config.twitterImage.url.startsWith('http')
                ? config.twitterImage.url
                : `${baseUrl}${config.twitterImage.url}`,
              alt: config.twitterImage.alt,
            },
          ]
        : [fullOgImageUrl],
    },

    // Canonical URL
    alternates: {
      canonical: config.canonical,
      languages: config.alternateLanguages?.reduce(
        (acc, alt) => {
          acc[alt.lang] = alt.url;
          return acc;
        },
        {} as Record<string, string>
      ),
    },

    // Additional metadata
    metadataBase: new URL(baseUrl),
  };

  return metadata;
}

/**
 * Create SEO configuration for home page
 */
export function createHomePageSEO(
  lang: SupportedLanguage = 'es'
): SEOConfig {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const siteDescription = getLocalizedContent(SITE_METADATA.siteDescription, lang);
  const keywords = SITE_METADATA.siteKeywords[lang] || SITE_METADATA.siteKeywords.es;

  return {
    title: siteName,
    description: siteDescription,
    keywords,
    canonical: baseUrl,
    ogTitle: siteName,
    ogDescription: siteDescription,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Create SEO configuration for a standard page
 */
export function createPageSEO(
  title: string,
  description: string,
  options: {
    keywords?: string[];
    path?: string;
    ogImage?: string;
    noindex?: boolean;
    lang?: SupportedLanguage;
  } = {}
): SEOConfig {
  const baseUrl = getBaseUrl();
  const canonical = options.path ? `${baseUrl}${options.path}` : undefined;

  return {
    title,
    description,
    keywords: options.keywords,
    canonical,
    noindex: options.noindex,
    ogTitle: title,
    ogDescription: description,
    ogType: 'website',
    ogImage: options.ogImage
      ? {
          url: options.ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: title,
        }
      : undefined,
    twitterCard: 'summary_large_image',
  };
}

/**
 * Create SEO configuration for article/blog pages
 */
export function createArticleSEO(
  title: string,
  description: string,
  options: {
    path?: string;
    keywords?: string[];
    ogImage?: string;
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    lang?: SupportedLanguage;
  } = {}
): SEOConfig {
  const baseUrl = getBaseUrl();
  const canonical = options.path ? `${baseUrl}${options.path}` : undefined;

  return {
    title,
    description,
    keywords: options.keywords,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogType: 'article',
    ogImage: options.ogImage
      ? {
          url: options.ogImage,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: title,
        }
      : undefined,
    twitterCard: 'summary_large_image',
  };
}

/**
 * Get current language from request or default
 * Can be extended to read from cookies, headers, or URL
 */
export function getCurrentLanguage(): SupportedLanguage {
  // Currently always return Spanish
  // Future: implement language detection from cookies/headers
  return 'es';
}
