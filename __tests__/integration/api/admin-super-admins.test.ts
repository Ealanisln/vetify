/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';

// Mock super-admin functions
const mockRequireSuperAdmin = jest.fn();
const mockAssignSuperAdmin = jest.fn();
const mockRemoveSuperAdmin = jest.fn();
const mockListSuperAdmins = jest.fn();
jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: () => mockRequireSuperAdmin(),
  assignSuperAdmin: (...args: any[]) => mockAssignSuperAdmin(...args),
  removeSuperAdmin: (...args: any[]) => mockRemoveSuperAdmin(...args),
  listSuperAdmins: (...args: any[]) => mockListSuperAdmins(...args),
}));

// Import after mocks
import { GET, POST, DELETE } from '@/app/api/admin/super-admins/route';
import { NextRequest } from 'next/server';

const createRequest = (url: string, options?: RequestInit) =>
  new NextRequest(`http://localhost:3000${url}`, options);

// Test data factories
const createMockSuperAdmin = (overrides = {}) => ({
  id: 'admin-1',
  email: 'admin@vetify.pro',
  firstName: 'Admin',
  lastName: 'User',
  createdAt: new Date('2026-01-01'),
  ...overrides,
});

describe('Admin Super Admins API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireSuperAdmin.mockResolvedValue({ user: { id: 'admin-1', email: 'admin@vetify.pro' } });
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/admin/super-admins', () => {
    it('should return list of super admins', async () => {
      const superAdmins = [
        createMockSuperAdmin(),
        createMockSuperAdmin({ id: 'admin-2', email: 'admin2@vetify.pro' }),
      ];
      mockListSuperAdmins.mockResolvedValue(superAdmins);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.superAdmins).toHaveLength(2);
      expect(mockListSuperAdmins).toHaveBeenCalled();
    });

    it('should return empty list when no super admins exist', async () => {
      mockListSuperAdmins.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.superAdmins).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      mockListSuperAdmins.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error al obtener la lista de super administradores');
    });
  });

  describe('POST /api/admin/super-admins', () => {
    it('should assign super admin role', async () => {
      mockAssignSuperAdmin.mockResolvedValue({
        success: true,
        message: 'Super admin asignado exitosamente',
      });

      const request = createRequest('/api/admin/super-admins', {
        method: 'POST',
        body: JSON.stringify({ userIdOrEmail: 'user@test.com' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Super admin asignado exitosamente');
      expect(mockAssignSuperAdmin).toHaveBeenCalledWith('user@test.com');
    });

    it('should handle already super admin user', async () => {
      mockAssignSuperAdmin.mockResolvedValue({
        success: false,
        message: 'El usuario ya es super administrador',
      });

      const request = createRequest('/api/admin/super-admins', {
        method: 'POST',
        body: JSON.stringify({ userIdOrEmail: 'admin@vetify.pro' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('El usuario ya es super administrador');
    });

    it('should return 400 when userIdOrEmail is missing', async () => {
      const request = createRequest('/api/admin/super-admins', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Se requiere el ID o email del usuario');
    });

    it('should return 500 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/super-admins', {
        method: 'POST',
        body: JSON.stringify({ userIdOrEmail: 'user@test.com' }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('DELETE /api/admin/super-admins', () => {
    it('should remove super admin role', async () => {
      mockRemoveSuperAdmin.mockResolvedValue({
        success: true,
        message: 'Super admin removido exitosamente',
      });

      const request = createRequest('/api/admin/super-admins?userIdOrEmail=user@test.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Super admin removido exitosamente');
      expect(mockRemoveSuperAdmin).toHaveBeenCalledWith('user@test.com');
    });

    it('should handle non-existent user', async () => {
      mockRemoveSuperAdmin.mockResolvedValue({
        success: false,
        message: 'Usuario no encontrado',
      });

      const request = createRequest('/api/admin/super-admins?userIdOrEmail=nonexistent@test.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Usuario no encontrado');
    });

    it('should return 400 when userIdOrEmail is missing', async () => {
      const request = createRequest('/api/admin/super-admins', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Se requiere el ID o email del usuario');
    });

    it('should return 500 when not super admin', async () => {
      mockRequireSuperAdmin.mockRejectedValue(new Error('Access denied'));

      const request = createRequest('/api/admin/super-admins?userIdOrEmail=user@test.com', {
        method: 'DELETE',
      });
      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Error interno del servidor');
    });
  });
});
