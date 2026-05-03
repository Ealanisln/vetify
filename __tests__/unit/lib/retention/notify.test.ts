jest.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    staff: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/email/email-service', () => ({
  sendEmail: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email/email-service';
import { sendRetentionWarnings } from '@/lib/retention/notify';

const findMany = prisma.tenant.findMany as jest.Mock;
const updateTenant = prisma.tenant.update as jest.Mock;
const findStaff = prisma.staff.findFirst as jest.Mock;
const sendEmailMock = sendEmail as jest.Mock;

const NOW = new Date('2026-04-28T12:00:00.000Z');
const FIVE_DAYS = new Date('2026-05-03T12:00:00.000Z');

function makeTenant(overrides: Partial<{ id: string; name: string; dataRetentionEndsAt: Date }> = {}) {
  return {
    id: 'tenant-1',
    name: 'Clinica Patitas',
    dataRetentionEndsAt: FIVE_DAYS,
    ...overrides,
  };
}

describe('sendRetentionWarnings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty result when no candidates in window', async () => {
    findMany.mockResolvedValue([]);

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.scanned).toBe(0);
    expect(result.sent).toEqual([]);
    expect(result.remaining).toBe(false);
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it('sends email and marks retentionWarningSentAt on success', async () => {
    findMany.mockResolvedValue([makeTenant()]);
    findStaff.mockResolvedValueOnce({ email: 'admin@clinic.com', name: 'Dr Ana' });
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'msg_1' });

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.sent).toEqual(['tenant-1']);
    expect(result.failed).toEqual([]);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
    expect(updateTenant).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { retentionWarningSentAt: NOW },
    });
  });

  it('does NOT mark sent when Resend returns failure (retries tomorrow)', async () => {
    findMany.mockResolvedValue([makeTenant()]);
    findStaff.mockResolvedValueOnce({ email: 'admin@clinic.com', name: 'Dr Ana' });
    sendEmailMock.mockResolvedValue({ success: false, error: 'rate_limited', statusCode: 429 });

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.sent).toEqual([]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].tenantId).toBe('tenant-1');
    expect(updateTenant).not.toHaveBeenCalled();
  });

  it('skips tenants without an admin email', async () => {
    findMany.mockResolvedValue([makeTenant()]);
    findStaff
      .mockResolvedValueOnce(null) // first lookup: position-filtered
      .mockResolvedValueOnce(null); // fallback lookup: any active staff with email

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.skippedNoAdmin).toEqual(['tenant-1']);
    expect(sendEmailMock).not.toHaveBeenCalled();
    expect(updateTenant).not.toHaveBeenCalled();
  });

  it('falls back to any active staff when no Administrador/MANAGER found', async () => {
    findMany.mockResolvedValue([makeTenant()]);
    findStaff
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ email: 'vet@clinic.com', name: 'Dr B' });
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'msg_2' });

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.sent).toEqual(['tenant-1']);
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: { email: 'vet@clinic.com', name: 'Dr B' } }),
    );
  });

  it('isolates per-tenant errors so one failure does not abort the batch', async () => {
    findMany.mockResolvedValue([
      makeTenant({ id: 'a' }),
      makeTenant({ id: 'b' }),
    ]);
    findStaff
      .mockRejectedValueOnce(new Error('db hiccup'))
      .mockResolvedValueOnce({ email: 'admin@b.com', name: 'B' });
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'msg_3' });

    const result = await sendRetentionWarnings(50, NOW);

    expect(result.sent).toEqual(['b']);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].tenantId).toBe('a');
  });

  it('caps at limit and reports remaining=true when overflow', async () => {
    const many = Array.from({ length: 4 }, (_, i) =>
      makeTenant({ id: `t-${i}` }),
    );
    findMany.mockResolvedValue(many); // limit+1 = 4 returned for limit=3
    findStaff.mockResolvedValue({ email: 'a@b.c', name: 'A' });
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'm' });

    const result = await sendRetentionWarnings(3, NOW);

    expect(result.scanned).toBe(3);
    expect(result.sent).toHaveLength(3);
    expect(result.remaining).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(3);
  });

  it('computes daysRemaining floor at 0 when very close to deletion', async () => {
    const almostNow = new Date(NOW.getTime() + 1000); // 1s in future
    findMany.mockResolvedValue([
      makeTenant({ dataRetentionEndsAt: almostNow }),
    ]);
    findStaff.mockResolvedValue({ email: 'a@b.c', name: 'A' });
    sendEmailMock.mockResolvedValue({ success: true, messageId: 'm' });

    await sendRetentionWarnings(50, NOW);

    const callArg = sendEmailMock.mock.calls[0][0];
    expect(callArg.data.daysRemaining).toBeGreaterThanOrEqual(0);
    expect(callArg.data.daysRemaining).toBeLessThanOrEqual(1);
  });
});
