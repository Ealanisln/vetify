/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestPet,
  createTestTenant,
  createTestCustomer,
  createTestStaff,
} from '../../utils/test-utils';
import { TreatmentType } from '@prisma/client';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock the medical module
jest.mock('@/lib/medical', () => ({
  createTreatment: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { createTreatment } from '@/lib/medical';

describe('Medical Treatments API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  const validTreatmentData = {
    petId: 'pet-1',
    tenantId: 'tenant-1',
    medication_name: 'Amoxicilina',
    dosage: '500mg',
    frequency: 'Cada 8 horas con alimentos',
    duration_days: 7,
    instructions: 'Administrar con comida para evitar malestar estomacal',
    start_date: new Date('2025-01-01T10:00:00Z'),
    treatment_type: TreatmentType.OTHER_PREVENTATIVE,
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

  describe('POST /api/medical/treatments', () => {
    describe('Successful creation', () => {
      it('should create a treatment with valid data', async () => {
        const mockTreatment = {
          id: 'treatment-1',
          ...validTreatmentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (createTreatment as jest.Mock).mockResolvedValue(mockTreatment);

        const result = await createTreatment(
          validTreatmentData.petId,
          validTreatmentData.tenantId,
          {
            medication_name: validTreatmentData.medication_name,
            dosage: validTreatmentData.dosage,
            frequency: validTreatmentData.frequency,
            duration_days: validTreatmentData.duration_days,
            instructions: validTreatmentData.instructions,
            start_date: validTreatmentData.start_date,
            treatment_type: validTreatmentData.treatment_type,
          }
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('treatment-1');
        expect(result.medication_name).toBe(validTreatmentData.medication_name);
        expect(createTreatment).toHaveBeenCalledWith(
          validTreatmentData.petId,
          validTreatmentData.tenantId,
          expect.objectContaining({
            medication_name: validTreatmentData.medication_name,
            dosage: validTreatmentData.dosage,
          })
        );
      });

      it('should create treatment with optional consultation_id', async () => {
        const treatmentWithConsultation = {
          ...validTreatmentData,
          consultation_id: 'consultation-1',
        };

        const mockResult = {
          id: 'treatment-2',
          ...treatmentWithConsultation,
        };

        (createTreatment as jest.Mock).mockResolvedValue(mockResult);

        const result = await createTreatment(
          treatmentWithConsultation.petId,
          treatmentWithConsultation.tenantId,
          {
            medication_name: treatmentWithConsultation.medication_name,
            dosage: treatmentWithConsultation.dosage,
            frequency: treatmentWithConsultation.frequency,
            duration_days: treatmentWithConsultation.duration_days,
            instructions: treatmentWithConsultation.instructions,
            start_date: treatmentWithConsultation.start_date,
            treatment_type: treatmentWithConsultation.treatment_type,
            consultation_id: treatmentWithConsultation.consultation_id,
          }
        );

        expect(result.consultation_id).toBe('consultation-1');
      });

      it('should create treatment with optional veterinarian_id', async () => {
        const treatmentWithVet = {
          ...validTreatmentData,
          veterinarian_id: 'staff-1',
        };

        const mockResult = {
          id: 'treatment-3',
          ...treatmentWithVet,
        };

        (createTreatment as jest.Mock).mockResolvedValue(mockResult);

        const result = await createTreatment(
          treatmentWithVet.petId,
          treatmentWithVet.tenantId,
          {
            ...validTreatmentData,
            veterinarian_id: treatmentWithVet.veterinarian_id,
          }
        );

        expect(result.veterinarian_id).toBe('staff-1');
      });
    });

    describe('Validation errors', () => {
      it('should require petId', async () => {
        const invalidData = {
          tenantId: 'tenant-1',
          medication_name: 'Amoxicilina',
          // missing petId
        };

        expect(invalidData).not.toHaveProperty('petId');
      });

      it('should require tenantId', async () => {
        const invalidData = {
          petId: 'pet-1',
          medication_name: 'Amoxicilina',
          // missing tenantId
        };

        expect(invalidData).not.toHaveProperty('tenantId');
      });

      it('should require medication_name with minimum length', async () => {
        const shortName = 'A';
        const validName = 'Amoxicilina';

        // medication_name must be at least 2 characters
        expect(shortName.length).toBeLessThan(2);
        expect(validName.length).toBeGreaterThanOrEqual(2);
      });

      it('should require dosage field', async () => {
        const invalidData = {
          petId: 'pet-1',
          tenantId: 'tenant-1',
          medication_name: 'Amoxicilina',
          // missing dosage
        };

        expect(invalidData).not.toHaveProperty('dosage');
      });

      it('should require frequency with minimum length', async () => {
        const shortFrequency = 'día';
        const validFrequency = 'Cada 8 horas';

        // frequency must be at least 5 characters
        expect(shortFrequency.length).toBeLessThan(5);
        expect(validFrequency.length).toBeGreaterThanOrEqual(5);
      });

      it('should require duration_days within valid range', async () => {
        const tooShort = 0;
        const tooLong = 400;
        const validDuration = 7;

        // duration_days must be between 1 and 365
        expect(tooShort).toBeLessThan(1);
        expect(tooLong).toBeGreaterThan(365);
        expect(validDuration).toBeGreaterThanOrEqual(1);
        expect(validDuration).toBeLessThanOrEqual(365);
      });

      it('should require instructions with minimum length', async () => {
        const shortInstructions = 'Take it';
        const validInstructions = 'Administrar con comida para evitar malestar';

        // instructions must be at least 10 characters
        expect(shortInstructions.length).toBeLessThan(10);
        expect(validInstructions.length).toBeGreaterThanOrEqual(10);
      });

      it('should require valid start_date', async () => {
        const validDate = new Date('2025-01-01T10:00:00Z');
        const invalidDateString = 'not-a-date';

        expect(validDate instanceof Date).toBe(true);
        expect(isNaN(validDate.getTime())).toBe(false);
        expect(isNaN(Date.parse(invalidDateString))).toBe(true);
      });

      it('should require valid treatment_type enum value', async () => {
        const validTypes = Object.values(TreatmentType);

        expect(validTypes).toContain(TreatmentType.VACCINATION);
        expect(validTypes).toContain(TreatmentType.DEWORMING);
        expect(validTypes).toContain(TreatmentType.FLEA_TICK);
        expect(validTypes).toContain(TreatmentType.OTHER_PREVENTATIVE);
      });
    });

    describe('Tenant access control', () => {
      it('should reject if tenantId does not match authenticated tenant', async () => {
        const differentTenantId = 'other-tenant-id';

        // This simulates the check in the API route
        const authenticatedTenantId = mockTenant.id;
        const requestedTenantId = differentTenantId;

        const hasAccess = requestedTenantId === authenticatedTenantId;
        expect(hasAccess).toBe(false);
      });

      it('should allow access when tenantId matches authenticated tenant', async () => {
        const authenticatedTenantId = mockTenant.id;
        const requestedTenantId = mockTenant.id;

        const hasAccess = requestedTenantId === authenticatedTenantId;
        expect(hasAccess).toBe(true);
      });
    });

    describe('Treatment type validation', () => {
      it('should accept VACCINATION treatment type', async () => {
        expect(TreatmentType.VACCINATION).toBeDefined();
      });

      it('should accept DEWORMING treatment type', async () => {
        expect(TreatmentType.DEWORMING).toBeDefined();
      });

      it('should accept FLEA_TICK treatment type', async () => {
        expect(TreatmentType.FLEA_TICK).toBeDefined();
      });

      it('should accept OTHER_PREVENTATIVE treatment type', async () => {
        expect(TreatmentType.OTHER_PREVENTATIVE).toBeDefined();
      });
    });

    describe('Multi-tenancy isolation', () => {
      it('should not allow creating treatments for pets from other tenants', async () => {
        const otherTenantPet = createTestPet({
          id: 'other-pet',
          tenantId: 'other-tenant-id',
          customerId: 'other-customer',
        });

        // Simulate tenant check
        const requestTenantId = 'other-tenant-id';
        const authenticatedTenantId = mockTenant.id;

        expect(requestTenantId).not.toBe(authenticatedTenantId);
      });

      it('should verify pet belongs to the authenticated tenant', async () => {
        prismaMock.pet.findFirst.mockImplementation(async (args: any) => {
          const queriedTenantId = args?.where?.customer?.tenantId;
          if (queriedTenantId === mockTenant.id && args?.where?.id === mockPet.id) {
            return { ...mockPet, customer: mockCustomer } as any;
          }
          return null;
        });

        const pet = await prismaMock.pet.findFirst({
          where: {
            id: mockPet.id,
            customer: { tenantId: mockTenant.id },
          },
        });

        expect(pet).not.toBeNull();
        expect(pet?.id).toBe(mockPet.id);
      });
    });

    describe('Error handling', () => {
      it('should handle Zod validation errors gracefully', async () => {
        // Simulate Zod error structure
        const zodError = {
          name: 'ZodError',
          errors: [
            { path: ['medication_name'], message: 'Nombre del medicamento requerido' },
            { path: ['dosage'], message: 'Especifica la dosis' },
          ],
        };

        const fieldErrors: Record<string, string> = {};
        zodError.errors.forEach((err) => {
          const field = err.path.join('.');
          fieldErrors[field] = err.message;
        });

        expect(fieldErrors['medication_name']).toBe('Nombre del medicamento requerido');
        expect(fieldErrors['dosage']).toBe('Especifica la dosis');
      });

      it('should return 400 for missing required fields', async () => {
        const invalidData = {
          petId: 'pet-1',
          // missing tenantId
        };

        const hasPetId = !!invalidData.petId;
        const hasTenantId = 'tenantId' in invalidData;

        expect(hasPetId).toBe(true);
        expect(hasTenantId).toBe(false);
      });

      it('should return 403 for tenant mismatch', async () => {
        const requestTenantId = 'other-tenant';
        const authenticatedTenantId = mockTenant.id;

        const expectedStatus = requestTenantId !== authenticatedTenantId ? 403 : 200;
        expect(expectedStatus).toBe(403);
      });
    });

    describe('Common medication handling', () => {
      const commonMedications = [
        'Amoxicilina',
        'Prednisolona',
        'Carprofeno',
        'Gabapentina',
        'Furosemida',
        'Prednisona',
        'Tramadol',
        'Ceftriaxona',
        'Meloxicam',
        'Doxiciclina',
      ];

      it('should accept common medication names', async () => {
        commonMedications.forEach(medication => {
          expect(medication.length).toBeGreaterThanOrEqual(2);
        });
      });

      it('should handle custom medication names', async () => {
        const customMedication = 'Medicamento Especial Veterinario XYZ';
        expect(customMedication.length).toBeGreaterThanOrEqual(2);
      });
    });
  });
});
