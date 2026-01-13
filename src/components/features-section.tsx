import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Package, Globe, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: Calendar,
    title: "Gestión de Citas",
    subtitle: "Agenda ilimitada",
    description: "Programa, modifica y da seguimiento a todas tus citas en un solo lugar.",
    items: [
      "Calendario visual con todas tus citas",
      "Múltiples estados: programada, confirmada, completada",
      "Asignación de veterinarios y personal",
      "Duración personalizable por cita",
      "Notas y razón de consulta para cada cita",
    ],
  },
  {
    icon: FileText,
    title: "Historiales Médicos",
    subtitle: "Completo y detallado",
    description: "Registro completo de consultas, tratamientos, vacunas y desparasitaciones de cada mascota.",
    items: [
      "Historial completo de cada paciente",
      "Registro de consultas con diagnóstico y tratamiento",
      "Control de vacunaciones por etapa (cachorro, adulto, senior)",
      "Seguimiento de desparasitaciones internas y externas",
      "Historial de medicamentos y prescripciones",
      "Calendario de próximos tratamientos",
    ],
  },
  {
    icon: Package,
    title: "Control de Inventario y Ventas",
    subtitle: "Stock y ventas",
    description: "Gestiona tu inventario, medicamentos, productos y registra todas las ventas con control de stock.",
    items: [
      "Control completo de stock y ventas",
      "Inventario de medicamentos, vacunas y productos",
      "Alertas de stock mínimo y productos por vencer",
      "Registro de ventas con múltiples métodos de pago",
      "Caja registradora con apertura y cierre de turno",
      "Historial de movimientos de inventario",
    ],
  },
  {
    icon: Globe,
    title: "Presencia Digital",
    subtitle: "Páginas públicas",
    description: "Crea una presencia profesional en línea para tu clínica con páginas públicas y códigos QR.",
    items: [
      "Página de servicios visible para todos",
      "Perfil del equipo con fotos profesionales",
      "Sistema de testimonios con calificaciones",
      "Códigos QR para compartir tu clínica",
      "Reserva de citas online para clientes",
      "Invitaciones de personal con roles",
    ],
  },
]

export function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-12 sm:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-16">
          <h2 className="text-balance text-2xl sm:text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Todo lo que necesitas para gestionar tu clínica
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-8 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-4 sm:p-8">
                  <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="mb-2 sm:mb-3 text-xs">
                    {feature.subtitle}
                  </Badge>
                  <h3 className="mb-2 sm:mb-3 text-xl sm:text-2xl font-bold text-foreground">{feature.title}</h3>
                  <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-2 sm:space-y-3">
                    {feature.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 sm:mt-12 text-center">
          <Link
            href="/funcionalidades"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver todas las funcionalidades
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
