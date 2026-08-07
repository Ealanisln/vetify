/**
 * @jest-environment node
 */
import { resolveCurrentPlanKey } from '@/lib/pricing/current-plan';

describe('resolveCurrentPlanKey', () => {
  it('returns null for a trial tenant without a Stripe subscription — all plans must be selectable', () => {
    const key = resolveCurrentPlanKey({
      planKey: 'BASICO',
      planName: 'Plan Básico',
      isTrialPeriod: true,
      stripeSubscriptionId: null,
    });
    expect(key).toBeNull();
  });

  it('returns the plan key for a paying subscriber', () => {
    const key = resolveCurrentPlanKey({
      planKey: 'PROFESIONAL',
      planName: 'Plan Profesional',
      isTrialPeriod: false,
      stripeSubscriptionId: 'sub_123',
    });
    expect(key).toBe('profesional');
  });

  it('treats a trialing tenant WITH a Stripe subscription as subscribed (Stripe-managed trial)', () => {
    const key = resolveCurrentPlanKey({
      planKey: 'BASICO',
      isTrialPeriod: true,
      stripeSubscriptionId: 'sub_456',
    });
    expect(key).toBe('basico');
  });

  it('falls back to plan name mapping when planKey is missing', () => {
    const key = resolveCurrentPlanKey({
      planKey: null,
      planName: 'Plan Básico',
      isTrialPeriod: false,
      stripeSubscriptionId: 'sub_123',
    });
    expect(key).toBe('basico');
  });

  it('falls back to the URL param only when the API gave no plan', () => {
    const key = resolveCurrentPlanKey(
      { planKey: null, planName: null, isTrialPeriod: false, stripeSubscriptionId: 'sub_1' },
      'corporativo'
    );
    expect(key).toBe('corporativo');
  });

  it('ignores the URL param for trial tenants', () => {
    const key = resolveCurrentPlanKey(
      { planKey: null, planName: null, isTrialPeriod: true, stripeSubscriptionId: null },
      'basico'
    );
    expect(key).toBeNull();
  });

  it('returns null when nothing identifies a plan', () => {
    expect(resolveCurrentPlanKey({})).toBeNull();
  });

  it('maps professional and corporate name variants', () => {
    expect(
      resolveCurrentPlanKey({ planName: 'Plan Profesional', stripeSubscriptionId: 'sub_1' })
    ).toBe('profesional');
    expect(
      resolveCurrentPlanKey({ planName: 'Plan Corporativo', stripeSubscriptionId: 'sub_1' })
    ).toBe('corporativo');
  });
});
