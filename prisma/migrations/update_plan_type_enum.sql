-- Migration to update PlanType enum values
-- This migration safely renames enum values to match frontend naming

BEGIN;

-- Step 1: Add new enum values
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'BASICO';
ALTER TYPE "PlanType" ADD VALUE IF NOT EXISTS 'CORPORATIVO';

-- Step 2: Update existing data
-- Map CLINICA -> PROFESIONAL (if any exist)
UPDATE "Tenant" SET "planType" = 'PROFESIONAL' WHERE "planType" = 'CLINICA';

-- Map EMPRESA -> CORPORATIVO (if any exist)
UPDATE "Tenant" SET "planType" = 'CORPORATIVO' WHERE "planType" = 'EMPRESA';

-- Step 3: Note - Cannot remove old enum values while they're in use
-- The old values (CLINICA, EMPRESA) will remain in the enum but won't be used
-- To fully remove them, you'd need to recreate the enum (more complex)

COMMIT;
