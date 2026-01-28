import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import { EarlyAdopterBanner } from "@/components/marketing/EarlyAdopterBanner"
import { getActivePromotionFromDB } from "@/lib/pricing-config"
import Link from "next/link"
import Image from "next/image"

export async function HeroSection() {
  const promotion = await getActivePromotionFromDB()
  const promoActive = promotion !== null

  return (
    <section className="relative overflow-hidden pt-24 pb-12 sm:pt-32 sm:pb-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Early Adopter Banner - only shows when promo is active */}
          {promoActive && promotion && (
            <div className="flex justify-center mb-6 sm:mb-8">
              <EarlyAdopterBanner
                variant="hero"
                badgeText={promotion.badgeText}
                description={promotion.description}
              />
            </div>
          )}

          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
            El sistema sencillo para <span className="text-primary">veterinarias pequeñas</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg md:text-xl">
            Gestiona pacientes, citas y recordatorios sin Excel, sin complicarte y sin perder tiempo.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col items-center justify-center gap-4">
            <Link href="/api/auth/register" data-testid="signup-button">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                Comienza tu prueba gratis
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              30 días gratis, sin tarjeta de crédito
            </p>
          </div>

          <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" />
              <span>Fácil de usar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" />
              <span>Soporte incluido</span>
            </div>
          </div>

          <p className="mt-8 sm:mt-10 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Pensado para clínicas veterinarias pequeñas que quieren enfocarse en atender mejor, no en tareas administrativas.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-10 sm:mt-20">
          <div className="mx-auto max-w-7xl">
            {/* Light mode */}
            <div className="relative dark:hidden">
              <Image
                src="/hero/hero-dashboard-light.png"
                alt="Vista previa del dashboard de Vetify"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto object-contain scale-100 sm:scale-110"
              />
            </div>

            {/* Dark mode */}
            <div className="relative hidden dark:block">
              <Image
                src="/hero/hero-dashboard-dark.png"
                alt="Vista previa del dashboard de Vetify"
                width={1920}
                height={1080}
                priority
                className="w-full h-auto object-contain scale-100 sm:scale-110"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
