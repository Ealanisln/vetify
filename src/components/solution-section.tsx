import { PawPrint, Calendar, Bell, FileText, Package, Smartphone } from "lucide-react"

const features = [
  {
    icon: PawPrint,
    title: "Pacientes y mascotas",
    description: "Toda la información de tus pacientes organizada",
  },
  {
    icon: Calendar,
    title: "Citas y agenda",
    description: "Programa y gestiona tus citas fácilmente",
  },
  {
    icon: Bell,
    title: "Recordatorios automáticos",
    description: "Nunca más olvides una vacuna o seguimiento",
  },
  {
    icon: FileText,
    title: "Historial clínico",
    description: "Consultas, vacunas y tratamientos en un solo lugar",
  },
  {
    icon: Package,
    title: "Inventario básico",
    description: "Control de medicamentos y productos",
  },
  {
    icon: Smartphone,
    title: "Acceso desde cualquier dispositivo",
    description: "Funciona en computadora, tablet o celular",
  },
]

export function SolutionSection() {
  return (
    <section id="funcionalidades" className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-12">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Todo en un solo lugar
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-muted-foreground">
            Las herramientas esenciales para tu día a día, sin complicaciones.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="flex items-start gap-4 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
