# 🚨 URGENT FIX: Vercel Database Connection Issue

**Date**: October 31, 2025
**Issue**: Sign-in failing with "FATAL: Tenant or user not found" error
**Root Cause**: Placeholder credentials in Vercel environment variables after security fix

---

## 🔍 Problem Summary

After PR #22 merge, production and development deployments are failing because Vercel is using placeholder database credentials (`YOUR_SERVICE_ROLE_KEY_HERE`) instead of the actual Supabase service role key.

**Symptoms:**
- ✅ Local development works perfectly
- ❌ Production (vetify.pro) times out with 504 error
- ❌ Development (development.vetify.pro) fails with "Tenant or user not found"

---

## 🔧 Step-by-Step Fix

### Step 1: Get Your Supabase Service Role Key

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/rqxhmhplxeiprzprobdb/settings/api
2. Scroll down to "Project API keys"
3. Copy the **`service_role`** key (it's a long JWT token starting with `eyJ...`)
4. **IMPORTANT**: This is NOT your database password - it's the service role API key

### Step 2: Update Vercel Environment Variables

#### For Production (vetify.pro):

1. Go to: https://vercel.com/dashboard
2. Select your `vetify` project
3. Go to: Settings → Environment Variables
4. Find `DATABASE_URL` and click Edit
5. Replace the value with:
   ```
   postgresql://postgres.rqxhmhplxeiprzprobdb:[YOUR_ACTUAL_KEY]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
   ```
   - Replace `[YOUR_ACTUAL_KEY]` with the service role key from Step 1
   - Make sure it's selected for **Production** environment
6. Find `DIRECT_URL` and click Edit
7. Replace the value with:
   ```
   postgresql://postgres.rqxhmhplxeiprzprobdb:[YOUR_ACTUAL_KEY]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0
   ```
   - Use the same service role key
   - Make sure it's selected for **Production** environment

#### For Development (development.vetify.pro):

1. In Vercel → Settings → Environment Variables
2. Find `DATABASE_URL` and click Edit
3. Replace the value with:
   ```
   postgresql://postgres.rqxhmhplxeiprzprobdb:[YOUR_ACTUAL_KEY]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0
   ```
   - Make sure it's selected for **Preview** environment
4. Find `DIRECT_URL` and click Edit
5. Replace the value with:
   ```
   postgresql://postgres.rqxhmhplxeiprzprobdb:[YOUR_ACTUAL_KEY]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?connection_limit=1&pool_timeout=0
   ```
   - Make sure it's selected for **Preview** environment

### Step 3: Trigger Redeployment

**Option A - Via Vercel Dashboard:**
1. Go to: Deployments tab
2. Find the latest deployment
3. Click the three dots menu → Redeploy
4. Wait for deployment to complete

**Option B - Via Git Push:**
1. Make a small change (e.g., update README)
2. Commit and push to trigger automatic deployment

### Step 4: Verify the Fix

Once redeployment completes:

1. **Test Production**: Go to https://vetify.pro and try to sign in
2. **Test Development**: Go to https://development.vetify.pro and try to sign in
3. **Check Logs**: Vercel Dashboard → Logs - should see no more "Tenant or user not found" errors
4. **Run Verification Script**:
   ```bash
   pnpm tsx scripts/verify-vercel-connection.ts
   ```

---

## 🧪 Testing Checklist

After updating environment variables:

- [ ] Production sign-in works at https://vetify.pro
- [ ] Development sign-in works at https://development.vetify.pro
- [ ] No "Tenant or user not found" errors in Vercel logs
- [ ] No 504 timeout errors
- [ ] Dashboard loads successfully after authentication
- [ ] Database queries execute without connection errors

---

## 🔐 Security Notes

1. **Never commit** the actual service role key to Git
2. **Keep placeholders** in `deployment/vercel.supabase.json` file
3. **Only update** environment variables in Vercel Dashboard
4. The service role key is sensitive - treat it like a password

---

## 📚 Background: Why This Happened

1. **Aug 30, 2025**: Security fix (commit b125d22) replaced all real credentials with placeholders
2. **Purpose**: Prevent accidental exposure of sensitive keys in Git repository
3. **Side Effect**: Vercel environment variables were never updated with actual keys
4. **Trigger**: PR #22 merge (Oct 31) triggered new deployment with placeholder credentials
5. **Result**: Production and development fail because they can't authenticate with Supabase

---

## 🆘 If You Still Have Issues

If the fix doesn't work:

1. **Double-check the service role key**: Make sure you copied the entire key
2. **Verify environment selection**: Ensure Production/Preview are correctly selected
3. **Check deployment logs**: Look for specific error messages
4. **Test connection locally**: Run `pnpm tsx scripts/verify-vercel-connection.ts`
5. **Contact support**: Share the Vercel deployment logs

---

## ✅ Success Indicators

You'll know the fix worked when:

1. Sign-in completes in < 2 seconds (not timing out)
2. Dashboard loads immediately after authentication
3. No database connection errors in Vercel logs
4. Both production and development environments work

---

**Need Help?** Ping Claude Code or check Vercel deployment logs for detailed error messages.
