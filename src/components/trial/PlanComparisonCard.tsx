'use client';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Check,
  Crown,
  Building,
  Users,
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanLimits {
  pets: number;
  users: number;
  whatsappMessages: number;
}

export interface PlanPricing {
  monthly: number;
  annual: number;
}

export interface PlanComparisonCardProps {
  planKey: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
  name: string;
  description: string;
  pricing: PlanPricing;
  features: PlanFeature[];
  limits?: PlanLimits;
  popular?: boolean;
  recommended?: boolean;
  currentPlan?: boolean;
  disabled?: boolean;
  billingInterval: 'monthly' | 'annual';
  onSelect: (planKey: string, interval: 'monthly' | 'annual') => void;
  isLoading?: boolean;
}

const PLAN_ICONS = {
  PROFESIONAL: Crown,
  CLINICA: Building,
  EMPRESA: Users
} as const;

const PLAN_COLORS = {
  PROFESIONAL: {
    badge: 'bg-green-100 text-green-800 border-green-200',
    icon: 'text-green-600',
    button: 'bg-green-600 hover:bg-green-700',
    border: 'border-green-200',
    accent: 'text-green-600'
  },
  CLINICA: {
    badge: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: 'text-orange-600',
    button: 'bg-orange-600 hover:bg-orange-700',
    border: 'border-orange-200',
    accent: 'text-orange-600'
  },
  EMPRESA: {
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: 'text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
    border: 'border-purple-200',
    accent: 'text-purple-600'
  }
} as const;

export function PlanComparisonCard({
  planKey,
  name,
  description,
  pricing,
  features,
  limits,
  popular = false,
  recommended = false,
  currentPlan = false,
  disabled = false,
  billingInterval,
  onSelect,
  isLoading = false
}: PlanComparisonCardProps) {
  const Icon = PLAN_ICONS[planKey];
  const colors = PLAN_COLORS[planKey];

  const price = billingInterval === 'annual' ? pricing.annual : pricing.monthly;
  const monthlyEquivalent = billingInterval === 'annual' ? pricing.annual / 12 : pricing.monthly;

  // Calculate savings for annual billing
  const annualSavings = pricing.monthly * 12 - pricing.annual;
  const savingsPercentage = Math.round((annualSavings / (pricing.monthly * 12)) * 100);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card
      className={cn(
        'relative p-6 transition-all duration-200',
        popular && 'ring-2 ring-orange-500 shadow-lg scale-105',
        recommended && !popular && 'ring-2 ring-blue-500',
        currentPlan && 'opacity-75',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Header badges */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
        {popular && (
          <Badge className="bg-orange-500 text-white border-orange-600">
            <Sparkles className="h-3 w-3 mr-1" />
            MÁS POPULAR
          </Badge>
        )}
        {recommended && !popular && (
          <Badge className="bg-blue-500 text-white border-blue-600">
            RECOMENDADO
          </Badge>
        )}
        {currentPlan && (
          <Badge variant="outline" className="bg-gray-100">
            Plan Actual
          </Badge>
        )}
      </div>

      {/* Plan icon and name */}
      <div className="flex items-start justify-between mb-4 mt-2">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg bg-gray-50', colors.icon)}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{name}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">
            {formatPrice(billingInterval === 'annual' ? monthlyEquivalent : price)}
          </span>
          <span className="text-gray-600">
            {billingInterval === 'annual' ? '/mes' : '/mes'}
          </span>
        </div>

        {billingInterval === 'annual' && (
          <div className="mt-2">
            <Badge variant="outline" className={colors.badge}>
              <Zap className="h-3 w-3 mr-1" />
              Ahorra {savingsPercentage}% ({formatPrice(annualSavings)} al año)
            </Badge>
            <p className="text-xs text-gray-500 mt-1">
              Facturado anualmente: {formatPrice(price)}
            </p>
          </div>
        )}
      </div>

      {/* Limits summary (if provided) */}
      {limits && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-600">Mascotas</p>
              <p className="font-semibold">
                {limits.pets === -1 ? 'Ilimitadas' : limits.pets.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Usuarios</p>
              <p className="font-semibold">{limits.users}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">WhatsApp</p>
              <p className="font-semibold">Ilimitado</p>
            </div>
          </div>
        </div>
      )}

      {/* Features list */}
      <div className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-2',
              !feature.included && 'opacity-50'
            )}
          >
            <Check
              className={cn(
                'h-5 w-5 flex-shrink-0 mt-0.5',
                feature.included ? colors.accent : 'text-gray-400'
              )}
            />
            <span
              className={cn(
                'text-sm',
                feature.highlight && 'font-semibold'
              )}
            >
              {feature.name}
            </span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      <Button
        className={cn(
          'w-full',
          popular && colors.button,
          currentPlan && 'opacity-50 cursor-not-allowed'
        )}
        variant={popular ? 'default' : 'outline'}
        size="lg"
        disabled={disabled || currentPlan || isLoading}
        onClick={() => onSelect(planKey, billingInterval)}
      >
        {isLoading ? (
          'Procesando...'
        ) : currentPlan ? (
          'Plan Actual'
        ) : (
          <>
            Seleccionar {name}
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>

      {/* Additional info for annual billing */}
      {billingInterval === 'annual' && !currentPlan && (
        <p className="text-xs text-center text-gray-500 mt-3">
          Compromiso de 12 meses
        </p>
      )}
    </Card>
  );
}

/**
 * Compact version for inline comparison
 */
export function PlanComparisonCardCompact({
  planKey,
  name,
  pricing,
  billingInterval,
  currentPlan,
  onSelect,
  isLoading
}: Pick<PlanComparisonCardProps, 'planKey' | 'name' | 'pricing' | 'billingInterval' | 'currentPlan' | 'onSelect' | 'isLoading'>) {
  const Icon = PLAN_ICONS[planKey];
  const colors = PLAN_COLORS[planKey];
  const price = billingInterval === 'annual' ? pricing.annual / 12 : pricing.monthly;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 border rounded-lg',
        currentPlan && 'bg-gray-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg bg-gray-50', colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-gray-600">
            {formatPrice(price)}/mes
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant={currentPlan ? 'outline' : 'default'}
        disabled={currentPlan || isLoading}
        onClick={() => onSelect(planKey, billingInterval)}
      >
        {currentPlan ? 'Actual' : 'Seleccionar'}
      </Button>
    </div>
  );
}
