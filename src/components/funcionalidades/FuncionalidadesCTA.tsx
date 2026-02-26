"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"

const benefits = [
  "30 días gratis",
  "No necesitas tarjeta",
  "Cancela cuando quieras",
]

export function FuncionalidadesCTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 sm:p-12 text-center">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-6">
            Empieza sin riesgo
          </h2>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground font-medium">{benefit}</span>
              </div>
            ))}
          </div>

          <p className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground mb-8">
            Vetify está diseñado para crecer contigo, empezando por lo más
            importante: hacer tu día a día más simple.
          </p>

          <Link href="/api/auth/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Comenzar prueba gratis
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
