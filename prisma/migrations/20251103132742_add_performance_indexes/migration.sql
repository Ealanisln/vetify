-- CreateIndex: Add performance indexes for frequently queried fields
-- This migration adds critical indexes to improve dashboard load times and eliminate 10s timeout errors

-- Tenant subscription status (checked on EVERY auth)
-- Used by: requireAuth, middleware, subscription checks
CREATE INDEX IF NOT EXISTS "idx_tenant_subscription_status"
ON "Tenant"("subscriptionStatus");

-- User tenant lookup (auth flow)
-- Used by: findOrCreateUser, findUserById
CREATE INDEX IF NOT EXISTS "idx_user_tenant_active"
ON "User"("tenantId", "isActive") WHERE "tenantId" IS NOT NULL;

-- Staff tenant filtering
-- Used by: staff queries, role checks
CREATE INDEX IF NOT EXISTS "idx_staff_tenant_active"
ON "Staff"("tenantId", "isActive");

-- Customer tenant filtering
-- Used by: customer listings, dashboard stats
CREATE INDEX IF NOT EXISTS "idx_customer_tenant_active"
ON "Customer"("tenantId", "isActive");

-- Appointment datetime queries (dashboard upcoming appointments)
-- Used by: getDashboardStats, calendar views
CREATE INDEX IF NOT EXISTS "idx_appointment_tenant_datetime"
ON "Appointment"("tenantId", "dateTime");

-- Pet tenant + customer lookup
-- Used by: pet listings, dashboard recent pets
CREATE INDEX IF NOT EXISTS "idx_pet_tenant_customer"
ON "Pet"("tenantId", "customerId");

-- Medical history tenant filtering
-- Used by: medical record queries
CREATE INDEX IF NOT EXISTS "idx_medical_history_tenant"
ON "MedicalHistory"("tenantId");

-- Sale tenant + date filtering
-- Used by: reports, sales analytics
CREATE INDEX IF NOT EXISTS "idx_sale_tenant_date"
ON "Sale"("tenantId", "saleDate");
