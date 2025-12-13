/**
 * @file Location Management Tests - VETIF-56
 * @description Comprehensive tests for src/lib/locations.ts
 *
 * Test Categories:
 * 1. Location CRUD Operations
 * 2. Staff-Location Assignment Operations
 * 3. Inventory Transfer Operations
 * 4. Permission Helpers
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Decimal } from '@prisma/client/runtime/library';
import { prismaMock } from '../../mocks/prisma';
import {
  createTestLocation,
  createTestStaff,
  createTestStaffLocation,
  createTestInventoryItem,
  createTestInventoryTransfer,
} from '../../utils/test-utils';

// Mock server-only module BEFORE any imports
jest.mock('server-only', () => ({}));

// Mock plan-limits module
jest.mock('@/lib/plan-limits', () => ({
  checkLocationLimit: jest.fn(),
}));

// Import the module under test after mocks
import {
  getLocationsByTenant,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  setPrimaryLocation,
  getPrimaryLocation,
  getLocationStats,
  assignStaffToLocation,
  removeStaffFromLocation,
  getStaffLocations,
  getLocationStaff,
  staffHasAccessToLocation,
  createInventoryTransfer,
  completeInventoryTransfer,
  cancelInventoryTransfer,
  getInventoryTransfers,
  getStaffLocationIds,
  getStaffPrimaryLocationId,
  filterByStaffLocations,
  hasAnyLocationAssignment,
  requireLocationAccess,
  generateSlug,
} from '@/lib/locations';

import { checkLocationLimit } from '@/lib/plan-limits';

const mockCheckLocationLimit = checkLocationLimit as jest.MockedFunction<
  typeof checkLocationLimit
>;

describe('Location Management (src/lib/locations.ts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================================
  // CRUD Operations
  // ==========================================================================
  describe('CRUD Operations', () => {
    describe('getLocationsByTenant', () => {
      it('should return all locations for a tenant', async () => {
        const mockLocations = [
          {
            ...createTestLocation({ isPrimary: true }),
            _count: { staff: 2, pets: 10, appointments: 5, inventoryItems: 20 },
          },
          {
            ...createTestLocation({ id: 'location-2', name: 'Branch', isPrimary: false }),
            _count: { staff: 1, pets: 3, appointments: 2, inventoryItems: 8 },
          },
        ];

        prismaMock.location.findMany.mockResolvedValue(mockLocations as any);

        const result = await getLocationsByTenant('tenant-1');

        expect(prismaMock.location.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1' },
          include: {
            _count: {
              select: {
                staff: true,
                pets: true,
                appointments: true,
                inventoryItems: true,
              },
            },
          },
          orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        });
        expect(result).toHaveLength(2);
      });

      it('should filter by isActive status', async () => {
        prismaMock.location.findMany.mockResolvedValue([]);

        await getLocationsByTenant('tenant-1', { isActive: true });

        expect(prismaMock.location.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { tenantId: 'tenant-1', isActive: true },
          })
        );
      });

      it('should filter by search term', async () => {
        prismaMock.location.findMany.mockResolvedValue([]);

        await getLocationsByTenant('tenant-1', { search: 'clinic' });

        expect(prismaMock.location.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: 'tenant-1',
              OR: expect.arrayContaining([
                { name: { contains: 'clinic', mode: 'insensitive' } },
                { address: { contains: 'clinic', mode: 'insensitive' } },
                { phone: { contains: 'clinic' } },
              ]),
            }),
          })
        );
      });

      it('should return empty array when no locations exist', async () => {
        prismaMock.location.findMany.mockResolvedValue([]);

        const result = await getLocationsByTenant('tenant-1');

        expect(result).toEqual([]);
      });
    });

    describe('getLocationById', () => {
      it('should return location with counts when found', async () => {
        const mockLocation = {
          ...createTestLocation(),
          _count: {
            staff: 2,
            pets: 10,
            appointments: 5,
            customers: 8,
            inventoryItems: 20,
            cashDrawers: 1,
            services: 15,
            businessHours: 7,
          },
        };

        prismaMock.location.findFirst.mockResolvedValue(mockLocation as any);

        const result = await getLocationById('location-1', 'tenant-1');

        expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
          where: { id: 'location-1', tenantId: 'tenant-1' },
          include: {
            _count: {
              select: {
                staff: true,
                pets: true,
                appointments: true,
                customers: true,
                inventoryItems: true,
                cashDrawers: true,
                services: true,
                businessHours: true,
              },
            },
          },
        });
        expect(result).toEqual(mockLocation);
      });

      it('should return null when location not found', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        const result = await getLocationById('non-existent', 'tenant-1');

        expect(result).toBeNull();
      });

      it('should not return location from different tenant', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        const result = await getLocationById('location-1', 'wrong-tenant');

        expect(result).toBeNull();
      });
    });

    describe('createLocation', () => {
      const validInput = {
        name: 'New Clinic',
        slug: 'new-clinic',
        address: '123 Main St',
        phone: '+52 55 1234 5678',
        email: 'new@clinic.com',
        timezone: 'America/Mexico_City',
        isActive: true,
        isPrimary: false,
      };

      beforeEach(() => {
        mockCheckLocationLimit.mockResolvedValue({
          canAdd: true,
          current: 0,
          limit: 10,
          remaining: 10,
          requiresUpgrade: false,
        });
      });

      it('should create location successfully', async () => {
        const createdLocation = createTestLocation(validInput);

        prismaMock.location.findUnique.mockResolvedValue(null);
        prismaMock.location.create.mockResolvedValue(createdLocation as any);

        const result = await createLocation('tenant-1', validInput);

        expect(prismaMock.location.create).toHaveBeenCalledWith({
          data: {
            ...validInput,
            tenantId: 'tenant-1',
          },
        });
        expect(result).toEqual(createdLocation);
      });

      it('should throw error when slug already exists', async () => {
        prismaMock.location.findUnique.mockResolvedValue(createTestLocation() as any);

        await expect(createLocation('tenant-1', validInput)).rejects.toThrow(
          'Ya existe una ubicación con este slug'
        );
      });

      it('should throw error when plan limit reached (Basic plan)', async () => {
        prismaMock.location.findUnique.mockResolvedValue(null);
        mockCheckLocationLimit.mockResolvedValue({
          canAdd: false,
          current: 1,
          limit: 1,
          remaining: 0,
          requiresUpgrade: true,
        });

        await expect(createLocation('tenant-1', validInput)).rejects.toThrow(
          'Plan limit reached: El Plan Básico solo permite 1 ubicación'
        );
      });

      it('should throw error when plan limit reached (other plans)', async () => {
        prismaMock.location.findUnique.mockResolvedValue(null);
        mockCheckLocationLimit.mockResolvedValue({
          canAdd: false,
          current: 5,
          limit: 5,
          remaining: 0,
          requiresUpgrade: false,
        });

        await expect(createLocation('tenant-1', validInput)).rejects.toThrow(
          'Has alcanzado el límite de ubicaciones de tu plan'
        );
      });

      it('should unset other primary locations when creating as primary', async () => {
        const primaryInput = { ...validInput, isPrimary: true };
        const createdLocation = createTestLocation(primaryInput);

        prismaMock.location.findUnique.mockResolvedValue(null);
        prismaMock.location.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.location.create.mockResolvedValue(createdLocation as any);

        await createLocation('tenant-1', primaryInput);

        expect(prismaMock.location.updateMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1', isPrimary: true },
          data: { isPrimary: false },
        });
      });

      it('should validate required fields', async () => {
        const invalidInput = { name: '', slug: '' };

        await expect(createLocation('tenant-1', invalidInput as any)).rejects.toThrow();
      });

      it('should validate slug format', async () => {
        const invalidSlug = { ...validInput, slug: 'Invalid Slug!' };

        await expect(createLocation('tenant-1', invalidSlug)).rejects.toThrow();
      });
    });

    describe('updateLocation', () => {
      const updateInput = {
        name: 'Updated Clinic',
        address: '456 New St',
      };

      it('should update location successfully', async () => {
        const existingLocation = {
          ...createTestLocation(),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };
        const updatedLocation = { ...existingLocation, ...updateInput };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.location.update.mockResolvedValue(updatedLocation as any);

        const result = await updateLocation('location-1', 'tenant-1', updateInput);

        expect(prismaMock.location.update).toHaveBeenCalledWith({
          where: { id: 'location-1' },
          data: updateInput,
        });
        expect(result.name).toBe('Updated Clinic');
      });

      it('should throw error when location not found', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        await expect(updateLocation('non-existent', 'tenant-1', updateInput)).rejects.toThrow(
          'Ubicación no encontrada'
        );
      });

      it('should check slug uniqueness when updating slug', async () => {
        const existingLocation = {
          ...createTestLocation({ slug: 'old-slug' }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.location.findUnique.mockResolvedValue(createTestLocation({ slug: 'new-slug' }) as any);

        await expect(
          updateLocation('location-1', 'tenant-1', { slug: 'new-slug' })
        ).rejects.toThrow('Ya existe una ubicación con este slug');
      });

      it('should allow same slug on update (no change)', async () => {
        const existingLocation = {
          ...createTestLocation({ slug: 'same-slug' }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.location.update.mockResolvedValue(existingLocation as any);

        // Should not check uniqueness since slug hasn't changed
        await updateLocation('location-1', 'tenant-1', { slug: 'same-slug' });

        expect(prismaMock.location.findUnique).not.toHaveBeenCalled();
      });

      it('should unset other primary locations when setting as primary', async () => {
        const existingLocation = {
          ...createTestLocation({ isPrimary: false }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.location.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.location.update.mockResolvedValue({ ...existingLocation, isPrimary: true } as any);

        await updateLocation('location-1', 'tenant-1', { isPrimary: true });

        expect(prismaMock.location.updateMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1', isPrimary: true, id: { not: 'location-1' } },
          data: { isPrimary: false },
        });
      });
    });

    describe('deleteLocation', () => {
      it('should soft delete location successfully', async () => {
        const existingLocation = {
          ...createTestLocation({ isPrimary: false }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.location.update.mockResolvedValue({
          ...existingLocation,
          isActive: false,
          deletedAt: new Date(),
        } as any);

        const result = await deleteLocation('location-1', 'tenant-1');

        expect(prismaMock.location.update).toHaveBeenCalledWith({
          where: { id: 'location-1' },
          data: {
            isActive: false,
            deletedAt: expect.any(Date),
          },
        });
        expect(result.isActive).toBe(false);
      });

      it('should throw error when location not found', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        await expect(deleteLocation('non-existent', 'tenant-1')).rejects.toThrow(
          'Ubicación no encontrada'
        );
      });

      it('should throw error when trying to delete primary location', async () => {
        const primaryLocation = {
          ...createTestLocation({ isPrimary: true }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(primaryLocation as any);

        await expect(deleteLocation('location-1', 'tenant-1')).rejects.toThrow(
          'No puedes eliminar la ubicación principal'
        );
      });

      it('should throw error when location has related data', async () => {
        const locationWithData = {
          ...createTestLocation({ isPrimary: false }),
          _count: { staff: 2, pets: 5, appointments: 3, customers: 0, inventoryItems: 10, cashDrawers: 0, services: 0, businessHours: 0 },
        };

        prismaMock.location.findFirst.mockResolvedValue(locationWithData as any);

        await expect(deleteLocation('location-1', 'tenant-1')).rejects.toThrow(
          'Esta ubicación tiene 2 staff, 5 mascotas, 3 citas, y 10 items de inventario'
        );
      });
    });

    describe('setPrimaryLocation', () => {
      it('should set location as primary atomically', async () => {
        const existingLocation = {
          ...createTestLocation({ isPrimary: false }),
          _count: { staff: 0, pets: 0, appointments: 0, customers: 0, inventoryItems: 0, cashDrawers: 0, services: 0, businessHours: 0 },
        };
        const updatedLocation = { ...existingLocation, isPrimary: true };

        prismaMock.location.findFirst.mockResolvedValue(existingLocation as any);
        prismaMock.$transaction.mockResolvedValue([{ count: 1 }, updatedLocation]);

        const result = await setPrimaryLocation('location-1', 'tenant-1');

        expect(prismaMock.$transaction).toHaveBeenCalled();
        expect(result.isPrimary).toBe(true);
      });

      it('should throw error when location not found', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        await expect(setPrimaryLocation('non-existent', 'tenant-1')).rejects.toThrow(
          'Ubicación no encontrada'
        );
      });
    });

    describe('getPrimaryLocation', () => {
      it('should return primary location', async () => {
        const primaryLocation = createTestLocation({ isPrimary: true });

        prismaMock.location.findFirst.mockResolvedValue(primaryLocation as any);

        const result = await getPrimaryLocation('tenant-1');

        expect(prismaMock.location.findFirst).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1', isPrimary: true, isActive: true },
        });
        expect(result?.isPrimary).toBe(true);
      });

      it('should return null when no primary location', async () => {
        prismaMock.location.findFirst.mockResolvedValue(null);

        const result = await getPrimaryLocation('tenant-1');

        expect(result).toBeNull();
      });
    });

    describe('getLocationStats', () => {
      it('should return accurate statistics', async () => {
        const primaryLocation = { id: 'location-1', name: 'Main Clinic' };

        prismaMock.location.count
          .mockResolvedValueOnce(5) // total
          .mockResolvedValueOnce(4); // active
        prismaMock.location.findFirst.mockResolvedValue(primaryLocation as any);

        const result = await getLocationStats('tenant-1');

        expect(result).toEqual({
          total: 5,
          active: 4,
          inactive: 1,
          primary: primaryLocation,
        });
      });

      it('should handle no locations', async () => {
        prismaMock.location.count
          .mockResolvedValueOnce(0)
          .mockResolvedValueOnce(0);
        prismaMock.location.findFirst.mockResolvedValue(null);

        const result = await getLocationStats('tenant-1');

        expect(result).toEqual({
          total: 0,
          active: 0,
          inactive: 0,
          primary: null,
        });
      });
    });
  });

  // ==========================================================================
  // Staff-Location Assignment Operations
  // ==========================================================================
  describe('Staff-Location Assignment Operations', () => {
    describe('assignStaffToLocation', () => {
      it('should create new assignment', async () => {
        const assignment = createTestStaffLocation({ isPrimary: false });

        prismaMock.staffLocation.upsert.mockResolvedValue(assignment as any);

        const result = await assignStaffToLocation('staff-1', 'location-1', false);

        expect(prismaMock.staffLocation.upsert).toHaveBeenCalledWith({
          where: {
            staffId_locationId: {
              staffId: 'staff-1',
              locationId: 'location-1',
            },
          },
          create: {
            staffId: 'staff-1',
            locationId: 'location-1',
            isPrimary: false,
          },
          update: {
            isPrimary: false,
          },
        });
        expect(result).toEqual(assignment);
      });

      it('should unset other primary assignments when setting as primary', async () => {
        const assignment = createTestStaffLocation({ isPrimary: true });

        prismaMock.staffLocation.updateMany.mockResolvedValue({ count: 1 });
        prismaMock.staffLocation.upsert.mockResolvedValue(assignment as any);

        await assignStaffToLocation('staff-1', 'location-1', true);

        expect(prismaMock.staffLocation.updateMany).toHaveBeenCalledWith({
          where: { staffId: 'staff-1', isPrimary: true },
          data: { isPrimary: false },
        });
      });

      it('should update existing assignment', async () => {
        const updatedAssignment = createTestStaffLocation({ isPrimary: true });

        prismaMock.staffLocation.upsert.mockResolvedValue(updatedAssignment as any);

        const result = await assignStaffToLocation('staff-1', 'location-1', true);

        expect(result.isPrimary).toBe(true);
      });
    });

    describe('removeStaffFromLocation', () => {
      it('should remove assignment successfully', async () => {
        prismaMock.staffLocation.delete.mockResolvedValue(createTestStaffLocation() as any);

        await removeStaffFromLocation('staff-1', 'location-1');

        expect(prismaMock.staffLocation.delete).toHaveBeenCalledWith({
          where: {
            staffId_locationId: {
              staffId: 'staff-1',
              locationId: 'location-1',
            },
          },
        });
      });

      it('should throw error when assignment does not exist', async () => {
        prismaMock.staffLocation.delete.mockRejectedValue(
          new Error('Record not found')
        );

        await expect(removeStaffFromLocation('staff-1', 'location-1')).rejects.toThrow();
      });
    });

    describe('getStaffLocations', () => {
      it('should return locations with isPrimaryForStaff flag', async () => {
        const assignments = [
          {
            ...createTestStaffLocation({ isPrimary: true }),
            location: createTestLocation({ id: 'loc-1', name: 'Main' }),
          },
          {
            ...createTestStaffLocation({ isPrimary: false, locationId: 'loc-2' }),
            location: createTestLocation({ id: 'loc-2', name: 'Branch' }),
          },
        ];

        prismaMock.staffLocation.findMany.mockResolvedValue(assignments as any);

        const result = await getStaffLocations('staff-1');

        expect(result).toHaveLength(2);
        expect(result[0].isPrimaryForStaff).toBe(true);
        expect(result[1].isPrimaryForStaff).toBe(false);
      });

      it('should order by primary first, then by name', async () => {
        prismaMock.staffLocation.findMany.mockResolvedValue([]);

        await getStaffLocations('staff-1');

        expect(prismaMock.staffLocation.findMany).toHaveBeenCalledWith({
          where: { staffId: 'staff-1' },
          include: { location: true },
          orderBy: [{ isPrimary: 'desc' }, { location: { name: 'asc' } }],
        });
      });
    });

    describe('getLocationStaff', () => {
      it('should return staff with isPrimaryLocation flag', async () => {
        const assignments = [
          {
            ...createTestStaffLocation({ isPrimary: true }),
            staff: createTestStaff({ id: 'staff-1', name: 'Dr. Garcia' }),
          },
          {
            ...createTestStaffLocation({ isPrimary: false, staffId: 'staff-2' }),
            staff: createTestStaff({ id: 'staff-2', name: 'Dr. Lopez' }),
          },
        ];

        prismaMock.staffLocation.findMany.mockResolvedValue(assignments as any);

        const result = await getLocationStaff('location-1');

        expect(result).toHaveLength(2);
        expect(result[0].isPrimaryLocation).toBe(true);
        expect(result[1].isPrimaryLocation).toBe(false);
      });
    });

    describe('staffHasAccessToLocation', () => {
      it('should return true when assignment exists', async () => {
        prismaMock.staffLocation.findUnique.mockResolvedValue(
          createTestStaffLocation() as any
        );

        const result = await staffHasAccessToLocation('staff-1', 'location-1');

        expect(result).toBe(true);
      });

      it('should return false when assignment does not exist', async () => {
        prismaMock.staffLocation.findUnique.mockResolvedValue(null);

        const result = await staffHasAccessToLocation('staff-1', 'location-1');

        expect(result).toBe(false);
      });
    });
  });

  // ==========================================================================
  // Inventory Transfer Operations
  // ==========================================================================
  describe('Inventory Transfer Operations', () => {
    describe('createInventoryTransfer', () => {
      const validTransferInput = {
        inventoryItemId: '550e8400-e29b-41d4-a716-446655440000',
        fromLocationId: '550e8400-e29b-41d4-a716-446655440001',
        toLocationId: '550e8400-e29b-41d4-a716-446655440002',
        quantity: 10,
        notes: 'Stock balancing',
      };

      it('should create transfer successfully', async () => {
        const inventoryItem = {
          ...createTestInventoryItem(),
          quantity: new Decimal(100),
        };
        const createdTransfer = createTestInventoryTransfer();

        prismaMock.inventoryItem.findFirst.mockResolvedValue(inventoryItem as any);
        prismaMock.inventoryTransfer.create.mockResolvedValue(createdTransfer as any);

        const result = await createInventoryTransfer(
          'tenant-1',
          'staff-1',
          validTransferInput
        );

        expect(prismaMock.inventoryTransfer.create).toHaveBeenCalledWith({
          data: {
            ...validTransferInput,
            tenantId: 'tenant-1',
            requestedById: 'staff-1',
            status: 'PENDING',
          },
          include: {
            inventoryItem: true,
            fromLocation: true,
            toLocation: true,
            requestedBy: true,
          },
        });
        expect(result.status).toBe('PENDING');
      });

      it('should throw error when locations are the same', async () => {
        const sameLocationInput = {
          ...validTransferInput,
          toLocationId: validTransferInput.fromLocationId,
        };

        await expect(
          createInventoryTransfer('tenant-1', 'staff-1', sameLocationInput)
        ).rejects.toThrow('Las ubicaciones origen y destino deben ser diferentes');
      });

      it('should throw error when inventory item not found', async () => {
        prismaMock.inventoryItem.findFirst.mockResolvedValue(null);

        await expect(
          createInventoryTransfer('tenant-1', 'staff-1', validTransferInput)
        ).rejects.toThrow('Item de inventario no encontrado en ubicación origen');
      });

      it('should throw error when insufficient quantity', async () => {
        const inventoryItem = {
          ...createTestInventoryItem(),
          quantity: new Decimal(5), // Less than requested 10
        };

        prismaMock.inventoryItem.findFirst.mockResolvedValue(inventoryItem as any);

        await expect(
          createInventoryTransfer('tenant-1', 'staff-1', validTransferInput)
        ).rejects.toThrow('Cantidad insuficiente. Disponible: 5, Solicitado: 10');
      });

      it('should validate UUID format for IDs', async () => {
        const invalidInput = {
          ...validTransferInput,
          inventoryItemId: 'not-a-uuid',
        };

        await expect(
          createInventoryTransfer('tenant-1', 'staff-1', invalidInput)
        ).rejects.toThrow();
      });

      it('should validate positive quantity', async () => {
        const invalidInput = {
          ...validTransferInput,
          quantity: -5,
        };

        await expect(
          createInventoryTransfer('tenant-1', 'staff-1', invalidInput)
        ).rejects.toThrow();
      });
    });

    describe('completeInventoryTransfer', () => {
      it('should complete transfer and update inventory', async () => {
        const transfer = {
          ...createTestInventoryTransfer({ status: 'PENDING' }),
          inventoryItem: createTestInventoryItem(),
          toLocationId: 'location-2',
        };
        const completedTransfer = { ...transfer, status: 'COMPLETED' };

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(transfer as any);
        prismaMock.$transaction.mockImplementation(async (callback) => {
          // Simulate transaction execution
          const tx = {
            inventoryItem: {
              update: jest.fn().mockResolvedValue({}),
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({}),
            },
            inventoryMovement: {
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
            inventoryTransfer: {
              update: jest.fn().mockResolvedValue(completedTransfer),
            },
          };
          return callback(tx);
        });

        const result = await completeInventoryTransfer('transfer-1', 'tenant-1');

        expect(result.status).toBe('COMPLETED');
      });

      it('should throw error when transfer not found', async () => {
        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(null);

        await expect(
          completeInventoryTransfer('non-existent', 'tenant-1')
        ).rejects.toThrow('Transferencia no encontrada');
      });

      it('should throw error when transfer already completed', async () => {
        const completedTransfer = createTestInventoryTransfer({ status: 'COMPLETED' });

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(completedTransfer as any);

        await expect(
          completeInventoryTransfer('transfer-1', 'tenant-1')
        ).rejects.toThrow('No se puede completar transferencia en estado COMPLETED');
      });

      it('should throw error when transfer cancelled', async () => {
        const cancelledTransfer = createTestInventoryTransfer({ status: 'CANCELLED' });

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(cancelledTransfer as any);

        await expect(
          completeInventoryTransfer('transfer-1', 'tenant-1')
        ).rejects.toThrow('No se puede completar transferencia en estado CANCELLED');
      });

      it('should allow completing IN_TRANSIT transfers', async () => {
        const inTransitTransfer = {
          ...createTestInventoryTransfer({ status: 'IN_TRANSIT' }),
          inventoryItem: createTestInventoryItem(),
        };
        const completedTransfer = { ...inTransitTransfer, status: 'COMPLETED' };

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(inTransitTransfer as any);
        prismaMock.$transaction.mockImplementation(async (callback) => {
          const tx = {
            inventoryItem: {
              update: jest.fn().mockResolvedValue({}),
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest.fn().mockResolvedValue({}),
            },
            inventoryMovement: {
              createMany: jest.fn().mockResolvedValue({ count: 2 }),
            },
            inventoryTransfer: {
              update: jest.fn().mockResolvedValue(completedTransfer),
            },
          };
          return callback(tx);
        });

        const result = await completeInventoryTransfer('transfer-1', 'tenant-1');

        expect(result.status).toBe('COMPLETED');
      });
    });

    describe('cancelInventoryTransfer', () => {
      it('should cancel pending transfer', async () => {
        const pendingTransfer = createTestInventoryTransfer({ status: 'PENDING' });
        const cancelledTransfer = { ...pendingTransfer, status: 'CANCELLED' };

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(pendingTransfer as any);
        prismaMock.inventoryTransfer.update.mockResolvedValue(cancelledTransfer as any);

        const result = await cancelInventoryTransfer('transfer-1', 'tenant-1');

        expect(result.status).toBe('CANCELLED');
      });

      it('should throw error when transfer not found', async () => {
        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(null);

        await expect(
          cancelInventoryTransfer('non-existent', 'tenant-1')
        ).rejects.toThrow('Transferencia no encontrada');
      });

      it('should throw error when transfer already completed', async () => {
        const completedTransfer = createTestInventoryTransfer({ status: 'COMPLETED' });

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(completedTransfer as any);

        await expect(
          cancelInventoryTransfer('transfer-1', 'tenant-1')
        ).rejects.toThrow('No se puede cancelar una transferencia completada');
      });

      it('should throw error when transfer already cancelled', async () => {
        const cancelledTransfer = createTestInventoryTransfer({ status: 'CANCELLED' });

        prismaMock.inventoryTransfer.findFirst.mockResolvedValue(cancelledTransfer as any);

        await expect(
          cancelInventoryTransfer('transfer-1', 'tenant-1')
        ).rejects.toThrow('Esta transferencia ya está cancelada');
      });
    });

    describe('getInventoryTransfers', () => {
      it('should return all transfers for tenant', async () => {
        const transfers = [
          createTestInventoryTransfer(),
          createTestInventoryTransfer({ id: 'transfer-2' }),
        ];

        prismaMock.inventoryTransfer.findMany.mockResolvedValue(transfers as any);

        const result = await getInventoryTransfers('tenant-1');

        expect(result).toHaveLength(2);
        expect(prismaMock.inventoryTransfer.findMany).toHaveBeenCalledWith({
          where: { tenantId: 'tenant-1' },
          include: {
            inventoryItem: true,
            fromLocation: true,
            toLocation: true,
            requestedBy: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      });

      it('should filter by status', async () => {
        prismaMock.inventoryTransfer.findMany.mockResolvedValue([]);

        await getInventoryTransfers('tenant-1', { status: 'PENDING' });

        expect(prismaMock.inventoryTransfer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { tenantId: 'tenant-1', status: 'PENDING' },
          })
        );
      });

      it('should filter by locationId (from or to)', async () => {
        prismaMock.inventoryTransfer.findMany.mockResolvedValue([]);

        await getInventoryTransfers('tenant-1', { locationId: 'location-1' });

        expect(prismaMock.inventoryTransfer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              tenantId: 'tenant-1',
              OR: [
                { fromLocationId: 'location-1' },
                { toLocationId: 'location-1' },
              ],
            }),
          })
        );
      });

      it('should filter by inventoryItemId', async () => {
        prismaMock.inventoryTransfer.findMany.mockResolvedValue([]);

        await getInventoryTransfers('tenant-1', { inventoryItemId: 'item-1' });

        expect(prismaMock.inventoryTransfer.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { tenantId: 'tenant-1', inventoryItemId: 'item-1' },
          })
        );
      });
    });
  });

  // ==========================================================================
  // Permission Helpers
  // ==========================================================================
  describe('Permission Helpers', () => {
    describe('getStaffLocationIds', () => {
      it('should return array of location IDs', async () => {
        const assignments = [
          { locationId: 'loc-1' },
          { locationId: 'loc-2' },
          { locationId: 'loc-3' },
        ];

        prismaMock.staffLocation.findMany.mockResolvedValue(assignments as any);

        const result = await getStaffLocationIds('staff-1');

        expect(result).toEqual(['loc-1', 'loc-2', 'loc-3']);
      });

      it('should return empty array when no assignments', async () => {
        prismaMock.staffLocation.findMany.mockResolvedValue([]);

        const result = await getStaffLocationIds('staff-1');

        expect(result).toEqual([]);
      });
    });

    describe('getStaffPrimaryLocationId', () => {
      it('should return primary location ID', async () => {
        prismaMock.staffLocation.findFirst.mockResolvedValue({
          locationId: 'primary-loc',
        } as any);

        const result = await getStaffPrimaryLocationId('staff-1');

        expect(result).toBe('primary-loc');
      });

      it('should return null when no primary location', async () => {
        prismaMock.staffLocation.findFirst.mockResolvedValue(null);

        const result = await getStaffPrimaryLocationId('staff-1');

        expect(result).toBeNull();
      });
    });

    describe('filterByStaffLocations', () => {
      it('should return Prisma where clause with locationId', async () => {
        const assignments = [{ locationId: 'loc-1' }, { locationId: 'loc-2' }];

        prismaMock.staffLocation.findMany.mockResolvedValue(assignments as any);

        const result = await filterByStaffLocations('staff-1');

        expect(result).toEqual({
          locationId: { in: ['loc-1', 'loc-2'] },
        });
      });

      it('should use custom field name', async () => {
        const assignments = [{ locationId: 'loc-1' }];

        prismaMock.staffLocation.findMany.mockResolvedValue(assignments as any);

        const result = await filterByStaffLocations('staff-1', 'customLocationField');

        expect(result).toEqual({
          customLocationField: { in: ['loc-1'] },
        });
      });
    });

    describe('hasAnyLocationAssignment', () => {
      it('should return true when staff has assignments', async () => {
        prismaMock.staffLocation.count.mockResolvedValue(3);

        const result = await hasAnyLocationAssignment('staff-1');

        expect(result).toBe(true);
      });

      it('should return false when staff has no assignments', async () => {
        prismaMock.staffLocation.count.mockResolvedValue(0);

        const result = await hasAnyLocationAssignment('staff-1');

        expect(result).toBe(false);
      });
    });

    describe('requireLocationAccess', () => {
      it('should not throw when staff has access', async () => {
        prismaMock.staffLocation.findUnique.mockResolvedValue(
          createTestStaffLocation() as any
        );

        await expect(
          requireLocationAccess('staff-1', 'location-1', 'pet')
        ).resolves.not.toThrow();
      });

      it('should throw when staff does not have access', async () => {
        prismaMock.staffLocation.findUnique.mockResolvedValue(null);

        await expect(
          requireLocationAccess('staff-1', 'location-1', 'pet')
        ).rejects.toThrow(
          "Access denied: This pet belongs to a location you don't have access to"
        );
      });

      it('should not throw when resourceLocationId is null (backwards compatibility)', async () => {
        await expect(
          requireLocationAccess('staff-1', null, 'pet')
        ).resolves.not.toThrow();

        // Should not call the database
        expect(prismaMock.staffLocation.findUnique).not.toHaveBeenCalled();
      });

      it('should use default resource type in error message', async () => {
        prismaMock.staffLocation.findUnique.mockResolvedValue(null);

        await expect(requireLocationAccess('staff-1', 'location-1')).rejects.toThrow(
          "Access denied: This resource belongs to a location you don't have access to"
        );
      });
    });
  });

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  describe('Utility Functions', () => {
    describe('generateSlug', () => {
      it('should generate slug from simple name', () => {
        expect(generateSlug('Main Clinic')).toBe('main-clinic');
      });

      it('should handle Spanish characters', () => {
        expect(generateSlug('Clínica Veterinaria Centro')).toBe(
          'clinica-veterinaria-centro'
        );
      });

      it('should handle multiple spaces', () => {
        expect(generateSlug('My   Clinic   Name')).toBe('my-clinic-name');
      });

      it('should handle special characters', () => {
        expect(generateSlug("Dr. López's Clinic!")).toBe('dr-lopez-s-clinic');
      });

      it('should handle numbers', () => {
        expect(generateSlug('Clinic 24/7')).toBe('clinic-24-7');
      });

      it('should remove leading/trailing hyphens', () => {
        expect(generateSlug('  -Clinic-  ')).toBe('clinic');
      });
    });
  });
});
