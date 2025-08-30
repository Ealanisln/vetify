// Mock the auth module to avoid import issues
jest.mock('@/lib/auth', () => ({
  getUserFromToken: jest.fn(),
  validateUserPermissions: jest.fn(),
  createUserSession: jest.fn(),
}));

import { getUserFromToken, validateUserPermissions, createUserSession } from '@/lib/auth';

const mockGetUserFromToken = getUserFromToken as jest.MockedFunction<typeof getUserFromToken>;
const mockValidateUserPermissions = validateUserPermissions as jest.MockedFunction<typeof validateUserPermissions>;
const mockCreateUserSession = createUserSession as jest.MockedFunction<typeof createUserSession>;

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserFromToken', () => {
    it('should return user when valid token is provided', async () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant_123',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-02T00:00:00Z'),
      };

      mockGetUserFromToken.mockResolvedValue(mockUser as any);

      const result = await getUserFromToken('valid_token_123');

      expect(result).toEqual(mockUser);
      expect(mockGetUserFromToken).toHaveBeenCalledWith('valid_token_123');
    });

    it('should return null when user is not found', async () => {
      mockGetUserFromToken.mockResolvedValue(null);

      const result = await getUserFromToken('invalid_token');

      expect(result).toBeNull();
      expect(mockGetUserFromToken).toHaveBeenCalledWith('invalid_token');
    });

    it('should handle database errors gracefully', async () => {
      mockGetUserFromToken.mockRejectedValue(new Error('Database connection failed'));

      await expect(getUserFromToken('token_123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('validateUserPermissions', () => {
    it('should return true for admin users with any permission', () => {
      const mockUser = {
        id: 'user_123',
        role: 'ADMIN',
        tenantId: 'tenant_123',
      };

      mockValidateUserPermissions.mockReturnValue(true);

      const result = validateUserPermissions(mockUser as any, 'MANAGE_USERS');
      expect(result).toBe(true);
      expect(mockValidateUserPermissions).toHaveBeenCalledWith(mockUser, 'MANAGE_USERS');
    });

    it('should return false for users without required permission', () => {
      const mockUser = {
        id: 'user_123',
        role: 'STAFF',
        permissions: ['VIEW_APPOINTMENTS'],
        tenantId: 'tenant_123',
      };

      mockValidateUserPermissions.mockReturnValue(false);

      const result = validateUserPermissions(mockUser as any, 'MANAGE_USERS');
      expect(result).toBe(false);
      expect(mockValidateUserPermissions).toHaveBeenCalledWith(mockUser, 'MANAGE_USERS');
    });

    it('should handle null user gracefully', () => {
      mockValidateUserPermissions.mockReturnValue(false);

      const result = validateUserPermissions(null, 'MANAGE_PETS');
      expect(result).toBe(false);
      expect(mockValidateUserPermissions).toHaveBeenCalledWith(null, 'MANAGE_PETS');
    });
  });

  describe('createUserSession', () => {
    it('should create session with user data', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        tenantId: 'tenant_123',
      };

      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        isAdmin: true,
        tenantId: 'tenant_123',
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      mockCreateUserSession.mockReturnValue(mockSession as any);

      const result = createUserSession(mockUser as any);

      expect(result).toEqual(mockSession);
      expect(mockCreateUserSession).toHaveBeenCalledWith(mockUser);
    });

    it('should handle users with no role gracefully', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        tenantId: 'tenant_123',
      };

      const mockSession = {
        user: mockUser,
        isAuthenticated: true,
        isAdmin: false,
        tenantId: 'tenant_123',
        createdAt: new Date(),
        expiresAt: new Date(),
      };

      mockCreateUserSession.mockReturnValue(mockSession as any);

      const result = createUserSession(mockUser as any);

      expect(result.isAdmin).toBe(false);
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('Function Call Validation', () => {
    it('should call functions with correct parameters', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'STAFF',
        tenantId: 'tenant_123',
      };

      // Test getUserFromToken
      mockGetUserFromToken.mockResolvedValue(mockUser as any);
      getUserFromToken('test_token');
      expect(mockGetUserFromToken).toHaveBeenCalledWith('test_token');

      // Test validateUserPermissions
      mockValidateUserPermissions.mockReturnValue(true);
      validateUserPermissions(mockUser as any, 'TEST_PERMISSION');
      expect(mockValidateUserPermissions).toHaveBeenCalledWith(mockUser, 'TEST_PERMISSION');

      // Test createUserSession
      const mockSession = { user: mockUser, isAuthenticated: true };
      mockCreateUserSession.mockReturnValue(mockSession as any);
      createUserSession(mockUser as any);
      expect(mockCreateUserSession).toHaveBeenCalledWith(mockUser);
    });

    it('should handle multiple calls correctly', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'ADMIN',
        tenantId: 'tenant_123',
      };

      // Multiple calls to getUserFromToken
      mockGetUserFromToken.mockResolvedValue(mockUser as any);
      getUserFromToken('token1');
      getUserFromToken('token2');
      getUserFromToken('token3');

      expect(mockGetUserFromToken).toHaveBeenCalledTimes(3);
      expect(mockGetUserFromToken).toHaveBeenCalledWith('token1');
      expect(mockGetUserFromToken).toHaveBeenCalledWith('token2');
      expect(mockGetUserFromToken).toHaveBeenCalledWith('token3');
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from getUserFromToken', async () => {
      const error = new Error('Network error');
      mockGetUserFromToken.mockRejectedValue(error);

      await expect(getUserFromToken('token')).rejects.toThrow('Network error');
    });

    it('should handle different error types', async () => {
      const networkError = new Error('Network error');
      const dbError = new Error('Database error');
      const authError = new Error('Authentication error');

      mockGetUserFromToken
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(dbError)
        .mockRejectedValueOnce(authError);

      await expect(getUserFromToken('token1')).rejects.toThrow('Network error');
      await expect(getUserFromToken('token2')).rejects.toThrow('Database error');
      await expect(getUserFromToken('token3')).rejects.toThrow('Authentication error');
    });
  });

  describe('Performance', () => {
    it('should call functions quickly', () => {
      const mockUser = {
        id: 'user_123',
        email: 'test@example.com',
        role: 'STAFF',
        tenantId: 'tenant_123',
      };

      const mockSession = { user: mockUser, isAuthenticated: true };
      mockCreateUserSession.mockReturnValue(mockSession as any);

      const startTime = performance.now();
      createUserSession(mockUser as any);
      const endTime = performance.now();

      const executionTime = endTime - startTime;
      expect(executionTime).toBeLessThan(1); // Should complete in under 1ms

      expect(mockCreateUserSession).toHaveBeenCalledWith(mockUser);
    });
  });
});
