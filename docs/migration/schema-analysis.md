# Vetify Database Migration Analysis

## Executive Summary

This document outlines the complete database migration strategy from local PostgreSQL development to Supabase production for the Vetify veterinary management platform.

**Project:** vetify-app
**Supabase Project ID:** rqxhmhplxeiprzprobdb
**Region:** us-east-1
**PostgreSQL Version:** 15.8

## Current State

### Existing Schema Status

The Supabase database contains an **outdated partial schema** that requires significant updates:

#### Missing Tables (Must Create)
1. **Customer** - Critical: Pet owners/clients (replaces direct Pet→User relationship)
2. **AutomationLog** - Workflow tracking for N8N integrations
3. **AppointmentRequest** - Public booking requests
4. **AdminAuditLog** - Super admin action tracking
5. **SetupToken** - Tenant setup token management
6. **TrialAccessLog** - Trial period access monitoring
7. **BusinessHours** - Clinic operating hours configuration

#### Tables Requiring Modification
1. **Tenant** - Missing critical fields:
   - Enhanced trial tracking (trialExtendedAt, trialExtendedBy, gracePeriodEnds, lastTrialCheck)
   - Stripe integration fields (stripeProductId, planName, subscriptionStatus, subscriptionEndsAt)
   - Public page configuration (10+ fields for public-facing clinic pages)

2. **Pet** - Breaking change:
   - Change `userId` → `customerId` (now references Customer instead of User)
   - Add `internalId` field

3. **Appointment** - Add `customerId` field for direct customer relationship

4. **Reminder** - Schema changes:
   - Rename `reminderType` → `type`
   - Add `title` field
   - Add `customerId` relationship

5. **Sale** - Multiple changes:
   - Rename `receiptNumber` → `saleNumber`
   - Remove `taxRate` field
   - Rename `discountAmount` → `discount`
   - Add `customerId` relationship

6. **User** - Add relationships to:
   - AdminAuditLog
   - SetupToken
   - TrialAccessLog

7. **TenantSettings** - Add Business Hours configuration fields:
   - defaultStartTime, defaultEndTime
   - defaultLunchStart, defaultLunchEnd
   - defaultSlotDuration

8. **Plan** - Enum changes:
   - Current PlanType enum: BASIC, STANDARD, PREMIUM, ENTERPRISE
   - New PlanType enum: PROFESIONAL, CLINICA, EMPRESA

9. **SubscriptionStatus** - Missing enum values:
   - Add: INCOMPLETE_EXPIRED, INACTIVE

## Required PostgreSQL Extensions

- ✅ **uuid-ossp** - For UUID generation (gen_random_uuid())
- Note: This should already be enabled by default in Supabase

## Migration Strategy

### Phase 1: Schema Updates
1. Enable required PostgreSQL extensions
2. Create new tables (Customer, AutomationLog, etc.)
3. Alter existing tables to match current schema
4. Add missing indexes for performance
5. Update enum types

### Phase 2: Data Migration
Given the schema changes (especially Pet.userId → Pet.customerId), data migration requires:

1. **Customer Migration**
   - Export User data to create Customer records
   - Map User → Customer relationships

2. **Pet Migration**
   - Update Pet.userId → Pet.customerId using Customer mapping

3. **Relationship Updates**
   - Update all tables that reference users to use customers where applicable

### Phase 3: Row Level Security (RLS)

**Critical Security Gap:** No tables currently have RLS enabled.

RLS Policies needed for multi-tenant isolation:
- All tenant-scoped tables must enforce `tenantId` filtering
- Admin tables need special permission handling
- Public booking tables need appropriate access rules

### Phase 4: Indexes & Performance

Missing indexes that should be added:
- Tenant: isTrialPeriod + subscriptionStatus composite index
- Customer: needsReview, source indexes
- Pet: customerId indexes
- Appointment: customerId index
- Many more from Prisma schema

## Risk Assessment

### High Risk Items
1. **Data Migration Complexity** - Pet.userId → Pet.customerId requires careful mapping
2. **Enum Changes** - PlanType enum values completely different
3. **Breaking Schema Changes** - Multiple column renames and type changes
4. **RLS Implementation** - Must be perfect to avoid data leaks in production

### Medium Risk Items
1. **Index Creation** - May take time on large datasets
2. **Foreign Key Constraints** - Must be added in correct order
3. **Default Values** - Some may conflict with existing data

### Mitigation Strategies
1. **Backup First** - Full database backup before any changes
2. **Staged Migration** - Apply changes in phases with verification
3. **Rollback Scripts** - Prepare reverse migrations for each phase
4. **Testing** - Test each phase thoroughly before proceeding

## Recommended Approach

Given the complexity and risks, I recommend a **TWO-TRACK STRATEGY**:

### Option A: Fresh Start (Recommended)
1. Create a completely new Supabase project with clean schema
2. Migrate data from development database
3. Implement full RLS from the start
4. Keep current project as fallback

### Option B: In-Place Migration (Higher Risk)
1. Take full backup
2. Apply migrations in carefully ordered phases
3. Extensive testing between each phase
4. Rollback capability at each step

## Next Steps

The migration plan document recommends **Option A (Fresh Start)** because:
- Current database appears to have little to no production data
- Cleaner RLS implementation from scratch
- Lower risk of data corruption
- Easier to test and verify
- Can keep old project as backup

Would you like me to proceed with creating migration files for either option?
