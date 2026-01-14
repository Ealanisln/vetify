import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Users, MessageSquare, UserPlus, Shield } from "lucide-react"
import Link from "next/link"

const secondaryFeatures = [
  {
    icon: Bell,
    title: "Sistema de Recordatorios",
    description: "Gestiona recordatorios de citas, vacunas y tratamientos para tus clientes",
  },
  {
    icon: Users,
    title: "Gestión de Personal",
    description: "Administra tu equipo de veterinarios y personal con roles y permisos",
  },
  {
    icon: MessageSquare,
    title: "Sistema de Testimonios",
    description: "Recibe testimonios de clientes, modera y destaca los mejores con calificaciones de estrellas",
  },
  {
    icon: UserPlus,
    title: "Invitaciones de Personal",
    description: "Invita a tu equipo con enlaces seguros. Cada miembro recibe su rol y permisos automáticamente",
  },
  {
    icon: Shield,
    title: "Control de Acceso Granular",
    description: "Define roles personalizados con permisos específicos: citas, inventario, ventas, reportes",
  },
]

export function SecondaryFeaturesSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
            Y mucho más para hacer crecer tu clínica
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto mb-16">
          {secondaryFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-12 text-center shadow-xl">
          <h3 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
            ¿Listo para organizar tu clínica?
          </h3>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground mb-8">
            Comienza con 30 días gratis. Sin tarjeta de crédito.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/api/auth/register">
              <Button size="lg" className="h-12 px-8 text-base font-semibold">
                Probar 30 días gratis
              </Button>
            </Link>
            <Link href="/precios">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold bg-transparent">
                Ver precios
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
