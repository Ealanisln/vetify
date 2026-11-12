/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * GET /api/appointments list behavior.
 *
 * The calendar asks for a date range and expects every appointment in it.
 * The route used to apply the default page size (10) to range queries, so a
 * month view only ever showed the 10 oldest appointments of the range.
 */
import { prismaMock } from '../../mocks/prisma';
import { GET } from '@/app/api/appointments/route';

jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(),
}));

jest.mock('@/lib/email/email-service', () => ({
  sendAppointmentConfirmation: jest.fn(),
  sendAppointmentStaffNotification: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';

const mockRequireAuth = requireAuth as jest.Mock;
const TENANT_ID = 'tenant-list';

/** 25 appointments, one per day starting 2026-11-01 at 15:00Z. */
function seedRows(count = 25) {
  return Array.from({ length: count }, (_, i) => ({
    id: `appt-${String(i + 1).padStart(2, '0')}`,
    tenantId: TENANT_ID,
    dateTime: new Date(Date.UTC(2026, 10, 1 + i, 15)),
    duration: 30,
    reason: 'Consulta',
    status: 'SCHEDULED',
  }));
}

/**
 * findMany/count that honour the date filter, skip and take, so the
 * assertions check what the route actually returns for a request.
 */
function mockStore(rows: ReturnType<typeof seedRows>) {
  const matches = (where: any) =>
    rows.filter((row) => {
      if (where?.tenantId && row.tenantId !== where.tenantId) return false;
      const range = where?.dateTime;
      if (range?.gte && row.dateTime < range.gte) return false;
      if (range?.lte && row.dateTime > range.lte) return false;
      return true;
    });

  prismaMock.appointment.count.mockImplementation((async (args: any) =>
    matches(args?.where).length) as any);
  prismaMock.appointment.findMany.mockImplementation((async (args: any) => {
    const found = matches(args?.where);
    const skip = args?.skip ?? 0;
    return args?.take === undefined ? found.slice(skip) : found.slice(skip, skip + args.take);
  }) as any);
}

function getRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost:3000/api/appointments');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

describe('GET /api/appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      user: { id: 'user-1' },
      tenant: { id: TENANT_ID },
    });
    mockStore(seedRows());
  });

  it('returns every appointment in a calendar date range, not just the first page', async () => {
    const res = await GET(
      getRequest({
        start_date: '2026-10-01T06:00:00.000Z',
        end_date: '2027-01-01T05:59:59.999Z',
      })
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(25);
    expect(body.pagination.total).toBe(25);
    expect(body.pagination.hasMore).toBe(false);
  });

  it('only returns appointments inside the requested range', async () => {
    const res = await GET(
      getRequest({
        start_date: '2026-11-10T00:00:00.000Z',
        end_date: '2026-11-16T23:59:59.999Z',
      })
    );
    const body = await res.json();

    expect(body.data.map((a: { id: string }) => a.id)).toEqual([
      'appt-10',
      'appt-11',
      'appt-12',
      'appt-13',
      'appt-14',
      'appt-15',
      'appt-16',
    ]);
  });

  it('still paginates when the client asks for a page explicitly', async () => {
    const res = await GET(
      getRequest({
        start_date: '2026-10-01T06:00:00.000Z',
        end_date: '2027-01-01T05:59:59.999Z',
        page: '2',
        limit: '10',
      })
    );
    const body = await res.json();

    expect(body.data).toHaveLength(10);
    expect(body.data[0].id).toBe('appt-11');
    expect(body.pagination.hasMore).toBe(true);
  });

  it('keeps the default page size when no range is given', async () => {
    const res = await GET(getRequest({}));
    const body = await res.json();

    expect(body.data).toHaveLength(10);
    expect(body.pagination.total).toBe(25);
  });

  it('falls back to pagination for ranges longer than the calendar ever asks for', async () => {
    const res = await GET(
      getRequest({
        start_date: '2020-01-01T00:00:00.000Z',
        end_date: '2030-01-01T00:00:00.000Z',
      })
    );
    const body = await res.json();

    expect(body.data).toHaveLength(10);
    expect(body.pagination.hasMore).toBe(true);
  });
});
