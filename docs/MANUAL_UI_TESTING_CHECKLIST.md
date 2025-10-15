# Manual UI Testing Checklist

**Purpose**: Verify all critical schema changes work correctly through the Vetify web application
**Environment**: Development (PostgreSQL local) or Staging (before production)
**Duration**: ~2-3 hours
**Prerequisites**: Dev server running (`pnpm dev`) with test tenant and user accounts

---

## 🎯 Testing Objectives

This checklist ensures that all schema changes (cascading deletes, SET NULL behavior, indexes, decimal precision) work correctly through the actual user interface, not just database tests.

---

## ✅ Pre-Testing Setup

### 1. Prepare Test Environment

- [ ] **Start dev server**
  ```bash
  pnpm dev
  ```

- [ ] **Verify database connection**
  - Check that `.env` has correct `DATABASE_URL`
  - Run `pnpm prisma db pull` to verify connectivity

- [ ] **Create test tenant** (if not exists)
  - [ ] Name: "TEST - UI Validation"
  - [ ] Email: `test-ui@example.com`
  - [ ] Note the tenant ID for reference

- [ ] **Create test user** with admin access
  - [ ] Email: `admin-test@example.com`
  - [ ] Ensure user is linked to test tenant

### 2. Prepare Test Data

Create the following test data through the UI or database:

- [ ] **3 Test Customers**
  - Customer A: "TEST_Alice" with email
  - Customer B: "TEST_Bob" with 2 pets
  - Customer C: "TEST_Charlie" with full history (pets, appointments, sales)

- [ ] **5 Test Inventory Items**
  - Medicine: "TEST_Aspirin"
  - Vaccine: "TEST_Rabies_Vaccine"
  - Food: "TEST_Premium_Food"
  - Supplement: "TEST_Vitamins"
  - Service: "TEST_Checkup"

- [ ] **Test Users** (for deletion testing)
  - User 1: Opened cash drawers
  - User 2: Closed cash drawers
  - User 3: Has appointments assigned

---

## 🧪 Test 1: Customer Deletion (Critical)

**Objective**: Verify CASCADE and SET NULL behavior when deleting customers

### Test 1.1: Delete Customer with Pets (CASCADE)

- [ ] **Navigate to**: `/dashboard/customers`
- [ ] **Select**: Customer B (with 2 pets)
- [ ] **View customer details** - Note number of pets
- [ ] **Delete customer**
  - [ ] Click "Delete Customer" button
  - [ ] Confirm deletion in modal
  - [ ] **Expected**: Success message shown

- [ ] **Verify CASCADE deletion**:
  - [ ] Navigate to `/dashboard/pets`
  - [ ] Search for Customer B's pets
  - [ ] **Expected**: Pets are deleted (not found)

- [ ] **Verify no errors** in browser console (F12)

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

### Test 1.2: Delete Customer with Appointments (SET NULL)

- [ ] **Setup**: Create appointment for Customer C
  - [ ] Navigate to `/dashboard/appointments`
  - [ ] Create new appointment for Customer C
  - [ ] Note appointment ID

- [ ] **Delete Customer C**
  - [ ] Navigate to `/dashboard/customers`
  - [ ] Delete Customer C
  - [ ] Confirm deletion

- [ ] **Verify SET NULL behavior**:
  - [ ] Navigate to `/dashboard/appointments`
  - [ ] Find the appointment by ID or date
  - [ ] **Expected**: Appointment still exists
  - [ ] **Expected**: Customer field shows "Unknown" or blank
  - [ ] Open browser dev tools → Network → Check response
  - [ ] **Expected**: `customerId: null` in response

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

### Test 1.3: Delete Customer with Sales (SET NULL)

- [ ] **Setup**: Create sale for a test customer
  - [ ] Navigate to `/dashboard/sales`
  - [ ] Create new sale for Customer A
  - [ ] Add 1-2 items
  - [ ] Complete sale
  - [ ] Note sale number

- [ ] **Delete Customer A**

- [ ] **Verify sale history preserved**:
  - [ ] Navigate to `/dashboard/sales`
  - [ ] Search for the sale by sale number
  - [ ] **Expected**: Sale still exists
  - [ ] **Expected**: Customer field shows null or "Unknown"
  - [ ] **Expected**: Sale items and totals intact

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 2: Product/Inventory Deletion (Critical)

**Objective**: Verify SET NULL behavior preserves sale history when products deleted

### Test 2.1: Delete Inventory Item Used in Sales

- [ ] **Setup**: Create sale with inventory item
  - [ ] Navigate to `/dashboard/sales`
  - [ ] Create sale with "TEST_Aspirin"
  - [ ] Complete sale
  - [ ] Note sale ID

- [ ] **Delete inventory item**:
  - [ ] Navigate to `/dashboard/inventory`
  - [ ] Find "TEST_Aspirin"
  - [ ] Delete item
  - [ ] Confirm deletion

- [ ] **Verify sale history preserved**:
  - [ ] Navigate to `/dashboard/sales`
  - [ ] Open the sale created above
  - [ ] **Expected**: Sale item still shows
  - [ ] **Expected**: Description shows "TEST_Aspirin"
  - [ ] **Expected**: Quantity and price intact
  - [ ] **Expected**: No reference to deleted inventory item (itemId = null internally)

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

### Test 2.2: Delete Service Used in Sales

- [ ] **Setup**: Create sale with service
  - [ ] Create sale with "TEST_Checkup" service
  - [ ] Complete sale

- [ ] **Delete service**:
  - [ ] Navigate to `/dashboard/services`
  - [ ] Delete "TEST_Checkup"

- [ ] **Verify sale preserved**:
  - [ ] Check sale still shows service description
  - [ ] **Expected**: Service details preserved

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 3: User Deletion (Critical)

**Objective**: Verify SET NULL on cash drawers allows user deletion

### Test 3.1: Delete User Who Opened Cash Drawer

- [ ] **Setup**: Create user and open drawer
  - [ ] Navigate to `/dashboard/admin/users` (or create via Kinde)
  - [ ] User opens a cash drawer
  - [ ] Close the drawer (optional)

- [ ] **Delete user**:
  - [ ] Navigate to user management
  - [ ] Delete the user
  - [ ] **Expected**: No error about foreign key constraint

- [ ] **Verify cash drawer preserved**:
  - [ ] Navigate to `/dashboard/cash-drawers`
  - [ ] Find the drawer
  - [ ] **Expected**: Drawer still exists
  - [ ] **Expected**: "Opened by" field shows null or "Unknown"

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 4: Multi-Tenant Isolation (Critical)

**Objective**: Verify users only see their tenant's data

### Test 4.1: Create Second Tenant and Verify Isolation

- [ ] **Create second tenant**:
  - [ ] Different user/email
  - [ ] Different tenant name

- [ ] **Add data to Tenant 1**:
  - [ ] Create customer "Tenant1_Customer"
  - [ ] Create pet "Tenant1_Pet"
  - [ ] Create appointment

- [ ] **Switch to Tenant 2** (logout/login as Tenant 2 user)

- [ ] **Verify data isolation**:
  - [ ] Navigate to `/dashboard/customers`
  - [ ] **Expected**: Do NOT see "Tenant1_Customer"
  - [ ] Navigate to `/dashboard/pets`
  - [ ] **Expected**: Do NOT see "Tenant1_Pet"
  - [ ] Navigate to `/dashboard/appointments`
  - [ ] **Expected**: Do NOT see Tenant 1 appointments

- [ ] **Create data in Tenant 2**:
  - [ ] Create customer "Tenant2_Customer"
  - [ ] Verify this customer is visible

- [ ] **Switch back to Tenant 1**

- [ ] **Verify Tenant 1 data still isolated**:
  - [ ] **Expected**: See only Tenant 1 data
  - [ ] **Expected**: Do NOT see Tenant 2 data

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 5: Decimal Precision (Important)

**Objective**: Verify money and quantity fields store/display correctly

### Test 5.1: Sale with Precise Decimal Values

- [ ] **Create sale with specific values**:
  - [ ] Navigate to `/dashboard/sales`
  - [ ] Create new sale
  - [ ] Add item: Quantity = `2.5`, Price = `99.99`
  - [ ] Add discount: `12.34`
  - [ ] Add tax: `8.75%`
  - [ ] Complete sale

- [ ] **Verify values displayed correctly**:
  - [ ] Subtotal: `$249.98` (2.5 × 99.99)
  - [ ] Discount: `$12.34`
  - [ ] Tax calculated on subtotal - discount
  - [ ] Total displays with 2 decimal places
  - [ ] **Expected**: No rounding errors
  - [ ] **Expected**: Cents displayed correctly

- [ ] **Reopen sale** and verify values persist

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

### Test 5.2: Inventory Quantity Precision

- [ ] **Create inventory item with decimal quantity**:
  - [ ] Navigate to `/dashboard/inventory`
  - [ ] Create item: "TEST_Liquid_Medicine"
  - [ ] Quantity: `15.75`
  - [ ] Min stock: `5.25`
  - [ ] Price: `45.99`

- [ ] **Verify stored correctly**:
  - [ ] Edit item
  - [ ] **Expected**: Quantity shows `15.75`
  - [ ] **Expected**: Min stock shows `5.25`
  - [ ] **Expected**: Price shows `45.99`

- [ ] **Perform inventory movement**:
  - [ ] Adjust quantity by `-3.25`
  - [ ] **Expected**: New quantity = `12.50`

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 6: Performance - Query Speed (Optional)

**Objective**: Verify composite indexes improve query performance

### Test 6.1: Appointment Calendar Load Time

- [ ] **Navigate to**: `/dashboard/appointments`
- [ ] **Open browser DevTools** → Network tab
- [ ] **Clear cache** (Cmd+Shift+R or Ctrl+Shift+R)
- [ ] **Reload page**
- [ ] **Check API request time**:
  - [ ] Look for `/api/appointments` or similar
  - [ ] **Expected**: Response time < 500ms
  - [ ] Note: Slower is OK if database has lots of data

**Result**: ✅ Pass / ❌ Fail
**Response Time**: _____ ms
**Notes**: _____________________

---

### Test 6.2: Sales Report Load Time

- [ ] **Navigate to**: `/dashboard/sales` or reports
- [ ] **Apply date filter** (e.g., last 30 days)
- [ ] **Check response time** in Network tab
- [ ] **Expected**: < 1 second for moderate data

**Result**: ✅ Pass / ❌ Fail
**Response Time**: _____ ms
**Notes**: _____________________

---

## 🧪 Test 7: Public Booking Page (Critical)

**Objective**: Verify public users can still create appointment requests

### Test 7.1: Submit Appointment Request Without Login

- [ ] **Open incognito/private browser window**
- [ ] **Navigate to**: Your tenant's public booking URL
  - Format: `/book/[tenant-slug]`

- [ ] **Fill out booking form**:
  - [ ] Name: "TEST_Public_User"
  - [ ] Email: `public-test@example.com`
  - [ ] Phone: Optional
  - [ ] Pet name: "TEST_Public_Pet"
  - [ ] Service: Select a service
  - [ ] Preferred date/time

- [ ] **Submit form**
  - [ ] **Expected**: Success message shown
  - [ ] **Expected**: No login required
  - [ ] **Expected**: No errors

- [ ] **Verify in admin dashboard** (as logged-in user):
  - [ ] Navigate to `/dashboard/appointment-requests`
  - [ ] **Expected**: New request appears
  - [ ] **Expected**: Customer info matches form

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 🧪 Test 8: Error Handling & Edge Cases

### Test 8.1: Try to Delete User with Active Appointments

- [ ] **Create appointment** assigned to a specific user
- [ ] **Try to delete that user**
- [ ] **Expected**: Either:
  - Deletion succeeds (appointment userId set to null), OR
  - Clear error message explaining why deletion blocked

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

### Test 8.2: Data Integrity Check via UI

- [ ] **Navigate through key sections**:
  - [ ] Customers list loads without errors
  - [ ] Pets list loads without errors
  - [ ] Appointments calendar loads
  - [ ] Sales list loads
  - [ ] Inventory list loads

- [ ] **Check browser console** (F12):
  - [ ] **Expected**: No 500 errors
  - [ ] **Expected**: No foreign key violation errors
  - [ ] **Expected**: No "record not found" errors

**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________________

---

## 📊 Test Results Summary

### Critical Tests (Must Pass)

| Test | Status | Notes |
|------|--------|-------|
| Customer deletion (CASCADE) | ☐ Pass / ☐ Fail | |
| Customer deletion (SET NULL - appointments) | ☐ Pass / ☐ Fail | |
| Customer deletion (SET NULL - sales) | ☐ Pass / ☐ Fail | |
| Product deletion (preserves sales) | ☐ Pass / ☐ Fail | |
| User deletion (cash drawers) | ☐ Pass / ☐ Fail | |
| Multi-tenant isolation | ☐ Pass / ☐ Fail | |
| Decimal precision (sales) | ☐ Pass / ☐ Fail | |
| Public booking (no login) | ☐ Pass / ☐ Fail | |

### Summary

- **Total Tests Executed**: _____ / 19
- **Tests Passed**: _____
- **Tests Failed**: _____
- **Success Rate**: _____%

### Blockers/Issues Found

List any critical issues that would block production deployment:

1. _____________________
2. _____________________
3. _____________________

### Non-Critical Issues

List any minor issues or improvements needed:

1. _____________________
2. _____________________

---

## ✅ Sign-Off

**Tester Name**: _____________________
**Date**: _____________________
**Environment**: ☐ Development ☐ Staging
**Recommendation**: ☐ Ready for Production ☐ Needs Fixes

**Additional Notes**:
_____________________
_____________________
_____________________

---

## 🔗 Related Documentation

- **Schema Test Results**: `scripts/test-schema-changes.ts` output
- **Production Readiness**: `docs/PRODUCTION_READINESS_CHECKLIST.md`
- **Schema Changes**: `docs/SCHEMA_CHANGES_APPLIED.md`
- **Critical Fixes**: `docs/CRITICAL_FIXES_COMPLETE.md`

---

**Next Steps After Passing All Tests**:

1. ✅ Update production readiness checklist
2. ✅ Schedule deployment window
3. ✅ Backup production database
4. ✅ Apply migrations to production
5. ✅ Monitor for 24-48 hours post-deployment
