/**
 * Resolves which plan card should render as "current plan" on the pricing page.
 *
 * A tenant in trial without a real Stripe subscription has NO current plan:
 * they haven't paid for anything yet, so every plan (including Básico) must
 * show a conversion CTA instead of a disabled "Plan Actual" button.
 */

export interface SubscriptionSnapshot {
  planKey?: string | null;
  planName?: string | null;
  isTrialPeriod?: boolean | null;
  stripeSubscriptionId?: string | null;
}

export function mapPlanNameToKey(planName: string): string {
  const name = planName.toLowerCase();
  if (name.includes('básico') || name.includes('basico') || name.includes('basic')) {
    return 'basico';
  } else if (name.includes('profesional') || name.includes('professional')) {
    return 'profesional';
  } else if (
    name.includes('corporativo') ||
    name.includes('corporate') ||
    name.includes('empresa') ||
    name.includes('enterprise')
  ) {
    return 'corporativo';
  }
  return 'basico';
}

export function resolveCurrentPlanKey(
  subscription: SubscriptionSnapshot,
  urlCurrentPlan?: string | null
): string | null {
  if (subscription.isTrialPeriod && !subscription.stripeSubscriptionId) {
    return null;
  }

  if (subscription.planKey) {
    return subscription.planKey.toLowerCase();
  }

  if (subscription.planName) {
    return mapPlanNameToKey(subscription.planName);
  }

  if (urlCurrentPlan) {
    return urlCurrentPlan.toLowerCase();
  }

  return null;
}
