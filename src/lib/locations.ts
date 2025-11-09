import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { checkLocationLimit } from './plan-limits';

// ============================================================================
// Re-export client-safe utilities and schemas
// ============================================================================
// These can be imported by both client and server components
// Exported from location-utils.ts to maintain backward compatibility

export {
  createLocationSchema,
  updateLocationSchema,
  generateSlug,
  createTransferSchema,
  type CreateLocationInput,
  type UpdateLocationInput,
  type CreateTransferInput,
} from './location-utils';

// ============================================================================
// Location-Based Permission Helpers (SERVER-ONLY)
// ============================================================================
//
// ⚠️ WARNING: These functions use Prisma database queries and are SERVER-SIDE ONLY.
// Do NOT call these functions from:
// - Edge Runtime middleware (src/middleware.ts)
// - Client Components (use server actions instead)
// - Edge API routes
//
// For client-side permission checks, use server actions that wrap these functions.
// For middleware, pre-fetch location assignments during auth and store in session/token.
//
// ============================================================================

// ============================================================================
// CRUD Operations
// ============================================================================

/**
 * Get all locations for a tenant with optional filters
 * @param tenantId - The tenant ID
 * @param options - Optional filters (isActive, search)
 * @returns Array of locations with staff count
 */
export async function getLocationsByTenant(
  tenantId: string,
  options?: {
    isActive?: boolean;
    search?: string;
  }
) {
  const where: {
    tenantId: string;
    isActive?: boolean;
    name?: { contains: string; mode: 'insensitive' };
  } = { tenantId };

  if (options?.isActive !== undefined) {
    where.isActive = options.isActive;
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: 'insensitive' } },
      { address: { contains: options.search, mode: 'insensitive' } },
      { phone: { contains: options.search } },
    ];
  }

  const locations = await prisma.location.findMany({
    where,
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

  return locations;
}

/**
 * Get a single location by ID with tenant validation
 * @param id - Location ID
 * @param tenantId - Tenant ID for validation
 * @returns Location or null
 */
export async function getLocationById(id: string, tenantId: string) {
  return prisma.location.findFirst({
    where: { id, tenantId },
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
}

/**
 * Create a new location
 * @param tenantId - Tenant ID
 * @param data - Location data
 * @returns Created location
 */
export async function createLocation(
  tenantId: string,
  data: CreateLocationInput
) {
  // Validate input
  const validated = createLocationSchema.parse(data);

  // Check if slug is unique for this tenant
  const existing = await prisma.location.findUnique({
    where: {
      tenantId_slug: {
        tenantId,
        slug: validated.slug,
      },
    },
  });

  if (existing) {
    throw new Error('Ya existe una ubicación con este slug');
  }

  // Check if tenant can create more locations based on plan
  const locationCheck = await checkLocationLimit(tenantId);
  if (!locationCheck.canAdd) {
    throw new Error(
      locationCheck.requiresUpgrade
        ? 'Plan limit reached: El Plan Básico solo permite 1 ubicación. Actualiza tu plan para agregar más ubicaciones.'
        : 'Has alcanzado el límite de ubicaciones de tu plan'
    );
  }

  // If this is set as primary, unset other primary locations first
  if (validated.isPrimary) {
    await prisma.location.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // Create the location
  return prisma.location.create({
    data: {
      ...validated,
      tenantId,
    },
  });
}

/**
 * Update an existing location
 * @param id - Location ID
 * @param tenantId - Tenant ID for validation
 * @param data - Partial location data
 * @returns Updated location
 */
export async function updateLocation(
  id: string,
  tenantId: string,
  data: UpdateLocationInput
) {
  // Validate input
  const validated = updateLocationSchema.parse(data);

  // Verify location exists and belongs to tenant
  const location = await getLocationById(id, tenantId);
  if (!location) {
    throw new Error('Ubicación no encontrada');
  }

  // If slug is being updated, check uniqueness
  if (validated.slug && validated.slug !== location.slug) {
    const existing = await prisma.location.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: validated.slug,
        },
      },
    });

    if (existing) {
      throw new Error('Ya existe una ubicación con este slug');
    }
  }

  // If setting as primary, unset other primary locations
  if (validated.isPrimary) {
    await prisma.location.updateMany({
      where: { tenantId, isPrimary: true, id: { not: id } },
      data: { isPrimary: false },
    });
  }

  // Update the location
  return prisma.location.update({
    where: { id },
    data: validated,
  });
}

/**
 * Soft delete a location (set isActive to false)
 * @param id - Location ID
 * @param tenantId - Tenant ID for validation
 * @returns Updated location
 */
export async function deleteLocation(id: string, tenantId: string) {
  // Verify location exists and belongs to tenant
  const location = await getLocationById(id, tenantId);
  if (!location) {
    throw new Error('Ubicación no encontrada');
  }

  // Check if this is the primary location
  if (location.isPrimary) {
    throw new Error(
      'No puedes eliminar la ubicación principal. Primero asigna otra ubicación como principal.'
    );
  }

  // Check if location has related records
  const counts = location._count;
  const hasData =
    counts.staff > 0 ||
    counts.pets > 0 ||
    counts.appointments > 0 ||
    counts.inventoryItems > 0;

  if (hasData) {
    throw new Error(
      `Esta ubicación tiene ${counts.staff} staff, ${counts.pets} mascotas, ${counts.appointments} citas, y ${counts.inventoryItems} items de inventario. No se puede eliminar.`
    );
  }

  // Soft delete by setting isActive to false and deletedAt timestamp
  return prisma.location.update({
    where: { id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
}

/**
 * Set a location as the primary location for a tenant
 * Uses a transaction to ensure only one primary location exists
 * @param id - Location ID
 * @param tenantId - Tenant ID for validation
 * @returns Updated location
 */
export async function setPrimaryLocation(id: string, tenantId: string) {
  // Verify location exists and belongs to tenant
  const location = await getLocationById(id, tenantId);
  if (!location) {
    throw new Error('Ubicación no encontrada');
  }

  // Use transaction to ensure atomic operation
  const [, updatedLocation] = await prisma.$transaction([
    // First, unset all other primary locations
    prisma.location.updateMany({
      where: { tenantId, isPrimary: true },
      data: { isPrimary: false },
    }),
    // Then set this location as primary
    prisma.location.update({
      where: { id },
      data: { isPrimary: true },
    }),
  ]);

  return updatedLocation;
}

/**
 * Get the primary location for a tenant
 * @param tenantId - Tenant ID
 * @returns Primary location or null
 */
export async function getPrimaryLocation(tenantId: string) {
  return prisma.location.findFirst({
    where: { tenantId, isPrimary: true, isActive: true },
  });
}

/**
 * Get location statistics for a tenant
 * @param tenantId - Tenant ID
 * @returns Statistics object
 */
export async function getLocationStats(tenantId: string) {
  const [total, active, primary] = await Promise.all([
    prisma.location.count({ where: { tenantId } }),
    prisma.location.count({ where: { tenantId, isActive: true } }),
    prisma.location.findFirst({
      where: { tenantId, isPrimary: true, isActive: true },
      select: { id: true, name: true },
    }),
  ]);

  return {
    total,
    active,
    inactive: total - active,
    primary,
  };
}

// ============================================================================
// Staff-Location Assignment Operations
// ============================================================================

/**
 * Assign staff to a location
 * @param staffId - Staff ID
 * @param locationId - Location ID
 * @param isPrimary - Whether this is the staff's primary location
 * @returns StaffLocation record
 */
export async function assignStaffToLocation(
  staffId: string,
  locationId: string,
  isPrimary: boolean = false
) {
  // If setting as primary, unset other primary assignments for this staff
  if (isPrimary) {
    await prisma.staffLocation.updateMany({
      where: { staffId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  // Create or update the assignment
  return prisma.staffLocation.upsert({
    where: {
      staffId_locationId: {
        staffId,
        locationId,
      },
    },
    create: {
      staffId,
      locationId,
      isPrimary,
    },
    update: {
      isPrimary,
    },
  });
}

/**
 * Remove staff from a location
 * @param staffId - Staff ID
 * @param locationId - Location ID
 */
export async function removeStaffFromLocation(
  staffId: string,
  locationId: string
) {
  await prisma.staffLocation.delete({
    where: {
      staffId_locationId: {
        staffId,
        locationId,
      },
    },
  });
}

/**
 * Get all locations assigned to a staff member
 * @param staffId - Staff ID
 * @returns Array of locations
 */
export async function getStaffLocations(staffId: string) {
  const assignments = await prisma.staffLocation.findMany({
    where: { staffId },
    include: {
      location: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { location: { name: 'asc' } }],
  });

  return assignments.map((a) => ({
    ...a.location,
    isPrimaryForStaff: a.isPrimary,
  }));
}

/**
 * Get all staff assigned to a location
 * @param locationId - Location ID
 * @returns Array of staff with assignment details
 */
export async function getLocationStaff(locationId: string) {
  const assignments = await prisma.staffLocation.findMany({
    where: { locationId },
    include: {
      staff: true,
    },
    orderBy: [{ isPrimary: 'desc' }, { staff: { name: 'asc' } }],
  });

  return assignments.map((a) => ({
    ...a.staff,
    isPrimaryLocation: a.isPrimary,
  }));
}

/**
 * Check if staff has access to a location
 * @param staffId - Staff ID
 * @param locationId - Location ID
 * @returns boolean
 */
export async function staffHasAccessToLocation(
  staffId: string,
  locationId: string
): Promise<boolean> {
  const assignment = await prisma.staffLocation.findUnique({
    where: {
      staffId_locationId: {
        staffId,
        locationId,
      },
    },
  });

  return !!assignment;
}

// ============================================================================
// Inventory Transfer Operations
// ============================================================================

/**
 * Create a new inventory transfer
 * @param tenantId - Tenant ID
 * @param requestedById - Staff ID who requested the transfer
 * @param data - Transfer data
 * @returns Created transfer
 */
export async function createInventoryTransfer(
  tenantId: string,
  requestedById: string,
  data: CreateTransferInput
) {
  const validated = createTransferSchema.parse(data);

  // Verify from and to locations are different
  if (validated.fromLocationId === validated.toLocationId) {
    throw new Error('Las ubicaciones origen y destino deben ser diferentes');
  }

  // Verify inventory item exists and has enough quantity at source location
  const inventoryItem = await prisma.inventoryItem.findFirst({
    where: {
      id: validated.inventoryItemId,
      tenantId,
      locationId: validated.fromLocationId,
    },
  });

  if (!inventoryItem) {
    throw new Error('Item de inventario no encontrado en ubicación origen');
  }

  if (inventoryItem.quantity.toNumber() < validated.quantity) {
    throw new Error(
      `Cantidad insuficiente. Disponible: ${inventoryItem.quantity}, Solicitado: ${validated.quantity}`
    );
  }

  // Create the transfer
  return prisma.inventoryTransfer.create({
    data: {
      ...validated,
      tenantId,
      requestedById,
      status: 'PENDING',
    },
    include: {
      inventoryItem: true,
      fromLocation: true,
      toLocation: true,
      requestedBy: true,
    },
  });
}

/**
 * Complete an inventory transfer
 * Updates stock quantities at both locations
 * @param transferId - Transfer ID
 * @param tenantId - Tenant ID for validation
 * @returns Updated transfer
 */
export async function completeInventoryTransfer(
  transferId: string,
  tenantId: string
) {
  // Get the transfer
  const transfer = await prisma.inventoryTransfer.findFirst({
    where: { id: transferId, tenantId },
    include: { inventoryItem: true },
  });

  if (!transfer) {
    throw new Error('Transferencia no encontrada');
  }

  if (transfer.status !== 'PENDING' && transfer.status !== 'IN_TRANSIT') {
    throw new Error(`No se puede completar transferencia en estado ${transfer.status}`);
  }

  // Use transaction to update inventory and transfer status atomically
  return prisma.$transaction(async (tx) => {
    // Reduce quantity at source location
    await tx.inventoryItem.update({
      where: {
        id: transfer.inventoryItemId,
      },
      data: {
        quantity: {
          decrement: transfer.quantity,
        },
      },
    });

    // Check if item exists at destination, if not create it
    const destItem = await tx.inventoryItem.findFirst({
      where: {
        tenantId,
        locationId: transfer.toLocationId,
        name: transfer.inventoryItem.name,
        category: transfer.inventoryItem.category,
      },
    });

    if (destItem) {
      // Update existing item at destination
      await tx.inventoryItem.update({
        where: { id: destItem.id },
        data: {
          quantity: {
            increment: transfer.quantity,
          },
        },
      });
    } else {
      // Create new item at destination
      await tx.inventoryItem.create({
        data: {
          tenantId,
          locationId: transfer.toLocationId,
          name: transfer.inventoryItem.name,
          category: transfer.inventoryItem.category,
          description: transfer.inventoryItem.description,
          activeCompound: transfer.inventoryItem.activeCompound,
          presentation: transfer.inventoryItem.presentation,
          measure: transfer.inventoryItem.measure,
          brand: transfer.inventoryItem.brand,
          quantity: transfer.quantity,
          minStock: transfer.inventoryItem.minStock,
          cost: transfer.inventoryItem.cost,
          price: transfer.inventoryItem.price,
          status: 'ACTIVE',
        },
      });
    }

    // Create inventory movements for audit trail
    const movementData: Prisma.InventoryMovementCreateManyInput[] = [
      {
        tenantId,
        itemId: transfer.inventoryItemId,
        type: 'TRANSFER_OUT',
        quantity: transfer.quantity,
        staffId: transfer.requestedById,
        reason: `Transferencia a ${transfer.toLocation?.name}`,
        notes: transfer.notes,
        relatedRecordId: transfer.id,
        relatedRecordType: 'InventoryTransfer',
      },
    ];

    if (destItem) {
      movementData.push({
        tenantId,
        itemId: destItem.id,
        type: 'TRANSFER_IN',
        quantity: transfer.quantity,
        staffId: transfer.requestedById,
        reason: `Transferencia desde ${transfer.fromLocation?.name}`,
        notes: transfer.notes,
        relatedRecordId: transfer.id,
        relatedRecordType: 'InventoryTransfer',
      });
    }

    await tx.inventoryMovement.createMany({
      data: movementData,
    });

    // Update transfer status
    const updatedTransfer = await tx.inventoryTransfer.update({
      where: { id: transferId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        inventoryItem: true,
        fromLocation: true,
        toLocation: true,
        requestedBy: true,
      },
    });

    return updatedTransfer;
  });
}

/**
 * Cancel an inventory transfer
 * @param transferId - Transfer ID
 * @param tenantId - Tenant ID for validation
 * @returns Updated transfer
 */
export async function cancelInventoryTransfer(
  transferId: string,
  tenantId: string
) {
  const transfer = await prisma.inventoryTransfer.findFirst({
    where: { id: transferId, tenantId },
  });

  if (!transfer) {
    throw new Error('Transferencia no encontrada');
  }

  if (transfer.status === 'COMPLETED') {
    throw new Error('No se puede cancelar una transferencia completada');
  }

  if (transfer.status === 'CANCELLED') {
    throw new Error('Esta transferencia ya está cancelada');
  }

  return prisma.inventoryTransfer.update({
    where: { id: transferId },
    data: { status: 'CANCELLED' },
    include: {
      inventoryItem: true,
      fromLocation: true,
      toLocation: true,
      requestedBy: true,
    },
  });
}

/**
 * Get all transfers for a tenant with optional filters
 * @param tenantId - Tenant ID
 * @param options - Optional filters
 * @returns Array of transfers
 */
export async function getInventoryTransfers(
  tenantId: string,
  options?: {
    status?: string;
    locationId?: string;
    inventoryItemId?: string;
  }
) {
  const where: Prisma.InventoryTransferWhereInput = { tenantId };

  if (options?.status) {
    where.status = options.status as Prisma.EnumTransferStatusFilter;
  }

  if (options?.locationId) {
    where.OR = [
      { fromLocationId: options.locationId },
      { toLocationId: options.locationId },
    ];
  }

  if (options?.inventoryItemId) {
    where.inventoryItemId = options.inventoryItemId;
  }

  return prisma.inventoryTransfer.findMany({
    where,
    include: {
      inventoryItem: true,
      fromLocation: true,
      toLocation: true,
      requestedBy: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ============================================================================
// Location-Based Permission Helpers
// ============================================================================
//
// ⚠️ WARNING: These functions use Prisma database queries and are SERVER-SIDE ONLY.
// Do NOT call these functions from:
// - Edge Runtime middleware (src/middleware.ts)
// - Client Components (use server actions instead)
// - Edge API routes
//
// For client-side permission checks, use server actions that wrap these functions.
// For middleware, pre-fetch location assignments during auth and store in session/token.
//
// ============================================================================

/**
 * Get all location IDs that a staff member is assigned to
 *
 * ⚠️ SERVER-SIDE ONLY - Uses Prisma, not compatible with Edge Runtime
 *
 * @param staffId - The ID of the staff member
 * @returns Array of location IDs the staff member has access to
 */
export async function getStaffLocationIds(staffId: string): Promise<string[]> {
  const assignments = await prisma.staffLocation.findMany({
    where: { staffId },
    select: { locationId: true },
  });

  return assignments.map((a) => a.locationId);
}

/**
 * Get the primary location ID for a staff member
 *
 * @param staffId - The ID of the staff member
 * @returns The primary location ID or null if no primary location is set
 */
export async function getStaffPrimaryLocationId(
  staffId: string
): Promise<string | null> {
  const primaryAssignment = await prisma.staffLocation.findFirst({
    where: {
      staffId,
      isPrimary: true,
    },
    select: { locationId: true },
  });

  return primaryAssignment?.locationId || null;
}

/**
 * Filter a Prisma where clause to include only resources from staff's assigned locations
 *
 * Usage example:
 * ```typescript
 * const pets = await prisma.pet.findMany({
 *   where: {
 *     tenantId,
 *     ...await filterByStaffLocations(staffId, 'locationId'),
 *   },
 * });
 * ```
 *
 * @param staffId - The ID of the staff member
 * @param locationFieldName - The name of the location field in the model (default: 'locationId')
 * @returns Prisma where clause object to filter by staff's assigned locations
 */
export async function filterByStaffLocations(
  staffId: string,
  locationFieldName: string = 'locationId'
): Promise<Record<string, { in: string[] }>> {
  const locationIds = await getStaffLocationIds(staffId);

  return {
    [locationFieldName]: {
      in: locationIds,
    },
  };
}

/**
 * Check if staff member has any location assignments
 *
 * @param staffId - The ID of the staff member
 * @returns True if the staff member has at least one location assignment
 */
export async function hasAnyLocationAssignment(
  staffId: string
): Promise<boolean> {
  const count = await prisma.staffLocation.count({
    where: { staffId },
  });

  return count > 0;
}

/**
 * Validate that a resource belongs to one of the staff member's assigned locations
 * Throws an error if access is denied
 *
 * @param staffId - The ID of the staff member
 * @param resourceLocationId - The location ID of the resource being accessed
 * @param resourceType - Type of resource for error message (e.g., 'pet', 'appointment')
 * @throws Error if staff member doesn't have access to the resource's location
 */
export async function requireLocationAccess(
  staffId: string,
  resourceLocationId: string | null,
  resourceType: string = 'resource'
): Promise<void> {
  // If resource has no location, allow access (backwards compatibility)
  if (!resourceLocationId) {
    return;
  }

  const hasAccess = await staffHasAccessToLocation(staffId, resourceLocationId);

  if (!hasAccess) {
    throw new Error(
      `Access denied: This ${resourceType} belongs to a location you don't have access to`
    );
  }
}
