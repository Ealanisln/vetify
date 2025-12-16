/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock Stripe functions
const mockGetStripeProducts = jest.fn();
const mockGetStripePrices = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  getStripeProducts: () => mockGetStripeProducts(),
  getStripePrices: () => mockGetStripePrices(),
}));

// Import after mocks
import { GET } from '@/app/api/pricing/route';

// Test data factories
const createMockStripeProduct = (overrides = {}) => ({
  id: 'prod_TGDXKD2ksDenYm',
  name: 'Plan Básico',
  description: 'Plan básico para clínicas pequeñas',
  features: ['Feature 1', 'Feature 2'],
  metadata: { tier: 'basic' },
  ...overrides,
});

const createMockStripePrice = (overrides = {}) => ({
  id: 'price_123',
  productId: 'prod_TGDXKD2ksDenYm',
  unitAmount: 59900,
  currency: 'mxn',
  interval: 'month',
  intervalCount: 1,
  ...overrides,
});

describe('Pricing API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/pricing', () => {
    describe('Success Cases', () => {
      it('should return pricing data successfully', async () => {
        const products = [createMockStripeProduct()];
        const prices = [createMockStripePrice()];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data).toHaveProperty('plans');
        expect(data).toHaveProperty('lastUpdated');
      });

      it('should include product details in response', async () => {
        const products = [
          createMockStripeProduct({
            id: 'prod_TGDXKD2ksDenYm',
            name: 'Plan Básico',
            description: 'Test description',
            features: ['Feat 1', 'Feat 2'],
          }),
        ];
        const prices = [
          createMockStripePrice({
            productId: 'prod_TGDXKD2ksDenYm',
            interval: 'month',
          }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0]).toHaveProperty('id', 'prod_TGDXKD2ksDenYm');
        expect(data.plans[0]).toHaveProperty('name', 'Plan Básico');
        expect(data.plans[0]).toHaveProperty('description', 'Test description');
        expect(data.plans[0]).toHaveProperty('features');
      });

      it('should group prices by product with monthly and yearly', async () => {
        const products = [createMockStripeProduct({ id: 'prod_TGDXKD2ksDenYm' })];
        const prices = [
          createMockStripePrice({
            id: 'price_monthly',
            productId: 'prod_TGDXKD2ksDenYm',
            interval: 'month',
            unitAmount: 59900,
          }),
          createMockStripePrice({
            id: 'price_yearly',
            productId: 'prod_TGDXKD2ksDenYm',
            interval: 'year',
            unitAmount: 599000,
          }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].prices).toHaveProperty('monthly');
        expect(data.plans[0].prices).toHaveProperty('yearly');
        expect(data.plans[0].prices.monthly.id).toBe('price_monthly');
        expect(data.plans[0].prices.yearly.id).toBe('price_yearly');
      });

      it('should handle products with only monthly price', async () => {
        const products = [createMockStripeProduct()];
        const prices = [
          createMockStripePrice({ interval: 'month' }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].prices.monthly).not.toBeNull();
        expect(data.plans[0].prices.yearly).toBeNull();
      });

      it('should handle products with only yearly price', async () => {
        const products = [createMockStripeProduct()];
        const prices = [
          createMockStripePrice({ interval: 'year' }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].prices.monthly).toBeNull();
        expect(data.plans[0].prices.yearly).not.toBeNull();
      });
    });

    describe('Product Filtering', () => {
      it('should filter to only valid Vetify products', async () => {
        const products = [
          createMockStripeProduct({ id: 'prod_TGDXKD2ksDenYm', name: 'Plan Básico' }),
          createMockStripeProduct({ id: 'prod_TGDXLJxNFGsF9X', name: 'Plan Profesional' }),
          createMockStripeProduct({ id: 'prod_INVALID', name: 'Invalid Product' }),
        ];
        const prices = [
          createMockStripePrice({ productId: 'prod_TGDXKD2ksDenYm', unitAmount: 59900 }),
          createMockStripePrice({ productId: 'prod_TGDXLJxNFGsF9X', unitAmount: 119900 }),
          createMockStripePrice({ productId: 'prod_INVALID', unitAmount: 999900 }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans).toHaveLength(2);
        expect(data.plans.map((p: any) => p.id)).not.toContain('prod_INVALID');
      });

      it('should sort plans by monthly price ascending', async () => {
        const products = [
          createMockStripeProduct({ id: 'prod_TGDXLJxNFGsF9X', name: 'Plan Profesional' }),
          createMockStripeProduct({ id: 'prod_TGDXKD2ksDenYm', name: 'Plan Básico' }),
        ];
        const prices = [
          createMockStripePrice({ productId: 'prod_TGDXLJxNFGsF9X', interval: 'month', unitAmount: 119900 }),
          createMockStripePrice({ productId: 'prod_TGDXKD2ksDenYm', interval: 'month', unitAmount: 59900 }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].prices.monthly.unitAmount).toBe(59900);
        expect(data.plans[1].prices.monthly.unitAmount).toBe(119900);
      });
    });

    describe('Price Structure', () => {
      it('should include all price fields', async () => {
        const products = [createMockStripeProduct()];
        const prices = [
          createMockStripePrice({
            id: 'price_123',
            unitAmount: 59900,
            currency: 'mxn',
            interval: 'month',
            intervalCount: 1,
          }),
        ];

        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue(prices);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        const monthlyPrice = data.plans[0].prices.monthly;
        expect(monthlyPrice).toHaveProperty('id', 'price_123');
        expect(monthlyPrice).toHaveProperty('unitAmount', 59900);
        expect(monthlyPrice).toHaveProperty('currency', 'mxn');
        expect(monthlyPrice).toHaveProperty('interval', 'month');
        expect(monthlyPrice).toHaveProperty('intervalCount', 1);
      });
    });

    describe('Edge Cases', () => {
      it('should return empty plans when no products', async () => {
        mockGetStripeProducts.mockResolvedValue([]);
        mockGetStripePrices.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.plans).toEqual([]);
      });

      it('should return empty plans when no matching products', async () => {
        const products = [
          createMockStripeProduct({ id: 'prod_INVALID', name: 'Invalid' }),
        ];
        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans).toEqual([]);
      });

      it('should handle products without prices', async () => {
        const products = [createMockStripeProduct()];
        mockGetStripeProducts.mockResolvedValue(products);
        mockGetStripePrices.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.plans[0].prices.monthly).toBeNull();
        expect(data.plans[0].prices.yearly).toBeNull();
      });

      it('should include lastUpdated timestamp', async () => {
        mockGetStripeProducts.mockResolvedValue([]);
        mockGetStripePrices.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.lastUpdated).toBeDefined();
        expect(new Date(data.lastUpdated)).toBeInstanceOf(Date);
      });
    });

    describe('Error Handling', () => {
      it('should return 500 on Stripe products fetch error', async () => {
        mockGetStripeProducts.mockRejectedValue(new Error('Stripe API error'));
        mockGetStripePrices.mockResolvedValue([]);

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch pricing data');
      });

      it('should return 500 on Stripe prices fetch error', async () => {
        mockGetStripeProducts.mockResolvedValue([]);
        mockGetStripePrices.mockRejectedValue(new Error('Stripe API error'));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Failed to fetch pricing data');
      });

      it('should include error details in error response', async () => {
        const errorMessage = 'Rate limit exceeded';
        mockGetStripeProducts.mockRejectedValue(new Error(errorMessage));

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details).toBe(errorMessage);
      });

      it('should handle non-Error thrown values', async () => {
        mockGetStripeProducts.mockRejectedValue('Unknown error');

        const response = await GET();
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.details).toBe('Unknown error');
      });
    });
  });
});
