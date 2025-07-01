import React from 'react';
import { Clock, DollarSign, Smile, ChartBar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent: string;
}

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, label, accent }) => {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`p-3 rounded-full mb-4 inline-flex ${accent}`}>
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm">{label}</p>
    </div>
  );
};

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, role, image }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
      <div className="mb-4">
        <svg width="45" height="36" className="text-vetify-accent-300 dark:text-vetify-accent-500 mb-2" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.4 36C9.4 36 6.2 34.6 3.8 31.8C1.4 29 0.2 25.6 0.2 21.6C0.2 17.2 1.4 13 3.8 9C6.2 5 9.8 1.8 14.6 -0.399998L18.2 5.2C14.6 6.8 11.8 8.8 9.8 11.2C7.8 13.6 6.8 16.4 6.8 19.6H10.4C11.6 19.6 12.6 20 13.4 20.8C14.2 21.6 14.6 22.6 14.6 23.8V32C14.6 33.2 14.2 34.2 13.4 35C12.6 35.8 11.6 36 10.4 36H13.4ZM39.4 36C35.4 36 32.2 34.6 29.8 31.8C27.4 29 26.2 25.6 26.2 21.6C26.2 17.2 27.4 13 29.8 9C32.2 5 35.8 1.8 40.6 -0.399998L44.2 5.2C40.6 6.8 37.8 8.8 35.8 11.2C33.8 13.6 32.8 16.4 32.8 19.6H36.4C37.6 19.6 38.6 20 39.4 20.8C40.2 21.6 40.6 22.6 40.6 23.8V32C40.6 33.2 40.2 34.2 39.4 35C38.6 35.8 37.6 36 36.4 36H39.4Z" fill="currentColor"/>
        </svg>
        <p className="text-gray-700 dark:text-gray-300 text-base">{quote}</p>
      </div>
      <div className="mt-auto flex items-center">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
          {image && (
            <Image 
              src={image} 
              alt={author} 
              width={48} 
              height={48} 
              className="object-cover"
            />
          )}
        </div>
        <div className="ml-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{author}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
};

const stats = [
  {
    icon: <Clock className="h-6 w-6 text-blue-600" />,
    value: "-30%",
    label: "Reducción en tiempo administrativo",
    accent: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: <DollarSign className="h-6 w-6 text-emerald-600" />,
    value: "+20%",
    label: "Incremento en ingresos promedio",
    accent: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: <Smile className="h-6 w-6 text-amber-600" />,
    value: "95%",
    label: "De clientes satisfechos",
    accent: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: <ChartBar className="h-6 w-6 text-purple-600" />,
    value: "+40%",
    label: "Mejora en retención de clientes",
    accent: "bg-purple-50 dark:bg-purple-900/20",
  },
];

const testimonials = [
  {
    quote: "Desde que implementamos Vetify, hemos reducido nuestro tiempo administrativo en un 35% y aumentado la satisfacción de nuestros clientes, quienes aprecian los recordatorios automáticos.",
    author: "Dra. Claudia Mendoza",
    role: "Directora de Clínica Patitas",
    image: "/testimonials/testimonial-1.jpg", 
  },
  {
    quote: "El sistema de expedientes digitales nos permite acceder al historial completo de cada paciente en segundos. La mejora en eficiencia y precisión diagnóstica ha sido notable.",
    author: "Dr. Miguel Sánchez",
    role: "Veterinario en Hospital Mascotas",
    image: "/testimonials/testimonial-2.jpg", 
  },
  {
    quote: "Nuestra facturación ha mejorado un 15% gracias al control de inventario y citas que nos ofrece Vetify. ¡La mejor inversión que hemos hecho para nuestra clínica!",
    author: "Lic. Ana Torres",
    role: "Administradora de VetCenter",
    image: "/testimonials/testimonial-3.jpg", 
  },
];

export const BenefitsSection: React.FC = () => {
  return (
    <section className="relative py-16 lg:py-24 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Beneficios reales para tu <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Nuestros clientes han experimentado mejoras significativas en su operación diaria, 
            atención al cliente y resultados financieros.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              accent={stat.accent}
            />
          ))}
        </div>

        {/* Imagen en dispositivos */}
        <div className="relative mb-16">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-gray-800 p-2 md:p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-vetify-accent-500/30 to-transparent dark:from-vetify-accent-500/10 z-0 opacity-30"></div>
              <div className="relative z-10">
                <Image
                  src="/dashboard-devices.png"
                  alt="Vetify en múltiples dispositivos"
                  width={1200}
                  height={675}
                  className="rounded-lg w-full h-auto"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 lg:w-32 lg:h-32 bg-vetify-accent-100 dark:bg-vetify-accent-900/30 rounded-full blur-2xl z-0"></div>
            </div>
          </div>
        </div>

        {/* Testimoniales */}
        <div className="max-w-3xl mx-auto text-center mb-8 lg:mb-10">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Lo que dicen nuestros clientes
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Historias reales de clínicas veterinarias que han transformado su negocio con Vetify
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testimonials.map((testimonial, index) => (
            <Testimonial
              key={index}
              quote={testimonial.quote}
              author={testimonial.author}
              role={testimonial.role}
              image={testimonial.image}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <Link href="/registro" className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all">
            Comenzar prueba gratuita
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection; 