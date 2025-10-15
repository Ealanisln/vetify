# Vetify Database Migration Guide
## From Development PostgreSQL to Supabase Production

**Date Created:** 2025-01-09
**Migration Type:** Fresh Start (Option A)
**Supabase Project:** vetify-app (rqxhmhplxeiprzprobdb)

---

## ⚠️ IMPORTANT WARNINGS

1. **This is a DESTRUCTIVE migration** - The existing Supabase schema will be replaced
2. **Backup your development database** before starting
3. **Test the migration process** on a staging environment first if possible
4. **Do NOT run in production hours** - Schedule during low-traffic period
5. **RLS policies require proper configuration** - Read section on authentication setup

---

## Prerequisites

### Required Access
- [x] Supabase project access (vetify-app)
- [x] Local development database access
- [x] Claude Code with Supabase MCP configured
- [x] Environment variables configured

### Required Tools
- [x] PostgreSQL client (psql) or pg_dump
- [x] Node.js >= 20.0.0
- [x] pnpm 9.15.9
- [x] Supabase CLI (optional, for additional tooling)

---

## Migration Overview

This migration consists of **4 main phases**:

### Phase 1: Schema Migration (Migrations 01-07)
Apply 7 migration files in sequence to create the complete database schema.

### Phase 2: Data Migration
Export data from development and import to Supabase in dependency order.

### Phase 3: Post-Migration Configuration
- Generate TypeScript types
- Update Next.js configuration
- Configure RLS authentication
- Run security advisors

### Phase 4: Verification & Testing
- Test all CRUD operations
- Verify RLS policies
- Check foreign key constraints
- Performance testing

---

## Phase 1: Schema Migration

### Step 1.1: Prepare Migration Files

All migration files are located in `/docs/migration/migrations/`:

1. `01_extensions_and_enums.sql` - PostgreSQL extensions and enum types
2. `02_core_tables.sql` - Tenant, Plan, User, Role, UserRole
3. `03_customer_pet_staff_tables.sql` - Customer, Pet, Staff, Service, InventoryItem
4. `04_operational_tables.sql` - Appointments, Reminders, Medical records
5. `05_sales_and_financial_tables.sql` - Sales, Payments, Cash drawers
6. `06_tenant_config_and_admin_tables.sql` - Settings, Subscriptions, Admin
7. `07_row_level_security.sql` - RLS policies for all tables

### Step 1.2: Apply Migrations to Supabase

**Using Claude Code (Recommended):**

Use the Supabase MCP `apply_migration` tool for each migration file:

```bash
# Migration 01: Extensions and Enums
# (Apply via Claude Code using mcp__supabase-alanis__apply_migration)
```

**Alternatively, using Supabase Dashboard:**

1. Go to https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Execute one by one in order (01 through 07)

**Alternatively, using PostgreSQL Client:**

```bash
# Get database connection string from Supabase
export DATABASE_URL="postgresql://postgres:[password]@db.rqxhmhplxeiprzprobdb.supabase.co:5432/postgres"

# Apply migrations in order
psql $DATABASE_URL -f docs/migration/migrations/01_extensions_and_enums.sql
psql $DATABASE_URL -f docs/migration/migrations/02_core_tables.sql
psql $DATABASE_URL -f docs/migration/migrations/03_customer_pet_staff_tables.sql
psql $DATABASE_URL -f docs/migration/migrations/04_operational_tables.sql
psql $DATABASE_URL -f docs/migration/migrations/05_sales_and_financial_tables.sql
psql $DATABASE_URL -f docs/migration/migrations/06_tenant_config_and_admin_tables.sql
psql $DATABASE_URL -f docs/migration/migrations/07_row_level_security.sql
```

### Step 1.3: Verify Schema Creation

After applying all migrations, verify the schema:

```sql
-- Check that all tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Expected: 31 tables

-- Check that RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Expected: All tables should have RLS enabled

-- Check indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## Phase 2: Data Migration

### ⚠️ CRITICAL: Data Migration Considerations

Due to the schema changes (especially `Pet.userId` → `Pet.customerId`), data migration requires special handling:

#### Schema Breaking Changes:
1. **Pet table**: `userId` changed to `customerId` (now references Customer instead of User)
2. **Customer table**: New table that didn't exist in old schema
3. **Sale table**: `receiptNumber` → `saleNumber`
4. **Reminder table**: Column renames

### Step 2.1: Export Development Data

**Option A: Using pg_dump (Full Database)**

```bash
# Export full database structure + data
pg_dump $DEV_DATABASE_URL > dev_backup_$(date +%Y%m%d_%H%M%S).sql

# Export data only (without schema)
pg_dump $DEV_DATABASE_URL --data-only --inserts > dev_data_$(date +%Y%m%d_%H%M%S).sql
```

**Option B: Using Prisma (Recommended for this migration)**

Since we have schema changes, it's better to export data programmatically and transform it:

Create a data export script at `scripts/export-dev-data.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

async function exportData() {
  console.log('Exporting development data...');

  const data = {
    tenants: await prisma.tenant.findMany(),
    plans: await prisma.plan.findMany(),
    users: await prisma.user.findMany(),
    roles: await prisma.role.findMany(),
    userRoles: await prisma.userRole.findMany(),

    // Note: In old schema, users were pet owners
    // We need to create Customer records from these users
    customers: await prisma.user.findMany({
      where: {
        pets: {
          some: {}
        }
      }
    }),

    staff: await prisma.staff.findMany(),
    pets: await prisma.pet.findMany(),
    services: await prisma.service.findMany(),
    inventoryItems: await prisma.inventoryItem.findMany(),
    appointments: await prisma.appointment.findMany(),
    reminders: await prisma.reminder.findMany(),
    medicalHistories: await prisma.medicalHistory.findMany(),
    treatmentRecords: await prisma.treatmentRecord.findMany(),
    treatmentSchedules: await prisma.treatmentSchedule.findMany(),
    inventoryMovements: await prisma.inventoryMovement.findMany(),
    sales: await prisma.sale.findMany(),
    saleItems: await prisma.saleItem.findMany(),
    cashDrawers: await prisma.cashDrawer.findMany(),
    cashTransactions: await prisma.cashTransaction.findMany(),
    salePayments: await prisma.salePayment.findMany(),
    medicalOrders: await prisma.medicalOrder.findMany(),
    prescriptions: await prisma.prescription.findMany(),
    tenantSettings: await prisma.tenantSettings.findMany(),
    businessHours: await prisma.businessHours.findMany(),
    tenantSubscriptions: await prisma.tenantSubscription.findMany(),
    tenantInvitations: await prisma.tenantInvitation.findMany(),
    tenantApiKeys: await prisma.tenantApiKey.findMany(),
    tenantUsageStats: await prisma.tenantUsageStats.findMany(),
  };

  await fs.writeFile(
    'dev_export_data.json',
    JSON.stringify(data, null, 2)
  );

  console.log('Export complete! Saved to dev_export_data.json');
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the export:

```bash
npx tsx scripts/export-dev-data.ts
```

### Step 2.2: Transform and Import Data

⚠️ **IMPORTANT**: Due to schema changes, manual data transformation is required.

See `scripts/import-to-supabase.ts` (to be created) for the import logic that handles:
- Creating Customer records from User records
- Mapping Pet.userId → Pet.customerId
- Renaming Sale.receiptNumber → Sale.saleNumber
- Other schema transformations

**Data Import Order (respects foreign keys):**

1. Tenant
2. Plan
3. User
4. Role
5. UserRole
6. Customer (transformed from User)
7. Staff
8. Pet (with customerId instead of userId)
9. Service
10. InventoryItem
11. Appointment
12. Reminder
13. MedicalHistory
14. TreatmentRecord
15. TreatmentSchedule
16. InventoryMovement
17. Sale
18. SaleItem
19. CashDrawer
20. CashTransaction
21. SalePayment
22. MedicalOrder
23. Prescription
24. TenantSettings
25. BusinessHours
26. TenantSubscription
27. TenantInvitation
28. TenantApiKey
29. TenantUsageStats

---

## Phase 3: Post-Migration Configuration

### Step 3.1: Generate TypeScript Types

```bash
# Using Supabase MCP
# (Will use mcp__supabase-alanis__generate_typescript_types)

# Or manually using Supabase CLI
supabase gen types typescript --project-id rqxhmhplxeiprzprobdb > src/types/supabase.ts
```

### Step 3.2: Update Next.js Configuration

Update `.env.production`:

```bash
# Supabase Configuration
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

NEXT_PUBLIC_SUPABASE_URL="https://rqxhmhplxeiprzprobdb.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<get-from-supabase-dashboard>"
SUPABASE_SERVICE_ROLE_KEY="<get-from-supabase-dashboard>"
```

### Step 3.3: Configure RLS Authentication

⚠️ **CRITICAL**: The RLS policies use `auth.user_tenant_id()` which must be set by your application.

**Update your middleware** (`src/middleware.ts`) to set the tenant ID:

```typescript
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

export async function middleware(request: NextRequest) {
  // ... existing auth logic ...

  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (user) {
    // Get user's tenant ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tenantId: true }
    });

    if (dbUser?.tenantId) {
      // Set tenant ID for RLS policies
      await prisma.$executeRaw`
        SET LOCAL app.current_tenant_id = ${dbUser.tenantId}
      `;
    }
  }

  // ... rest of middleware ...
}
```

### Step 3.4: Run Security Advisors

```bash
# Using Supabase MCP
# (Will use mcp__supabase-alanis__get_advisors for both security and performance)
```

Expected advisors to check:
- RLS policies are enabled
- No tables missing RLS
- Foreign key constraints are valid
- Indexes are properly created

---

## Phase 4: Verification & Testing

### Step 4.1: Database Verification

```sql
-- 1. Count records in each table
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 2. Verify foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- 3. Check for orphaned records
-- (Add queries specific to your data)
```

### Step 4.2: Application Testing Checklist

- [ ] User can log in successfully
- [ ] Tenant data is properly isolated (test with multiple tenants)
- [ ] Create new pet
- [ ] Create new appointment
- [ ] Create new customer
- [ ] Process a sale
- [ ] View medical history
- [ ] Schedule treatment
- [ ] Manage inventory
- [ ] View reports
- [ ] Public booking page works
- [ ] Stripe integration works
- [ ] Trial period logic works

### Step 4.3: Performance Testing

```sql
-- Check query performance for common operations
EXPLAIN ANALYZE SELECT * FROM "Pet" WHERE "tenantId" = '<test-tenant-id>';
EXPLAIN ANALYZE SELECT * FROM "Appointment" WHERE "tenantId" = '<test-tenant-id>' AND "dateTime" > NOW();
EXPLAIN ANALYZE SELECT * FROM "Sale" WHERE "tenantId" = '<test-tenant-id>' ORDER BY "createdAt" DESC LIMIT 50;
```

Ensure indexes are being used (look for "Index Scan" in EXPLAIN output).

---

## Rollback Strategy

### If Migration Fails During Phase 1 (Schema):

1. Drop all tables and start over:
```sql
-- ⚠️ DESTRUCTIVE - Only use if migration failed
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

2. Re-run migrations from the beginning

### If Migration Fails During Phase 2 (Data):

1. Truncate tables (preserves schema):
```sql
-- Delete all data but keep schema
TRUNCATE TABLE "TrialAccessLog", "SetupToken", "AdminAuditLog",
                "AutomationLog", "TenantUsageStats", "TenantApiKey",
                "TenantInvitation", "TenantSubscription", "BusinessHours",
                "TenantSettings", "Prescription", "MedicalOrder",
                "SalePayment", "CashTransaction", "CashDrawer", "SaleItem",
                "Sale", "InventoryMovement", "TreatmentSchedule",
                "TreatmentRecord", "MedicalHistory", "Reminder",
                "AppointmentRequest", "Appointment", "InventoryItem",
                "Service", "Pet", "Staff", "Customer", "UserRole",
                "Role", "User", "Plan", "Tenant"
                CASCADE;
```

2. Re-import data from your backup

### Full Rollback to Old Database:

1. Keep your old Supabase project as-is (don't delete it)
2. Simply revert your `.env` files to use the old database
3. Your application will continue working with the old schema

---

## Post-Migration Tasks

### Required:
- [ ] Update documentation with new database schema
- [ ] Update any external integrations pointing to database
- [ ] Configure database backups in Supabase
- [ ] Set up monitoring and alerts
- [ ] Update CI/CD pipelines if needed

### Recommended:
- [ ] Set up read replicas if needed
- [ ] Configure connection pooling (already included in Supabase)
- [ ] Review and optimize slow queries
- [ ] Set up database maintenance tasks

---

## Troubleshooting

### Issue: RLS blocks all queries

**Cause**: `auth.user_tenant_id()` is not returning the correct tenant ID

**Solution**:
1. Check that middleware is setting `app.current_tenant_id`
2. Verify the session variable is persisting through the request
3. Temporarily disable RLS for debugging:
   ```sql
   ALTER TABLE "Pet" DISABLE ROW LEVEL SECURITY;
   ```

### Issue: Foreign key constraint violation

**Cause**: Data imported in wrong order or missing parent records

**Solution**:
1. Check import order matches dependency graph
2. Verify all parent records exist before importing child records
3. Use the provided import script which handles order correctly

### Issue: Enum type mismatch

**Cause**: Old data uses enum values that don't exist in new schema

**Solution**:
1. Review enum definitions in migration 01
2. Update data to use correct enum values
3. Add migration to alter enum types if needed

---

## Support and Resources

- **Supabase Dashboard**: https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb
- **Supabase Docs**: https://supabase.com/docs
- **Project Schema**: `/docs/migration/schema-analysis.md`
- **Migration Files**: `/docs/migration/migrations/`

---

## Migration Checklist

Use this checklist to track your progress:

### Pre-Migration
- [ ] Read this guide completely
- [ ] Backup development database
- [ ] Verify Supabase project access
- [ ] Review all migration files
- [ ] Prepare rollback plan

### Phase 1: Schema
- [ ] Applied migration 01 (extensions and enums)
- [ ] Applied migration 02 (core tables)
- [ ] Applied migration 03 (customer, pet, staff)
- [ ] Applied migration 04 (operational tables)
- [ ] Applied migration 05 (sales and financial)
- [ ] Applied migration 06 (tenant config and admin)
- [ ] Applied migration 07 (RLS policies)
- [ ] Verified schema creation

### Phase 2: Data
- [ ] Exported development data
- [ ] Transformed data for schema changes
- [ ] Imported data in correct order
- [ ] Verified data integrity

### Phase 3: Configuration
- [ ] Generated TypeScript types
- [ ] Updated .env files
- [ ] Configured RLS authentication
- [ ] Ran security advisors

### Phase 4: Verification
- [ ] Database verification queries passed
- [ ] Application testing completed
- [ ] Performance testing completed
- [ ] No errors in logs

### Post-Migration
- [ ] Updated documentation
- [ ] Configured backups
- [ ] Set up monitoring
- [ ] Notified team

---

**Migration Complete! 🎉**

If you've completed all checklist items, your migration is successful. Monitor the application closely for the first 24-48 hours and be prepared to rollback if any issues arise.
