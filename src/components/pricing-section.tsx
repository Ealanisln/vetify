import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, ArrowRight } from "lucide-react"
import { EarlyAdopterBanner } from "@/components/marketing/EarlyAdopterBanner"
import { getActivePromotionFromDB } from "@/lib/pricing-config"
import Link from "next/link"

const plans = [
  {
    name: "Plan Básico",
    price: "$599",
    discountedPrice: "$449",
    period: "/mes",
    description: "Ideal para clínicas pequeñas que están comenzando.",
    features: ["Hasta 500 mascotas", "3 usuarios veterinarios", "Historiales médicos completos", "Gestión de citas", "Control de inventario básico", "Punto de venta básico"],
    popular: false,
    savings: "$150",
  },
  {
    name: "Plan Profesional",
    price: "$1,199",
    discountedPrice: "$899",
    period: "/mes",
    description: "Perfecto para clínicas establecidas con múltiples sucursales.",
    features: [
      "Hasta 2,000 mascotas",
      "8 usuarios veterinarios",
      "Todo del plan Básico",
      "Gestión multi-sucursal",
      "Múltiples cajas por sucursal",
      "Control de inventario avanzado",
    ],
    popular: true,
    savings: "$300",
  },
  {
    name: "Plan Corporativo",
    price: "$6,667",
    discountedPrice: "$5,000",
    period: "/mes",
    description: "Solución personalizada para grandes organizaciones.",
    features: [
      "Mascotas ilimitadas",
      "20 usuarios veterinarios",
      "Todo del plan Profesional",
      "API personalizada",
      "Múltiples sucursales ilimitadas",
      "Soporte 24/7",
    ],
    popular: false,
    savings: "$1,667",
    isEnterprise: true,
  },
]

export async function PricingSection() {
  const promotion = await getActivePromotionFromDB()
  const promoActive = promotion !== null

  return (
    <section id="precios" className="py-12 sm:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Early Adopter Banner - only shows when promo is active */}
        {promoActive && promotion && (
          <div className="flex justify-center mb-6 sm:mb-8">
            <EarlyAdopterBanner
              variant="hero"
              badgeText={promotion.badgeText}
              description={promotion.description}
            />
          </div>
        )}

        <div className="mx-auto max-w-3xl text-center mb-3 sm:mb-4">
          <h2 className="text-balance text-2xl sm:text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Planes que se adaptan a tu clínica
          </h2>
        </div>
        <p className="mx-auto max-w-2xl text-center text-pretty text-sm sm:text-base text-muted-foreground mb-8 sm:mb-16">
          Desde clínicas pequeñas hasta grandes hospitales veterinarios. Todos los planes incluyen 30 días de prueba
          gratis.
        </p>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3 max-w-6xl mx-auto items-stretch">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border bg-card transition-all hover:shadow-xl flex flex-col ${
                plan.popular ? "border-primary shadow-lg md:scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground text-xs">Más popular</Badge>
                </div>
              )}
              {plan.isEnterprise && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white text-xs">EMPRESARIAL</Badge>
                </div>
              )}
              <CardHeader className="p-4 sm:p-8 pb-4 sm:pb-6">
                <div className="mb-1 sm:mb-2 text-xs sm:text-sm font-medium text-muted-foreground">{plan.name}</div>

                {/* Pricing Display */}
                <div className="mb-2">
                  {plan.isEnterprise ? (
                    <div className="mb-1 sm:mb-2 flex items-baseline gap-2">
                      <span className="text-3xl sm:text-5xl font-bold text-foreground">Cotización</span>
                    </div>
                  ) : promoActive && promotion ? (
                    <>
                      {/* Promotional Pricing - Dynamic from DB */}
                      {(() => {
                        const originalPrice = parseInt(plan.price.replace(/[^0-9]/g, ''))
                        const discountedPrice = Math.round(originalPrice * (1 - promotion.discountPercent / 100))
                        const savings = originalPrice - discountedPrice
                        return (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-orange-500" />
                              <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/20 text-xs">
                                {promotion.discountPercent}% OFF
                              </Badge>
                            </div>
                            <div className="mb-1 sm:mb-2 flex items-baseline gap-2">
                              <span className="text-3xl sm:text-5xl font-bold text-foreground">${discountedPrice.toLocaleString()}</span>
                              <span className="text-sm sm:text-base text-muted-foreground">{plan.period}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs sm:text-sm">
                              <span className="text-muted-foreground line-through">{plan.price}/mes</span>
                              <span className="text-orange-500 font-medium">Ahorras ${savings.toLocaleString()}/mes</span>
                            </div>
                            <p className="text-xs text-orange-600 mt-1">Por {promotion.durationMonths} meses • Luego {plan.price}/mes</p>
                          </>
                        )
                      })()}
                    </>
                  ) : (
                    <>
                      {/* Regular Pricing */}
                      <div className="mb-1 sm:mb-2 flex items-baseline gap-2">
                        <span className="text-3xl sm:text-5xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-sm sm:text-base text-muted-foreground">{plan.period}</span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-8 pt-0 flex flex-col flex-1">
                <Link href={plan.isEnterprise ? "/contacto" : "/api/auth/register"}>
                  <Button className="mb-4 sm:mb-6 w-full text-xs sm:text-sm" variant={plan.popular ? "default" : "outline"} size="lg">
                    {plan.isEnterprise ? "Contactar Ventas" : "Comenzar prueba gratis"}
                  </Button>
                </Link>
                <ul className="space-y-2 sm:space-y-3 flex-1">
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

        <div className="mt-8 sm:mt-12 text-center px-4 space-y-3">
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Ver comparación detallada de planes
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs sm:text-sm text-muted-foreground">
            ✨ Todos los planes incluyen 30 días de prueba gratis • Cancela en cualquier momento
          </p>
        </div>
      </div>
    </section>
  )
}
