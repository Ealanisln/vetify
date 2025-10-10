// SEO configuration types for multi-language support
export type SupportedLanguage = 'es' | 'en';
export type SpanishVariant = 'es-ES' | 'es-MX';

export interface SEOImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  type?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: SEOImage;
  ogType?: 'website' | 'article' | 'product' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: SEOImage;
  structuredData?: object | object[];
  alternateLanguages?: { lang: SupportedLanguage; url: string }[];
}

export interface LocalizedContent {
  es: string;
  en?: string;
}

export interface SiteMetadata {
  siteName: LocalizedContent;
  siteDescription: LocalizedContent;
  siteKeywords: {
    es: string[];
    en?: string[];
  };
  defaultOGImage: string;
  twitterHandle?: string;
  locale: {
    default: SupportedLanguage;
    spanish: SpanishVariant;
  };
}

export interface PageMetadata {
  title: LocalizedContent;
  description: LocalizedContent;
  keywords?: {
    es: string[];
    en?: string[];
  };
  ogImage?: string;
}
