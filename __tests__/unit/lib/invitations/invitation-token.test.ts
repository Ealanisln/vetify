/**
 * @jest-environment node
 *
 * Tests for the real invitation-token functions with Prisma mocked.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../../mocks/prisma';
import { addDays, subDays } from 'date-fns';
import { generateStaffInvitation } from '@/lib/invitations/invitation-token';

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
