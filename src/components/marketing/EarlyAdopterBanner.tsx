import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"

interface EarlyAdopterBannerProps {
  variant?: "hero" | "pricing"
  badgeText?: string
  description?: string
}

export function EarlyAdopterBanner({
  variant = "hero",
  badgeText,
  description,
}: EarlyAdopterBannerProps) {
  // Use provided text or defaults
  const displayBadgeText = badgeText || "🎉 Oferta de Lanzamiento"
  const displayDescription = description || "25% de descuento los primeros 6 meses"

  if (variant === "hero") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500/10 to-pink-500/10 px-4 py-2 border border-orange-500/20">
        <Sparkles className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-medium text-foreground">
          {displayBadgeText}: <span className="text-orange-500 font-bold">{displayDescription}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 px-4 text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <Sparkles className="h-5 w-5" />
        <span className="font-semibold">{displayBadgeText}:</span>
        <span>{displayDescription}</span>
        <Badge variant="secondary" className="bg-white text-orange-600 hover:bg-white/90">
          Tiempo Limitado
        </Badge>
      </div>
    </div>
  )
}
