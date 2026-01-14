"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

const features = [
  "Página de servicios con descripción y precios",
  "Perfil del equipo con fotos profesionales",
  "Reserva de citas online para clientes",
  "Galería de imágenes de tu clínica",
  "Testimonios y calificaciones de clientes",
  "Tema personalizable con tu marca",
]

const screenshots = [
  {
    id: "services",
    label: "Servicios",
    src: "/images/marketing/public-services.png",
    alt: "Página pública de servicios veterinarios",
  },
  {
    id: "team",
    label: "Equipo",
    src: "/images/marketing/public-team.png",
    alt: "Página pública del equipo veterinario",
  },
]

export function PublicPagesSection() {
  const [activeTab, setActiveTab] = useState("services")

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <Badge variant="secondary" className="mb-4">
              Páginas públicas
            </Badge>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-4">
              Tu clínica, visible para todos
            </h2>
            <p className="text-pretty text-lg text-muted-foreground mb-8">
              Crea una presencia profesional en línea para tu clínica veterinaria.
              Tus clientes podrán ver tus servicios, conocer a tu equipo y agendar
              citas directamente desde su navegador.
            </p>

            <div className="mb-8">
              <p className="text-sm text-muted-foreground mb-3">URLs de ejemplo:</p>
              <div className="flex flex-wrap gap-2">
                <code className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">
                  vetify.pro/tu-clinica/servicios
                </code>
                <code className="px-3 py-1.5 bg-muted rounded-lg text-sm font-mono">
                  vetify.pro/tu-clinica/equipo
                </code>
              </div>
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

          {/* Screenshots with tabs */}
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
                <div className="relative aspect-[3/2]">
                  {screenshots.map((screenshot) => (
                    <Image
                      key={screenshot.id}
                      src={screenshot.src}
                      alt={screenshot.alt}
                      fill
                      className={`object-cover transition-opacity duration-300 ${
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
