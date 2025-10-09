import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Calendar, Syringe, ClipboardList } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Software veterinario completo con <span className="text-primary">30 días gratis</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Gestiona citas, historiales y clientes en un solo lugar. Todo lo que necesitas para administrar tu clínica
            veterinaria de manera profesional.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Probar 30 días gratis
            </Button>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>Setup en 15 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>30 días de prueba</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                <span>Soporte incluido</span>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <Calendar className="h-4 w-4" />
              Sistema de recordatorios
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <Syringe className="h-4 w-4" />
              Seguimiento de vacunas
            </Badge>
            <Badge variant="secondary" className="gap-2 px-4 py-2">
              <ClipboardList className="h-4 w-4" />
              Gestión completa
            </Badge>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20">
          <div className="mx-auto max-w-6xl">
            {/* Light mode background with gradient */}
            <div className="relative overflow-hidden rounded-2xl p-8 shadow-2xl dark:hidden bg-[radial-gradient(circle_at_30%_30%,rgba(117,169,156,0.08)_0%,rgba(117,169,156,0.04)_40%,rgba(255,255,255,0.02)_100%)]">
              <img
                src="/hero/hero-dashboard-light.png"
                alt="Vista previa del dashboard de Vetify"
                className="w-full object-contain"
              />
            </div>

            {/* Dark mode background with gradient */}
            <div className="relative hidden overflow-hidden rounded-2xl p-8 shadow-2xl dark:block bg-[radial-gradient(circle_at_30%_30%,rgba(117,169,156,0.15)_0%,rgba(117,169,156,0.08)_40%,rgba(17,24,39,0.95)_100%)]">
              <img
                src="/hero/hero-dashboard-dark.png"
                alt="Vista previa del dashboard de Vetify"
                className="w-full object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
