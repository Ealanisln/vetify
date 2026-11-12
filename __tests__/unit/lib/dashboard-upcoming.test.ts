/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Home "Próximas citas": cancelled and no-show appointments must not be
 * listed, and the stats carry the clinic timezone for display.
 */
import { prismaMock } from '../../mocks/prisma';
import { getDashboardStats } from '@/lib/dashboard';

const TENANT_ID = 'tenant-dash';

const upcoming = [
  { id: 'a-scheduled', status: 'SCHEDULED' },
  { id: 'a-cancel-client', status: 'CANCELLED_CLIENT' },
  { id: 'a-cancel-clinic', status: 'CANCELLED_CLINIC' },
  { id: 'a-no-show', status: 'NO_SHOW' },
  { id: 'a-checked-in', status: 'CHECKED_IN' },
].map((a, i) => ({
  ...a,
  tenantId: TENANT_ID,
  dateTime: new Date(Date.now() + (i + 1) * 3600_000),
  reason: 'Consulta',
  notes: null,
  pet: { id: 'p1', name: 'Firulais', species: 'dog', customer: { id: 'c1', name: 'Ana', firstName: null, lastName: null } },
  user: null,
}));

/** findMany that applies the status filter the route asks for. */
function mockAppointments() {
  prismaMock.appointment.findMany.mockImplementation((async (args: any) => {
    const notIn: string[] = args?.where?.status?.notIn ?? [];
    const only: string | undefined = typeof args?.where?.status === 'string' ? args.where.status : undefined;
    return upcoming.filter((a) => !notIn.includes(a.status) && (!only || a.status === only));
  }) as any);
}

describe('getDashboardStats upcoming appointments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.pet.count.mockResolvedValue(1);
    prismaMock.appointment.count.mockResolvedValue(5);
    prismaMock.pet.findMany.mockResolvedValue([]);
    prismaMock.tenantSettings.findUnique.mockResolvedValue({ timezone: 'UTC' } as any);
    mockAppointments();
  });

  it('leaves out cancelled and no-show appointments', async () => {
    const stats = await getDashboardStats(TENANT_ID);

    expect(stats.upcomingAppointments.map((a: any) => a.id)).toEqual(['a-scheduled', 'a-checked-in']);
  });

  it('returns the clinic timezone (country fallback for the UTC placeholder)', async () => {
    const stats = await getDashboardStats(TENANT_ID, { id: TENANT_ID, countryCode: 'PE' } as any);

    expect(stats.timeZone).toBe('America/Lima');
  });

  it('reads the customer name for the card', async () => {
    await getDashboardStats(TENANT_ID);

    const args = prismaMock.appointment.findMany.mock.calls[0][0] as any;
    expect(args.select.pet.select.customer.select.name).toBe(true);
  });
});
