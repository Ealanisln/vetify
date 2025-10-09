import type { SupportedLanguage } from './types';
import { DEFAULT_LANGUAGE, SPANISH_VARIANT } from './config';

// Language configuration and utilities
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['es', 'en'];

// Language to locale mapping
export const LANGUAGE_TO_LOCALE: Record<SupportedLanguage, string> = {
  es: SPANISH_VARIANT,
  en: 'en-US',
};

// Locale to language mapping (for reverse lookup)
export const LOCALE_TO_LANGUAGE: Record<string, SupportedLanguage> = {
  'es-ES': 'es',
  'es-MX': 'es',
  'en-US': 'en',
};

// Language names in their native form
export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  es: 'Español',
  en: 'English',
};

// Get locale string for a language
export function getLocaleForLanguage(lang: SupportedLanguage): string {
  return LANGUAGE_TO_LOCALE[lang];
}

// Get language from locale string
export function getLanguageFromLocale(locale: string): SupportedLanguage {
  return LOCALE_TO_LANGUAGE[locale] || DEFAULT_LANGUAGE;
}

// Check if language is supported
export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

// Get alternate language URL
export function getAlternateLanguageUrl(
  currentPath: string,
  targetLang: SupportedLanguage,
  baseUrl: string
): string {
  // Currently we only support Spanish, but structure is ready for /en prefix
  if (targetLang === 'es') {
    return `${baseUrl}${currentPath}`;
  }

  // Future: when English is added, prefix with /en
  // return `${baseUrl}/en${currentPath}`;
  return `${baseUrl}${currentPath}`;
}

// Parse language from path (for future multi-language routing)
export function getLanguageFromPath(path: string): SupportedLanguage {
  // Currently all paths are Spanish
  // Future: check for /en prefix
  const match = path.match(/^\/(en|es)(\/|$)/);
  if (match && isSupportedLanguage(match[1])) {
    return match[1];
  }
  return DEFAULT_LANGUAGE;
}

// Remove language prefix from path (for canonical URLs)
export function removeLanguagePrefix(path: string): string {
  return path.replace(/^\/(en|es)(\/|$)/, '/');
}

// Get localized content based on current language
export function getLocalizedContent<T>(
  content: { es: T; en?: T },
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): T {
  return content[lang] || content.es;
}
