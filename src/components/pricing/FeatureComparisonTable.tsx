import React from 'react';
import { Check, X } from 'lucide-react';
import { FeatureComparisonTableProps, PlanType, PlanFeature } from './types';

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({ plans }) => {
  const getFeatureValue = (feature: PlanFeature, planType: PlanType) => {
    switch (planType) {
      case PlanType.FREE:
        return feature.free;
      case PlanType.BASIC:
        return feature.basic;
      case PlanType.PROFESSIONAL:
        return feature.professional;
      case PlanType.PREMIUM:
        return feature.premium;
      default:
        return false;
    }
  };

  const renderFeatureDisplay = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-400 dark:text-gray-500 mx-auto" />
      );
    }
    
    if (typeof value === 'number') {
      return <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value.toLocaleString()}</span>;
    }
    
    return <span className="text-sm text-gray-700 dark:text-gray-300">{value}</span>;
  };

  const allFeatures = plans[0]?.features ?? [];

  return (
    <div className="mb-16">
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Comparación completa de características
        </h3>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Encuentra el plan perfecto para tu clínica comparando todas las funcionalidades disponibles.
        </p>
      </div>
      
      <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-xl border border-gray-200 dark:border-gray-700 rounded-2xl">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <tr>
              <th
                scope="col"
                className="px-6 py-5 text-left text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider"
              >
                Característica
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.type}
                  scope="col"
                  className="px-6 py-5 text-center text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider"
                >
                  <div className="flex flex-col items-center">
                    <span>{plan.name}</span>
                    {plan.type === PlanType.FREE && (
                      <span className="mt-1 px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full font-normal">
                        Gratis
                      </span>
                    )}
                    {plan.isPopular && (
                      <span className="mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-normal">
                        Popular
                      </span>
                    )}
                    {plan.type === PlanType.PREMIUM && (
                      <span className="mt-1 px-2 py-1 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-normal">
                        Enterprise
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {allFeatures.map((feature, i) => (
              <tr 
                key={i} 
                className={`${
                  i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/20'
                } hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors`}
              >
                <td className="px-6 py-5 align-middle">
                  <div className="flex flex-col">
                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{feature.name}</div>
                    {feature.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{feature.description}</div>
                    )}
                  </div>
                </td>
                {plans.map((plan) => (
                  <td
                    key={`${plan.type}-${i}`}
                    className="px-6 py-5 text-center align-middle"
                  >
                    {renderFeatureDisplay(getFeatureValue(feature, plan.type))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* CTA after comparison */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          ¿Necesitas ayuda para elegir el plan correcto?
        </p>
        <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
          Hablar con un especialista
        </button>
      </div>
    </div>
  );
}; 