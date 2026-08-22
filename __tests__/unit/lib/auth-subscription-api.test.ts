/**
 * requireActiveSubscriptionApi — the route-handler variant of
 * requireActiveSubscription. Server components redirect; route handlers
 * cannot (the NEXT_REDIRECT throw is swallowed by their try/catch and
 * surfaces as a 500), so this variant throws a typed error instead.
 */

const mockGetUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({ getUser: () => mockGetUser() }),
}));

const mockFindOrCreateUser = jest.fn();
jest.mock('@/lib/db/queries/users', () => ({
  findOrCreateUser: (...args: unknown[]) => mockFindOrCreateUser(...args),
  findUserById: jest.fn(),
}));

jest.mock('@/lib/serializers', () => ({
  serializeTenant: (tenant: unknown) => tenant,
  serializeUser: (user: unknown) => user,
}));

jest.mock('@/lib/prisma', () => ({ prisma: {} }));

const mockRedirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

import { requireActiveSubscriptionApi, requireActiveSubscription } from '@/lib/auth';
import { SubscriptionRequiredError } from '@/lib/subscription/subscription-required-error';

const DAY = 24 * 60 * 60 * 1000;

const buildUser = (tenantOverrides: Record<string, unknown>) => ({
  id: 'kp_user-1',
  email: 'vet@example.com',
  tenant: {
    id: 'tenant-1',
    subscriptionStatus: 'TRIALING',
    isTrialPeriod: true,
    trialEndsAt: new Date(Date.now() + 10 * DAY),
    subscriptionEndsAt: null,
    ...tenantOverrides,
  },
});

describe('requireActiveSubscriptionApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ id: 'kp_user-1', email: 'vet@example.com' });
  });

  it('returns the user and tenant when the subscription is active', async () => {
    mockFindOrCreateUser.mockResolvedValue(buildUser({}));

    const { tenant } = await requireActiveSubscriptionApi();

    expect(tenant.id).toBe('tenant-1');
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('throws SubscriptionRequiredError instead of redirecting when the trial expired', async () => {
    mockFindOrCreateUser.mockResolvedValue(
      buildUser({ trialEndsAt: new Date(Date.now() - 40 * DAY) })
    );

    const attempt = requireActiveSubscriptionApi();

    await expect(attempt).rejects.toBeInstanceOf(SubscriptionRequiredError);
    await expect(attempt).rejects.toMatchObject({ code: 'SUBSCRIPTION_REQUIRED' });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('keeps the redirect behaviour on the server-component variant', async () => {
    mockFindOrCreateUser.mockResolvedValue(
      buildUser({ trialEndsAt: new Date(Date.now() - 40 * DAY) })
    );

    await expect(requireActiveSubscription()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/dashboard/settings?tab=subscription&reason=trial_expired'
    );
  });
});
