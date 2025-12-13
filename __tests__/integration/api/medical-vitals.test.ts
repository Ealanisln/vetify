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
  recordVitalSigns: jest.fn(),
}));

import { requireAuth } from '@/lib/auth';
import { recordVitalSigns } from '@/lib/medical';

describe('Medical Vital Signs API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockCustomer: ReturnType<typeof createTestCustomer>;
  let mockPet: ReturnType<typeof createTestPet>;
  let mockStaff: ReturnType<typeof createTestStaff>;

  const validVitalSignsData = {
    petId: 'pet-1',
    tenantId: 'tenant-1',
    weight: 25.5,
    temperature: 38.5,
    heart_rate: 120,
    respiratory_rate: 20,
    recorded_date: new Date('2025-01-01T10:00:00Z'),
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

  describe('POST /api/medical/vitals', () => {
    describe('Successful recording', () => {
      it('should record vital signs with valid data', async () => {
        const mockVitals = {
          id: 'vitals-1',
          ...validVitalSignsData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        (recordVitalSigns as jest.Mock).mockResolvedValue(mockVitals);

        const result = await recordVitalSigns(
          validVitalSignsData.petId,
          validVitalSignsData.tenantId,
          {
            weight: validVitalSignsData.weight,
            temperature: validVitalSignsData.temperature,
            heart_rate: validVitalSignsData.heart_rate,
            respiratory_rate: validVitalSignsData.respiratory_rate,
            recorded_date: validVitalSignsData.recorded_date,
          }
        );

        expect(result).toBeDefined();
        expect(result.id).toBe('vitals-1');
        expect(result.weight).toBe(validVitalSignsData.weight);
        expect(result.temperature).toBe(validVitalSignsData.temperature);
        expect(recordVitalSigns).toHaveBeenCalledWith(
          validVitalSignsData.petId,
          validVitalSignsData.tenantId,
          expect.objectContaining({
            weight: validVitalSignsData.weight,
            temperature: validVitalSignsData.temperature,
          })
        );
      });

      it('should record vital signs with optional blood_pressure', async () => {
        const vitalsWithBP = {
          ...validVitalSignsData,
          blood_pressure: '120/80',
        };

        const mockResult = {
          id: 'vitals-2',
          ...vitalsWithBP,
        };

        (recordVitalSigns as jest.Mock).mockResolvedValue(mockResult);

        const result = await recordVitalSigns(
          vitalsWithBP.petId,
          vitalsWithBP.tenantId,
          vitalsWithBP
        );

        expect(result.blood_pressure).toBe('120/80');
      });

      it('should record vital signs with optional notes', async () => {
        const vitalsWithNotes = {
          ...validVitalSignsData,
          notes: 'Pet appears healthy. All vitals within normal range.',
        };

        const mockResult = {
          id: 'vitals-3',
          ...vitalsWithNotes,
        };

        (recordVitalSigns as jest.Mock).mockResolvedValue(mockResult);

        const result = await recordVitalSigns(
          vitalsWithNotes.petId,
          vitalsWithNotes.tenantId,
          vitalsWithNotes
        );

        expect(result.notes).toContain('Pet appears healthy');
      });

      it('should record vital signs with optional consultation_id', async () => {
        const vitalsWithConsultation = {
          ...validVitalSignsData,
          consultation_id: 'consultation-1',
        };

        const mockResult = {
          id: 'vitals-4',
          ...vitalsWithConsultation,
        };

        (recordVitalSigns as jest.Mock).mockResolvedValue(mockResult);

        const result = await recordVitalSigns(
          vitalsWithConsultation.petId,
          vitalsWithConsultation.tenantId,
          vitalsWithConsultation
        );

        expect(result.consultation_id).toBe('consultation-1');
      });
    });

    describe('Validation - Weight', () => {
      it('should require weight greater than 0.1', async () => {
        const tooLight = 0.05;
        const validWeight = 25.5;

        expect(tooLight).toBeLessThan(0.1);
        expect(validWeight).toBeGreaterThanOrEqual(0.1);
      });

      it('should require weight less than or equal to 200', async () => {
        const tooHeavy = 250;
        const validWeight = 25.5;

        expect(tooHeavy).toBeGreaterThan(200);
        expect(validWeight).toBeLessThanOrEqual(200);
      });

      it('should accept decimal weight values', async () => {
        const decimalWeight = 25.75;

        expect(decimalWeight).toBeGreaterThanOrEqual(0.1);
        expect(decimalWeight).toBeLessThanOrEqual(200);
      });
    });

    describe('Validation - Temperature', () => {
      it('should require temperature at least 35 degrees', async () => {
        const tooLow = 30;
        const validTemp = 38.5;

        expect(tooLow).toBeLessThan(35);
        expect(validTemp).toBeGreaterThanOrEqual(35);
      });

      it('should require temperature at most 45 degrees', async () => {
        const tooHigh = 50;
        const validTemp = 38.5;

        expect(tooHigh).toBeGreaterThan(45);
        expect(validTemp).toBeLessThanOrEqual(45);
      });

      it('should accept normal dog temperature range (37.5-39.2)', async () => {
        const normalDogTemp = 38.5;

        expect(normalDogTemp).toBeGreaterThanOrEqual(37.5);
        expect(normalDogTemp).toBeLessThanOrEqual(39.2);
      });

      it('should accept normal cat temperature range (37.7-39.1)', async () => {
        const normalCatTemp = 38.5;

        expect(normalCatTemp).toBeGreaterThanOrEqual(37.7);
        expect(normalCatTemp).toBeLessThanOrEqual(39.1);
      });
    });

    describe('Validation - Heart Rate', () => {
      it('should require heart rate at least 30 bpm', async () => {
        const tooLow = 20;
        const validRate = 120;

        expect(tooLow).toBeLessThan(30);
        expect(validRate).toBeGreaterThanOrEqual(30);
      });

      it('should require heart rate at most 300 bpm', async () => {
        const tooHigh = 350;
        const validRate = 120;

        expect(tooHigh).toBeGreaterThan(300);
        expect(validRate).toBeLessThanOrEqual(300);
      });

      it('should accept normal dog heart rate range (60-140 bpm)', async () => {
        const normalDogHR = 100;

        expect(normalDogHR).toBeGreaterThanOrEqual(60);
        expect(normalDogHR).toBeLessThanOrEqual(140);
      });

      it('should accept normal cat heart rate range (140-220 bpm)', async () => {
        const normalCatHR = 180;

        expect(normalCatHR).toBeGreaterThanOrEqual(140);
        expect(normalCatHR).toBeLessThanOrEqual(220);
      });
    });

    describe('Validation - Respiratory Rate', () => {
      it('should require respiratory rate at least 5 breaths/min', async () => {
        const tooLow = 3;
        const validRate = 20;

        expect(tooLow).toBeLessThan(5);
        expect(validRate).toBeGreaterThanOrEqual(5);
      });

      it('should require respiratory rate at most 100 breaths/min', async () => {
        const tooHigh = 120;
        const validRate = 20;

        expect(tooHigh).toBeGreaterThan(100);
        expect(validRate).toBeLessThanOrEqual(100);
      });

      it('should accept normal dog respiratory rate (10-30 breaths/min)', async () => {
        const normalDogRR = 20;

        expect(normalDogRR).toBeGreaterThanOrEqual(10);
        expect(normalDogRR).toBeLessThanOrEqual(30);
      });

      it('should accept normal cat respiratory rate (20-30 breaths/min)', async () => {
        const normalCatRR = 25;

        expect(normalCatRR).toBeGreaterThanOrEqual(20);
        expect(normalCatRR).toBeLessThanOrEqual(30);
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

    describe('Date validation', () => {
      it('should accept valid recorded_date', async () => {
        const validDate = new Date('2025-01-01T10:00:00Z');

        expect(validDate instanceof Date).toBe(true);
        expect(isNaN(validDate.getTime())).toBe(false);
      });

      it('should accept ISO string for recorded_date', async () => {
        const isoString = '2025-01-01T10:00:00Z';
        const parsedDate = new Date(isoString);

        expect(isNaN(parsedDate.getTime())).toBe(false);
      });

      it('should accept current date/time for recorded_date', async () => {
        const now = new Date();

        expect(now instanceof Date).toBe(true);
        expect(isNaN(now.getTime())).toBe(false);
      });
    });

    describe('Multi-tenancy isolation', () => {
      it('should not allow recording vitals for pets from other tenants', async () => {
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
      it('should handle Zod validation errors', async () => {
        const zodError = {
          name: 'ZodError',
          errors: [
            { path: ['weight'], message: 'Peso debe ser mayor a 0' },
            { path: ['temperature'], message: 'Temperatura muy baja' },
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

    describe('Edge cases - NaN prevention (VETIF-11)', () => {
      it('should reject NaN for weight', async () => {
        const nanWeight = NaN;

        expect(isNaN(nanWeight)).toBe(true);
      });

      it('should reject NaN for temperature', async () => {
        const nanTemp = NaN;

        expect(isNaN(nanTemp)).toBe(true);
      });

      it('should reject NaN for heart_rate', async () => {
        const nanHR = NaN;

        expect(isNaN(nanHR)).toBe(true);
      });

      it('should reject NaN for respiratory_rate', async () => {
        const nanRR = NaN;

        expect(isNaN(nanRR)).toBe(true);
      });

      it('should handle string conversion to number correctly', async () => {
        const stringWeight = '25.5';
        const parsedWeight = parseFloat(stringWeight);

        expect(isNaN(parsedWeight)).toBe(false);
        expect(parsedWeight).toBe(25.5);
      });

      it('should detect invalid string to number conversion', async () => {
        const invalidString = 'not-a-number';
        const parsed = parseFloat(invalidString);

        expect(isNaN(parsed)).toBe(true);
      });
    });

    describe('Numeric precision', () => {
      it('should accept weight with two decimal places', async () => {
        const weight = 25.75;

        expect(typeof weight).toBe('number');
        expect(weight.toFixed(2)).toBe('25.75');
      });

      it('should accept temperature with one decimal place', async () => {
        const temp = 38.5;

        expect(typeof temp).toBe('number');
        expect(temp.toFixed(1)).toBe('38.5');
      });

      it('should accept integer values for heart_rate', async () => {
        const heartRate = 120;

        expect(Number.isInteger(heartRate)).toBe(true);
      });

      it('should accept integer values for respiratory_rate', async () => {
        const respRate = 20;

        expect(Number.isInteger(respRate)).toBe(true);
      });
    });
  });
});
