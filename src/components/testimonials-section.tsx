import { Card, CardContent } from "@/components/ui/card"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote:
      "Desde que implementamos Vetify, hemos reducido nuestro tiempo administrativo en un 35% y aumentado la satisfacción de nuestros clientes, quienes aprecian los recordatorios automáticos.",
    author: "Dra. Claudia Mendoza",
    position: "Directora de Clínica Patitas",
  },
  {
    quote:
      "El sistema de expedientes digitales nos permite acceder al historial completo de cada paciente en segundos. La mejora en eficiencia y precisión diagnóstica ha sido notable.",
    author: "Dr. Miguel Sánchez",
    position: "Veterinario en Hospital Mascotas",
  },
  {
    quote:
      "Nuestra facturación ha mejorado un 15% gracias al control de inventario y citas que nos ofrece Vetify. ¡La mejor inversión que hemos hecho para nuestra clínica!",
    author: "Lic. Ana Torres",
    position: "Administradora de VetCenter",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-border bg-card transition-shadow hover:shadow-lg">
              <CardContent className="p-8">
                <Quote className="mb-4 h-8 w-8 text-primary/30" />
                <p className="mb-6 text-pretty text-muted-foreground">{testimonial.quote}</p>
                <div className="border-t border-border pt-4">
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.position}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
