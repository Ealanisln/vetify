/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock headers
const mockHeadersGet = jest.fn();
jest.mock('next/headers', () => ({
  headers: jest.fn(() => ({
    get: mockHeadersGet,
    keys: () => ['stripe-signature'],
  })),
}));

// Mock Stripe
const mockStripe = {
  webhooks: {
    constructEvent: jest.fn(),
  },
  subscriptions: {
    retrieve: jest.fn(),
    list: jest.fn(),
    cancel: jest.fn(),
  },
  customers: {
    retrieve: jest.fn(),
  },
};

const mockHandleSubscriptionChange = jest.fn();

jest.mock('@/lib/payments/stripe', () => ({
  stripe: mockStripe,
  handleSubscriptionChange: mockHandleSubscriptionChange,
}));

// Mock admin notifications
const mockNotifyNewSubscriptionPayment = jest.fn();
jest.mock('@/lib/email/admin-notifications', () => ({
  notifyNewSubscriptionPayment: mockNotifyNewSubscriptionPayment,
}));

// Import after mocks
import { POST } from '@/app/api/stripe/webhook/route';

// Test data factories
const createMockSubscription = (overrides = {}): Partial<Stripe.Subscription> => ({
  id: 'sub_test_123',
  status: 'active',
  customer: 'cus_test_123',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
  trial_start: null,
  trial_end: null,
  cancel_at_period_end: false,
  items: {
    data: [
      {
        plan: {
          product: 'prod_test_123',
        },
        price: {
          nickname: 'Plan Profesional',
          recurring: {
            interval: 'month',
          },
        },
      },
    ],
  } as any,
  ...overrides,
});

const createMockSession = (overrides = {}): Partial<Stripe.Checkout.Session> => ({
  id: 'cs_test_123',
  status: 'complete',
  payment_status: 'paid',
  mode: 'subscription',
  subscription: 'sub_test_123',
  customer: 'cus_test_123',
  ...overrides,
});

const createMockInvoice = (overrides = {}): Partial<Stripe.Invoice> => ({
  id: 'in_test_123',
  subscription: 'sub_test_123',
  customer: 'cus_test_123',
  status: 'paid',
  amount_paid: 59900,
  currency: 'mxn',
  ...overrides,
});

const createMockCustomer = (overrides = {}): Partial<Stripe.Customer> => ({
  id: 'cus_test_123',
  email: 'test@example.com',
  name: 'Test User',
  metadata: {
    tenantId: 'tenant-1',
  },
  ...overrides,
});

const createMockTenant = (overrides = {}) => ({
  id: 'tenant-1',
  name: 'Test Clinic',
  slug: 'test-clinic',
  stripeCustomerId: 'cus_test_123',
  stripeSubscriptionId: 'sub_test_123',
  subscriptionStatus: 'ACTIVE',
  planName: 'PROFESIONAL',
  staff: [
    {
      name: 'Test Owner',
      email: 'owner@test.com',
      role: 'OWNER',
    },
  ],
  ...overrides,
});

const createMockEvent = (type: string, data: any): Stripe.Event => ({
  id: 'evt_test_123',
  type: type as any,
  data: {
    object: data,
  },
  object: 'event',
  api_version: '2024-06-20',
  created: Math.floor(Date.now() / 1000),
  livemode: false,
  pending_webhooks: 0,
  request: null,
});

// Helper to create mock request
const createMockRequest = (body: any = {}): NextRequest => {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  return new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body: bodyString,
  });
};

describe('Stripe Webhook API Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, STRIPE_WEBHOOK_SECRET: 'whsec_test_secret' };
    mockHeadersGet.mockReturnValue('valid_signature');
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('Signature Verification', () => {
    it('should return 400 when stripe-signature header is missing', async () => {
      mockHeadersGet.mockReturnValue(null);
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('No se encontró la firma');
    });

    it('should return 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Webhook secret not configured');
    });

    it('should return 400 when signature verification fails', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Firma inválida');
    });

    it('should process valid signature successfully', async () => {
      const event = createMockEvent('unknown.event', {});
      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.event_type).toBe('unknown.event');
    });
  });

  describe('checkout.session.completed Event', () => {
    it('should process subscription from checkout session', async () => {
      const session = createMockSession();
      const subscription = createMockSubscription();
      const event = createMockEvent('checkout.session.completed', session);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [] });
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(subscription);
    });

    it('should cancel duplicate active subscriptions for same customer', async () => {
      const session = createMockSession();
      const subscription = createMockSubscription();
      const duplicateSubscription = createMockSubscription({ id: 'sub_duplicate_123' });
      const event = createMockEvent('checkout.session.completed', session);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [subscription, duplicateSubscription],
      });
      mockStripe.subscriptions.cancel.mockResolvedValue({});
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      // Should cancel the duplicate but not the current subscription
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledTimes(1);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_duplicate_123');
    });

    it('should not cancel any subscriptions when only one exists', async () => {
      const session = createMockSession();
      const subscription = createMockSubscription();
      const event = createMockEvent('checkout.session.completed', session);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.subscriptions.list.mockResolvedValue({ data: [subscription] });
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockStripe.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it('should skip processing when session mode is not subscription', async () => {
      const paymentSession = createMockSession({ mode: 'payment' });
      const event = createMockEvent('checkout.session.completed', paymentSession);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
    });

    it('should skip processing when session has no subscription', async () => {
      const noSubSession = createMockSession({ subscription: null });
      const event = createMockEvent('checkout.session.completed', noSubSession);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated Event', () => {
    it('should process subscription update', async () => {
      const subscription = createMockSubscription();
      const event = createMockEvent('customer.subscription.updated', subscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(subscription);
    });

    it('should handle subscription status change to canceled', async () => {
      const canceledSubscription = createMockSubscription({ status: 'canceled' });
      const event = createMockEvent('customer.subscription.updated', canceledSubscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'canceled' })
      );
    });

    it('should handle subscription status change to trialing', async () => {
      const trialingSubscription = createMockSubscription({
        status: 'trialing',
        trial_start: Math.floor(Date.now() / 1000),
        trial_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      });
      const event = createMockEvent('customer.subscription.updated', trialingSubscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'trialing' })
      );
    });

    it('should handle subscription with cancel_at_period_end', async () => {
      const cancelAtEndSubscription = createMockSubscription({
        cancel_at_period_end: true,
      });
      const event = createMockEvent('customer.subscription.updated', cancelAtEndSubscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(
        expect.objectContaining({ cancel_at_period_end: true })
      );
    });
  });

  describe('customer.subscription.deleted Event', () => {
    it('should process subscription deletion', async () => {
      const subscription = createMockSubscription({ status: 'canceled' });
      const event = createMockEvent('customer.subscription.deleted', subscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(subscription);
    });
  });

  describe('invoice.payment_succeeded Event', () => {
    it('should sync subscription on payment success', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer();
      const tenant = createMockTenant();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);
      mockNotifyNewSubscriptionPayment.mockResolvedValue({ success: true });

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
      expect(mockHandleSubscriptionChange).toHaveBeenCalledWith(subscription);
    });

    it('should send admin notification on payment success', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer();
      const tenant = createMockTenant();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);
      mockNotifyNewSubscriptionPayment.mockResolvedValue({ success: true });

      const request = createMockRequest({});
      await POST(request);

      expect(mockNotifyNewSubscriptionPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          userName: 'Test Owner',
          userEmail: 'owner@test.com',
          tenantId: 'tenant-1',
          tenantName: 'Test Clinic',
          tenantSlug: 'test-clinic',
          planName: 'Plan Profesional',
          planAmount: 59900,
          currency: 'mxn',
          billingInterval: 'month',
          stripeCustomerId: 'cus_test_123',
          stripeSubscriptionId: 'sub_test_123',
        })
      );
    });

    it('should handle notification failure gracefully', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer();
      const tenant = createMockTenant();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);
      mockNotifyNewSubscriptionPayment.mockRejectedValue(new Error('Email failed'));

      const request = createMockRequest({});
      const response = await POST(request);

      // Should still succeed even if notification fails
      expect(response.status).toBe(200);
    });

    it('should skip notification when customer has no tenant metadata', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer({ metadata: {} });
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockNotifyNewSubscriptionPayment).not.toHaveBeenCalled();
    });

    it('should skip notification when tenant has no owner', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer();
      const tenantNoOwner = createMockTenant({ staff: [] });
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenantNoOwner as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockNotifyNewSubscriptionPayment).not.toHaveBeenCalled();
    });

    it('should skip processing when invoice has no subscription', async () => {
      const invoiceNoSub = createMockInvoice({ subscription: null });
      const event = createMockEvent('invoice.payment_succeeded', invoiceNoSub);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      await POST(request);

      expect(mockStripe.subscriptions.retrieve).not.toHaveBeenCalled();
      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
    });

    it('should handle annual billing interval correctly', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription({
        items: {
          data: [
            {
              plan: { product: 'prod_test_123' },
              price: {
                nickname: 'Plan Anual',
                recurring: { interval: 'year' },
              },
            },
          ],
        } as any,
      });
      const customer = createMockCustomer();
      const tenant = createMockTenant();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);
      mockNotifyNewSubscriptionPayment.mockResolvedValue({ success: true });

      const request = createMockRequest({});
      await POST(request);

      expect(mockNotifyNewSubscriptionPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          billingInterval: 'year',
        })
      );
    });
  });

  describe('invoice.payment_failed Event', () => {
    it('should handle payment failed gracefully', async () => {
      const failedInvoice = createMockInvoice({ status: 'open' });
      const event = createMockEvent('invoice.payment_failed', failedInvoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      // Should not try to sync subscription on failed payment
      expect(mockHandleSubscriptionChange).not.toHaveBeenCalled();
    });
  });

  describe('Unknown Event Types', () => {
    it('should handle unknown event type gracefully', async () => {
      const event = createMockEvent('some.unknown.event', { id: 'test' });
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.event_type).toBe('some.unknown.event');
    });

    it('should handle product.created event (unhandled)', async () => {
      const event = createMockEvent('product.created', { id: 'prod_123' });
      mockStripe.webhooks.constructEvent.mockReturnValue(event);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on processing error for checkout.session.completed', async () => {
      const session = createMockSession();
      const event = createMockEvent('checkout.session.completed', session);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockRejectedValue(new Error('Stripe API error'));

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error al procesar webhook');
      expect(data.details).toBe('Stripe API error');
    });

    it('should return 500 on processing error for subscription.updated', async () => {
      const subscription = createMockSubscription();
      const event = createMockEvent('customer.subscription.updated', subscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockRejectedValue(new Error('Database error'));

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error al procesar webhook');
    });

    it('should handle non-Error exceptions', async () => {
      const subscription = createMockSubscription();
      const event = createMockEvent('customer.subscription.updated', subscription);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockHandleSubscriptionChange.mockRejectedValue('String error');

      const request = createMockRequest({});
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty request body', async () => {
      mockHeadersGet.mockReturnValue('valid_signature');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid payload');
      });

      const request = createMockRequest('');
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should handle subscription retrieval returning string subscription ID', async () => {
      const invoice = createMockInvoice({ subscription: 'sub_string_id' });
      const subscription = createMockSubscription({ id: 'sub_string_id' });
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(createMockCustomer({ metadata: {} }));
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      expect(mockStripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_string_id');
    });

    it('should handle multiple duplicate subscriptions', async () => {
      const session = createMockSession();
      const subscription = createMockSubscription();
      const duplicate1 = createMockSubscription({ id: 'sub_dup_1' });
      const duplicate2 = createMockSubscription({ id: 'sub_dup_2' });
      const event = createMockEvent('checkout.session.completed', session);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.subscriptions.list.mockResolvedValue({
        data: [subscription, duplicate1, duplicate2],
      });
      mockStripe.subscriptions.cancel.mockResolvedValue({});
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      await POST(request);

      // Should cancel both duplicates
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledTimes(2);
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_dup_1');
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_dup_2');
    });

    it('should use fallback plan name when price has no nickname', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription({
        items: {
          data: [
            {
              plan: { product: 'prod_test_123' },
              price: {
                nickname: null,
                recurring: { interval: 'month' },
              },
            },
          ],
        } as any,
      });
      const customer = createMockCustomer();
      const tenant = createMockTenant();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);
      mockNotifyNewSubscriptionPayment.mockResolvedValue({ success: true });

      const request = createMockRequest({});
      await POST(request);

      expect(mockNotifyNewSubscriptionPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          planName: 'Plan Desconocido',
        })
      );
    });

    it('should handle customer retrieval error during notification', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockRejectedValue(new Error('Customer not found'));
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);

      // Should still succeed - notification is non-blocking
      expect(response.status).toBe(200);
    });

    it('should handle tenant not found during notification', async () => {
      const invoice = createMockInvoice();
      const subscription = createMockSubscription();
      const customer = createMockCustomer();
      const event = createMockEvent('invoice.payment_succeeded', invoice);

      mockStripe.webhooks.constructEvent.mockReturnValue(event);
      mockStripe.subscriptions.retrieve.mockResolvedValue(subscription);
      mockStripe.customers.retrieve.mockResolvedValue(customer);
      prismaMock.tenant.findUnique.mockResolvedValue(null);
      mockHandleSubscriptionChange.mockResolvedValue(undefined);

      const request = createMockRequest({});
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockNotifyNewSubscriptionPayment).not.toHaveBeenCalled();
    });
  });
});
