import { differenceInDays } from 'date-fns';
import type { Tenant } from '@prisma/client';
import { TRIAL_WARNING_DAYS } from '../constants';

export interface TrialStatus {
  status: 'active' | 'ending_soon' | 'expired' | 'grace_period' | 'converted';
  daysRemaining: number;
  displayMessage: string;
  bannerType: 'success' | 'warning' | 'danger' | 'info';
  showUpgradePrompt: boolean;
  blockedFeatures: FeatureAccess[];
}

export interface FeatureAccess {
  feature: 'pets' | 'appointments' | 'inventory' | 'reports' | 'automations';
  allowed: boolean;
  reason?: string;
  limit?: number;
  used?: number;
}

/**
 * Calculate comprehensive trial status for a tenant
 * Handles negative days correctly for expired trials
 */
export function calculateTrialStatus(tenant: Tenant): TrialStatus {
  if (!tenant.isTrialPeriod || !tenant.trialEndsAt) {
    return {
      status: 'converted',
      daysRemaining: 0,
      displayMessage: '',
      bannerType: 'info',
      showUpgradePrompt: false,
      blockedFeatures: []
    };
  }

  const now = new Date();
  const trialEnd = new Date(tenant.trialEndsAt);
  const daysRemaining = differenceInDays(trialEnd, now);

  // Expired trial (negative days)
  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return {
      status: 'expired',
      daysRemaining,
      displayMessage: `Trial expirado hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`,
      bannerType: 'danger',
      showUpgradePrompt: true,
      blockedFeatures: getBlockedFeaturesForExpired()
    };
  }

  // Last day
  if (daysRemaining === 0) {
    return {
      status: 'ending_soon',
      daysRemaining,
      displayMessage: '¡Último día de prueba!',
      bannerType: 'warning',
      showUpgradePrompt: true,
      blockedFeatures: []
    };
  }

  // Ending soon (TRIAL_WARNING_DAYS days or less)
  if (daysRemaining <= TRIAL_WARNING_DAYS) {
    return {
      status: 'ending_soon',
      daysRemaining,
      displayMessage: `Trial terminando en ${daysRemaining} día${daysRemaining !== 1 ? 's' : ''}`,
      bannerType: 'warning',
      showUpgradePrompt: true,
      blockedFeatures: []
    };
  }

  // Active trial
  return {
    status: 'active',
    daysRemaining,
    displayMessage: `${daysRemaining} días restantes de prueba`,
    bannerType: 'success',
    showUpgradePrompt: false,
    blockedFeatures: []
  };
}

/**
 * Get features that should be blocked for expired trials
 */
function getBlockedFeaturesForExpired(): FeatureAccess[] {
  return [
    { feature: 'pets', allowed: false, reason: 'Trial expirado', limit: 0 },
    { feature: 'appointments', allowed: false, reason: 'Trial expirado', limit: 0 },
    { feature: 'inventory', allowed: false, reason: 'Trial expirado' },
    { feature: 'reports', allowed: false, reason: 'Trial expirado' },
    { feature: 'automations', allowed: false, reason: 'Trial expirado' }
  ];
}

/**
 * Get user-friendly trial message based on days remaining
 */
export function getTrialMessage(daysRemaining: number): string {
  if (daysRemaining < 0) {
    const daysAgo = Math.abs(daysRemaining);
    return `Tu período de prueba expiró hace ${daysAgo} día${daysAgo !== 1 ? 's' : ''}`;
  }
  
  if (daysRemaining === 0) {
    return '¡Hoy es el último día de tu prueba gratuita!';
  }
  
  if (daysRemaining === 1) {
    return 'Tu prueba gratuita termina mañana';
  }
  
  if (daysRemaining <= TRIAL_WARNING_DAYS) {
    return `Tu prueba gratuita termina en ${daysRemaining} días`;
  }
  
  return `Tienes ${daysRemaining} días restantes en tu prueba gratuita`;
}

/**
 * Calculate days remaining specifically for trials using trialEndsAt
 * Keeps negative values for proper expired trial handling
 */
export function calculateTrialDaysRemaining(tenant: Tenant): number | null {
  if (!tenant.isTrialPeriod || !tenant.trialEndsAt) {
    return null;
  }
  
  const now = new Date();
  const trialEnd = new Date(tenant.trialEndsAt);
  
  // Return actual difference, including negative values for expired trials
  return differenceInDays(trialEnd, now);
}
