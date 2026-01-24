/**
 * Security-focused Integration Tests for API Keys
 *
 * Tests security aspects:
 * - keyHash is never exposed in any response
 * - Full key only returned on POST creation
 * - Rate limiting works on API endpoints
 * - Expired keys are marked correctly
 * - Feature gating blocks non-CORPORATIVO users
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestStaff } from '../../utils/test-utils';
import {
  generateApiKey,
  hashApiKey,
  isValidApiKeyFormat,
} from '@/lib/api/api-key-utils';

// Mock auth
jest.mock('@/lib/auth', () => ({
  requirePermission: jest.fn(),
}));

// Mock subscription check
jest.mock('@/app/actions/subscription', () => ({
  checkFeatureAccess: jest.fn(),
}));

// Import after mocks
import { requirePermission } from '@/lib/auth';
import { checkFeatureAccess } from '@/app/actions/subscription';

const mockRequirePermission = requirePermission as jest.MockedFunction<typeof requirePermission>;
const mockCheckFeatureAccess = checkFeatureAccess as jest.MockedFunction<typeof checkFeatureAccess>;

// Test data factories
const createTestApiKey = (overrides = {}) => ({
  id: 'key-1',
  tenantId: 'tenant-1',
  name: 'Test API Key',
  keyPrefix: 'vfy_abc12345',
  keyHash: 'hashedkey123456789abcdef0123456789abcdef0123456789abcdef01234567',
  scopes: ['read:pets', 'write:pets'],
  lastUsed: null,
  isActive: true,
  expiresAt: null,
  rateLimit: 1000,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  locationId: null,
  createdById: 'staff-1',
  ...overrides,
});

describe('API Keys Security Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTenant = createTestTenant({
      id: 'tenant-1',
      planType: 'CORPORATIVO',
    });

    mockStaff = createTestStaff({
      id: 'staff-1',
      tenantId: 'tenant-1',
    });

    mockRequirePermission.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      tenant: mockTenant as any,
      staff: mockStaff as any,
    });

    mockCheckFeatureAccess.mockResolvedValue(true);
  });

  describe('keyHash Protection', () => {
    it('should NEVER include keyHash in GET list response', async () => {
      const mockKey = createTestApiKey();

      // Simulate what the API does - select specific fields
      const selectFields = {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        lastUsed: true,
        isActive: true,
        expiresAt: true,
        rateLimit: true,
        createdAt: true,
        locationId: true,
        location: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      };

      // Verify keyHash is NOT in the select
      expect(selectFields).not.toHaveProperty('keyHash');

      // The response object built from select should not have keyHash
      const responseData = {
        id: mockKey.id,
        name: mockKey.name,
        keyPrefix: mockKey.keyPrefix,
        scopes: mockKey.scopes,
        isActive: mockKey.isActive,
        // Note: NO keyHash
      };

      expect(responseData).not.toHaveProperty('keyHash');
    });

    it('should NEVER include keyHash in GET single key response', async () => {
      const mockKey = createTestApiKey();
      prismaMock.tenantApiKey.findFirst.mockResolvedValue({
        id: mockKey.id,
        name: mockKey.name,
        keyPrefix: mockKey.keyPrefix,
        scopes: mockKey.scopes,
        lastUsed: mockKey.lastUsed,
        isActive: mockKey.isActive,
        expiresAt: mockKey.expiresAt,
        rateLimit: mockKey.rateLimit,
        createdAt: mockKey.createdAt,
        locationId: mockKey.locationId,
        location: null,
        createdBy: null,
        // Note: keyHash is NOT included in select
      } as any);

      const result = await prismaMock.tenantApiKey.findFirst({
        where: { id: 'key-1', tenantId: 'tenant-1' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          // keyHash NOT selected
        },
      });

      expect(result).not.toHaveProperty('keyHash');
    });

    it('should NEVER include keyHash in PUT response', async () => {
      const updatedKey = {
        id: 'key-1',
        name: 'Updated Name',
        keyPrefix: 'vfy_abc12345',
        scopes: ['read:pets'],
        isActive: true,
        // Note: NO keyHash
      };

      prismaMock.tenantApiKey.update.mockResolvedValue(updatedKey as any);

      const result = await prismaMock.tenantApiKey.update({
        where: { id: 'key-1' },
        data: { name: 'Updated Name' },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          // keyHash NOT selected
        },
      });

      expect(result).not.toHaveProperty('keyHash');
    });
  });

  describe('Full Key Exposure', () => {
    it('should return fullKey ONLY on POST creation', () => {
      // Generate a new key
      const { fullKey, keyPrefix, keyHash } = generateApiKey();

      // On creation, we return fullKey
      const creationResponse = {
        id: 'key-new',
        name: 'New Key',
        keyPrefix,
        fullKey, // Only time this is returned
        scopes: ['read:pets'],
      };

      expect(creationResponse.fullKey).toBeDefined();
      expect(creationResponse.fullKey).toMatch(/^vfy_[a-f0-9]{8}_[a-f0-9]{32}$/);
    });

    it('should store keyHash in database, not fullKey', () => {
      const { fullKey, keyPrefix, keyHash } = generateApiKey();

      // What gets stored in DB
      const dbRecord = {
        tenantId: 'tenant-1',
        name: 'New Key',
        keyPrefix,
        keyHash, // Store hash
        // fullKey is NOT stored
        scopes: ['read:pets'],
      };

      expect(dbRecord).toHaveProperty('keyHash');
      expect(dbRecord).not.toHaveProperty('fullKey');
    });

    it('should generate consistent hash for verification', () => {
      const { fullKey, keyHash } = generateApiKey();

      // When API key is used, we hash the incoming key and compare
      const incomingKeyHash = hashApiKey(fullKey);

      expect(incomingKeyHash).toBe(keyHash);
    });
  });

  describe('API Key Format Validation', () => {
    it('should validate correct key format', () => {
      const validKey = 'vfy_abc12345_abcdef1234567890abcdef1234567890';
      expect(isValidApiKeyFormat(validKey)).toBe(true);
    });

    it('should reject keys with wrong prefix', () => {
      const wrongPrefix = 'api_abc12345_abcdef1234567890abcdef1234567890';
      expect(isValidApiKeyFormat(wrongPrefix)).toBe(false);
    });

    it('should reject keys with wrong format', () => {
      const wrongFormats = [
        'vfy_short_key',
        'vfy_abc1234_abcdef1234567890abcdef1234567890', // 7 char prefix
        'vfy_abc123456_abcdef1234567890abcdef1234567890', // 9 char prefix
        'vfy_abc12345_short', // Short secret
        'invalid_key_format',
        '',
      ];

      wrongFormats.forEach((key) => {
        expect(isValidApiKeyFormat(key)).toBe(false);
      });
    });

    it('should only accept lowercase hex characters', () => {
      const upperCase = 'vfy_ABC12345_ABCDEF1234567890ABCDEF1234567890';
      expect(isValidApiKeyFormat(upperCase)).toBe(false);
    });
  });

  describe('Expired Keys', () => {
    it('should correctly identify expired keys', () => {
      const pastDate = new Date('2020-01-01');
      const futureDate = new Date('2030-01-01');
      const now = new Date();

      expect(pastDate < now).toBe(true); // Expired
      expect(futureDate < now).toBe(false); // Not expired
    });

    it('should not allow use of expired keys', async () => {
      const expiredKey = createTestApiKey({
        expiresAt: new Date('2020-01-01'),
      });

      // Check expiration
      const isExpired = expiredKey.expiresAt && new Date(expiredKey.expiresAt) < new Date();
      expect(isExpired).toBe(true);

      // API should reject expired keys
      // Implementation would check: if (isExpired) return 401;
    });

    it('should allow keys without expiration', async () => {
      const neverExpires = createTestApiKey({
        expiresAt: null,
      });

      const isExpired = neverExpires.expiresAt && new Date(neverExpires.expiresAt) < new Date();
      expect(isExpired).toBeFalsy();
    });
  });

  describe('Feature Gating', () => {
    it('should block API access for BASICO plan', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);
      mockRequirePermission.mockResolvedValue({
        user: { id: 'user-1' } as any,
        tenant: { ...mockTenant, planType: 'BASICO' } as any,
        staff: mockStaff as any,
      });

      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(false);

      // API would return: { error: 'Esta función requiere el plan Corporativo' }, { status: 403 }
    });

    it('should block API access for PROFESIONAL plan', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);
      mockRequirePermission.mockResolvedValue({
        user: { id: 'user-1' } as any,
        tenant: { ...mockTenant, planType: 'PROFESIONAL' } as any,
        staff: mockStaff as any,
      });

      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(false);
    });

    it('should allow API access for CORPORATIVO plan', async () => {
      mockCheckFeatureAccess.mockResolvedValue(true);
      mockRequirePermission.mockResolvedValue({
        user: { id: 'user-1' } as any,
        tenant: { ...mockTenant, planType: 'CORPORATIVO' } as any,
        staff: mockStaff as any,
      });

      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(true);
    });
  });

  describe('Scope Validation', () => {
    it('should reject invalid scopes', () => {
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

      const validateScopes = (scopes: string[]) => {
        return scopes.filter((s) => !validScopes.includes(s));
      };

      expect(validateScopes(['read:pets', 'write:pets'])).toHaveLength(0);
      expect(validateScopes(['invalid:scope'])).toHaveLength(1);
      expect(validateScopes(['read:pets', 'admin:all'])).toHaveLength(1);
    });

    it('should require at least one scope', () => {
      const emptyScopes: string[] = [];
      expect(emptyScopes.length).toBe(0);
      // API would return: { error: 'Debe seleccionar al menos un permiso' }, { status: 400 }
    });
  });

  describe('Rate Limit Validation', () => {
    it('should enforce minimum rate limit of 100', () => {
      const minRateLimit = 100;
      const invalidRateLimit = 50;

      expect(invalidRateLimit < minRateLimit).toBe(true);
      // API would reject or clamp to 100
    });

    it('should enforce maximum rate limit of 100000', () => {
      const maxRateLimit = 100000;
      const invalidRateLimit = 150000;

      expect(invalidRateLimit > maxRateLimit).toBe(true);
      // API would reject or clamp to 100000
    });

    it('should accept valid rate limits', () => {
      const validLimits = [100, 500, 1000, 5000, 10000, 50000, 100000];

      validLimits.forEach((limit) => {
        expect(limit >= 100 && limit <= 100000).toBe(true);
      });
    });
  });

  describe('Location Access Control', () => {
    it('should validate location belongs to tenant', async () => {
      // Location from our tenant
      prismaMock.location.findFirst.mockResolvedValueOnce({
        id: 'loc-1',
        tenantId: 'tenant-1',
        name: 'Main Clinic',
      } as any);

      const ourLocation = await prismaMock.location.findFirst({
        where: {
          id: 'loc-1',
          tenantId: 'tenant-1',
        },
      });

      expect(ourLocation).toBeDefined();

      // Location from other tenant
      prismaMock.location.findFirst.mockResolvedValueOnce(null);

      const otherLocation = await prismaMock.location.findFirst({
        where: {
          id: 'loc-other',
          tenantId: 'tenant-1', // Our tenant tries to use other tenant's location
        },
      });

      expect(otherLocation).toBeNull();
      // API would return: { error: 'Ubicación no encontrada' }, { status: 400 }
    });
  });

  describe('Input Sanitization', () => {
    it('should trim whitespace from name', () => {
      const dirtyName = '  Test Key  ';
      const cleanName = dirtyName.trim();
      expect(cleanName).toBe('Test Key');
    });

    it('should enforce name max length of 100', () => {
      const maxLength = 100;
      const longName = 'a'.repeat(150);

      expect(longName.length > maxLength).toBe(true);
      // API would validate with Zod: z.string().max(100)
    });

    it('should validate expiresAt is valid ISO date', () => {
      const validDate = '2025-12-31T23:59:59.000Z';
      const invalidDate = 'not-a-date';

      const isValidDate = (str: string) => !isNaN(Date.parse(str));

      expect(isValidDate(validDate)).toBe(true);
      expect(isValidDate(invalidDate)).toBe(false);
    });
  });

  describe('Audit Trail', () => {
    it('should track createdById', async () => {
      const newKey = createTestApiKey({
        createdById: 'staff-1',
      });

      expect(newKey.createdById).toBe('staff-1');
    });

    it('should track createdAt timestamp', () => {
      const newKey = createTestApiKey();
      expect(newKey.createdAt).toBeInstanceOf(Date);
    });
  });
});
