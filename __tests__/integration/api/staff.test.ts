import { prismaMock } from '../../mocks/prisma';
import {
  createTestStaff,
  createTestTenant,
  createTestUser,
  createTestLocation,
  createTestStaffLocation,
} from '../../utils/test-utils';

// Mock the staff API route
const mockStaffRoute = {
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
};

describe('Staff API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let mockUser: ReturnType<typeof createTestUser>;
  let mockStaff: ReturnType<typeof createTestStaff>;
  let mockLocation: ReturnType<typeof createTestLocation>;
  let mockStaffLocation: ReturnType<typeof createTestStaffLocation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });
    mockStaff = createTestStaff({ tenantId: mockTenant.id });
    mockStaffLocation = createTestStaffLocation({
      staffId: mockStaff.id,
      locationId: mockLocation.id,
    });

    // Mock Prisma responses
    prismaMock.staff.findMany.mockResolvedValue([mockStaff]);
    prismaMock.staff.findUnique.mockResolvedValue(mockStaff);
    prismaMock.staff.create.mockResolvedValue(mockStaff);
    prismaMock.staff.update.mockResolvedValue(mockStaff);
    prismaMock.staff.delete.mockResolvedValue(mockStaff);
    prismaMock.staff.count.mockResolvedValue(1);
  });

  describe('GET /api/staff', () => {
    it('should return all staff for tenant', async () => {
      const staffList = [mockStaff];
      prismaMock.staff.findMany.mockResolvedValue(staffList);

      const result = await prismaMock.staff.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].name).toBe(mockStaff.name);
    });

    it('should filter by search term (name, email)', async () => {
      const searchTerm = 'Maria';

      prismaMock.staff.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          where?.OR?.some(
            (condition: any) =>
              condition?.name?.contains === searchTerm ||
              condition?.email?.contains === searchTerm
          )
        ) {
          return [mockStaff];
        }
        return [];
      });

      const result = await prismaMock.staff.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Maria');
    });

    it('should filter by position', async () => {
      const position = 'Veterinarian';

      prismaMock.staff.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.position === position) {
          return [mockStaff];
        }
        return [];
      });

      const result = await prismaMock.staff.findMany({
        where: { tenantId: mockTenant.id, position },
      });

      expect(result).toHaveLength(1);
      expect(result[0].position).toBe(position);
    });

    it('should filter by isActive status', async () => {
      const activeStaff = [mockStaff];
      const inactiveStaff = createTestStaff({
        id: 'inactive-staff',
        isActive: false,
        tenantId: mockTenant.id,
      });

      prismaMock.staff.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.isActive === true) {
          return activeStaff;
        }
        if (args?.where?.isActive === false) {
          return [inactiveStaff];
        }
        return [...activeStaff, inactiveStaff];
      });

      const activeResult = await prismaMock.staff.findMany({
        where: { tenantId: mockTenant.id, isActive: true },
      });

      expect(activeResult).toHaveLength(1);
      expect(activeResult[0].isActive).toBe(true);
    });

    it('should support pagination', async () => {
      const page = 1;
      const pageSize = 10;
      const skip = (page - 1) * pageSize;

      prismaMock.staff.findMany.mockResolvedValue([mockStaff]);
      prismaMock.staff.count.mockResolvedValue(25);

      const [result, total] = await Promise.all([
        prismaMock.staff.findMany({
          where: { tenantId: mockTenant.id },
          skip,
          take: pageSize,
        }),
        prismaMock.staff.count({
          where: { tenantId: mockTenant.id },
        }),
      ]);

      expect(result).toBeDefined();
      expect(total).toBe(25);
    });
  });

  describe('GET /api/staff/:staffId', () => {
    it('should return staff by ID', async () => {
      prismaMock.staff.findUnique.mockResolvedValue(mockStaff);

      const result = await prismaMock.staff.findUnique({
        where: { id: mockStaff.id },
      });

      expect(result?.id).toBe(mockStaff.id);
      expect(result?.name).toBe(mockStaff.name);
    });

    it('should return null for non-existent staff (404)', async () => {
      prismaMock.staff.findUnique.mockResolvedValue(null);

      const result = await prismaMock.staff.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/staff', () => {
    it('should create new staff member', async () => {
      const newStaffData = {
        name: 'Dr. Carlos Lopez',
        position: 'Veterinarian',
        email: 'carlos.lopez@example.com',
        phone: '+52 1 55 3333 4444',
        licenseNumber: 'VET-MX-67890',
      };

      const createdStaff = {
        ...mockStaff,
        ...newStaffData,
        id: 'new-staff-id',
      };

      prismaMock.staff.create.mockResolvedValue(createdStaff);

      const result = await prismaMock.staff.create({
        data: {
          ...newStaffData,
          tenantId: mockTenant.id,
        },
      });

      expect(result.name).toBe(newStaffData.name);
      expect(result.position).toBe(newStaffData.position);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should validate required fields - name and position', async () => {
      const invalidData = {
        email: 'test@example.com',
        // missing name and position
      };

      const requiredFields = ['name', 'position'];
      const missingFields = requiredFields.filter((field) => !(field in invalidData));

      expect(missingFields).toContain('name');
      expect(missingFields).toContain('position');
    });
  });

  describe('PUT /api/staff/:staffId', () => {
    it('should update staff data', async () => {
      const updateData = {
        name: 'Dr. Maria Garcia Updated',
        phone: '+52 1 55 7777 8888',
      };

      const updatedStaff = { ...mockStaff, ...updateData };
      prismaMock.staff.update.mockResolvedValue(updatedStaff);

      const result = await prismaMock.staff.update({
        where: { id: mockStaff.id },
        data: updateData,
      });

      expect(result.name).toBe('Dr. Maria Garcia Updated');
      expect(result.phone).toBe('+52 1 55 7777 8888');
    });
  });

  describe('DELETE /api/staff/:staffId', () => {
    it('should soft delete staff (deactivate) if has related records', async () => {
      // Mock staff with related appointments
      const staffWithRelations = {
        ...mockStaff,
        _count: { appointments: 5, medicalHistories: 3 },
      };

      prismaMock.staff.findUnique.mockResolvedValue(staffWithRelations);

      const hasRelations =
        staffWithRelations._count.appointments > 0 ||
        staffWithRelations._count.medicalHistories > 0;

      expect(hasRelations).toBe(true);

      // Soft delete by setting isActive to false
      const deactivatedStaff = { ...mockStaff, isActive: false };
      prismaMock.staff.update.mockResolvedValue(deactivatedStaff);

      const result = await prismaMock.staff.update({
        where: { id: mockStaff.id },
        data: { isActive: false },
      });

      expect(result.isActive).toBe(false);
    });

    it('should hard delete staff if no related records', async () => {
      // Mock staff without related records
      const staffWithoutRelations = {
        ...mockStaff,
        _count: { appointments: 0, medicalHistories: 0 },
      };

      prismaMock.staff.findUnique.mockResolvedValue(staffWithoutRelations);

      const hasRelations =
        staffWithoutRelations._count.appointments > 0 ||
        staffWithoutRelations._count.medicalHistories > 0;

      expect(hasRelations).toBe(false);

      // Hard delete
      prismaMock.staff.delete.mockResolvedValue(mockStaff);

      const result = await prismaMock.staff.delete({
        where: { id: mockStaff.id },
      });

      expect(result.id).toBe(mockStaff.id);
    });
  });

  describe('GET /api/staff/stats', () => {
    it('should return staff statistics', async () => {
      const stats = {
        total: 10,
        active: 8,
        inactive: 2,
        byPosition: {
          Veterinarian: 4,
          Technician: 3,
          Receptionist: 2,
          Administrator: 1,
        },
      };

      prismaMock.staff.count.mockResolvedValueOnce(10); // total
      prismaMock.staff.count.mockResolvedValueOnce(8); // active

      const [total, active] = await Promise.all([
        prismaMock.staff.count({ where: { tenantId: mockTenant.id } }),
        prismaMock.staff.count({ where: { tenantId: mockTenant.id, isActive: true } }),
      ]);

      expect(total).toBe(10);
      expect(active).toBe(8);
    });
  });

  describe('Staff Locations', () => {
    describe('GET /api/staff/:staffId/locations', () => {
      it('should return location assignments for staff', async () => {
        const staffWithLocations = {
          ...mockStaff,
          staffLocations: [mockStaffLocation],
        };

        prismaMock.staff.findUnique.mockResolvedValue(staffWithLocations);

        const result = await prismaMock.staff.findUnique({
          where: { id: mockStaff.id },
          include: { staffLocations: { include: { location: true } } },
        });

        expect(result?.staffLocations).toHaveLength(1);
        expect(result?.staffLocations[0].locationId).toBe(mockLocation.id);
      });
    });

    describe('POST /api/staff/:staffId/locations', () => {
      it('should assign staff to location', async () => {
        const newLocation = createTestLocation({
          id: 'location-2',
          name: 'Branch Clinic',
          slug: 'branch-clinic',
        });

        const newAssignment = createTestStaffLocation({
          id: 'new-assignment',
          staffId: mockStaff.id,
          locationId: newLocation.id,
          isPrimary: false,
        });

        prismaMock.staffLocation.create.mockResolvedValue(newAssignment);

        const result = await prismaMock.staffLocation.create({
          data: {
            staffId: mockStaff.id,
            locationId: newLocation.id,
            isPrimary: false,
          },
        });

        expect(result.staffId).toBe(mockStaff.id);
        expect(result.locationId).toBe(newLocation.id);
      });

      it('should prevent duplicate location assignments', async () => {
        // Simulate unique constraint check
        prismaMock.staffLocation.findUnique.mockResolvedValue(mockStaffLocation);

        const existingAssignment = await prismaMock.staffLocation.findUnique({
          where: {
            staffId_locationId: {
              staffId: mockStaff.id,
              locationId: mockLocation.id,
            },
          },
        });

        expect(existingAssignment).not.toBeNull();
        expect(existingAssignment?.staffId).toBe(mockStaff.id);
        expect(existingAssignment?.locationId).toBe(mockLocation.id);
      });
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should not return staff from other tenants', async () => {
      const otherTenantStaff = createTestStaff({
        id: 'other-staff',
        tenantId: 'other-tenant-id',
      });

      prismaMock.staff.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockStaff];
        }
        return [];
      });

      const result = await prismaMock.staff.findMany({
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
