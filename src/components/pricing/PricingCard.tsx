import React from 'react';
import { Check, X, Star } from 'lucide-react';
import { PricingCardProps, PlanType, Plan, PlanFeature } from './types';

const MAIN_FEATURES_NAMES = [
  'Usuarios Staff',
  'Mascotas Activas',
  'Agenda Multi-Doctor',
  'Recordatorios SMS',
];

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  onSelectPlan,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Calculamos el precio con descuento (25% off)
  const getDiscountedPrice = (price: number) => {
    return price * 0.75; // 25% de descuento
  };

  const getFeatureValue = (feature: PlanFeature, planType: PlanType) => {
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
        <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
      ) : (
        <X className="w-6 h-6 text-gray-400 dark:text-gray-500" />
      );
    }
    if (typeof value === 'number') {
      return <span className="text-base font-medium text-gray-800 dark:text-gray-200">{value}</span>;
    }
    
    // Para valores de SMS, formateamos especialmente
    if (typeof value === 'string' && value.includes('/mes')) {
      return (
        <span className="font-medium text-gray-800 dark:text-gray-200">{value.split('/')[0]}</span>
      );
    }
    
    return <span className="text-base text-gray-600 dark:text-gray-300">{value}</span>;
  };

  const getMainFeatures = (plan: Plan) => {
    return plan.features.filter((feature) => MAIN_FEATURES_NAMES.includes(feature.name));
  };

  return (
    <div
      className={`relative flex flex-col h-full p-4 sm:p-6 md:p-8 overflow-hidden rounded-2xl transition-all ${
        plan.recommended
          ? 'border-2 border-teal-400 bg-white dark:bg-gray-800 shadow-card dark:shadow-none'
          : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-smooth hover:shadow-card dark:shadow-none'
      }`}
    >
      {plan.recommended && (
        <div className="absolute top-0 right-0 mt-3 sm:mt-4 mr-3 sm:mr-4 z-10">
          <span className="inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300">
            <Star className="w-3 h-3 mr-1" /> Recomendado
          </span>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-display font-bold text-gray-800 dark:text-gray-100 mb-2">
          {plan.name}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{plan.description}</p>
      </div>

      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col">
          <div className="flex items-baseline">
            {/* Precio original tachado */}
            <span className="text-xl sm:text-2xl font-bold text-gray-400 dark:text-gray-500 line-through mr-2">
              {formatPrice(plan.pricing[billingCycle])}
            </span>
            {/* Nuevo precio con descuento */}
            <span className="text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-300">
              {formatPrice(getDiscountedPrice(plan.pricing[billingCycle]))}
            </span>
            <span className="ml-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
              MXN /mes
            </span>
          </div>
          <div className="mt-1 inline-flex items-center px-2 py-1 rounded-md bg-teal-50 dark:bg-teal-900/20">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
              ¡25% de descuento aplicado!
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {billingCycle === 'annual'
              ? `Facturado anualmente como ${formatPrice(getDiscountedPrice(plan.pricing.annual * 12))}`
              : `Total ${formatPrice(getDiscountedPrice(plan.pricing.monthly))} al mes, facturado mensualmente`}
          </p>
          {billingCycle === 'annual' && (
            <p className="mt-1 text-xs sm:text-sm text-teal-600 dark:text-teal-300 font-medium">
              ¡Ahorras {formatPrice((plan.pricing.monthly - plan.pricing.annual) * 12 * 0.75 + plan.pricing[billingCycle] * 0.25)} al año!
            </p>
          )}
        </div>
      </div>

      <div className="flex-grow mb-6 sm:mb-8">
        <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 mb-4">Incluye:</p>
        <ul className="space-y-4">
          {getMainFeatures(plan).map((feature: PlanFeature, index: number) => {
            const value = getFeatureValue(feature, plan.type);
            return (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                  {renderFeatureDisplay(value)}
                </div>
                <div className="ml-3 flex-grow">
                  <p className="text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200">{feature.name}</p>
                  {feature.description && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => onSelectPlan(plan.type, billingCycle)}
        className={`w-full py-3 px-4 rounded-xl text-base font-medium transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 dark:ring-offset-gray-800 ${
          plan.recommended
            ? 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-400 dark:bg-teal-600 dark:hover:bg-teal-700'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        Comenzar con {plan.name}
      </button>
    </div>
  );
}; 