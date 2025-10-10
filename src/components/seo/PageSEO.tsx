import type { Metadata } from 'next';
import type { SEOConfig, SupportedLanguage } from '@/lib/seo/types';
import { generateMetadata } from '@/lib/seo/metadata';
import { StructuredData } from './StructuredData';

/**
 * Server component wrapper for SEO configuration
 * Use this in your page.tsx files to easily add SEO metadata
 *
 * Example:
 * ```tsx
 * import { PageSEO } from '@/components/seo/PageSEO';
 *
 * export const metadata = PageSEO.generateMetadata({
 *   title: 'Título de la página',
 *   description: 'Descripción de la página',
 *   keywords: ['palabra clave 1', 'palabra clave 2'],
 * });
 * ```
 */
export class PageSEO {
  /**
   * Generate metadata for a page
   */
  static generateMetadata(
    config: SEOConfig,
    lang: SupportedLanguage = 'es'
  ): Metadata {
    return generateMetadata(config, lang);
  }

  /**
   * Create a structured data script component
   */
  static StructuredData = StructuredData;
}

export { StructuredData };
