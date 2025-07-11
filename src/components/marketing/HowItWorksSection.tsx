import React from 'react';
import { LayoutDashboard, CalendarClock, FileSearch, Zap } from 'lucide-react';
import Link from 'next/link';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Step: React.FC<StepProps> = ({ number, title, description, icon }) => {
  return (
    <div className="flex items-start">
      <div className="flex-shrink-0 mr-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-vetify-accent-100 dark:bg-vetify-accent-900/30 text-vetify-accent-600 dark:text-vetify-accent-300">
          {icon}
        </div>
      </div>
      <div>
        <div className="flex items-center mb-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-vetify-primary-100 dark:bg-vetify-primary-900/30 text-vetify-primary-600 dark:text-vetify-primary-300 text-sm font-bold mr-2">
            {number}
          </span>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-base">{description}</p>
      </div>
    </div>
  );
};

const steps = [
  {
    number: 1,
    title: "Regístrate para una prueba gratuita",
    description: "Comienza con una prueba de 30 días sin compromiso y sin tarjeta de crédito. Configura tu perfil de clínica en minutos.",
    icon: <LayoutDashboard className="h-6 w-6" />,
  },
  {
    number: 2,
    title: "Configura tu clínica",
    description: "Personaliza tu agenda, servicios, productos y perfil de doctores. Importa tus clientes existentes de forma simple.",
    icon: <CalendarClock className="h-6 w-6" />,
  },
  {
    number: 3,
    title: "Gestiona tus pacientes",
    description: "Digitaliza los expedientes, crea planes de tratamiento y maneja tu inventario de manera eficiente.",
    icon: <FileSearch className="h-6 w-6" />,
  },
  {
    number: 4,
    title: "Optimiza y crece",
    description: "Analiza tus métricas, mejora la experiencia de tus clientes y aumenta la rentabilidad de tu clínica.",
    icon: <Zap className="h-6 w-6" />,
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comienza en <span className="text-vetify-accent-500 dark:text-vetify-accent-300">4 simples pasos</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Implementar Vetify en tu clínica es rápido y sencillo, sin interrumpir tu operación diaria
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
          {steps.map((step) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </div>

        <div className="mt-16 lg:mt-20 max-w-3xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-vetify-primary-50 to-transparent dark:from-vetify-primary-900/10 opacity-50 z-0"></div>
            <div className="relative z-10 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ¿Necesitas ayuda para migrar tus datos?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Nuestro equipo te ofrece asistencia personalizada para migrar tus expedientes y bases de datos existentes.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link 
                    href="/contacto" 
                    className="inline-flex whitespace-nowrap items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-xl text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-vetify-accent-500 dark:ring-offset-gray-800"
                  >
                    Contactar a soporte
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection; 