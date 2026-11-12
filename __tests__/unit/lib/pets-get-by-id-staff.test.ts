/**
 * @jest-environment node
 *
 * The pet timeline shows "Atendido por" / "Aplicado por" only when the
 * records come with their staff (id and name only).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { getPetById } from '@/lib/pets';

describe('getPetById', () => {
  it('loads the staff (id and name only) of medical histories and treatment records', async () => {
    prismaMock.pet.findFirst.mockResolvedValue({ id: 'pet-1', medicalHistories: [], treatmentRecords: [] } as any);

    await getPetById('pet-1', 'tenant-1');

    const args = prismaMock.pet.findFirst.mock.calls[0][0] as any;
    expect(args.where).toEqual({ id: 'pet-1', tenantId: 'tenant-1' });
    const staffSelect = { select: { id: true, name: true } };
    expect(args.include.medicalHistories.include.staff).toEqual(staffSelect);
    expect(args.include.treatmentRecords.include.staff).toEqual(staffSelect);
  });
});
