'use client';

import { COMPLETE_PLANS } from '@/lib/pricing-config';
import { formatPrice } from '@/lib/pricing-config';

interface ConfirmationProps {
  plan: {
    key: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
    billingInterval: 'monthly' | 'yearly';
  };
  clinicInfo: {
    clinicName: string;
    slug: string;
    phone?: string;
    address?: string;
  };
  onBack: () => void;
  isSubmitting: boolean;
  onSubmit: () => Promise<void>;
}

export function Confirmation({ plan, clinicInfo, onBack, isSubmitting, onSubmit }: ConfirmationProps) {
  const selectedPlan = COMPLETE_PLANS[plan.key];
  const price = plan.billingInterval === 'yearly' ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Confirma tu configuración
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
          Revisa los detalles antes de crear tu clínica
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Plan seleccionado
          </h3>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {selectedPlan.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedPlan.description}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatPrice(price)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  /{plan.billingInterval === 'yearly' ? 'mes' : 'mes'}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✅ 30 días gratis • Sin tarjeta de crédito
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Información de la clínica
          </h3>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-20">Nombre:</span>
              <span className="text-gray-900 dark:text-gray-100">{clinicInfo.clinicName}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-20">URL:</span>
              <span className="text-gray-900 dark:text-gray-100">vetify.app/{clinicInfo.slug}</span>
            </div>
            {clinicInfo.phone && (
              <div className="flex flex-col sm:flex-row sm:items-center">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-20">Teléfono:</span>
                <span className="text-gray-900 dark:text-gray-100">{clinicInfo.phone}</span>
              </div>
            )}
            {clinicInfo.address && (
              <div className="flex flex-col sm:flex-row sm:items-start">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 sm:w-20">Dirección:</span>
                <span className="text-gray-900 dark:text-gray-100">{clinicInfo.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                ¿Qué incluye tu prueba gratuita?
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Acceso completo a todas las funciones del plan {selectedPlan.name}</li>
                  <li>30 días sin costo y sin compromiso</li>
                  <li>Sin tarjeta de crédito requerida</li>
                  <li>Puedes cancelar en cualquier momento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full sm:flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
        >
          Atrás
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full sm:flex-1 py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando clínica...
            </div>
          ) : (
            'Crear mi clínica'
          )}
        </button>
      </div>
    </div>
  );
} 