import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, WifiOff, Moon, Zap, RefreshCw, Mail } from "lucide-react"

const capabilities = [
  {
    icon: Smartphone,
    title: "Instala como app",
    description: "Agrega Vetify a tu pantalla de inicio como una aplicación nativa",
  },
  {
    icon: WifiOff,
    title: "Funciona sin conexión",
    description: "Consulta información básica incluso sin internet",
  },
  {
    icon: Moon,
    title: "Modo oscuro",
    description: "Interfaz adaptable para trabajar de día o de noche",
  },
  {
    icon: Zap,
    title: "Carga ultrarrápida",
    description: "Experiencia fluida gracias a optimizaciones avanzadas",
  },
  {
    icon: RefreshCw,
    title: "Sincronización automática",
    description: "Tus datos se actualizan cuando recuperas conexión",
  },
  {
    icon: Mail,
    title: "Notificaciones por email",
    description: "Recordatorios automáticos de citas y tratamientos",
  },
]

export function AppCapabilitiesSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Tecnología moderna
          </Badge>
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
            Accede desde cualquier lugar
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Vetify es una aplicación web progresiva (PWA) que puedes instalar en
            cualquier dispositivo. Trabaja desde tu computadora, tablet o celular
            con la misma experiencia profesional.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon
            return (
              <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-foreground">{capability.title}</h3>
                  <p className="text-sm text-muted-foreground">{capability.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Mobile mockup placeholder */}
        <div className="mt-16 flex justify-center">
          <div className="relative">
            <Card className="overflow-hidden border-border bg-card shadow-2xl w-64">
              <CardContent className="p-0">
                <div className="relative aspect-[9/16] bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
                  {/* Placeholder - replace with actual mobile screenshot */}
                  <div className="text-center p-4">
                    <div className="mb-3 mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Screenshot: App móvil
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      400x800px
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Decorative glow */}
            <div className="absolute -z-10 inset-0 bg-primary/10 rounded-3xl blur-3xl scale-110" />
          </div>
        </div>
      </div>
    </section>
  )
}
