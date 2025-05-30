import React from 'react';
import { Check, X, Star, Zap, Crown } from 'lucide-react';
import { PricingCardProps, PlanType, Plan, PlanFeature } from './types';

const MAIN_FEATURES_NAMES = [
  'Mascotas',
  'Veterinarios',
  'WhatsApp Básico',
  'Automatización Completa',
  'Soporte',
];

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  billingCycle,
  onSelectPlan,
}) => {
  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    if (plan.type === PlanType.FREE) return 0;
    
    if (billingCycle === 'monthly') {
      return plan.pricing.monthlyWithDiscount || plan.pricing.monthly;
    } else {
      return plan.pricing.annualWithDiscount || plan.pricing.annual;
    }
  };

  const getOriginalPrice = () => {
    if (plan.type === PlanType.FREE) return 0;
    
    if (billingCycle === 'monthly') {
      return plan.pricing.monthly;
    } else {
      return plan.pricing.annual;
    }
  };

  const hasDiscount = () => {
    const current = getCurrentPrice();
    const original = getOriginalPrice();
    return current < original;
  };

  const getDiscountPercentage = () => {
    if (!hasDiscount()) return 0;
    const current = getCurrentPrice();
    const original = getOriginalPrice();
    return Math.round(((original - current) / original) * 100);
  };

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
        <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
      ) : (
        <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      );
    }
    if (typeof value === 'number') {
      return <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{value.toLocaleString()}</span>;
    }
    
    return <span className="text-sm text-gray-600 dark:text-gray-300">{value}</span>;
  };

  const getMainFeatures = (plan: Plan) => {
    return plan.features.filter((feature) => MAIN_FEATURES_NAMES.includes(feature.name)).slice(0, 5);
  };

  const getCardBorderStyle = () => {
    if (plan.type === PlanType.FREE) {
      return 'border-2 border-green-200 dark:border-green-700 bg-green-50/50 dark:bg-green-900/10';
    }
    if (plan.isPopular || plan.recommended) {
      return 'border-2 border-blue-400 dark:border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-xl';
    }
    if (plan.type === PlanType.PREMIUM) {
      return 'border-2 border-purple-300 dark:border-purple-600 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20';
    }
    return 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600';
  };

  return (
    <div className={`relative flex flex-col h-full p-6 overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl ${getCardBorderStyle()}`}>
      {/* Badge */}
      {(plan.badge || plan.isPopular) && (
        <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
          {plan.type === PlanType.FREE && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
              GRATIS
            </span>
          )}
          {plan.isPopular && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Star className="w-3 h-3 mr-1" /> MÁS POPULAR
            </span>
          )}
          {plan.type === PlanType.PREMIUM && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
              <Crown className="w-3 h-3 mr-1" /> EMPRESARIAL
            </span>
          )}
        </div>
      )}

      {/* Plan Header */}
      <div className="flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {plan.description}
          </p>
        </div>

        {/* Pricing */}
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatPrice(getCurrentPrice())}
            </span>
            {plan.type !== PlanType.FREE && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                /{billingCycle === 'monthly' ? 'mes' : 'año'}
              </span>
            )}
          </div>
          
          {/* Discount indicator */}
          {hasDiscount() && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                <Zap className="w-3 h-3 mr-1" />
                {getDiscountPercentage()}% OFF
              </span>
              <div className="text-sm text-gray-500 dark:text-gray-400 line-through mt-1">
                {formatPrice(getOriginalPrice())}
              </div>
            </div>
          )}

          {/* Annual savings */}
          {billingCycle === 'annual' && plan.type !== PlanType.FREE && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Ahorras {formatPrice((plan.pricing.monthly * 12) - getCurrentPrice())} al año
            </p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          {getMainFeatures(plan).map((feature, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {renderFeatureDisplay(getFeatureValue(feature, plan.type))}
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {feature.name}: {typeof getFeatureValue(feature, plan.type) === 'boolean' 
                    ? '' 
                    : renderFeatureDisplay(getFeatureValue(feature, plan.type))
                  }
                </span>
              </div>
            </div>
          ))}
          
          {/* Show more features count */}
          {plan.features.length > 5 && (
            <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
              +{plan.features.length - 5} características más
            </div>
          )}
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-auto">
        <button
          onClick={() => onSelectPlan(plan.type, billingCycle)}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
            plan.type === PlanType.FREE
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
              : plan.isPopular || plan.recommended
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
              : plan.type === PlanType.PREMIUM
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'
              : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 shadow-lg hover:shadow-xl'
          }`}
        >
          {plan.type === PlanType.FREE 
            ? 'Comenzar Gratis' 
            : hasDiscount()
            ? `Aprovechar Oferta`
            : 'Comenzar Prueba'
          }
        </button>
        
        {plan.type !== PlanType.FREE && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Sin tarjeta de crédito • Cancela cuando quieras
          </p>
        )}
      </div>
    </div>
  );
}; 