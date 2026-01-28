import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ClosingSection() {
  return (
    <section className="py-12 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base sm:text-lg text-muted-foreground mb-6">
            Vetify está en crecimiento y se construye con feedback real de veterinarios.
          </p>
          <p className="text-lg sm:text-xl text-foreground font-medium mb-8">
            Si tienes una clínica pequeña y buscas algo sencillo que funcione, probablemente Vetify es para ti.
          </p>
          <Link href="/api/auth/register">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Crear cuenta gratis
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
