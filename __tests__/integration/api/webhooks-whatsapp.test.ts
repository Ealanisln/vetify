 
import { NextRequest } from 'next/server';

// Set verify token BEFORE importing the route handler,
// since the route reads WHATSAPP_WEBHOOK_VERIFY_TOKEN at module level
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'test_verify_token_123';

// Import route handlers after env is set
import { GET, POST } from '@/app/api/webhooks/whatsapp/route';

// Helper to create GET request with query params
const createVerificationRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/webhooks/whatsapp');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url.toString(), { method: 'GET' });
};

// Helper to create POST request
const createMessageRequest = (body?: object) => {
  const url = 'http://localhost:3000/api/webhooks/whatsapp';
  const req = new NextRequest(url, {
    method: 'POST',
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
  return req;
};

describe('WhatsApp Webhook API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/webhooks/whatsapp - Webhook Verification', () => {
    it('should return challenge when verify token matches', async () => {
      const request = createVerificationRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'test_verify_token_123',
        'hub.challenge': 'challenge_abc_123',
      });

      const response = await GET(request);

      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('challenge_abc_123');
    });

    it('should return 403 when verify token does not match', async () => {
      const request = createVerificationRequest({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'challenge_abc_123',
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Verification failed');
    });

    it('should return 403 when hub.mode is not subscribe', async () => {
      const request = createVerificationRequest({
        'hub.mode': 'unsubscribe',
        'hub.verify_token': 'test_verify_token_123',
        'hub.challenge': 'challenge_abc_123',
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Verification failed');
    });

    it('should return 403 when hub.mode is missing', async () => {
      const request = createVerificationRequest({
        'hub.verify_token': 'test_verify_token_123',
        'hub.challenge': 'challenge_abc_123',
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should return 403 when verify token is missing from request', async () => {
      const request = createVerificationRequest({
        'hub.mode': 'subscribe',
        'hub.challenge': 'challenge_abc_123',
      });

      const response = await GET(request);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/webhooks/whatsapp - Incoming Messages', () => {
    it('should return 200 for valid WhatsApp message payload', async () => {
      const request = createMessageRequest({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '15551234567',
                    phone_number_id: 'phone_123',
                  },
                  messages: [
                    {
                      from: '525551234567',
                      id: 'wamid.abc123',
                      timestamp: '1709856000',
                      type: 'text',
                      text: { body: 'Hola, quiero agendar una cita' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
    });

    it('should return 200 for empty entry array', async () => {
      const request = createMessageRequest({
        object: 'whatsapp_business_account',
        entry: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
    });

    it('should return 200 for payload with no messages in changes', async () => {
      const request = createMessageRequest({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                field: 'statuses',
                value: {
                  statuses: [
                    {
                      id: 'wamid.abc123',
                      status: 'delivered',
                      timestamp: '1709856000',
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
    });

    it('should return 200 for non-whatsapp object', async () => {
      const request = createMessageRequest({
        object: 'instagram',
        entry: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
    });

    it('should handle invalid JSON payload', async () => {
      const url = 'http://localhost:3000/api/webhooks/whatsapp';
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'not-valid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Processing failed');
    });

    it('should handle multiple messages in a single entry', async () => {
      const request = createMessageRequest({
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry_123',
            changes: [
              {
                field: 'messages',
                value: {
                  messages: [
                    {
                      from: '525551234567',
                      id: 'wamid.msg1',
                      timestamp: '1709856000',
                      type: 'text',
                      text: { body: 'Primer mensaje' },
                    },
                    {
                      from: '525551234567',
                      id: 'wamid.msg2',
                      timestamp: '1709856001',
                      type: 'text',
                      text: { body: 'Segundo mensaje' },
                    },
                  ],
                },
              },
            ],
          },
        ],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('received');
    });
  });
});
