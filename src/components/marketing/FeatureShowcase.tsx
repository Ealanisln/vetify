import React from 'react';
import { ChevronRight, Calendar, File, Users, LineChart, ShoppingCart, Bell } from 'lucide-react';
import Link from 'next/link';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, accent }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all">
      <div className={`p-3 rounded-lg mb-4 inline-flex ${accent}`}>
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm flex-grow">{description}</p>
    </div>
  );
};

const features = [
  {
    icon: <Calendar className="h-6 w-6 text-blue-600" />,
    title: "Agenda Inteligente",
    description: "Gestiona citas con múltiples doctores, envía recordatorios automáticos y reduce faltas en un 40%.",
    accent: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: <File className="h-6 w-6 text-purple-600" />,
    title: "Expedientes Digitales",
    description: "Historial médico completo, radiografías, laboratorios y vacunas en un solo lugar, accesible con un clic.",
    accent: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon: <Users className="h-6 w-6 text-pink-600" />,
    title: "Gestión de Pacientes",
    description: "Base de datos completa de pacientes con seguimiento de tratamientos, recordatorios y alertas automáticas.",
    accent: "bg-pink-50 dark:bg-pink-900/20",
  },
  {
    icon: <ShoppingCart className="h-6 w-6 text-emerald-600" />,
    title: "Inventario y Facturación",
    description: "Control de medicamentos, alimentos y productos con alertas de stock bajo y facturación integrada.",
    accent: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    icon: <LineChart className="h-6 w-6 text-amber-600" />,
    title: "Análisis y Reportes",
    description: "Dashboards con métricas de rendimiento, ingresos, servicios más solicitados y tendencias de crecimiento.",
    accent: "bg-amber-50 dark:bg-amber-900/20",
  },
  {
    icon: <Bell className="h-6 w-6 text-indigo-600" />,
    title: "Notificaciones Automáticas",
    description: "Comunicación fluida con clientes mediante SMS y correos automatizados para recordatorios y seguimientos.",
    accent: "bg-indigo-50 dark:bg-indigo-900/20",
  },
];

export const FeatureShowcase: React.FC = () => {
  return (
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-vetify-accent-100 blur-3xl opacity-30 dark:opacity-10"></div>
        <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-vetify-primary-100 blur-3xl opacity-20 dark:opacity-5"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Todo lo que tu <span className="text-vetify-accent-500 dark:text-vetify-accent-300">clínica veterinaria</span> necesita
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Diseñado por veterinarios para veterinarios, con las herramientas esenciales para hacer crecer tu negocio y mejorar la atención a tus pacientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              accent={feature.accent}
            />
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/precios" className="inline-flex items-center px-6 py-3 bg-vetify-accent-500 hover:bg-vetify-accent-600 dark:bg-vetify-accent-600 dark:hover:bg-vetify-accent-700 rounded-xl text-white font-medium transition-all">
            Ver planes y precios <ChevronRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeatureShowcase; 