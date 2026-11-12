/**
 * @jest-environment node
 *
 * POST /api/medical-history (used by /dashboard/medical-history/new) must
 * store a real Staff id, read the visit date in the clinic timezone and never
 * send an empty productId to the Prescription foreign key.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';

const getUser = jest.fn();
jest.mock('@kinde-oss/kinde-auth-nextjs/server', () => ({
  getKindeServerSession: () => ({ getUser }),
}));

import { POST } from '@/app/api/medical-history/route';

function request(body: unknown) {
  return { json: () => Promise.resolve(body) } as any;
}

const tenant = { id: 'tenant-1', countryCode: 'MX', tenantSettings: null };

describe('POST /api/medical-history', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getUser.mockResolvedValue({ id: 'kinde_user_1' });
    prismaMock.user.findUnique.mockResolvedValue({ id: 'kinde_user_1', tenant } as any);
    prismaMock.tenant.findUnique.mockResolvedValue(tenant as any);
    prismaMock.staff.findFirst.mockResolvedValue({ id: 'staff-uuid-1' } as any);
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);
    prismaMock.medicalHistory.create.mockImplementation((async ({ data }: any) => ({ id: 'history-1', ...data })) as any);
    prismaMock.medicalOrder.create.mockImplementation((async ({ data }: any) => ({ id: 'order-1', ...data })) as any);
    prismaMock.medicalHistory.findUniqueOrThrow.mockResolvedValue({ id: 'history-1' } as any);
  });

  afterEach(() => errorSpy.mockRestore());

  const base = {
    petId: 'pet-1',
    visitDate: '2026-11-10T10:30',
    reasonForVisit: 'Control rutinario',
    diagnosis: 'Sano',
    treatment: '',
    notes: 'Sin novedades',
  };

  it("stores the user's Staff.id, not the Kinde user id", async () => {
    const res = await POST(request({ ...base, prescriptions: [] }));

    expect(res.status).toBe(201);
    expect(prismaMock.staff.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'kinde_user_1', tenantId: 'tenant-1' }) })
    );
    const data = prismaMock.medicalHistory.create.mock.calls[0][0].data as any;
    expect(data.staffId).toBe('staff-uuid-1');
  });

  it('stores no staff when the user has no staff record (instead of a broken FK)', async () => {
    prismaMock.staff.findFirst.mockResolvedValue(null);

    const res = await POST(request({ ...base, prescriptions: [] }));

    expect(res.status).toBe(201);
    const data = prismaMock.medicalHistory.create.mock.calls[0][0].data as any;
    expect(data.staffId).toBeNull();
  });

  it('reads a datetime-local visit date in the clinic timezone, not the server one', async () => {
    // A clinic in Bogotá (UTC-5), so the result differs from both UTC and the dev machine zone
    prismaMock.tenant.findUnique.mockResolvedValue({ ...tenant, countryCode: 'CO' } as any);

    await POST(request({ ...base, prescriptions: [] }));

    const data = prismaMock.medicalHistory.create.mock.calls[0][0].data as any;
    expect(data.visitDate.toISOString()).toBe('2026-11-10T15:30:00.000Z');
  });

  it('rejects an invalid visit date', async () => {
    const res = await POST(request({ ...base, visitDate: 'ayer', prescriptions: [] }));
    expect(res.status).toBe(400);
    expect(prismaMock.medicalHistory.create).not.toHaveBeenCalled();
  });

  it('keeps free-text prescriptions in the notes instead of sending an empty productId', async () => {
    const res = await POST(
      request({
        ...base,
        prescriptions: [
          {
            productName: 'Amoxicilina',
            quantity: 1,
            dosage: '1 tableta',
            frequency: 'Cada 12 horas',
            duration: '7 días',
            instructions: 'Con alimento',
          },
        ],
      })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.prescription.create).not.toHaveBeenCalled();
    expect(prismaMock.medicalOrder.create).not.toHaveBeenCalled();
    const data = prismaMock.medicalHistory.create.mock.calls[0][0].data as any;
    expect(data.notes).toContain('Sin novedades');
    expect(data.notes).toContain('Amoxicilina');
    expect(data.notes).toContain('Cada 12 horas');
  });

  it('creates the medical order with the Staff.id for inventory products of the clinic', async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([{ id: 'product-1', name: 'Amoxicilina 500' }] as any);

    const res = await POST(
      request({ ...base, prescriptions: [{ productId: 'product-1', quantity: 2, dosage: '1 tableta' }] })
    );

    expect(res.status).toBe(201);
    expect(prismaMock.inventoryItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) })
    );
    expect((prismaMock.medicalOrder.create.mock.calls[0][0].data as any).staffId).toBe('staff-uuid-1');
    expect((prismaMock.prescription.create.mock.calls[0][0].data as any).productId).toBe('product-1');
  });

  it('rejects a productId that is not in the clinic inventory', async () => {
    prismaMock.inventoryItem.findMany.mockResolvedValue([]);

    const res = await POST(request({ ...base, prescriptions: [{ productId: 'other-tenant-product', quantity: 1 }] }));

    expect(res.status).toBe(400);
    expect(prismaMock.medicalHistory.create).not.toHaveBeenCalled();
  });
});
