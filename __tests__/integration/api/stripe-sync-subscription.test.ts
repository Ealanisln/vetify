const mockGetUser = jest.fn();
const mockIsAuthenticated = jest.fn();

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findFirst: jest.fn() },
  },
}));

const mockSubscriptionsRetrieve = jest.fn();
const mockHandleSubscriptionChange = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  stripe: {
    subscriptions: { retrieve: (...args: unknown[]) => mockSubscriptionsRetrieve(...args) },
  },
  handleSubscriptionChange: (...args: unknown[]) => mockHandleSubscriptionChange(...args),
}));

import { prisma } from '@/lib/prisma';
import { POST } from '@/app/api/stripe/sync-subscription/route';

const tenantMock = prisma.tenant as unknown as { findFirst: jest.Mock };

describe('POST /api/stripe/sync-subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    mockIsAuthenticated.mockResolvedValue(true);
    mockGetUser.mockResolvedValue({ id: 'user-1' });
    tenantMock.findFirst.mockResolvedValue({
      id: 'tenant-1',
      stripeSubscriptionId: 'sub_123',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('retrieves the subscription from Stripe and runs the idempotent sync', async () => {
    const stripeSubscription = {
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: true,
    };
    mockSubscriptionsRetrieve.mockResolvedValue(stripeSubscription);
    mockHandleSubscriptionChange.mockResolvedValue(true);

    const response = await POST();
    const data = await response.json();

    expect(mockSubscriptionsRetrieve).toHaveBeenCalledWith('sub_123');
    expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(stripeSubscription);
    expect(response.status).toBe(200);
    expect(data).toEqual({ synced: true, cancelAtPeriodEnd: true });
  });

  it('returns 401 when the user is not authenticated', async () => {
    mockIsAuthenticated.mockResolvedValue(false);
    mockGetUser.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it('returns synced false without calling Stripe when the tenant has no subscription', async () => {
    tenantMock.findFirst.mockResolvedValue({
      id: 'tenant-1',
      stripeSubscriptionId: null,
    });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ synced: false, cancelAtPeriodEnd: false });
    expect(mockSubscriptionsRetrieve).not.toHaveBeenCalled();
  });

  it('returns 404 when the user has no tenant', async () => {
    tenantMock.findFirst.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(404);
  });

  it('returns synced false when the sync fails', async () => {
    mockSubscriptionsRetrieve.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      cancel_at_period_end: true,
    });
    mockHandleSubscriptionChange.mockResolvedValue(false);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.synced).toBe(false);
  });

  it('returns 500 when Stripe errors', async () => {
    mockSubscriptionsRetrieve.mockRejectedValue(new Error('stripe down'));

    const response = await POST();

    expect(response.status).toBe(500);
  });
});
