# Manual Testing Guide: Multi-Location Feature

**Feature:** Multi-Location Management (Phase 2)
**Plane Issue:** VETIF-33
**Date:** November 7, 2025

## Prerequisites

Before testing:
- ✅ Development environment running (`pnpm dev`)
- ✅ Database migrated with Location model
- ✅ At least one tenant account with authentication
- ✅ Browser developer tools open (for debugging)

## Test Environment Setup

1. Start development server:
```bash
cd /Users/ealanis/Development/current-projects/vetify
pnpm dev
```

2. Login to dashboard at `http://localhost:3000/dashboard`

3. Navigate to **Ubicaciones** in the sidebar (between Personal and Punto de Venta)

## Test Scenarios

### 1. Location Management UI

#### 1.1 View Locations List
**Objective:** Verify locations list page displays correctly

**Steps:**
1. Click "Ubicaciones" in the sidebar
2. Observe the page loads

**Expected Results:**
- ✅ Page title displays "Ubicaciones" or "Gestión de Ubicaciones"
- ✅ Stats cards show: Total, Activas, Inactivas counts
- ✅ At least one default location visible (created from migration)
- ✅ Table headers: Nombre, Dirección, Estado, Principal, Acciones
- ✅ Search box present at top of list
- ✅ "Nueva Ubicación" button visible

**Screenshot Locations:** Stats section, Table header, First location row

---

#### 1.2 Search Functionality
**Objective:** Verify search filters locations correctly

**Steps:**
1. On locations list page, locate search input
2. Type a partial location name (e.g., "norte")
3. Observe results update

**Expected Results:**
- ✅ Search is case-insensitive
- ✅ Results filter as you type (debounced)
- ✅ Matching locations remain visible
- ✅ Non-matching locations hidden
- ✅ Clear search shows all locations again

**Edge Cases:**
- Search with no results shows empty state
- Special characters handled gracefully
- Spanish accents work (e.g., "clínica" finds "clinica")

---

### 2. Create Location

#### 2.1 Create Basic Location
**Objective:** Create a new location with minimal required fields

**Steps:**
1. Click "Nueva Ubicación" button
2. Fill in form:
   - **Nombre:** "Sucursal Norte"
   - Leave other fields empty
3. Observe auto-generated slug updates as you type
4. Click "Guardar"

**Expected Results:**
- ✅ Form validates required fields
- ✅ Slug auto-generates: "sucursal-norte"
- ✅ Success toast notification appears
- ✅ Success modal displays with options:
  - Ver todas las ubicaciones
  - Crear otra ubicación
- ✅ Location appears in list when navigating back
- ✅ New location is NOT primary (unless it's the first)
- ✅ New location is Active by default

**Data Validation:**
```sql
SELECT id, name, slug, "isPrimary", "isActive"
FROM "Location"
WHERE name = 'Sucursal Norte';
```

---

#### 2.2 Create Location with All Fields
**Objective:** Create location with complete information

**Steps:**
1. Click "Nueva Ubicación"
2. Fill in all fields:
   - **Nombre:** "Clínica Veterinaria del Sur"
   - **Slug:** "clinica-sur" (auto-generated, can edit)
   - **Dirección:** "Av. Insurgentes Sur 123, CDMX"
   - **Teléfono:** "+52 55 1234 5678"
   - **Email:** "sur@clinica.com"
   - **Zona Horaria:** "America/Mexico_City"
   - **Estado:** Active (checked)
   - **Ubicación Principal:** Unchecked
3. Click "Guardar"

**Expected Results:**
- ✅ All fields saved correctly
- ✅ Spanish characters in name handled properly
- ✅ Email validated (try invalid email to test)
- ✅ Phone number accepted without formatting
- ✅ Timezone defaults to Mexico City
- ✅ Success modal appears
- ✅ Location visible in list with all info

**Edge Cases to Test:**
- Name with accents: "Clínica Álvaro Obregón"
- Name with special chars: "Clínica & Spa"
- Very long name (>100 chars)
- Duplicate slug (should show error)

---

#### 2.3 Create Location as Primary
**Objective:** Create a new primary location

**Steps:**
1. Click "Nueva Ubicación"
2. Fill in:
   - **Nombre:** "Oficina Central"
   - **Ubicación Principal:** Checked ✓
3. Click "Guardar"

**Expected Results:**
- ✅ New location created successfully
- ✅ Previous primary location loses primary flag (check database)
- ✅ New location shown with "Principal" badge
- ✅ Only ONE primary location exists for tenant

**Database Verification:**
```sql
SELECT name, "isPrimary"
FROM "Location"
WHERE "tenantId" = 'YOUR_TENANT_ID'
AND "isPrimary" = true;
-- Should return exactly 1 row
```

---

### 3. Edit Location

#### 3.1 Edit Location Name
**Objective:** Update existing location's name

**Steps:**
1. On locations list, click edit icon (pencil) for any location
2. Change **Nombre** to "Sucursal Norte Actualizada"
3. Observe slug updates automatically
4. Click "Guardar Cambios"

**Expected Results:**
- ✅ Name updated in database
- ✅ Slug updated (or can be manually edited)
- ✅ Success toast displays
- ✅ Redirects to locations list
- ✅ Updated name visible in list

---

#### 3.2 Edit Contact Information
**Objective:** Update address, phone, email

**Steps:**
1. Click edit for a location
2. Update:
   - **Dirección:** "Nueva Calle 456"
   - **Teléfono:** "+52 55 9876 5432"
   - **Email:** "nuevoemail@clinica.com"
3. Click "Guardar Cambios"

**Expected Results:**
- ✅ All fields updated correctly
- ✅ Email validation works (test invalid email)
- ✅ Changes persisted to database
- ✅ Updated info visible in list

---

#### 3.3 Toggle Active Status
**Objective:** Deactivate and reactivate a location

**Steps:**
1. Edit a NON-PRIMARY location
2. Uncheck "Estado" (Active)
3. Save changes
4. Verify location shows as Inactive in list
5. Edit same location
6. Check "Estado" again
7. Save changes

**Expected Results:**
- ✅ Location can be deactivated
- ✅ Inactive locations show "Inactiva" badge
- ✅ Inactive locations do NOT appear in LocationSelector
- ✅ Location can be reactivated
- ✅ Active locations show "Activa" badge

**Constraint Test:**
- Try to deactivate PRIMARY location (should be prevented or warned)

---

### 4. Set Primary Location

#### 4.1 Change Primary Location
**Objective:** Set a different location as primary

**Steps:**
1. On locations list, identify current primary location (has badge)
2. Find a different location
3. Click "Establecer como Principal" button for that location
4. Confirm in confirmation dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ After confirmation, selected location becomes primary
- ✅ Previous primary location loses primary badge
- ✅ Only ONE location has primary badge at any time
- ✅ Toast notification confirms change
- ✅ List updates immediately

**Database Verification:**
```sql
SELECT id, name, "isPrimary"
FROM "Location"
WHERE "tenantId" = 'YOUR_TENANT_ID';
-- Exactly 1 should have isPrimary = true
```

---

### 5. Delete Location

#### 5.1 Delete Non-Primary Location
**Objective:** Soft delete a location

**Steps:**
1. Create a test location (e.g., "Ubicación Temporal")
2. In locations list, click delete icon (trash) for that location
3. Read confirmation dialog carefully
4. Confirm deletion

**Expected Results:**
- ✅ Confirmation dialog appears with warning message
- ✅ After confirmation, location removed from list
- ✅ Location soft-deleted (isActive = false, deletedAt set)
- ✅ Success toast notification
- ✅ Stats counts update correctly

**Database Verification:**
```sql
SELECT id, name, "isActive", "deletedAt"
FROM "Location"
WHERE name = 'Ubicación Temporal';
-- Should have isActive = false and deletedAt timestamp
```

---

#### 5.2 Attempt to Delete Primary Location
**Objective:** Verify primary location cannot be deleted

**Steps:**
1. Try to delete the primary location

**Expected Results:**
- ✅ Delete button should be disabled, OR
- ✅ Confirmation dialog warns that primary locations cannot be deleted, OR
- ✅ Error message displayed after attempting deletion

**Note:** Implementation may vary - document actual behavior

---

### 6. Form Integration Testing

#### 6.1 Pet Creation with Location
**Objective:** Verify location selector in Add Pet form

**Steps:**
1. Navigate to Dashboard > Mascotas
2. Click "Nueva Mascota" or "+" button
3. Scroll to location selector field
4. Observe default selected location

**Expected Results:**
- ✅ LocationSelector component visible in form
- ✅ Labeled "Ubicación" with optional asterisk if required
- ✅ Dropdown shows all ACTIVE locations
- ✅ Primary location pre-selected by default
- ✅ Primary location shows "(Principal)" label in dropdown
- ✅ Can change selection

**Complete Pet Creation:**
1. Fill in all required pet fields
2. Select a specific location (non-primary)
3. Submit form
4. Verify pet created with correct locationId

**Database Verification:**
```sql
SELECT name, "locationId"
FROM "Pet"
WHERE name = 'TEST_PET_NAME';
-- Should match selected location's ID
```

---

#### 6.2 Appointment Creation with Location
**Objective:** Verify location selector in Appointment form

**Steps:**
1. Navigate to Dashboard > Citas
2. Click "Nueva Cita"
3. Fill required appointment fields:
   - Select customer
   - Select pet
   - Select date/time
   - Select staff
4. Locate location selector
5. Observe default selection

**Expected Results:**
- ✅ LocationSelector present in form
- ✅ Primary location pre-selected
- ✅ Can change location
- ✅ Only active locations shown
- ✅ Location saved with appointment

**Complete Appointment:**
1. Select different location than primary
2. Submit form
3. Verify appointment created

**Database Verification:**
```sql
SELECT "scheduledAt", "locationId"
FROM "Appointment"
WHERE "customerId" = 'CUSTOMER_ID'
ORDER BY "createdAt" DESC
LIMIT 1;
```

---

#### 6.3 Customer Creation with Location
**Objective:** Verify location selector in New Customer form

**Steps:**
1. Navigate to Dashboard > Clientes
2. Click "Nuevo Cliente"
3. Fill customer information
4. Locate location selector
5. Optionally add pet(s)

**Expected Results:**
- ✅ LocationSelector visible in customer form
- ✅ Primary location pre-selected
- ✅ Customer created with locationId
- ✅ Associated pets also get same locationId

**Complete Customer with Pets:**
1. Fill customer details
2. Select a specific location
3. Add a pet
4. Submit form

**Database Verification:**
```sql
-- Check customer location
SELECT name, "locationId" FROM "Customer" WHERE name = 'TEST_CUSTOMER';

-- Check pet location (should match)
SELECT name, "locationId" FROM "Pet" WHERE "customerId" = 'CUSTOMER_ID';
```

---

### 7. Navigation Testing

#### 7.1 Sidebar Navigation
**Objective:** Verify "Ubicaciones" link in dashboard sidebar

**Steps:**
1. Login to dashboard
2. Observe sidebar on left (desktop) or hamburger menu (mobile)
3. Locate "Ubicaciones" menu item

**Expected Results:**
- ✅ "Ubicaciones" menu item visible
- ✅ MapPinIcon displayed correctly
- ✅ Positioned between "Personal" and "Punto de Venta"
- ✅ Clicking navigates to `/dashboard/locations`
- ✅ Active state highlights when on locations pages
- ✅ Works in both desktop and mobile layouts
- ✅ Dark mode styling correct

---

### 8. Edge Cases and Error Handling

#### 8.1 Empty State
**Objective:** Verify behavior when no locations exist (unlikely)

**Steps:**
1. Using database tool, soft-delete all locations (for testing only!)
2. Navigate to locations list
3. Observe empty state

**Expected Results:**
- ✅ Empty state message displayed
- ✅ "No hay ubicaciones" or similar message
- ✅ "Nueva Ubicación" button still accessible
- ✅ No errors in console

**Cleanup:** Restore locations or create new one

---

#### 8.2 API Error Handling
**Objective:** Test error scenarios

**Scenario A: Network Error**
1. Open DevTools > Network tab
2. Throttle to "Offline"
3. Try to load locations list

**Expected Results:**
- ✅ Error message displayed to user
- ✅ "Error al cargar ubicaciones" or similar
- ✅ No application crash

**Scenario B: Invalid Data**
1. Try to create location with empty name
2. Try to create location with invalid email
3. Try to create location with duplicate slug

**Expected Results:**
- ✅ Form validation prevents submission
- ✅ Error messages displayed inline
- ✅ Red validation indicators on invalid fields
- ✅ User can correct and resubmit

---

#### 8.3 Permission Boundaries
**Objective:** Verify tenant isolation

**Steps:**
1. Login as user from Tenant A
2. Note locations visible
3. Login as user from Tenant B (different tenant)
4. Note locations visible

**Expected Results:**
- ✅ Tenant A user sees only Tenant A locations
- ✅ Tenant B user sees only Tenant B locations
- ✅ No cross-tenant data leakage
- ✅ API returns 403/404 if trying to access other tenant's locations

**Security Note:** Critical test for multi-tenant isolation

---

### 9. Responsive Design Testing

#### 9.1 Mobile View (< 640px)
**Objective:** Verify mobile responsiveness

**Steps:**
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
3. Select iPhone SE or similar
4. Navigate through location pages

**Expected Results:**
- ✅ Stats cards stack vertically
- ✅ Table scrolls horizontally or adjusts to mobile view
- ✅ Forms remain usable with proper field widths
- ✅ Buttons appropriately sized for touch
- ✅ Modal dialogs fit screen
- ✅ Sidebar hamburger menu works

---

#### 9.2 Tablet View (640px - 1024px)
**Objective:** Verify tablet responsiveness

**Steps:**
1. Set DevTools to iPad or tablet size
2. Test all location pages

**Expected Results:**
- ✅ Layout adapts appropriately
- ✅ Stats cards in 2-column or 3-column grid
- ✅ Table remains readable
- ✅ Forms use available space effectively

---

### 10. Dark Mode Testing

#### 10.1 Dark Mode Consistency
**Objective:** Verify dark mode styling across location features

**Steps:**
1. Toggle to dark mode (theme switcher in nav)
2. Navigate through all location pages
3. Check colors, contrasts, and readability

**Expected Results:**
- ✅ All text readable (proper contrast)
- ✅ Background colors appropriate
- ✅ Buttons maintain visibility
- ✅ Icons color-coded correctly
- ✅ Form inputs styled for dark mode
- ✅ Modals use dark theme
- ✅ No white flashes or inconsistencies

---

### 11. Performance Testing

#### 11.1 Load Time
**Objective:** Verify acceptable page load performance

**Steps:**
1. Open Chrome DevTools > Network tab
2. Clear cache
3. Navigate to locations list page
4. Note load time and number of requests

**Expected Results:**
- ✅ Page loads in < 2 seconds on good connection
- ✅ Minimal number of network requests
- ✅ No unnecessary API calls
- ✅ Images/assets load efficiently

---

#### 11.2 Search Performance
**Objective:** Verify search doesn't lag with many locations

**Steps:**
1. If possible, create 10+ locations
2. Type quickly in search box
3. Observe responsiveness

**Expected Results:**
- ✅ Search is debounced (doesn't search on every keystroke)
- ✅ No noticeable lag when typing
- ✅ Results update smoothly

---

### 12. Accessibility Testing

#### 12.1 Keyboard Navigation
**Objective:** Verify keyboard-only navigation works

**Steps:**
1. Navigate to locations page
2. Use only keyboard:
   - Tab through form fields
   - Enter to submit forms
   - Esc to close modals
   - Arrow keys in dropdowns

**Expected Results:**
- ✅ All interactive elements focusable
- ✅ Focus indicators visible
- ✅ Logical tab order
- ✅ Can complete all actions via keyboard
- ✅ Esc closes modals/dialogs

---

#### 12.2 Screen Reader Testing (Optional)
**Objective:** Basic screen reader compatibility

**Steps:**
1. Enable VoiceOver (Mac) or NVDA (Windows)
2. Navigate locations list
3. Listen to announcements

**Expected Results:**
- ✅ Page structure announced logically
- ✅ Form fields have proper labels
- ✅ Buttons have descriptive text
- ✅ Interactive elements identified correctly

---

## Test Data Examples

### Sample Locations to Create

```javascript
// Location 1: Full details
{
  name: "Clínica Veterinaria Central",
  address: "Av. Reforma 123, CDMX 06000",
  phone: "+52 55 1234 5678",
  email: "central@vetify.com",
  timezone: "America/Mexico_City",
  isPrimary: true,
  isActive: true
}

// Location 2: Minimal
{
  name: "Sucursal Norte",
  isPrimary: false,
  isActive: true
}

// Location 3: With accents
{
  name: "Clínica Álvaro Obregón",
  address: "Av. Álvaro Obregón 456",
  phone: "+52 55 9876 5432",
  isActive: true
}

// Location 4: Inactive
{
  name: "Sucursal Temporal (Cerrada)",
  isActive: false
}
```

---

## Checklist Summary

Use this checklist during testing:

### Core Functionality
- [ ] View locations list with search
- [ ] Create location (minimal fields)
- [ ] Create location (all fields)
- [ ] Edit location name and details
- [ ] Delete location (non-primary)
- [ ] Set location as primary
- [ ] Location selector in Pet form
- [ ] Location selector in Appointment form
- [ ] Location selector in Customer form

### UI/UX
- [ ] Stats cards display correctly
- [ ] Table layout responsive
- [ ] Search functionality works
- [ ] Success/error notifications appear
- [ ] Confirmation dialogs for destructive actions
- [ ] Navigation link in sidebar
- [ ] Dark mode styling correct

### Edge Cases
- [ ] Cannot delete primary location
- [ ] Cannot create duplicate slugs
- [ ] Email validation works
- [ ] Handles Spanish characters
- [ ] Empty state displays
- [ ] API error handling
- [ ] Tenant isolation verified

### Responsive & Accessibility
- [ ] Mobile layout works (< 640px)
- [ ] Tablet layout works (640-1024px)
- [ ] Keyboard navigation functional
- [ ] Focus indicators visible
- [ ] Screen reader compatible (optional)

---

## Reporting Issues

If you find bugs during testing:

1. **Document the issue:**
   - What you were trying to do
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots/screen recording

2. **Check browser console:**
   - Any errors or warnings?
   - Copy full error messages

3. **Note environment:**
   - Browser and version
   - Screen size (if responsive issue)
   - Dark/light mode

4. **Create issue in Plane:**
   - Use label: "bug"
   - Link to VETIF-33
   - Include reproduction steps

---

## Success Criteria

Phase 2 testing is considered successful when:

✅ All checklist items passed
✅ No critical bugs found
✅ Performance acceptable
✅ Accessibility baseline met
✅ Dark mode fully functional
✅ Mobile/tablet layouts work
✅ No console errors
✅ Data persists correctly
✅ Tenant isolation verified

---

## Next Steps After Testing

1. Document any issues found
2. Fix critical bugs
3. Create tickets for enhancements
4. Update documentation with any behavior changes
5. Prepare for Phase 3 (Location-scoped features)

---

**Tester Name:** ________________
**Date Tested:** ________________
**Test Environment:** [ ] Development [ ] Staging [ ] Production
**Test Result:** [ ] PASS [ ] FAIL [ ] PARTIAL

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
