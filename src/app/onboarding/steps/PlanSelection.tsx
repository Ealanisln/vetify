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
    <div className="space-y-4 md:space-y-6 lg:space-y-8 px-4 lg:px-6 xl:px-8">
      <div className="text-center">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Elige tu plan
        </h2>
        <p className="mt-2 text-sm md:text-base lg:text-lg text-gray-600 dark:text-gray-400">
          30 días gratis en todos los planes • Sin tarjeta de crédito
        </p>
      </div>

      {/* Billing interval toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg inline-flex shadow-md">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-3 md:px-4 lg:px-6 py-2 lg:py-3 rounded-md transition-all text-sm md:text-base font-medium ${
              billingInterval === 'monthly'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setBillingInterval('yearly')}
            className={`px-3 md:px-4 lg:px-6 py-2 lg:py-3 rounded-md transition-all text-sm md:text-base font-medium ${
              billingInterval === 'yearly'
                ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Anual (20% off)
          </button>
        </div>
      </div>

      {/* Vista móvil: Tarjetas apiladas */}
      <div className="block md:hidden">
        <div className="space-y-4">
          {plans.map((plan) => (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key as 'PROFESIONAL' | 'CLINICA' | 'EMPRESA')}
              className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedPlan === plan.key
                  ? 'border-[#75a99c] bg-[#75a99c]/5 shadow-md scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#75a99c]/50'
              } ${plan.popular ? 'ring-2 ring-[#75a99c] shadow-[#75a99c]/20 shadow-md' : ''}`}
            >
              {plan.badge && (
                <div className={`absolute -top-2 left-4 px-2 py-1 rounded-full text-xs font-semibold ${plan.badgeColor} shadow-sm`}>
                  {plan.badge}
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 text-center">
                {plan.name}
              </h3>
              
              <div className="mb-3 text-center">
                <span className="text-2xl font-bold text-[#75a99c]">
                  {formatPrice(
                    billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
                  )}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1 block sm:inline">
                  /{billingInterval === 'yearly' ? 'año' : 'mes'}
                </span>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center leading-relaxed">
                {plan.description}
              </p>

              <ul className="space-y-2">
                {plan.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex items-start text-xs">
                    <span className="mr-2 flex-shrink-0 text-sm">{feature.included ? '✅' : '❌'}</span>
                    <span className={`${feature.highlight ? 'font-semibold text-[#75a99c]' : 'text-gray-700 dark:text-gray-300'} leading-relaxed`}>
                      {feature.name}
                    </span>
                  </li>
                ))}
                {plan.features.length > 4 && (
                  <li className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                    +{plan.features.length - 4} características más
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Vista desktop: Grid de 3 columnas */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key as 'PROFESIONAL' | 'CLINICA' | 'EMPRESA')}
              className={`relative rounded-xl lg:rounded-2xl border-2 p-4 lg:p-6 xl:p-8 cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 ${
                selectedPlan === plan.key
                  ? 'border-[#75a99c] bg-[#75a99c]/5 shadow-lg scale-105'
                  : 'border-gray-200 dark:border-gray-700 hover:border-[#75a99c]/50'
              } ${plan.popular ? 'ring-2 ring-[#75a99c] shadow-[#75a99c]/20 shadow-lg' : ''} h-full flex flex-col`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs lg:text-sm font-semibold ${plan.badgeColor} shadow-md`}>
                  {plan.badge}
                </div>
              )}

              <div className="flex-grow">
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 lg:mb-4 text-center">
                  {plan.name}
                </h3>
                
                <div className="mb-3 lg:mb-4 text-center">
                  <span className="text-2xl lg:text-3xl font-bold text-[#75a99c]">
                    {formatPrice(
                      billingInterval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
                    )}
                  </span>
                  <span className="text-sm lg:text-base text-gray-500 dark:text-gray-400 ml-1 block lg:inline">
                    /{billingInterval === 'yearly' ? 'año' : 'mes'}
                  </span>
                </div>

                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mb-4 lg:mb-6 text-center leading-relaxed">
                  {plan.description}
                </p>

                <ul className="space-y-2 lg:space-y-3 mb-6 lg:mb-8">
                  {plan.features.slice(0, 5).map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm lg:text-base">
                      <span className="mr-3 flex-shrink-0 text-base">{feature.included ? '✅' : '❌'}</span>
                      <span className={`${feature.highlight ? 'font-semibold text-[#75a99c]' : 'text-gray-700 dark:text-gray-300'} leading-relaxed`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <button
          onClick={() => onNext({ key: selectedPlan, billingInterval })}
          className="w-full py-3 lg:py-4 px-4 lg:px-6 bg-[#75a99c] hover:bg-[#5b9788] text-white rounded-lg lg:rounded-xl font-medium lg:font-semibold transition-all duration-300 text-sm md:text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95"
        >
          Continuar
        </button>
      </div>
    </div>
  );
} 