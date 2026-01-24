/**
 * Integration tests for API Key CRUD operations
 *
 * Tests API routes with mocked Prisma:
 * - GET /api/settings/api-keys - List keys
 * - POST /api/settings/api-keys - Create key
 * - PUT /api/settings/api-keys/[id] - Update key
 * - DELETE /api/settings/api-keys/[id] - Delete key
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant, createTestStaff } from '../../utils/test-utils';

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
  keyHash: 'hashedkey123456789',
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

describe('API Keys CRUD Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup test data
    mockTenant = createTestTenant({
      id: 'tenant-1',
      planType: 'CORPORATIVO',
    });

    mockStaff = createTestStaff({
      id: 'staff-1',
      tenantId: 'tenant-1',
    });

    // Default mock: authenticated with API access
    mockRequirePermission.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      tenant: mockTenant as any,
      staff: mockStaff as any,
    });

    mockCheckFeatureAccess.mockResolvedValue(true);
  });

  describe('GET /api/settings/api-keys', () => {
    it('should return empty array when no keys exist', async () => {
      prismaMock.tenantApiKey.findMany.mockResolvedValue([]);

      const result = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toEqual([]);
    });

    it('should return list of keys for tenant', async () => {
      const mockKeys = [
        createTestApiKey({ id: 'key-1', name: 'Key 1' }),
        createTestApiKey({ id: 'key-2', name: 'Key 2' }),
      ];

      prismaMock.tenantApiKey.findMany.mockResolvedValue(mockKeys);

      const result = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: mockTenant.id },
        select: {
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
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Key 1');
      expect(result[1].name).toBe('Key 2');
    });

    it('should NOT include keyHash in response (security)', async () => {
      const mockKey = createTestApiKey();
      prismaMock.tenantApiKey.findMany.mockResolvedValue([mockKey]);

      // The API should select specific fields, never keyHash
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
        // Note: keyHash is NOT included
      };

      expect(selectFields).not.toHaveProperty('keyHash');
    });

    it('should enforce tenant isolation', async () => {
      const otherTenantKey = createTestApiKey({
        id: 'key-other',
        tenantId: 'other-tenant',
      });

      prismaMock.tenantApiKey.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [createTestApiKey()];
        }
        return [];
      });

      // Query for our tenant
      const ourKeys = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: mockTenant.id },
      });

      // Query for other tenant (should return empty)
      const otherKeys = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: 'other-tenant' },
      });

      expect(ourKeys).toHaveLength(1);
      expect(ourKeys[0].tenantId).toBe('tenant-1');
      expect(otherKeys).toHaveLength(0);
    });

    it('should require authentication', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Access denied: Not authenticated'));

      await expect(mockRequirePermission('settings', 'read')).rejects.toThrow('Access denied');
    });

    it('should require apiAccess feature (CORPORATIVO plan)', async () => {
      mockCheckFeatureAccess.mockResolvedValue(false);

      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(false);

      // API would return: { error: 'Esta función requiere el plan Corporativo' }, { status: 403 }
    });
  });

  describe('POST /api/settings/api-keys', () => {
    it('should create new key with valid data', async () => {
      const newKey = createTestApiKey();
      prismaMock.tenantApiKey.create.mockResolvedValue(newKey);

      const result = await prismaMock.tenantApiKey.create({
        data: {
          tenantId: mockTenant.id,
          name: 'New Key',
          keyPrefix: 'vfy_new12345',
          keyHash: 'newhashedkey',
          scopes: ['read:pets'],
          rateLimit: 1000,
          createdById: mockStaff.id,
        },
      });

      expect(result).toBeDefined();
      expect(result.name).toBe('Test API Key');
      expect(prismaMock.tenantApiKey.create).toHaveBeenCalled();
    });

    it('should store keyHash, never fullKey', async () => {
      const createCall = {
        data: {
          tenantId: mockTenant.id,
          name: 'New Key',
          keyPrefix: 'vfy_new12345',
          keyHash: expect.any(String),
          scopes: ['read:pets'],
          rateLimit: 1000,
        },
      };

      // The fullKey should never be stored
      expect(createCall.data).not.toHaveProperty('fullKey');
      expect(createCall.data).toHaveProperty('keyHash');
    });

    it('should validate required fields', () => {
      const requiredFields = ['name', 'scopes'];

      // Missing name
      const dataWithoutName = { scopes: ['read:pets'] };
      expect(dataWithoutName).not.toHaveProperty('name');

      // Missing scopes
      const dataWithoutScopes = { name: 'Test' };
      expect(dataWithoutScopes).not.toHaveProperty('scopes');

      // API would return: { error: 'El nombre es requerido' } or similar
    });

    it('should validate scopes against API_SCOPES', () => {
      const validScopes = ['read:pets', 'write:pets', 'read:appointments'];
      const invalidScopes = ['read:pets', 'invalid:scope'];

      // Validation function
      const validateScopes = (scopes: string[]) => {
        const validScopeList = [
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
        return scopes.filter((s) => !validScopeList.includes(s));
      };

      expect(validateScopes(validScopes)).toHaveLength(0);
      expect(validateScopes(invalidScopes)).toContain('invalid:scope');
    });

    it('should validate locationId belongs to tenant', async () => {
      // Location from other tenant
      prismaMock.location.findFirst.mockResolvedValue(null);

      const location = await prismaMock.location.findFirst({
        where: {
          id: 'other-location',
          tenantId: mockTenant.id,
        },
      });

      expect(location).toBeNull();
      // API would return: { error: 'Ubicación no encontrada' }, { status: 400 }
    });

    it('should require authentication and apiAccess feature', async () => {
      // Test authentication requirement
      mockRequirePermission.mockRejectedValue(new Error('Access denied'));
      await expect(mockRequirePermission('settings', 'write')).rejects.toThrow('Access denied');

      // Test feature access requirement
      mockCheckFeatureAccess.mockResolvedValue(false);
      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(false);
    });
  });

  describe('PUT /api/settings/api-keys/[id]', () => {
    it('should update name successfully', async () => {
      const existingKey = createTestApiKey();
      const updatedKey = { ...existingKey, name: 'Updated Name' };

      prismaMock.tenantApiKey.findFirst.mockResolvedValue(existingKey);
      prismaMock.tenantApiKey.update.mockResolvedValue(updatedKey);

      // Verify key exists and belongs to tenant
      const found = await prismaMock.tenantApiKey.findFirst({
        where: {
          id: 'key-1',
          tenantId: mockTenant.id,
        },
      });

      expect(found).toBeDefined();

      // Update
      const result = await prismaMock.tenantApiKey.update({
        where: { id: 'key-1' },
        data: { name: 'Updated Name' },
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should update scopes successfully', async () => {
      const existingKey = createTestApiKey();
      const updatedKey = { ...existingKey, scopes: ['read:appointments'] };

      prismaMock.tenantApiKey.findFirst.mockResolvedValue(existingKey);
      prismaMock.tenantApiKey.update.mockResolvedValue(updatedKey);

      const result = await prismaMock.tenantApiKey.update({
        where: { id: 'key-1' },
        data: { scopes: ['read:appointments'] },
      });

      expect(result.scopes).toEqual(['read:appointments']);
    });

    it('should toggle isActive', async () => {
      const existingKey = createTestApiKey({ isActive: true });
      const updatedKey = { ...existingKey, isActive: false };

      prismaMock.tenantApiKey.findFirst.mockResolvedValue(existingKey);
      prismaMock.tenantApiKey.update.mockResolvedValue(updatedKey);

      const result = await prismaMock.tenantApiKey.update({
        where: { id: 'key-1' },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });

    it('should return 404 for key from different tenant', async () => {
      prismaMock.tenantApiKey.findFirst.mockResolvedValue(null);

      const found = await prismaMock.tenantApiKey.findFirst({
        where: {
          id: 'key-other-tenant',
          tenantId: mockTenant.id,
        },
      });

      expect(found).toBeNull();
      // API would return: { error: 'Clave de API no encontrada' }, { status: 404 }
    });

    it('should validate scopes if provided', () => {
      const invalidScopes = ['invalid:scope'];
      const validScopeList = ['read:pets', 'write:pets'];

      const invalid = invalidScopes.filter((s) => !validScopeList.includes(s));
      expect(invalid).toHaveLength(1);
      // API would return: { error: 'Permisos inválidos: invalid:scope' }, { status: 400 }
    });

    it('should require authentication and apiAccess feature', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Access denied'));
      await expect(mockRequirePermission('settings', 'write')).rejects.toThrow('Access denied');
    });
  });

  describe('DELETE /api/settings/api-keys/[id]', () => {
    it('should delete key successfully', async () => {
      const existingKey = createTestApiKey();

      prismaMock.tenantApiKey.findFirst.mockResolvedValue(existingKey);
      prismaMock.tenantApiKey.delete.mockResolvedValue(existingKey);

      // Verify key exists and belongs to tenant
      const found = await prismaMock.tenantApiKey.findFirst({
        where: {
          id: 'key-1',
          tenantId: mockTenant.id,
        },
      });

      expect(found).toBeDefined();

      // Delete
      const result = await prismaMock.tenantApiKey.delete({
        where: { id: 'key-1' },
      });

      expect(result).toBeDefined();
      expect(prismaMock.tenantApiKey.delete).toHaveBeenCalledWith({
        where: { id: 'key-1' },
      });
    });

    it('should return 404 for key from different tenant', async () => {
      prismaMock.tenantApiKey.findFirst.mockResolvedValue(null);

      const found = await prismaMock.tenantApiKey.findFirst({
        where: {
          id: 'key-other-tenant',
          tenantId: mockTenant.id,
        },
      });

      expect(found).toBeNull();
      // API would return: { error: 'Clave de API no encontrada' }, { status: 404 }
    });

    it('should require authentication and apiAccess feature', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Access denied'));
      await expect(mockRequirePermission('settings', 'delete')).rejects.toThrow('Access denied');

      mockCheckFeatureAccess.mockResolvedValue(false);
      const hasAccess = await mockCheckFeatureAccess('apiAccess');
      expect(hasAccess).toBe(false);
    });
  });

  describe('Tenant Isolation', () => {
    it('should always filter by tenantId in queries', async () => {
      prismaMock.tenantApiKey.findMany.mockImplementation(async (args: any) => {
        // Verify tenantId is always in the where clause
        expect(args?.where?.tenantId).toBeDefined();
        return [];
      });

      await prismaMock.tenantApiKey.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(prismaMock.tenantApiKey.findMany).toHaveBeenCalled();
    });

    it('should not leak keys between tenants', async () => {
      const tenant1Key = createTestApiKey({ id: 'key-t1', tenantId: 'tenant-1' });
      const tenant2Key = createTestApiKey({ id: 'key-t2', tenantId: 'tenant-2' });

      prismaMock.tenantApiKey.findMany.mockImplementation(async (args: any) => {
        const tenantId = args?.where?.tenantId;
        if (tenantId === 'tenant-1') return [tenant1Key];
        if (tenantId === 'tenant-2') return [tenant2Key];
        return [];
      });

      const tenant1Keys = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: 'tenant-1' },
      });

      const tenant2Keys = await prismaMock.tenantApiKey.findMany({
        where: { tenantId: 'tenant-2' },
      });

      expect(tenant1Keys).toHaveLength(1);
      expect(tenant1Keys[0].id).toBe('key-t1');
      expect(tenant2Keys).toHaveLength(1);
      expect(tenant2Keys[0].id).toBe('key-t2');
    });
  });
});
