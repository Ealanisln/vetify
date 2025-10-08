import { Navigation } from "@/components/navigation"
import { FeaturesHeroSection } from "@/components/features-hero-section"
import { MainFeaturesSection } from "@/components/main-features-section"
import { DetailedFunctionalitiesSection } from "@/components/detailed-functionalities-section"
import { SecondaryFeaturesSection } from "@/components/secondary-features-section"
import { StepsSection } from "@/components/steps-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"

export default function FunctionalitiesPage() {
  return (
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
  )
}
