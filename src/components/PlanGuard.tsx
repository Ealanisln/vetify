import React from 'react';
import { checkFeatureAccess } from '@/lib/plan-limits';
import { UpgradePrompt } from './UpgradePrompt';

interface PlanGuardProps {
  tenantId: string;
  feature: 'automations' | 'advancedReports' | 'multiDoctor' | 'smsReminders';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

interface PlanStatus {
  limits: {
    maxPets?: number;
    maxUsers?: number;
    maxMonthlyWhatsApp?: number;
    canUseAutomations?: boolean;
    canUseAdvancedReports?: boolean;
    canUseMultiDoctor?: boolean;
    canUseSMSReminders?: boolean;
  };
  usage: {
    currentPets?: number;
    currentUsers?: number;
    currentMonthlyWhatsApp?: number;
  };
  percentages: {
    pets?: number;
    users?: number;
    whatsapp?: number;
  };
  plan: {
    name?: string;
    isTrialPeriod?: boolean;
  };
  warnings: Record<string, unknown>;
}

/**
 * Server Component that guards features based on plan limits
 * Used to conditionally render features based on tenant's subscription plan
 */
export async function PlanGuard({ 
  tenantId, 
  feature, 
  children, 
  fallback,
  showUpgrade = true
}: PlanGuardProps) {
  const hasAccess = await checkFeatureAccess(tenantId, feature);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    if (showUpgrade) {
      return <UpgradePrompt feature={feature} tenantId={tenantId} />;
    }
    
    return null;
  }

  return <>{children}</>;
}

/**
 * Client-side hook for checking feature access
 * Use this in Client Components when you need reactive plan checking
 */
export function usePlanGuard(tenantId: string) {
  const [planStatus, setPlanStatus] = React.useState<PlanStatus | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchPlanStatus() {
      try {
        const response = await fetch(`/api/tenant/plan-status?tenantId=${tenantId}`);
        const data = await response.json();
        setPlanStatus(data);
      } catch (error) {
        console.error('Error fetching plan status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlanStatus();
  }, [tenantId]);

  const checkFeature = React.useCallback((feature: string) => {
    if (!planStatus?.limits) return false;
    
    switch (feature) {
      case 'automations':
        return planStatus.limits.canUseAutomations || false;
      case 'advancedReports':
        return planStatus.limits.canUseAdvancedReports || false;
      case 'multiDoctor':
        return planStatus.limits.canUseMultiDoctor || false;
      case 'smsReminders':
        return planStatus.limits.canUseSMSReminders || false;
      default:
        return false;
    }
  }, [planStatus]);

  const checkLimit = React.useCallback((limitType: 'pets' | 'users' | 'whatsapp') => {
    if (!planStatus) {
      return { canAdd: false, remaining: 0, percentage: 0, current: 0, limit: 0 };
    }
    
    const usage = planStatus.usage || {};
    const limits = planStatus.limits || {};
    const percentages = planStatus.percentages || {};
    
    switch (limitType) {
      case 'pets': {
        const current = usage.currentPets || 0;
        const limit = limits.maxPets || 0;
        return {
          canAdd: current < limit,
          remaining: Math.max(0, limit - current),
          percentage: percentages.pets || 0,
          current,
          limit
        };
      }
      case 'users': {
        const current = usage.currentUsers || 0;
        const limit = limits.maxUsers || 0;
        return {
          canAdd: current < limit,
          remaining: Math.max(0, limit - current),
          percentage: percentages.users || 0,
          current,
          limit
        };
      }
      case 'whatsapp': {
        const current = usage.currentMonthlyWhatsApp || 0;
        const limit = limits.maxMonthlyWhatsApp || 0;
        return {
          canAdd: current < limit,
          remaining: Math.max(0, limit - current),
          percentage: percentages.whatsapp || 0,
          current,
          limit
        };
      }
      default:
        return { canAdd: false, remaining: 0, percentage: 0, current: 0, limit: 0 };
    }
  }, [planStatus]);

  return {
    planStatus,
    loading,
    checkFeature,
    checkLimit,
    isTrialPeriod: planStatus?.plan?.isTrialPeriod || false,
    planName: planStatus?.plan?.name || 'Plan Gratuito',
    warnings: planStatus?.warnings || {}
  };
}

/**
 * HOC for wrapping components with plan guard functionality
 * Use this when you need to wrap entire pages or large components
 */
export function withPlanGuard<T extends { tenantId: string }>(
  Component: React.ComponentType<T>,
  feature: 'automations' | 'advancedReports' | 'multiDoctor' | 'smsReminders',
  fallback?: React.ComponentType<T>
) {
  return async function PlanGuardedComponent(props: T) {
    const hasAccess = await checkFeatureAccess(props.tenantId, feature);
    
    if (!hasAccess) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} />;
      }
      return <UpgradePrompt feature={feature} tenantId={props.tenantId} />;
    }
    
    return <Component {...props} />;
  };
} 