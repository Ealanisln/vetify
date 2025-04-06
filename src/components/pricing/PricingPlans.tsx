import React, { useState } from 'react';
import { PricingPlansProps, PlanType } from './types';
import { BillingCycleToggle } from './BillingCycleToggle';
import { PricingCard } from './PricingCard';
import { FeatureComparisonTable } from './FeatureComparisonTable';
import { PremiumPlanSection } from './PremiumPlanSection';
import { FAQSection } from './FAQSection';

const DUMMY_PLANS = [
  {
    type: PlanType.BASIC,
    name: 'Plan Básico',
    description: 'Ideal para clínicas pequeñas o que recién comienzan.',
    pricing: { monthly: 599, annual: 379 },
    features: [
      { name: 'Usuarios Staff', description: 'Colaboradores con acceso al sistema.', basic: 3, standard: 10 },
      { name: 'Mascotas Activas', description: 'Pacientes registrados en el sistema.', basic: 500, standard: 1500 },
      { name: 'Administración de Inventario', description: 'Control de stock de productos.', basic: true, standard: true },
      { name: 'Agenda Multi-Doctor', description: 'Gestiona citas para varios doctores.', basic: false, standard: true },
      { name: 'Reportes Básicos', description: 'Informes esenciales de la clínica.', basic: true, standard: true },
      { name: 'Recordatorios SMS', description: 'Envío de recordatorios de citas.', basic: '50/mes', standard: '150/mes' },
      { name: 'Soporte por Email', description: 'Ayuda vía correo electrónico.', basic: true, standard: true },
      { name: 'Historial Clínico Digital', description: 'Registro detallado de pacientes.', basic: true, standard: true },
    ],
    recommended: false,
  },
  {
    type: PlanType.STANDARD,
    name: 'Plan Estándar',
    description: 'Perfecto para clínicas en crecimiento con más personal.',
    pricing: { monthly: 999, annual: 799 },
    features: [
      { name: 'Usuarios Staff', description: 'Colaboradores con acceso al sistema.', basic: 3, standard: 10 },
      { name: 'Mascotas Activas', description: 'Pacientes registrados en el sistema.', basic: 500, standard: 1500 },
      { name: 'Administración de Inventario', description: 'Control de stock de productos.', basic: true, standard: true },
      { name: 'Agenda Multi-Doctor', description: 'Gestiona citas para varios doctores.', basic: false, standard: true },
      { name: 'Reportes Avanzados', description: 'Informes detallados y personalizables.', basic: false, standard: true },
      { name: 'Recordatorios SMS', description: 'Envío de recordatorios de citas.', basic: '50/mes', standard: '150/mes' },
      { name: 'Soporte Prioritario', description: 'Atención más rápida por email y chat.', basic: false, standard: true },
      { name: 'Historial Clínico Digital', description: 'Registro detallado de pacientes.', basic: true, standard: true },
    ],
    recommended: true,
  },
];

export const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  // const handlePremiumWaitlist = () => {
  //   // Usar un tipo "PREMIUM" para identificar que viene de la sección premium
  //   onSelectPlan(PlanType.STANDARD, billingCycle);
  // };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Lista de Espera Banner */}
      <div className="relative overflow-hidden mb-10 md:mb-14 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-500 to-indigo-500 shadow-lg">
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10 z-10"></div>
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500 rounded-full opacity-20"></div>
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-600 rounded-full opacity-20"></div>
        <div className="relative z-20 px-6 py-8 md:py-10 text-center">
          <div className="inline-block px-4 py-1 mb-3 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
            ¡Próximamente!
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Únete a nuestra lista de espera
          </h3>
          <p className="text-white/90 text-base md:text-lg mb-4">
            Estamos preparando el lanzamiento de nuestro sistema. Déjanos tus datos para ser de los primeros en tener acceso.
          </p>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-gray-800 dark:text-amber-300 sm:text-4xl mb-3 md:mb-4">
          Planes disponibles para clínicas veterinarias
        </h2>
        <p className="mt-2 md:mt-3 max-w-2xl mx-auto text-base md:text-lg text-gray-600 dark:text-gray-300 sm:mt-4">
          Estos son los precios oficiales que estarán disponibles en el lanzamiento
        </p>

        <BillingCycleToggle
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16 max-w-5xl mx-auto">
        {DUMMY_PLANS.map((plan) => (
          <PricingCard
            key={plan.type}
            plan={plan}
            billingCycle={billingCycle}
            onSelectPlan={onSelectPlan}
            isWaitlist={true}
          />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="mb-12 md:mb-16">
        <h3 className="text-xl md:text-2xl font-display font-bold text-gray-800 dark:text-gray-100 text-center mb-6 md:mb-8">
          Comparación detallada de características
        </h3>
        <FeatureComparisonTable plans={DUMMY_PLANS} />
      </div>

      {/* Premium Plan Section */}
      <PremiumPlanSection />

      {/* FAQ Section */}
      <FAQSection />
    </div>
  );
}; 