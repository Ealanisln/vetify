import { Check } from "lucide-react"

const idealFor = [
  "Tienes una veterinaria pequeña o familiar",
  "Atiendes tú mismo o con 1-2 doctores más",
  "No quieres sistemas complicados ni caros",
  "Buscas algo práctico que realmente uses todos los días",
]

export function AudienceSection() {
  return (
    <section className="py-12 sm:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl text-center mb-8 sm:mb-12">
            ¿Para quién es Vetify?
          </h2>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-card p-6 sm:p-8">
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Vetify es ideal si:
            </p>

            <ul className="space-y-4">
              {idealFor.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-base sm:text-lg text-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-base sm:text-lg text-muted-foreground text-center italic">
                &ldquo;No es un sistema corporativo. Es una herramienta hecha para el día a día.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
