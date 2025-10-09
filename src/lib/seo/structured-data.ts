import type { SupportedLanguage } from './types';
import { getBaseUrl, SITE_METADATA } from './config';
import { getLocalizedContent, getLocaleForLanguage } from './language';

/**
 * JSON-LD Structured Data Types
 */

export interface Organization {
  '@context': 'https://schema.org';
  '@type': 'Organization' | 'MedicalOrganization';
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: ContactPoint[];
  address?: PostalAddress;
  sameAs?: string[];
}

export interface SoftwareApplication {
  '@context': 'https://schema.org';
  '@type': 'SoftwareApplication';
  name: string;
  applicationCategory: string;
  operatingSystem?: string;
  offers?: Offer;
  aggregateRating?: AggregateRating;
  description: string;
  url: string;
  inLanguage: string;
}

export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  contactType: string;
  email?: string;
  availableLanguage: string[];
}

export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry: string;
}

export interface Offer {
  '@type': 'Offer';
  price: string;
  priceCurrency: string;
  availability?: string;
  priceValidUntil?: string;
}

export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: string;
  reviewCount: string;
  bestRating?: string;
  worstRating?: string;
}

export interface WebPage {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  inLanguage: string;
  isPartOf: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
}

export interface Article {
  '@context': 'https://schema.org';
  '@type': 'Article' | 'BlogPosting' | 'NewsArticle';
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    '@type': 'Person' | 'Organization';
    name: string;
  };
  publisher: {
    '@type': 'Organization';
    name: string;
    logo?: {
      '@type': 'ImageObject';
      url: string;
    };
  };
  inLanguage: string;
}

/**
 * Generate organization structured data for veterinary SaaS
 */
export function generateOrganizationSchema(
  lang: SupportedLanguage = 'es',
  options: {
    includeAddress?: boolean;
    socialLinks?: string[];
  } = {}
): Organization {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const description = getLocalizedContent(SITE_METADATA.siteDescription, lang);

  const schema: Organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: baseUrl,
    logo: `${baseUrl}/images/logo.png`,
    description,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: lang === 'es' ? 'Atención al Cliente' : 'Customer Service',
        email: 'contacto@vetify.com', // Update with actual email
        availableLanguage: ['Spanish', 'English'],
      },
    ],
  };

  if (options.includeAddress) {
    schema.address = {
      '@type': 'PostalAddress',
      addressCountry: 'MX', // Update based on your business location
    };
  }

  if (options.socialLinks && options.socialLinks.length > 0) {
    schema.sameAs = options.socialLinks;
  }

  return schema;
}

/**
 * Generate SoftwareApplication structured data for the SaaS product
 */
export function generateSoftwareApplicationSchema(
  lang: SupportedLanguage = 'es',
  options: {
    price?: string;
    priceCurrency?: string;
    rating?: { value: string; count: string };
  } = {}
): SoftwareApplication {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const description = getLocalizedContent(SITE_METADATA.siteDescription, lang);
  const locale = getLocaleForLanguage(lang);

  const schema: SoftwareApplication = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: siteName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    description,
    url: baseUrl,
    inLanguage: locale,
  };

  if (options.price) {
    schema.offers = {
      '@type': 'Offer',
      price: options.price,
      priceCurrency: options.priceCurrency || 'MXN',
      availability: 'https://schema.org/InStock',
    };
  }

  if (options.rating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: options.rating.value,
      reviewCount: options.rating.count,
      bestRating: '5',
      worstRating: '1',
    };
  }

  return schema;
}

/**
 * Generate WebPage structured data
 */
export function generateWebPageSchema(
  title: string,
  description: string,
  url: string,
  lang: SupportedLanguage = 'es'
): WebPage {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const locale = getLocaleForLanguage(lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    inLanguage: locale,
    isPartOf: {
      '@type': 'WebSite',
      name: siteName,
      url: baseUrl,
    },
  };
}

/**
 * Generate Article structured data for blog posts
 */
export function generateArticleSchema(
  title: string,
  description: string,
  url: string,
  publishedDate: string,
  options: {
    modifiedDate?: string;
    image?: string;
    authorName?: string;
    lang?: SupportedLanguage;
  } = {}
): Article {
  const lang = options.lang || 'es';
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const locale = getLocaleForLanguage(lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: options.image,
    datePublished: publishedDate,
    dateModified: options.modifiedDate || publishedDate,
    author: {
      '@type': 'Person',
      name: options.authorName || 'Vetify',
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/logo.png`,
      },
    },
    inLanguage: locale,
  };
}

/**
 * Generate Medical/Healthcare specific structured data
 */
export function generateMedicalOrganizationSchema(
  lang: SupportedLanguage = 'es'
): Organization {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    name: siteName,
    url: baseUrl,
    description:
      lang === 'es'
        ? 'Plataforma tecnológica para la gestión integral de clínicas veterinarias'
        : 'Technology platform for comprehensive veterinary clinic management',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType:
          lang === 'es' ? 'Soporte Técnico' : 'Technical Support',
        email: 'soporte@vetify.com', // Update with actual email
        availableLanguage: ['Spanish', 'English'],
      },
    ],
  };
}

/**
 * Combine multiple structured data schemas
 */
export function combineSchemas(
  ...schemas: (Organization | SoftwareApplication | WebPage | Article)[]
): string {
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);
}

type StructuredDataType =
  | Organization
  | SoftwareApplication
  | WebPage
  | Article
  | Organization[]
  | SoftwareApplication[]
  | WebPage[]
  | Article[];

/**
 * Convert structured data to JSON string for script tag
 * Use this with the StructuredData component from @/components/seo/StructuredData
 */
export function toStructuredDataString(
  data: StructuredDataType
): string {
  return JSON.stringify(data);
}
