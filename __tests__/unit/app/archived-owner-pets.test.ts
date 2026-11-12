/**
 * @jest-environment node
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

// Pets of archived customers (isActive = false) kept showing up in the home
// "recent pets" card and in the appointment pet/owner selectors. They must be
// hidden there, while an existing appointment for such a pet still shows its
// own owner and pet. See docs/PENDIENTES.md ("Siguiente tanda").

import { prismaMock } from '../../mocks/prisma';

jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({ getUser: async () => ({ id: 'kinde-1' }) }),
}));

jest.mock('@/lib/auth', () => ({
  ...jest.requireActual('@/lib/auth'),
  requireAuth: jest.fn(),
}));

jest.mock('@/app/dashboard/appointments/new/NewAppointmentClient', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/app/dashboard/appointments/[id]/AppointmentDetailClient', () => ({
  __esModule: true,
  default: () => null,
}));

import { requireAuth } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboard';
import NewAppointmentPage from '@/app/dashboard/appointments/new/page';
import AppointmentDetailPage from '@/app/dashboard/appointments/[id]/page';

const TENANT_ID = 'tenant-1';

beforeEach(() => {
  (requireAuth as jest.Mock).mockResolvedValue({ tenant: { id: TENANT_ID }, user: { id: 'u1' } });
  prismaMock.pet.findMany.mockResolvedValue([]);
  prismaMock.pet.count.mockResolvedValue(0);
  prismaMock.customer.findMany.mockResolvedValue([]);
  prismaMock.staff.findMany.mockResolvedValue([]);
  prismaMock.appointment.findMany.mockResolvedValue([]);
  prismaMock.appointment.count.mockResolvedValue(0);
  prismaMock.tenantSettings.findUnique.mockResolvedValue({ timezone: 'UTC' } as any);
});

const petWhere = () => prismaMock.pet.findMany.mock.calls[0][0]?.where as any;
const customerWhere = () => prismaMock.customer.findMany.mock.calls[0][0]?.where as any;

describe('home dashboard', () => {
  it('leaves archived owners out of recent pets and the pet total', async () => {
    await getDashboardStats(TENANT_ID);

    expect(petWhere()).toEqual({ tenantId: TENANT_ID, customer: { isActive: true } });
    expect(prismaMock.pet.count.mock.calls[0][0]?.where).toEqual({
      tenantId: TENANT_ID,
      customer: { isActive: true },
    });
  });
});

describe('new appointment selectors', () => {
  it('only offers active owners and their pets', async () => {
    await NewAppointmentPage();

    expect(customerWhere()).toEqual({ tenantId: TENANT_ID, isActive: true });
    expect(petWhere()).toEqual({ tenantId: TENANT_ID, customer: { isActive: true } });
  });
});

describe('appointment detail selectors', () => {
  it('offers active owners plus the appointment own owner and pet', async () => {
    prismaMock.appointment.findFirst.mockResolvedValue({
      id: 'appt-1',
      tenantId: TENANT_ID,
      customerId: 'archived-customer',
      petId: 'archived-pet',
      dateTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await AppointmentDetailPage({ params: Promise.resolve({ id: 'appt-1' }) });

    expect(customerWhere()).toEqual({
      tenantId: TENANT_ID,
      OR: [{ isActive: true }, { id: 'archived-customer' }],
    });
    expect(petWhere()).toEqual({
      tenantId: TENANT_ID,
      OR: [{ customer: { isActive: true } }, { id: 'archived-pet' }],
    });
  });
});
