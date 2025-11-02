import { PricingPageEnhanced } from '../../components/pricing';
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo/config';
import { generatePricingProductSchema } from '@/lib/seo/structured-data';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { generateFAQPageSchema, COMMON_FAQS_ES } from '@/lib/seo/faq-schema';
import { StructuredData } from '@/components/seo/StructuredData';
import { COMPLETE_PLANS } from '@/lib/pricing-config';
import type { Metadata } from 'next';

/**
 * Generate metadata for the pricing page
 * Includes pricing-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const pageMetadata = PAGE_METADATA.pricing;

  const seoConfig = createPageSEO(
    pageMetadata.title[lang],
    pageMetadata.description[lang],
    {
      path: '/precios',
      keywords: [
        ...(pageMetadata.description[lang] ? [] : []),
        'precios veterinaria',
        'planes veterinarios',
        'software veterinario precios',
        'costo sistema veterinario',
        'precio software clínica veterinaria',
        'planes para veterinarias',
        'suscripción veterinaria',
      ],
      lang,
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default async function PreciosPage() {
  // Generate pricing structured data
  const pricingSchema = generatePricingProductSchema([
    {
      name: COMPLETE_PLANS.BASICO.name,
      description: COMPLETE_PLANS.BASICO.description,
      monthlyPrice: COMPLETE_PLANS.BASICO.monthlyPrice,
      yearlyPrice: COMPLETE_PLANS.BASICO.yearlyPrice,
    },
    {
      name: COMPLETE_PLANS.PROFESIONAL.name,
      description: COMPLETE_PLANS.PROFESIONAL.description,
      monthlyPrice: COMPLETE_PLANS.PROFESIONAL.monthlyPrice,
      yearlyPrice: COMPLETE_PLANS.PROFESIONAL.yearlyPrice,
    },
    {
      name: COMPLETE_PLANS.CORPORATIVO.name,
      description: COMPLETE_PLANS.CORPORATIVO.description,
      monthlyPrice: COMPLETE_PLANS.CORPORATIVO.monthlyPrice,
      yearlyPrice: COMPLETE_PLANS.CORPORATIVO.yearlyPrice,
    },
  ], 'es');

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/precios',
    'Precios y Planes',
    'es'
  );

  // Generate FAQ structured data for pricing FAQs
  const faqSchema = generateFAQPageSchema(COMMON_FAQS_ES.pricing);

  // Página pública - no requiere autenticación
  return (
    <>
      {/* Structured data for SEO */}
      <StructuredData data={[pricingSchema, breadcrumbSchema, faqSchema]} />
      <PricingPageEnhanced tenant={null} />
    </>
  );
}