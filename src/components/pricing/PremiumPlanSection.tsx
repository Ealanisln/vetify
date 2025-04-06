import React from 'react';
import { Check } from 'lucide-react';

const DUMMY_FUTURE_PREMIUM_FEATURES = [
  'Portal del Cliente',
  'Integración con Laboratorios',
  'Marketing Automatizado',
  'Facturación Electrónica CFDI',
  'Reportes Financieros Avanzados',
  'API para Integraciones',
];

export const PremiumPlanSection: React.FC = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 mb-16 text-center">
      <h3 className="text-xl font-display font-bold text-gray-800 dark:text-gray-100 mb-3">
        Próximamente: Plan Premium
      </h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-6">
        Estamos trabajando en un plan más potente para hospitales veterinarios y cadenas de clínicas con características avanzadas como:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {DUMMY_FUTURE_PREMIUM_FEATURES.map((feature, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm dark:shadow-none text-left border border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-teal-500 dark:text-teal-400 mr-2 flex-shrink-0" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <button className="px-6 py-2.5 text-sm font-medium rounded-xl text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 dark:ring-offset-gray-900">
          Solicitar Acceso Anticipado
        </button>
      </div>
    </div>
  );
}; 