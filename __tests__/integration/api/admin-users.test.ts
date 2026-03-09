/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';

// Mock super-admin check
const mockRequireSuperAdmin = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
}));

// Mock admin user functions
const mockGetUsers = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUserStats = jest.fn();
const mockGetUserActivity = jest.fn();
const mockGetUserById = jest.fn();
jest.mock('@/lib/admin/users', () => ({
  getUsers: (...args: any[]) => mockGetUsers(...args),
  createUser: (...args: any[]) => mockCreateUser(...args),
  getUserStats: (...args: any[]) => mockGetUserStats(...args),
  getUserActivity: (...args: any[]) => mockGetUserActivity(...args),
  getUserById: (...args: any[]) => mockGetUserById(...args),
}));

// Mock pagination parser
jest.mock('@/lib/security/validation-schemas', () => ({
  ...jest.requireActual('@/lib/security/validation-schemas'),
  parsePagination: (searchParams: URLSearchParams) => ({
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '10'),
  }),
}));

// Import after mocks
import { GET, POST } from '@/app/api/admin/users/route';
import { GET as ActivityGET } from '@/app/api/admin/users/[userId]/activity/route';
import { NextRequest } from 'next/server';

const createRequest = (url: string, options?: RequestInit) =>
  new NextRequest(`http://localhost:3000${url}`, options);

// Test data factories
const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'user@test.com',
  firstName: 'Test',
  lastName: 'User',
  name: 'Test User',
  phone: null,
  address: null,
  tenantId: 'tenant-1',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const createMockUsersResponse = (overrides = {}) => ({
  users: [createMockUser()],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
  ...overrides,
});

describe('Admin Users API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/users', () => {
    it('should return 403 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acceso denegado. Se requieren privilegios de super administrador.');
    });

    it('should return paginated users', async () => {
      const usersData = createMockUsersResponse({
        users: [createMockUser(), createMockUser({ id: 'user-2', email: 'user2@test.com' })],
        total: 2,
      });
      mockGetUsers.mockResolvedValue(usersData);

      const request = createRequest('/api/admin/users?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.users).toHaveLength(2);
      expect(data.data.total).toBe(2);
      expect(mockGetUsers).toHaveBeenCalledWith(1, 10, {});
    });

    it('should filter by search term', async () => {
      const usersData = createMockUsersResponse();
      mockGetUsers.mockResolvedValue(usersData);

      const request = createRequest('/api/admin/users?search=test');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockGetUsers).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({ search: 'test' })
      );
    });

    it('should include stats when requested', async () => {
      const usersData = createMockUsersResponse();
      const stats = { totalUsers: 100, activeUsers: 80, newUsersThisMonth: 5 };
      mockGetUsers.mockResolvedValue(usersData);
      mockGetUserStats.mockResolvedValue(stats);

      const request = createRequest('/api/admin/users?includeStats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.stats).toEqual(stats);
      expect(mockGetUserStats).toHaveBeenCalled();
    });

    it('should not include stats when not requested', async () => {
      const usersData = createMockUsersResponse();
      mockGetUsers.mockResolvedValue(usersData);

      const request = createRequest('/api/admin/users');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stats).toBeNull();
      expect(mockGetUserStats).not.toHaveBeenCalled();
    });

    it('should pass all filter parameters', async () => {
      const usersData = createMockUsersResponse();
      mockGetUsers.mockResolvedValue(usersData);

      const request = createRequest(
        '/api/admin/users?search=clinic&tenantId=t-1&roleId=r-1&isActive=true&dateFrom=2026-01-01&dateTo=2026-12-31'
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetUsers).toHaveBeenCalledWith(
        1,
        10,
        expect.objectContaining({
          search: 'clinic',
          tenantId: 't-1',
          roleId: 'r-1',
          isActive: true,
        })
      );
    });
  });

  describe('POST /api/admin/users', () => {
    it('should create user with valid data', async () => {
      const newUser = createMockUser({ id: 'new-user-1', email: 'new@test.com' });
      mockCreateUser.mockResolvedValue(newUser);

      const request = createRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          id: 'new-user-1',
          email: 'new@test.com',
          firstName: 'New',
          lastName: 'User',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Usuario creado exitosamente');
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-user-1',
          email: 'new@test.com',
        }),
        'admin-1'
      );
    });

    it('should return 409 for duplicate user', async () => {
      mockCreateUser.mockRejectedValue(new Error('Unique constraint violation'));

      const request = createRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          id: 'existing-user',
          email: 'existing@test.com',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Ya existe un usuario con este email o ID');
    });

    it('should validate email format', async () => {
      const request = createRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          id: 'user-1',
          email: 'invalid-email',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Formato de email inválido');
    });

    it('should return 400 when required fields are missing', async () => {
      const request = createRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ firstName: 'Test' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID de usuario y email son requeridos');
    });

    it('should return 403 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          id: 'user-1',
          email: 'user@test.com',
        }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acceso denegado. Se requieren privilegios de super administrador.');
    });
  });

  describe('GET /api/admin/users/[userId]/activity', () => {
    const createActivityRequest = (userId: string, queryParams = '') =>
      createRequest(`/api/admin/users/${userId}/activity${queryParams}`);

    const createActivityContext = (userId: string) => ({
      params: Promise.resolve({ userId }),
    });

    it('should return 404 for non-existent user', async () => {
      mockGetUserById.mockResolvedValue(null);

      const request = createActivityRequest('nonexistent-user');
      const context = createActivityContext('nonexistent-user');
      const response = await ActivityGET(request, context);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Usuario no encontrado');
    });

    it('should return user activity', async () => {
      const user = createMockUser();
      const activityData = {
        activities: [
          { id: 'act-1', type: 'LOGIN', timestamp: new Date('2026-01-15') },
          { id: 'act-2', type: 'PAGE_VIEW', timestamp: new Date('2026-01-15') },
        ],
        total: 2,
        page: 1,
        limit: 20,
      };
      mockGetUserById.mockResolvedValue(user);
      mockGetUserActivity.mockResolvedValue(activityData);

      const request = createActivityRequest('user-1');
      const context = createActivityContext('user-1');
      const response = await ActivityGET(request, context);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.activities).toHaveLength(2);
      expect(mockGetUserById).toHaveBeenCalledWith('user-1');
      expect(mockGetUserActivity).toHaveBeenCalledWith('user-1', 1, 20);
    });

    it('should return 403 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createActivityRequest('user-1');
      const context = createActivityContext('user-1');
      const response = await ActivityGET(request, context);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Acceso denegado. Se requieren privilegios de super administrador.');
    });

    it('should respect pagination parameters', async () => {
      const user = createMockUser();
      const activityData = { activities: [], total: 0, page: 2, limit: 5 };
      mockGetUserById.mockResolvedValue(user);
      mockGetUserActivity.mockResolvedValue(activityData);

      const request = createActivityRequest('user-1', '?page=2&limit=5');
      const context = createActivityContext('user-1');
      const response = await ActivityGET(request, context);

      expect(response.status).toBe(200);
      expect(mockGetUserActivity).toHaveBeenCalledWith('user-1', 2, 5);
    });
  });
});
