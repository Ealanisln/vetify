// Regression: ISSUE-004 — "Uso del Plan" showed "Plan Básico" during a Profesional trial
// Found by /qa on 2026-10-02
// Report: .gstack/qa-reports/run-20261002T185412Z/qa-report-development-vetify-pro-2026-10-02.md

import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import type { Tenant } from '@prisma/client';
import { PlanLimitsDisplay } from '@/components/subscription/PlanLimitsDisplay';

const DAY_MS = 24 * 60 * 60 * 1000;

const createTenant = (overrides: Partial<Tenant> = {}) =>
  ({
    id: 'tenant_123',
    name: 'Test Clinic',
    slug: 'test-clinic',
    planType: 'PROFESIONAL',
    planName: null,
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    trialEndsAt: new Date(Date.now() + 20 * DAY_MS),
    subscriptionEndsAt: null,
    stripeSubscriptionId: null,
    status: 'ACTIVE',
    tenantUsageStats: { totalUsers: 1, totalPets: 1 },
    tenantSubscription: { plan: { name: 'Plan Profesional', maxUsers: 8, maxPets: 2000 } },
    ...overrides,
  }) as unknown as Parameters<typeof PlanLimitsDisplay>[0]['tenant'];

describe('PlanLimitsDisplay plan label', () => {
  it('labels an active trial as a trial, not as Plan Básico', () => {
    render(<PlanLimitsDisplay tenant={createTenant()} />);

    expect(screen.getByText('Plan: Prueba gratuita')).toBeInTheDocument();
    expect(screen.queryByText(/Plan Básico/)).not.toBeInTheDocument();
  });

  it('shows the paid plan name for a synced subscription', () => {
    render(
      <PlanLimitsDisplay
        tenant={createTenant({
          isTrialPeriod: false,
          subscriptionStatus: 'ACTIVE',
          stripeSubscriptionId: 'sub_123',
          planName: 'Plan Profesional',
        })}
      />
    );

    expect(screen.getByText('Plan: Plan Profesional')).toBeInTheDocument();
  });
});

describe('PlanLimitsDisplay free-plan badge', () => {
  it('does not flash "Plan Gratuito" on the initial (server) render of a trial', () => {
    const html = renderToString(<PlanLimitsDisplay tenant={createTenant()} />);

    expect(html).toContain('Prueba gratuita');
    expect(html).not.toContain('Plan Gratuito');
  });

  it('shows "Plan Gratuito" when the tenant has no active subscription', () => {
    render(
      <PlanLimitsDisplay
        tenant={createTenant({ subscriptionStatus: 'CANCELED', isTrialPeriod: false, trialEndsAt: null })}
      />
    );

    expect(screen.getByText('Plan Gratuito')).toBeInTheDocument();
  });
});
