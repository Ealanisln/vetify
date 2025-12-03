/**
 * Admin Users API Tests
 * VETIF-51: Phase 1 - Admin API Route Tests
 *
 * Tests cover:
 * - Super admin authorization enforcement
 * - User listing with pagination and filters
 * - User creation with validation
 * - Error handling for various scenarios
 */

import { NextRequest } from 'next/server';

// Mock super-admin module
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
}));

// Mock admin users module
const mockGetUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUserStats = jest.fn();
jest.mock('@/lib/admin/users', () => ({
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  getUserStats: (...args: unknown[]) => mockGetUserStats(...args),
}));

// Import route handlers after mocks
import { GET, POST } from '@/app/api/admin/users/route';

function createMockRequest(
  url: string,
  options: { method?: string; body?: unknown } = {}
): NextRequest {
  const { method = 'GET', body } = options;

  const request = new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as NextRequest;

  return request;
}

describe('Admin Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    describe('Authorization', () => {
      it('should return 403 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(
          new Error('Access denied. Super admin privileges required.')
        );

        const request = createMockRequest('http://localhost:3000/api/admin/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('Acceso denegado');
      });

      it('should proceed when user is super admin', async () => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockGetUsers.mockResolvedValue({
          users: [],
          total: 0,
          page: 1,
          limit: 20,
        });

        const request = createMockRequest('http://localhost:3000/api/admin/users');
        const response = await GET(request);

        expect(response.status).toBe(200);
        expect(mockRequireSuperAdmin).toHaveBeenCalled();
      });
    });

    describe('Pagination', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should use default pagination when not specified', async () => {
        mockGetUsers.mockResolvedValue({
          users: [],
          total: 0,
          page: 1,
          limit: 20,
        });

        const request = createMockRequest('http://localhost:3000/api/admin/users');
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, {});
      });

      it('should respect custom pagination parameters', async () => {
        mockGetUsers.mockResolvedValue({
          users: [],
          total: 100,
          page: 3,
          limit: 50,
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?page=3&limit=50'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(3, 50, {});
      });
    });

    describe('Filters', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockGetUsers.mockResolvedValue({
          users: [],
          total: 0,
          page: 1,
          limit: 20,
        });
      });

      it('should apply search filter', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?search=john'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, { search: 'john' });
      });

      it('should apply tenantId filter', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?tenantId=tenant_123'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, { tenantId: 'tenant_123' });
      });

      it('should apply roleId filter', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?roleId=role_456'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, { roleId: 'role_456' });
      });

      it('should apply isActive filter', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?isActive=true'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, { isActive: true });
      });

      it('should apply date range filters', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?dateFrom=2024-01-01&dateTo=2024-12-31'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, {
          dateFrom: expect.any(Date),
          dateTo: expect.any(Date),
        });
      });

      it('should apply multiple filters', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?search=jane&isActive=true&tenantId=tenant_123'
        );
        await GET(request);

        expect(mockGetUsers).toHaveBeenCalledWith(1, 20, {
          search: 'jane',
          isActive: true,
          tenantId: 'tenant_123',
        });
      });
    });

    describe('Stats', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockGetUsers.mockResolvedValue({
          users: [],
          total: 0,
          page: 1,
          limit: 20,
        });
      });

      it('should include stats when requested', async () => {
        const mockStats = { total: 100, active: 85, inactive: 15 };
        mockGetUserStats.mockResolvedValue(mockStats);

        const request = createMockRequest(
          'http://localhost:3000/api/admin/users?includeStats=true'
        );
        const response = await GET(request);
        const data = await response.json();

        expect(mockGetUserStats).toHaveBeenCalled();
        expect(data.stats).toEqual(mockStats);
      });

      it('should not include stats when not requested', async () => {
        const request = createMockRequest('http://localhost:3000/api/admin/users');
        const response = await GET(request);
        const data = await response.json();

        expect(mockGetUserStats).not.toHaveBeenCalled();
        expect(data.stats).toBeNull();
      });
    });

    describe('Response Format', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return users in proper format', async () => {
        const mockUsers = [
          { id: 'user_1', email: 'user1@test.com', name: 'User One' },
          { id: 'user_2', email: 'user2@test.com', name: 'User Two' },
        ];
        mockGetUsers.mockResolvedValue({
          users: mockUsers,
          total: 2,
          page: 1,
          limit: 20,
        });

        const request = createMockRequest('http://localhost:3000/api/admin/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.users).toEqual(mockUsers);
        expect(data.data.total).toBe(2);
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        mockGetUsers.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/admin/users');
        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });

  describe('POST /api/admin/users', () => {
    describe('Authorization', () => {
      it('should return 403 when user is not super admin', async () => {
        mockRequireSuperAdmin.mockRejectedValue(
          new Error('Access denied. Super admin privileges required.')
        );

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'new_user', email: 'new@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('Acceso denegado');
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 400 when id is missing', async () => {
        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { email: 'new@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ID de usuario');
      });

      it('should return 400 when email is missing', async () => {
        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'new_user' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('email');
      });

      it('should return 400 for invalid email format', async () => {
        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'new_user', email: 'invalid-email' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('email inválido');
      });
    });

    describe('User Creation', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should create user with valid data', async () => {
        const newUser = {
          id: 'new_user_123',
          email: 'new@test.com',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
        };
        mockCreateUser.mockResolvedValue(newUser);

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: newUser,
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(newUser);
        expect(data.message).toContain('exitosamente');
      });

      it('should pass correct data to createUser function', async () => {
        const userData = {
          id: 'new_user_123',
          email: 'new@test.com',
          firstName: 'John',
          lastName: 'Doe',
          name: 'John Doe',
          phone: '+14155551234',
          address: '123 Main St',
          tenantId: 'tenant_123',
          isActive: true,
        };
        mockCreateUser.mockResolvedValue(userData);

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: userData,
        });
        await POST(request);

        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            id: userData.id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            name: userData.name,
            phone: userData.phone,
            address: userData.address,
            tenantId: userData.tenantId,
            isActive: true,
          }),
          'admin_123'
        );
      });

      it('should default isActive to true', async () => {
        mockCreateUser.mockResolvedValue({ id: 'user', email: 'test@test.com' });

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'user', email: 'test@test.com' },
        });
        await POST(request);

        expect(mockCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({ isActive: true }),
          'admin_123'
        );
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 409 for duplicate user', async () => {
        mockCreateUser.mockRejectedValue(new Error('Unique constraint violation'));

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'existing_user', email: 'existing@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data.error).toContain('Ya existe');
      });

      it('should return 500 for unexpected errors', async () => {
        mockCreateUser.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/admin/users', {
          method: 'POST',
          body: { id: 'new_user', email: 'new@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});
