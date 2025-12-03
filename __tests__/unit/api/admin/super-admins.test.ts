/**
 * Admin Super Admins API Tests
 * VETIF-51: Phase 1 - Admin API Route Tests
 *
 * Tests cover:
 * - Super admin listing
 * - Super admin assignment
 * - Super admin removal
 * - Authorization and validation
 */

import { NextRequest } from 'next/server';

// Mock super-admin module
const mockRequireSuperAdmin = jest.fn();
const mockListSuperAdmins = jest.fn();
const mockAssignSuperAdmin = jest.fn();
const mockRemoveSuperAdmin = jest.fn();

jest.mock('@/lib/super-admin', () => ({
  requireSuperAdmin: (...args: unknown[]) => mockRequireSuperAdmin(...args),
  listSuperAdmins: (...args: unknown[]) => mockListSuperAdmins(...args),
  assignSuperAdmin: (...args: unknown[]) => mockAssignSuperAdmin(...args),
  removeSuperAdmin: (...args: unknown[]) => mockRemoveSuperAdmin(...args),
}));

// Import route handlers after mocks
import { GET, POST, DELETE } from '@/app/api/admin/super-admins/route';

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

describe('Admin Super Admins API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/super-admins', () => {
    it('should return list of super admins successfully', async () => {
      const mockSuperAdmins = [
        { id: 'admin_1', email: 'admin1@vetify.pro', name: 'Admin One', assignedByRole: true },
        { id: 'admin_2', email: 'admin2@vetify.pro', name: 'Admin Two', assignedByRole: false },
      ];
      mockListSuperAdmins.mockResolvedValue(mockSuperAdmins);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.superAdmins).toEqual(mockSuperAdmins);
      expect(mockListSuperAdmins).toHaveBeenCalled();
    });

    it('should return empty array when no super admins exist', async () => {
      mockListSuperAdmins.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.superAdmins).toEqual([]);
    });

    it('should return 500 when listing fails', async () => {
      mockListSuperAdmins.mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Error al obtener');
    });
  });

  describe('POST /api/admin/super-admins', () => {
    describe('Authorization', () => {
      it('should call requireSuperAdmin', async () => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockAssignSuperAdmin.mockResolvedValue({ success: true, message: 'Assigned' });

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'new_admin@test.com' },
        });
        await POST(request);

        expect(mockRequireSuperAdmin).toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 400 when userIdOrEmail is missing', async () => {
        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: {},
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ID o email');
      });
    });

    describe('Assignment', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should assign super admin by email', async () => {
        mockAssignSuperAdmin.mockResolvedValue({
          success: true,
          message: 'Usuario new@test.com asignado como super administrador exitosamente',
        });

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'new@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('asignado');
        expect(mockAssignSuperAdmin).toHaveBeenCalledWith('new@test.com');
      });

      it('should assign super admin by user ID', async () => {
        mockAssignSuperAdmin.mockResolvedValue({
          success: true,
          message: 'Assigned successfully',
        });

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'user_456' },
        });
        const response = await POST(request);

        expect(response.status).toBe(200);
        expect(mockAssignSuperAdmin).toHaveBeenCalledWith('user_456');
      });

      it('should return error when assignment fails', async () => {
        mockAssignSuperAdmin.mockResolvedValue({
          success: false,
          message: 'El usuario ya es super administrador',
        });

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'existing_admin@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ya es super administrador');
      });

      it('should return error when user not found', async () => {
        mockAssignSuperAdmin.mockResolvedValue({
          success: false,
          message: 'Usuario no encontrado',
        });

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'nonexistent@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('no encontrado');
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        mockAssignSuperAdmin.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest('http://localhost:3000/api/admin/super-admins', {
          method: 'POST',
          body: { userIdOrEmail: 'user@test.com' },
        });
        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });

  describe('DELETE /api/admin/super-admins', () => {
    describe('Authorization', () => {
      it('should call requireSuperAdmin', async () => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
        mockRemoveSuperAdmin.mockResolvedValue({ success: true, message: 'Removed' });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=other@test.com',
          { method: 'DELETE' }
        );
        await DELETE(request);

        expect(mockRequireSuperAdmin).toHaveBeenCalled();
      });
    });

    describe('Validation', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 400 when userIdOrEmail is missing', async () => {
        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('ID o email');
      });
    });

    describe('Removal', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should remove super admin by email', async () => {
        mockRemoveSuperAdmin.mockResolvedValue({
          success: true,
          message: 'Rol de super administrador removido de other@test.com exitosamente',
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=other@test.com',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.message).toContain('removido');
        expect(mockRemoveSuperAdmin).toHaveBeenCalledWith('other@test.com');
      });

      it('should remove super admin by user ID', async () => {
        mockRemoveSuperAdmin.mockResolvedValue({
          success: true,
          message: 'Removed successfully',
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=user_789',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);

        expect(response.status).toBe(200);
        expect(mockRemoveSuperAdmin).toHaveBeenCalledWith('user_789');
      });

      it('should return error when user tries to remove themselves', async () => {
        mockRemoveSuperAdmin.mockResolvedValue({
          success: false,
          message: 'No puedes remover tu propio rol de super administrador',
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=admin@vetify.pro',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tu propio rol');
      });

      it('should return error when user not found', async () => {
        mockRemoveSuperAdmin.mockResolvedValue({
          success: false,
          message: 'Usuario no encontrado',
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=nonexistent@test.com',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('no encontrado');
      });

      it('should return error when user is not a super admin', async () => {
        mockRemoveSuperAdmin.mockResolvedValue({
          success: false,
          message: 'El usuario no tiene el rol de super administrador',
        });

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=regular@test.com',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('no tiene el rol');
      });
    });

    describe('Error Handling', () => {
      beforeEach(() => {
        mockRequireSuperAdmin.mockResolvedValue({
          user: { id: 'admin_123', email: 'admin@vetify.pro' },
        });
      });

      it('should return 500 for unexpected errors', async () => {
        mockRemoveSuperAdmin.mockRejectedValue(new Error('Database error'));

        const request = createMockRequest(
          'http://localhost:3000/api/admin/super-admins?userIdOrEmail=user@test.com',
          { method: 'DELETE' }
        );
        const response = await DELETE(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Error interno del servidor');
      });
    });
  });
});

describe('Super Admin Authorization Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle email domain-based super admin access', async () => {
    // Testing that users with @vetify.pro, @vetify.com, or @alanis.dev are recognized
    mockListSuperAdmins.mockResolvedValue([
      { id: 'admin_1', email: 'admin@vetify.pro', assignedByRole: false },
      { id: 'admin_2', email: 'admin@vetify.com', assignedByRole: false },
      { id: 'admin_3', email: 'admin@alanis.dev', assignedByRole: false },
    ]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.superAdmins).toHaveLength(3);
    expect(data.superAdmins.every((a: { assignedByRole: boolean }) => !a.assignedByRole)).toBe(true);
  });

  it('should distinguish between role-based and email-based super admins', async () => {
    mockListSuperAdmins.mockResolvedValue([
      { id: 'admin_1', email: 'role_admin@external.com', assignedByRole: true },
      { id: 'admin_2', email: 'domain_admin@vetify.pro', assignedByRole: false },
    ]);

    const response = await GET();
    const data = await response.json();

    const roleBasedAdmin = data.superAdmins.find((a: { id: string }) => a.id === 'admin_1');
    const emailBasedAdmin = data.superAdmins.find((a: { id: string }) => a.id === 'admin_2');

    expect(roleBasedAdmin.assignedByRole).toBe(true);
    expect(emailBasedAdmin.assignedByRole).toBe(false);
  });
});
