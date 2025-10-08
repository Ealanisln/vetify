import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "$299",
    period: "/mes",
    description: "Ideal para clínicas pequeñas",
    features: ["Hasta 500 mascotas", "WhatsApp automático", "Gestión básica", "Soporte por email", "Reportes básicos"],
    popular: false,
  },
  {
    name: "Standard",
    price: "$449",
    period: "/mes",
    description: "Para clínicas en crecimiento",
    features: [
      "Hasta 2,000 mascotas",
      "Automación avanzada",
      "Reportes detallados",
      "Soporte prioritario",
      "Integraciones",
    ],
    popular: true,
  },
  {
    name: "Professional",
    price: "$899",
    period: "/mes",
    description: "Para hospitales veterinarios",
    features: [
      "Mascotas ilimitadas",
      "Multi-sucursal",
      "Soporte prioritario",
      "API personalizada",
      "Capacitación incluida",
    ],
    popular: false,
  },
]

export function PricingSection() {
  return (
    <section id="precios" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-4">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Planes que se adaptan a tu clínica
          </h2>
        </div>
        <p className="mx-auto max-w-2xl text-center text-pretty text-muted-foreground mb-16">
          Desde clínicas pequeñas hasta grandes hospitales veterinarios. Todos los planes incluyen 30 días de prueba
          gratis.
        </p>

        <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border bg-card transition-all hover:shadow-xl ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">Más popular</Badge>
                </div>
              )}
              <CardHeader className="p-8 pb-6">
                <div className="mb-2 text-sm font-medium text-muted-foreground">{plan.name}</div>
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="p-8 pt-0">
                <Button className="mb-6 w-full" variant={plan.popular ? "default" : "outline"} size="lg">
                  Comenzar prueba gratis
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground">
          ✨ Todos los planes incluyen 30 días de prueba gratis • Cancela en cualquier momento
        </p>
      </div>
    </section>
  )
}
