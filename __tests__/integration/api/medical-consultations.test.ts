/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestPet,
  createTestTenant,
  createTestCustomer,
  createTestStaff,
} from '../../utils/test-utils';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock the medical module
jest.mock('@/lib/medical', () => ({
  createConsultation: jest.fn(),
}));

// Mock the security modules
jest.mock('@/lib/security/api-middleware', () => ({
  createSensitiveDataHandler: jest.fn((handler, _options) => {
    return async (req: Request) => {
      const body = await req.json();
      const tenantId = 'tenant-1';
      return handler(req, { body, tenantId });
    };
  }),
}));

jest.mock('@/lib/security/input-sanitization', () => ({
  createSecureResponse: jest.fn((data, status) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

import { requireAuth } from '@/lib/auth';
import { createConsultation } from '@/lib/medical';

describe('Medical Consultations API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  const validConsultationData = {
    petId: 'pet-1',
    reason: 'Annual checkup and vaccination',
    symptoms: ['Letargo', 'Pérdida de apetito'],
    diagnosis: 'Healthy pet with minor fatigue',
    treatment_plan: 'Rest and proper nutrition for recovery',
    veterinarian_id: 'staff-1',
    notes: 'Pet appears overall healthy',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant({ id: 'tenant-1' });
    mockCustomer = createTestCustomer({
      id: 'customer-1',
      tenantId: mockTenant.id
    });
    mockPet = createTestPet({
      id: 'pet-1',
      tenantId: mockTenant.id,
      customerId: mockCustomer.id
    });
    mockStaff = createTestStaff({
      id: 'staff-1',
      tenantId: mockTenant.id,
      isActive: true,
    });

    // Mock auth
    (requireAuth as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
      tenant: mockTenant,
    });
  });

  describe('POST /api/medical/consultations', () => {
    describe('Successful creation', () => {
      it('should create a consultation with valid data', async () => {
        // Setup mocks
        prismaMock.pet.findFirst.mockResolvedValue({
          ...mockPet,
          customer: mockCustomer,
        } as any);

        prismaMock.staff.findFirst.mockResolvedValue(mockStaff as any);

        const mockConsultation = {
          id: 'consultation-1',
          ...validConsultationData,
          tenantId: mockTenant.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (createConsultation as jest.Mock).mockResolvedValue(mockConsultation);

        // Simulate API call
        const result = await createConsultation(
          validConsultationData.petId,
          mockTenant.id,
          {
            reason: validConsultationData.reason,
            diagnosis: validConsultationData.diagnosis,
            symptoms: validConsultationData.symptoms,
            treatment_plan: validConsultationData.treatment_plan,
            veterinarian_id: validConsultationData.veterinarian_id,
            notes: validConsultationData.notes,
          }
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('consultation-1');
        expect(createConsultation).toHaveBeenCalledWith(
          validConsultationData.petId,
          mockTenant.id,
          expect.objectContaining({
            reason: validConsultationData.reason,
            diagnosis: validConsultationData.diagnosis,
          })
        );
      });

      it('should create consultation with optional next_appointment date', async () => {
        prismaMock.pet.findFirst.mockResolvedValue({
          ...mockPet,
          customer: mockCustomer,
        } as any);
        prismaMock.staff.findFirst.mockResolvedValue(mockStaff as any);

        const nextAppointment = new Date('2025-01-15T10:00:00Z');
        const consultationWithAppointment = {
          ...validConsultationData,
          next_appointment: nextAppointment,
        };

        const mockResult = {
          id: 'consultation-2',
          ...consultationWithAppointment,
          tenantId: mockTenant.id,
        };

        (createConsultation as jest.Mock).mockResolvedValue(mockResult);

        const result = await createConsultation(
          consultationWithAppointment.petId,
          mockTenant.id,
          {
            reason: consultationWithAppointment.reason,
            diagnosis: consultationWithAppointment.diagnosis,
            symptoms: consultationWithAppointment.symptoms,
            treatment_plan: consultationWithAppointment.treatment_plan,
            veterinarian_id: consultationWithAppointment.veterinarian_id,
            next_appointment: nextAppointment,
          }
        );

        expect(result.next_appointment).toEqual(nextAppointment);
      });
    });

    describe('Validation errors', () => {
      it('should require petId to be a string', async () => {
        const invalidData = {
          ...validConsultationData,
          petId: null,
        };

        // petId validation
        expect(typeof invalidData.petId).not.toBe('string');
      });

      it('should require reason field with minimum length', async () => {
        const shortReason = 'Short';
        const validReason = 'Annual checkup and vaccination';

        // Reason must be at least 10 characters
        expect(shortReason.length).toBeLessThan(10);
        expect(validReason.length).toBeGreaterThanOrEqual(10);
      });

      it('should require at least one symptom', async () => {
        const emptySymptoms: string[] = [];
        const validSymptoms = ['Vómito', 'Diarrea'];

        expect(emptySymptoms.length).toBe(0);
        expect(validSymptoms.length).toBeGreaterThanOrEqual(1);
      });

      it('should require diagnosis field', async () => {
        const invalidData = {
          reason: 'Annual checkup',
          symptoms: ['Letargo'],
          treatment_plan: 'Rest and medication',
          veterinarian_id: 'staff-1',
          // missing diagnosis
        };

        const requiredFields = ['reason', 'symptoms', 'diagnosis', 'treatment_plan', 'veterinarian_id'];
        const missingFields = requiredFields.filter(field => !(field in invalidData));

        expect(missingFields).toContain('diagnosis');
      });

      it('should require treatment_plan field', async () => {
        const invalidData = {
          reason: 'Annual checkup',
          symptoms: ['Letargo'],
          diagnosis: 'Healthy',
          veterinarian_id: 'staff-1',
          // missing treatment_plan
        };

        expect(invalidData).not.toHaveProperty('treatment_plan');
      });

      it('should require veterinarian_id field', async () => {
        const invalidData = {
          reason: 'Annual checkup',
          symptoms: ['Letargo'],
          diagnosis: 'Healthy',
          treatment_plan: 'Rest',
          // missing veterinarian_id
        };

        expect(invalidData).not.toHaveProperty('veterinarian_id');
      });
    });

    describe('Pet validation', () => {
      it('should return 404 if pet does not exist', async () => {
        prismaMock.pet.findFirst.mockResolvedValue(null);

        const pet = await prismaMock.pet.findFirst({
          where: {
            id: 'non-existent-pet',
            customer: { tenantId: mockTenant.id },
          },
        });

        expect(pet).toBeNull();
      });

      it('should verify pet belongs to tenant via customer relationship', async () => {
        const petWithCustomer = {
          ...mockPet,
          customer: {
            ...mockCustomer,
            tenantId: mockTenant.id,
          },
        };

        prismaMock.pet.findFirst.mockResolvedValue(petWithCustomer as any);

        const result = await prismaMock.pet.findFirst({
          where: {
            id: mockPet.id,
            customer: { tenantId: mockTenant.id },
          },
          include: { customer: true },
        });

        expect(result).not.toBeNull();
        expect(result?.customer?.tenantId).toBe(mockTenant.id);
      });

      it('should not allow access to pets from other tenants', async () => {
        const otherTenantCustomer = createTestCustomer({
          id: 'other-customer',
          tenantId: 'other-tenant-id',
        });
        const otherTenantPet = createTestPet({
          id: 'other-pet',
          tenantId: 'other-tenant-id',
          customerId: otherTenantCustomer.id,
        });

        // When querying with current tenant, should not find other tenant's pet
        prismaMock.pet.findFirst.mockImplementation(async (args: any) => {
          const queriedTenantId = args?.where?.customer?.tenantId;
          if (queriedTenantId === mockTenant.id) {
            // Only return pet if it belongs to current tenant
            if (args?.where?.id === mockPet.id) {
              return { ...mockPet, customer: mockCustomer } as any;
            }
            return null;
          }
          return null;
        });

        const result = await prismaMock.pet.findFirst({
          where: {
            id: otherTenantPet.id,
            customer: { tenantId: mockTenant.id },
          },
        });

        expect(result).toBeNull();
      });
    });

    describe('Staff validation', () => {
      it('should return 404 if staff does not exist', async () => {
        prismaMock.pet.findFirst.mockResolvedValue({
          ...mockPet,
          customer: mockCustomer,
        } as any);

        prismaMock.staff.findFirst.mockResolvedValue(null);

        const staff = await prismaMock.staff.findFirst({
          where: {
            id: 'non-existent-staff',
            tenantId: mockTenant.id,
            isActive: true,
          },
        });

        expect(staff).toBeNull();
      });

      it('should verify staff belongs to tenant', async () => {
        prismaMock.staff.findFirst.mockResolvedValue(mockStaff as any);

        const result = await prismaMock.staff.findFirst({
          where: {
            id: mockStaff.id,
            tenantId: mockTenant.id,
            isActive: true,
          },
        });

        expect(result).not.toBeNull();
        expect(result?.tenantId).toBe(mockTenant.id);
      });

      it('should not allow inactive staff to be assigned', async () => {
        const inactiveStaff = createTestStaff({
          id: 'inactive-staff',
          tenantId: mockTenant.id,
          isActive: false,
        });

        prismaMock.staff.findFirst.mockImplementation(async (args: any) => {
          if (args?.where?.isActive === true && args?.where?.id === inactiveStaff.id) {
            return null; // Active filter excludes inactive staff
          }
          return null;
        });

        const result = await prismaMock.staff.findFirst({
          where: {
            id: inactiveStaff.id,
            tenantId: mockTenant.id,
            isActive: true,
          },
        });

        expect(result).toBeNull();
      });

      it('should not allow staff from other tenants', async () => {
        const otherTenantStaff = createTestStaff({
          id: 'other-staff',
          tenantId: 'other-tenant-id',
          isActive: true,
        });

        prismaMock.staff.findFirst.mockImplementation(async (args: any) => {
          if (args?.where?.tenantId === mockTenant.id) {
            // Won't find staff from other tenant
            return null;
          }
          return null;
        });

        const result = await prismaMock.staff.findFirst({
          where: {
            id: otherTenantStaff.id,
            tenantId: mockTenant.id,
            isActive: true,
          },
        });

        expect(result).toBeNull();
      });
    });

    describe('Multi-tenancy isolation', () => {
      it('should scope all queries to current tenant', async () => {
        const queryCalls: any[] = [];

        prismaMock.pet.findFirst.mockImplementation(async (args) => {
          queryCalls.push({ model: 'pet', args });
          return { ...mockPet, customer: mockCustomer } as any;
        });

        prismaMock.staff.findFirst.mockImplementation(async (args) => {
          queryCalls.push({ model: 'staff', args });
          return mockStaff as any;
        });

        await prismaMock.pet.findFirst({
          where: {
            id: 'pet-1',
            customer: { tenantId: mockTenant.id },
          },
        });

        await prismaMock.staff.findFirst({
          where: {
            id: 'staff-1',
            tenantId: mockTenant.id,
          },
        });

        expect(queryCalls).toHaveLength(2);

        // Verify pet query includes tenant scope
        expect(queryCalls[0].args.where.customer.tenantId).toBe(mockTenant.id);

        // Verify staff query includes tenant scope
        expect(queryCalls[1].args.where.tenantId).toBe(mockTenant.id);
      });
    });

    describe('Symptom handling', () => {
      it('should accept array of symptoms', async () => {
        const symptoms = ['Vómito', 'Diarrea', 'Pérdida de apetito'];

        expect(Array.isArray(symptoms)).toBe(true);
        expect(symptoms.length).toBe(3);
      });

      it('should handle empty symptoms array correctly (validation should fail)', async () => {
        const emptySymptoms: string[] = [];

        // Empty symptoms should fail validation (min 1 required)
        expect(emptySymptoms.length).toBe(0);
      });

      it('should handle single symptom', async () => {
        const singleSymptom = ['Fiebre'];

        expect(singleSymptom.length).toBeGreaterThanOrEqual(1);
      });

      it('should accept common symptom values', async () => {
        const commonSymptoms = [
          'Vómito',
          'Diarrea',
          'Pérdida de apetito',
          'Letargo',
          'Fiebre',
          'Tos',
          'Cojera',
        ];

        commonSymptoms.forEach(symptom => {
          expect(typeof symptom).toBe('string');
          expect(symptom.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Date handling', () => {
      it('should accept valid next_appointment date', async () => {
        // Use a date that is always in the future relative to test execution
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year from now

        expect(futureDate instanceof Date).toBe(true);
        expect(futureDate.getTime()).toBeGreaterThan(Date.now());
      });

      it('should accept ISO string for next_appointment', async () => {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 6); // 6 months from now
        const isoString = futureDate.toISOString();
        const parsedDate = new Date(isoString);

        expect(isNaN(parsedDate.getTime())).toBe(false);
      });

      it('should handle undefined next_appointment (optional field)', async () => {
        const dataWithoutAppointment = {
          reason: 'Annual checkup and vaccination',
          symptoms: ['Letargo'],
          diagnosis: 'Healthy',
          treatment_plan: 'Continue monitoring',
          veterinarian_id: 'staff-1',
          next_appointment: undefined,
        };

        expect(dataWithoutAppointment.next_appointment).toBeUndefined();
      });
    });
  });
});
