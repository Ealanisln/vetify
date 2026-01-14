"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Star } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const features = [
  "Recibe testimonios directamente de tus clientes",
  "Modera y aprueba antes de publicar",
  "Calificaciones con estrellas (1-5)",
  "Muestra los mejores en tu página pública",
  "Carrusel automático con animaciones",
  "Aumenta la confianza de nuevos clientes",
]

const screenshots = [
  {
    id: "admin",
    label: "Panel Admin",
    src: "/images/marketing/testimonials-admin.png",
    alt: "Panel de administración de testimonios",
  },
  {
    id: "public",
    label: "Vista Pública",
    src: "/images/marketing/testimonials-public.png",
    alt: "Testimonios en página pública",
  },
]

export function TestimonialsSection() {
  const [activeTab, setActiveTab] = useState("admin")

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content - left side */}
          <div>
            <Badge variant="secondary" className="mb-4">
              Reputación online
            </Badge>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              Testimonios que generan confianza
            </h2>
            <p className="text-pretty text-lg text-muted-foreground mb-8">
              Permite que tus clientes satisfechos compartan su experiencia.
              Modera los testimonios desde el panel de administración y destaca
              los mejores en tu página pública.
            </p>

            <div className="mb-8 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Calificaciones verificadas
              </span>
            </div>

            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Screenshots with tabs - right side */}
          <div className="relative">
            {/* Tab buttons */}
            <div className="flex gap-2 mb-4">
              {screenshots.map((screenshot) => (
                <button
                  key={screenshot.id}
                  onClick={() => setActiveTab(screenshot.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === screenshot.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {screenshot.label}
                </button>
              ))}
            </div>

            <Card className="overflow-hidden border-border bg-card shadow-2xl">
              <CardContent className="p-0">
                <div className="relative aspect-[3/2] bg-muted/50">
                  {screenshots.map((screenshot) => (
                    <Image
                      key={screenshot.id}
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      className={`object-contain transition-opacity duration-300 ${
                        activeTab === screenshot.id ? "opacity-100" : "opacity-0"
                      }`}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-4 -right-4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-48 h-48 bg-accent/10 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  )
}
