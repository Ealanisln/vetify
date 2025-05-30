import React from 'react';
import { BillingCycleToggleProps } from './types';

export const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl shadow-lg">
        <button
          type="button"
          onClick={() => onBillingCycleChange('monthly')}
          className={`relative px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            billingCycle === 'monthly'
              ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Mensual
          {billingCycle === 'monthly' && (
            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold bg-yellow-400 text-yellow-900 rounded-full">
              25% OFF
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onBillingCycleChange('annual')}
          className={`relative px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
            billingCycle === 'annual'
              ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Anual
          {billingCycle === 'annual' && (
            <span className="absolute -top-2 -right-2 px-2 py-1 text-xs font-bold bg-green-400 text-green-900 rounded-full">
              35% OFF
            </span>
          )}
        </button>
      </div>
      
      <div className="text-center">
        {billingCycle === 'annual' ? (
          <div className="space-y-1">
            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
              🎉 Ahorra hasta 35% + 2 meses gratis
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Oferta especial de lanzamiento
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
              🚀 Descuento del 25% aplicado
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sin permanencia mínima
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 