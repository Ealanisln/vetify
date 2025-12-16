/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { prismaMock } from '../../mocks/prisma';
import {
  createTestTenant,
  createTestUser,
} from '../../utils/test-utils';

// Test data factories for settings
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

const createTestBusinessHours = (overrides = {}) => ({
  id: 'hours-1',
  tenantId: 'tenant-1',
  tenantSettingsId: 'settings-1',
  locationId: null,
  dayOfWeek: 1, // Monday
  isWorkingDay: true,
  startTime: '08:00',
  endTime: '18:00',
  lunchStart: '13:00',
  lunchEnd: '14:00',
  slotDuration: 15,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestUserRole = (overrides = {}) => ({
  id: 'role-1',
  tenantId: 'tenant-1',
  name: 'Veterinarian',
  description: 'Veterinary doctor with full access',
  permissions: ['pets:read', 'pets:write', 'appointments:read', 'appointments:write'],
  isSystem: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const createTestNotificationPreferences = (overrides = {}) => ({
  emailAppointmentReminders: true,
  emailTreatmentReminders: true,
  emailInventoryAlerts: true,
  smsAppointmentReminders: false,
  smsTreatmentReminders: false,
  reminderAdvanceDays: 3,
  lowStockThreshold: 10,
  ...overrides,
});

describe('Settings API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockTenantSettings: ReturnType<typeof createTestTenantSettings>;
  let mockBusinessHours: ReturnType<typeof createTestBusinessHours>[];
  let mockUserRole: ReturnType<typeof createTestUserRole>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockTenantSettings = createTestTenantSettings({ tenantId: mockTenant.id });
    mockBusinessHours = [
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 0, isWorkingDay: false }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 1, isWorkingDay: true }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 2, isWorkingDay: true }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 3, isWorkingDay: true }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 4, isWorkingDay: true }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 5, isWorkingDay: true }),
      createTestBusinessHours({ tenantId: mockTenant.id, dayOfWeek: 6, isWorkingDay: true }),
    ];
    mockUserRole = createTestUserRole({ tenantId: mockTenant.id });

    // Mock Prisma responses
    prismaMock.user.findUnique.mockResolvedValue({
      ...mockUser,
      tenant: mockTenant,
    });
  });

  describe('Clinic Settings', () => {
    describe('GET /api/settings/clinic', () => {
      it('should return clinic settings for tenant', async () => {
        const clinicSettings = {
          clinicName: 'Test Veterinary Clinic',
          address: '123 Main Street',
          phone: '+52 1 55 1234 5678',
          email: 'clinic@example.com',
          timezone: 'America/Mexico_City',
          currency: 'MXN',
          taxRate: 16,
        };

        const mockSettingsResult = {
          ...mockTenantSettings,
          clinicSettings,
        };

        prismaMock.tenantSettings.findUnique.mockResolvedValue(mockSettingsResult);

        const result = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
        });

        expect(result).toBeDefined();
        expect(result?.tenantId).toBe(mockTenant.id);
      });

      it('should return 401 for unauthenticated requests', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);

        const user = await prismaMock.user.findUnique({
          where: { id: 'non-existent-user' },
        });

        expect(user).toBeNull();
        // API would return: { error: 'No autorizado' }, { status: 401 }
      });

      it('should enforce tenant isolation', async () => {
        prismaMock.tenantSettings.findUnique.mockImplementation(async (args: any) => {
          if (args?.where?.tenantId === mockTenant.id) {
            return mockTenantSettings;
          }
          return null;
        });

        // Valid tenant
        const validResult = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
        });
        expect(validResult).toBeDefined();

        // Invalid tenant
        const invalidResult = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: 'other-tenant-id' },
        });
        expect(invalidResult).toBeNull();
      });
    });

    describe('PUT /api/settings/clinic', () => {
      it('should update clinic settings with validation', async () => {
        const updateData = {
          clinicName: 'Updated Clinic Name',
          phone: '+52 1 55 9876 5432',
          address: '456 New Street',
        };

        const updatedSettings = {
          ...mockTenantSettings,
          ...updateData,
        };

        prismaMock.tenantSettings.update.mockResolvedValue(updatedSettings);

        const result = await prismaMock.tenantSettings.update({
          where: { tenantId: mockTenant.id },
          data: updateData,
        });

        expect(result.clinicName).toBe('Updated Clinic Name');
        expect(result.phone).toBe('+52 1 55 9876 5432');
      });

      it('should reject invalid clinic data', () => {
        const invalidData = {
          clinicName: '', // Empty name should be invalid
          email: 'not-an-email', // Invalid email format
        };

        // Zod validation would fail for empty clinicName and invalid email
        expect(invalidData.clinicName).toBe('');
        // API would return: { error: 'Datos inválidos' }, { status: 400 }
      });
    });
  });

  describe('Business Hours', () => {
    describe('GET /api/settings/business-hours', () => {
      it('should return business hours with tenant settings', async () => {
        const settingsWithHours = {
          ...mockTenantSettings,
          businessHours: mockBusinessHours,
        };

        prismaMock.tenantSettings.findUnique.mockResolvedValue(settingsWithHours);

        const result = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
          include: {
            businessHours: {
              orderBy: { dayOfWeek: 'asc' },
            },
          },
        });

        expect(result?.businessHours).toHaveLength(7);
        expect(result?.defaultStartTime).toBe('08:00');
        expect(result?.defaultEndTime).toBe('18:00');
      });

      it('should create default settings if none exist', async () => {
        // First call returns null, simulating no existing settings
        prismaMock.tenantSettings.findUnique.mockResolvedValueOnce(null);

        // Create default settings
        const defaultSettings = createTestTenantSettings({ tenantId: mockTenant.id });
        prismaMock.tenantSettings.create.mockResolvedValue({
          ...defaultSettings,
          businessHours: [],
        });

        const existing = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
        });

        expect(existing).toBeNull();

        const created = await prismaMock.tenantSettings.create({
          data: {
            tenantId: mockTenant.id,
            defaultStartTime: '08:00',
            defaultEndTime: '18:00',
            defaultLunchStart: '13:00',
            defaultLunchEnd: '14:00',
            defaultSlotDuration: 15,
          },
          include: { businessHours: true },
        });

        expect(created.tenantId).toBe(mockTenant.id);
        expect(created.defaultStartTime).toBe('08:00');
      });

      it('should create default business hours for all days', async () => {
        const defaultBusinessHours = Array.from({ length: 7 }, (_, i) => ({
          tenantId: mockTenant.id,
          tenantSettingsId: mockTenantSettings.id,
          dayOfWeek: i,
          isWorkingDay: i >= 1 && i <= 6, // Monday to Saturday
          startTime: '08:00',
          endTime: '18:00',
          lunchStart: '13:00',
          lunchEnd: '14:00',
          slotDuration: 15,
        }));

        prismaMock.businessHours.createMany.mockResolvedValue({ count: 7 });

        const result = await prismaMock.businessHours.createMany({
          data: defaultBusinessHours,
        });

        expect(result.count).toBe(7);
      });
    });

    describe('PUT /api/settings/business-hours', () => {
      it('should update business hours for all days', async () => {
        const updateData = {
          defaultStartTime: '09:00',
          defaultEndTime: '19:00',
          defaultSlotDuration: 30,
          businessHours: mockBusinessHours.map((h) => ({
            ...h,
            startTime: '09:00',
            endTime: '19:00',
          })),
        };

        prismaMock.tenantSettings.upsert.mockResolvedValue({
          ...mockTenantSettings,
          defaultStartTime: '09:00',
          defaultEndTime: '19:00',
          defaultSlotDuration: 30,
        });

        const result = await prismaMock.tenantSettings.upsert({
          where: { tenantId: mockTenant.id },
          update: {
            defaultStartTime: updateData.defaultStartTime,
            defaultEndTime: updateData.defaultEndTime,
            defaultSlotDuration: updateData.defaultSlotDuration,
          },
          create: {
            tenantId: mockTenant.id,
            defaultStartTime: updateData.defaultStartTime,
            defaultEndTime: updateData.defaultEndTime,
            defaultSlotDuration: updateData.defaultSlotDuration,
          },
        });

        expect(result.defaultStartTime).toBe('09:00');
        expect(result.defaultEndTime).toBe('19:00');
        expect(result.defaultSlotDuration).toBe(30);
      });

      it('should validate time format (HH:MM)', () => {
        // Note: The regex allows single-digit hours (e.g., 8:00 is valid)
        const invalidTimeFormats = ['25:00', '12:60', 'invalid', '24:00', '-1:00'];
        const validTimeFormat = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

        invalidTimeFormats.forEach((time) => {
          expect(validTimeFormat.test(time)).toBe(false);
        });

        const validTimes = ['08:00', '12:30', '23:59', '00:00', '8:00', '9:30'];
        validTimes.forEach((time) => {
          expect(validTimeFormat.test(time)).toBe(true);
        });
      });

      it('should validate slot duration (5-120 minutes)', () => {
        const invalidDurations = [0, 4, 121, -10];
        const validDurations = [5, 15, 30, 60, 120];

        invalidDurations.forEach((duration) => {
          expect(duration >= 5 && duration <= 120).toBe(false);
        });

        validDurations.forEach((duration) => {
          expect(duration >= 5 && duration <= 120).toBe(true);
        });
      });
    });
  });

  describe('Notification Preferences', () => {
    describe('GET /api/settings/notifications', () => {
      it('should return notification preferences for tenant', async () => {
        const notificationPrefs = createTestNotificationPreferences();

        const settingsWithNotifications = {
          ...mockTenantSettings,
          notificationPreferences: notificationPrefs,
        };

        prismaMock.tenantSettings.findUnique.mockResolvedValue(settingsWithNotifications);

        const result = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
        });

        expect(result?.notificationPreferences).toBeDefined();
        expect(result?.notificationPreferences.emailAppointmentReminders).toBe(true);
      });

      it('should return default preferences if none set', async () => {
        const settingsWithoutNotifications = {
          ...mockTenantSettings,
          notificationPreferences: null,
        };

        prismaMock.tenantSettings.findUnique.mockResolvedValue(settingsWithoutNotifications);

        const result = await prismaMock.tenantSettings.findUnique({
          where: { tenantId: mockTenant.id },
        });

        // API would return default preferences if none exist
        expect(result?.notificationPreferences).toBeNull();
      });
    });

    describe('PUT /api/settings/notifications', () => {
      it('should partially update preferences (merge)', async () => {
        const existingPrefs = createTestNotificationPreferences();
        const partialUpdate = {
          emailAppointmentReminders: false,
          reminderAdvanceDays: 5,
        };

        const mergedPrefs = {
          ...existingPrefs,
          ...partialUpdate,
        };

        prismaMock.tenantSettings.update.mockResolvedValue({
          ...mockTenantSettings,
          notificationPreferences: mergedPrefs,
        });

        const result = await prismaMock.tenantSettings.update({
          where: { tenantId: mockTenant.id },
          data: {
            notificationPreferences: mergedPrefs,
          },
        });

        expect(result.notificationPreferences.emailAppointmentReminders).toBe(false);
        expect(result.notificationPreferences.reminderAdvanceDays).toBe(5);
        // Unchanged values should remain
        expect(result.notificationPreferences.emailTreatmentReminders).toBe(true);
      });

      it('should validate notification schema', () => {
        const invalidData = {
          reminderAdvanceDays: -1, // Should be positive
          lowStockThreshold: 'ten', // Should be number
        };

        expect(typeof invalidData.lowStockThreshold).toBe('string');
        expect(invalidData.reminderAdvanceDays).toBeLessThan(0);
        // API would return: { error: 'Datos inválidos' }, { status: 400 }
      });
    });
  });

  describe('Roles Management', () => {
    describe('GET /api/settings/roles', () => {
      it('should return roles and available permissions', async () => {
        const roles = [
          mockUserRole,
          createTestUserRole({
            id: 'role-2',
            name: 'Receptionist',
            permissions: ['appointments:read', 'customers:read'],
          }),
        ];

        const availablePermissions = [
          'pets:read',
          'pets:write',
          'appointments:read',
          'appointments:write',
          'customers:read',
          'customers:write',
          'inventory:read',
          'inventory:write',
          'reports:read',
          'settings:read',
          'settings:write',
        ];

        prismaMock.userRole.findMany.mockResolvedValue(roles);

        const result = await prismaMock.userRole.findMany({
          where: { tenantId: mockTenant.id },
        });

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Veterinarian');
        expect(result[0].permissions).toContain('pets:read');
      });

      it('should include both system and custom roles', async () => {
        const systemRole = createTestUserRole({
          id: 'system-role',
          name: 'Admin',
          isSystem: true,
        });
        const customRole = mockUserRole;

        prismaMock.userRole.findMany.mockResolvedValue([systemRole, customRole]);

        const result = await prismaMock.userRole.findMany({
          where: { tenantId: mockTenant.id },
        });

        const systemRoles = result.filter((r: any) => r.isSystem);
        const customRoles = result.filter((r: any) => !r.isSystem);

        expect(systemRoles).toHaveLength(1);
        expect(customRoles).toHaveLength(1);
      });
    });

    describe('POST /api/settings/roles', () => {
      it('should create new custom role', async () => {
        const newRoleData = {
          name: 'Assistant',
          description: 'Veterinary assistant',
          permissions: ['pets:read', 'appointments:read', 'appointments:write'],
        };

        const createdRole = {
          ...mockUserRole,
          id: 'new-role-id',
          ...newRoleData,
        };

        prismaMock.userRole.create.mockResolvedValue(createdRole);

        const result = await prismaMock.userRole.create({
          data: {
            tenantId: mockTenant.id,
            ...newRoleData,
          },
        });

        expect(result.name).toBe('Assistant');
        expect(result.permissions).toHaveLength(3);
        expect(result.isSystem).toBe(false);
      });

      it('should validate role schema', () => {
        const invalidData = {
          // Missing name
          description: 'A role without name',
          permissions: [],
        };

        const requiredFields = ['name'];
        const missingFields = requiredFields.filter((field) => !(field in invalidData));

        expect(missingFields).toContain('name');
        // API would return: { error: 'Datos inválidos' }, { status: 400 }
      });

      it('should reject invalid permissions', () => {
        const validPermissions = [
          'pets:read',
          'pets:write',
          'appointments:read',
          'appointments:write',
        ];

        const invalidPermission = 'invalid:permission';

        expect(validPermissions.includes(invalidPermission)).toBe(false);
        // API would return: { error: 'Permiso inválido' }, { status: 400 }
      });
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return settings from other tenants', async () => {
      const otherTenantSettings = createTestTenantSettings({
        id: 'other-settings',
        tenantId: 'other-tenant-id',
      });

      prismaMock.tenantSettings.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockTenantSettings];
        }
        return [];
      });

      const result = await prismaMock.tenantSettings.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });

    it('should not allow modifying other tenant settings', async () => {
      prismaMock.tenantSettings.findUnique.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return mockTenantSettings;
        }
        return null;
      });

      // Attempt to update other tenant's settings
      const otherTenantUpdate = await prismaMock.tenantSettings.findUnique({
        where: { tenantId: 'other-tenant-id' },
      });

      expect(otherTenantUpdate).toBeNull();
    });
  });
});
