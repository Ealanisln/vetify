export function BenefitsSection() {
  const stats = [
    { label: "Reducción en tiempo administrativo", value: "-30%" },
    { label: "Incremento en ingresos promedio", value: "+20%" },
    { label: "Clientes satisfechos", value: "95%" },
    { label: "Mejora en retención de clientes", value: "+40%" },
  ]

  return (
    <section className="py-12 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-16">
          <h2 className="text-balance text-2xl sm:text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Beneficios reales para tu clínica
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-8 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-xl sm:rounded-2xl border border-border bg-card p-4 sm:p-8 text-center transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-2 sm:mb-3 text-3xl sm:text-5xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
