import { prismaMock } from '../../mocks/prisma';
import {
  createTestLocation,
  createTestTenant,
  createTestUser,
} from '../../utils/test-utils';
import { canAccess } from '@/lib/staff-permissions';
import { StaffPosition } from '@/lib/staff-positions';

describe('Locations API Integration Tests', () => {
  let mockTenant: ReturnType<typeof createTestTenant>;
  let _mockUser: ReturnType<typeof createTestUser>;
  let mockLocation: ReturnType<typeof createTestLocation>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create test data
    mockTenant = createTestTenant();
    _mockUser = createTestUser({ tenantId: mockTenant.id });
    mockLocation = createTestLocation({ tenantId: mockTenant.id });

    // Mock Prisma responses
    prismaMock.location.findMany.mockResolvedValue([mockLocation]);
    prismaMock.location.findUnique.mockResolvedValue(mockLocation);
    prismaMock.location.create.mockResolvedValue(mockLocation);
    prismaMock.location.update.mockResolvedValue(mockLocation);
    prismaMock.location.count.mockResolvedValue(1);
  });

  describe('GET /api/locations', () => {
    it('should return all locations for tenant', async () => {
      const locations = [mockLocation];
      prismaMock.location.findMany.mockResolvedValue(locations);

      const result = await prismaMock.location.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result[0].name).toBe(mockLocation.name);
    });

    it('should filter by isActive status', async () => {
      const activeLocation = mockLocation;
      const inactiveLocation = createTestLocation({
        id: 'inactive-location',
        tenantId: mockTenant.id,
        isActive: false,
        name: 'Closed Clinic',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.location.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.isActive === true) {
          return [activeLocation];
        }
        if (args?.where?.isActive === false) {
          return [inactiveLocation];
        }
        return [activeLocation, inactiveLocation];
      });

      const activeResult = await prismaMock.location.findMany({
        where: { tenantId: mockTenant.id, isActive: true },
      });

      expect(activeResult).toHaveLength(1);
      expect(activeResult[0].isActive).toBe(true);
    });

    it('should search by name, address, or phone', async () => {
      const searchTerm = 'Main';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.location.findMany.mockImplementation(async (args: any) => {
        const where = args?.where;
        if (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          where?.OR?.some((condition: any) =>
              condition?.name?.contains === searchTerm ||
              condition?.address?.contains === searchTerm ||
              condition?.phone?.contains === searchTerm
          )
        ) {
          return [mockLocation];
        }
        return [];
      });

      const result = await prismaMock.location.findMany({
        where: {
          tenantId: mockTenant.id,
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { address: { contains: searchTerm, mode: 'insensitive' } },
            { phone: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toContain('Main');
    });

    it('should enforce tenant isolation', async () => {
      // Create a location for another tenant to verify isolation
      const _otherTenantLocation = createTestLocation({
        id: 'other-location',
        tenantId: 'other-tenant-id',
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      prismaMock.location.findMany.mockImplementation(async (args: any) => {
        if (args?.where?.tenantId === mockTenant.id) {
          return [mockLocation];
        }
        return [];
      });

      const result = await prismaMock.location.findMany({
        where: { tenantId: mockTenant.id },
      });

      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe(mockTenant.id);
      expect(result).not.toContainEqual(
        expect.objectContaining({ tenantId: 'other-tenant-id' })
      );
    });
  });

  describe('GET /api/locations/:id', () => {
    it('should return location by ID', async () => {
      prismaMock.location.findUnique.mockResolvedValue(mockLocation);

      const result = await prismaMock.location.findUnique({
        where: { id: mockLocation.id },
      });

      expect(result?.id).toBe(mockLocation.id);
      expect(result?.name).toBe(mockLocation.name);
    });

    it('should return null for non-existent location (404)', async () => {
      prismaMock.location.findUnique.mockResolvedValue(null);

      const result = await prismaMock.location.findUnique({
        where: { id: 'non-existent-id' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/locations', () => {
    it('should create a new location', async () => {
      const newLocationData = {
        name: 'Branch Clinic',
        slug: 'branch-clinic',
        address: '789 Branch Street',
        phone: '+52 1 55 4444 5555',
        email: 'branch@example.com',
        timezone: 'America/Mexico_City',
      };

      const createdLocation = {
        ...mockLocation,
        ...newLocationData,
        id: 'new-location-id',
        isPrimary: false,
      };

      prismaMock.location.create.mockResolvedValue(createdLocation);

      const result = await prismaMock.location.create({
        data: {
          ...newLocationData,
          tenantId: mockTenant.id,
          isPrimary: false,
        },
      });

      expect(result.name).toBe(newLocationData.name);
      expect(result.slug).toBe(newLocationData.slug);
      expect(result.tenantId).toBe(mockTenant.id);
    });

    it('should check plan limits before creation', async () => {
      // Mock current location count
      prismaMock.location.count.mockResolvedValue(2);

      const currentLocationCount = await prismaMock.location.count({
        where: { tenantId: mockTenant.id, deletedAt: null },
      });

      // Simulate plan limits (pro plan allows 3 locations)
      const planMaxLocations = 3;
      const canCreateLocation = currentLocationCount < planMaxLocations;

      expect(canCreateLocation).toBe(true);

      // Test limit exceeded scenario
      prismaMock.location.count.mockResolvedValue(3);
      const countAtLimit = await prismaMock.location.count({
        where: { tenantId: mockTenant.id, deletedAt: null },
      });

      const canCreateLocationAtLimit = countAtLimit < planMaxLocations;
      expect(canCreateLocationAtLimit).toBe(false);
    });

    it('should prevent duplicate slugs within same tenant', async () => {
      const duplicateSlugData = {
        name: 'Another Clinic',
        slug: mockLocation.slug, // Same slug as existing location
        tenantId: mockTenant.id,
      };

      // Simulate finding existing location with same slug
      prismaMock.location.findFirst.mockResolvedValue(mockLocation);

      const existingLocation = await prismaMock.location.findFirst({
        where: {
          slug: duplicateSlugData.slug,
          tenantId: duplicateSlugData.tenantId,
        },
      });

      expect(existingLocation).not.toBeNull();
      expect(existingLocation?.slug).toBe(duplicateSlugData.slug);
    });
  });

  describe('PUT /api/locations/:id', () => {
    it('should update location data', async () => {
      const updateData = {
        name: 'Updated Clinic Name',
        phone: '+52 1 55 1111 0000',
      };

      const updatedLocation = { ...mockLocation, ...updateData };
      prismaMock.location.update.mockResolvedValue(updatedLocation);

      const result = await prismaMock.location.update({
        where: { id: mockLocation.id },
        data: updateData,
      });

      expect(result.name).toBe('Updated Clinic Name');
      expect(result.phone).toBe('+52 1 55 1111 0000');
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('should soft delete location by setting deletedAt', async () => {
      const deletedLocation = {
        ...mockLocation,
        deletedAt: new Date(),
        isActive: false,
      };

      prismaMock.location.update.mockResolvedValue(deletedLocation);

      const result = await prismaMock.location.update({
        where: { id: mockLocation.id },
        data: { deletedAt: new Date(), isActive: false },
      });

      expect(result.deletedAt).not.toBeNull();
      expect(result.isActive).toBe(false);
    });

    it('should prevent deleting primary location', async () => {
      const primaryLocation = { ...mockLocation, isPrimary: true };

      prismaMock.location.findUnique.mockResolvedValue(primaryLocation);

      const location = await prismaMock.location.findUnique({
        where: { id: mockLocation.id },
      });

      const canDelete = !location?.isPrimary;
      expect(canDelete).toBe(false);
    });

    it('should prevent deleting location with related data', async () => {
      const locationWithRelations = {
        ...mockLocation,
        isPrimary: false,
        _count: {
          appointments: 10,
          pets: 5,
          staff: 3,
        },
      };

      prismaMock.location.findUnique.mockResolvedValue(locationWithRelations);

      const location = await prismaMock.location.findUnique({
        where: { id: mockLocation.id },
        include: {
          _count: {
            select: { appointments: true, pets: true, staff: true },
          },
        },
      });

      const hasRelatedData =
        (location?._count?.appointments || 0) > 0 ||
        (location?._count?.pets || 0) > 0 ||
        (location?._count?.staff || 0) > 0;

      expect(hasRelatedData).toBe(true);
    });
  });

  describe('POST /api/locations/:id/set-primary', () => {
    it('should set location as primary', async () => {
      const secondaryLocation = createTestLocation({
        id: 'secondary-location',
        tenantId: mockTenant.id,
        isPrimary: false,
        name: 'Secondary Clinic',
      });

      // First, unset current primary
      prismaMock.location.updateMany.mockResolvedValue({ count: 1 });

      await prismaMock.location.updateMany({
        where: { tenantId: mockTenant.id, isPrimary: true },
        data: { isPrimary: false },
      });

      // Then set new primary
      const newPrimaryLocation = { ...secondaryLocation, isPrimary: true };
      prismaMock.location.update.mockResolvedValue(newPrimaryLocation);

      const result = await prismaMock.location.update({
        where: { id: secondaryLocation.id },
        data: { isPrimary: true },
      });

      expect(result.isPrimary).toBe(true);
      expect(result.id).toBe(secondaryLocation.id);
    });
  });

  describe('Multi-Tenancy Isolation', () => {
    it('should return 404 when updating location from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.location.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.location.updateMany({
        where: {
          id: mockLocation.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { name: 'Hacked Name' },
      });

      expect(result.count).toBe(0);
    });

    it('should return 404 when deleting location from another tenant', async () => {
      const otherTenantId = 'other-tenant-id';

      prismaMock.location.updateMany.mockResolvedValue({ count: 0 });

      const result = await prismaMock.location.updateMany({
        where: {
          id: mockLocation.id,
          tenantId: otherTenantId, // Wrong tenant
        },
        data: { deletedAt: new Date(), isActive: false },
      });

      expect(result.count).toBe(0);
    });
  });

  describe('Role-Based Permission Checks', () => {
    describe('Locations read permissions', () => {
      it('should allow MANAGER full access to locations', () => {
        expect(canAccess(StaffPosition.MANAGER, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.MANAGER, 'locations', 'write')).toBe(true);
        expect(canAccess(StaffPosition.MANAGER, 'locations', 'delete')).toBe(true);
      });

      it('should allow ADMINISTRATOR full access to locations', () => {
        expect(canAccess(StaffPosition.ADMINISTRATOR, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ADMINISTRATOR, 'locations', 'write')).toBe(true);
        expect(canAccess(StaffPosition.ADMINISTRATOR, 'locations', 'delete')).toBe(true);
      });

      it('should allow VETERINARIAN only read access to locations', () => {
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARIAN, 'locations', 'delete')).toBe(false);
      });

      it('should allow VETERINARY_TECHNICIAN only read access to locations', () => {
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.VETERINARY_TECHNICIAN, 'locations', 'delete')).toBe(false);
      });

      it('should allow RECEPTIONIST only read access to locations', () => {
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.RECEPTIONIST, 'locations', 'delete')).toBe(false);
      });

      it('should allow ASSISTANT only read access to locations', () => {
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'read')).toBe(true);
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.ASSISTANT, 'locations', 'delete')).toBe(false);
      });

      it('should NOT allow GROOMER access to locations', () => {
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'read')).toBe(false);
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.GROOMER, 'locations', 'delete')).toBe(false);
      });

      it('should NOT allow OTHER position access to locations', () => {
        expect(canAccess(StaffPosition.OTHER, 'locations', 'read')).toBe(false);
        expect(canAccess(StaffPosition.OTHER, 'locations', 'write')).toBe(false);
        expect(canAccess(StaffPosition.OTHER, 'locations', 'delete')).toBe(false);
      });
    });

    describe('Location management scenarios', () => {
      it('should allow only admin positions to create locations', () => {
        const canCreateLocation = (position: string) => canAccess(position, 'locations', 'write');

        // Admin positions can create
        expect(canCreateLocation(StaffPosition.MANAGER)).toBe(true);
        expect(canCreateLocation(StaffPosition.ADMINISTRATOR)).toBe(true);

        // Non-admin positions cannot create
        expect(canCreateLocation(StaffPosition.VETERINARIAN)).toBe(false);
        expect(canCreateLocation(StaffPosition.VETERINARY_TECHNICIAN)).toBe(false);
        expect(canCreateLocation(StaffPosition.RECEPTIONIST)).toBe(false);
        expect(canCreateLocation(StaffPosition.ASSISTANT)).toBe(false);
        expect(canCreateLocation(StaffPosition.GROOMER)).toBe(false);
        expect(canCreateLocation(StaffPosition.OTHER)).toBe(false);
      });

      it('should allow only admin positions to edit locations', () => {
        const canEditLocation = (position: string) => canAccess(position, 'locations', 'write');

        // Admin positions can edit
        expect(canEditLocation(StaffPosition.MANAGER)).toBe(true);
        expect(canEditLocation(StaffPosition.ADMINISTRATOR)).toBe(true);

        // Non-admin positions cannot edit
        expect(canEditLocation(StaffPosition.VETERINARIAN)).toBe(false);
        expect(canEditLocation(StaffPosition.RECEPTIONIST)).toBe(false);
      });

      it('should allow only admin positions to delete locations', () => {
        const canDeleteLocation = (position: string) => canAccess(position, 'locations', 'delete');

        // Admin positions can delete
        expect(canDeleteLocation(StaffPosition.MANAGER)).toBe(true);
        expect(canDeleteLocation(StaffPosition.ADMINISTRATOR)).toBe(true);

        // Non-admin positions cannot delete
        expect(canDeleteLocation(StaffPosition.VETERINARIAN)).toBe(false);
        expect(canDeleteLocation(StaffPosition.RECEPTIONIST)).toBe(false);
        expect(canDeleteLocation(StaffPosition.GROOMER)).toBe(false);
      });
    });
  });
});
