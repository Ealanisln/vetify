'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export interface UpgradeOptions {
  targetPlan: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA';
  billingInterval: 'monthly' | 'annual';
  fromTrial?: boolean;
}

export interface UpgradeResponse {
  success: boolean;
  type: 'trial_conversion' | 'subscription_upgrade';
  checkoutUrl?: string;
  subscription?: {
    id: string;
    status: string;
    currentPeriodEnd: Date;
    plan: string;
    billingInterval: string;
  };
  proration?: {
    amount: number;
    currency: string;
    dueDate: Date;
  };
  newPricing?: {
    amount: number;
    interval: string;
    currency: string;
  };
  message: string;
}

export interface AvailableUpgrade {
  planKey: string;
  name: string;
  tier: number;
  limits: {
    pets: number;
    users: number;
    whatsappMessages: number;
  };
  pricing: {
    monthly: number;
    annual: number;
  };
}

export interface UpgradeInfo {
  currentPlan: {
    key: string | null;
    tier: number;
    isTrialPeriod: boolean;
    subscriptionStatus: string;
  };
  availableUpgrades: AvailableUpgrade[];
  canUpgrade: boolean;
}

export function useUpgrade() {
  const router = useRouter();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  /**
   * Fetch available upgrade options
   */
  const fetchUpgradeInfo = useCallback(async () => {
    setIsLoadingInfo(true);
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al obtener opciones de actualización');
      }

      const data = await response.json();
      setUpgradeInfo(data);
      return data;
    } catch (error) {
      console.error('Error fetching upgrade info:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cargar información');
      return null;
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  /**
   * Perform subscription upgrade
   */
  const upgrade = useCallback(async (options: UpgradeOptions): Promise<UpgradeResponse | null> => {
    setIsUpgrading(true);

    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetPlan: options.targetPlan,
          billingInterval: options.billingInterval,
          fromTrial: options.fromTrial || false
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar plan');
      }

      // Handle trial conversion (redirect to checkout)
      if (data.type === 'trial_conversion' && data.checkoutUrl) {
        toast.loading('Redirigiendo al checkout...');
        window.location.href = data.checkoutUrl;
        return data;
      }

      // Handle successful upgrade
      if (data.success) {
        toast.success(data.message || '¡Plan actualizado exitosamente!');

        // Refresh the page to update UI
        router.refresh();

        return data;
      }

      return data;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al actualizar plan');
      return null;
    } finally {
      setIsUpgrading(false);
    }
  }, [router]);

  /**
   * Quick upgrade to a specific plan from trial
   */
  const upgradeFromTrial = useCallback(async (
    targetPlan: 'PROFESIONAL' | 'CLINICA' | 'EMPRESA',
    billingInterval: 'monthly' | 'annual' = 'monthly'
  ) => {
    return upgrade({
      targetPlan,
      billingInterval,
      fromTrial: true
    });
  }, [upgrade]);

  /**
   * Calculate savings for annual billing
   */
  const calculateAnnualSavings = useCallback((monthlyPrice: number, annualPrice: number): number => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    return Math.round(savings);
  }, []);

  /**
   * Calculate savings percentage for annual billing
   */
  const calculateSavingsPercentage = useCallback((monthlyPrice: number, annualPrice: number): number => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - annualPrice;
    const percentage = (savings / monthlyTotal) * 100;
    return Math.round(percentage);
  }, []);

  /**
   * Format price for display
   */
  const formatPrice = useCallback((amount: number, currency: string = 'MXN'): string => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }, []);

  return {
    // State
    isUpgrading,
    upgradeInfo,
    isLoadingInfo,

    // Actions
    upgrade,
    upgradeFromTrial,
    fetchUpgradeInfo,

    // Utilities
    calculateAnnualSavings,
    calculateSavingsPercentage,
    formatPrice
  };
}
