import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-background to-accent/10 p-12 text-center shadow-xl">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl mb-6">
            Comienza a transformar tu clínica hoy
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-lg text-muted-foreground mb-8">
            Únete a cientos de clínicas veterinarias que ya confían en Vetify para gestionar su práctica de manera más
            eficiente.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base font-semibold">
              Probar 30 días gratis
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold bg-transparent">
              Agendar demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
