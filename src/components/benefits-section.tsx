export function BenefitsSection() {
  const stats = [
    { label: "Reducción en tiempo administrativo", value: "-30%" },
    { label: "Incremento en ingresos promedio", value: "+20%" },
    { label: "Clientes satisfechos", value: "95%" },
    { label: "Mejora en retención de clientes", value: "+40%" },
  ]

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Beneficios reales para tu clínica
          </h2>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl border border-border bg-card p-8 text-center transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-3 text-5xl font-bold text-primary">{stat.value}</div>
              <div className="text-sm font-medium text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
