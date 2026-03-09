/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import { NextRequest } from 'next/server';

// Mock Kinde auth
const mockGetUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({
    getUser: mockGetUser,
  }),
}));

// Mock Stripe functions
const mockCreateCheckoutSessionForAPI = jest.fn();
const mockGetPriceByLookupKey = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  createCheckoutSessionForAPI: (...args: any[]) => mockCreateCheckoutSessionForAPI(...args),
  getPriceByLookupKey: (...args: any[]) => mockGetPriceByLookupKey(...args),
}));

// Mock findOrCreateUser
const mockFindOrCreateUser = jest.fn();
jest.mock('@/lib/db/queries/users', () => ({
  findOrCreateUser: (...args: any[]) => mockFindOrCreateUser(...args),
}));

// Mock pricing-config
const mockGetStripePriceIdForPlan = jest.fn();
jest.mock('@/lib/pricing-config', () => ({
  getStripePriceIdForPlan: (...args: any[]) => mockGetStripePriceIdForPlan(...args),
}));

// Import after mocks
import { POST } from '@/app/api/checkout/route';

// Test data factories
const createMockKindeUser = (overrides = {}) => ({
  id: 'kp_user_123',
  email: 'vet@example.com',
  given_name: 'Juan',
  family_name: 'Pérez',
  ...overrides,
});

const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'vet@example.com',
  name: 'Juan Pérez',
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Clínica Veterinaria Test',
  slug: 'clinica-test',
  stripeCustomerId: 'cus_test_123',
  ...overrides,
});

const createMockRequest = (body?: object) => {
  const url = 'http://localhost:3000/api/checkout';
  const req = new NextRequest(url, {
    method: 'POST',
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
  return req;
};

describe('Checkout Session API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Set Stripe key env variable for tests
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.STRIPE_SECRET_KEY;
  });

  describe('Authentication Guard', () => {
    it('should return 401 when not authenticated', async () => {
      mockGetUser.mockResolvedValue(null);
      const request = createMockRequest({ priceId: 'price_test_123' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Not authenticated');
    });
  });

  describe('Tenant Validation', () => {
    it('should return 400 with onboarding redirect when tenant not found', async () => {
      const kindeUser = createMockKindeUser();
      const user = createMockUser();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(user);
      prismaMock.tenant.findFirst.mockResolvedValue(null);

      const request = createMockRequest({ priceId: 'price_test_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Onboarding required');
      expect(data.redirectUrl).toBe('/onboarding');
    });
  });

  describe('Price Resolution', () => {
    it('should return 400 when no priceId or planKey provided', async () => {
      const kindeUser = createMockKindeUser();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(createMockTenant() as any);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Price ID or Plan Key is required');
    });

    it('should resolve plan key to price ID for BASICO', async () => {
      const kindeUser = createMockKindeUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockGetStripePriceIdForPlan.mockReturnValue('price_basico_monthly');
      mockCreateCheckoutSessionForAPI.mockResolvedValue({ url: 'https://checkout.stripe.com/session123' });

      const request = createMockRequest({ planKey: 'BASICO', billingInterval: 'monthly' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockGetStripePriceIdForPlan).toHaveBeenCalledWith('Plan Básico', 'monthly');
      expect(data.url).toBe('https://checkout.stripe.com/session123');
    });

    it('should resolve plan key to price ID for PROFESIONAL', async () => {
      const kindeUser = createMockKindeUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockGetStripePriceIdForPlan.mockReturnValue('price_pro_yearly');
      mockCreateCheckoutSessionForAPI.mockResolvedValue({ url: 'https://checkout.stripe.com/session456' });

      const request = createMockRequest({ planKey: 'PROFESIONAL', billingInterval: 'yearly' });
      const response = await POST(request);

      expect(mockGetStripePriceIdForPlan).toHaveBeenCalledWith('Plan Profesional', 'yearly');
    });

    it('should resolve plan key to price ID for CORPORATIVO', async () => {
      const kindeUser = createMockKindeUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockGetStripePriceIdForPlan.mockReturnValue('price_corp_monthly');
      mockCreateCheckoutSessionForAPI.mockResolvedValue({ url: 'https://checkout.stripe.com/session789' });

      const request = createMockRequest({ planKey: 'CORPORATIVO' });
      const response = await POST(request);

      expect(mockGetStripePriceIdForPlan).toHaveBeenCalledWith('Plan Corporativo', 'monthly');
    });

    it('should use lookup key resolution when priceId is not a Stripe price ID', async () => {
      const kindeUser = createMockKindeUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockGetPriceByLookupKey.mockResolvedValue('price_resolved_123');
      mockCreateCheckoutSessionForAPI.mockResolvedValue({ url: 'https://checkout.stripe.com/session' });

      const request = createMockRequest({ priceId: 'basico_monthly' });
      const response = await POST(request);
      const data = await response.json();

      expect(mockGetPriceByLookupKey).toHaveBeenCalledWith('basico_monthly');
      expect(response.status).toBe(200);
    });

    it('should return 400 when lookup key cannot be resolved', async () => {
      const kindeUser = createMockKindeUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(createMockUser());
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockGetPriceByLookupKey.mockResolvedValue(null);

      const request = createMockRequest({ priceId: 'invalid_lookup_key' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid price identifier');
    });
  });

  describe('Checkout Session Creation', () => {
    it('should create checkout session with valid priceId and return URL', async () => {
      const kindeUser = createMockKindeUser();
      const user = createMockUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(user);
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockCreateCheckoutSessionForAPI.mockResolvedValue({
        url: 'https://checkout.stripe.com/pay/cs_test_abc123',
      });

      const request = createMockRequest({ priceId: 'price_test_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_abc123');
      expect(mockCreateCheckoutSessionForAPI).toHaveBeenCalledWith({
        tenant,
        priceId: 'price_test_123',
        userId: user.id,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const kindeUser = createMockKindeUser();
      const user = createMockUser();
      const tenant = createMockTenant();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockResolvedValue(user);
      prismaMock.tenant.findFirst.mockResolvedValue(tenant as any);
      mockCreateCheckoutSessionForAPI.mockRejectedValue(new Error('Stripe rate limit exceeded'));

      const request = createMockRequest({ priceId: 'price_test_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
      expect(data.details).toBe('Stripe rate limit exceeded');
    });

    it('should return 500 when user sync fails', async () => {
      const kindeUser = createMockKindeUser();
      mockGetUser.mockResolvedValue(kindeUser);
      mockFindOrCreateUser.mockRejectedValue(new Error('DB connection failed'));

      const request = createMockRequest({ priceId: 'price_test_123' });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error syncing user');
    });
  });
});
