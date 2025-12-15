/**
 * Unit tests for medical-history.ts
 * Tests CRUD operations, search, and statistics (excluding getMedicalHistoryStats which has its own test file)
 */

// Mock Prisma before imports
jest.mock('@/lib/prisma', () => ({
  prisma: {
    medicalHistory: {
      create: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    medicalOrder: {
      create: jest.fn(),
    },
    prescription: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@/lib/prisma';
import {
  createMedicalHistory,
  getMedicalHistoryById,
  getPetMedicalHistory,
  getRecentMedicalHistories,
  updateMedicalHistory,
  deleteMedicalHistory,
  searchMedicalHistories,
  getCommonDiagnoses,
  getCommonTreatments,
} from '@/lib/medical-history';

describe('medical-history.ts', () => {
  const testTenantId = 'tenant-test-123';
  const testStaffId = 'staff-test-456';
  const testPetId = 'pet-test-789';
  const testHistoryId = 'history-test-001';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createMedicalHistory', () => {
    const validFormData = {
      petId: testPetId,
      visitDate: '2025-01-10T10:00:00.000Z',
      reasonForVisit: 'Revisión general',
      diagnosis: 'Estado saludable',
      treatment: 'Ninguno requerido',
      notes: 'Paciente en buen estado',
    };

    const mockCreatedHistory = {
      id: testHistoryId,
      tenantId: testTenantId,
      petId: testPetId,
      staffId: testStaffId,
      visitDate: new Date('2025-01-10T10:00:00.000Z'),
      reasonForVisit: validFormData.reasonForVisit,
      diagnosis: validFormData.diagnosis,
      treatment: validFormData.treatment,
      notes: validFormData.notes,
    };

    const mockHistoryWithDetails = {
      ...mockCreatedHistory,
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez' },
      },
      medicalOrder: null,
    };

    it('should create medical history without prescriptions', async () => {
      // Mock transaction to execute the callback
      jest.mocked(prisma.$transaction).mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => {
        return callback({
          medicalHistory: {
            create: jest.fn().mockResolvedValue(mockCreatedHistory),
            update: jest.fn(),
          },
          medicalOrder: { create: jest.fn() },
          prescription: { create: jest.fn() },
        } as unknown as typeof prisma);
      });
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      const result = await createMedicalHistory(testTenantId, testStaffId, validFormData);

      expect(result).toEqual(mockHistoryWithDetails);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should create medical history with prescriptions', async () => {
      const formDataWithPrescriptions = {
        ...validFormData,
        prescriptions: [
          {
            productId: 'product-1',
            quantity: 2,
            dosage: '250mg',
            frequency: 'Cada 12 horas',
            duration: '7 días',
            instructions: 'Con alimento',
          },
        ],
      };

      const mockMedicalOrder = { id: 'order-1' };
      const mockTxMedicalHistory = { create: jest.fn().mockResolvedValue(mockCreatedHistory), update: jest.fn() };
      const mockTxMedicalOrder = { create: jest.fn().mockResolvedValue(mockMedicalOrder) };
      const mockTxPrescription = { create: jest.fn().mockResolvedValue({}) };

      jest.mocked(prisma.$transaction).mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => {
        return callback({
          medicalHistory: mockTxMedicalHistory,
          medicalOrder: mockTxMedicalOrder,
          prescription: mockTxPrescription,
        } as unknown as typeof prisma);
      });
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      await createMedicalHistory(testTenantId, testStaffId, formDataWithPrescriptions);

      // Verify medical order was created
      expect(mockTxMedicalOrder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: testTenantId,
          petId: testPetId,
          staffId: testStaffId,
          diagnosis: validFormData.diagnosis,
          status: 'PENDING',
        }),
      });

      // Verify prescription was created
      expect(mockTxPrescription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: mockMedicalOrder.id,
          productId: 'product-1',
          quantity: 2,
        }),
      });
    });

    it('should update medical history with medicalOrderId when prescriptions exist', async () => {
      const formDataWithPrescriptions = {
        ...validFormData,
        prescriptions: [{ productId: 'product-1', quantity: 1, dosage: '100mg', frequency: 'daily', duration: '5d', instructions: 'test' }],
      };

      const mockMedicalOrder = { id: 'order-123' };
      const mockTxMedicalHistory = { create: jest.fn().mockResolvedValue(mockCreatedHistory), update: jest.fn() };
      const mockTxMedicalOrder = { create: jest.fn().mockResolvedValue(mockMedicalOrder) };
      const mockTxPrescription = { create: jest.fn().mockResolvedValue({}) };

      jest.mocked(prisma.$transaction).mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => {
        return callback({
          medicalHistory: mockTxMedicalHistory,
          medicalOrder: mockTxMedicalOrder,
          prescription: mockTxPrescription,
        } as unknown as typeof prisma);
      });
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      await createMedicalHistory(testTenantId, testStaffId, formDataWithPrescriptions);

      expect(mockTxMedicalHistory.update).toHaveBeenCalledWith({
        where: { id: mockCreatedHistory.id },
        data: { medicalOrderId: mockMedicalOrder.id },
      });
    });
  });

  describe('getMedicalHistoryById', () => {
    const mockHistoryWithDetails = {
      id: testHistoryId,
      tenantId: testTenantId,
      petId: testPetId,
      visitDate: new Date('2025-01-10'),
      reasonForVisit: 'Revisión',
      diagnosis: 'Saludable',
      treatment: 'Ninguno',
      notes: 'OK',
      pet: {
        id: testPetId,
        name: 'Max',
        customer: { id: 'customer-1', name: 'Juan Pérez' },
      },
      medicalOrder: {
        id: 'order-1',
        prescriptions: [
          {
            id: 'prescription-1',
            productId: 'product-1',
            quantity: 2,
            product: { id: 'product-1', name: 'Amoxicilina' },
          },
        ],
      },
    };

    it('should return medical history with all relations', async () => {
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      const result = await getMedicalHistoryById(testTenantId, testHistoryId);

      expect(result).toEqual(mockHistoryWithDetails);
      expect(prisma.medicalHistory.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: testHistoryId, tenantId: testTenantId },
        include: {
          pet: { include: { customer: true } },
          medicalOrder: {
            include: {
              prescriptions: { include: { product: true } },
            },
          },
        },
      });
    });

    it('should throw when history not found', async () => {
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockRejectedValue(new Error('Record not found'));

      await expect(getMedicalHistoryById(testTenantId, 'non-existent-id')).rejects.toThrow();
    });
  });

  describe('getPetMedicalHistory (paginated)', () => {
    const mockHistories = [
      {
        id: 'history-1',
        visitDate: new Date('2025-01-10'),
        reasonForVisit: 'Revisión',
        pet: { id: testPetId, name: 'Max', customer: { name: 'Juan' } },
        medicalOrder: null,
      },
      {
        id: 'history-2',
        visitDate: new Date('2025-01-05'),
        reasonForVisit: 'Vacunación',
        pet: { id: testPetId, name: 'Max', customer: { name: 'Juan' } },
        medicalOrder: null,
      },
    ];

    it('should return paginated medical history for pet', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(mockHistories as never);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(15);

      const result = await getPetMedicalHistory(testTenantId, testPetId, 1, 10);

      expect(result.histories).toEqual(mockHistories);
      expect(result.total).toBe(15);
      expect(prisma.medicalHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: testTenantId, petId: testPetId },
        include: expect.any(Object),
        orderBy: { visitDate: 'desc' },
        skip: 0,
        take: 10,
      });
    });

    it('should use default pagination when not provided', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);

      await getPetMedicalHistory(testTenantId, testPetId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.skip).toBe(0);
      expect(findCall.take).toBe(10);
    });

    it('should calculate correct skip for page 2', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(25);

      await getPetMedicalHistory(testTenantId, testPetId, 2, 10);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.skip).toBe(10);
    });

    it('should calculate correct skip for page 3 with custom limit', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(50);

      await getPetMedicalHistory(testTenantId, testPetId, 3, 5);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.skip).toBe(10); // (3-1) * 5
      expect(findCall.take).toBe(5);
    });
  });

  describe('getRecentMedicalHistories', () => {
    const mockHistories = [
      { id: 'history-1', visitDate: new Date('2025-01-10'), pet: { name: 'Max' } },
      { id: 'history-2', visitDate: new Date('2025-01-09'), pet: { name: 'Luna' } },
    ];

    it('should return recent medical histories for tenant', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(mockHistories as never);

      const result = await getRecentMedicalHistories(testTenantId);

      expect(result).toEqual(mockHistories);
      expect(prisma.medicalHistory.findMany).toHaveBeenCalledWith({
        where: { tenantId: testTenantId },
        include: expect.any(Object),
        orderBy: { visitDate: 'desc' },
        take: 10,
      });
    });

    it('should respect custom limit', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);

      await getRecentMedicalHistories(testTenantId, 5);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.take).toBe(5);
    });

    it('should use default limit of 10', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);

      await getRecentMedicalHistories(testTenantId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.take).toBe(10);
    });
  });

  describe('updateMedicalHistory', () => {
    const updatedData = {
      visitDate: '2025-01-15T10:00:00.000Z',
      reasonForVisit: 'Seguimiento',
      diagnosis: 'Mejorado',
      treatment: 'Continuar medicación',
      notes: 'Evolución favorable',
    };

    const mockUpdatedHistory = {
      id: testHistoryId,
      tenantId: testTenantId,
      visitDate: new Date('2025-01-15T10:00:00.000Z'),
      reasonForVisit: updatedData.reasonForVisit,
      diagnosis: updatedData.diagnosis,
      treatment: updatedData.treatment,
      notes: updatedData.notes,
    };

    const mockHistoryWithDetails = {
      ...mockUpdatedHistory,
      pet: { id: testPetId, name: 'Max', customer: { name: 'Juan' } },
      medicalOrder: null,
    };

    it('should update medical history with all fields', async () => {
      jest.mocked(prisma.medicalHistory.update).mockResolvedValue(mockUpdatedHistory as never);
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      const result = await updateMedicalHistory(testTenantId, testHistoryId, updatedData);

      expect(result).toEqual(mockHistoryWithDetails);
      expect(prisma.medicalHistory.update).toHaveBeenCalledWith({
        where: { id: testHistoryId, tenantId: testTenantId },
        data: expect.objectContaining({
          visitDate: new Date(updatedData.visitDate),
          reasonForVisit: updatedData.reasonForVisit,
          diagnosis: updatedData.diagnosis,
          treatment: updatedData.treatment,
          notes: updatedData.notes,
        }),
      });
    });

    it('should handle partial updates', async () => {
      const partialData = { diagnosis: 'New diagnosis' };
      jest.mocked(prisma.medicalHistory.update).mockResolvedValue(mockUpdatedHistory as never);
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      await updateMedicalHistory(testTenantId, testHistoryId, partialData);

      const updateCall = jest.mocked(prisma.medicalHistory.update).mock.calls[0][0];
      expect(updateCall.data.diagnosis).toBe('New diagnosis');
      expect(updateCall.data.visitDate).toBeUndefined();
    });

    it('should not update fields with undefined values', async () => {
      const partialData = { diagnosis: 'Updated', treatment: undefined };
      jest.mocked(prisma.medicalHistory.update).mockResolvedValue(mockUpdatedHistory as never);
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue(mockHistoryWithDetails as never);

      await updateMedicalHistory(testTenantId, testHistoryId, partialData);

      const updateCall = jest.mocked(prisma.medicalHistory.update).mock.calls[0][0];
      expect('treatment' in updateCall.data).toBe(false);
    });
  });

  describe('deleteMedicalHistory', () => {
    it('should delete medical history by id and tenantId', async () => {
      jest.mocked(prisma.medicalHistory.delete).mockResolvedValue({} as never);

      await deleteMedicalHistory(testTenantId, testHistoryId);

      expect(prisma.medicalHistory.delete).toHaveBeenCalledWith({
        where: { id: testHistoryId, tenantId: testTenantId },
      });
    });

    it('should throw if history not found', async () => {
      jest.mocked(prisma.medicalHistory.delete).mockRejectedValue(new Error('Record not found'));

      await expect(deleteMedicalHistory(testTenantId, 'non-existent')).rejects.toThrow();
    });
  });

  describe('searchMedicalHistories', () => {
    const mockSearchResults = [
      {
        id: 'history-1',
        reasonForVisit: 'Gastroenteritis',
        diagnosis: 'Gastroenteritis aguda',
        pet: { name: 'Max', customer: { name: 'Juan' } },
      },
    ];

    it('should search across multiple fields', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue(mockSearchResults as never);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(1);

      const result = await searchMedicalHistories(testTenantId, 'gastro');

      expect(result.histories).toEqual(mockSearchResults);
      expect(result.total).toBe(1);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.where.OR).toBeDefined();
      expect(findCall.where.OR).toHaveLength(6); // reasonForVisit, diagnosis, treatment, notes, pet.name, pet.customer.name
    });

    it('should return empty results for short query (less than 2 chars)', async () => {
      const result = await searchMedicalHistories(testTenantId, 'a');

      expect(result.histories).toEqual([]);
      expect(result.total).toBe(0);
      expect(prisma.medicalHistory.findMany).not.toHaveBeenCalled();
    });

    it('should return empty results for empty query', async () => {
      const result = await searchMedicalHistories(testTenantId, '');

      expect(result.histories).toEqual([]);
      expect(result.total).toBe(0);
      expect(prisma.medicalHistory.findMany).not.toHaveBeenCalled();
    });

    it('should filter by petId when provided', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);

      await searchMedicalHistories(testTenantId, 'test query', testPetId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.where.petId).toBe(testPetId);
    });

    it('should use pagination parameters', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(100);

      await searchMedicalHistories(testTenantId, 'test', undefined, 3, 20);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.skip).toBe(40); // (3-1) * 20
      expect(findCall.take).toBe(20);
    });

    it('should use case-insensitive search', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);

      await searchMedicalHistories(testTenantId, 'TEST');

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      // Check that OR conditions use insensitive mode
      expect(findCall.where.OR[0].reasonForVisit.mode).toBe('insensitive');
    });
  });

  describe('getCommonDiagnoses', () => {
    const mockDiagnoses = [
      { diagnosis: 'Gastroenteritis', _count: { diagnosis: 15 } },
      { diagnosis: 'Otitis Externa', _count: { diagnosis: 10 } },
      { diagnosis: 'Dermatitis', _count: { diagnosis: 8 } },
    ];

    it('should return common diagnoses as string array', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue(mockDiagnoses as never);

      const result = await getCommonDiagnoses(testTenantId);

      expect(result).toEqual(['Gastroenteritis', 'Otitis Externa', 'Dermatitis']);
    });

    it('should use default limit of 10', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonDiagnoses(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should respect custom limit', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonDiagnoses(testTenantId, 5);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });

    it('should filter by tenantId', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonDiagnoses(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: testTenantId,
          }),
        })
      );
    });

    it('should filter out null diagnoses', async () => {
      const diagnosesWithNull = [
        { diagnosis: 'Gastroenteritis', _count: { diagnosis: 15 } },
        { diagnosis: null, _count: { diagnosis: 10 } },
        { diagnosis: 'Otitis', _count: { diagnosis: 5 } },
      ];
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue(diagnosesWithNull as never);

      const result = await getCommonDiagnoses(testTenantId);

      expect(result).toEqual(['Gastroenteritis', 'Otitis']);
      expect(result).not.toContain(null);
    });

    it('should order by frequency descending', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonDiagnoses(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            _count: { diagnosis: 'desc' },
          },
        })
      );
    });
  });

  describe('getCommonTreatments', () => {
    const mockTreatments = [
      { treatment: 'Antibióticos', _count: { treatment: 20 } },
      { treatment: 'Antiinflamatorios', _count: { treatment: 15 } },
      { treatment: 'Dieta especial', _count: { treatment: 10 } },
    ];

    it('should return common treatments as string array', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue(mockTreatments as never);

      const result = await getCommonTreatments(testTenantId);

      expect(result).toEqual(['Antibióticos', 'Antiinflamatorios', 'Dieta especial']);
    });

    it('should use default limit of 10', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonTreatments(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('should respect custom limit', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonTreatments(testTenantId, 3);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 3,
        })
      );
    });

    it('should filter by tenantId', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonTreatments(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: testTenantId,
          }),
        })
      );
    });

    it('should filter out null treatments', async () => {
      const treatmentsWithNull = [
        { treatment: 'Antibióticos', _count: { treatment: 20 } },
        { treatment: null, _count: { treatment: 15 } },
        { treatment: 'Dieta', _count: { treatment: 10 } },
      ];
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue(treatmentsWithNull as never);

      const result = await getCommonTreatments(testTenantId);

      expect(result).toEqual(['Antibióticos', 'Dieta']);
      expect(result).not.toContain(null);
    });

    it('should order by frequency descending', async () => {
      jest.mocked(prisma.medicalHistory.groupBy).mockResolvedValue([]);

      await getCommonTreatments(testTenantId);

      expect(prisma.medicalHistory.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: {
            _count: { treatment: 'desc' },
          },
        })
      );
    });
  });

  describe('Tenant Isolation', () => {
    it('should always filter by tenantId in getMedicalHistoryById', async () => {
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue({} as never);

      await getMedicalHistoryById(testTenantId, testHistoryId);

      expect(prisma.medicalHistory.findUniqueOrThrow).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: testTenantId }),
        })
      );
    });

    it('should always filter by tenantId in getPetMedicalHistory', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);

      await getPetMedicalHistory(testTenantId, testPetId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.where.tenantId).toBe(testTenantId);
    });

    it('should always filter by tenantId in getRecentMedicalHistories', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);

      await getRecentMedicalHistories(testTenantId);

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.where.tenantId).toBe(testTenantId);
    });

    it('should always filter by tenantId in updateMedicalHistory', async () => {
      jest.mocked(prisma.medicalHistory.update).mockResolvedValue({} as never);
      jest.mocked(prisma.medicalHistory.findUniqueOrThrow).mockResolvedValue({} as never);

      await updateMedicalHistory(testTenantId, testHistoryId, { diagnosis: 'test' });

      const updateCall = jest.mocked(prisma.medicalHistory.update).mock.calls[0][0];
      expect(updateCall.where.tenantId).toBe(testTenantId);
    });

    it('should always filter by tenantId in deleteMedicalHistory', async () => {
      jest.mocked(prisma.medicalHistory.delete).mockResolvedValue({} as never);

      await deleteMedicalHistory(testTenantId, testHistoryId);

      expect(prisma.medicalHistory.delete).toHaveBeenCalledWith({
        where: expect.objectContaining({ tenantId: testTenantId }),
      });
    });

    it('should always filter by tenantId in searchMedicalHistories', async () => {
      jest.mocked(prisma.medicalHistory.findMany).mockResolvedValue([]);
      jest.mocked(prisma.medicalHistory.count).mockResolvedValue(0);

      await searchMedicalHistories(testTenantId, 'test query');

      const findCall = jest.mocked(prisma.medicalHistory.findMany).mock.calls[0][0];
      expect(findCall.where.tenantId).toBe(testTenantId);
    });
  });
});
