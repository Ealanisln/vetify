import React from 'react';
import { BillingCycleToggleProps } from './types';

export const BillingCycleToggle: React.FC<BillingCycleToggleProps> = ({
  billingCycle,
  onBillingCycleChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center mt-6 sm:mt-8 space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-gray-700 rounded-full w-full sm:w-auto max-w-xs">
        <button
          type="button"
          onClick={() => onBillingCycleChange('monthly')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-all ${
            billingCycle === 'monthly'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Mensual
        </button>
        <button
          type="button"
          onClick={() => onBillingCycleChange('annual')}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-sm font-medium rounded-full transition-all ${
            billingCycle === 'annual'
              ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-700 dark:text-gray-200'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Anual
        </button>
      </div>
      {billingCycle === 'annual' && (
        <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-300">
          Ahorra hasta 20%
        </span>
      )}
    </div>
  );
}; 