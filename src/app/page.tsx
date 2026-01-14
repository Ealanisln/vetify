import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { PublicPagesSection } from "@/components/marketing/public-pages-section"
import { BenefitsSection } from "@/components/benefits-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { StepsSection } from "@/components/steps-section"
import { PricingSection } from "@/components/pricing-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import type { Metadata } from 'next'
import {
  generateMetadata as generateSEOMetadata,
  createHomePageSEO,
  generateWebPageSchema,
  StructuredData,
} from '@/lib/seo'
import { generateBreadcrumbSchema } from '@/lib/seo/breadcrumbs'
import { getBaseUrl } from '@/lib/seo/config'

export async function generateMetadata(): Promise<Metadata> {
  const lang = 'es' as const
  const seoConfig = createHomePageSEO(lang)
  return generateSEOMetadata(seoConfig, lang)
}

export default function Page() {
  const baseUrl = getBaseUrl()

  const webPageSchema = generateWebPageSchema(
    'Vetify - Software de Gestión para Clínicas Veterinarias',
    'Sistema integral de gestión para clínicas veterinarias. Administra citas, historiales médicos, inventario y facturación. Prueba gratis 30 días.',
    baseUrl,
    'es'
  )

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Inicio', path: '/' }
  ], 'es')

  return (
    <>
      <StructuredData data={[webPageSchema, breadcrumbSchema]} />
      <div className="min-h-screen">
        <Navigation />
        <main>
          <HeroSection />
          <FeaturesSection />
          <PublicPagesSection />
          <BenefitsSection />
          <TestimonialsSection />
          <StepsSection />
          <PricingSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  )
}
