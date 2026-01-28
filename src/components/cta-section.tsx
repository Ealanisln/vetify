import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTASection() {
  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 sm:p-12 text-center">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl mb-4">
            Prueba gratis, sin compromiso
          </h2>
          <p className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground mb-8">
            30 días para probarlo. Sin tarjeta de crédito.
          </p>
          <Link href="/api/auth/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Empieza tu prueba gratis
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
