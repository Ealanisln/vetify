"use client"

import { Card, CardContent } from "@/components/ui/card"
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Calendar,
  FileText,
  Package,
  Bell,
  Users,
  Globe,
  Settings,
  Shield,
} from "lucide-react"
import Image from "next/image"

// Icon name mapping to avoid passing functions from Server to Client Components
const iconMap = {
  calendar: Calendar,
  fileText: FileText,
  package: Package,
  bell: Bell,
  users: Users,
  globe: Globe,
  settings: Settings,
  shield: Shield,
} as const

export type IconName = keyof typeof iconMap

interface FeatureDetailCardProps {
  iconName: IconName
  title: string
  problem: string
  solutions: string[]
  benefit: string
  image?: string
  imageAlt?: string
  reversed?: boolean
}

export function FeatureDetailCard({
  iconName,
  title,
  problem,
  solutions,
  benefit,
  image,
  imageAlt,
  reversed = false,
}: FeatureDetailCardProps) {
  const Icon = iconMap[iconName]
  const contentSection = (
    <div className="flex flex-col justify-center">
      {/* Header with icon */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
      </div>

      {/* Problem section */}
      <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
              Problema común
            </p>
            <p className="text-sm text-red-600 dark:text-red-300/80">
              {problem}
            </p>
          </div>
        </div>
      </div>

      {/* Solutions list */}
      <div className="mb-6">
        <p className="text-sm font-medium text-muted-foreground mb-3">
          Cómo te ayuda Vetify:
        </p>
        <ul className="space-y-2">
          {solutions.map((solution, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{solution}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Benefit highlight */}
      <div className="p-4 rounded-lg bg-primary/5 dark:bg-primary/10 border border-primary/20">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary mb-1">
              Beneficio clave
            </p>
            <p className="text-foreground font-medium">
              {benefit}
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const imageSection = image ? (
    <div className="relative">
      <Card className="overflow-hidden border border-gray-200 dark:border-gray-700 bg-card shadow-xl">
        <CardContent className="p-0">
          <div className="relative aspect-[4/3]">
            <Image
              src={image}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </CardContent>
      </Card>
      {/* Decorative elements */}
      <div className="absolute -z-10 -top-4 -right-4 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -z-10 -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
    </div>
  ) : (
    <div className="relative flex items-center justify-center">
      <div className="w-full aspect-[4/3] rounded-xl bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <Icon className="h-24 w-24 text-primary/30" />
      </div>
    </div>
  )

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${reversed ? "lg:grid-flow-dense" : ""}`}>
          <div className={reversed ? "lg:col-start-2" : ""}>
            {contentSection}
          </div>
          <div className={reversed ? "lg:col-start-1" : ""}>
            {imageSection}
          </div>
        </div>
      </div>
    </section>
  )
}
