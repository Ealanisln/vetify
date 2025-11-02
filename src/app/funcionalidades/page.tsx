import { Navigation } from "@/components/navigation"
import { FeaturesHeroSection } from "@/components/features-hero-section"
import { MainFeaturesSection } from "@/components/main-features-section"
import { DetailedFunctionalitiesSection } from "@/components/detailed-functionalities-section"
import { SecondaryFeaturesSection } from "@/components/secondary-features-section"
import { StepsSection } from "@/components/steps-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { generateMetadata as generateSEOMetadata, createPageSEO } from '@/lib/seo';
import { PAGE_METADATA } from '@/lib/seo/config';
import { createBreadcrumbsFromPath } from '@/lib/seo/breadcrumbs';
import { generateFAQPageSchema, COMMON_FAQS_ES } from '@/lib/seo/faq-schema';
import { generateCommonVeterinaryServices } from '@/lib/seo/structured-data';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the features/functionalities page
 * Includes features-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const pageMetadata = PAGE_METADATA.features;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

  const seoConfig = createPageSEO(
    pageMetadata.title[lang],
    pageMetadata.description[lang],
    {
      path: '/funcionalidades',
      keywords: [
        'funcionalidades veterinaria',
        'características software veterinario',
        'gestión citas veterinaria',
        'historial médico digital',
        'inventario veterinario',
        'facturación veterinaria',
        'reportes veterinarios',
        'calendario veterinario',
        'agenda veterinaria online',
        'expediente clínico digital',
      ],
      lang,
      images: [
        {
          url: `${baseUrl}/api/og?page=features`,
          width: 1200,
          height: 630,
          alt: 'Vetify - Funcionalidades',
        },
      ],
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function FunctionalitiesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://vetify.com';

  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/funcionalidades',
    'Funcionalidades',
    'es'
  );

  // Generate FAQ structured data for features FAQs
  const faqSchema = generateFAQPageSchema(COMMON_FAQS_ES.features);

  // Generate Service schemas for common veterinary services
  // This helps search engines understand what services veterinary clinics can offer using Vetify
  const serviceSchemas = generateCommonVeterinaryServices(
    'Vetify',
    baseUrl,
    'México',
    'es'
  );

  return (
    <>
      {/* Structured data for SEO */}
      <StructuredData data={[breadcrumbSchema, faqSchema, ...serviceSchemas]} />
      <div className="min-h-screen">
        <Navigation />
        <main>
          <FeaturesHeroSection />
          <MainFeaturesSection />
          <DetailedFunctionalitiesSection />
          <SecondaryFeaturesSection />
          <StepsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  )
}
