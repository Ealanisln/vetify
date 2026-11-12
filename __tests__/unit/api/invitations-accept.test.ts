/**
 * @jest-environment node
 *
 * POST /api/invitations/accept with the real invitation-token module and
 * Prisma mocked.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { addDays } from 'date-fns';

jest.mock('@/lib/auth', () => ({
  getAuthenticatedUser: jest.fn(),
}));

import { POST } from '@/app/api/invitations/accept/route';
import { getAuthenticatedUser } from '@/lib/auth';

const mockGetUser = getAuthenticatedUser as jest.Mock;

function request(body: unknown) {
  return { json: () => Promise.resolve(body) } as any;
}

const invitation = {
  id: 'inv-1',
  tenantId: 'tenant-1',
  staffId: 'staff-1',
  email: 'ana@example.com',
  roleKey: 'VETERINARIAN',
  token: 'tok-1',
  status: 'PENDING',
  expiresAt: addDays(new Date(), 7),
  createdAt: new Date(),
  tenant: { id: 'tenant-1', name: 'Clínica Norte', logo: null },
  staff: { id: 'staff-1', name: 'Ana', position: 'VETERINARIAN', email: 'ana@example.com' },
};

describe('POST /api/invitations/accept', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.tenantInvitation.findUnique.mockResolvedValue(invitation as any);
    prismaMock.staff.findUnique.mockImplementation((async (args: any) =>
      args.where.id === 'staff-1' ? { userId: null } : null) as any);
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);
  });

  afterEach(() => consoleSpy.mockRestore());

  it('returns 409 with a Spanish message when the user belongs to another clinic', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1', email: 'ana@example.com', tenantId: 'tenant-2' });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-2' } as any);

    const res = await POST(request({ token: 'tok-1' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
    expect(body.code).toBe('USER_IN_OTHER_TENANT');
    expect(body.error).toMatch(/otra clínica/);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('does not report success when the staff record belongs to someone else', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1', email: 'ana@example.com', tenantId: 'tenant-1' });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: 'tenant-1' } as any);
    prismaMock.staff.findUnique.mockImplementation((async (args: any) =>
      args.where.id === 'staff-1' ? { userId: 'someone-else' } : null) as any);

    const res = await POST(request({ token: 'tok-1' }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.success).toBe(false);
  });

  it('accepts the invitation for a user without a clinic', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1', email: 'Ana@Example.com', tenantId: null });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null } as any);

    const res = await POST(request({ token: 'tok-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ success: true, staffId: 'staff-1', tenantName: 'Clínica Norte' });
  });

  it('returns 403 with the invited email when logged in with a different account', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1', email: 'otro@example.com', tenantId: null });

    const res = await POST(request({ token: 'tok-1' }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toMatchObject({
      success: false,
      code: 'EMAIL_MISMATCH',
      invitationEmail: 'ana@example.com',
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('accepts the token from the link instead of auto-accepting another invitation', async () => {
    mockGetUser.mockResolvedValue({ id: 'user-1', email: 'ana@example.com', tenantId: null });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', tenantId: null } as any);

    await POST(request({ token: 'tok-1' }));

    expect(mockGetUser).toHaveBeenCalledWith({ autoAcceptInvitations: false });
  });
});
