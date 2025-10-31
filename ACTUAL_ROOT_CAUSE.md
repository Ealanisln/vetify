# 🚨 ACTUAL ROOT CAUSE: Wrong Credential Type

## The Real Issue

You're using **database passwords** in Vercel, but Supabase serverless deployments require **service role JWT tokens**.

### What You Have (Wrong for Vercel):
```
Production: WP4hOgNSK4boeBLf  ← Database password (20 chars)
Dev: KqDyBSbGwrzrUb3J         ← Database password (20 chars)
```

### What You Need (For Vercel):
Service role JWT tokens that look like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxeGhtaH... (300+ chars)
```

---

## Why This Matters

### Database Passwords (What you're using):
- ✅ Work for: Direct connections, local development
- ❌ Don't work for: Vercel serverless, connection pooling
- Format: Short alphanumeric string (16-20 chars)
- Example: `WP4hOgNSK4boeBLf`

### Service Role Keys (What you need):
- ✅ Work for: Vercel serverless, Supabase API, connection pooling
- ✅ Required for: Production deployments on Vercel
- Format: Long JWT token starting with `eyJ` (300-500 chars)
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## How to Get Service Role Keys

### For Production (rqxhmhplxeiprzprobdb):

1. Go to: https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb/settings/api
2. Scroll down to "Project API keys" section
3. Find the **`service_role`** key (NOT anon key, NOT password)
4. Copy the ENTIRE JWT token (starts with `eyJ`, very long)

### For Development (neyznxeecossozkffets):

1. Go to: https://supabase.com/dashboard/project/neyznxeecossozkffets/settings/api
2. Scroll down to "Project API keys" section
3. Find the **`service_role`** key
4. Copy the ENTIRE JWT token

---

## Correct Connection String Format

### ❌ WRONG (What you have - using password):
```bash
# Production
postgresql://postgres:WP4hOgNSK4boeBLf@db.rqxhmhplxeiprzprobdb.supabase.co:5432/postgres

# This fails with "FATAL: Tenant or user not found" in Vercel serverless
```

### ✅ CORRECT (What you need - using service role key):
```bash
# Production
postgresql://postgres.rqxhmhplxeiprzprobdb:[SERVICE_ROLE_JWT_HERE]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Development
postgresql://postgres.neyznxeecossozkffets:[SERVICE_ROLE_JWT_HERE]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

**Key differences:**
1. Use `postgres.PROJECT_REF` instead of just `postgres`
2. Use service role JWT token instead of password
3. Use `aws-0-us-east-1.pooler.supabase.com` (pooler) instead of `db.PROJECT.supabase.co`
4. Use port `6543` (pooler) instead of `5432` (direct)
5. Add `pgbouncer=true&connection_limit=1` parameters

---

## Update Vercel Environment Variables

### Production Environment:

```bash
DATABASE_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:[PROD_SERVICE_ROLE_JWT]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.rqxhmhplxeiprzprobdb:[PROD_SERVICE_ROLE_JWT]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1
```

### Preview Environment (Development):

```bash
DATABASE_URL=postgresql://postgres.neyznxeecossozkffets:[DEV_SERVICE_ROLE_JWT]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

DIRECT_URL=postgresql://postgres.neyznxeecossozkffets:[DEV_SERVICE_ROLE_JWT]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1
```

Replace `[PROD_SERVICE_ROLE_JWT]` and `[DEV_SERVICE_ROLE_JWT]` with the actual JWT tokens from Supabase dashboard.

---

## Why You're Seeing "Tenant or user not found"

This error message is misleading. It's not about tenants in your app - it's Postgres saying:

> "I don't recognize this authentication method (password) in a serverless context. Expected JWT token."

In Vercel serverless:
1. Connection uses service role JWT for authentication
2. JWT is validated by Supabase
3. If JWT is invalid/missing (using password instead), Postgres rejects with "user not found"

---

## Steps to Fix

1. **Get service role keys** from both Supabase projects
2. **Update Vercel variables** with correct connection string format
3. **Use pooler endpoints** (aws-0-us-east-1.pooler.supabase.com)
4. **Include pgbouncer=true** for connection pooling
5. **Redeploy** Vercel

---

## Verification

After updating:

```bash
# Test local connection still works
pnpm db:verify

# Check Vercel logs after redeployment
# Should see successful connections, not "Tenant or user not found"
```

---

## Why Local Works

Your local environment probably uses:
- Direct database connection (not pooler)
- Database password (which works for direct connections)
- No serverless constraints

That's why local works but Vercel doesn't - different authentication requirements.

---

**Bottom Line**: You need to replace the short database passwords with long service role JWT tokens in your Vercel environment variables, and use the correct pooler connection format.
