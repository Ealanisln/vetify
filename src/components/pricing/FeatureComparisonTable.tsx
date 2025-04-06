import React from 'react';
import { Check, X } from 'lucide-react';
import { FeatureComparisonTableProps, PlanType } from './types';

export const FeatureComparisonTable: React.FC<FeatureComparisonTableProps> = ({ plans }) => {
  const getFeatureValue = (feature: any, planType: PlanType) => {
    switch (planType) {
      case PlanType.BASIC:
        return feature.basic;
      case PlanType.STANDARD:
        return feature.standard;
      default:
        return false;
    }
  };

  const renderFeatureDisplay = (value: string | number | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto" />
      ) : (
        <X className="w-6 h-6 text-gray-400 dark:text-gray-500 mx-auto" />
      );
    }
    if (typeof value === 'string' && value.includes('/mes')) {
      const [number, period] = value.split('/');
      return (
        <div className="flex items-baseline space-x-0.5 justify-center w-full whitespace-nowrap">
          <span className="text-base font-medium text-gray-800 dark:text-gray-200">{number}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">/{period}</span>
        </div>
      );
    }
    return <span className="text-base text-gray-700 dark:text-gray-300">{value}</span>;
  };

  const allFeatures = plans[0]?.features ?? [];

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th
              scope="col"
              className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-2/5"
            >
              Característica
            </th>
            {plans.map((plan) => (
              <th
                key={plan.type}
                scope="col"
                className="px-6 py-4 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-[30%]"
              >
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {allFeatures.map((feature, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}>
              <td className="px-6 py-5 align-middle">
                <div className="flex flex-col">
                  <div className="text-base font-medium text-gray-800 dark:text-gray-200">{feature.name}</div>
                  {feature.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{feature.description}</div>
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
  );
}; 