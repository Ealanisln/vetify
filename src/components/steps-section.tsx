import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  {
    step: 1,
    title: "Regístrate para una prueba gratuita",
    description:
      "Comienza con una prueba de 30 días sin compromiso y sin tarjeta de crédito. Configura tu perfil de clínica en minutos.",
  },
  {
    step: 2,
    title: "Configura tu clínica",
    description:
      "Personaliza tu agenda, servicios, productos y perfil de doctores. Importa tus clientes existentes de forma simple.",
  },
  {
    step: 3,
    title: "Gestiona tus pacientes",
    description: "Digitaliza los expedientes, crea planes de tratamiento y maneja tu inventario de manera eficiente.",
  },
  {
    step: 4,
    title: "Optimiza y crece",
    description: "Analiza tus métricas, mejora la experiencia de tus clientes y aumenta la rentabilidad de tu clínica.",
  },
]

export function StepsSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Comienza en 4 simples pasos
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            {steps.map((step) => (
              <Card
                key={step.step}
                className="border-border bg-card transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <CardContent className="p-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {step.step}
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-foreground">{step.title}</h3>
                  <p className="text-pretty text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-lg font-medium text-foreground">¿Necesitas ayuda para migrar tus datos?</p>
            <Button variant="outline" size="lg">
              Contactar a soporte
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
