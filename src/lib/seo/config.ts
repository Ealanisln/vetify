import type { SiteMetadata, SupportedLanguage } from './types';

// Base URL configuration - use environment variable in production
export const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return 'http://localhost:3000';
};

// Default language configuration
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';
export const SPANISH_VARIANT: 'es-ES' | 'es-MX' = 'es-MX'; // Change to es-ES if targeting Spain

// Site metadata configuration
export const SITE_METADATA: SiteMetadata = {
  siteName: {
    es: 'Vetify - Software de Gestión Veterinaria',
    en: 'Vetify - Veterinary Management Software', // For future use
  },
  siteDescription: {
    es: 'Sistema integral de gestión para clínicas veterinarias. Administra citas, historiales médicos, inventario y más. Prueba gratis por 14 días.',
    en: 'Comprehensive management system for veterinary clinics. Manage appointments, medical records, inventory and more. Try free for 14 days.',
  },
  siteKeywords: {
    es: [
      'software veterinario',
      'gestión veterinaria',
      'clínica veterinaria',
      'sistema veterinario',
      'historia clínica veterinaria',
      'citas veterinarias',
      'inventario veterinario',
      'software para veterinarias',
      'gestión de clínicas',
      'veterinaria digital',
      'expediente clínico veterinario',
      'agenda veterinaria',
      'facturación veterinaria',
      'software médico veterinario',
      'SaaS veterinario',
    ],
    en: [
      'veterinary software',
      'veterinary management',
      'veterinary clinic',
      'veterinary system',
      'veterinary medical records',
      'veterinary appointments',
      'veterinary inventory',
      'vet clinic software',
      'practice management',
      'digital veterinary',
      'veterinary EMR',
      'vet scheduling',
      'veterinary billing',
      'veterinary medical software',
      'veterinary SaaS',
    ],
  },
  defaultOGImage: '/images/og/default-og-image.jpg',
  twitterHandle: '@vetify', // Update with actual Twitter handle
  locale: {
    default: DEFAULT_LANGUAGE,
    spanish: SPANISH_VARIANT,
  },
};

// Open Graph default configuration
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

// Twitter Card default configuration
export const TWITTER_IMAGE_WIDTH = 1200;
export const TWITTER_IMAGE_HEIGHT = 675;

// Common page metadata in Spanish (can be overridden per page)
export const PAGE_METADATA = {
  home: {
    title: {
      es: 'Vetify - Software de Gestión para Clínicas Veterinarias',
      en: 'Vetify - Management Software for Veterinary Clinics',
    },
    description: {
      es: 'Transforma tu clínica veterinaria con Vetify. Sistema completo para gestionar citas, historiales médicos, inventario y facturación. Prueba gratis 14 días.',
      en: 'Transform your veterinary clinic with Vetify. Complete system to manage appointments, medical records, inventory and billing. Try free for 14 days.',
    },
    keywords: {
      es: [
        'software veterinario México',
        'gestión clínica veterinaria',
        'sistema integral veterinario',
        'software para veterinarios',
        'prueba gratis',
      ],
    },
  },
  dashboard: {
    title: {
      es: 'Panel de Control - Vetify',
      en: 'Dashboard - Vetify',
    },
    description: {
      es: 'Administra tu clínica veterinaria desde un solo lugar. Control completo de citas, mascotas, historial médico e inventario.',
      en: 'Manage your veterinary clinic from one place. Complete control of appointments, pets, medical history and inventory.',
    },
  },
  pricing: {
    title: {
      es: 'Precios y Planes - Vetify',
      en: 'Pricing & Plans - Vetify',
    },
    description: {
      es: 'Planes accesibles para clínicas veterinarias de todos los tamaños. Desde pequeñas consultas hasta grandes hospitales veterinarios. Prueba gratis 14 días.',
      en: 'Affordable plans for veterinary clinics of all sizes. From small practices to large veterinary hospitals. Try free for 14 days.',
    },
  },
  features: {
    title: {
      es: 'Funcionalidades - Software Veterinario Vetify',
      en: 'Features - Vetify Veterinary Software',
    },
    description: {
      es: 'Descubre todas las funcionalidades de Vetify: gestión de citas, historiales médicos digitales, inventario inteligente, facturación automatizada y más.',
      en: 'Discover all Vetify features: appointment management, digital medical records, smart inventory, automated billing and more.',
    },
  },
} as const;

// Robots meta configuration
export const ROBOTS_CONFIG = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-video-preview': -1,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
} as const;
