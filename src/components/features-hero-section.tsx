import { Button } from "@/components/ui/button"
import { Layers, Building2, Calendar } from "lucide-react"

export function FeaturesHeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Sistema completo de gestión veterinaria
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Gestiona toda tu clínica en un solo lugar. Citas, historiales médicos, inventario, ventas y mucho más en una
            plataforma profesional.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Probar 30 días gratis
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold bg-transparent">
              Ver precios
            </Button>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <Layers className="h-8 w-8 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Todo en uno</h3>
              <p className="text-xs text-muted-foreground">Gestión completa de tu clínica</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <Building2 className="h-8 w-8 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Multi-clínica</h3>
              <p className="text-xs text-muted-foreground">Múltiples sucursales en una cuenta</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 shadow-sm">
              <Calendar className="h-8 w-8 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">30 días gratis</h3>
              <p className="text-xs text-muted-foreground">Prueba sin compromiso</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
