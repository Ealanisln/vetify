/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextRequest } from 'next/server';

// Mock updateEmailStatus before importing route
const mockUpdateEmailStatus = jest.fn();
jest.mock('@/lib/notifications/notification-logger', () => ({
  updateEmailStatus: (...args: any[]) => mockUpdateEmailStatus(...args),
}));

// Import after mocks
import { GET, POST } from '@/app/api/webhooks/resend/route';

// Test data factories
const createResendEvent = (type: string, overrides: Record<string, any> = {}) => ({
  type,
  created_at: '2026-03-08T12:00:00.000Z',
  data: {
    email_id: 'email_test_123',
    from: 'noreply@vetify.app',
    to: ['vet@example.com'],
    subject: 'Recordatorio de cita',
    created_at: '2026-03-08T11:59:00.000Z',
    ...overrides,
  },
});

const createMockRequest = (body?: object) => {
  const url = 'http://localhost:3000/api/webhooks/resend';
  const req = new NextRequest(url, {
    method: 'POST',
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
  return req;
};

describe('Resend Webhook API Integration Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    // Ensure no webhook secret is set (dev mode - skip signature verification)
    process.env = { ...originalEnv };
    delete process.env.RESEND_WEBHOOK_SECRET;
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('GET /api/webhooks/resend', () => {
    it('should return status ok', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.message).toBe('Resend webhook endpoint is active');
    });
  });

  describe('POST /api/webhooks/resend', () => {
    it('should process email.delivered event and update status', async () => {
      const event = createResendEvent('email.delivered');
      mockUpdateEmailStatus.mockResolvedValue(undefined);

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.action).toBe('updated');
      expect(data.status).toBe('DELIVERED');
      expect(mockUpdateEmailStatus).toHaveBeenCalledWith(
        'email_test_123',
        'DELIVERED',
        undefined
      );
    });

    it('should process email.bounced event with error message', async () => {
      const event = createResendEvent('email.bounced', {
        bounce: {
          message: 'Mailbox not found',
          type: 'hard',
        },
      });
      mockUpdateEmailStatus.mockResolvedValue(undefined);

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.action).toBe('updated');
      expect(data.status).toBe('BOUNCED');
      expect(mockUpdateEmailStatus).toHaveBeenCalledWith(
        'email_test_123',
        'BOUNCED',
        'hard: Mailbox not found'
      );
    });

    it('should process email.complained event as BOUNCED', async () => {
      const event = createResendEvent('email.complained', {
        complaint: {
          message: 'User marked as spam',
        },
      });
      mockUpdateEmailStatus.mockResolvedValue(undefined);

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('updated');
      expect(data.status).toBe('BOUNCED');
      expect(mockUpdateEmailStatus).toHaveBeenCalledWith(
        'email_test_123',
        'BOUNCED',
        'Spam complaint: User marked as spam'
      );
    });

    it('should ignore email.sent event type', async () => {
      const event = createResendEvent('email.sent');

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.action).toBe('ignored');
      expect(mockUpdateEmailStatus).not.toHaveBeenCalled();
    });

    it('should ignore email.opened event type', async () => {
      const event = createResendEvent('email.opened');

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('ignored');
      expect(mockUpdateEmailStatus).not.toHaveBeenCalled();
    });

    it('should ignore email.clicked event type', async () => {
      const event = createResendEvent('email.clicked');

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.action).toBe('ignored');
      expect(mockUpdateEmailStatus).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON payload gracefully', async () => {
      const url = 'http://localhost:3000/api/webhooks/resend';
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'not-valid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      // Returns 200 to prevent Resend from retrying
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.action).toBe('error');
    });

    it('should handle updateEmailStatus failure gracefully', async () => {
      const event = createResendEvent('email.delivered');
      mockUpdateEmailStatus.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest(event);
      const response = await POST(request);
      const data = await response.json();

      // Returns 200 to prevent retries, but logs the error
      expect(response.status).toBe(200);
      expect(data.received).toBe(true);
      expect(data.action).toBe('error');
      expect(data.error).toBe('Database connection failed');
    });

    it('should process email.bounced event without bounce type', async () => {
      const event = createResendEvent('email.bounced', {
        bounce: {
          message: 'Generic bounce',
        },
      });
      mockUpdateEmailStatus.mockResolvedValue(undefined);

      const request = createMockRequest(event);
      const response = await POST(request);

      expect(mockUpdateEmailStatus).toHaveBeenCalledWith(
        'email_test_123',
        'BOUNCED',
        'Generic bounce'
      );
    });
  });
});
