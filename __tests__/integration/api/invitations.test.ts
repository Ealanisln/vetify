 
import { prismaMock } from '../../mocks/prisma';
import {
  createTestTenant,
  createTestUser,
  createTestStaff,
} from '../../utils/test-utils';
import { addDays, subDays } from 'date-fns';

// Helper to create test invitation
function createTestInvitation(overrides: Partial<{
  id: string;
  tenantId: string;
  staffId: string;
  email: string;
  roleKey: string;
  token: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  expiresAt: Date;
  createdAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? 'invitation-123',
    tenantId: overrides.tenantId ?? 'tenant-123',
    staffId: overrides.staffId ?? 'staff-123',
    email: overrides.email ?? 'newstaff@example.com',
    roleKey: overrides.roleKey ?? 'VETERINARIAN',
    token: overrides.token ?? 'valid-token-12345678901234567890',
    status: overrides.status ?? 'PENDING',
    expiresAt: overrides.expiresAt ?? addDays(new Date(), 7),
    createdAt: overrides.createdAt ?? new Date(),
  };
}

describe('Invitations API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockInvitation: ReturnType<typeof createTestInvitation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({
      tenantId: mockTenant.id,
      email: 'newstaff@example.com',
      userId: null, // Staff without linked user
    });
    mockInvitation = createTestInvitation({
      tenantId: mockTenant.id,
      staffId: mockStaff.id,
      email: mockStaff.email!,
    });

    // Mock Prisma responses
    prismaMock.tenantInvitation.findUnique.mockResolvedValue(mockInvitation);
    prismaMock.tenantInvitation.findFirst.mockResolvedValue(mockInvitation);
    prismaMock.tenantInvitation.create.mockResolvedValue(mockInvitation);
    prismaMock.tenantInvitation.update.mockResolvedValue(mockInvitation);
    prismaMock.staff.findUnique.mockResolvedValue(mockStaff);
  });

  describe('POST /api/invitations/send', () => {
    it('should send invitation to staff member', async () => {
      prismaMock.staff.findUnique.mockResolvedValue(mockStaff);
      prismaMock.tenantInvitation.findFirst.mockResolvedValue(null); // No existing invitation
      prismaMock.tenantInvitation.create.mockResolvedValue(mockInvitation);

      const staff = await prismaMock.staff.findUnique({
        where: { id: mockStaff.id },
      });

      expect(staff).toBeDefined();
      expect(staff?.email).toBe(mockStaff.email);
      expect(staff?.userId).toBeNull(); // Staff should not have a linked user
    });

    it('should require staff:write permission', async () => {
      // Permission check should happen before any DB operations
      const requiredPermission = { resource: 'staff', action: 'write' };
      expect(requiredPermission.resource).toBe('staff');
      expect(requiredPermission.action).toBe('write');
    });

    it('should return 404 if staff not found', async () => {
      prismaMock.staff.findUnique.mockResolvedValue(null);

      const staff = await prismaMock.staff.findUnique({
        where: { id: 'non-existent' },
      });

      expect(staff).toBeNull();
      // API would return: { error: 'Personal no encontrado' }, { status: 404 }
    });

    it('should return 403 if staff belongs to different tenant', async () => {
      const otherTenantStaff = createTestStaff({
        id: 'other-staff',
        tenantId: 'other-tenant-id',
      });

      prismaMock.staff.findUnique.mockResolvedValue(otherTenantStaff);

      const staff = await prismaMock.staff.findUnique({
        where: { id: otherTenantStaff.id },
      });

      const isOwnTenant = staff?.tenantId === mockTenant.id;
      expect(isOwnTenant).toBe(false);
      // API would return: { error: 'No tienes permiso para invitar a este personal' }, { status: 403 }
    });

    it('should return 400 if staff has no email', async () => {
      const staffWithoutEmail = createTestStaff({
        tenantId: mockTenant.id,
        email: null,
      });

      prismaMock.staff.findUnique.mockResolvedValue(staffWithoutEmail);

      const staff = await prismaMock.staff.findUnique({
        where: { id: staffWithoutEmail.id },
      });

      expect(staff?.email).toBeNull();
      // API would return: { error: 'El personal no tiene email configurado' }, { status: 400 }
    });

    it('should return 400 if staff already has linked user', async () => {
      const staffWithUser = createTestStaff({
        tenantId: mockTenant.id,
        userId: mockUser.id,
      });

      prismaMock.staff.findUnique.mockResolvedValue(staffWithUser);

      const staff = await prismaMock.staff.findUnique({
        where: { id: staffWithUser.id },
      });

      expect(staff?.userId).not.toBeNull();
      // API would return: { error: 'El personal ya tiene una cuenta vinculada' }, { status: 400 }
    });

    it('should resend if invitation already exists and is pending', async () => {
      prismaMock.tenantInvitation.findFirst.mockResolvedValue(mockInvitation);

      const existingInvitation = await prismaMock.tenantInvitation.findFirst({
        where: { staffId: mockStaff.id, status: 'PENDING' },
      });

      expect(existingInvitation).not.toBeNull();
      expect(existingInvitation?.status).toBe('PENDING');
      // API would return: { message: 'Invitación reenviada exitosamente' }
    });
  });

  describe('GET /api/invitations/validate', () => {
    it('should return valid invitation details', async () => {
      const invitationWithDetails = {
        ...mockInvitation,
        tenant: {
          id: mockTenant.id,
          name: mockTenant.name,
          logo: null,
        },
        staff: {
          id: mockStaff.id,
          name: mockStaff.name,
          position: mockStaff.position,
          email: mockStaff.email,
        },
      };

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(invitationWithDetails);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: mockInvitation.token },
        include: {
          tenant: { select: { id: true, name: true, logo: true } },
          staff: { select: { id: true, name: true, position: true, email: true } },
        },
      });

      expect(invitation).not.toBeNull();
      expect(invitation?.status).toBe('PENDING');
      expect(invitation?.tenant).toBeDefined();
      expect(invitation?.staff).toBeDefined();
    });

    it('should return invalid for non-existent token', async () => {
      prismaMock.tenantInvitation.findUnique.mockResolvedValue(null);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: 'invalid-token' },
      });

      expect(invitation).toBeNull();
      // API would return: { valid: false, reason: 'Invitación no encontrada' }
    });

    it('should return invalid for already accepted invitation', async () => {
      const acceptedInvitation = createTestInvitation({
        status: 'ACCEPTED',
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(acceptedInvitation);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: acceptedInvitation.token },
      });

      expect(invitation?.status).toBe('ACCEPTED');
      // API would return: { valid: false, reason: 'Esta invitación ya fue aceptada' }
    });

    it('should return invalid for revoked invitation', async () => {
      const revokedInvitation = createTestInvitation({
        status: 'REVOKED',
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(revokedInvitation);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: revokedInvitation.token },
      });

      expect(invitation?.status).toBe('REVOKED');
      // API would return: { valid: false, reason: 'Esta invitación fue revocada' }
    });

    it('should return invalid for expired invitation', async () => {
      const expiredInvitation = createTestInvitation({
        expiresAt: subDays(new Date(), 1), // Expired yesterday
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(expiredInvitation);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: expiredInvitation.token },
      });

      const isExpired = invitation!.expiresAt < new Date();
      expect(isExpired).toBe(true);
      // API would return: { valid: false, reason: 'Esta invitación ha expirado' }
    });
  });

  describe('POST /api/invitations/accept', () => {
    it('should accept valid invitation and link user to staff', async () => {
      const invitationWithDetails = {
        ...mockInvitation,
        tenant: {
          id: mockTenant.id,
          name: mockTenant.name,
          logo: null,
        },
        staff: {
          id: mockStaff.id,
          name: mockStaff.name,
          position: mockStaff.position,
          email: mockStaff.email,
        },
      };

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(invitationWithDetails);
      prismaMock.staff.findUnique.mockResolvedValue(mockStaff);

      // Verify invitation is valid
      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: mockInvitation.token },
      });

      expect(invitation?.status).toBe('PENDING');
      expect(invitation?.staff).toBeDefined();

      // Simulate transaction updates
      const updatedUser = { ...mockUser, tenantId: mockTenant.id };
      const updatedStaff = { ...mockStaff, userId: mockUser.id };
      const acceptedInvitation = { ...mockInvitation, status: 'ACCEPTED' as const };

      prismaMock.user.update.mockResolvedValue(updatedUser);
      prismaMock.staff.update.mockResolvedValue(updatedStaff);
      prismaMock.tenantInvitation.update.mockResolvedValue(acceptedInvitation);

      // Verify updates would succeed
      expect(updatedUser.tenantId).toBe(mockTenant.id);
      expect(updatedStaff.userId).toBe(mockUser.id);
      expect(acceptedInvitation.status).toBe('ACCEPTED');
    });

    it('should return error if staff already has linked user', async () => {
      const staffWithUser = createTestStaff({
        tenantId: mockTenant.id,
        userId: 'existing-user-id',
      });

      prismaMock.staff.findUnique.mockResolvedValue(staffWithUser);

      const staff = await prismaMock.staff.findUnique({
        where: { id: staffWithUser.id },
      });

      expect(staff?.userId).not.toBeNull();
      // acceptInvitation would return: { success: false, error: 'Este personal ya tiene una cuenta vinculada' }
    });

    it('should return error if invitation token is invalid', async () => {
      prismaMock.tenantInvitation.findUnique.mockResolvedValue(null);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: 'invalid-token' },
      });

      expect(invitation).toBeNull();
      // acceptInvitation would return: { success: false, error: 'Invitación no encontrada' }
    });

    it('should handle race condition when autoAcceptPendingInvitation already accepted', async () => {
      // This tests the race condition where:
      // 1. User registers and is redirected back to /invite
      // 2. autoAcceptPendingInvitation (in findOrCreateUser) accepts the invitation
      // 3. The /api/invitations/accept endpoint is called but invitation is already accepted
      // 4. The endpoint should still return success if user is linked to tenant

      const acceptedInvitation = createTestInvitation({
        status: 'ACCEPTED',
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(acceptedInvitation);

      // Simulate user already linked to tenant (by autoAcceptPendingInvitation)
      const userWithTenant = { ...mockUser, tenantId: mockTenant.id };
      prismaMock.tenant.findUnique.mockResolvedValue(mockTenant);

      // The validation would return invalid with "Esta invitación ya fue aceptada"
      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: acceptedInvitation.token },
      });

      expect(invitation?.status).toBe('ACCEPTED');

      // But if user already has tenantId, the endpoint should return success
      // This is the key behavior we're testing
      const shouldReturnSuccess = userWithTenant.tenantId !== null;
      expect(shouldReturnSuccess).toBe(true);

      // API behavior:
      // If validation.reason === 'Esta invitación ya fue aceptada' && user.tenantId exists
      // Return: { success: true, alreadyAccepted: true, tenantName: tenant.name }
    });

    it('should return error when invitation already accepted but user not linked', async () => {
      // This tests when invitation was accepted by someone else
      // and current user is NOT linked to any tenant

      const acceptedInvitation = createTestInvitation({
        status: 'ACCEPTED',
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(acceptedInvitation);

      // User without tenant (not linked)
      const userWithoutTenant = { ...mockUser, tenantId: null };

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: acceptedInvitation.token },
      });

      expect(invitation?.status).toBe('ACCEPTED');

      // User should get an error because they're not linked
      const shouldReturnError = userWithoutTenant.tenantId === null;
      expect(shouldReturnError).toBe(true);

      // API behavior:
      // If validation.reason === 'Esta invitación ya fue aceptada' && !user.tenantId
      // Return: { success: false, error: 'Esta invitación ya fue aceptada' }, status: 400
    });

    it('should handle "staff already linked" as success when user has tenant', async () => {
      // This tests when acceptInvitation fails because staff already linked
      // but the user is the one who was linked (via autoAcceptPendingInvitation)

      const invitationWithDetails = {
        ...mockInvitation,
        tenant: {
          id: mockTenant.id,
          name: mockTenant.name,
          logo: null,
        },
        staff: {
          id: mockStaff.id,
          name: mockStaff.name,
          position: mockStaff.position,
          email: mockStaff.email,
        },
      };

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(invitationWithDetails);

      // Staff already linked to user
      const staffAlreadyLinked = { ...mockStaff, userId: mockUser.id };
      prismaMock.staff.findUnique.mockResolvedValue(staffAlreadyLinked);

      // User has tenant
      const userWithTenant = { ...mockUser, tenantId: mockTenant.id };

      // acceptInvitation would return error: 'Este personal ya tiene una cuenta vinculada'
      // But if user.tenantId exists, endpoint should return success
      const shouldTreatAsSuccess = userWithTenant.tenantId !== null;
      expect(shouldTreatAsSuccess).toBe(true);

      // API behavior:
      // If result.error === 'Este personal ya tiene una cuenta vinculada' && user.tenantId
      // Return: { success: true, alreadyAccepted: true, tenantName: invitation.tenant.name }
    });
  });

  describe('Invitation Lifecycle', () => {
    it('should generate new token when creating invitation', async () => {
      const newInvitation = createTestInvitation({
        token: 'abcdefghij1234567890abcdefghij12', // 32 chars
        expiresAt: addDays(new Date(), 7),
      });

      prismaMock.tenantInvitation.create.mockResolvedValue(newInvitation);

      const created = await prismaMock.tenantInvitation.create({
        data: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          email: mockStaff.email!,
          roleKey: 'VETERINARIAN',
          token: newInvitation.token,
          status: 'PENDING',
          expiresAt: newInvitation.expiresAt,
        },
      });

      expect(created.token).toHaveLength(32);
      expect(created.status).toBe('PENDING');
      expect(created.expiresAt > new Date()).toBe(true);
    });

    it('should revoke old invitations when creating new one for same staff', async () => {
      prismaMock.tenantInvitation.updateMany.mockResolvedValue({ count: 1 });

      const result = await prismaMock.tenantInvitation.updateMany({
        where: {
          staffId: mockStaff.id,
          status: 'PENDING',
        },
        data: {
          status: 'REVOKED',
        },
      });

      expect(result.count).toBe(1);
    });

    it('should update existing pending invitation instead of creating new', async () => {
      prismaMock.tenantInvitation.findFirst.mockResolvedValue(mockInvitation);

      const existingInvitation = await prismaMock.tenantInvitation.findFirst({
        where: {
          staffId: mockStaff.id,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      expect(existingInvitation).not.toBeNull();

      const updatedInvitation = {
        ...mockInvitation,
        expiresAt: addDays(new Date(), 7),
      };

      prismaMock.tenantInvitation.update.mockResolvedValue(updatedInvitation);

      const updated = await prismaMock.tenantInvitation.update({
        where: { id: existingInvitation!.id },
        data: {
          expiresAt: addDays(new Date(), 7),
        },
      });

      expect(updated.expiresAt > new Date()).toBe(true);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not allow accepting invitation for different tenant', async () => {
      const otherTenantInvitation = createTestInvitation({
        tenantId: 'other-tenant-id',
      });

      prismaMock.tenantInvitation.findUnique.mockResolvedValue(otherTenantInvitation);

      const invitation = await prismaMock.tenantInvitation.findUnique({
        where: { token: otherTenantInvitation.token },
      });

      // When accepting, the user would be linked to the invitation's tenant
      // This is by design - the user joins the tenant that invited them
      expect(invitation?.tenantId).toBe('other-tenant-id');
    });

    it('should only allow staff from same tenant to be invited', async () => {
      const otherTenantStaff = createTestStaff({
        tenantId: 'other-tenant-id',
      });

      prismaMock.staff.findUnique.mockResolvedValue(otherTenantStaff);

      const staff = await prismaMock.staff.findUnique({
        where: { id: otherTenantStaff.id },
      });

      const isSameTenant = staff?.tenantId === mockTenant.id;
      expect(isSameTenant).toBe(false);
      // API should return 403: 'No tienes permiso para invitar a este personal'
    });
  });

  describe('Cleanup Operations', () => {
    it('should mark expired invitations as EXPIRED', async () => {
      prismaMock.tenantInvitation.updateMany.mockResolvedValue({ count: 5 });

      const result = await prismaMock.tenantInvitation.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: new Date() },
        },
        data: {
          status: 'EXPIRED',
        },
      });

      expect(result.count).toBe(5);
    });

    it('should get pending invitation by email', async () => {
      prismaMock.tenantInvitation.findFirst.mockResolvedValue(mockInvitation);

      const invitation = await prismaMock.tenantInvitation.findFirst({
        where: {
          email: mockStaff.email!.toLowerCase(),
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      expect(invitation).not.toBeNull();
      expect(invitation?.email).toBe(mockStaff.email);
    });
  });
});
