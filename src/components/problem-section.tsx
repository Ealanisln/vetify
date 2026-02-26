import { FileSpreadsheet, MessageCircle, Bell, Clock } from "lucide-react"

const problems = [
  {
    icon: FileSpreadsheet,
    text: "Llevas pacientes y citas en Excel o libretas",
  },
  {
    icon: MessageCircle,
    text: "Usas WhatsApp para todo (y se te pierden mensajes)",
  },
  {
    icon: Bell,
    text: "Olvidas citas o recordatorios importantes",
  },
  {
    icon: Clock,
    text: "Pierdes tiempo administrativo que podrías usar atendiendo",
  },
]

export function ProblemSection() {
  return (
    <section className="py-12 sm:py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-foreground md:text-4xl text-center mb-8 sm:mb-12">
            Si tienes una veterinaria pequeña, probablemente...
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {problems.map((problem, index) => {
              const Icon = problem.icon
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 sm:p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-card"
                >
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <p className="text-base sm:text-lg text-foreground">{problem.text}</p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 sm:mt-12 text-center">
            <p className="text-base sm:text-lg text-muted-foreground italic">
              &ldquo;Esto no es falta de ganas. Es falta de una herramienta hecha para clínicas pequeñas.&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
