'use client';

import { useState } from 'react';
import { COMPLETE_PLANS } from '@/lib/pricing-config';
import { formatPrice } from '@/lib/pricing-config';

interface PlanSelectionProps {
  onNext: (selection: { key: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA'; billingInterval: 'monthly' | 'yearly' }) => void;
  initialSelection?: { key: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA'; billingInterval: 'monthly' | 'yearly' };
}

export function PlanSelection({ onNext, initialSelection }: PlanSelectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<'PROFESIONAL' | 'CLINICA' | 'EMPRESA'>(initialSelection?.key || 'CLINICA');
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
    initialSelection?.billingInterval || 'monthly'
  );

  const plans = Object.values(COMPLETE_PLANS);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          Elige tu plan
        </h2>
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-400">
          30 días gratis en todos los planes • Sin tarjeta de crédito
        </p>
      </div>

      {/* Billing interval toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-3 md:px-4 py-2 rounded-md transition-all text-sm md:text-base ${
              billingInterval === 'monthly'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-3 md:px-4 py-2 rounded-md transition-all text-sm md:text-base ${
              billingInterval === 'yearly'
                ? 'bg-white dark:bg-gray-700 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            Anual (20% off)
          </button>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.key}
            onClick={() => setSelectedPlan(plan.key as 'PROFESIONAL' | 'CLINICA' | 'EMPRESA')}
            className={`relative rounded-lg border-2 p-4 md:p-6 cursor-pointer transition-all ${
              selectedPlan === plan.key
                ? 'border-[#75a99c] bg-[#75a99c]/5'
                : 'border-gray-200 dark:border-gray-700'
            } ${plan.popular ? 'ring-2 ring-[#75a99c]' : ''}`}
          >
            {plan.badge && (
              <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
                {plan.badge}
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {plan.name}
            </h3>
            
            <div className="mt-4">
              <span className="text-2xl md:text-3xl font-bold">
                {formatPrice(
                  billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
                )}
              </span>
              <span className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                /{billingInterval === 'yearly' ? 'mes' : 'mes'}
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {plan.description}
            </p>

            <ul className="mt-4 space-y-1 md:space-y-2">
              {plan.features.slice(0, 5).map((feature, idx) => (
                <li key={idx} className="flex items-start text-xs md:text-sm">
                  <span className="mr-2 flex-shrink-0">{feature.included ? '✅' : '❌'}</span>
                  <span className={`${feature.highlight ? 'font-semibold' : ''} leading-tight`}>
                    {feature.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNext({ key: selectedPlan, billingInterval })}
        className="w-full py-3 px-4 bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg font-medium transition-all text-sm md:text-base"
      >
        Continuar
      </button>
    </div>
  );
} 