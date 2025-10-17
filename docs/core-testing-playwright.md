# Claude Code Prompt: Vetify Core Flow Testing with Playwright MCP

Create comprehensive end-to-end tests for Vetify's core user flows using Playwright MCP. The web app is a multi-tenant veterinary practice management SaaS platform built with Next.js 15, React 19, TypeScript, and PostgreSQL.

## Project Context

**Tech Stack:**

- Next.js 15 (App Router) with React 19
- TypeScript with strict typing
- PostgreSQL with Prisma ORM
- Kinde Auth for authentication
- Stripe for subscriptions
- Supabase for storage

**Base URL:** `http://localhost:3000`

**Existing Playwright Config:** `/Users/ealanis/Development/current-projects/vetify/playwright.config.ts`

## Core Flows to Test

### 1. **Authentication & Onboarding Flow**

Test the complete user journey from sign-up to first login:

- [ ] Navigate to sign-up page (`/sign-up`)
- [ ] Complete Kinde Auth sign-up form
- [ ] Verify redirect to onboarding page (`/onboarding`)
- [ ] Fill out tenant creation form (clinic name, slug, timezone)
- [ ] Verify redirect to dashboard after onboarding
- [ ] Check that trial banner is visible
- [ ] Sign out and sign back in
- [ ] Verify session persistence

### 2. **Dashboard Navigation & Layout**

Test main dashboard structure and navigation:

- [ ] Navigate to dashboard (`/dashboard`)
- [ ] Verify ConditionalLayout renders correctly
- [ ] Check all main navigation links are present
- [ ] Test navigation to each section:
  - Customers (`/dashboard/customers`)
  - Pets (`/dashboard/pets`)
  - Appointments (`/dashboard/appointments`)
  - Inventory (`/dashboard/inventory`)
  - Sales (`/dashboard/sales`)
  - Staff (`/dashboard/staff`)
  - Settings (`/dashboard/settings`)
- [ ] Verify NoActivePlanBanner appears when appropriate
- [ ] Test mobile responsiveness of navigation

### 3. **Customer Management Flow**

Test CRUD operations for customers:

- [ ] Navigate to customers page (`/dashboard/customers`)
- [ ] Click "New Customer" button
- [ ] Fill customer form with:
  - Name
  - Email
  - Phone
  - Address
  - Preferred contact method
- [ ] Submit form and verify success toast
- [ ] Verify customer appears in list
- [ ] Click on customer to view details
- [ ] Edit customer information
- [ ] Verify changes are saved
- [ ] Search for customer by name
- [ ] Filter customers by various criteria

### 4. **Pet Management Flow**

Test complete pet lifecycle:

- [ ] Navigate to pets page (`/dashboard/pets`)
- [ ] Click "New Pet" button
- [ ] Select existing customer from dropdown
- [ ] Fill pet form:
  - Name
  - Species
  - Breed
  - Date of birth
  - Gender
  - Weight
  - Microchip number (optional)
  - Is neutered checkbox
- [ ] Submit and verify pet creation
- [ ] Navigate to pet details page
- [ ] Add medical history entry
- [ ] Add vaccination record
- [ ] Add deworming record
- [ ] Schedule treatment reminder
- [ ] Verify all records appear in pet profile

### 5. **Appointment Scheduling Flow**

Test appointment booking system:

- [ ] Navigate to appointments page (`/dashboard/appointments`)
- [ ] Click "New Appointment" button
- [ ] Select customer and their pet
- [ ] Choose date and time
- [ ] Select staff member (if available)
- [ ] Add appointment reason and notes
- [ ] Submit appointment
- [ ] Verify appointment appears in calendar
- [ ] Test appointment status changes:
  - Confirm appointment
  - Check-in appointment
  - Complete appointment
  - Cancel appointment
- [ ] Test appointment filters and search

### 6. **Inventory Management Flow**

Test inventory operations:

- [ ] Navigate to inventory page (`/dashboard/inventory`)
- [ ] Add new inventory item:
  - Name
  - Category (Medicine, Vaccine, Food, etc.)
  - Quantity
  - Min stock level
  - Cost and price
  - Expiration date
- [ ] Submit and verify item creation
- [ ] Test inventory movement:
  - Record purchase (IN)
  - Record sale (OUT)
  - Record adjustment
- [ ] Verify quantity updates correctly
- [ ] Test low stock warnings
- [ ] Test expiration date alerts

### 7. **Point of Sale (POS) Flow**

Test complete sales transaction:

- [ ] Navigate to sales page (`/dashboard/sales`)
- [ ] Create new sale
- [ ] Select customer and pet
- [ ] Add items from inventory
- [ ] Add services
- [ ] Apply discount (if applicable)
- [ ] Verify subtotal and total calculations
- [ ] Process payment:
  - Test cash payment
  - Test card payment
- [ ] Generate sale receipt
- [ ] Verify inventory is decremented
- [ ] Test sale refund process

### 8. **Trial & Subscription Management**

Test subscription-based access control:

- [ ] Navigate to settings subscription tab (`/dashboard/settings?tab=subscription`)
- [ ] Verify trial status is displayed
- [ ] Check trial end date
- [ ] Test FeatureGate component:
  - Try accessing premium features
  - Verify upgrade prompt appears
- [ ] Click "Upgrade Plan" button
- [ ] Verify redirect to pricing page
- [ ] Test plan selection (mock Stripe)
- [ ] Verify subscription status updates

### 9. **Staff Management Flow**

Test staff operations:

- [ ] Navigate to staff page (`/dashboard/staff`)
- [ ] Add new staff member:
  - Name
  - Position
  - Email
  - Phone
  - License number
- [ ] Verify staff appears in list
- [ ] Assign staff to appointment
- [ ] Test staff activation/deactivation
- [ ] Edit staff details

### 10. **Medical Records & History**

Test medical documentation:

- [ ] Navigate to pet medical history
- [ ] Add consultation record:
  - Visit date
  - Reason for visit
  - Diagnosis
  - Treatment plan
  - Notes
- [ ] Add prescription
- [ ] Link to medical order
- [ ] Generate medical report
- [ ] Test record search and filtering

### 11. **Reporting & Analytics**

Test reporting features:

- [ ] Navigate to reports page (`/dashboard/reports`)
- [ ] View sales reports
- [ ] Filter by date range
- [ ] Test appointment statistics
- [ ] View inventory reports
- [ ] Export report data

### 12. **Public Booking Page**

Test clinic's public appointment booking:

- [ ] Navigate to public clinic page (`/[clinicSlug]`)
- [ ] Verify clinic information displays
- [ ] Fill booking request form:
  - Customer name
  - Email
  - Phone
  - Pet name
  - Service type
  - Preferred date/time
  - Notes
- [ ] Submit booking request
- [ ] Verify confirmation message
- [ ] Check request appears in admin dashboard

## Testing Requirements

### Implementation Guidelines:

1. **Use TypeScript** with proper types for all test functions
2. **Page Object Model (POM)** for reusable components
3. **Proper waits** - use `waitForSelector`, `waitForLoadState`, not arbitrary timeouts
4. **Error handling** - use try-catch blocks with meaningful error messages
5. **Cleanup** - reset test data after each test suite
6. **Assertions** - use Playwright's expect assertions
7. **Screenshots** on failure for debugging
8. **Parallel execution** where safe (avoid for auth tests)

### Test Structure:

```typescript
// tests/e2e/[feature].spec.ts
import { test, expect } from '@playwright/test'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  })

  test('should perform action', async ({ page }) => {
    // Test implementation
  })

  test.afterEach(async ({ page }) => {
    // Cleanup
  })
})
```

### Security & Edge Cases:

- Test middleware rate limiting (but don't actually trigger blocks)
- Test CSRF protection
- Test trial expiration handling
- Test subscription status changes
- Test multi-tenancy isolation
- Test input validation
- Test error states and boundaries

### Critical Paths (Priority 1):

1. Auth flow
2. Customer & Pet creation
3. Appointment booking
4. POS transaction
5. Trial/subscription check

## Deliverables

Create the following test files in `/tests/e2e/`:

1. `auth-onboarding.spec.ts` - Authentication & onboarding
2. `customer-pet-management.spec.ts` - Customers and pets
3. `appointment-scheduling.spec.ts` - Appointment booking
4. `inventory-management.spec.ts` - Inventory operations
5. `pos-sales.spec.ts` - Sales transactions
6. `subscription-trial.spec.ts` - Trial and subscription flows
7. `public-booking.spec.ts` - Public appointment requests
8. `medical-records.spec.ts` - Medical history and records
9. `staff-management.spec.ts` - Staff CRUD operations
10. `reports-analytics.spec.ts` - Reporting features

Also create Page Object Models in `/tests/e2e/pages/` for reusable components.

## Success Criteria

✅ All core user flows have automated tests ✅ Tests use TypeScript with proper typing ✅ Tests follow POM pattern for maintainability ✅ 80%+ code coverage on critical paths ✅ All tests pass in CI/CD pipeline ✅ Tests run in parallel where safe ✅ Clear, actionable error messages ✅ Screenshots on failure ✅ Test execution time < 10 minutes

------

**Start with Priority 1 tests first, then expand to cover all flows. Use Playwright MCP tools to interact with the web app and verify functionality.**