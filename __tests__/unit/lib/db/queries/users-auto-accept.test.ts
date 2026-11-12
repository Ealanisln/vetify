/**
 * @jest-environment node
 *
 * Auto-accepting invitations on login must only happen when unambiguous and
 * must go through acceptInvitation (same checks as the explicit flow).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../../../mocks/prisma';

jest.mock('@/lib/invitations/invitation-token', () => ({
  getPendingInvitationByEmail: jest.fn(),
  acceptInvitation: jest.fn(),
}));

import { findOrCreateUser } from '@/lib/db/queries/users';
import {
  getPendingInvitationByEmail,
  acceptInvitation,
} from '@/lib/invitations/invitation-token';

const mockGetPending = getPendingInvitationByEmail as jest.Mock;
const mockAccept = acceptInvitation as jest.Mock;

const kindeData = { id: 'user-1', email: 'ana@example.com', firstName: 'Ana', lastName: 'López' };

const existingUser = {
  id: 'user-1',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'López',
  name: 'Ana López',
  isActive: true,
  tenantId: null,
  tenant: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('findOrCreateUser auto-accept', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.user.findUnique.mockResolvedValue(existingUser as any);
  });

  afterEach(() => consoleSpy.mockRestore());

  it('accepts the single pending invitation through acceptInvitation', async () => {
    mockGetPending.mockResolvedValue({ id: 'inv-1', token: 'tok-1', staff: { id: 'staff-1' } });
    mockAccept.mockResolvedValue({ success: true, staffId: 'staff-1' });

    await findOrCreateUser(kindeData);

    expect(mockAccept).toHaveBeenCalledWith('tok-1', 'user-1');
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('does nothing when there is no unambiguous pending invitation', async () => {
    mockGetPending.mockResolvedValue(null);

    const user = await findOrCreateUser(kindeData);

    expect(mockAccept).not.toHaveBeenCalled();
    expect(user.tenantId).toBeNull();
  });

  it('skips auto-accept when the caller accepts a specific token itself', async () => {
    await findOrCreateUser(kindeData, { autoAcceptInvitations: false });

    expect(mockGetPending).not.toHaveBeenCalled();
    expect(mockAccept).not.toHaveBeenCalled();
  });
});
