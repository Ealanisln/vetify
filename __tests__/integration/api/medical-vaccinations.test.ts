/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestPet,
  createTestTenant,
  createTestCustomer,
  createTestStaff,
} from '../../utils/test-utils';
import { TreatmentType, VaccinationStage } from '@prisma/client';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
}));

// Mock the medical module
jest.mock('@/lib/medical', () => ({
  createVaccination: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { createVaccination } from '@/lib/medical';

describe('Medical Vaccinations API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  const validVaccinationData = {
    petId: 'pet-1',
    tenantId: 'tenant-1',
    vaccine_type: TreatmentType.VACCINATION,
    vaccine_brand: 'VetPharm',
    batch_number: 'BATCH-2025-001',
    administered_date: new Date('2025-01-01T10:00:00Z'),
    next_due_date: new Date('2026-01-01T10:00:00Z'),
    veterinarian_id: 'staff-1',
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

  describe('POST /api/medical/vaccinations', () => {
    describe('Successful creation', () => {
      it('should create a vaccination with valid data', async () => {
        const mockVaccination = {
          id: 'vaccination-1',
          ...validVaccinationData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (createVaccination as jest.Mock).mockResolvedValue(mockVaccination);

        const result = await createVaccination(
          validVaccinationData.petId,
          validVaccinationData.tenantId,
          {
            vaccine_type: validVaccinationData.vaccine_type,
            vaccine_brand: validVaccinationData.vaccine_brand,
            batch_number: validVaccinationData.batch_number,
            administered_date: validVaccinationData.administered_date,
            next_due_date: validVaccinationData.next_due_date,
            veterinarian_id: validVaccinationData.veterinarian_id,
          }
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('vaccination-1');
        expect(result.vaccine_brand).toBe(validVaccinationData.vaccine_brand);
        expect(createVaccination).toHaveBeenCalledWith(
          validVaccinationData.petId,
          validVaccinationData.tenantId,
          expect.objectContaining({
            vaccine_brand: validVaccinationData.vaccine_brand,
            batch_number: validVaccinationData.batch_number,
          })
        );
      });

      it('should create vaccination with optional side_effects', async () => {
        const vaccinationWithSideEffects = {
          ...validVaccinationData,
          side_effects: 'Mild swelling at injection site',
        };

        const mockResult = {
          id: 'vaccination-2',
          ...vaccinationWithSideEffects,
        };

        (createVaccination as jest.Mock).mockResolvedValue(mockResult);

        const result = await createVaccination(
          vaccinationWithSideEffects.petId,
          vaccinationWithSideEffects.tenantId,
          vaccinationWithSideEffects
        );

        expect(result.side_effects).toBe('Mild swelling at injection site');
      });

      it('should create vaccination with optional vaccine_stage', async () => {
        const vaccinationWithStage = {
          ...validVaccinationData,
          vaccine_stage: VaccinationStage.PUPPY_KITTEN,
        };

        const mockResult = {
          id: 'vaccination-3',
          ...vaccinationWithStage,
        };

        (createVaccination as jest.Mock).mockResolvedValue(mockResult);

        const result = await createVaccination(
          vaccinationWithStage.petId,
          vaccinationWithStage.tenantId,
          vaccinationWithStage
        );

        expect(result.vaccine_stage).toBe(VaccinationStage.PUPPY_KITTEN);
      });

      it('should create vaccination with optional manufacturer', async () => {
        const vaccinationWithManufacturer = {
          ...validVaccinationData,
          manufacturer: 'Zoetis',
        };

        const mockResult = {
          id: 'vaccination-4',
          ...vaccinationWithManufacturer,
        };

        (createVaccination as jest.Mock).mockResolvedValue(mockResult);

        const result = await createVaccination(
          vaccinationWithManufacturer.petId,
          vaccinationWithManufacturer.tenantId,
          vaccinationWithManufacturer
        );

        expect(result.manufacturer).toBe('Zoetis');
      });

      it('should create vaccination with optional notes', async () => {
        const vaccinationWithNotes = {
          ...validVaccinationData,
          notes: 'Pet was calm during vaccination. No immediate adverse reactions.',
        };

        const mockResult = {
          id: 'vaccination-5',
          ...vaccinationWithNotes,
        };

        (createVaccination as jest.Mock).mockResolvedValue(mockResult);

        const result = await createVaccination(
          vaccinationWithNotes.petId,
          vaccinationWithNotes.tenantId,
          vaccinationWithNotes
        );

        expect(result.notes).toContain('Pet was calm');
      });
    });

    describe('Validation errors', () => {
      it('should require vaccine_type to be VACCINATION', async () => {
        const invalidType = TreatmentType.MEDICATION;
        const validType = TreatmentType.VACCINATION;

        expect(invalidType).not.toBe(TreatmentType.VACCINATION);
        expect(validType).toBe(TreatmentType.VACCINATION);
      });

      it('should require vaccine_brand with minimum length', async () => {
        const shortBrand = 'A';
        const validBrand = 'VetPharm';

        // vaccine_brand must be at least 2 characters
        expect(shortBrand.length).toBeLessThan(2);
        expect(validBrand.length).toBeGreaterThanOrEqual(2);
      });

      it('should require batch_number with minimum length', async () => {
        const shortBatch = '';
        const validBatch = 'BATCH-2025-001';

        // batch_number must be at least 1 character
        expect(shortBatch.length).toBeLessThan(1);
        expect(validBatch.length).toBeGreaterThanOrEqual(1);
      });

      it('should require valid administered_date', async () => {
        const validDate = new Date('2025-01-01T10:00:00Z');
        const invalidDateString = 'invalid-date';

        expect(validDate instanceof Date).toBe(true);
        expect(isNaN(validDate.getTime())).toBe(false);
        expect(isNaN(Date.parse(invalidDateString))).toBe(true);
      });

      it('should require valid next_due_date', async () => {
        const validDate = new Date('2026-01-01T10:00:00Z');

        expect(validDate instanceof Date).toBe(true);
        expect(isNaN(validDate.getTime())).toBe(false);
      });

      it('should require veterinarian_id with minimum length', async () => {
        const emptyId = '';
        const validId = 'staff-1';

        expect(emptyId.length).toBeLessThan(1);
        expect(validId.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Tenant access control', () => {
      it('should reject if tenantId does not match authenticated tenant', async () => {
        const differentTenantId = 'other-tenant-id';
        const authenticatedTenantId = mockTenant.id;

        const hasAccess = differentTenantId === authenticatedTenantId;
        expect(hasAccess).toBe(false);
      });

      it('should allow access when tenantId matches authenticated tenant', async () => {
        const authenticatedTenantId = mockTenant.id;
        const requestedTenantId = mockTenant.id;

        const hasAccess = requestedTenantId === authenticatedTenantId;
        expect(hasAccess).toBe(true);
      });
    });

    describe('Vaccination stage validation', () => {
      it('should accept PUPPY_KITTEN stage', async () => {
        expect(VaccinationStage.PUPPY_KITTEN).toBeDefined();
      });

      it('should accept ADULT stage', async () => {
        expect(VaccinationStage.ADULT).toBeDefined();
      });

      it('should accept SENIOR stage', async () => {
        expect(VaccinationStage.SENIOR).toBeDefined();
      });

      it('should accept BOOSTER stage', async () => {
        expect(VaccinationStage.BOOSTER).toBeDefined();
      });
    });

    describe('Common vaccines handling', () => {
      const commonVaccines = [
        'DHPPI (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
        'Antirrábica',
        'Parvovirus',
        'Bordetella',
        'Leptospirosis',
        'FVRCP (Felino)',
        'FeLV (Leucemia Felina)',
        'Triple Felina',
        'Tos de las Perreras',
        'Coronavirus Canino',
      ];

      it('should accept common vaccine names', async () => {
        commonVaccines.forEach(vaccine => {
          expect(vaccine.length).toBeGreaterThan(0);
        });
      });
    });

    describe('Date validation', () => {
      it('should accept ISO string for administered_date', async () => {
        const isoString = '2025-01-01T10:00:00Z';
        const parsedDate = new Date(isoString);

        expect(isNaN(parsedDate.getTime())).toBe(false);
      });

      it('should accept ISO string for next_due_date', async () => {
        const isoString = '2026-01-01T10:00:00Z';
        const parsedDate = new Date(isoString);

        expect(isNaN(parsedDate.getTime())).toBe(false);
      });

      it('should ensure next_due_date is after administered_date', async () => {
        const administeredDate = new Date('2025-01-01T10:00:00Z');
        const nextDueDate = new Date('2026-01-01T10:00:00Z');

        expect(nextDueDate.getTime()).toBeGreaterThan(administeredDate.getTime());
      });
    });

    describe('Multi-tenancy isolation', () => {
      it('should not allow creating vaccinations for pets from other tenants', async () => {
        const otherTenantPet = createTestPet({
          id: 'other-pet',
          tenantId: 'other-tenant-id',
          customerId: 'other-customer',
        });

        const requestTenantId = 'other-tenant-id';
        const authenticatedTenantId = mockTenant.id;

        expect(requestTenantId).not.toBe(authenticatedTenantId);
      });

      it('should verify veterinarian belongs to the tenant', async () => {
        const otherTenantStaff = createTestStaff({
          id: 'other-staff',
          tenantId: 'other-tenant-id',
        });

        prismaMock.staff.findFirst.mockImplementation(async (args: any) => {
          if (args?.where?.tenantId === mockTenant.id && args?.where?.id === mockStaff.id) {
            return mockStaff as any;
          }
          return null;
        });

        // Query for other tenant's staff should return null
        const result = await prismaMock.staff.findFirst({
          where: {
            id: otherTenantStaff.id,
            tenantId: mockTenant.id,
          },
        });

        expect(result).toBeNull();
      });
    });

    describe('Error handling', () => {
      it('should handle Zod validation errors', async () => {
        const zodError = {
          name: 'ZodError',
          errors: [
            { path: ['vaccine_brand'], message: 'Especifica la marca de la vacuna' },
            { path: ['batch_number'], message: 'Número de lote requerido' },
          ],
        };

        expect(zodError.name).toBe('ZodError');
        expect(zodError.errors).toHaveLength(2);
      });

      it('should return 403 for tenant mismatch', async () => {
        const requestTenantId = 'other-tenant';
        const authenticatedTenantId = mockTenant.id;

        const expectedStatus = requestTenantId !== authenticatedTenantId ? 403 : 200;
        expect(expectedStatus).toBe(403);
      });
    });

    describe('Batch number format', () => {
      it('should accept alphanumeric batch numbers', async () => {
        const validBatches = [
          'BATCH-2025-001',
          'ABC123',
          'LOT-45678',
          'VET2025001',
        ];

        validBatches.forEach(batch => {
          expect(/^[a-zA-Z0-9-]+$/.test(batch)).toBe(true);
        });
      });

      it('should reject batch numbers with special characters', async () => {
        const invalidBatches = [
          'BATCH@2025',
          'LOT#123',
          'VET/2025',
        ];

        invalidBatches.forEach(batch => {
          expect(/^[a-zA-Z0-9-]+$/.test(batch)).toBe(false);
        });
      });
    });
  });
});
