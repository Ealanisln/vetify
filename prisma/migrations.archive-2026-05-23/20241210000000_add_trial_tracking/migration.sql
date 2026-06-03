-- Migration: Add enhanced trial tracking columns and audit table
-- This migration adds proper trial tracking and access control logging

-- Add missing trial tracking columns to Tenant table
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "trialExtendedAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "trialExtendedBy" TEXT,
ADD COLUMN IF NOT EXISTS "gracePeriodEnds" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "lastTrialCheck" TIMESTAMP;

-- Create trial access log table for security auditing
CREATE TABLE IF NOT EXISTS "TrialAccessLog" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "allowed" BOOLEAN NOT NULL,
  "denialReason" TEXT,
  "requestPath" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "TrialAccessLog_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TrialAccessLog_tenantId_fkey" FOREIGN KEY ("tenantId") 
    REFERENCES "Tenant"("id") ON DELETE CASCADE,
  CONSTRAINT "TrialAccessLog_userId_fkey" FOREIGN KEY ("userId") 
    REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS "TrialAccessLog_tenantId_idx" ON "TrialAccessLog"("tenantId");
CREATE INDEX IF NOT EXISTS "TrialAccessLog_userId_idx" ON "TrialAccessLog"("userId");
CREATE INDEX IF NOT EXISTS "TrialAccessLog_feature_idx" ON "TrialAccessLog"("feature");
CREATE INDEX IF NOT EXISTS "TrialAccessLog_allowed_idx" ON "TrialAccessLog"("allowed");
CREATE INDEX IF NOT EXISTS "TrialAccessLog_createdAt_idx" ON "TrialAccessLog"("createdAt");

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS "TrialAccessLog_tenant_feature_idx" ON "TrialAccessLog"("tenantId", "feature");
CREATE INDEX IF NOT EXISTS "TrialAccessLog_tenant_user_idx" ON "TrialAccessLog"("tenantId", "userId");

-- Create index for trial-related queries on Tenant table
CREATE INDEX IF NOT EXISTS "Tenant_trialEndsAt_idx" ON "Tenant"("trialEndsAt") 
  WHERE "isTrialPeriod" = true;

-- Create index for trial status checks
CREATE INDEX IF NOT EXISTS "Tenant_trial_status_idx" ON "Tenant"("isTrialPeriod", "subscriptionStatus") 
  WHERE "isTrialPeriod" = true;

-- Function to automatically expire old trials (optional, for background jobs)
CREATE OR REPLACE FUNCTION expire_old_trials()
RETURNS void AS $$
BEGIN
  UPDATE "Tenant"
  SET 
    "subscriptionStatus" = 'INACTIVE'::"SubscriptionStatus",
    "lastTrialCheck" = NOW()
  WHERE "isTrialPeriod" = true
    AND "trialEndsAt" < NOW()
    AND "subscriptionStatus" = 'TRIALING'::"SubscriptionStatus"
    AND ("gracePeriodEnds" IS NULL OR "gracePeriodEnds" < NOW());
END;
$$ LANGUAGE plpgsql;

-- Function to check if tenant has active trial access
CREATE OR REPLACE FUNCTION has_active_trial_access(tenant_id TEXT)
RETURNS boolean AS $$
DECLARE
  tenant_record RECORD;
BEGIN
  SELECT 
    "isTrialPeriod",
    "trialEndsAt",
    "subscriptionStatus",
    "gracePeriodEnds"
  INTO tenant_record
  FROM "Tenant"
  WHERE "id" = tenant_id;
  
  -- If not found or not in trial, return false
  IF NOT FOUND OR NOT tenant_record."isTrialPeriod" THEN
    RETURN false;
  END IF;
  
  -- Check if trial is still active
  IF tenant_record."trialEndsAt" > NOW() THEN
    RETURN true;
  END IF;
  
  -- Check grace period if exists
  IF tenant_record."gracePeriodEnds" IS NOT NULL AND tenant_record."gracePeriodEnds" > NOW() THEN
    RETURN true;
  END IF;
  
  -- Trial has expired
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON TABLE "TrialAccessLog" IS 'Audit log for trial access attempts and feature usage';
COMMENT ON FUNCTION expire_old_trials() IS 'Background function to automatically expire old trials';
COMMENT ON FUNCTION has_active_trial_access(TEXT) IS 'Check if tenant has active trial access including grace period';
