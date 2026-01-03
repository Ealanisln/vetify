import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Calendar, Syringe, ClipboardList } from "lucide-react"
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
            Software veterinario completo con <span className="text-primary">30 días gratis</span>
          </h1>
          <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg md:text-xl">
            Gestiona citas, historiales y clientes en un solo lugar. Todo lo que necesitas para administrar tu clínica
            veterinaria de manera profesional.
          </p>

          <div className="mt-6 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:gap-4 sm:flex-row">
            <Link href="/api/auth/register" data-testid="signup-button">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold">
                Probar 30 días gratis
              </Button>
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span>Setup en 15 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span>30 días de prueba</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span>Soporte incluido</span>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-12 flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm">
            <Badge variant="secondary" className="gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Sistema de recordatorios
            </Badge>
            <Badge variant="secondary" className="gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
              <Syringe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Seguimiento de vacunas
            </Badge>
            <Badge variant="secondary" className="gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2">
              <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Gestión completa
            </Badge>
          </div>
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
