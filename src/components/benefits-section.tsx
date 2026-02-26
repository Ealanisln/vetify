import { Clock, CalendarCheck, FolderOpen, Smile } from "lucide-react"

const benefits = [
  {
    icon: Clock,
    title: "Menos administración, más atención",
    description: "Dedica tu tiempo a lo que importa: tus pacientes y clientes.",
  },
  {
    icon: CalendarCheck,
    title: "No más citas perdidas",
    description: "Recordatorios automáticos para ti y para tus clientes.",
  },
  {
    icon: FolderOpen,
    title: "Información siempre a la mano",
    description: "Accede al historial de cualquier paciente en segundos.",
  },
  {
    icon: Smile,
    title: "Empieza fácil",
    description: "Si sabes usar WhatsApp, puedes usar Vetify.",
  },
]

export function BenefitsSection() {
  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-12">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Beneficios reales para tu clínica
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div
                key={index}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-card p-5 sm:p-6 text-center transition-all hover:border-primary/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
