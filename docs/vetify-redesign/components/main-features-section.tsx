import { Card, CardContent } from "@/components/ui/card"
import { Calendar, FileText, Package, CheckCircle2 } from "lucide-react"

const mainFeatures = [
  {
    icon: Calendar,
    title: "Gestión de Citas Completa",
    description:
      "Sistema completo para programar, modificar y dar seguimiento a todas las citas de tu clínica veterinaria.",
    features: [
      "Agenda ilimitada con calendario integrado",
      "Calendario visual con todas tus citas",
      "Múltiples estados: programada, confirmada, completada",
      "Asignación de veterinarios y personal",
      "Duración personalizable por cita",
      "Notas y razón de consulta para cada cita",
    ],
  },
  {
    icon: FileText,
    title: "Historiales Médicos Completos",
    description: "Registro detallado de consultas, tratamientos, vacunas y desparasitaciones de cada mascota.",
    features: [
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
    description: "Gestiona tu inventario de medicamentos, productos y registra todas las ventas de tu clínica.",
    features: [
      "Control completo de stock y ventas",
      "Inventario de medicamentos, vacunas y productos",
      "Alertas de stock mínimo y productos por vencer",
      "Registro de ventas con múltiples métodos de pago",
      "Caja registradora con apertura y cierre de turno",
      "Historial de movimientos de inventario",
    ],
  },
]

export function MainFeaturesSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
            Características principales
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">Todo lo que necesitas para gestionar tu clínica</p>
          <p className="mt-2 text-muted-foreground">
            Sistema completo de gestión veterinaria. Administra citas, historiales, inventario y ventas en una sola
            plataforma.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {mainFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-foreground">{feature.title}</h3>
                  <p className="mb-6 text-muted-foreground">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.features.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
