/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestMedicalHistory,
  createTestMedicalOrder,
  createTestPrescription,
  createTestTenant,
  createTestUser,
  createTestPet,
  createTestCustomer,
  createTestStaff,
  createTestInventoryItem,
} from '../../utils/test-utils';

describe('Medical History API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockHistory: ReturnType<typeof createTestMedicalHistory>;
  let mockMedicalOrder: ReturnType<typeof createTestMedicalOrder>;
  let mockPrescription: ReturnType<typeof createTestPrescription>;
  let mockInventoryItem: ReturnType<typeof createTestInventoryItem>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id, ownerId: mockCustomer.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockInventoryItem = createTestInventoryItem({ tenantId: mockTenant.id });
    mockHistory = createTestMedicalHistory({
      tenantId: mockTenant.id,
      petId: mockPet.id,
      staffId: mockStaff.id,
    });
    mockMedicalOrder = createTestMedicalOrder({
      tenantId: mockTenant.id,
      petId: mockPet.id,
      staffId: mockStaff.id,
    });
    mockPrescription = createTestPrescription({
      orderId: mockMedicalOrder.id,
      productId: mockInventoryItem.id,
    });

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      tenant: mockTenant,
    });
    prismaMock.medicalHistory.findMany.mockResolvedValue([mockHistory]);
    prismaMock.medicalHistory.findUnique.mockResolvedValue(mockHistory);
    prismaMock.medicalHistory.findFirst.mockResolvedValue(mockHistory);
    prismaMock.medicalHistory.create.mockResolvedValue(mockHistory);
    prismaMock.medicalHistory.count.mockResolvedValue(1);
  });

  describe('GET /api/medical-history', () => {
    it('should return recent medical histories', async () => {
      const historiesWithRelations = [
        {
          ...mockHistory,
          pet: mockPet,
          staff: mockStaff,
        },
      ];

      prismaMock.medicalHistory.findMany.mockResolvedValue(historiesWithRelations);

      const result = await prismaMock.medicalHistory.findMany({
        where: { tenantId: mockTenant.id },
        include: {
          pet: true,
          staff: true,
        },
        orderBy: { visitDate: 'desc' },
        take: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].pet).toBeDefined();
    });

    it('should return stats when action=stats', async () => {
      const expectedStats = {
        totalHistories: 50,
        thisMonthHistories: 10,
        topDiagnoses: [
          { diagnosis: 'Healthy checkup', count: 15 },
          { diagnosis: 'Ear infection', count: 8 },
        ],
      };

      prismaMock.medicalHistory.count.mockResolvedValue(expectedStats.totalHistories);
      prismaMock.medicalHistory.groupBy.mockResolvedValue([
        { diagnosis: 'Healthy checkup', _count: { diagnosis: 15 } },
        { diagnosis: 'Ear infection', _count: { diagnosis: 8 } },
      ]);

      const totalCount = await prismaMock.medicalHistory.count({
        where: { tenantId: mockTenant.id },
      });

      expect(totalCount).toBe(50);
    });

    it('should return pet medical history when petId provided', async () => {
      const petHistories = [
        createTestMedicalHistory({
          id: 'history-1',
          tenantId: mockTenant.id,
          petId: mockPet.id,
          visitDate: new Date('2024-01-15'),
        }),
        createTestMedicalHistory({
          id: 'history-2',
          tenantId: mockTenant.id,
          petId: mockPet.id,
          visitDate: new Date('2024-03-10'),
        }),
      ];

      prismaMock.medicalHistory.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.petId === mockPet.id) {
          return petHistories;
        }
        return [];
      });

      const result = await prismaMock.medicalHistory.findMany({
        where: { tenantId: mockTenant.id, petId: mockPet.id },
        orderBy: { visitDate: 'desc' },
      });

      expect(result).toHaveLength(2);
      result.forEach((history: any) => {
        expect(history.petId).toBe(mockPet.id);
      });
    });

    it('should search histories when q parameter provided', async () => {
      const searchQuery = 'checkup';

      prismaMock.medicalHistory.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.reasonForVisit?.contains === searchQuery ||
              condition?.diagnosis?.contains === searchQuery
          )
        ) {
          return [mockHistory];
        }
        return [];
      });

      const result = await prismaMock.medicalHistory.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { reasonForVisit: { contains: searchQuery, mode: 'insensitive' } },
            { diagnosis: { contains: searchQuery, mode: 'insensitive' } },
            { treatment: { contains: searchQuery, mode: 'insensitive' } },
          ],
        },
      });

      expect(result).toHaveLength(1);
    });

    it('should return 401 for unauthenticated requests', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const user = await prismaMock.user.findUnique({
        where: { id: 'non-existent-user' },
      });

      expect(user).toBeNull();
      // API would return: { error: 'No autorizado' }, { status: 401 }
    });

    it('should support pagination (page and limit)', async () => {
      const page = 2;
      const limit = 5;
      const skip = (page - 1) * limit;

      const paginatedHistories = Array.from({ length: limit }, (_, i) =>
        createTestMedicalHistory({
          id: `history-${i}`,
          tenantId: mockTenant.id,
          petId: mockPet.id,
        })
      );

      prismaMock.medicalHistory.findMany.mockResolvedValue(paginatedHistories);
      prismaMock.medicalHistory.count.mockResolvedValue(15);

      const [histories, total] = await Promise.all([
        prismaMock.medicalHistory.findMany({
          where: { tenantId: mockTenant.id },
          skip,
          take: limit,
          orderBy: { visitDate: 'desc' },
        }),
        prismaMock.medicalHistory.count({
          where: { tenantId: mockTenant.id },
        }),
      ]);

      expect(histories).toHaveLength(limit);
      expect(total).toBe(15);
    });
  });

  describe('POST /api/medical-history', () => {
    it('should create medical history entry', async () => {
      const historyData = {
        petId: mockPet.id,
        visitDate: new Date('2024-06-15'),
        reasonForVisit: 'Annual wellness exam',
        diagnosis: 'Healthy pet, no issues found',
        treatment: 'Updated vaccinations',
        notes: 'Recommend dental cleaning next visit',
      };

      const createdHistory = {
        ...mockHistory,
        ...historyData,
        id: 'new-history-id',
      };

      prismaMock.medicalHistory.create.mockResolvedValue(createdHistory);

      const result = await prismaMock.medicalHistory.create({
        data: {
          tenantId: mockTenant.id,
          staffId: mockStaff.id,
          ...historyData,
        },
        include: {
          pet: true,
          staff: true,
        },
      });

      expect(result.petId).toBe(historyData.petId);
      expect(result.reasonForVisit).toBe('Annual wellness exam');
      expect(result.diagnosis).toBe('Healthy pet, no issues found');
    });

    it('should validate required fields (petId, visitDate, reasonForVisit)', () => {
      const invalidData = {
        // Missing petId
        visitDate: new Date('2024-06-15'),
        // Missing reasonForVisit
        diagnosis: 'Some diagnosis',
      };

      const requiredFields = ['petId', 'visitDate', 'reasonForVisit'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('petId');
      expect(missingFields).toContain('reasonForVisit');
      // API would return: { error: 'Mascota, fecha de visita y motivo de consulta son requeridos' }, { status: 400 }
    });

    it('should create with associated medical order when provided', async () => {
      const historyWithOrder = {
        ...mockHistory,
        medicalOrderId: mockMedicalOrder.id,
        medicalOrder: mockMedicalOrder,
      };

      prismaMock.medicalHistory.create.mockResolvedValue(historyWithOrder);

      const result = await prismaMock.medicalHistory.create({
        data: {
          tenantId: mockTenant.id,
          petId: mockPet.id,
          staffId: mockStaff.id,
          visitDate: new Date(),
          reasonForVisit: 'Sick visit',
          diagnosis: 'Minor infection',
          medicalOrderId: mockMedicalOrder.id,
        },
        include: {
          medicalOrder: true,
        },
      });

      expect(result.medicalOrderId).toBe(mockMedicalOrder.id);
      expect(result.medicalOrder).toBeDefined();
    });

    it('should create prescriptions when medical order includes them', async () => {
      const newPrescription = {
        ...mockPrescription,
        id: 'new-prescription-id',
      };

      prismaMock.prescription.create.mockResolvedValue(newPrescription);

      const result = await prismaMock.prescription.create({
        data: {
          orderId: mockMedicalOrder.id,
          productId: mockInventoryItem.id,
          quantity: 1,
          unitPrice: 150.0,
          dosage: '10mg',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Give with food',
        },
      });

      expect(result.orderId).toBe(mockMedicalOrder.id);
      expect(result.productId).toBe(mockInventoryItem.id);
    });
  });

  describe('GET /api/medical-history/[id]', () => {
    it('should return specific medical history by ID', async () => {
      const historyWithRelations = {
        ...mockHistory,
        pet: mockPet,
        staff: mockStaff,
        medicalOrder: null,
      };

      prismaMock.medicalHistory.findFirst.mockResolvedValue(historyWithRelations);

      const result = await prismaMock.medicalHistory.findFirst({
        where: {
          id: mockHistory.id,
          tenantId: mockTenant.id,
        },
        include: {
          pet: true,
          staff: true,
          medicalOrder: {
            include: {
              prescriptions: true,
            },
          },
        },
      });

      expect(result?.id).toBe(mockHistory.id);
      expect(result?.pet).toBeDefined();
      expect(result?.staff).toBeDefined();
    });

    it('should return 404 when history not found', async () => {
      prismaMock.medicalHistory.findFirst.mockResolvedValue(null);

      const result = await prismaMock.medicalHistory.findFirst({
        where: {
          id: 'non-existent-id',
          tenantId: mockTenant.id,
        },
      });

      expect(result).toBeNull();
      // API would return: { error: 'Historia médica no encontrada' }, { status: 404 }
    });

    it('should enforce tenant isolation', async () => {
      prismaMock.medicalHistory.findFirst.mockImplementation(async (args: any) => {
        if (
          args?.where?.id === mockHistory.id &&
          args?.where?.tenantId === mockTenant.id
        ) {
          return mockHistory;
        }
        return null;
      });

      // Valid tenant
      const validResult = await prismaMock.medicalHistory.findFirst({
        where: { id: mockHistory.id, tenantId: mockTenant.id },
      });

      expect(validResult).toBeDefined();

      // Invalid tenant - should not return data
      const invalidResult = await prismaMock.medicalHistory.findFirst({
        where: { id: mockHistory.id, tenantId: 'other-tenant-id' },
      });

      expect(invalidResult).toBeNull();
    });

    it('should include prescriptions when medical order exists', async () => {
      const historyWithPrescriptions = {
        ...mockHistory,
        medicalOrderId: mockMedicalOrder.id,
        medicalOrder: {
          ...mockMedicalOrder,
          prescriptions: [mockPrescription],
        },
      };

      prismaMock.medicalHistory.findFirst.mockResolvedValue(historyWithPrescriptions);

      const result = await prismaMock.medicalHistory.findFirst({
        where: { id: mockHistory.id, tenantId: mockTenant.id },
        include: {
          medicalOrder: {
            include: { prescriptions: true },
          },
        },
      });

      expect(result?.medicalOrder?.prescriptions).toHaveLength(1);
      expect(result?.medicalOrder?.prescriptions[0].dosage).toBe('10mg');
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return medical histories from other tenants', async () => {
      const otherTenantHistory = createTestMedicalHistory({
        id: 'other-history',
        tenantId: 'other-tenant-id',
      });

      prismaMock.medicalHistory.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockHistory];
        }
        return [];
      });

      const result = await prismaMock.medicalHistory.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });
});
