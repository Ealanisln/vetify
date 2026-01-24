/**
 * API v1 Entity Serializers
 *
 * Functions to transform Prisma entities into API response objects.
 * These serializers:
 * - Exclude internal fields (tenantId, etc.)
 * - Convert Decimal fields to numbers
 * - Convert Date fields to ISO strings
 */

import type {
  Location,
  Customer,
  Pet,
  Appointment,
  InventoryItem,
  InventoryTransfer,
  Staff,
} from '@prisma/client';
import type {
  LocationResponse,
  CustomerResponse,
  PetResponse,
  PetSummaryResponse,
  CustomerSummaryResponse,
  AppointmentResponse,
  AppointmentWithRelationsResponse,
  StaffSummaryResponse,
  LocationSummaryResponse,
  InventoryItemResponse,
  InventoryTransferResponse,
  InventoryItemSummaryResponse,
} from './types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a value to a number (handles Prisma Decimal)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value.toNumber === 'function') {
    return value.toNumber();
  }
  return Number(value);
}

/**
 * Convert a Date to ISO string
 */
function toISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

// ============================================================================
// Location Serializers
// ============================================================================

export function serializeLocation(location: Location): LocationResponse {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
    address: location.address,
    phone: location.phone,
    email: location.email,
    timezone: location.timezone,
    isActive: location.isActive,
    isPrimary: location.isPrimary,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString(),
  };
}

export function serializeLocationSummary(
  location: Pick<Location, 'id' | 'name' | 'slug'>
): LocationSummaryResponse {
  return {
    id: location.id,
    name: location.name,
    slug: location.slug,
  };
}

// ============================================================================
// Customer Serializers
// ============================================================================

export function serializeCustomer(customer: Customer): CustomerResponse {
  return {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    name: customer.name,
    phone: customer.phone,
    address: customer.address,
    preferredContactMethod: customer.preferredContactMethod,
    notes: customer.notes,
    isActive: customer.isActive,
    source: customer.source,
    locationId: customer.locationId,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export function serializeCustomerSummary(
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
): CustomerSummaryResponse {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
  };
}

// ============================================================================
// Pet Serializers
// ============================================================================

export function serializePet(pet: Pet): PetResponse {
  return {
    id: pet.id,
    internalId: pet.internalId,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    dateOfBirth: pet.dateOfBirth.toISOString(),
    gender: pet.gender,
    weight: toNumber(pet.weight),
    weightUnit: pet.weightUnit,
    microchipNumber: pet.microchipNumber,
    isNeutered: pet.isNeutered,
    isDeceased: pet.isDeceased,
    profileImage: pet.profileImage,
    customerId: pet.customerId,
    locationId: pet.locationId,
    createdAt: pet.createdAt.toISOString(),
    updatedAt: pet.updatedAt.toISOString(),
  };
}

export function serializePetSummary(
  pet: Pick<Pet, 'id' | 'name' | 'species' | 'breed'>
): PetSummaryResponse {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
  };
}

// ============================================================================
// Staff Serializers
// ============================================================================

export function serializeStaffSummary(
  staff: Pick<Staff, 'id' | 'name' | 'position'>
): StaffSummaryResponse {
  return {
    id: staff.id,
    name: staff.name,
    position: staff.position,
  };
}

// ============================================================================
// Appointment Serializers
// ============================================================================

export function serializeAppointment(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    dateTime: appointment.dateTime.toISOString(),
    duration: appointment.duration,
    reason: appointment.reason,
    notes: appointment.notes,
    status: appointment.status,
    petId: appointment.petId,
    customerId: appointment.customerId,
    staffId: appointment.staffId,
    locationId: appointment.locationId,
    createdAt: appointment.createdAt.toISOString(),
    updatedAt: appointment.updatedAt.toISOString(),
  };
}

type AppointmentWithRelations = Appointment & {
  pet: Pick<Pet, 'id' | 'name' | 'species' | 'breed'>;
  customer: Pick<Customer, 'id' | 'name' | 'email' | 'phone'> | null;
  staff: Pick<Staff, 'id' | 'name' | 'position'> | null;
  location: Pick<Location, 'id' | 'name' | 'slug'> | null;
};

export function serializeAppointmentWithRelations(
  appointment: AppointmentWithRelations
): AppointmentWithRelationsResponse {
  return {
    ...serializeAppointment(appointment),
    pet: serializePetSummary(appointment.pet),
    customer: appointment.customer ? serializeCustomerSummary(appointment.customer) : null,
    staff: appointment.staff ? serializeStaffSummary(appointment.staff) : null,
    location: appointment.location ? serializeLocationSummary(appointment.location) : null,
  };
}

// ============================================================================
// Inventory Serializers
// ============================================================================

export function serializeInventoryItem(item: InventoryItem): InventoryItemResponse {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description,
    activeCompound: item.activeCompound,
    presentation: item.presentation,
    measure: item.measure,
    brand: item.brand,
    quantity: toNumber(item.quantity) ?? 0,
    minStock: toNumber(item.minStock),
    expirationDate: toISOString(item.expirationDate),
    status: item.status,
    batchNumber: item.batchNumber,
    specialNotes: item.specialNotes,
    storageLocation: item.storageLocation,
    cost: toNumber(item.cost),
    price: toNumber(item.price),
    locationId: item.locationId,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export function serializeInventoryItemSummary(
  item: Pick<InventoryItem, 'id' | 'name' | 'category'>
): InventoryItemSummaryResponse {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
  };
}

type InventoryTransferWithRelations = InventoryTransfer & {
  inventoryItem: Pick<InventoryItem, 'id' | 'name' | 'category'>;
  fromLocation: Pick<Location, 'id' | 'name' | 'slug'>;
  toLocation: Pick<Location, 'id' | 'name' | 'slug'>;
  requestedBy: Pick<Staff, 'id' | 'name' | 'position'>;
};

export function serializeInventoryTransfer(
  transfer: InventoryTransferWithRelations
): InventoryTransferResponse {
  return {
    id: transfer.id,
    inventoryItemId: transfer.inventoryItemId,
    inventoryItem: serializeInventoryItemSummary(transfer.inventoryItem),
    fromLocationId: transfer.fromLocationId,
    fromLocation: serializeLocationSummary(transfer.fromLocation),
    toLocationId: transfer.toLocationId,
    toLocation: serializeLocationSummary(transfer.toLocation),
    quantity: toNumber(transfer.quantity) ?? 0,
    status: transfer.status,
    notes: transfer.notes,
    requestedById: transfer.requestedById,
    requestedBy: serializeStaffSummary(transfer.requestedBy),
    completedAt: toISOString(transfer.completedAt),
    createdAt: transfer.createdAt.toISOString(),
    updatedAt: transfer.updatedAt.toISOString(),
  };
}
