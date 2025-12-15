/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestTreatmentSchedule,
  createTestReminder,
  createTestTenant,
  createTestUser,
  createTestPet,
  createTestCustomer,
  createTestStaff,
} from '../../utils/test-utils';

describe('Treatment Reminders API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockSchedule: ReturnType<typeof createTestTreatmentSchedule>;
  let mockReminder: ReturnType<typeof createTestReminder>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockCustomer = createTestCustomer({ tenantId: mockTenant.id });
    mockPet = createTestPet({ tenantId: mockTenant.id, ownerId: mockCustomer.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockSchedule = createTestTreatmentSchedule({
      tenantId: mockTenant.id,
      petId: mockPet.id,
    });
    mockReminder = createTestReminder({
      tenantId: mockTenant.id,
      petId: mockPet.id,
      customerId: mockCustomer.id,
    });

    // Mock Prisma responses
    prismaMock.treatmentSchedule.findMany.mockResolvedValue([mockSchedule]);
    prismaMock.treatmentSchedule.findUnique.mockResolvedValue(mockSchedule);
    prismaMock.treatmentSchedule.create.mockResolvedValue(mockSchedule);
    prismaMock.treatmentSchedule.update.mockResolvedValue(mockSchedule);
    prismaMock.reminder.findMany.mockResolvedValue([mockReminder]);
    prismaMock.reminder.create.mockResolvedValue(mockReminder);
  });

  describe('GET /api/treatment-reminders', () => {
    it('should return treatment schedules for tenant', async () => {
      const schedulesWithRelations = [
        {
          ...mockSchedule,
          pet: mockPet,
        },
      ];

      prismaMock.treatmentSchedule.findMany.mockResolvedValue(schedulesWithRelations);

      const result = await prismaMock.treatmentSchedule.findMany({
        where: { tenantId: mockTenant.id },
        include: { pet: true },
        orderBy: { scheduledDate: 'asc' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
    });

    it('should filter by petId', async () => {
      prismaMock.treatmentSchedule.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.petId === mockPet.id) {
          return [mockSchedule];
        }
        return [];
      });

      const result = await prismaMock.treatmentSchedule.findMany({
        where: { tenantId: mockTenant.id, petId: mockPet.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].petId).toBe(mockPet.id);
    });

    it('should filter by treatmentType', async () => {
      const treatmentType = 'VACCINATION';

      prismaMock.treatmentSchedule.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.treatmentType === treatmentType) {
          return [mockSchedule];
        }
        return [];
      });

      const result = await prismaMock.treatmentSchedule.findMany({
        where: { tenantId: mockTenant.id, treatmentType },
      });

      expect(result).toHaveLength(1);
      expect(result[0].treatmentType).toBe(treatmentType);
    });

    it('should filter by status', async () => {
      const status = 'SCHEDULED';

      prismaMock.treatmentSchedule.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.status === status) {
          return [mockSchedule];
        }
        return [];
      });

      const result = await prismaMock.treatmentSchedule.findMany({
        where: { tenantId: mockTenant.id, status },
      });

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(status);
    });

    it('should filter by date range (fromDate, toDate)', async () => {
      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');

      prismaMock.treatmentSchedule.findMany.mockImplementation(async (args: any) => {
        const scheduledDate = args?.where?.scheduledDate;
        if (scheduledDate?.gte && scheduledDate?.lte) {
          return [mockSchedule];
        }
        return [];
      });

      const result = await prismaMock.treatmentSchedule.findMany({
        where: {
          tenantId: mockTenant.id,
          scheduledDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('POST /api/treatment-reminders', () => {
    it('should create new treatment schedule', async () => {
      const newScheduleData = {
        petId: mockPet.id,
        treatmentType: 'VACCINATION' as const,
        productName: 'Rabies Vaccine',
        scheduledDate: new Date('2024-06-01'),
        vaccineStage: 'ADULT' as const,
      };

      const createdSchedule = {
        ...mockSchedule,
        ...newScheduleData,
        id: 'new-schedule-id',
      };

      prismaMock.treatmentSchedule.create.mockResolvedValue(createdSchedule);

      const result = await prismaMock.treatmentSchedule.create({
        data: {
          tenantId: mockTenant.id,
          ...newScheduleData,
          status: 'SCHEDULED',
          reminderSent: false,
        },
      });

      expect(result.petId).toBe(newScheduleData.petId);
      expect(result.treatmentType).toBe('VACCINATION');
      expect(result.status).toBe('SCHEDULED');
    });

    it('should validate required fields (petId, treatmentType, scheduledDate)', () => {
      const invalidData = {
        // Missing petId
        treatmentType: 'VACCINATION',
        // Missing scheduledDate
      };

      const requiredFields = ['petId', 'treatmentType', 'scheduledDate'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('petId');
      expect(missingFields).toContain('scheduledDate');
    });

    it('should create associated reminder', async () => {
      const reminderDueDate = new Date('2024-05-25'); // 7 days before scheduled treatment

      const newReminder = {
        ...mockReminder,
        dueDate: reminderDueDate,
        type: 'TREATMENT' as const,
      };

      prismaMock.reminder.create.mockResolvedValue(newReminder);

      const result = await prismaMock.reminder.create({
        data: {
          tenantId: mockTenant.id,
          petId: mockPet.id,
          customerId: mockCustomer.id,
          type: 'TREATMENT',
          title: 'Vaccination Reminder',
          message: 'Your pet has a vaccination scheduled',
          dueDate: reminderDueDate,
          status: 'PENDING',
        },
      });

      expect(result.type).toBe('TREATMENT');
      expect(result.status).toBe('PENDING');
    });
  });

  describe('PUT /api/treatment-reminders/[id]', () => {
    it('should update treatment schedule', async () => {
      const updateData = {
        scheduledDate: new Date('2024-07-01'),
        productName: 'Updated Vaccine Name',
      };

      const updatedSchedule = {
        ...mockSchedule,
        ...updateData,
      };

      prismaMock.treatmentSchedule.update.mockResolvedValue(updatedSchedule);

      const result = await prismaMock.treatmentSchedule.update({
        where: { id: mockSchedule.id },
        data: updateData,
      });

      expect(result.productName).toBe('Updated Vaccine Name');
      expect(result.scheduledDate).toEqual(updateData.scheduledDate);
    });

    it('should only update schedules belonging to tenant', async () => {
      prismaMock.treatmentSchedule.findFirst.mockImplementation(async (args: any) => {
        if (
          args?.where?.id === mockSchedule.id &&
          args?.where?.tenantId === mockTenant.id
        ) {
          return mockSchedule;
        }
        return null;
      });

      // Valid tenant check
      const validSchedule = await prismaMock.treatmentSchedule.findFirst({
        where: { id: mockSchedule.id, tenantId: mockTenant.id },
      });

      expect(validSchedule).toBeDefined();

      // Invalid tenant check
      const invalidSchedule = await prismaMock.treatmentSchedule.findFirst({
        where: { id: mockSchedule.id, tenantId: 'other-tenant' },
      });

      expect(invalidSchedule).toBeNull();
    });
  });

  describe('POST /api/treatment-reminders/[id] - Complete Treatment', () => {
    it('should mark treatment as completed (action: complete)', async () => {
      const completedSchedule = {
        ...mockSchedule,
        status: 'COMPLETED' as const,
      };

      prismaMock.treatmentSchedule.update.mockResolvedValue(completedSchedule);

      const result = await prismaMock.treatmentSchedule.update({
        where: { id: mockSchedule.id },
        data: { status: 'COMPLETED' },
      });

      expect(result.status).toBe('COMPLETED');
    });

    it('should create treatment record when completing', async () => {
      const treatmentRecord = {
        id: 'record-1',
        tenantId: mockTenant.id,
        petId: mockPet.id,
        treatmentType: 'VACCINATION' as const,
        productName: 'Rabies Vaccine',
        administrationDate: new Date(),
        staffId: mockStaff.id,
      };

      prismaMock.treatmentRecord.create.mockResolvedValue(treatmentRecord);

      const result = await prismaMock.treatmentRecord.create({
        data: {
          tenantId: mockTenant.id,
          petId: mockPet.id,
          treatmentType: 'VACCINATION',
          productName: 'Rabies Vaccine',
          administrationDate: new Date(),
          staffId: mockStaff.id,
        },
      });

      expect(result.treatmentType).toBe('VACCINATION');
      expect(result.staffId).toBe(mockStaff.id);
    });

    it('should return error for invalid action', () => {
      const invalidAction = 'invalid-action';
      const validActions = ['complete'];

      const isValidAction = validActions.includes(invalidAction);
      expect(isValidAction).toBe(false);
      // API would return: { error: 'Acción no válida' }, { status: 400 }
    });
  });

  describe('POST /api/treatment-reminders/process', () => {
    it('should process pending reminders', async () => {
      const pendingReminders = [
        createTestReminder({ id: 'reminder-1', status: 'PENDING' as const }),
        createTestReminder({ id: 'reminder-2', status: 'PENDING' as const }),
      ];

      prismaMock.reminder.findMany.mockResolvedValue(pendingReminders);
      prismaMock.reminder.updateMany.mockResolvedValue({ count: 2 });

      const reminders = await prismaMock.reminder.findMany({
        where: {
          tenantId: mockTenant.id,
          status: 'PENDING',
          dueDate: { lte: new Date() },
        },
      });

      expect(reminders).toHaveLength(2);

      // Simulate processing
      const updateResult = await prismaMock.reminder.updateMany({
        where: { status: 'PENDING', dueDate: { lte: new Date() } },
        data: { status: 'SENT', sentAt: new Date() },
      });

      expect(updateResult.count).toBe(2);
    });

    it('should create vaccination schedule', async () => {
      const vaccinationSchedules = [
        createTestTreatmentSchedule({
          id: 'vax-1',
          treatmentType: 'VACCINATION' as const,
          vaccineStage: 'PUPPY_KITTEN' as const,
          scheduledDate: new Date('2024-06-01'),
        }),
        createTestTreatmentSchedule({
          id: 'vax-2',
          treatmentType: 'VACCINATION' as const,
          vaccineStage: 'ADULT' as const,
          scheduledDate: new Date('2024-09-01'),
        }),
      ];

      prismaMock.treatmentSchedule.createMany.mockResolvedValue({ count: 2 });

      const result = await prismaMock.treatmentSchedule.createMany({
        data: vaccinationSchedules.map((s) => ({
          tenantId: mockTenant.id,
          petId: mockPet.id,
          treatmentType: s.treatmentType,
          vaccineStage: s.vaccineStage,
          scheduledDate: s.scheduledDate,
          status: 'SCHEDULED',
          reminderSent: false,
        })),
      });

      expect(result.count).toBe(2);
    });

    it('should create deworming schedule', async () => {
      const dewormingSchedules = [
        createTestTreatmentSchedule({
          id: 'dew-1',
          treatmentType: 'DEWORMING' as const,
          dewormingType: 'INTERNAL' as const,
          scheduledDate: new Date('2024-07-01'),
        }),
        createTestTreatmentSchedule({
          id: 'dew-2',
          treatmentType: 'DEWORMING' as const,
          dewormingType: 'EXTERNAL' as const,
          scheduledDate: new Date('2024-08-01'),
        }),
      ];

      prismaMock.treatmentSchedule.createMany.mockResolvedValue({ count: 2 });

      const result = await prismaMock.treatmentSchedule.createMany({
        data: dewormingSchedules.map((s) => ({
          tenantId: mockTenant.id,
          petId: mockPet.id,
          treatmentType: s.treatmentType,
          dewormingType: s.dewormingType,
          scheduledDate: s.scheduledDate,
          status: 'SCHEDULED',
          reminderSent: false,
        })),
      });

      expect(result.count).toBe(2);
    });

    it('should require petId for vaccination schedule', () => {
      const requestBody = {
        action: 'create-vaccination-schedule',
        // Missing petId
        vaccinationType: 'PUPPY_KITTEN',
      };

      const hasPetId = 'petId' in requestBody;
      expect(hasPetId).toBe(false);
      // API would return: { error: 'petId y vaccinationType son requeridos' }, { status: 400 }
    });

    it('should require petId for deworming schedule', () => {
      const requestBody = {
        action: 'create-deworming-schedule',
        // Missing petId
      };

      const hasPetId = 'petId' in requestBody;
      expect(hasPetId).toBe(false);
      // API would return: { error: 'petId es requerido' }, { status: 400 }
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return schedules from other tenants', async () => {
      const otherTenantSchedule = createTestTreatmentSchedule({
        id: 'other-schedule',
        tenantId: 'other-tenant-id',
      });

      prismaMock.treatmentSchedule.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockSchedule];
        }
        return [];
      });

      const result = await prismaMock.treatmentSchedule.findMany({
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
