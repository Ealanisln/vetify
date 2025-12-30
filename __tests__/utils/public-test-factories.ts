import type { PublicTenant, PublicHours, GalleryImage, PublicImages, PublicService, PublicSocialMedia } from '@/lib/tenant';
import type { ThemeId } from '@/lib/themes';

/**
 * Create a mock PublicTenant for testing public page components
 */
export function createMockPublicTenant(overrides: Partial<PublicTenant> = {}): PublicTenant {
  return {
    id: 'tenant-1',
    name: 'Test Veterinary Clinic',
    slug: 'test-clinic',
    logo: null,
    primaryColor: '#75a99c',
    secondaryColor: '#5a8a7d',
    publicPageEnabled: true,
    publicDescription: 'Your trusted veterinary care provider',
    publicPhone: '+52 55 1234 5678',
    publicEmail: 'contacto@testclinic.com',
    publicAddress: 'Av. Ejemplo 123, Col. Centro, CDMX',
    publicHours: createMockPublicHours(),
    publicServices: null,
    publicImages: null,
    publicSocialMedia: null,
    publicThemeColor: '#75a99c',
    publicTheme: 'modern' as ThemeId,
    publicBookingEnabled: true,
    createdAt: new Date('2024-01-01'),
    tenantSubscription: {
      id: 'sub-1',
      plan: {
        id: 'plan-1',
        name: 'Profesional',
      },
    },
    ...overrides,
  };
}

/**
 * Create a minimal PublicTenant with no optional fields
 */
export function createMinimalPublicTenant(overrides: Partial<PublicTenant> = {}): PublicTenant {
  return {
    id: 'tenant-minimal',
    name: 'Minimal Clinic',
    slug: 'minimal-clinic',
    logo: null,
    primaryColor: null,
    secondaryColor: null,
    publicPageEnabled: true,
    publicDescription: null,
    publicPhone: null,
    publicEmail: null,
    publicAddress: null,
    publicHours: null,
    publicServices: null,
    publicImages: null,
    publicSocialMedia: null,
    publicThemeColor: null,
    publicTheme: null,
    publicBookingEnabled: false,
    createdAt: new Date('2024-01-01'),
    tenantSubscription: null,
    ...overrides,
  };
}

/**
 * Create mock PublicHours for testing
 */
export function createMockPublicHours(overrides: Partial<PublicHours> = {}): PublicHours {
  return {
    weekdays: '9:00 - 18:00',
    saturday: '9:00 - 14:00',
    sunday: 'Cerrado',
    ...overrides,
  };
}

/**
 * Create a mock GalleryImage for testing
 */
export function createMockGalleryImage(overrides: Partial<GalleryImage> = {}): GalleryImage {
  const id = overrides.id || `gallery-${Math.random().toString(36).substr(2, 9)}`;
  return {
    id,
    url: `https://example.com/images/${id}.jpg`,
    publicId: `public-${id}`,
    category: 'instalaciones',
    caption: 'Test gallery image',
    order: 0,
    uploadedAt: new Date('2024-01-01').toISOString(),
    ...overrides,
  };
}

/**
 * Create mock gallery images for different categories
 */
export function createMockGalleryImages(count: number = 8): GalleryImage[] {
  const categories: GalleryImage['category'][] = ['instalaciones', 'equipo', 'pacientes'];
  return Array.from({ length: count }, (_, i) =>
    createMockGalleryImage({
      id: `gallery-${i + 1}`,
      category: categories[i % categories.length],
      order: i,
      caption: `Gallery image ${i + 1}`,
    })
  );
}

/**
 * Create mock PublicImages for testing
 */
export function createMockPublicImages(overrides: Partial<PublicImages> = {}): PublicImages {
  return {
    hero: 'https://example.com/hero.jpg',
    gallery: createMockGalleryImages(4),
    ...overrides,
  };
}

/**
 * Create a mock PublicService for testing
 */
export function createMockPublicService(overrides: Partial<Omit<PublicService, 'icon'>> = {}): PublicService {
  return {
    title: 'Consulta General',
    description: 'Examen completo de salud para tu mascota',
    price: '$500.00',
    ...overrides,
  };
}

/**
 * Create mock featured services for testing
 */
export interface FeaturedService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  publicIcon: string | null;
  publicPriceLabel: string | null;
  publicDisplayOrder: number | null;
}

export function createMockFeaturedService(overrides: Partial<FeaturedService> = {}): FeaturedService {
  return {
    id: 'service-1',
    name: 'Consulta General',
    description: 'Examen completo de salud para tu mascota',
    price: 500,
    publicIcon: 'stethoscope',
    publicPriceLabel: null,
    publicDisplayOrder: 0,
    ...overrides,
  };
}

/**
 * Create multiple mock featured services
 */
export function createMockFeaturedServices(count: number = 6): FeaturedService[] {
  const services = [
    { name: 'Consulta General', icon: 'stethoscope', price: 500 },
    { name: 'Vacunación', icon: 'syringe', price: 350 },
    { name: 'Cirugía', icon: 'scissors', price: 2500 },
    { name: 'Cardiología', icon: 'heart', price: 800 },
    { name: 'Desparasitación', icon: 'pill', price: 200 },
    { name: 'Laboratorio', icon: 'microscope', price: 600 },
  ];

  return services.slice(0, count).map((s, i) =>
    createMockFeaturedService({
      id: `service-${i + 1}`,
      name: s.name,
      publicIcon: s.icon,
      price: s.price,
      publicDisplayOrder: i,
      description: `Servicio de ${s.name.toLowerCase()} profesional`,
    })
  );
}

/**
 * Create mock PublicSocialMedia for testing
 */
export function createMockPublicSocialMedia(overrides: Partial<PublicSocialMedia> = {}): PublicSocialMedia {
  return {
    facebook: 'https://facebook.com/testclinic',
    instagram: 'https://instagram.com/testclinic',
    twitter: 'https://twitter.com/testclinic',
    whatsapp: '5551234567',
    ...overrides,
  };
}

/**
 * Mock for useThemeAware hook
 */
export const mockUseThemeAware = (isDark: boolean = false) => ({
  isDark,
  theme: isDark ? 'dark' : 'light',
});

/**
 * Mock for getTheme function
 */
export const mockGetTheme = () => ({
  id: 'modern',
  name: 'Modern',
  colors: {
    primary: '#75a99c',
    text: '#1a1a1a',
    textMuted: '#6b7280',
    cardBg: '#ffffff',
    border: '#e5e7eb',
    primaryLight: '#e8f0ee',
    background: '#ffffff',
    backgroundAlt: '#f3f4f6',
    heroGradientFrom: '#f8faf9',
    heroGradientTo: '#e8f0ee',
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    headingWeight: 700,
  },
  layout: {
    borderRadius: '0.5rem',
  },
});

/**
 * Mock for getThemeClasses function
 */
export const mockGetThemeClasses = () => ({
  button: 'rounded-lg',
  card: 'border',
  input: 'rounded-lg border',
});

/**
 * Mock for generateDarkColors function
 */
export const mockGenerateDarkColors = () => ({
  text: '#f9fafb',
  textMuted: '#9ca3af',
  cardBg: '#1f2937',
  border: '#374151',
  primaryLight: '#1a2e28',
  background: '#111827',
  backgroundAlt: '#1f2937',
  heroGradientFrom: '#1f2937',
  heroGradientTo: '#111827',
});
