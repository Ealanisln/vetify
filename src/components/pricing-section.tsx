import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles } from "lucide-react"
import { EarlyAdopterBanner } from "@/components/marketing/EarlyAdopterBanner"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$299",
    discountedPrice: "$224",
    period: "/mes",
    description: "Ideal para clínicas pequeñas",
    features: ["Hasta 500 mascotas", "WhatsApp automático", "Gestión básica", "Soporte por email", "Reportes básicos"],
    popular: false,
    savings: "$75",
  },
  {
    name: "Standard",
    price: "$449",
    discountedPrice: "$337",
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
    savings: "$112",
  },
  {
    name: "Professional",
    price: "$899",
    discountedPrice: "$674",
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
    savings: "$225",
  },
]

export function PricingSection() {
  return (
    <section id="precios" className="py-12 sm:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Early Adopter Banner */}
        <div className="flex justify-center mb-6 sm:mb-8">
          <EarlyAdopterBanner variant="hero" />
        </div>

        <div className="mx-auto max-w-3xl text-center mb-3 sm:mb-4">
          <h2 className="text-balance text-2xl sm:text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Planes que se adaptan a tu clínica
          </h2>
        </div>
        <p className="mx-auto max-w-2xl text-center text-pretty text-sm sm:text-base text-muted-foreground mb-8 sm:mb-16">
          Desde clínicas pequeñas hasta grandes hospitales veterinarios. Todos los planes incluyen 30 días de prueba
          gratis.
        </p>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border bg-card transition-all hover:shadow-xl ${
                plan.popular ? "border-primary shadow-lg md:scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground text-xs">Más popular</Badge>
                </div>
              )}
              <CardHeader className="p-4 sm:p-8 pb-4 sm:pb-6">
                <div className="mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-muted-foreground">{plan.name}</div>

                {/* Early Adopter Pricing */}
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-orange-500" />
                    <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
                      25% OFF
                    </Badge>
                  </div>
                  <div className="mb-1 sm:mb-2 flex items-baseline gap-2">
                    <span className="text-3xl sm:text-5xl font-bold text-foreground">{plan.discountedPrice}</span>
                    <span className="text-sm sm:text-base text-muted-foreground">{plan.period}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="text-muted-foreground line-through">{plan.price}/mes</span>
                    <span className="text-orange-500 font-medium">Ahorras {plan.savings}/mes</span>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">Por 6 meses • Luego {plan.price}/mes</p>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 pt-0">
                <Link href="/api/auth/register">
                  <Button className="mb-4 sm:mb-6 w-full text-xs sm:text-sm" variant={plan.popular ? "default" : "outline"} size="lg">
                    Comenzar prueba gratis
                  </Button>
                </Link>
                <ul className="space-y-2 sm:space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 sm:gap-3">
                      <Check className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-primary" />
                      <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 sm:mt-12 text-center px-4 space-y-2">
          <p className="text-xs sm:text-sm text-muted-foreground">
            ✨ Todos los planes incluyen 30 días de prueba gratis • Cancela en cualquier momento
          </p>
          <p className="text-xs text-orange-600 font-medium">
            🎁 Usa el código <span className="font-mono bg-orange-100 px-2 py-1 rounded">FUNDADOR25</span> al momento de pago
          </p>
        </div>
      </div>
    </section>
  )
}
