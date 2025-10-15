-- Migration 02: Core Tables
-- Creates foundational tables: Tenant, Plan, User, Role, UserRole
-- These tables have no foreign key dependencies on other tables

-- =============================================
-- TENANT TABLE
-- =============================================

CREATE TABLE "Tenant" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "domain" TEXT UNIQUE,
  "logo" TEXT,
  "primaryColor" TEXT,
  "secondaryColor" TEXT,
  "planType" "PlanType" NOT NULL DEFAULT 'PROFESIONAL',
  "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
  "isTrialPeriod" BOOLEAN NOT NULL DEFAULT true,
  "trialEndsAt" TIMESTAMP(3),

  -- Enhanced trial tracking
  "trialExtendedAt" TIMESTAMP(3),
  "trialExtendedBy" TEXT,
  "gracePeriodEnds" TIMESTAMP(3),
  "lastTrialCheck" TIMESTAMP(3),

  -- Enhanced Stripe Integration
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT UNIQUE,
  "stripeProductId" TEXT,
  "planName" TEXT,
  "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
  "subscriptionEndsAt" TIMESTAMP(3),

  -- Public page configuration
  "publicPageEnabled" BOOLEAN NOT NULL DEFAULT false,
  "publicDescription" TEXT,
  "publicPhone" TEXT,
  "publicEmail" TEXT,
  "publicAddress" TEXT,
  "publicHours" JSONB,
  "publicServices" JSONB,
  "publicImages" JSONB,
  "publicSocialMedia" JSONB,
  "publicThemeColor" TEXT DEFAULT '#75a99c',
  "publicBookingEnabled" BOOLEAN NOT NULL DEFAULT true,

  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "Tenant" IS 'Multi-tenant organizations (veterinary clinics)';
COMMENT ON COLUMN "Tenant"."slug" IS 'URL-friendly unique identifier for tenant';
COMMENT ON COLUMN "Tenant"."publicPageEnabled" IS 'Whether public booking page is enabled';

-- =============================================
-- PLAN TABLE
-- =============================================

CREATE TABLE "Plan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "monthlyPrice" DECIMAL(65,30) NOT NULL,
  "annualPrice" DECIMAL(65,30) NOT NULL,
  "features" JSONB NOT NULL,
  "maxUsers" INTEGER NOT NULL,
  "maxPets" INTEGER NOT NULL,
  "storageGB" INTEGER NOT NULL,
  "isRecommended" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isMvp" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "Plan" IS 'Subscription plan definitions';
COMMENT ON COLUMN "Plan"."features" IS 'JSON array of feature flags';

-- =============================================
-- USER TABLE
-- =============================================

CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT,
  "email" TEXT NOT NULL UNIQUE,
  "firstName" TEXT,
  "lastName" TEXT,
  "name" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "preferredContactMethod" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE "User" IS 'User accounts (linked to Kinde Auth)';
COMMENT ON COLUMN "User"."id" IS 'Kinde user ID';

-- =============================================
-- ROLE TABLE
-- =============================================

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "tenantId" TEXT,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Role_tenantId_key_unique" UNIQUE ("tenantId", "key")
);

COMMENT ON TABLE "Role" IS 'Roles for RBAC (tenant-specific and system-wide)';
COMMENT ON COLUMN "Role"."isSystem" IS 'True for system-defined roles that cannot be deleted';

-- =============================================
-- USERROLE TABLE (Junction)
-- =============================================

CREATE TABLE "UserRole" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,

  CONSTRAINT "UserRole_userId_roleId_unique" UNIQUE ("userId", "roleId")
);

COMMENT ON TABLE "UserRole" IS 'Junction table for many-to-many User-Role relationship';

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- User foreign keys
ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "Tenant"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Role foreign keys
ALTER TABLE "Role"
  ADD CONSTRAINT "Role_tenantId_fkey"
  FOREIGN KEY ("tenantId")
  REFERENCES "Tenant"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- UserRole foreign keys
ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "User"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

ALTER TABLE "UserRole"
  ADD CONSTRAINT "UserRole_roleId_fkey"
  FOREIGN KEY ("roleId")
  REFERENCES "Role"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- =============================================
-- INDEXES
-- =============================================

-- Tenant indexes
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX "Tenant_domain_idx" ON "Tenant"("domain");
CREATE INDEX "Tenant_trialEndsAt_idx" ON "Tenant"("trialEndsAt");
CREATE INDEX "Tenant_isTrialPeriod_subscriptionStatus_idx" ON "Tenant"("isTrialPeriod", "subscriptionStatus");

-- User indexes
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "User_email_idx" ON "User"("email");

-- UserRole indexes
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

-- Create trigger function for updating updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_tenant_updated_at BEFORE UPDATE ON "Tenant"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plan_updated_at BEFORE UPDATE ON "Plan"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON "Role"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
