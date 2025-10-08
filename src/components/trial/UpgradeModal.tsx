'use client';

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  PlanComparisonCard,
  type PlanFeature
} from './PlanComparisonCard';
import { useUpgrade } from '@/hooks/useUpgrade';
import {
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { COMPLETE_PLANS } from '@/lib/pricing-config';

export interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlanKey?: string | null;
  isTrialPeriod?: boolean;
  preselectedPlan?: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
}

export function UpgradeModal({
  open,
  onOpenChange,
  currentPlanKey,
  isTrialPeriod = false,
  preselectedPlan
}: UpgradeModalProps) {
  const {
    upgrade,
    upgradeInfo,
    isUpgrading,
    isLoadingInfo,
    fetchUpgradeInfo,
    calculateSavingsPercentage
  } = useUpgrade();

  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(preselectedPlan || null);

  // Fetch upgrade info when modal opens
  useEffect(() => {
    if (open && !upgradeInfo) {
      fetchUpgradeInfo();
    }
  }, [open, upgradeInfo, fetchUpgradeInfo]);

  const handlePlanSelect = async (planKey: string, interval: 'monthly' | 'annual') => {
    setSelectedPlan(planKey);

    const result = await upgrade({
      targetPlan: planKey as 'PROFESIONAL' | 'CLINICA' | 'EMPRESA',
      billingInterval: interval,
      fromTrial: isTrialPeriod
    });

    if (result?.success) {
      // Close modal after successful upgrade (unless redirecting to checkout)
      if (result.type !== 'trial_conversion') {
        setTimeout(() => {
          onOpenChange(false);
        }, 1500);
      }
    }
  };

  const getPlanFeatures = (planKey: string): PlanFeature[] => {
    const plan = COMPLETE_PLANS[planKey as keyof typeof COMPLETE_PLANS];
    return plan?.features || [];
  };

  const getPlanDescription = (planKey: string): string => {
    const plan = COMPLETE_PLANS[planKey as keyof typeof COMPLETE_PLANS];
    return plan?.description || '';
  };

  // Calculate if a plan is an upgrade
  const isUpgradePlan = (planKey: string): boolean => {
    if (!upgradeInfo?.currentPlan?.key) return true;
    const planHierarchy = { PROFESIONAL: 1, CLINICA: 2, EMPRESA: 3 };
    const currentTier = planHierarchy[currentPlanKey as keyof typeof planHierarchy] || 0;
    const targetTier = planHierarchy[planKey as keyof typeof planHierarchy] || 0;
    return targetTier > currentTier;
  };

  const availablePlans = upgradeInfo?.availableUpgrades || [];
  const savingsPercentage = calculateSavingsPercentage(
    COMPLETE_PLANS.PROFESIONAL.monthlyPrice,
    COMPLETE_PLANS.PROFESIONAL.yearlyPrice * 12
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold">
              {isTrialPeriod ? 'Elige tu plan' : 'Actualiza tu plan'}
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isTrialPeriod
                ? 'Selecciona el plan que mejor se adapte a tu clínica veterinaria'
                : 'Desbloquea más funcionalidades actualizando a un plan superior'}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isUpgrading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Billing interval toggle */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingInterval === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingInterval('monthly')}
              >
                Mensual
              </button>
              <button
                className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                  billingInterval === 'annual'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => setBillingInterval('annual')}
              >
                Anual
                <Badge className="bg-green-500 text-white text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  {savingsPercentage}% OFF
                </Badge>
              </button>
            </div>
          </div>

        {/* Loading state */}
        {isLoadingInfo && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Cargando planes disponibles...</span>
          </div>
        )}

        {/* Error state */}
        {!isLoadingInfo && !upgradeInfo && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-gray-600 mb-4">Error al cargar los planes disponibles</p>
            <Button onClick={fetchUpgradeInfo}>
              Reintentar
            </Button>
          </div>
        )}

        {/* Plans grid */}
        {!isLoadingInfo && upgradeInfo && (
          <>
            {/* Current plan indicator */}
            {currentPlanKey && !isTrialPeriod && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-900">
                      Plan actual: {currentPlanKey}
                    </p>
                    <p className="text-sm text-blue-700">
                      Solo puedes actualizar a planes superiores
                    </p>
                  </div>
                </div>
              </div>
            )}

            {availablePlans.length === 0 && !isTrialPeriod && (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-400 mb-4" />
                <p className="text-gray-600">
                  Ya tienes el plan más alto disponible
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(isTrialPeriod
                ? Object.entries(COMPLETE_PLANS).map(([key, plan]) => ({
                    planKey: key,
                    name: key,
                    tier: 0,
                    limits: plan.limits,
                    pricing: {
                      monthly: plan.monthlyPrice,
                      annual: plan.yearlyPrice * 12
                    }
                  }))
                : availablePlans
              ).map((plan) => {
                const planKey = plan.planKey as 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
                const isPopular = planKey === 'CLINICA';
                const isCurrentPlan = planKey === currentPlanKey;

                return (
                  <PlanComparisonCard
                    key={planKey}
                    planKey={planKey}
                    name={planKey}
                    description={getPlanDescription(planKey)}
                    pricing={plan.pricing}
                    features={getPlanFeatures(planKey)}
                    limits={plan.limits}
                    popular={isPopular}
                    currentPlan={isCurrentPlan}
                    disabled={!isUpgradePlan(planKey) || isUpgrading}
                    billingInterval={billingInterval}
                    onSelect={handlePlanSelect}
                    isLoading={isUpgrading && selectedPlan === planKey}
                  />
                );
              })}
            </div>

            {/* Additional info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">¿Por qué actualizar?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Acceso inmediato a todas las funcionalidades</li>
                <li>✓ Prorrateamos el costo según tu ciclo de facturación actual</li>
                <li>✓ Sin cargos ocultos ni sorpresas</li>
                <li>✓ Cancela en cualquier momento</li>
                {billingInterval === 'annual' && (
                  <li className="text-green-600 font-semibold">
                    ✓ Ahorra hasta {savingsPercentage}% con facturación anual
                  </li>
                )}
              </ul>
            </div>

            {/* Trial conversion notice */}
            {isTrialPeriod && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">
                      Conversión de prueba
                    </p>
                    <p className="text-yellow-700">
                      Al seleccionar un plan, serás redirigido al checkout para ingresar tu
                      información de pago y comenzar tu suscripción.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

/**
 * Quick upgrade modal for specific plan selection
 */
export function QuickUpgradeModal({
  open,
  onOpenChange,
  targetPlan,
  fromTrial = false
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetPlan: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
  fromTrial?: boolean;
}) {
  const { upgrade, isUpgrading } = useUpgrade();
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');

  const plan = COMPLETE_PLANS[targetPlan];
  const price = billingInterval === 'annual' ? plan.yearlyPrice * 12 : plan.monthlyPrice;
  const monthlyEquivalent = billingInterval === 'annual' ? plan.yearlyPrice : plan.monthlyPrice;

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleConfirm = async () => {
    const result = await upgrade({
      targetPlan,
      billingInterval,
      fromTrial
    });

    if (result?.success && result.type !== 'trial_conversion') {
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">Actualizar a {targetPlan}</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Confirma tu selección para continuar
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            disabled={isUpgrading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Plan summary */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">{targetPlan}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plan.description}</p>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {formatPrice(monthlyEquivalent)}
              </span>
              <span className="text-gray-600 dark:text-gray-400">/mes</span>
            </div>

            {billingInterval === 'annual' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Facturado anualmente: {formatPrice(price)}
              </p>
            )}
          </div>

          {/* Billing interval selection */}
          <div className="inline-flex rounded-lg border border-gray-200 p-1 w-full">
            <button
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                billingInterval === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingInterval('monthly')}
            >
              Mensual
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                billingInterval === 'annual'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setBillingInterval('annual')}
            >
              Anual
              <Badge className="bg-green-500 text-white text-xs">-20%</Badge>
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isUpgrading}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
