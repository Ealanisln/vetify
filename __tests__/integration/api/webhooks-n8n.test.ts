/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';

// Import route handlers
import { POST as n8nPOST } from '@/app/api/webhooks/n8n/route';
import { POST as petWelcomePOST, OPTIONS as petWelcomeOPTIONS } from '@/app/api/webhooks/n8n/webhook/pet-welcome/route';

// Helper to create mock requests
const createMockRequest = (body?: object, method = 'POST') => {
  const url = 'http://localhost:3000/api/webhooks/n8n';
  const req = new NextRequest(url, {
    method,
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
  return req;
};

const createPetWelcomeRequest = (body?: object) => {
  const url = 'http://localhost:3000/api/webhooks/n8n/webhook/pet-welcome';
  const req = new NextRequest(url, {
    method: 'POST',
    ...(body
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
  return req;
};

describe('N8N Webhook API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/webhooks/n8n', () => {
    it('should accept valid workflow notification', async () => {
      const request = createMockRequest({
        workflowType: 'appointment-reminder',
        status: 'completed',
        executionId: 'exec_123',
      });

      const response = await n8nPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Webhook processed successfully');
    });

    it('should handle payload without workflowType gracefully', async () => {
      const request = createMockRequest({
        someOtherField: 'value',
      });

      const response = await n8nPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle empty payload', async () => {
      const request = createMockRequest({});

      const response = await n8nPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 500 when payload is not valid JSON', async () => {
      const url = 'http://localhost:3000/api/webhooks/n8n';
      const req = new NextRequest(url, {
        method: 'POST',
        body: 'invalid-json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await n8nPOST(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/webhooks/n8n/webhook/pet-welcome', () => {
    it('should accept valid pet welcome data', async () => {
      const request = createPetWelcomeRequest({
        trigger: 'new_pet_registered',
        data: {
          petId: 'pet-123',
          petName: 'Luna',
          ownerName: 'María García',
          ownerPhone: '+52 555 123 4567',
          clinicId: 'clinic-1',
          automationType: 'pet-welcome',
        },
        workflowId: 'wf_123',
        executionId: 'exec_456',
      });

      const response = await petWelcomePOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.petId).toBe('pet-123');
      expect(data.message).toBe('Pet welcome webhook processed successfully');
    });

    it('should return 400 when petId is missing', async () => {
      const request = createPetWelcomeRequest({
        trigger: 'new_pet_registered',
        data: {
          ownerPhone: '+52 555 123 4567',
          petName: 'Luna',
        },
      });

      const response = await petWelcomePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when ownerPhone is missing', async () => {
      const request = createPetWelcomeRequest({
        trigger: 'new_pet_registered',
        data: {
          petId: 'pet-123',
          petName: 'Luna',
        },
      });

      const response = await petWelcomePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should return 400 when data object is missing entirely', async () => {
      const request = createPetWelcomeRequest({
        trigger: 'new_pet_registered',
      });

      const response = await petWelcomePOST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('OPTIONS /api/webhooks/n8n/webhook/pet-welcome', () => {
    it('should return CORS headers', async () => {
      const response = await petWelcomeOPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type, Authorization');
    });
  });
});
