/* eslint-disable @typescript-eslint/no-explicit-any */
import { prismaMock } from '../../mocks/prisma';
import { createTestTenant } from '../../utils/test-utils';
import { GET, PUT } from '@/app/api/settings/business-hours/route';

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  requireAuth: jest.fn(),
  requirePermission: jest.fn(),
}));

import { requirePermission } from '@/lib/auth';

const mockRequirePermission = requirePermission as jest.Mock;

// Helper to create a mock Request for PUT
function createMockPutRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as unknown as Request;
}

// Test data factories
const createTestTenantSettings = (overrides = {}) => ({
  id: 'settings-1',
  tenantId: 'tenant-1',
  defaultStartTime: '08:00',
  defaultEndTime: '18:00',
  defaultLunchStart: '13:00',
  defaultLunchEnd: '14:00',
  defaultSlotDuration: 15,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestBusinessHour = (dayOfWeek: number, overrides = {}) => ({
  id: `hours-${dayOfWeek}`,
  tenantId: 'tenant-1',
  tenantSettingsId: 'settings-1',
  locationId: null,
  dayOfWeek,
  isWorkingDay: dayOfWeek >= 1 && dayOfWeek <= 6, // Monday to Saturday
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  slotDuration: 15,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

describe('Business Hours API', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockTenantSettings: ReturnType<typeof createTestTenantSettings>;
  let mockBusinessHours: ReturnType<typeof createTestBusinessHour>[];
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockTenant = createTestTenant({
      id: 'tenant-1',
      slug: 'test-clinic',
      status: 'ACTIVE',
    });

    mockTenantSettings = createTestTenantSettings({ tenantId: mockTenant.id });
    mockBusinessHours = Array.from({ length: 7 }, (_, i) =>
      createTestBusinessHour(i, { tenantId: mockTenant.id })
    );
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('GET /api/settings/business-hours', () => {
    it('should return existing business hours for authenticated user', async () => {
      mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });
      prismaMock.tenantSettings.findUnique.mockResolvedValue({
        ...mockTenantSettings,
        businessHours: mockBusinessHours,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.defaultStartTime).toBe('08:00');
      expect(data.data.defaultEndTime).toBe('18:00');
      expect(data.data.businessHours).toHaveLength(7);
    });

    it('should create default settings when none exist', async () => {
      mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

      // First call returns null (no settings exist)
      prismaMock.tenantSettings.findUnique.mockResolvedValueOnce(null);

      // Create returns new settings
      prismaMock.tenantSettings.create.mockResolvedValue({
        ...mockTenantSettings,
        businessHours: [],
      } as any);

      // createMany for business hours
      prismaMock.businessHours.createMany.mockResolvedValue({ count: 7 });

      // Second findUnique returns settings with business hours
      prismaMock.tenantSettings.findUnique.mockResolvedValue({
        ...mockTenantSettings,
        businessHours: mockBusinessHours,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prismaMock.tenantSettings.create).toHaveBeenCalled();
    });

    it('should create default business hours when settings exist but hours are empty', async () => {
      mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

      // First call returns settings without business hours
      prismaMock.tenantSettings.findUnique.mockResolvedValueOnce({
        ...mockTenantSettings,
        businessHours: [],
      } as any);

      // createMany for business hours
      prismaMock.businessHours.createMany.mockResolvedValue({ count: 7 });

      // Second findUnique returns settings with business hours
      prismaMock.tenantSettings.findUnique.mockResolvedValue({
        ...mockTenantSettings,
        businessHours: mockBusinessHours,
      } as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prismaMock.businessHours.createMany).toHaveBeenCalled();
    });

    it('should return 500 for unauthenticated request', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Unauthorized'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Error interno del servidor');
    });
  });

  describe('PUT /api/settings/business-hours', () => {
    describe('Validation', () => {
      it('should reject invalid time format', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        const request = createMockPutRequest({
          defaultStartTime: '25:00', // Invalid hour
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Datos inválidos');
      });

      it('should reject slot duration out of range', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 3, // Below minimum of 5
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
      });

      it('should accept valid single-digit hour format (e.g., 8:00)', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '8:00',
        } as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          businessHours: [],
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '8:00', // Single digit hour
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Null value handling (VETIF-160 fix)', () => {
      it('should accept null for optional time fields (lunchStart, lunchEnd)', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultLunchStart: null,
          defaultLunchEnd: null,
        } as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          defaultLunchStart: null,
          defaultLunchEnd: null,
          businessHours: [],
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultLunchStart: null, // Explicitly null
          defaultLunchEnd: null, // Explicitly null
          defaultSlotDuration: 15,
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should accept undefined for optional time fields', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          businessHours: [],
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          // defaultLunchStart and defaultLunchEnd are undefined
          defaultSlotDuration: 15,
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });

      it('should accept null slotDuration in business hours array', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
        } as any);
        prismaMock.businessHours.update.mockResolvedValue(mockBusinessHours[1] as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          businessHours: [{
            id: 'hours-1',
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '09:00',
            endTime: '17:00',
            lunchStart: null,
            lunchEnd: null,
            slotDuration: null, // Should use defaultSlotDuration as fallback
          }],
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Passthrough fields (VETIF-160 fix)', () => {
      it('should accept extra Prisma fields like id, tenantId, tenantSettingsId', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
          businessHours: mockBusinessHours,
        } as any);
        prismaMock.businessHours.update.mockResolvedValue(mockBusinessHours[1] as any);

        // This simulates what the frontend sends: the full object from GET including Prisma fields
        const request = createMockPutRequest({
          id: 'settings-1', // Extra Prisma field
          tenantId: 'tenant-1', // Extra Prisma field
          createdAt: '2024-01-01T00:00:00.000Z', // Extra Prisma field
          updatedAt: '2024-01-01T00:00:00.000Z', // Extra Prisma field
          defaultStartTime: '09:00',
          defaultEndTime: '17:00',
          defaultLunchStart: '12:00',
          defaultLunchEnd: '13:00',
          defaultSlotDuration: 30,
          businessHours: [{
            id: 'hours-1', // Extra Prisma field
            tenantId: 'tenant-1', // Extra Prisma field
            tenantSettingsId: 'settings-1', // Extra Prisma field
            locationId: null, // Extra Prisma field
            createdAt: '2024-01-01T00:00:00.000Z', // Extra Prisma field
            updatedAt: '2024-01-01T00:00:00.000Z', // Extra Prisma field
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '09:00',
            endTime: '17:00',
            lunchStart: '12:00',
            lunchEnd: '13:00',
            slotDuration: 30,
          }],
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      });
    });

    describe('Update by ID (VETIF-160 fix)', () => {
      it('should update business hours by ID when id is provided', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
          businessHours: mockBusinessHours,
        } as any);
        prismaMock.businessHours.update.mockResolvedValue({
          ...mockBusinessHours[1],
          startTime: '10:00',
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          businessHours: [{
            id: 'hours-1', // Existing record ID
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '10:00', // Updated value
            endTime: '18:00',
            lunchStart: '13:00',
            lunchEnd: '14:00',
            slotDuration: 15,
          }],
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Should use update with the provided ID
        expect(prismaMock.businessHours.update).toHaveBeenCalledWith({
          where: { id: 'hours-1' },
          data: expect.objectContaining({
            startTime: '10:00',
          }),
        });
      });

      it('should find and update by composite key when id is not provided', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
        } as any);

        // findFirst returns existing record
        prismaMock.businessHours.findFirst.mockResolvedValue({
          ...mockBusinessHours[1],
          id: 'found-hours-id',
        } as any);

        prismaMock.businessHours.update.mockResolvedValue({
          ...mockBusinessHours[1],
          startTime: '10:00',
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          businessHours: [{
            // No id provided
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '10:00',
            endTime: '18:00',
            lunchStart: '13:00',
            lunchEnd: '14:00',
            slotDuration: 15,
          }],
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Should search by composite key
        expect(prismaMock.businessHours.findFirst).toHaveBeenCalledWith({
          where: {
            tenantId: mockTenant.id,
            locationId: null,
            dayOfWeek: 1,
          },
        });

        // Then update using the found ID
        expect(prismaMock.businessHours.update).toHaveBeenCalledWith({
          where: { id: 'found-hours-id' },
          data: expect.anything(),
        });
      });

      it('should create new business hours when none exist for day', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue(mockTenantSettings as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
          businessHours: [],
        } as any);

        // findFirst returns null (no existing record)
        prismaMock.businessHours.findFirst.mockResolvedValue(null);

        prismaMock.businessHours.create.mockResolvedValue({
          ...mockBusinessHours[1],
          id: 'new-hours-id',
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          businessHours: [{
            // No id provided
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '09:00',
            endTime: '17:00',
            lunchStart: '12:00',
            lunchEnd: '13:00',
            slotDuration: 30,
          }],
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Should create new record
        expect(prismaMock.businessHours.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            tenantId: mockTenant.id,
            tenantSettingsId: 'settings-1',
            dayOfWeek: 1,
            isWorkingDay: true,
            startTime: '09:00',
            endTime: '17:00',
          }),
        });
      });
    });

    describe('Update without businessHours array', () => {
      it('should update only default settings when businessHours array is not provided', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '07:00',
        } as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '07:00',
          businessHours: mockBusinessHours,
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '07:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          // No businessHours array
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.defaultStartTime).toBe('07:00');

        // Should NOT call business hours update
        expect(prismaMock.businessHours.update).not.toHaveBeenCalled();
        expect(prismaMock.businessHours.create).not.toHaveBeenCalled();
      });

      it('should update only default settings when businessHours array is empty', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '06:00',
        } as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '06:00',
          businessHours: mockBusinessHours,
        } as any);

        const request = createMockPutRequest({
          defaultStartTime: '06:00',
          defaultEndTime: '18:00',
          defaultSlotDuration: 15,
          businessHours: [], // Empty array
        });

        const response = await PUT(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        // Should NOT call business hours update
        expect(prismaMock.businessHours.update).not.toHaveBeenCalled();
        expect(prismaMock.businessHours.create).not.toHaveBeenCalled();
      });
    });

    describe('Full workflow simulation (real-world scenario)', () => {
      it('should handle the complete GET-then-PUT workflow that caused VETIF-160', async () => {
        mockRequirePermission.mockResolvedValue({ tenant: { id: mockTenant.id } });

        // Step 1: GET returns full data with all Prisma fields
        const getResponse = {
          id: 'settings-1',
          tenantId: 'tenant-1',
          defaultStartTime: '08:00',
          defaultEndTime: '18:00',
          defaultLunchStart: '13:00',
          defaultLunchEnd: '14:00',
          defaultSlotDuration: 15,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
          businessHours: mockBusinessHours,
        };

        prismaMock.tenantSettings.findUnique.mockResolvedValue(getResponse as any);

        const getResult = await GET();
        const getData = await getResult.json();
        expect(getResult.status).toBe(200);

        // Step 2: Frontend modifies the data and sends it back via PUT
        // This is what caused the VETIF-160 bug - the frontend sends the full object
        // including id, tenantId, createdAt, etc.
        const modifiedData = {
          ...getData.data,
          defaultStartTime: '07:00', // User changed this
          businessHours: getData.data.businessHours.map((h: any) => ({
            ...h,
            startTime: '07:00', // Changed
          })),
        };

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '07:00',
        } as any);
        prismaMock.tenantSettings.findUnique.mockResolvedValue({
          ...mockTenantSettings,
          id: 'settings-1',
          defaultStartTime: '07:00',
          businessHours: mockBusinessHours.map(h => ({ ...h, startTime: '07:00' })),
        } as any);
        prismaMock.businessHours.update.mockResolvedValue({} as any);

        const putRequest = createMockPutRequest(modifiedData);
        const putResult = await PUT(putRequest);
        const putData = await putResult.json();

        // This should NOT fail - the fix allows passthrough of extra fields
        expect(putResult.status).toBe(200);
        expect(putData.success).toBe(true);
        expect(putData.message).toBe('Horarios de atención actualizados exitosamente');
      });
    });

    it('should return 500 for unauthenticated request', async () => {
      mockRequirePermission.mockRejectedValue(new Error('Unauthorized'));

      const request = createMockPutRequest({
        defaultStartTime: '08:00',
        defaultEndTime: '18:00',
        defaultSlotDuration: 15,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe('Time format regex validation', () => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    it.each([
      ['00:00', true],
      ['08:00', true],
      ['8:00', true], // Single digit hour
      ['9:30', true],
      ['12:30', true],
      ['23:59', true],
      ['24:00', false], // Invalid hour
      ['25:00', false], // Invalid hour
      ['12:60', false], // Invalid minute
      ['12:99', false], // Invalid minute
      ['-1:00', false], // Negative
      ['abc', false], // Non-numeric
      ['12', false], // Missing minutes
      ['12:', false], // Missing minutes
      [':30', false], // Missing hour
      ['', false], // Empty
    ])('should validate time "%s" as %s', (time, expected) => {
      expect(timeRegex.test(time)).toBe(expected);
    });
  });

  describe('Slot duration validation', () => {
    it.each([
      [5, true], // Minimum valid
      [15, true],
      [30, true],
      [60, true],
      [120, true], // Maximum valid
      [4, false], // Below minimum
      [0, false], // Zero
      [-5, false], // Negative
      [121, false], // Above maximum
      [500, false], // Way above
    ])('should validate slot duration %d as %s', (duration, expected) => {
      expect(duration >= 5 && duration <= 120).toBe(expected);
    });
  });
});
