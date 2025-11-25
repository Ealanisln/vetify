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

export interface WebSite {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  alternateName?: string;
  url: string;
  inLanguage: string;
  description?: string;
  publisher?: {
    '@type': 'Organization';
    name: string;
    url?: string;
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
        email: 'contacto@vetify.pro',
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
 * Generate WebSite structured data for the main site
 * Use this in the root layout to define site-level information
 */
export function generateWebSiteSchema(
  lang: SupportedLanguage = 'es'
): WebSite {
  const baseUrl = getBaseUrl();
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);
  const description = getLocalizedContent(SITE_METADATA.siteDescription, lang);
  const locale = getLocaleForLanguage(lang);

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    alternateName: 'Vetify',
    url: baseUrl,
    inLanguage: locale,
    description,
    publisher: {
      '@type': 'Organization',
      name: 'Vetify',
      url: baseUrl,
    },
  };
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
        email: 'soporte@vetify.pro',
        availableLanguage: ['Spanish', 'English'],
      },
    ],
  };
}

/**
 * Generate Product schema with pricing offers
 * Used for pricing pages to show multiple subscription tiers
 */
export interface Product {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers?: Offer | Offer[];
}

export interface PricingOffer extends Offer {
  name?: string;
  description?: string;
  priceSpecification?: {
    '@type': 'UnitPriceSpecification';
    price: string;
    priceCurrency: string;
    billingIncrement?: {
      '@type': 'QuantitativeValue';
      value: number;
      unitText: string;
    };
  };
}

/**
 * Generate Product with multiple pricing offers
 * For SaaS pricing pages with different subscription tiers
 */
export function generatePricingProductSchema(
  plans: Array<{
    name: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice?: number;
  }>,
  lang: SupportedLanguage = 'es'
): Product {
  const siteName = getLocalizedContent(SITE_METADATA.siteName, lang);

  const offers: PricingOffer[] = plans.flatMap((plan) => {
    const monthlyOffer: PricingOffer = {
      '@type': 'Offer',
      name: `${plan.name} - ${lang === 'es' ? 'Mensual' : 'Monthly'}`,
      description: plan.description,
      price: plan.monthlyPrice.toString(),
      priceCurrency: 'MXN',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: plan.monthlyPrice.toString(),
        priceCurrency: 'MXN',
        billingIncrement: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitText: lang === 'es' ? 'MES' : 'MONTH',
        },
      },
    };

    const offers = [monthlyOffer];

    if (plan.yearlyPrice) {
      const yearlyOffer: PricingOffer = {
        '@type': 'Offer',
        name: `${plan.name} - ${lang === 'es' ? 'Anual' : 'Yearly'}`,
        description: plan.description,
        price: plan.yearlyPrice.toString(),
        priceCurrency: 'MXN',
        availability: 'https://schema.org/InStock',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: plan.yearlyPrice.toString(),
          priceCurrency: 'MXN',
          billingIncrement: {
            '@type': 'QuantitativeValue',
            value: 1,
            unitText: lang === 'es' ? 'AÑO' : 'YEAR',
          },
        },
      };
      offers.push(yearlyOffer);
    }

    return offers;
  });

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: siteName,
    description:
      lang === 'es'
        ? 'Software de gestión para clínicas veterinarias con múltiples planes de suscripción'
        : 'Veterinary clinic management software with multiple subscription plans',
    brand: {
      '@type': 'Brand',
      name: 'Vetify',
    },
    offers,
  };
}

/**
 * LocalBusiness schema interfaces for veterinary clinic pages
 */
export interface LocalBusiness {
  '@context': 'https://schema.org';
  '@type': 'LocalBusiness' | 'VeterinaryCare';
  name: string;
  description?: string;
  image?: string | string[];
  url: string;
  telephone?: string;
  email?: string;
  address: PostalAddress;
  geo?: GeoCoordinates;
  priceRange?: string;
  openingHoursSpecification?: OpeningHoursSpecification[];
  servesCuisine?: string;
  acceptsReservations?: boolean;
}

export interface GeoCoordinates {
  '@type': 'GeoCoordinates';
  latitude: number;
  longitude: number;
}

export interface OpeningHoursSpecification {
  '@type': 'OpeningHoursSpecification';
  dayOfWeek: DayOfWeek | DayOfWeek[];
  opens: string; // HH:MM format
  closes: string; // HH:MM format
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/**
 * Service schema interfaces for veterinary services
 */
export interface Service {
  '@context': 'https://schema.org';
  '@type': 'Service';
  name: string;
  description: string;
  provider: {
    '@type': 'Organization' | 'LocalBusiness';
    name: string;
    url?: string;
  };
  serviceType?: string;
  areaServed?: {
    '@type': 'City' | 'State' | 'Country';
    name: string;
  };
  offers?: Offer;
  image?: string;
}

/**
 * Generate LocalBusiness schema for individual veterinary clinic pages
 * Use VeterinaryCare type for more specific veterinary business representation
 *
 * @param clinic - Clinic information including name, address, contact details, and hours
 * @param _lang - Reserved for future i18n implementation when English version launches.
 *                Currently unused as all content is in Spanish. Will be used to generate
 *                localized schema descriptions and labels when multi-language support is added.
 *                @todo Implement localization when English version launches (VETIF-I18N)
 *
 * @example
 * ```ts
 * const clinicSchema = generateLocalBusinessSchema({
 *   name: 'Clínica Veterinaria San Miguel',
 *   description: 'Atención veterinaria de calidad en CDMX',
 *   url: 'https://vetify.com/san-miguel',
 *   telephone: '+52 55 1234 5678',
 *   address: {
 *     streetAddress: 'Av. Insurgentes Sur 123',
 *     addressLocality: 'Ciudad de México',
 *     addressRegion: 'CDMX',
 *     postalCode: '03100',
 *     addressCountry: 'MX',
 *   },
 *   openingHours: [
 *     {
 *       dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
 *       opens: '09:00',
 *       closes: '18:00',
 *     },
 *     {
 *       dayOfWeek: 'Saturday',
 *       opens: '10:00',
 *       closes: '14:00',
 *     },
 *   ],
 * });
 * ```
 */
export function generateLocalBusinessSchema(
  clinic: {
    name: string;
    description?: string;
    url: string;
    telephone?: string;
    email?: string;
    address: {
      streetAddress?: string;
      addressLocality?: string;
      addressRegion?: string;
      postalCode?: string;
      addressCountry: string;
    };
    geo?: {
      latitude: number;
      longitude: number;
    };
    priceRange?: string;
    openingHours?: Array<{
      dayOfWeek: DayOfWeek | DayOfWeek[];
      opens: string;
      closes: string;
    }>;
    images?: string[];
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _lang: SupportedLanguage = 'es'
): LocalBusiness {
  const schema: LocalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'VeterinaryCare',
    name: clinic.name,
    url: clinic.url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: clinic.address.streetAddress,
      addressLocality: clinic.address.addressLocality,
      addressRegion: clinic.address.addressRegion,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.addressCountry,
    },
  };

  if (clinic.description) {
    schema.description = clinic.description;
  }

  if (clinic.telephone) {
    schema.telephone = clinic.telephone;
  }

  if (clinic.email) {
    schema.email = clinic.email;
  }

  if (clinic.images && clinic.images.length > 0) {
    schema.image = clinic.images.length === 1 ? clinic.images[0] : clinic.images;
  }

  if (clinic.geo) {
    schema.geo = {
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.latitude,
      longitude: clinic.geo.longitude,
    };
  }

  if (clinic.priceRange) {
    schema.priceRange = clinic.priceRange;
  }

  if (clinic.openingHours && clinic.openingHours.length > 0) {
    schema.openingHoursSpecification = clinic.openingHours.map((hours) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    }));
  }

  // Veterinary clinics accept appointments/reservations
  schema.acceptsReservations = true;

  return schema;
}

/**
 * Generate Service schema for veterinary services
 * Use this to represent specific services offered by the veterinary clinic
 *
 * @param service - Service details including name, description, provider, and pricing
 * @param _lang - Reserved for future i18n implementation when English version launches.
 *                Currently unused as all content is in Spanish. Will be used to generate
 *                localized service names and descriptions when multi-language support is added.
 *                @todo Implement localization when English version launches (VETIF-I18N)
 *
 * @example
 * ```ts
 * const serviceSchema = generateServiceSchema({
 *   name: 'Consulta Veterinaria General',
 *   description: 'Examen físico completo de tu mascota...',
 *   serviceType: 'Veterinary Consultation',
 *   provider: {
 *     name: 'Clínica Veterinaria San Miguel',
 *     url: 'https://vetify.com/san-miguel',
 *   },
 *   areaServed: {
 *     type: 'City',
 *     name: 'Ciudad de México',
 *   },
 *   price: {
 *     price: '500',
 *     priceCurrency: 'MXN',
 *   },
 * });
 * ```
 */
export function generateServiceSchema(
  service: {
    name: string;
    description: string;
    serviceType?: string;
    provider: {
      name: string;
      url?: string;
    };
    areaServed?: {
      type: 'City' | 'State' | 'Country';
      name: string;
    };
    price?: {
      price: string;
      priceCurrency: string;
      priceValidUntil?: string;
    };
    image?: string;
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _lang: SupportedLanguage = 'es'
): Service {
  const schema: Service = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': service.provider.url ? 'LocalBusiness' : 'Organization',
      name: service.provider.name,
      url: service.provider.url,
    },
  };

  if (service.serviceType) {
    schema.serviceType = service.serviceType;
  }

  if (service.areaServed) {
    schema.areaServed = {
      '@type': service.areaServed.type,
      name: service.areaServed.name,
    };
  }

  if (service.price) {
    schema.offers = {
      '@type': 'Offer',
      price: service.price.price,
      priceCurrency: service.price.priceCurrency,
      availability: 'https://schema.org/InStock',
      priceValidUntil: service.price.priceValidUntil,
    };
  }

  if (service.image) {
    schema.image = service.image;
  }

  return schema;
}

/**
 * Generate multiple Service schemas for common veterinary services
 * Returns an array of Service schemas for typical veterinary offerings
 */
export function generateCommonVeterinaryServices(
  clinicName: string,
  clinicUrl: string,
  areaServed: string,
  lang: SupportedLanguage = 'es'
): Service[] {
  const services = [
    {
      name: lang === 'es' ? 'Consulta Veterinaria' : 'Veterinary Consultation',
      description:
        lang === 'es'
          ? 'Examen físico completo de tu mascota con diagnóstico profesional'
          : 'Complete physical examination of your pet with professional diagnosis',
      serviceType: 'Veterinary Consultation',
    },
    {
      name: lang === 'es' ? 'Vacunación' : 'Vaccination',
      description:
        lang === 'es'
          ? 'Aplicación de vacunas esenciales para la protección de tu mascota'
          : 'Application of essential vaccines for your pet protection',
      serviceType: 'Vaccination',
    },
    {
      name: lang === 'es' ? 'Cirugía Veterinaria' : 'Veterinary Surgery',
      description:
        lang === 'es'
          ? 'Procedimientos quirúrgicos realizados por veterinarios especializados'
          : 'Surgical procedures performed by specialized veterinarians',
      serviceType: 'Surgery',
    },
    {
      name: lang === 'es' ? 'Análisis Clínicos' : 'Clinical Analysis',
      description:
        lang === 'es'
          ? 'Estudios de laboratorio para diagnóstico preciso'
          : 'Laboratory studies for accurate diagnosis',
      serviceType: 'Laboratory Services',
    },
    {
      name: lang === 'es' ? 'Urgencias 24/7' : '24/7 Emergency',
      description:
        lang === 'es'
          ? 'Atención veterinaria de emergencia disponible las 24 horas'
          : '24-hour emergency veterinary care available',
      serviceType: 'Emergency Services',
    },
  ];

  return services.map((service) =>
    generateServiceSchema(
      {
        name: service.name,
        description: service.description,
        serviceType: service.serviceType,
        provider: {
          name: clinicName,
          url: clinicUrl,
        },
        areaServed: {
          type: 'City',
          name: areaServed,
        },
      },
      lang
    )
  );
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
  | Product
  | LocalBusiness
  | Service
  | Organization[]
  | SoftwareApplication[]
  | WebPage[]
  | Article[]
  | Product[]
  | LocalBusiness[]
  | Service[];

/**
 * Convert structured data to JSON string for script tag
 * Use this with the StructuredData component from @/components/seo/StructuredData
 */
export function toStructuredDataString(
  data: StructuredDataType
): string {
  return JSON.stringify(data);
}
