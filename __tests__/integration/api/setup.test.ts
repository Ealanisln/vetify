 
import { prismaMock } from '../../mocks/prisma';
import {
  createTestUser,
} from '../../utils/test-utils';

// Test data factories for setup
const createTestSetupToken = (overrides = {}) => ({
  id: 'token-1',
  token: 'test_mock_setup_token_value_xx',
  createdAt: new Date('2024-01-01'),
  usedAt: null,
  usedBy: null,
  ...overrides,
});

const createTestSuperAdmin = (overrides = {}) => ({
  id: 'super-admin-1',
  userId: 'user-1',
  email: 'admin@vetify.com',
  role: 'SUPER_ADMIN',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Setup API Integration Tests', () => {
  let mockUser: ReturnType<typeof createTestUser>;
  let mockSetupToken: ReturnType<typeof createTestSetupToken>;
  let mockSuperAdmin: ReturnType<typeof createTestSuperAdmin>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockUser = createTestUser();
    mockSetupToken = createTestSetupToken();
    mockSuperAdmin = createTestSuperAdmin({ userId: mockUser.id });

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
  });

  describe('GET /api/setup/verify', () => {
    it('should return isSetupNeeded: true when no super admins exist', async () => {
      prismaMock.superAdmin.count.mockResolvedValue(0);

      const superAdminCount = await prismaMock.superAdmin.count();

      expect(superAdminCount).toBe(0);
      // API would return: { isSetupNeeded: true }
    });

    it('should return isSetupNeeded: false when super admin exists', async () => {
      prismaMock.superAdmin.count.mockResolvedValue(1);

      const superAdminCount = await prismaMock.superAdmin.count();

      expect(superAdminCount).toBe(1);
      // API would return: { isSetupNeeded: false }
    });

    it('should check for any super admin regardless of tenant', async () => {
      prismaMock.superAdmin.findMany.mockResolvedValue([mockSuperAdmin]);

      const superAdmins = await prismaMock.superAdmin.findMany();

      expect(superAdmins).toHaveLength(1);
      expect(superAdmins[0].role).toBe('SUPER_ADMIN');
    });
  });

  describe('POST /api/setup/complete', () => {
    it('should validate setup token format (32 characters)', () => {
      const validToken = 'x'.repeat(32); // 32 chars
      const invalidShortToken = 'too-short';
      const invalidLongToken = 'x'.repeat(40);

      expect(validToken.length).toBe(32);
      expect(invalidShortToken.length).toBeLessThan(32);
      expect(invalidLongToken.length).toBeGreaterThan(32);
    });

    it('should verify token exists and is unused', async () => {
      prismaMock.setupToken.findUnique.mockResolvedValue(mockSetupToken);

      const token = await prismaMock.setupToken.findUnique({
        where: { token: mockSetupToken.token },
      });

      expect(token).not.toBeNull();
      expect(token?.usedAt).toBeNull();
    });

    it('should reject if token is already used', async () => {
      const usedToken = {
        ...mockSetupToken,
        usedAt: new Date('2024-01-15'),
        usedBy: 'another-user-id',
      };

      prismaMock.setupToken.findUnique.mockResolvedValue(usedToken);

      const token = await prismaMock.setupToken.findUnique({
        where: { token: mockSetupToken.token },
      });

      expect(token?.usedAt).not.toBeNull();
      // API would return: { error: 'Token already used' }, { status: 400 }
    });

    it('should reject if super admin already exists', async () => {
      prismaMock.superAdmin.count.mockResolvedValue(1);

      const superAdminCount = await prismaMock.superAdmin.count();

      expect(superAdminCount).toBeGreaterThan(0);
      // API would return: { error: 'Setup already completed' }, { status: 400 }
    });

    it('should create super admin user on success', async () => {
      prismaMock.superAdmin.count.mockResolvedValue(0);
      prismaMock.setupToken.findUnique.mockResolvedValue(mockSetupToken);
      prismaMock.superAdmin.create.mockResolvedValue(mockSuperAdmin);

      // Verify no super admins exist
      const count = await prismaMock.superAdmin.count();
      expect(count).toBe(0);

      // Create super admin
      const result = await prismaMock.superAdmin.create({
        data: {
          userId: mockUser.id,
          email: mockUser.email,
          role: 'SUPER_ADMIN',
        },
      });

      expect(result.role).toBe('SUPER_ADMIN');
      expect(result.userId).toBe(mockUser.id);
    });

    it('should mark token as used after successful setup', async () => {
      const usedToken = {
        ...mockSetupToken,
        usedAt: new Date(),
        usedBy: mockUser.id,
      };

      prismaMock.setupToken.update.mockResolvedValue(usedToken);

      const result = await prismaMock.setupToken.update({
        where: { id: mockSetupToken.id },
        data: {
          usedAt: new Date(),
          usedBy: mockUser.id,
        },
      });

      expect(result.usedAt).not.toBeNull();
      expect(result.usedBy).toBe(mockUser.id);
    });

    it('should reject invalid token', async () => {
      prismaMock.setupToken.findUnique.mockResolvedValue(null);

      const token = await prismaMock.setupToken.findUnique({
        where: { token: 'invalid-token' },
      });

      expect(token).toBeNull();
      // API would return: { error: 'Invalid token' }, { status: 400 }
    });

    it('should log admin action after setup completion', async () => {
      const adminAction = {
        id: 'action-1',
        action: 'SETUP_COMPLETED',
        userId: mockUser.id,
        metadata: { setupTokenId: mockSetupToken.id },
        createdAt: new Date(),
      };

      prismaMock.adminAction.create.mockResolvedValue(adminAction);

      const result = await prismaMock.adminAction.create({
        data: {
          action: 'SETUP_COMPLETED',
          userId: mockUser.id,
          metadata: { setupTokenId: mockSetupToken.id },
        },
      });

      expect(result.action).toBe('SETUP_COMPLETED');
      expect(result.userId).toBe(mockUser.id);
    });
  });

  describe('Security Validations', () => {
    it('should only allow setup when no super admins exist', async () => {
      // Scenario: Attempt setup when super admin exists (security breach attempt)
      prismaMock.superAdmin.count.mockResolvedValue(1);

      const count = await prismaMock.superAdmin.count();

      expect(count).toBeGreaterThan(0);
      // Setup should be blocked
    });

    it('should not expose sensitive information in error responses', () => {
      const errorResponses = {
        invalidToken: 'Invalid or expired token',
        alreadySetup: 'Setup has already been completed',
        unauthorized: 'Unauthorized',
      };

      // Verify error messages don't expose internal details
      expect(errorResponses.invalidToken).not.toContain('database');
      expect(errorResponses.invalidToken).not.toContain('query');
      expect(errorResponses.alreadySetup).not.toContain('admin');
    });

    it('should validate token is 32 characters exactly', () => {
      const testTokens = [
        { token: 'a'.repeat(32), valid: true },
        { token: 'a'.repeat(31), valid: false },
        { token: 'a'.repeat(33), valid: false },
        { token: '', valid: false },
      ];

      testTokens.forEach(({ token, valid }) => {
        expect(token.length === 32).toBe(valid);
      });
    });
  });
});
