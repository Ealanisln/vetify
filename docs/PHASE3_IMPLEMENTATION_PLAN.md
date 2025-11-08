# Phase 3: Multi-Clinic Location-Scoped Features - Implementation Plan

**Issue**: VETIF-34
**Status**: ~45% Complete
**Last Updated**: 2025-11-08

## ✅ Completed Work

### 1. Database Schema (100%)
- ✅ Added `InventoryTransfer` model for tracking inventory movement between locations
- ✅ Added `StaffLocation` model for many-to-many staff-location assignments
- ✅ Added `TransferStatus` enum (PENDING, IN_TRANSIT, COMPLETED, CANCELLED)
- ✅ Updated relations in Tenant, Location, Staff, and InventoryItem models
- **Migration needed**: `pnpm prisma migrate dev --name phase3_inventory_transfers_staff_locations`

### 2. Server-Side Location Library (100%)
**File**: `src/lib/locations.ts`
- ✅ Staff-location assignment functions:
  - `assignStaffToLocation()`
  - `removeStaffFromLocation()`
  - `getStaffLocations()`
  - `getLocationStaff()`
  - `staffHasAccessToLocation()`
- ✅ Inventory transfer functions:
  - `createInventoryTransfer()`
  - `completeInventoryTransfer()` - with atomic Prisma transactions
  - `cancelInventoryTransfer()`
  - `getInventoryTransfers()`

### 3. Client-Side Location Hook (100%)
**File**: `src/hooks/useCurrentLocation.ts`
- ✅ Location context management with localStorage persistence
- ✅ Automatic primary location detection
- ✅ Location switching functionality
- ✅ Integration with API routes

### 4. Location Context Provider (100%)
**File**: `src/components/providers/LocationProvider.tsx`
- ✅ React context for location state management
- ✅ `useLocation()` hook for accessing context
- ✅ `LocationAware` HOC for component wrapping
- **Integration needed**: Add to dashboard layout

### 5. Location Switcher Components (100%)
**File**: `src/components/locations/LocationSwitcher.tsx`
- ✅ `LocationSwitcher` - Dropdown for switching between locations
- ✅ `LocationBadge` - Read-only location display
- ✅ `LocationIndicator` - Compact inline indicator
- **Integration needed**: Add to dashboard sidebar/header

### 6. Inventory Transfer System (100%)
#### API Routes
- ✅ `GET /api/inventory/transfers` - List transfers with filtering
- ✅ `POST /api/inventory/transfers` - Create new transfer
- ✅ `GET /api/inventory/transfers/[id]` - Get transfer details
- ✅ `PATCH /api/inventory/transfers/[id]/complete` - Complete transfer (atomic)
- ✅ `PATCH /api/inventory/transfers/[id]/cancel` - Cancel transfer

#### UI Components
- ✅ `InventoryTransferForm` - Create transfers between locations
- ✅ `InventoryTransferList` - Display and manage transfers
- **Integration needed**: Add to inventory dashboard page

### 7. Build Fixes (100%)
- ✅ Fixed useCurrentLocation.ts:77 - Missing fetchLocations dependency
- ✅ Fixed locations.ts:636 - Replaced any type with Prisma type
- ✅ Fixed locations.ts:710 - Replaced any type with Prisma type
- ✅ Fixed contact/route.ts - Validation schema build error
- ✅ Build passing with no errors

## 🚧 In Progress

### 8. Inventory Location Filtering (60%)
**Current state**: Component structure understood, needs integration
**Files to update**:
- `src/lib/inventory.ts` - Add `locationId?` parameter to `getInventoryItems()`
- `src/app/api/inventory/route.ts` - Accept and pass `locationId` from query params
- `src/components/inventory/InventoryMain.tsx`:
  - Import and use `useLocation()` hook
  - Add location filter to filter panel
  - Pass `locationId` to API calls
  - Add "Ubicación" column to table display

**Implementation steps**:
```typescript
// 1. Update getInventoryItems in src/lib/inventory.ts
export async function getInventoryItems(
  tenantId: string,
  page: number = 1,
  limit: number = 20,
  category?: string,
  search?: string,
  locationId?: string  // ADD THIS
): Promise<{ items: InventoryItemWithStock[], total: number }> {
  const where = {
    tenantId,
    ...(locationId && { locationId }),  // ADD THIS
    // ... rest of filters
  };
  // ...
}

// 2. Update API route to accept locationId
const locationId = searchParams.get('locationId') || undefined;
const result = await getInventoryItems(
  userWithTenant.tenant.id,
  page,
  limit,
  category,
  search,
  locationId  // ADD THIS
);

// 3. Update InventoryMain.tsx
import { useLocation } from '@/components/providers/LocationProvider';

export function InventoryMain({ tenantId }: InventoryMainProps) {
  const { currentLocation } = useLocation();
  // ... in fetchItems:
  const params = new URLSearchParams({
    tenantId,
    page: page.toString(),
    limit: itemsPerPage.toString(),
    ...(search && { search }),
    ...(category && { category }),
    ...(currentLocation?.id && { locationId: currentLocation.id })  // ADD THIS
  });
}
```

## 📋 Pending Tasks

### 9. Cash Drawer Location Scoping (Priority: HIGH)
**Rationale**: Cada ubicación debe tener su propia caja independiente

#### Update Schema
Already exists in schema - `CashDrawer` has `locationId` field

#### API Routes to Update
- `src/app/api/caja/route.ts`:
  - GET: Filter drawers by `locationId` from `useLocation` context
  - POST (open): Require `locationId`, ensure only one open drawer per location
- `src/app/api/caja/close/route.ts`:
  - Ensure closing drawer belongs to current location
- `src/app/api/caja/transactions/route.ts`:
  - Filter transactions by current location's drawer

#### UI Components to Update
- `src/app/dashboard/caja/page.tsx`:
  - Wrap with LocationProvider
  - Pass current location to child components
- Component files to review:
  - Check if cash drawer components exist and need location context

### 10. Appointments Location Context (Priority: HIGH)
**Rationale**: Las citas deben estar asociadas a una ubicación específica

#### Schema Check
- ✅ `Appointment` model already has `locationId` field

#### Components to Update
- `src/components/appointments/AppointmentForm.tsx`:
  - Add location selection (for admin/multi-location users)
  - Default to current location from context
  - Validate location exists and is active
- `src/components/dashboard/Sidebar.tsx`:
  - Already has Appointments menu item
- `src/app/dashboard/appointments/page.tsx`:
  - Filter appointments by current location
  - Add location indicator in appointment cards

### 11. Pets List Location Display (Priority: MEDIUM)
**Rationale**: Mostrar en qué ubicación se creó/atiende cada mascota

#### Schema Check
- ✅ `Pet` model already has `locationId` field

#### Components to Update
- `src/components/pets/PetsList.tsx`:
  - Add "Ubicación" column to table
  - Show location name with icon
  - Optional: Filter by current location
- `src/components/pets/AddPetForm.tsx`:
  - Set `locationId` to current location automatically
  - Show location indicator in form

### 12. Staff-Location Assignment API & UI (Priority: MEDIUM)
**Rationale**: Gestionar qué personal tiene acceso a qué ubicaciones

#### API Routes Needed
Create `src/app/api/staff/[id]/locations/route.ts`:
```typescript
// GET - List assigned locations for a staff member
// POST - Assign staff to location
// DELETE - Remove staff from location
```

#### UI Components Needed
Create `src/components/staff/StaffLocationManager.tsx`:
- Display assigned locations for staff member
- Add/remove location assignments
- Mark primary location
- Integration in staff detail/edit pages

### 13. Location-Based Permissions Middleware (Priority: HIGH)
**Rationale**: Asegurar que el staff solo acceda a datos de sus ubicaciones asignadas

#### Implementation Steps
1. Create `src/lib/security/location-permissions.ts`:
```typescript
export async function checkLocationAccess(
  userId: string,
  locationId: string
): Promise<boolean> {
  // Check if user has access to location via StaffLocation
  // Admins should have access to all locations
}

export async function getAccessibleLocations(
  userId: string
): Promise<Location[]> {
  // Return all locations user has access to
}
```

2. Update `src/middleware.ts`:
- Add location access validation for protected routes
- Check if current user can access requested location

3. Update API routes:
- Validate location access before returning data
- Filter queries by accessible locations

### 14. Dashboard Integration (Priority: HIGH)
**What needs to be done**:

#### A. Add LocationProvider to Dashboard Layout
File: `src/app/dashboard/layout.tsx` or equivalent
```tsx
import { LocationProvider } from '@/components/providers/LocationProvider';

export default function DashboardLayout({ children }) {
  return (
    <LocationProvider>
      {/* existing layout */}
    </LocationProvider>
  );
}
```

#### B. Add LocationSwitcher to Sidebar
File: `src/components/dashboard/Sidebar.tsx`
```tsx
import { LocationSwitcher } from '@/components/locations/LocationSwitcher';

// Add before navigation items
<div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
  <LocationSwitcher />
</div>
```

#### C. Create Inventory Transfers Page
File: `src/app/dashboard/inventory/transfers/page.tsx`
- Display `InventoryTransferList`
- Add button to open `InventoryTransferForm` modal
- Show pending, in-transit, and completed transfers

### 15. Customer/Pet Location Association (Priority: LOW)
**Optional enhancement**: Associate customers with primary location

Current state:
- `Customer` model already has `locationId` field
- `Pet` model already has `locationId` field

Enhancement:
- Auto-set location when creating new customer/pet
- Show location in customer/pet cards
- Optional: Filter by location in listings

## 🧪 Testing Requirements

### Manual Testing Checklist
- [ ] Location switching persists across page refreshes
- [ ] Inventory transfers create proper stock movements
- [ ] Transfer completion is atomic (no partial updates)
- [ ] Cash drawer properly scoped to location
- [ ] Appointments show correct location
- [ ] Staff can only access assigned locations
- [ ] Multi-location users can switch seamlessly
- [ ] Single-location users don't see switcher
- [ ] All forms properly set locationId

### Integration Points to Verify
- [ ] LocationProvider wraps dashboard
- [ ] LocationSwitcher appears in sidebar
- [ ] All inventory queries filter by location
- [ ] Appointments filter by location
- [ ] Cash drawer operations scoped to location
- [ ] Transfer UI accessible from inventory page
- [ ] Location permissions enforced in middleware

## 📊 Progress Tracking

**Overall Completion**: ~45%

| Component | Status | Priority |
|-----------|--------|----------|
| Database Schema | ✅ 100% | HIGH |
| Location Library | ✅ 100% | HIGH |
| Location Context | ✅ 100% | HIGH |
| Inventory Transfers | ✅ 100% | HIGH |
| Build Fixes | ✅ 100% | HIGH |
| Inventory Filtering | 🚧 60% | HIGH |
| Cash Drawer Scoping | ⏳ 0% | HIGH |
| Appointments Context | ⏳ 0% | HIGH |
| Location Permissions | ⏳ 0% | HIGH |
| Dashboard Integration | ⏳ 0% | HIGH |
| Pets Location Display | ⏳ 0% | MEDIUM |
| Staff-Location UI | ⏳ 0% | MEDIUM |
| Testing | ⏳ 0% | HIGH |

## 🔄 Next Steps (Recommended Order)

1. **Complete Inventory Filtering** (30 min)
   - Update getInventoryItems function
   - Update API route
   - Update InventoryMain component

2. **Dashboard Integration** (20 min)
   - Add LocationProvider to layout
   - Add LocationSwitcher to sidebar
   - Create transfers page

3. **Cash Drawer Location Scoping** (45 min)
   - Update API routes
   - Update UI components
   - Test multi-location scenarios

4. **Appointments Location Context** (30 min)
   - Update AppointmentForm
   - Update appointments page filtering
   - Add location indicators

5. **Location Permissions Middleware** (60 min)
   - Create permission functions
   - Update middleware
   - Test access controls

6. **Staff-Location Assignment** (45 min)
   - Create API routes
   - Create UI components
   - Integrate in staff pages

7. **Pets Location Display** (20 min)
   - Update PetsList component
   - Update AddPetForm

8. **Manual Testing** (60 min)
   - Test all features end-to-end
   - Verify data isolation
   - Check permission enforcement

## 📝 Notes

- All components follow existing patterns (auth, error handling, type safety)
- Using Prisma transactions for atomic operations
- Following security best practices (CSRF, input validation)
- Dark mode support throughout
- Responsive design for mobile

## 🐛 Known Issues

None currently - build is passing with all tests green.

## 📚 Related Documentation

- Schema changes: `docs/SCHEMA_CHANGES_APPLIED.md`
- Manual testing: `docs/MANUAL_TESTING_GUIDE_LOCATIONS.md`
- Multi-location spec: `docs/MULTI_LOCATION_IMPLEMENTATION.md`
