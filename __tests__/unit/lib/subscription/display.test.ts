/**
 * @jest-environment node
 */
import { getPlanDisplay } from '@/lib/subscription/display';

function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

describe('getPlanDisplay', () => {
  it('shows the paid plan name for a paying subscriber', () => {
    const display = getPlanDisplay({
      isTrialPeriod: false,
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
      planName: 'Plan Profesional',
      subscriptionPlanName: 'Plan Profesional',
    });
    expect(display.state).toBe('PAID');
    expect(display.label).toBe('Plan Profesional');
  });

  it('shows "Prueba gratuita" for an active trial — never the intended plan as if paid', () => {
    const display = getPlanDisplay({
      isTrialPeriod: true,
      trialEndsAt: daysFromNow(10),
      stripeSubscriptionId: null,
      planName: null,
      subscriptionPlanName: 'Plan Básico',
    });
    expect(display.state).toBe('TRIAL');
    expect(display.label).toBe('Prueba gratuita');
  });

  it('shows "Prueba expirada" when the trial ended without conversion', () => {
    const display = getPlanDisplay({
      isTrialPeriod: true,
      trialEndsAt: daysFromNow(-2),
      stripeSubscriptionId: null,
      planName: null,
      subscriptionPlanName: 'Plan Básico',
    });
    expect(display.state).toBe('TRIAL_EXPIRED');
    expect(display.label).toBe('Prueba expirada');
  });

  it('treats a Stripe-managed trial (subscription present) as paid-plan display', () => {
    const display = getPlanDisplay({
      isTrialPeriod: true,
      trialEndsAt: daysFromNow(5),
      stripeSubscriptionId: 'sub_456',
      planName: 'Plan Básico',
      subscriptionPlanName: 'Plan Básico',
    });
    expect(display.state).toBe('PAID');
    expect(display.label).toBe('Plan Básico');
  });

  it('falls back to the TenantSubscription plan name when tenant.planName is empty', () => {
    const display = getPlanDisplay({
      isTrialPeriod: false,
      trialEndsAt: null,
      stripeSubscriptionId: 'sub_123',
      planName: null,
      subscriptionPlanName: 'Plan Corporativo',
    });
    expect(display.state).toBe('PAID');
    expect(display.label).toBe('Plan Corporativo');
  });

  it('shows "Sin plan" when there is neither trial nor subscription', () => {
    const display = getPlanDisplay({
      isTrialPeriod: false,
      trialEndsAt: null,
      stripeSubscriptionId: null,
      planName: null,
      subscriptionPlanName: null,
    });
    expect(display.state).toBe('NONE');
    expect(display.label).toBe('Sin plan');
  });

  it('accepts string dates (serialized tenants)', () => {
    const display = getPlanDisplay({
      isTrialPeriod: true,
      trialEndsAt: daysFromNow(3).toISOString(),
      stripeSubscriptionId: null,
    });
    expect(display.state).toBe('TRIAL');
  });
});
