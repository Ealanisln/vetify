/**
 * Unit tests for getMedicalHistoryStats function
 * Tests data contract, calculations, and edge cases
 */

// Mock Prisma before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    medicalHistory: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
  },
}));

import { getMedicalHistoryStats } from '@/lib/medical-history';
import { prisma } from '@/lib/prisma';

describe('getMedicalHistoryStats', () => {
  const testTenantId = 'tenant-test-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Empty Database', () => {
    it('should return all zeros when no medical histories exist', async () => {
      // Mock empty database
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats).toEqual({
        totalHistories: 0,
        thisMonth: 0,
        avgVisitsPerPet: 0,
        commonDiagnoses: [],
      });
    });

    it('should handle division by zero when no pets exist', async () => {
      // Mock scenario: consultations exist but no pets (edge case)
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5) // thisMonth
        .mockResolvedValueOnce(10); // total
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]); // No pets
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats.avgVisitsPerPet).toBe(0);
      expect(stats.totalHistories).toBe(10);
    });
  });

  describe('Data Contract Compliance', () => {
    it('should return correct structure with all required fields', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(3) // thisMonth
        .mockResolvedValueOnce(10); // total
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
        { petId: 'pet2' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: 'Gastroenteritis', _count: { diagnosis: 5 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // Verify all required fields exist
      expect(stats).toHaveProperty('totalHistories');
      expect(stats).toHaveProperty('thisMonth');
      expect(stats).toHaveProperty('avgVisitsPerPet');
      expect(stats).toHaveProperty('commonDiagnoses');

      // Verify correct types
      expect(typeof stats.totalHistories).toBe('number');
      expect(typeof stats.thisMonth).toBe('number');
      expect(typeof stats.avgVisitsPerPet).toBe('number');
      expect(Array.isArray(stats.commonDiagnoses)).toBe(true);
    });

    it('should rename "total" to "totalHistories" for clarity', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(20);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // Should have totalHistories, not "total"
      expect(stats).toHaveProperty('totalHistories');
      expect(stats).not.toHaveProperty('total');
      expect(stats.totalHistories).toBe(20);
    });

    it('should transform commonDiagnoses to string array', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: 'Gastroenteritis', _count: { diagnosis: 8 } },
        { diagnosis: 'Otitis Externa', _count: { diagnosis: 5 } },
        { diagnosis: 'Dermatitis', _count: { diagnosis: 3 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // Should be string array, not objects
      expect(stats.commonDiagnoses).toEqual([
        'Gastroenteritis',
        'Otitis Externa',
        'Dermatitis',
      ]);

      // Verify each element is a string
      stats.commonDiagnoses.forEach((diagnosis) => {
        expect(typeof diagnosis).toBe('string');
      });
    });
  });

  describe('avgVisitsPerPet Calculation', () => {
    it('should calculate correct average with multiple pets', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(8) // thisMonth
        .mockResolvedValueOnce(20); // total consultations
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
        { petId: 'pet2' },
        { petId: 'pet3' },
        { petId: 'pet4' },
        { petId: 'pet5' },
      ]); // 5 unique pets
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // 20 consultations / 5 pets = 4.0
      expect(stats.avgVisitsPerPet).toBe(4.0);
    });

    it('should handle decimal averages correctly', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(17); // 17 consultations
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
        { petId: 'pet2' },
        { petId: 'pet3' },
      ]); // 3 unique pets
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // 17 / 3 = 5.666...
      expect(stats.avgVisitsPerPet).toBeCloseTo(5.67, 2);
    });

    it('should return 0 when no pets have medical history', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]); // No pets
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats.avgVisitsPerPet).toBe(0);
    });

    it('should handle single pet with multiple visits', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(10);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]); // 1 unique pet
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // 10 consultations / 1 pet = 10.0
      expect(stats.avgVisitsPerPet).toBe(10.0);
    });
  });

  describe('Null Diagnosis Filtering', () => {
    it('should filter out null diagnoses', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(15);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: 'Gastroenteritis', _count: { diagnosis: 5 } },
        { diagnosis: null, _count: { diagnosis: 3 } }, // Should be filtered
        { diagnosis: 'Otitis Externa', _count: { diagnosis: 2 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // Should only include non-null diagnoses
      expect(stats.commonDiagnoses).toEqual([
        'Gastroenteritis',
        'Otitis Externa',
      ]);
      expect(stats.commonDiagnoses).not.toContain(null);
    });

    it('should return empty array when all diagnoses are null', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: null, _count: { diagnosis: 5 } },
        { diagnosis: null, _count: { diagnosis: 3 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats.commonDiagnoses).toEqual([]);
    });
  });

  describe('Month Filtering', () => {
    it('should correctly filter consultations for current month', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(8) // thisMonth
        .mockResolvedValueOnce(50); // total
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats.thisMonth).toBe(8);
      expect(stats.totalHistories).toBe(50);

      // Verify count was called with correct date filters
      expect(jest.mocked(prisma.medicalHistory.count)).toHaveBeenCalledTimes(2);

      // First call should have date range for current month
      const firstCall = jest.mocked(prisma.medicalHistory.count).mock.calls[0][0];
      expect(firstCall.where.visitDate).toHaveProperty('gte');
      expect(firstCall.where.visitDate).toHaveProperty('lt');
    });
  });

  describe('Common Diagnoses Ordering', () => {
    it('should return diagnoses in frequency order', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(30);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: 'Most Common', _count: { diagnosis: 15 } },
        { diagnosis: 'Second Common', _count: { diagnosis: 8 } },
        { diagnosis: 'Third Common', _count: { diagnosis: 5 } },
        { diagnosis: 'Fourth Common', _count: { diagnosis: 2 } },
        { diagnosis: 'Fifth Common', _count: { diagnosis: 1 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      // Should maintain order from groupBy query
      expect(stats.commonDiagnoses).toEqual([
        'Most Common',
        'Second Common',
        'Third Common',
        'Fourth Common',
        'Fifth Common',
      ]);
    });

    it('should limit to top 5 diagnoses', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(50);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);

      // Return 5 diagnoses (groupBy query has take: 5)
      const fiveDiagnoses = [
        { diagnosis: 'Diagnosis 1', _count: { diagnosis: 10 } },
        { diagnosis: 'Diagnosis 2', _count: { diagnosis: 8 } },
        { diagnosis: 'Diagnosis 3', _count: { diagnosis: 6 } },
        { diagnosis: 'Diagnosis 4', _count: { diagnosis: 4 } },
        { diagnosis: 'Diagnosis 5', _count: { diagnosis: 2 } },
      ];
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue(fiveDiagnoses);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats.commonDiagnoses).toHaveLength(5);

      // Verify groupBy was called with take: 5
      expect(jest.mocked(prisma.medicalHistory.groupBy)).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe('Real-World Scenario', () => {
    it('should handle realistic clinic data correctly', async () => {
      // Realistic scenario:
      // - Clinic has been operating for several months
      // - 80 total consultations
      // - 12 consultations this month
      // - 47 unique pets (80/47 = ~1.7 avg visits per pet)
      // - Top 5 common diagnoses

      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(12) // thisMonth
        .mockResolvedValueOnce(80); // total

      // 47 unique pets
      const uniquePets = Array.from({ length: 47 }, (_, i) => ({
        petId: `pet-${i + 1}`,
      }));
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(uniquePets);

      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([
        { diagnosis: 'Gastroenteritis', _count: { diagnosis: 15 } },
        { diagnosis: 'Otitis Externa', _count: { diagnosis: 12 } },
        { diagnosis: 'Dermatitis Alérgica', _count: { diagnosis: 8 } },
        { diagnosis: 'Infección Urinaria', _count: { diagnosis: 6 } },
        { diagnosis: 'Parásitos Intestinales', _count: { diagnosis: 5 } },
      ]);

      const stats = await getMedicalHistoryStats(testTenantId);

      expect(stats).toEqual({
        totalHistories: 80,
        thisMonth: 12,
        avgVisitsPerPet: expect.closeTo(1.7, 1),
        commonDiagnoses: [
          'Gastroenteritis',
          'Otitis Externa',
          'Dermatitis Alérgica',
          'Infección Urinaria',
          'Parásitos Intestinales',
        ],
      });
    });
  });

  describe('Tenant Isolation', () => {
    it('should always filter by tenantId', async () => {
      jest.mocked(prisma.medicalHistory.count)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(10);
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([
        { petId: 'pet1' },
      ]);
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getMedicalHistoryStats(testTenantId);

      // Verify all Prisma calls include tenantId
      expect(jest.mocked(prisma.medicalHistory.count)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: testTenantId }),
        })
      );

      expect(jest.mocked(prisma.medicalHistory.findMany)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: testTenantId }),
        })
      );

      expect(jest.mocked(prisma.medicalHistory.groupBy)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: testTenantId }),
        })
      );
    });
  });
});
