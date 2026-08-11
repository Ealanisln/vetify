/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import type { Tenant } from '@prisma/client';

const mockRouterRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: mockRouterRefresh }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/payments/actions', () => ({
  redirectToCustomerPortal: jest.fn(),
}));

import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';

const createMockTenant = (overrides: Partial<Tenant> = {}): Tenant =>
  ({
    id: 'tenant_123',
    name: 'Test Clinic',
    slug: 'test-clinic',
    planType: 'PROFESIONAL',
    planName: 'Plan Profesional',
    subscriptionStatus: 'ACTIVE',
    isTrialPeriod: false,
    trialEndsAt: null,
    subscriptionEndsAt: new Date('2026-09-07'),
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    stripeProductId: 'prod_123',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    status: 'ACTIVE',
    ...overrides,
  }) as Tenant;

describe('SubscriptionManager — scheduled cancellation state', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the active state when there is no scheduled cancellation', () => {
    const tenant = Object.assign(createMockTenant(), {
      tenantSubscription: { cancelAtPeriodEnd: false },
    });

    render(<SubscriptionManager tenant={tenant} isActiveSubscription={true} />);

    expect(screen.getByRole('heading', { name: 'Activa' })).toBeInTheDocument();
    expect(screen.getByText('Renueva')).toBeInTheDocument();
  });

  it('shows the scheduled-cancellation state when cancelAtPeriodEnd is true', () => {
    const tenant = Object.assign(createMockTenant(), {
      tenantSubscription: { cancelAtPeriodEnd: true },
    });

    render(<SubscriptionManager tenant={tenant} isActiveSubscription={true} />);

    expect(screen.getByRole('heading', { name: 'Cancelación programada' })).toBeInTheDocument();
    expect(screen.getByText('Termina')).toBeInTheDocument();
    expect(screen.queryByText('Renueva')).not.toBeInTheDocument();
    expect(screen.queryByText('Activa')).not.toBeInTheDocument();
  });
});
