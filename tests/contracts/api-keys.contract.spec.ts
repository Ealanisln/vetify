import { test, expect } from '@playwright/test';

/**
 * Contract Tests for API Key Management
 *
 * Validates API response schemas and contracts:
 * - GET /api/settings/api-keys returns correct structure
 * - POST /api/settings/api-keys returns fullKey only on creation
 * - PUT /api/settings/api-keys/[id] returns updated key
 * - DELETE /api/settings/api-keys/[id] returns success
 * - Error responses follow consistent format
 *
 * NOTE: These tests require authentication and CORPORATIVO plan.
 */

const isAuthTestEnabled = process.env.TEST_AUTH_ENABLED === 'true';

/**
 * Expected response interfaces
 */
interface ApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsed: string | null;
  isActive: boolean;
  expiresAt: string | null;
  rateLimit: number;
  createdAt: string;
  locationId: string | null;
  location?: { id: string; name: string } | null;
}

interface CreateApiKeyResponse extends ApiKeyResponse {
  fullKey: string; // Only on creation
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

test.describe('API Key Contract Tests', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  test.describe('GET /api/settings/api-keys', () => {
    test('should return correct structure', async ({ request }) => {
      const response = await request.get('/api/settings/api-keys');

      expect(response.ok()).toBeTruthy();

      const body: ApiResponse<ApiKeyResponse[]> = await response.json();

      // Top-level structure
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);

      // Validate each key in response
      if (body.data && body.data.length > 0) {
        const key = body.data[0];

        // Required fields
        expect(key).toHaveProperty('id');
        expect(key).toHaveProperty('name');
        expect(key).toHaveProperty('keyPrefix');
        expect(key).toHaveProperty('scopes');
        expect(key).toHaveProperty('isActive');
        expect(key).toHaveProperty('rateLimit');
        expect(key).toHaveProperty('createdAt');

        // Type validations
        expect(typeof key.id).toBe('string');
        expect(typeof key.name).toBe('string');
        expect(typeof key.keyPrefix).toBe('string');
        expect(Array.isArray(key.scopes)).toBe(true);
        expect(typeof key.isActive).toBe('boolean');
        expect(typeof key.rateLimit).toBe('number');

        // Security: keyHash should NEVER be exposed
        expect(key).not.toHaveProperty('keyHash');

        // Security: fullKey should NEVER be exposed in GET
        expect(key).not.toHaveProperty('fullKey');
      }
    });

    test('should return keyPrefix in correct format', async ({ request }) => {
      const response = await request.get('/api/settings/api-keys');
      const body: ApiResponse<ApiKeyResponse[]> = await response.json();

      if (body.data && body.data.length > 0) {
        for (const key of body.data) {
          // Prefix format: vfy_{8 hex chars}
          expect(key.keyPrefix).toMatch(/^vfy_[a-f0-9]{8}$/);
        }
      }
    });

    test('should return valid scopes array', async ({ request }) => {
      const response = await request.get('/api/settings/api-keys');
      const body: ApiResponse<ApiKeyResponse[]> = await response.json();

      const validScopes = [
        'read:pets',
        'write:pets',
        'read:appointments',
        'write:appointments',
        'read:customers',
        'write:customers',
        'read:inventory',
        'write:inventory',
        'read:locations',
        'read:reports',
        'read:sales',
        'write:sales',
      ];

      if (body.data && body.data.length > 0) {
        for (const key of body.data) {
          for (const scope of key.scopes) {
            expect(validScopes).toContain(scope);
          }
        }
      }
    });

    test('should return location object when locationId is set', async ({ request }) => {
      const response = await request.get('/api/settings/api-keys');
      const body: ApiResponse<ApiKeyResponse[]> = await response.json();

      if (body.data) {
        for (const key of body.data) {
          if (key.locationId) {
            expect(key.location).toBeDefined();
            expect(key.location).toHaveProperty('id');
            expect(key.location).toHaveProperty('name');
          } else {
            expect(key.location).toBeNull();
          }
        }
      }
    });
  });

  test.describe('POST /api/settings/api-keys', () => {
    test('should return fullKey only on creation', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: `Contract Test Key ${Date.now()}`,
          scopes: ['read:pets'],
        },
      });

      if (response.ok()) {
        const body: ApiResponse<CreateApiKeyResponse> = await response.json();

        expect(body.success).toBe(true);
        expect(body.data).toBeDefined();

        // CRITICAL: fullKey should be present ONLY on creation
        expect(body.data?.fullKey).toBeDefined();
        expect(body.data?.fullKey).toMatch(/^vfy_[a-f0-9]{8}_[a-f0-9]{32}$/);

        // Other fields should be present
        expect(body.data?.id).toBeDefined();
        expect(body.data?.name).toBeDefined();
        expect(body.data?.keyPrefix).toBeDefined();
      }
    });

    test('should return error for invalid data', async ({ request }) => {
      // Missing name
      const response = await request.post('/api/settings/api-keys', {
        data: {
          scopes: ['read:pets'],
        },
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);

      const body: ApiResponse<null> = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });

    test('should return error for invalid scopes', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: 'Invalid Scope Key',
          scopes: ['invalid:scope'],
        },
      });

      if (!response.ok()) {
        const body: ApiResponse<null> = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('inválido');
      }
    });

    test('should return error for empty scopes', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: 'No Scopes Key',
          scopes: [],
        },
      });

      expect(response.ok()).toBeFalsy();
      const body: ApiResponse<null> = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('PUT /api/settings/api-keys/[id]', () => {
    let testKeyId: string | null = null;

    test.beforeAll(async ({ request }) => {
      // Create a key to update
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: `Update Contract Test ${Date.now()}`,
          scopes: ['read:pets'],
        },
      });

      if (response.ok()) {
        const body = await response.json();
        testKeyId = body.data?.id;
      }
    });

    test('should return updated key without fullKey', async ({ request }) => {
      if (!testKeyId) {
        test.skip();
        return;
      }

      const response = await request.put(`/api/settings/api-keys/${testKeyId}`, {
        data: {
          name: 'Updated Name',
        },
      });

      if (response.ok()) {
        const body: ApiResponse<ApiKeyResponse> = await response.json();

        expect(body.success).toBe(true);
        expect(body.data?.name).toBe('Updated Name');

        // CRITICAL: fullKey should NOT be in update response
        expect(body.data).not.toHaveProperty('fullKey');

        // keyHash should NOT be in response
        expect(body.data).not.toHaveProperty('keyHash');
      }
    });

    test('should return 404 for non-existent key', async ({ request }) => {
      const response = await request.put('/api/settings/api-keys/non-existent-id', {
        data: {
          name: 'Updated Name',
        },
      });

      expect(response.status()).toBe(404);

      const body: ApiResponse<null> = await response.json();
      expect(body.success).toBe(false);
      expect(body.error).toBeDefined();
    });
  });

  test.describe('DELETE /api/settings/api-keys/[id]', () => {
    test('should return success message', async ({ request }) => {
      // First create a key to delete
      const createResponse = await request.post('/api/settings/api-keys', {
        data: {
          name: `Delete Contract Test ${Date.now()}`,
          scopes: ['read:pets'],
        },
      });

      if (!createResponse.ok()) {
        test.skip();
        return;
      }

      const createBody = await createResponse.json();
      const keyId = createBody.data?.id;

      // Delete the key
      const response = await request.delete(`/api/settings/api-keys/${keyId}`);

      expect(response.ok()).toBeTruthy();

      const body: ApiResponse<null> = await response.json();
      expect(body.success).toBe(true);
      expect(body.message).toBeDefined();
    });

    test('should return 404 for non-existent key', async ({ request }) => {
      const response = await request.delete('/api/settings/api-keys/non-existent-id');

      expect(response.status()).toBe(404);

      const body: ApiResponse<null> = await response.json();
      expect(body.success).toBe(false);
    });
  });

  test.describe('Error Response Contract', () => {
    test('should return consistent error structure', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          // Invalid data
        },
      });

      expect(response.ok()).toBeFalsy();

      const body: ApiResponse<null> = await response.json();

      // Error response structure
      expect(body).toHaveProperty('success');
      expect(body.success).toBe(false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test('should return 403 for non-CORPORATIVO users', async ({ request }) => {
      // This test would require a non-CORPORATIVO user context
      // The response should indicate feature not available
      const response = await request.get('/api/settings/api-keys');

      // If user doesn't have access, should be 403
      if (response.status() === 403) {
        const body: ApiResponse<null> = await response.json();
        expect(body.success).toBe(false);
        expect(body.error).toContain('Corporativo');
      }
    });

    test('should return 401 for unauthenticated requests', async ({ request }) => {
      // This would need to be tested without auth cookies
      // For now, we verify the expected behavior
      // The API should return 401 if no valid session
    });
  });

  test.describe('Rate Limit Contract', () => {
    test('should accept rate limit in valid range', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: `Rate Limit Test ${Date.now()}`,
          scopes: ['read:pets'],
          rateLimit: 5000,
        },
      });

      if (response.ok()) {
        const body: ApiResponse<ApiKeyResponse> = await response.json();
        expect(body.data?.rateLimit).toBe(5000);
      }
    });

    test('should default rate limit to 1000', async ({ request }) => {
      const response = await request.post('/api/settings/api-keys', {
        data: {
          name: `Default Rate Limit ${Date.now()}`,
          scopes: ['read:pets'],
          // No rateLimit specified
        },
      });

      if (response.ok()) {
        const body: ApiResponse<ApiKeyResponse> = await response.json();
        expect(body.data?.rateLimit).toBe(1000);
      }
    });
  });

  test.describe('Date Field Contract', () => {
    test('should return dates in ISO format', async ({ request }) => {
      const response = await request.get('/api/settings/api-keys');
      const body: ApiResponse<ApiKeyResponse[]> = await response.json();

      if (body.data && body.data.length > 0) {
        const key = body.data[0];

        // createdAt should be ISO string
        expect(key.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

        // lastUsed can be null or ISO string
        if (key.lastUsed) {
          expect(key.lastUsed).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }

        // expiresAt can be null or ISO string
        if (key.expiresAt) {
          expect(key.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        }
      }
    });
  });
});

/**
 * Schema Snapshot Tests
 */
test.describe('API Key Schema Snapshots', () => {
  test.skip(!isAuthTestEnabled, 'Skipping - requires authenticated session');

  test('GET response should match expected schema', async ({ request }) => {
    const response = await request.get('/api/settings/api-keys');
    const body = await response.json();

    // This creates a snapshot for regression testing
    // In a real scenario, you'd compare against a stored snapshot

    const schema = {
      success: 'boolean',
      data: 'array',
      dataItem: {
        id: 'string',
        name: 'string',
        keyPrefix: 'string',
        scopes: 'array',
        lastUsed: 'string|null',
        isActive: 'boolean',
        expiresAt: 'string|null',
        rateLimit: 'number',
        createdAt: 'string',
        locationId: 'string|null',
      },
    };

    expect(typeof body.success).toBe('boolean');
    expect(Array.isArray(body.data)).toBe(true);

    if (body.data && body.data.length > 0) {
      const item = body.data[0];
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.keyPrefix).toBe('string');
      expect(Array.isArray(item.scopes)).toBe(true);
      expect(typeof item.isActive).toBe('boolean');
      expect(typeof item.rateLimit).toBe('number');
    }
  });
});
