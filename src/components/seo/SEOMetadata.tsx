'use client';

import { useEffect } from 'react';
import type { SEOConfig, SupportedLanguage } from '@/lib/seo/types';

/**
 * Client-side SEO component for dynamic meta tag updates
 * Use this when you need to update meta tags on the client side
 * For most cases, prefer using Next.js Metadata API in page.tsx
 */
export function SEOMetadata({
  config,
  lang = 'es',
}: {
  config: SEOConfig;
  lang?: SupportedLanguage;
}) {
  useEffect(() => {
    // Update document title
    if (config.title) {
      document.title = config.title;
    }

    // Update meta description
    updateMetaTag('name', 'description', config.description);

    // Update keywords
    if (config.keywords) {
      updateMetaTag('name', 'keywords', config.keywords.join(', '));
    }

    // Update OG tags
    if (config.ogTitle) {
      updateMetaTag('property', 'og:title', config.ogTitle);
    }
    if (config.ogDescription) {
      updateMetaTag('property', 'og:description', config.ogDescription);
    }
    if (config.ogImage) {
      updateMetaTag('property', 'og:image', config.ogImage.url);
    }
    if (config.ogType) {
      updateMetaTag('property', 'og:type', config.ogType);
    }

    // Update Twitter Card tags
    if (config.twitterCard) {
      updateMetaTag('name', 'twitter:card', config.twitterCard);
    }
    if (config.twitterTitle) {
      updateMetaTag('name', 'twitter:title', config.twitterTitle);
    }
    if (config.twitterDescription) {
      updateMetaTag('name', 'twitter:description', config.twitterDescription);
    }
    if (config.twitterImage) {
      updateMetaTag('name', 'twitter:image', config.twitterImage.url);
    }

    // Update canonical link
    if (config.canonical) {
      updateLinkTag('canonical', config.canonical);
    }

    // Update robots meta
    const robotsContent = [
      config.noindex ? 'noindex' : 'index',
      config.nofollow ? 'nofollow' : 'follow',
    ].join(', ');
    updateMetaTag('name', 'robots', robotsContent);
  }, [config, lang]);

  return null; // This is a utility component with no visual output
}

/**
 * Helper function to update or create meta tags
 */
function updateMetaTag(
  attribute: 'name' | 'property',
  value: string,
  content: string
) {
  let element = document.querySelector(
    `meta[${attribute}="${value}"]`
  ) as HTMLMetaElement;

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, value);
    document.head.appendChild(element);
  }

  element.content = content;
}

/**
 * Helper function to update or create link tags
 */
function updateLinkTag(rel: string, href: string) {
  let element = document.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement;

  if (!element) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.appendChild(element);
  }

  element.href = href;
}

/**
 * Hook to dynamically update page title
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * Hook to dynamically update meta description
 */
export function useMetaDescription(description: string) {
  useEffect(() => {
    updateMetaTag('name', 'description', description);
  }, [description]);
}
