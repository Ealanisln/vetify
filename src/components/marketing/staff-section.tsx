import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, UserPlus, Shield, Users } from "lucide-react"
import Image from "next/image"

const features = [
  "Invita a tu equipo con enlaces seguros",
  "Asigna roles automáticamente al registrarse",
  "Control de permisos granular por módulo",
  "Veterinarios, recepcionistas, administradores",
  "Revoca accesos en cualquier momento",
  "Historial de actividad por usuario",
]

const roles = [
  { name: "Admin", icon: Shield, color: "text-red-500" },
  { name: "Veterinario", icon: Users, color: "text-blue-500" },
  { name: "Recepción", icon: UserPlus, color: "text-green-500" },
]

export function StaffSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Screenshot - left side */}
          <div className="relative order-2 lg:order-1">
            <Card className="overflow-hidden border-border bg-card shadow-2xl">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3]">
                  <Image
                    src="/images/marketing/staff-invitation.png"
                    alt="Modal de invitación de personal"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Floating roles badges */}
            <div className="absolute -bottom-4 left-4 right-4 lg:left-8 lg:right-8">
              <div className="flex justify-center gap-2 flex-wrap">
                {roles.map((role) => {
                  const Icon = role.icon
                  return (
                    <div
                      key={role.name}
                      className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg shadow-md"
                    >
                      <Icon className={`h-4 w-4 ${role.color}`} />
                      <span className="text-sm font-medium">{role.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -left-4 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -right-4 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
          </div>

          {/* Content - right side */}
          <div className="order-1 lg:order-2">
            <Badge variant="secondary" className="mb-4">
              Gestión de equipo
            </Badge>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              Tu equipo, con los permisos correctos
            </h2>
            <p className="text-pretty text-lg text-muted-foreground mb-8">
              Invita a veterinarios, recepcionistas y administradores con un simple enlace.
              Cada miembro recibe automáticamente los permisos de su rol, sin configuración
              manual.
            </p>

            <div className="mb-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Ejemplo de enlace de invitación:</p>
              <code className="text-sm font-mono text-foreground">
                vetify.pro/invite/abc123...
              </code>
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
