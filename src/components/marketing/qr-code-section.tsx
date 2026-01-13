import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, CheckCircle2 } from "lucide-react"

const features = [
  "Genera códigos QR personalizados al instante",
  "Descarga en PNG, SVG o PDF",
  "Colores personalizables con tu marca",
  "Enlaza a tu página, servicios o agenda",
  "Perfecto para tarjetas, posters y redes sociales",
  "Actualiza el destino sin cambiar el código",
]

export function QrCodeSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Screenshot placeholder - left side */}
          <div className="relative order-2 lg:order-1">
            <Card className="overflow-hidden border-border bg-card shadow-2xl">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-accent/5 via-background to-primary/5 flex items-center justify-center">
                  {/* Placeholder - replace with actual screenshot */}
                  <div className="text-center p-8">
                    <div className="mb-4 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <QrCode className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Screenshot: Generador de códigos QR
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      800x600px recomendado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -left-4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -right-4 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
          </div>

          {/* Content - right side */}
          <div className="order-1 lg:order-2">
            <Badge variant="secondary" className="mb-4">
              Marketing offline
            </Badge>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              Comparte tu clínica con un código QR
            </h2>
            <p className="text-pretty text-lg text-muted-foreground mb-8">
              Genera códigos QR profesionales para promocionar tu clínica veterinaria.
              Tus clientes pueden escanear y acceder instantáneamente a tus servicios,
              agendar citas o ver tu equipo.
            </p>

            <div className="mb-8 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">PNG</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">SVG</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">PDF</span>
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
        </div>
      </div>
    </section>
  )
}
