/**
 * @jest-environment node
 *
 * Tests for the real invitation-token functions with Prisma mocked.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../../mocks/prisma';
import { addDays, subDays } from 'date-fns';
import { generateStaffInvitation, acceptInvitation } from '@/lib/invitations/invitation-token';

function uniqueConstraintError(field: string) {
  return Object.assign(
    new Error(`Unique constraint failed on the fields: (\`${field}\`)`),
    { code: 'P2002', meta: { target: [field] } }
  );
}

function invitationRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    tenantId: 'tenant-1',
    staffId: 'staff-1',
    email: 'ana@example.com',
    roleKey: 'VETERINARIAN',
    token: 'old-token',
    status: 'PENDING',
    expiresAt: addDays(new Date(), 7),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('generateStaffInvitation', () => {
  beforeEach(() => {
    // Mirror the real DB: staffId is @unique, so a second row for the same
    // staff fails with P2002.
    prismaMock.tenantInvitation.create.mockRejectedValue(uniqueConstraintError('staffId'));
    prismaMock.tenantInvitation.upsert.mockImplementation((async (args: any) => ({
      ...invitationRow(),
      ...args.update,
    })) as any);
  });

  it('reuses the existing row when re-inviting after the invitation expired', async () => {
    // No active (PENDING, not expired) invitation
    prismaMock.tenantInvitation.findFirst.mockResolvedValue(null);

    const result = await generateStaffInvitation(
      'staff-1',
      ' Ana@Example.com ',
      'tenant-1',
      'MANAGER'
    );

    expect(prismaMock.tenantInvitation.create).not.toHaveBeenCalled();
    expect(prismaMock.tenantInvitation.upsert).toHaveBeenCalledTimes(1);

    const args = prismaMock.tenantInvitation.upsert.mock.calls[0][0] as any;
    expect(args.where).toEqual({ staffId: 'staff-1' });
    expect(args.update).toMatchObject({
      status: 'PENDING',
      email: 'ana@example.com',
      roleKey: 'MANAGER',
    });
    expect(args.update.token).toEqual(expect.any(String));
    expect(args.update.token).not.toBe('old-token');
    expect(args.update.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(args.create).toMatchObject({
      staffId: 'staff-1',
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(result.status).toBe('PENDING');
    expect(result.token).toBe(args.update.token);
  });

  it('reuses a REVOKED row instead of creating a new one', async () => {
    prismaMock.tenantInvitation.findFirst.mockResolvedValue(null);

    await expect(
      generateStaffInvitation('staff-1', 'ana@example.com', 'tenant-1', 'VETERINARIAN')
    ).resolves.toMatchObject({ status: 'PENDING' });
    expect(prismaMock.tenantInvitation.create).not.toHaveBeenCalled();
  });

  it('keeps the token of a still-active invitation and extends it', async () => {
    const active = invitationRow({ expiresAt: addDays(new Date(), 2) });
    prismaMock.tenantInvitation.findFirst.mockResolvedValue(active as any);
    prismaMock.tenantInvitation.update.mockImplementation((async (args: any) => ({
      ...active,
      ...args.data,
    })) as any);

    const result = await generateStaffInvitation('staff-1', 'ana@example.com', 'tenant-1', 'VETERINARIAN');

    expect(result.token).toBe('old-token');
    expect(prismaMock.tenantInvitation.upsert).not.toHaveBeenCalled();
    const data = (prismaMock.tenantInvitation.update.mock.calls[0][0] as any).data;
    expect(data.expiresAt.getTime()).toBeGreaterThan(addDays(new Date(), 6).getTime());
  });

  it('ignores expired rows when looking for an active invitation', async () => {
    prismaMock.tenantInvitation.findFirst.mockResolvedValue(null);
    await generateStaffInvitation('staff-1', 'ana@example.com', 'tenant-1', 'VETERINARIAN');

    const where = (prismaMock.tenantInvitation.findFirst.mock.calls[0][0] as any).where;
    expect(where).toMatchObject({ staffId: 'staff-1', status: 'PENDING' });
    expect(where.expiresAt.gt.getTime()).toBeGreaterThan(subDays(new Date(), 1).getTime());
  });
});

describe('acceptInvitation', () => {
  const invitation = {
    ...invitationRow({ token: 'tok-1' }),
    tenant: { id: 'tenant-1', name: 'Clínica Norte', logo: null },
    staff: { id: 'staff-1', name: 'Ana', position: 'VETERINARIAN', email: 'ana@example.com' },
  };

  function mockStaffLookups(opts: { invitedStaffUserId?: string | null; userStaff?: any } = {}) {
    prismaMock.staff.findUnique.mockImplementation((async (args: any) => {
      if (args.where.id === 'staff-1') return { userId: opts.invitedStaffUserId ?? null };
      if (args.where.userId) return opts.userStaff ?? null;
      return null;
    }) as any);
  }

  beforeEach(() => {
    prismaMock.tenantInvitation.findUnique.mockResolvedValue(invitation as any);
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);
  });

  it('refuses to move a user who already belongs to another clinic', async () => {
    mockStaffLookups();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-2' } as any);

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toMatchObject({ success: false, code: 'USER_IN_OTHER_TENANT' });
    expect((result as any).error).toMatch(/otra clínica/);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('refuses when the user is already linked to another staff record', async () => {
    mockStaffLookups({ userStaff: { id: 'staff-9', tenantId: 'tenant-1' } });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' } as any);

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toMatchObject({ success: false, code: 'USER_ALREADY_LINKED' });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('refuses when the staff record is linked to a different user', async () => {
    mockStaffLookups({ invitedStaffUserId: 'someone-else' });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null } as any);

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toMatchObject({ success: false, code: 'STAFF_ALREADY_LINKED' });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('is idempotent when the staff record is already linked to this user', async () => {
    mockStaffLookups({ invitedStaffUserId: 'user-1' });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' } as any);

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toEqual({ success: true, staffId: 'staff-1' });
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('links a user without a clinic', async () => {
    mockStaffLookups();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null } as any);

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toEqual({ success: true, staffId: 'staff-1' });
    expect(prismaMock.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user-1' }, data: { tenantId: 'tenant-1' } })
    );
    expect(prismaMock.staff.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'staff-1' }, data: { userId: 'user-1' } })
    );
  });

  it('maps a unique-constraint race to a Spanish error instead of throwing', async () => {
    mockStaffLookups();
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null } as any);
    prismaMock.$transaction.mockRejectedValue(uniqueConstraintError('userId'));

    const result = await acceptInvitation('tok-1', 'user-1');

    expect(result).toMatchObject({ success: false, code: 'USER_ALREADY_LINKED' });
  });
});
