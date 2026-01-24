/**
 * API v1 Shared Types
 *
 * TypeScript interfaces for API v1 responses.
 * These types are used across all v1 endpoints for consistent response formatting.
 */

/**
 * Standard single item response
 */
export interface ApiResponse<T> {
  data: T;
}

/**
 * Paginated list response
 */
export interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * Error response
 */
export interface ApiErrorResponse {
  error: string;
  code: string;
  details?: string;
}

// ============================================================================
// Location Types
// ============================================================================

export interface LocationResponse {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string | null;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface CustomerResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  preferredContactMethod: string | null;
  notes: string | null;
  isActive: boolean;
  source: string | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithPetsResponse extends CustomerResponse {
  pets: PetSummaryResponse[];
}

export interface CustomerCreateInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  phone?: string;
  address?: string;
  preferredContactMethod?: string;
  notes?: string;
  locationId?: string;
}

export interface CustomerUpdateInput extends Partial<CustomerCreateInput> {
  isActive?: boolean;
}

// ============================================================================
// Pet Types
// ============================================================================

export interface PetResponse {
  id: string;
  internalId: string | null;
  name: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  weight: number | null;
  weightUnit: string | null;
  microchipNumber: string | null;
  isNeutered: boolean;
  isDeceased: boolean;
  profileImage: string | null;
  customerId: string;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetSummaryResponse {
  id: string;
  name: string;
  species: string;
  breed: string;
}

export interface PetWithCustomerResponse extends PetResponse {
  customer: CustomerSummaryResponse;
}

export interface CustomerSummaryResponse {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface PetCreateInput {
  name: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  gender: string;
  customerId: string;
  locationId?: string;
  internalId?: string;
  weight?: number;
  weightUnit?: string;
  microchipNumber?: string;
  isNeutered?: boolean;
  profileImage?: string;
}

export interface PetUpdateInput extends Partial<Omit<PetCreateInput, 'customerId'>> {
  isDeceased?: boolean;
}

// ============================================================================
// Appointment Types
// ============================================================================

export interface AppointmentResponse {
  id: string;
  dateTime: string;
  duration: number;
  reason: string;
  notes: string | null;
  status: string;
  petId: string;
  customerId: string | null;
  staffId: string | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentWithRelationsResponse extends AppointmentResponse {
  pet: PetSummaryResponse;
  customer: CustomerSummaryResponse | null;
  staff: StaffSummaryResponse | null;
  location: LocationSummaryResponse | null;
}

export interface StaffSummaryResponse {
  id: string;
  name: string;
  position: string;
}

export interface LocationSummaryResponse {
  id: string;
  name: string;
  slug: string;
}

export interface AppointmentCreateInput {
  dateTime: string;
  duration?: number;
  reason: string;
  notes?: string;
  status?: string;
  petId: string;
  customerId?: string;
  staffId?: string;
  locationId?: string;
}

export type AppointmentUpdateInput = Partial<AppointmentCreateInput>;

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryItemResponse {
  id: string;
  name: string;
  category: string;
  description: string | null;
  activeCompound: string | null;
  presentation: string | null;
  measure: string | null;
  brand: string | null;
  quantity: number;
  minStock: number | null;
  expirationDate: string | null;
  status: string;
  batchNumber: string | null;
  specialNotes: string | null;
  storageLocation: string | null;
  cost: number | null;
  price: number | null;
  locationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemCreateInput {
  name: string;
  category: string;
  description?: string;
  activeCompound?: string;
  presentation?: string;
  measure?: string;
  brand?: string;
  quantity?: number;
  minStock?: number;
  expirationDate?: string;
  status?: string;
  batchNumber?: string;
  specialNotes?: string;
  storageLocation?: string;
  cost?: number;
  price?: number;
  locationId?: string;
}

export type InventoryItemUpdateInput = Partial<InventoryItemCreateInput>;

export interface InventoryTransferResponse {
  id: string;
  inventoryItemId: string;
  inventoryItem: InventoryItemSummaryResponse;
  fromLocationId: string;
  fromLocation: LocationSummaryResponse;
  toLocationId: string;
  toLocation: LocationSummaryResponse;
  quantity: number;
  status: string;
  notes: string | null;
  requestedById: string;
  requestedBy: StaffSummaryResponse;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemSummaryResponse {
  id: string;
  name: string;
  category: string;
}

export interface InventoryTransferCreateInput {
  inventoryItemId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  notes?: string;
  requestedById: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface SalesReportResponse {
  summary: {
    totalSales: number;
    totalRevenue: number;
    averageOrderValue: number;
    periodStart: string;
    periodEnd: string;
  };
  breakdown: SalesBreakdownItem[];
}

export interface SalesBreakdownItem {
  date?: string;
  category?: string;
  locationId?: string;
  locationName?: string;
  count: number;
  revenue: number;
}

export interface InventoryReportResponse {
  summary: {
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
  };
  byCategory: CategoryBreakdownItem[];
  lowStockItems: InventoryItemSummaryWithQuantity[];
  expiringItems: InventoryItemSummaryWithExpiry[];
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
  totalValue: number;
}

export interface InventoryItemSummaryWithQuantity {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number | null;
  locationId: string | null;
}

export interface InventoryItemSummaryWithExpiry {
  id: string;
  name: string;
  category: string;
  quantity: number;
  expirationDate: string;
  locationId: string | null;
}
