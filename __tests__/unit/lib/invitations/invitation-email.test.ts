/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../../mocks/prisma';

jest.mock('@/lib/invitations/invitation-token', () => ({
  generateStaffInvitation: jest.fn(),
}));
jest.mock('@/lib/email/email-service', () => ({
  sendEmail: jest.fn(),
}));

import { sendStaffInvitationEmail } from '@/lib/invitations/invitation-email';
import { generateStaffInvitation } from '@/lib/invitations/invitation-token';
import { sendEmail } from '@/lib/email/email-service';

const mockGenerate = generateStaffInvitation as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

describe('sendStaffInvitationEmail', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    prismaMock.staff.findUnique.mockResolvedValue({
      id: 'staff-1',
      name: 'Ana',
      email: 'ana@example.com',
      position: 'MANAGER',
      userId: null,
      tenantId: 'tenant-1',
    } as any);
    prismaMock.tenant.findUnique.mockResolvedValue({ id: 'tenant-1', name: 'Clínica Norte' } as any);
    mockGenerate.mockResolvedValue({ id: 'inv-1', token: 'tok-1' });
    mockSendEmail.mockResolvedValue({ success: true, messageId: 'm-1' });
  });

  afterEach(() => consoleSpy.mockRestore());

  it('returns a Spanish message instead of the raw Prisma error', async () => {
    mockGenerate.mockRejectedValue(
      Object.assign(
        new Error('\nInvalid `prisma.tenantInvitation.create()` invocation:\n\nUnique constraint failed on the fields: (`staffId`)'),
        { code: 'P2002' }
      )
    );

    const result = await sendStaffInvitationEmail({ staffId: 'staff-1', tenantId: 'tenant-1' });

    expect(result.success).toBe(false);
    expect(result.error).not.toMatch(/prisma|invocation|constraint/i);
    expect(result.error).toMatch(/invitación/i);
  });

  it('returns a Spanish message for unknown errors', async () => {
    mockGenerate.mockRejectedValue(new Error('Connection terminated unexpectedly'));

    const result = await sendStaffInvitationEmail({ staffId: 'staff-1', tenantId: 'tenant-1' });

    expect(result.success).toBe(false);
    expect(result.error).not.toMatch(/connection/i);
    expect(result.error).toMatch(/invitación/i);
  });
});
