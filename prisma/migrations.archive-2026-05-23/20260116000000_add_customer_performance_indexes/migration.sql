-- Performance optimization: Add composite indexes for Customer queries
-- These indexes optimize common query patterns filtering by tenantId + isActive

-- Index for filtering active customers by tenant (common pattern)
CREATE INDEX IF NOT EXISTS "Customer_tenantId_isActive_idx" ON "Customer"("tenantId", "isActive");

-- Index for paginated active customer queries with ordering by createdAt
CREATE INDEX IF NOT EXISTS "Customer_tenantId_isActive_createdAt_idx" ON "Customer"("tenantId", "isActive", "createdAt" DESC);
