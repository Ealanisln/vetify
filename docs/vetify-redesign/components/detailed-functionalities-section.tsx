import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, FileText, Package, Bell, Users, CheckCircle2 } from "lucide-react"

const functionalities = [
  {
    icon: Calendar,
    title: "Gestión Completa de Citas",
    subtitle: "Agenda ilimitada con calendario integrado",
    summary: "Organiza y controla todas las citas de tu clínica",
    details: [
      "Calendario visual con todas las citas programadas",
      "Múltiples estados: programada, confirmada, en progreso, completada",
      "Asignación de veterinarios y personal a cada cita",
      "Duración personalizable según tipo de consulta",
      "Notas y razón de consulta para cada cita",
    ],
  },
  {
    icon: FileText,
    title: "Historiales Médicos Completos",
    subtitle: "Historial completo de cada paciente",
    summary: "Registro detallado de la salud de cada mascota",
    details: [
      "Registro de consultas con diagnóstico y tratamiento",
      "Control de vacunaciones por etapa (cachorro, adulto, senior)",
      "Seguimiento de desparasitaciones internas y externas",
      "Historial de medicamentos y prescripciones detallado",
      "Calendario de próximos tratamientos programados",
    ],
  },
  {
    icon: Package,
    title: "Control de Inventario y Ventas",
    subtitle: "Control completo de stock y ventas",
    summary: "Gestiona tu inventario y registra todas las ventas",
    details: [
      "Inventario de medicamentos, vacunas y productos veterinarios",
      "Alertas de stock mínimo y productos próximos a vencer",
      "Registro de ventas con múltiples métodos de pago",
      "Caja registradora con apertura y cierre de turno",
      "Historial completo de movimientos de inventario",
    ],
  },
  {
    icon: Bell,
    title: "Sistema de Recordatorios",
    subtitle: "Seguimiento completo de tratamientos",
    summary: "Gestiona recordatorios para mantener a tus clientes informados",
    details: [
      "Recordatorios de citas programadas",
      "Seguimiento de vacunas y tratamientos pendientes",
      "Recordatorios personalizados por mascota",
      "Historial de recordatorios enviados",
      "Estados de recordatorios: pendiente, enviado, completado",
    ],
  },
  {
    icon: Users,
    title: "Gestión de Clientes y Mascotas",
    subtitle: "Base de datos completa y organizada",
    summary: "Administra toda la información de clientes y pacientes",
    details: [
      "Registro completo de clientes con datos de contacto",
      "Fichas detalladas de cada mascota con raza, edad y peso",
      "Historial de consultas y tratamientos por mascota",
      "Búsqueda rápida de clientes y mascotas",
      "Notas y preferencias de contacto por cliente",
    ],
  },
]

export function DetailedFunctionalitiesSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
            Funcionalidades completas
          </h2>
          <p className="text-pretty text-lg text-muted-foreground">
            Todo lo que necesitas para administrar tu clínica veterinaria de manera profesional
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {functionalities.map((functionality, index) => {
            const Icon = functionality.icon
            return (
              <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
                <CardContent className="p-8">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <Badge variant="secondary" className="mb-3">
                    {functionality.subtitle}
                  </Badge>
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{functionality.title}</h3>
                  <p className="mb-6 text-sm text-muted-foreground">{functionality.summary}</p>
                  <ul className="space-y-3">
                    {functionality.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-muted-foreground">{detail}</span>
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
