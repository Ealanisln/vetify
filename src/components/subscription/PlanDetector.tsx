'use client';

import { useEffect } from 'react';

interface PlanData {
  isAuthenticated: boolean;
  currentPlan: {
    planKey: string;
    name: string;
    displayName: string;
  } | null;
  planKey: string;
  canUpgrade: boolean;
  availableUpgrades: string[];
  subscriptionStatus: string;
  isTrialPeriod?: boolean;
  subscriptionEndsAt?: string;
}

interface PlanDetectorProps {
  onPlanDetected: (planData: PlanData) => void;
  onLoading?: (loading: boolean) => void;
}

export const PlanDetector: React.FC<PlanDetectorProps> = ({ 
  onPlanDetected, 
  onLoading 
}) => {
  useEffect(() => {
    const detectPlan = async () => {
      try {
        onLoading?.(true);

        const response = await fetch('/api/subscription/current', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.error('PlanDetector: Failed to fetch plan data:', response.status);
          // En caso de error, asumir usuario no autenticado
          onPlanDetected({
            isAuthenticated: false,
            currentPlan: null,
            planKey: 'starter',
            canUpgrade: true,
            availableUpgrades: ['standard', 'professional'],
            subscriptionStatus: 'TRIALING'
          });
          return;
        }

        const planData: PlanData = await response.json();

        onPlanDetected(planData);
      } catch (error) {
        console.error('PlanDetector: Error fetching plan data:', error);
        // En caso de error, asumir usuario no autenticado
        onPlanDetected({
          isAuthenticated: false,
          currentPlan: null,
          planKey: 'free',
          canUpgrade: true,
          availableUpgrades: ['basic', 'professional'],
          subscriptionStatus: 'INACTIVE'
        });
      } finally {
        onLoading?.(false);
      }
    };

    detectPlan();
  }, [onPlanDetected, onLoading]); // ❌ Quitamos isLoading de las dependencias

  // Este componente no renderiza nada, solo detecta el plan
  return null;
};
