# Manual Testing Guide: Phase 3 - Location-Scoped Features

**Feature:** Multi-Clinic Location-Scoped Data & Permissions (Phase 3)
**Plane Issue:** VETIF-34
**Date:** November 8, 2025
**Prerequisites:** Phase 2 (Location Management) completed and tested

## Overview

Phase 3 adds location-scoped functionality to core operational data:
- Inventory filtering by location
- Cash drawer location-scoped operations
- Appointments with location context
- Staff-location assignments
- Location permissions and access control

## Prerequisites

Before testing:
- ✅ Phase 2 testing completed (locations created, sidebar navigation working)
- ✅ At least 2-3 active locations exist in your test tenant
- ✅ Development server running (`pnpm dev`)
- ✅ Multiple staff members created for assignment testing
- ✅ Test data: pets, customers, appointments, inventory items

## Test Environment Setup

1. Ensure you have test locations:
```sql
SELECT id, name, slug, "isPrimary"
FROM "Location"
WHERE "tenantId" = 'YOUR_TENANT_ID'
AND "isActive" = true;
```

2. Login to dashboard at `http://localhost:3000/dashboard`

3. Have browser DevTools open for console errors

---

## Test Scenarios

### 1. Location Context Switcher (Dashboard)

#### 1.1 View Location Switcher
**Objective:** Verify location switcher appears in dashboard header

**Steps:**
1. Login to dashboard
2. Observe top navigation bar
3. Locate location dropdown/switcher

**Expected Results:**
- ✅ Location switcher visible in header (next to user menu)
- ✅ Shows current selected location name
- ✅ Dropdown icon present
- ✅ Clicking opens location list
- ✅ All active locations listed
- ✅ Primary location indicated with "(Principal)" or icon
- ✅ Current selection highlighted

**Screenshot:** Header with location switcher expanded

---

#### 1.2 Switch Between Locations
**Objective:** Change active location context

**Steps:**
1. Note current selected location
2. Click location switcher dropdown
3. Select different location
4. Observe page behavior

**Expected Results:**
- ✅ Page refreshes or data updates
- ✅ New location shown in switcher
- ✅ Context persists across navigation
- ✅ URL parameter or session updated
- ✅ Dashboard widgets reflect new location data
- ✅ Sidebar navigation still functional

**Test Each Section:**
- Switch location, then navigate to Inventory → data should be location-specific
- Switch location, then navigate to Appointments → data should be location-specific
- Switch location, then navigate to Caja → cash drawer should be location-specific

---

### 2. Inventory - Location Filtering

#### 2.1 View Inventory by Location
**Objective:** Verify inventory filters by selected location

**Steps:**
1. Navigate to Dashboard > Inventario
2. Observe inventory items listed
3. Note which location is selected in header switcher
4. Switch to different location
5. Observe inventory list updates

**Expected Results:**
- ✅ Inventory items displayed only for current location
- ✅ Switching location updates inventory list immediately
- ✅ Item counts accurate per location
- ✅ Low stock warnings location-specific
- ✅ No items from other locations shown
- ✅ Empty state if location has no inventory

**Database Verification:**
```sql
-- Check inventory for specific location
SELECT name, quantity, "locationId"
FROM "InventoryItem"
WHERE "tenantId" = 'YOUR_TENANT_ID'
AND "locationId" = 'SELECTED_LOCATION_ID'
AND status = 'ACTIVE';
```

---

#### 2.2 Create Inventory Item with Location
**Objective:** New inventory items assigned to current location

**Steps:**
1. Select a specific location via switcher (e.g., "Sucursal Norte")
2. Navigate to Inventario
3. Click "Agregar Item" or "+"
4. Fill in item details (name, category, quantity, etc.)
5. Observe location field in form
6. Submit form

**Expected Results:**
- ✅ Location field pre-filled with currently selected location
- ✅ Location field shows current location name
- ✅ Can optionally change location before submitting
- ✅ Item created successfully
- ✅ Item associated with correct locationId in database
- ✅ Item appears only when that location is selected

**Database Verification:**
```sql
SELECT name, "locationId"
FROM "InventoryItem"
WHERE name = 'TEST_ITEM_NAME';
-- Should match the location you had selected
```

---

#### 2.3 Inventory Transfer Between Locations
**Objective:** Transfer inventory from one location to another

**Steps:**
1. Navigate to Inventario
2. Select an item that has stock
3. Click "Transferir" or transfer button
4. Fill in transfer form:
   - From Location: (should be current location)
   - To Location: (select different location)
   - Quantity: (less than available stock)
   - Notes: "Test transfer"
5. Submit transfer

**Expected Results:**
- ✅ Transfer form opens with correct source location
- ✅ Destination dropdown shows other active locations
- ✅ Quantity validation (can't exceed available)
- ✅ Transfer created with PENDING status
- ✅ Source inventory quantity decremented
- ✅ Destination inventory quantity incremented (after completion)
- ✅ Inventory movement records created

**Database Verification:**
```sql
-- Check transfer record
SELECT "fromLocationId", "toLocationId", quantity, status
FROM "InventoryTransfer"
WHERE notes = 'Test transfer'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Check inventory movements
SELECT type, quantity, reason
FROM "InventoryMovement"
WHERE "relatedRecordType" = 'InventoryTransfer'
AND "relatedRecordId" = 'TRANSFER_ID';
```

**Test Transfer States:**
- [ ] Create transfer (PENDING)
- [ ] Complete transfer (COMPLETED)
- [ ] Cancel transfer (CANCELLED)

---

### 3. Cash Drawer - Location Scoping

#### 3.1 View Cash Drawer by Location
**Objective:** Cash drawer operations scoped to location

**Steps:**
1. Navigate to Dashboard > Caja (Cash Register)
2. Note current location in header
3. Observe cash drawer details
4. Switch to different location
5. Observe cash drawer changes

**Expected Results:**
- ✅ Each location has its own cash drawer
- ✅ Opening balance specific to location
- ✅ Transactions only for current location
- ✅ Switching location shows different cash drawer
- ✅ Cannot access other location's cash drawer

**Database Verification:**
```sql
SELECT "locationId", "openingBalance", status, "openedAt"
FROM "CashDrawer"
WHERE "tenantId" = 'YOUR_TENANT_ID'
AND "locationId" = 'LOCATION_ID'
ORDER BY "openedAt" DESC;
```

---

#### 3.2 Open/Close Cash Drawer per Location
**Objective:** Independent cash drawer operations per location

**Steps:**
1. Select Location A
2. Open cash drawer for Location A
3. Add some transactions
4. Switch to Location B
5. Observe Location B cash drawer state
6. Open cash drawer for Location B (if needed)
7. Switch back to Location A
8. Verify Location A cash drawer still open

**Expected Results:**
- ✅ Each location's cash drawer operates independently
- ✅ Opening drawer at Location A doesn't affect Location B
- ✅ Transactions recorded to correct location's drawer
- ✅ Closing drawer only closes current location's drawer
- ✅ Historical drawer sessions per location

---

### 4. Appointments - Location Context

#### 4.1 View Appointments by Location
**Objective:** Appointments filtered by selected location

**Steps:**
1. Navigate to Dashboard > Citas (Appointments)
2. Observe appointments listed
3. Note current selected location
4. Check if location is shown for each appointment
5. Switch to different location
6. Observe appointments list updates

**Expected Results:**
- ✅ Only appointments for selected location shown
- ✅ Each appointment displays its location (name or icon)
- ✅ Switching location refreshes appointment list
- ✅ Calendar view (if present) shows location-specific appointments
- ✅ Appointment counts per location accurate

**Visual Check:**
- [ ] Location name or icon visible on appointment cards
- [ ] MapPinIcon displayed next to location name
- [ ] Location info in appointment details view

---

#### 4.2 Create Appointment with Location
**Objective:** New appointments assigned to current location

**Steps:**
1. Select a specific location via header switcher
2. Navigate to Citas
3. Click "Nueva Cita"
4. Fill appointment form:
   - Select customer/pet
   - Select date/time
   - Select staff
5. Observe location field
6. Submit form

**Expected Results:**
- ✅ Location field pre-filled with current location
- ✅ Can change location if needed
- ✅ Appointment created with correct locationId
- ✅ Appointment appears when that location is selected
- ✅ Appointment doesn't appear when different location selected

**Database Verification:**
```sql
SELECT "dateTime", "locationId", "customerId"
FROM "Appointment"
WHERE "dateTime" > CURRENT_TIMESTAMP
AND "tenantId" = 'YOUR_TENANT_ID'
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

### 5. Pets - Location Display

#### 5.1 View Pets List with Location
**Objective:** Pets display their assigned location

**Steps:**
1. Navigate to Dashboard > Mascotas (Pets)
2. Observe pets list
3. For each pet, check if location is shown
4. Search for a specific pet
5. Click on a pet to view details

**Expected Results:**
- ✅ Each pet shows location name with MapPin icon
- ✅ Location displayed next to owner info
- ✅ Location shown as: "📍 Sucursal Norte"
- ✅ Pet details page shows location
- ✅ Search still works across all pets
- ✅ Location info doesn't break mobile layout

**Visual Check:**
- [ ] MapPinIcon renders correctly (h-3 w-3 size)
- [ ] Location text doesn't wrap awkwardly
- [ ] Location visible but not overwhelming
- [ ] Works in dark mode

---

#### 5.2 Create Pet with Location
**Objective:** New pets assigned to location

**Steps:**
1. Select a location in header switcher
2. Navigate to Mascotas
3. Click "Nueva Mascota"
4. Fill in pet details
5. Observe location selector in form
6. Submit form

**Expected Results:**
- ✅ Location selector present in form
- ✅ Current location pre-selected
- ✅ Pet created with correct locationId
- ✅ Pet shows location in list
- ✅ Location persisted in database

---

### 6. Staff-Location Assignments

#### 6.1 View Staff Locations
**Objective:** Access staff detail page to manage locations

**Steps:**
1. Navigate to Dashboard > Personal (Staff)
2. Click on a staff member to view details
3. Scroll to "Ubicaciones Asignadas" section
4. Observe assigned locations list

**Expected Results:**
- ✅ StaffLocationManager component visible
- ✅ Shows all locations assigned to staff
- ✅ Primary location indicated with badge or star icon
- ✅ Each location shows:
  - Name
  - Address (if available)
  - Primary indicator
  - Set Primary button (for non-primary)
  - Remove button (if more than one location)
- ✅ "Agregar Ubicación" button visible if unassigned locations exist

**Screenshot:** Staff detail page with locations section

---

#### 6.2 Assign Staff to Location
**Objective:** Add location assignment to staff

**Steps:**
1. On staff detail page, click "Agregar Ubicación"
2. Select an unassigned location from dropdown
3. Click "Asignar"
4. Observe confirmation

**Expected Results:**
- ✅ Dropdown shows only unassigned locations
- ✅ Success toast notification appears
- ✅ New location added to assigned list
- ✅ If this is first location, it's set as primary automatically
- ✅ Location persisted in database
- ✅ Remove button appears for the new location

**Database Verification:**
```sql
SELECT sl."staffId", sl."locationId", sl."isPrimary", l.name
FROM "StaffLocation" sl
JOIN "Location" l ON l.id = sl."locationId"
WHERE sl."staffId" = 'STAFF_ID';
```

---

#### 6.3 Set Primary Location for Staff
**Objective:** Change staff's primary location

**Steps:**
1. View staff with multiple location assignments
2. Identify current primary location (has badge/solid star)
3. Find a non-primary location
4. Click "Set Primary" button (star icon) for non-primary location
5. Observe changes

**Expected Results:**
- ✅ Confirmation or immediate update
- ✅ Selected location becomes primary (badge changes)
- ✅ Previous primary location loses primary status
- ✅ Success notification appears
- ✅ Only ONE location is primary at any time
- ✅ Database updated correctly

**Visual Check:**
- [ ] Primary badge says "Principal"
- [ ] Primary location has solid star icon (StarSolidIcon)
- [ ] Non-primary has outline star icon (StarIcon)
- [ ] Star icon is yellow/gold color

---

#### 6.4 Remove Staff Location Assignment
**Objective:** Unassign staff from location

**Steps:**
1. View staff with at least 2 location assignments
2. Click "Remove" button (trash icon) for non-primary location
3. Confirm deletion in dialog
4. Observe update

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ After confirmation, location removed from list
- ✅ Success notification
- ✅ Database record deleted
- ✅ CANNOT remove if it's the only location (button disabled)
- ✅ Error message if attempting to remove last location

**Constraint Test:**
- Try to remove last location → should be prevented
- "No se puede eliminar la última ubicación asignada al staff"

---

#### 6.5 Staff with No Locations
**Objective:** Handle staff without location assignments

**Steps:**
1. Create a new staff member (or find one without locations)
2. View staff detail page
3. Observe locations section

**Expected Results:**
- ✅ Empty state message displayed
- ✅ "No hay ubicaciones asignadas" message
- ✅ "Asigna al menos una ubicación para este staff" prompt
- ✅ MapPinIcon shown in empty state
- ✅ "Agregar Ubicación" button still accessible

---

### 7. Location Permissions & Access Control

#### 7.1 Filtering by Staff Locations (Future Implementation)
**Objective:** Staff can only see resources from assigned locations

**Note:** This test is for future API route updates. Currently, location helpers are in place but not yet enforced in all routes.

**Steps:**
1. Create Staff A assigned to Location 1 only
2. Create Staff B assigned to Location 2 only
3. Create pets/appointments in both locations
4. Login as user linked to Staff A
5. Navigate to pets/appointments

**Expected Behavior (when fully implemented):**
- ✅ Staff A sees only resources from Location 1
- ✅ Staff B sees only resources from Location 2
- ✅ Attempting to access other location's resources returns 403
- ✅ API routes use `filterByStaffLocations` helper
- ✅ Create operations default to staff's primary location

**Implementation Check:**
- [ ] Pets API routes use location filtering
- [ ] Appointments API routes use location filtering
- [ ] Customers API routes use location filtering
- [ ] Inventory API routes use location filtering

---

### 8. Integration Testing

#### 8.1 End-to-End Workflow - Multi-Location Clinic
**Objective:** Test complete multi-location workflow

**Scenario:** Clinic with 3 locations (Central, Norte, Sur)

**Setup:**
1. Create 3 locations (if not exist)
2. Create 2 staff members:
   - Staff A: Assigned to Central & Norte
   - Staff B: Assigned to Sur only
3. Add inventory to each location
4. Create customers and pets at different locations

**Workflow:**
1. Select Location: Central
2. Check inventory → only Central items
3. Open cash drawer for Central
4. Create appointment at Central
5. Record a sale at Central
6. Switch to Location: Norte
7. Check inventory → only Norte items
8. Cash drawer should be for Norte (separate)
9. Create appointment at Norte
10. Switch back to Central
11. Verify cash drawer still open
12. Close Central cash drawer

**Expected Results:**
- ✅ Each location operates independently
- ✅ Data properly scoped per location
- ✅ No cross-contamination between locations
- ✅ Staff can switch contexts seamlessly
- ✅ All operations complete successfully

---

### 9. Edge Cases & Error Scenarios

#### 9.1 Location with No Data
**Objective:** Handle empty location gracefully

**Steps:**
1. Create a brand new location
2. Ensure it has no inventory, appointments, pets
3. Switch to that location
4. Navigate to each section

**Expected Results:**
- ✅ Inventory: empty state displayed
- ✅ Appointments: empty state displayed
- ✅ Cash Drawer: can be opened (no previous transactions)
- ✅ No errors or crashes
- ✅ Prompts to add data to location

---

#### 9.2 Deleting Location with Data
**Objective:** Prevent deletion of location with related data

**Steps:**
1. Create a location and add:
   - 1 inventory item
   - 1 pet
   - 1 appointment
   - Assign 1 staff member
2. Attempt to delete the location

**Expected Results:**
- ✅ Deletion blocked/prevented
- ✅ Error message explains why
- ✅ Shows count of related records:
  - "Esta ubicación tiene X staff, Y mascotas, Z citas, W items..."
- ✅ Location not deleted from database
- ✅ User must reassign/remove data first

---

#### 9.3 Staff Without Location Accessing Resources
**Objective:** Handle staff with no location assignments

**Steps:**
1. Create/find staff with no location assignments
2. Login as user linked to that staff
3. Try to access pets, appointments, inventory

**Expected Behavior:**
- ⚠️ May show empty state (no accessible resources)
- ⚠️ May show error message
- ⚠️ Depends on API implementation
- Note: This edge case should be rare as staff should always have at least one location

---

### 10. Performance & UX Testing

#### 10.1 Location Switch Performance
**Objective:** Verify location switching is responsive

**Steps:**
1. Open DevTools > Network tab
2. Switch between locations multiple times
3. Observe:
   - Page refresh time
   - Network requests
   - UI responsiveness

**Expected Results:**
- ✅ Location switch feels instant or near-instant
- ✅ Minimal network requests (only fetch new location data)
- ✅ No full page reload (unless intentionally designed)
- ✅ Loading states if data fetching takes time
- ✅ No console errors

---

#### 10.2 Mobile Responsiveness
**Objective:** Location features work on mobile

**Steps:**
1. Open DevTools device toolbar (mobile view)
2. Test location switcher
3. Test staff-location assignments
4. Test location display in lists

**Expected Results:**
- ✅ Location switcher accessible on mobile
- ✅ Dropdown doesn't overflow screen
- ✅ Staff location manager usable on mobile
- ✅ Location badges/icons sized appropriately
- ✅ Touch targets large enough

---

### 11. Dark Mode Consistency

#### 11.1 Dark Mode for Phase 3 Components
**Objective:** All Phase 3 features support dark mode

**Steps:**
1. Toggle to dark mode
2. Test each Phase 3 component:
   - Location switcher
   - Staff location manager
   - Location badges in lists
   - Inventory filtering UI

**Expected Results:**
- ✅ All text readable (sufficient contrast)
- ✅ Backgrounds appropriate for dark theme
- ✅ Icons visible in dark mode
- ✅ Badges/pills use dark mode colors
- ✅ Forms styled for dark mode
- ✅ No white flashes

---

## Test Data Setup

### Sample Data Script

```typescript
// Create test locations
const locations = [
  {
    name: "Clínica Central",
    slug: "clinica-central",
    isPrimary: true,
    isActive: true,
    address: "Av. Principal 123"
  },
  {
    name: "Sucursal Norte",
    slug: "sucursal-norte",
    isActive: true,
    address: "Calle Norte 456"
  },
  {
    name: "Sucursal Sur",
    slug: "sucursal-sur",
    isActive: true,
    address: "Av. Sur 789"
  }
];

// Create test staff assignments
// Staff A → Central & Norte (primary: Central)
// Staff B → Sur (primary: Sur)
// Staff C → All three (primary: Central)
```

---

## Checklist Summary

### Core Functionality
- [ ] Location switcher visible and functional
- [ ] Inventory filtered by location
- [ ] Cash drawer scoped to location
- [ ] Appointments show location
- [ ] Pets show location in list
- [ ] Staff-location assignments CRUD
- [ ] Set primary location for staff
- [ ] Cannot remove last staff location
- [ ] Location permissions helpers implemented

### Data Integrity
- [ ] Inventory items have locationId
- [ ] Appointments have locationId
- [ ] Pets have locationId (optional, can be null)
- [ ] Cash drawers have locationId
- [ ] Inventory transfers between locations
- [ ] Each location's data isolated

### UI/UX
- [ ] Location switcher in header
- [ ] Location badges in lists
- [ ] Staff location manager UI
- [ ] Empty states for no data
- [ ] Confirmation dialogs for deletions
- [ ] Success/error toast notifications
- [ ] Responsive on mobile
- [ ] Dark mode support

### Edge Cases
- [ ] Cannot delete location with data
- [ ] Cannot remove last staff location
- [ ] Empty location shows empty states
- [ ] Staff without locations handled gracefully
- [ ] Location switching doesn't break state

---

## Reporting Issues

Document any bugs found:

1. **Issue description:** What went wrong
2. **Steps to reproduce:** Exact sequence
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happened
5. **Environment:**
   - Browser & version
   - Screen size
   - Dark/light mode
   - Selected location
6. **Screenshots/videos:** Visual evidence
7. **Console errors:** Any JavaScript errors
8. **Database state:** Relevant DB queries if applicable

---

## Success Criteria

Phase 3 testing is successful when:

✅ All checklist items passed
✅ Location switcher works smoothly
✅ Inventory filtering accurate
✅ Cash drawer location-scoped
✅ Appointments show location correctly
✅ Pets display location
✅ Staff-location assignments functional
✅ No cross-location data leakage
✅ Performance acceptable (<2s switches)
✅ Mobile responsive
✅ Dark mode works
✅ No critical bugs
✅ Database integrity maintained

---

## Next Steps

After successful Phase 3 testing:

1. ✅ Document any issues found and severity
2. ✅ Fix critical/blocking bugs
3. ✅ Verify fixes with regression testing
4. ✅ Update any documentation if behavior differs
5. ✅ Prepare for deployment or next phase
6. [ ] Update API routes to enforce location permissions
7. [ ] Add location-based reporting/analytics

---

**Tester Name:** ________________
**Date Tested:** ________________
**Test Environment:** [ ] Development [ ] Staging [ ] Production
**Phase 3 Result:** [ ] PASS [ ] FAIL [ ] PARTIAL

**Critical Issues Found:** _______________________________________
**Notes:** _________________________________________________________
____________________________________________________________________
____________________________________________________________________
