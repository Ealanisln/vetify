# Row Level Security (RLS) Configuration Guide

## Overview

This guide explains how to configure and test Row Level Security (RLS) for your Supabase production database. RLS ensures multi-tenant isolation by automatically filtering queries based on the authenticated user's tenant.

## Prerequisites

✅ Completed: Phase 1 - Schema Migration (all 7 migrations applied)
✅ Completed: RLS policies created and enabled on all tenant-scoped tables
✅ Completed: `user_tenant_id()` function created in Supabase
✅ Completed: Middleware updated to set tenant context
✅ Completed: Prisma client updated with RLS helper functions

## 🔐 How RLS Works in Vetify

### 1. RLS Helper Function

The `public.user_tenant_id()` function reads the current tenant ID from the session:

```sql
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_tenant_id', true)::text;
$$;
```

### 2. RLS Policies

Each tenant-scoped table has RLS policies that use `user_tenant_id()`:

```sql
-- Example policy for Pet table
CREATE POLICY "Users can only access their tenant's pets"
ON public."Pet"
FOR ALL
USING ("tenantId" = public.user_tenant_id());
```

### 3. Middleware Integration

The middleware (`src/middleware.ts`) sets the tenant context for each authenticated request:

```typescript
// Get user's tenant
const tenant = await getTenantByUserId(userId);
if (tenant?.id) {
  // Configure RLS for this request
  await setRLSTenantId(tenant.id);
}
```

### 4. Prisma Helper Functions

Two helper functions in `src/lib/prisma.ts`:

- **`setRLSTenantId(tenantId)`**: Sets the tenant context for RLS
- **`clearRLSTenantId()`**: Clears the tenant context

## 📝 Setup Instructions

### Step 1: Add Supabase Service Role Key

1. Go to your Supabase project dashboard:
   https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb/settings/api

2. Copy the **service_role** key (under "Project API keys")

3. Open `.env.production` and replace `YOUR_SERVICE_ROLE_KEY_HERE` with the actual key:

```env
# .env.production
DATABASE_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
DIRECT_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_SERVICE_ROLE_KEY@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0

NEXT_PUBLIC_SUPABASE_URL=https://rqxhmhplxeiprzprobdb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Add this line (copy from Supabase dashboard):
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

4. **Important**: Keep this key secret! Never commit it to version control.

### Step 2: Update Environment

For **local development** (pointing to Supabase):

```bash
# Update .env to use Supabase
DATABASE_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_KEY@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:YOUR_KEY@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

For **Vercel deployment**:

```bash
# The .env.production file will be automatically used by Vercel
# Make sure to add SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables
```

### Step 3: Generate Prisma Client

After updating the database connection, regenerate the Prisma client:

```bash
pnpm prisma generate
```

## 🧪 Testing RLS Policies

### Run the RLS Test Suite

We've created a comprehensive test suite with 10 tests to verify RLS is working correctly:

```bash
pnpm tsx scripts/test-rls-policies.ts
```

### What the Tests Check

1. ✅ **RLS Enabled**: Verifies RLS is enabled on tenant-scoped tables
2. ✅ **user_tenant_id() Function**: Tests the RLS helper function works
3. ✅ **RLS Policies Exist**: Confirms policies are created for key tables
4. ✅ **setRLSTenantId()**: Tests the Prisma helper function
5. ✅ **clearRLSTenantId()**: Tests clearing tenant context
6. ✅ **Multi-Tenant Isolation**: Verifies tenants cannot see each other's data
7. ✅ **Customer Isolation**: Tests customer data separation
8. ✅ **Appointment Isolation**: Tests appointment data separation
9. ✅ **Medical Record Isolation**: Tests medical record separation
10. ✅ **Public Booking**: Verifies AppointmentRequest allows public INSERT

### Expected Output

```
🔒 RLS Policy Testing Script
════════════════════════════════════════════════════════════
Database: aws-0-us-east-1.pooler.supabase.com:6543
════════════════════════════════════════════════════════════

🧪 Testing: RLS is enabled on tenant-scoped tables
   ✅ All 5 checked tables have RLS enabled

🧪 Testing: user_tenant_id() function exists and works
   ✅ user_tenant_id() function works correctly

...

📊 Test Results Summary
════════════════════════════════════════════════════════════
Total Tests: 10
✅ Passed: 10
❌ Failed: 0
════════════════════════════════════════════════════════════
```

## 🔧 Manual Testing

You can also manually test RLS using these SQL queries in the Supabase SQL Editor:

### Test 1: Set and read tenant context

```sql
-- Set tenant ID
SELECT set_config('app.current_tenant_id', 'some-tenant-id-here', true);

-- Verify it was set
SELECT public.user_tenant_id();

-- Query data (should only show this tenant's pets)
SELECT * FROM "Pet";

-- Clear the context
SELECT set_config('app.current_tenant_id', '', true);
```

### Test 2: Verify isolation between tenants

```sql
-- Get two tenant IDs
SELECT id, name FROM "Tenant" LIMIT 2;

-- Set to tenant 1
SELECT set_config('app.current_tenant_id', 'tenant-1-id-here', true);
SELECT COUNT(*) as tenant1_pets FROM "Pet";

-- Set to tenant 2
SELECT set_config('app.current_tenant_id', 'tenant-2-id-here', true);
SELECT COUNT(*) as tenant2_pets FROM "Pet";
```

### Test 3: Try to access another tenant's data

```sql
-- Set tenant context to tenant 1
SELECT set_config('app.current_tenant_id', 'tenant-1-id-here', true);

-- Try to query pets from tenant 2 (should return 0 rows)
SELECT * FROM "Pet" WHERE "tenantId" = 'tenant-2-id-here';
```

## 🚨 Troubleshooting

### Issue: RLS tests fail with "Need at least 2 tenants"

**Solution**: The database needs data to test isolation. Either:
- Import your development data (see MIGRATION_GUIDE.md)
- Create test tenants manually in Supabase

### Issue: "user_tenant_id() function does not exist"

**Solution**: The function wasn't created during migration. Run:

```sql
CREATE OR REPLACE FUNCTION public.user_tenant_id()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_tenant_id', true)::text;
$$;
```

### Issue: Queries return empty results when RLS is set

**Possible causes**:
1. The tenant ID is not set correctly in middleware
2. The tenant ID doesn't match any data in the database
3. RLS policies are too restrictive

**Debug steps**:
```typescript
// Add logging to middleware
console.log('Setting RLS tenant ID:', tenantId);
await setRLSTenantId(tenantId);

// Verify it was set
const result = await prisma.$queryRaw`
  SELECT current_setting('app.current_tenant_id', true) as tenant_id
`;
console.log('Current tenant context:', result);
```

### Issue: Public booking page fails to create AppointmentRequest

**Solution**: Verify the public INSERT policy exists:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'AppointmentRequest' AND cmd = 'INSERT';
```

If missing, create it:

```sql
CREATE POLICY "Allow public to create appointment requests"
ON public."AppointmentRequest"
FOR INSERT
WITH CHECK (true);
```

## 📊 Monitoring RLS

### Check which policies are active

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check RLS status for all tables

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### See RLS in action (audit log)

```sql
-- Enable logging for RLS (development only)
SET log_statement = 'all';
SET log_duration = on;

-- Run a query and check the logs
SELECT * FROM "Pet";
```

## 🎯 Next Steps

After configuring RLS:

1. ✅ **Test RLS**: Run `pnpm tsx scripts/test-rls-policies.ts`
2. ⏭️ **Data Migration**: Import your development data (if ready)
3. ⏭️ **Application Testing**: Test CRUD operations through your Next.js app
4. ⏭️ **Deploy to Vercel**: Update Vercel environment variables

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Migration Guide](/docs/migration/MIGRATION_GUIDE.md)
- [Verification Script](/scripts/verify-migration.ts)

## ⚠️ Security Best Practices

1. **Always use service_role key on the server only** - Never expose it to the client
2. **Set tenant context for every authenticated request** - The middleware handles this
3. **Test RLS thoroughly** - Use the test suite before going to production
4. **Monitor for policy violations** - Enable Supabase's built-in monitoring
5. **Regular audits** - Review RLS policies periodically

---

**Status**: ✅ RLS Configuration Complete
**Last Updated**: 2025-10-09
**Next Phase**: Data Migration (when development data is ready)
