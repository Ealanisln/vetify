-- Migration 06: Tenant Configuration and Admin Tables
-- Creates tenant settings, subscription, invitation, and admin tables

-- =============================================
-- TENANT SETTINGS TABLE
-- =============================================

CREATE TABLE "TenantSettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL UNIQUE,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  "enableEmailReminders" BOOLEAN NOT NULL DEFAULT true,
  "enableSmsReminders" BOOLEAN NOT NULL DEFAULT false,
  "taxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "currencyCode" TEXT NOT NULL DEFAULT 'USD',
  "currencySymbol" TEXT NOT NULL DEFAULT '$',
  "appointmentDuration" INTEGER NOT NULL DEFAULT 30,

  -- Business Hours Configuration
  "defaultStartTime" TEXT NOT NULL DEFAULT '08:00',
  "defaultEndTime" TEXT NOT NULL DEFAULT '18:00',
  "defaultLunchStart" TEXT DEFAULT '13:00',
  "defaultLunchEnd" TEXT DEFAULT '14:00',
  "defaultSlotDuration" INTEGER NOT NULL DEFAULT 15,

  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantSettings_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TenantSettings" IS 'Tenant-specific configuration settings';

-- =============================================
-- BUSINESS HOURS TABLE
-- =============================================

CREATE TABLE "BusinessHours" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "tenantSettingsId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL, -- 0 = Sunday, 1 = Monday, etc.
  "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
  "startTime" TEXT NOT NULL DEFAULT '08:00',
  "endTime" TEXT NOT NULL DEFAULT '18:00',
  "lunchStart" TEXT DEFAULT '13:00',
  "lunchEnd" TEXT DEFAULT '14:00',
  "slotDuration" INTEGER NOT NULL DEFAULT 15,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BusinessHours_tenantId_dayOfWeek_unique" UNIQUE ("tenantId", "dayOfWeek"),

  CONSTRAINT "BusinessHours_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "BusinessHours_tenantSettingsId_fkey"
    FOREIGN KEY ("tenantSettingsId") REFERENCES "TenantSettings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "BusinessHours" IS 'Operating hours per day of week';

-- =============================================
-- TENANT SUBSCRIPTION TABLE
-- =============================================

CREATE TABLE "TenantSubscription" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL UNIQUE,
  "planId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantSubscription_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "TenantSubscription_planId_fkey"
    FOREIGN KEY ("planId") REFERENCES "Plan"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

COMMENT ON TABLE "TenantSubscription" IS 'Tenant subscription details';

-- =============================================
-- TENANT INVITATION TABLE
-- =============================================

CREATE TABLE "TenantInvitation" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantInvitation_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TenantInvitation" IS 'Pending invitations to join tenant';

-- =============================================
-- TENANT API KEY TABLE
-- =============================================

CREATE TABLE "TenantApiKey" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "keyPrefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "lastUsed" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantApiKey_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TenantApiKey" IS 'API keys for tenant integrations';

-- =============================================
-- TENANT USAGE STATS TABLE
-- =============================================

CREATE TABLE "TenantUsageStats" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL UNIQUE,
  "totalUsers" INTEGER NOT NULL DEFAULT 0,
  "totalPets" INTEGER NOT NULL DEFAULT 0,
  "totalAppointments" INTEGER NOT NULL DEFAULT 0,
  "totalSales" INTEGER NOT NULL DEFAULT 0,
  "storageUsedBytes" BIGINT NOT NULL DEFAULT 0,
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TenantUsageStats_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TenantUsageStats" IS 'Usage statistics for plan limit enforcement';

-- =============================================
-- AUTOMATION LOG TABLE
-- =============================================

CREATE TABLE "AutomationLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "workflowType" TEXT NOT NULL,
  "triggeredBy" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" TEXT NOT NULL,
  "executionId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AutomationLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "AutomationLog" IS 'N8N workflow execution logs';
COMMENT ON COLUMN "AutomationLog"."workflowType" IS 'E.g., PET_WELCOME, VACCINATION_REMINDER';
COMMENT ON COLUMN "AutomationLog"."status" IS 'SUCCESS, FAILED, PENDING';

-- =============================================
-- ADMIN AUDIT LOG TABLE
-- =============================================

CREATE TABLE "AdminAuditLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "action" "AdminAction" NOT NULL,
  "performedBy" TEXT,
  "targetUserId" TEXT NOT NULL,
  "targetEmail" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AdminAuditLog_performedBy_fkey"
    FOREIGN KEY ("performedBy") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "AdminAuditLog" IS 'Audit trail for super admin actions';

-- =============================================
-- SETUP TOKEN TABLE
-- =============================================

CREATE TABLE "SetupToken" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "token" TEXT NOT NULL UNIQUE,
  "email" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "used" BOOLEAN NOT NULL DEFAULT false,
  "usedAt" TIMESTAMP(3),
  "usedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SetupToken_usedBy_fkey"
    FOREIGN KEY ("usedBy") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

COMMENT ON TABLE "SetupToken" IS 'One-time tokens for tenant setup';

-- =============================================
-- TRIAL ACCESS LOG TABLE
-- =============================================

CREATE TABLE "TrialAccessLog" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "feature" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "allowed" BOOLEAN NOT NULL,
  "denialReason" TEXT,
  "requestPath" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TrialAccessLog_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,

  CONSTRAINT "TrialAccessLog_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

COMMENT ON TABLE "TrialAccessLog" IS 'Audit log for trial period access attempts';

-- =============================================
-- INDEXES
-- =============================================

-- BusinessHours indexes
CREATE INDEX "BusinessHours_tenantId_idx" ON "BusinessHours"("tenantId");
CREATE INDEX "BusinessHours_dayOfWeek_idx" ON "BusinessHours"("dayOfWeek");

-- TenantInvitation indexes
CREATE INDEX "TenantInvitation_tenantId_idx" ON "TenantInvitation"("tenantId");
CREATE INDEX "TenantInvitation_token_idx" ON "TenantInvitation"("token");
CREATE INDEX "TenantInvitation_status_email_idx" ON "TenantInvitation"("status", "email");

-- TenantApiKey indexes
CREATE INDEX "TenantApiKey_tenantId_idx" ON "TenantApiKey"("tenantId");
CREATE INDEX "TenantApiKey_isActive_idx" ON "TenantApiKey"("isActive");

-- AutomationLog indexes
CREATE INDEX "AutomationLog_tenantId_idx" ON "AutomationLog"("tenantId");
CREATE INDEX "AutomationLog_workflowType_idx" ON "AutomationLog"("workflowType");
CREATE INDEX "AutomationLog_status_idx" ON "AutomationLog"("status");

-- AdminAuditLog indexes
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");
CREATE INDEX "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- SetupToken indexes
CREATE INDEX "SetupToken_token_idx" ON "SetupToken"("token");
CREATE INDEX "SetupToken_email_idx" ON "SetupToken"("email");

-- TrialAccessLog indexes
CREATE INDEX "TrialAccessLog_tenantId_idx" ON "TrialAccessLog"("tenantId");
CREATE INDEX "TrialAccessLog_userId_idx" ON "TrialAccessLog"("userId");
CREATE INDEX "TrialAccessLog_feature_idx" ON "TrialAccessLog"("feature");
CREATE INDEX "TrialAccessLog_allowed_idx" ON "TrialAccessLog"("allowed");
CREATE INDEX "TrialAccessLog_createdAt_idx" ON "TrialAccessLog"("createdAt");
CREATE INDEX "TrialAccessLog_tenantId_feature_idx" ON "TrialAccessLog"("tenantId", "feature");
CREATE INDEX "TrialAccessLog_tenantId_userId_idx" ON "TrialAccessLog"("tenantId", "userId");

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_tenantsettings_updated_at BEFORE UPDATE ON "TenantSettings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesshours_updated_at BEFORE UPDATE ON "BusinessHours"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenantsubscription_updated_at BEFORE UPDATE ON "TenantSubscription"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenantusagestats_updated_at BEFORE UPDATE ON "TenantUsageStats"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
