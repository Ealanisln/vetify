/**
 * Tests for Webhook Delivery Service
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// Mock @prisma/client BEFORE importing anything that depends on it
jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  return {
    ...actual,
    WebhookDeliveryStatus: {
      PENDING: 'PENDING',
      DELIVERED: 'DELIVERED',
      FAILED: 'FAILED',
      SKIPPED: 'SKIPPED',
    },
  };
});

import { prismaMock } from '../../../mocks/prisma';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock crypto.randomUUID
const mockUUID = 'test-delivery-uuid-123';
jest.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

// Mock webhook-signature module
jest.mock('@/lib/webhooks/webhook-signature', () => ({
  signPayload: jest.fn(() => 'sha256=mockedsignature123456789'),
}));

// Import after mocks are set up
import {
  triggerWebhookEvent,
  deliverWebhook,
  checkAndDisableWebhook,
  sendTestWebhook,
  RETRY_DELAYS,
  MAX_RETRY_ATTEMPTS,
  MAX_CONSECUTIVE_FAILURES,
  DELIVERY_TIMEOUT,
} from '@/lib/webhooks/webhook-delivery';

// Define locally for test assertions
const WebhookDeliveryStatus = {
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  SKIPPED: 'SKIPPED',
} as const;

// Test data factories
const createTestWebhook = (overrides = {}) => ({
  id: 'webhook-1',
  tenantId: 'tenant-1',
  name: 'Test Webhook',
  url: 'https://example.com/webhook',
  secret: 'whsec_testsecret1234567890123456789012345678901234',
  events: ['pet.created', 'pet.updated'],
  isActive: true,
  consecutiveFailures: 0,
  lastDeliveryAt: null,
  lastSuccessAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestDeliveryLog = (overrides = {}) => ({
  id: 'delivery-log-1',
  webhookId: 'webhook-1',
  eventType: 'pet.created',
  payload: { event: 'pet.created', timestamp: '2024-01-01T00:00:00.000Z', data: {} },
  attempt: 1,
  status: WebhookDeliveryStatus.PENDING,
  httpStatusCode: null,
  responseBody: null,
  error: null,
  deliveredAt: null,
  createdAt: new Date('2024-01-01'),
  scheduledFor: null,
  ...overrides,
});

describe('Webhook Delivery Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Constants', () => {
    it('should have correct RETRY_DELAYS', () => {
      expect(RETRY_DELAYS).toEqual([0, 60000, 300000, 1800000]);
    });

    it('should have correct MAX_RETRY_ATTEMPTS', () => {
      expect(MAX_RETRY_ATTEMPTS).toBe(4);
    });

    it('should have correct MAX_CONSECUTIVE_FAILURES', () => {
      expect(MAX_CONSECUTIVE_FAILURES).toBe(10);
    });

    it('should have correct DELIVERY_TIMEOUT', () => {
      expect(DELIVERY_TIMEOUT).toBe(30000);
    });
  });

  describe('triggerWebhookEvent', () => {
    it('should do nothing for invalid event type', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await triggerWebhookEvent('tenant-1', 'invalid.event' as any, { id: '123' });

      expect(consoleSpy).toHaveBeenCalledWith('[Webhooks] Invalid event type: invalid.event');
      expect(prismaMock.webhook.findMany).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should do nothing when no webhooks are subscribed', async () => {
      prismaMock.webhook.findMany.mockResolvedValue([]);

      await triggerWebhookEvent('tenant-1', 'pet.created', { id: '123' });

      expect(prismaMock.webhook.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          isActive: true,
          events: { has: 'pet.created' },
        },
      });
    });

    it('should trigger delivery for all subscribed webhooks', async () => {
      const webhooks = [
        createTestWebhook({ id: 'webhook-1' }),
        createTestWebhook({ id: 'webhook-2' }),
      ];
      prismaMock.webhook.findMany.mockResolvedValue(webhooks);
      prismaMock.webhook.findUnique.mockResolvedValue(webhooks[0]);
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      await triggerWebhookEvent('tenant-1', 'pet.created', { id: '123' });

      expect(prismaMock.webhook.findMany).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      prismaMock.webhook.findMany.mockRejectedValue(new Error('Database error'));

      await triggerWebhookEvent('tenant-1', 'pet.created', { id: '123' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('deliverWebhook', () => {
    it('should return error when webhook not found', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(null);

      const result = await deliverWebhook('non-existent', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook not found');
    });

    it('should return error when webhook is disabled', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(
        createTestWebhook({ isActive: false })
      );

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook is disabled');
    });

    it('should deliver successfully with 200 response', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('{"status": "ok"}'),
      });

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: { id: '123' },
      });

      expect(result.success).toBe(true);
      expect(result.httpStatusCode).toBe(200);
      expect(result.responseBody).toBe('{"status": "ok"}');

      // Verify webhook was called with correct headers
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Vetify-Signature': 'sha256=mockedsignature123456789',
            'X-Vetify-Event': 'pet.created',
            'X-Vetify-Delivery-Id': mockUUID,
            'User-Agent': 'Vetify-Webhooks/1.0',
          }),
        })
      );
    });

    it('should handle failed delivery (non-2xx response)', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook({ consecutiveFailures: 1 }));

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      }, 1);

      expect(result.success).toBe(false);
      expect(result.httpStatusCode).toBe(500);

      // Should increment consecutive failures
      expect(prismaMock.webhook.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: expect.objectContaining({
          consecutiveFailures: { increment: 1 },
        }),
      });
    });

    it('should handle network errors', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      }, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      }, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Request timed out');
    });

    it('should reset consecutive failures on success', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(
        createTestWebhook({ consecutiveFailures: 5 })
      );
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      });

      expect(prismaMock.webhook.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: expect.objectContaining({
          consecutiveFailures: 0,
        }),
      });
    });

    it('should truncate long response bodies', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      const longResponse = 'x'.repeat(15000);
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(longResponse),
      });

      const result = await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: new Date().toISOString(),
        data: {},
      });

      expect(result.success).toBe(true);
      expect(result.responseBody?.length).toBeLessThanOrEqual(10020); // 10000 + '... (truncated)'
      expect(result.responseBody?.endsWith('... (truncated)')).toBe(true);
    });
  });

  describe('checkAndDisableWebhook', () => {
    it('should return false when webhook not found', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(null);

      const result = await checkAndDisableWebhook('non-existent');

      expect(result).toBe(false);
    });

    it('should return false when webhook already disabled', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue({
        consecutiveFailures: 15,
        isActive: false,
      } as any);

      const result = await checkAndDisableWebhook('webhook-1');

      expect(result).toBe(false);
      expect(prismaMock.webhook.update).not.toHaveBeenCalled();
    });

    it('should return false when failures below threshold', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue({
        consecutiveFailures: 5,
        isActive: true,
      } as any);

      const result = await checkAndDisableWebhook('webhook-1');

      expect(result).toBe(false);
      expect(prismaMock.webhook.update).not.toHaveBeenCalled();
    });

    it('should disable webhook when failures reach threshold', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      prismaMock.webhook.findUnique.mockResolvedValue({
        consecutiveFailures: 10,
        isActive: true,
      } as any);
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook({ isActive: false }));

      const result = await checkAndDisableWebhook('webhook-1');

      expect(result).toBe(true);
      expect(prismaMock.webhook.update).toHaveBeenCalledWith({
        where: { id: 'webhook-1' },
        data: { isActive: false },
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        `[Webhooks] Webhook webhook-1 disabled after ${MAX_CONSECUTIVE_FAILURES} consecutive failures`
      );

      consoleSpy.mockRestore();
    });

    it('should disable webhook when failures exceed threshold', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      prismaMock.webhook.findUnique.mockResolvedValue({
        consecutiveFailures: 15,
        isActive: true,
      } as any);
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook({ isActive: false }));

      const result = await checkAndDisableWebhook('webhook-1');

      expect(result).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('sendTestWebhook', () => {
    it('should return error when webhook not found', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(null);

      const result = await sendTestWebhook('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook not found');
    });

    it('should return error when webhook is disabled', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(
        createTestWebhook({ isActive: false })
      );

      const result = await sendTestWebhook('webhook-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Webhook is disabled');
    });

    it('should send test webhook successfully', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('Test received'),
      });

      const result = await sendTestWebhook('webhook-1');

      expect(result.success).toBe(true);
      expect(result.httpStatusCode).toBe(200);
      expect(result.responseBody).toBe('Test received');
    });

    it('should use test.ping as event type', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      await sendTestWebhook('webhook-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Vetify-Event': 'test.ping',
          }),
        })
      );
    });

    it('should create delivery log with test.ping event', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      await sendTestWebhook('webhook-1');

      expect(prismaMock.webhookDeliveryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'test.ping',
        }),
      });
    });

    it('should handle test webhook failure', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      const result = await sendTestWebhook('webhook-1');

      expect(result.success).toBe(false);
      expect(result.httpStatusCode).toBe(500);
    });
  });

  describe('WebhookPayload structure', () => {
    it('should include correct fields in payload', async () => {
      prismaMock.webhook.findUnique.mockResolvedValue(createTestWebhook());
      prismaMock.webhookDeliveryLog.create.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhookDeliveryLog.update.mockResolvedValue(createTestDeliveryLog());
      prismaMock.webhook.update.mockResolvedValue(createTestWebhook());

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('OK'),
      });

      const testData = { id: '123', name: 'Test Pet' };

      await deliverWebhook('webhook-1', 'pet.created', {
        event: 'pet.created' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
        data: testData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"event":"pet.created"'),
        })
      );
    });
  });
});
