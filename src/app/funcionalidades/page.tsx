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
import { StructuredData } from '@/components/seo/StructuredData';
import type { Metadata } from 'next';

/**
 * Generate metadata for the features/functionalities page
 * Includes features-specific keywords and Open Graph tags
 */
export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const;
  const pageMetadata = PAGE_METADATA.features;

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
    }
  );

  return generateSEOMetadata(seoConfig, lang);
}

export default function FunctionalitiesPage() {
  // Generate breadcrumb structured data
  const breadcrumbSchema = createBreadcrumbsFromPath(
    '/funcionalidades',
    'Funcionalidades',
    'es'
  );

  return (
    <>
      {/* Structured data for SEO */}
      <StructuredData data={breadcrumbSchema} />
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
