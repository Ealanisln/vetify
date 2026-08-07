/**
 * Single source of truth for how a tenant's plan state is DISPLAYED.
 *
 * Before this helper each surface derived its own answer from a different
 * field (dashboard read TenantSubscription.plan.name, settings read
 * tenant.planName, /precios read planKey), so a trial tenant saw
 * "Plan Básico", "Sin plan activo" and "TU PLAN ACTUAL" at the same time.
 */

export type PlanDisplayState = 'PAID' | 'TRIAL' | 'TRIAL_EXPIRED' | 'NONE';

export interface PlanDisplayInput {
  isTrialPeriod?: boolean | null;
  trialEndsAt?: Date | string | null;
  stripeSubscriptionId?: string | null;
  /** tenant.planName — set when a Stripe subscription is synced */
  planName?: string | null;
  /** tenantSubscription.plan.name — the plan intent (also set during trial) */
  subscriptionPlanName?: string | null;
}

export interface PlanDisplay {
  state: PlanDisplayState;
  label: string;
}

export function getPlanDisplay(input: PlanDisplayInput): PlanDisplay {
  const paidPlanName = input.planName || input.subscriptionPlanName || null;

  if (input.stripeSubscriptionId) {
    return { state: 'PAID', label: paidPlanName || 'Plan activo' };
  }

  if (input.isTrialPeriod) {
    const trialEndsAt = input.trialEndsAt ? new Date(input.trialEndsAt) : null;
    if (trialEndsAt && trialEndsAt < new Date()) {
      return { state: 'TRIAL_EXPIRED', label: 'Prueba expirada' };
    }
    return { state: 'TRIAL', label: 'Prueba gratuita' };
  }

  return { state: 'NONE', label: 'Sin plan' };
}
