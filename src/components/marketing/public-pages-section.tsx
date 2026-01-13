import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, CheckCircle2 } from "lucide-react"

const features = [
  "Página de servicios con descripción y precios",
  "Perfil del equipo con fotos profesionales",
  "Reserva de citas online para clientes",
  "Galería de imágenes de tu clínica",
  "Testimonios y calificaciones de clientes",
  "Tema personalizable con tu marca",
]

export function PublicPagesSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <Badge variant="secondary" className="mb-4">
              Páginas públicas
            </Badge>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              Tu clínica, visible para todos
            </h2>
            <p className="text-pretty text-lg text-muted-foreground mb-8">
              Crea una presencia profesional en línea para tu clínica veterinaria.
              Tus clientes podrán ver tus servicios, conocer a tu equipo y agendar
              citas directamente desde su navegador.
            </p>

            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-3">URLs de ejemplo:</p>
              <div className="flex flex-wrap gap-2">
                <code className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">
                  vetify.pro/tu-clinica/servicios
                </code>
                <code className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">
                  vetify.pro/tu-clinica/equipo
                </code>
              </div>
            </div>

            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Screenshot placeholder */}
          <div className="relative">
            <Card className="overflow-hidden border-border bg-card shadow-2xl">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
                  {/* Placeholder - replace with actual screenshot */}
                  <div className="text-center p-8">
                    <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <Globe className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Screenshot: Página de servicios pública
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      1200x800px recomendado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
