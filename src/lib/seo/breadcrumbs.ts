import { getBaseUrl } from './config';
import type { SupportedLanguage } from './types';

/**
 * Breadcrumb structured data types
 */
export interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item?: string;
}

export interface BreadcrumbSegment {
  name: string;
  path: string;
}

/**
 * Generate BreadcrumbList structured data
 * Helps search engines understand page hierarchy and display breadcrumbs in search results
 *
 * @param segments - Array of breadcrumb segments with name and path
 * @param lang - Language for localization (default: 'es')
 * @returns BreadcrumbList JSON-LD schema
 *
 * @example
 * ```ts
 * const breadcrumbs = generateBreadcrumbSchema([
 *   { name: 'Inicio', path: '/' },
 *   { name: 'Funcionalidades', path: '/funcionalidades' }
 * ]);
 * ```
 */
export function generateBreadcrumbSchema(
  segments: BreadcrumbSegment[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _lang: SupportedLanguage = 'es'
): BreadcrumbList {
  const baseUrl = getBaseUrl();

  const itemListElement: BreadcrumbItem[] = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;

    return {
      '@type': 'ListItem',
      position: index + 1,
      name: segment.name,
      // Don't include item URL for the last breadcrumb (current page)
      ...((!isLast) && { item: `${baseUrl}${segment.path}` }),
    };
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Common breadcrumb paths for Spanish
 * Use these to maintain consistency across pages
 */
export const COMMON_BREADCRUMBS_ES = {
  home: { name: 'Inicio', path: '/' },
  pricing: { name: 'Precios', path: '/precios' },
  features: { name: 'Funcionalidades', path: '/funcionalidades' },
  contact: { name: 'Contacto', path: '/contacto' },
  blog: { name: 'Blog', path: '/blog' },
  about: { name: 'Nosotros', path: '/nosotros' },
} as const;

/**
 * Common breadcrumb paths for English
 * Use these to maintain consistency across pages
 */
export const COMMON_BREADCRUMBS_EN = {
  home: { name: 'Home', path: '/' },
  pricing: { name: 'Pricing', path: '/pricing' },
  features: { name: 'Features', path: '/features' },
  contact: { name: 'Contact', path: '/contact' },
  blog: { name: 'Blog', path: '/blog' },
  about: { name: 'About', path: '/about' },
} as const;

/**
 * Get localized common breadcrumbs
 */
export function getCommonBreadcrumbs(lang: SupportedLanguage = 'es') {
  return lang === 'es' ? COMMON_BREADCRUMBS_ES : COMMON_BREADCRUMBS_EN;
}

/**
 * Helper to create breadcrumbs from path segments
 * Automatically generates breadcrumbs based on URL path
 *
 * @param path - Current page path (e.g., '/funcionalidades')
 * @param pageTitle - Title of the current page
 * @param lang - Language for localization
 * @returns BreadcrumbList schema
 *
 * @example
 * ```ts
 * // For /funcionalidades page
 * const breadcrumbs = createBreadcrumbsFromPath(
 *   '/funcionalidades',
 *   'Funcionalidades',
 *   'es'
 * );
 * // Results in: Inicio > Funcionalidades
 * ```
 */
export function createBreadcrumbsFromPath(
  path: string,
  pageTitle: string,
  lang: SupportedLanguage = 'es'
): BreadcrumbList {
  const commonBreadcrumbs = getCommonBreadcrumbs(lang);
  const segments: BreadcrumbSegment[] = [commonBreadcrumbs.home];

  // Remove leading/trailing slashes and split
  const pathParts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);

  // Build breadcrumb trail
  let currentPath = '';
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const isLast = index === pathParts.length - 1;

    // Use page title for the last segment, or capitalize part
    const name = isLast
      ? pageTitle
      : part.charAt(0).toUpperCase() + part.slice(1);

    segments.push({
      name,
      path: currentPath,
    });
  });

  return generateBreadcrumbSchema(segments, lang);
}
