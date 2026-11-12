/**
 * @jest-environment node
 *
 * Vital signs: no fake "N/A" diagnosis, the pet's weight is updated, decimal
 * weights are accepted, errors are in Spanish, and the entries do not count
 * as consultations or diagnoses in the medical history stats.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { recordVitalSigns } from '@/lib/medical';
import { getMedicalHistoryStats } from '@/lib/medical-history';
import { vitalSignsSchema } from '@/lib/medical-validation';

const vitals = {
  weight: 2.35,
  temperature: 38.5,
  heart_rate: 120,
  respiratory_rate: 24,
  recorded_date: new Date('2026-11-12T16:00:00Z'),
};

describe('recordVitalSigns', () => {
  beforeEach(() => {
    prismaMock.$transaction.mockImplementation((async (fn: any) => fn(prismaMock)) as any);
    prismaMock.medicalHistory.create.mockImplementation((async ({ data }: any) => ({ id: 'h-1', ...data })) as any);
    prismaMock.pet.updateMany.mockResolvedValue({ count: 1 } as any);
  });

  it('does not store a fake diagnosis or treatment', async () => {
    await recordVitalSigns('pet-1', 'tenant-1', vitals);

    const data = prismaMock.medicalHistory.create.mock.calls[0][0].data as any;
    expect(data.diagnosis).toBeNull();
    expect(data.treatment).toBeNull();
    expect(data.notes).toContain('Peso: 2.35 kg');
  });

  it("updates the pet's weight (tenant-scoped)", async () => {
    await recordVitalSigns('pet-1', 'tenant-1', vitals);

    expect(prismaMock.pet.updateMany).toHaveBeenCalledWith({
      where: { id: 'pet-1', tenantId: 'tenant-1' },
      data: { weight: 2.35, weightUnit: 'kg' },
    });
  });
});

describe('vitalSignsSchema', () => {
  it('accepts a weight with two decimals', () => {
    expect(vitalSignsSchema.parse(vitals).weight).toBe(2.35);
  });

  it('answers in Spanish when a number is missing', () => {
    const result = vitalSignsSchema.safeParse({ ...vitals, weight: NaN, temperature: NaN });
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toEqual(expect.arrayContaining(['Ingresa el peso', 'Ingresa la temperatura']));
    expect(messages.join(' ')).not.toMatch(/Expected number/);
  });
});

describe('getMedicalHistoryStats', () => {
  it('leaves vital-signs entries out of consultations and diagnoses', async () => {
    const rows = [
      { petId: 'p1', reasonForVisit: 'Vómito', diagnosis: 'Gastritis', visitDate: new Date() },
      { petId: 'p1', reasonForVisit: 'Registro de Signos Vitales', diagnosis: 'N/A', visitDate: new Date() },
      { petId: 'p2', reasonForVisit: 'Registro de Signos Vitales', diagnosis: 'N/A', visitDate: new Date() },
    ];
    const apply = (where: any) =>
      rows.filter(
        (r) =>
          (!where?.reasonForVisit?.not || r.reasonForVisit !== where.reasonForVisit.not) &&
          (where?.diagnosis?.not !== null || r.diagnosis !== null)
      );
    prismaMock.medicalHistory.count.mockImplementation((async ({ where }: any) => apply(where).length) as any);
    (prismaMock.medicalHistory.groupBy as unknown as jest.Mock).mockImplementation(async ({ by, where }: any) => {
      const filtered = apply(where);
      if (by[0] === 'petId') return [...new Set(filtered.map((r) => r.petId))].map((petId) => ({ petId }));
      const counts = new Map<string, number>();
      filtered.forEach((r) => counts.set(r.diagnosis, (counts.get(r.diagnosis) ?? 0) + 1));
      return [...counts].map(([diagnosis, n]) => ({ diagnosis, _count: { diagnosis: n } }));
    });

    const stats = await getMedicalHistoryStats('tenant-1');

    expect(stats.totalHistories).toBe(1);
    expect(stats.thisMonth).toBe(1);
    expect(stats.commonDiagnoses).toEqual(['Gastritis']);
  });
});
