-- Migration 01: Extensions and Enums
-- This migration sets up all required PostgreSQL extensions and enum types
-- Run this first before any table creation

-- =============================================
-- EXTENSIONS
-- =============================================

-- Enable UUID generation (should already be available in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUM TYPES
-- =============================================

-- Plan Types
CREATE TYPE "PlanType" AS ENUM (
  'PROFESIONAL',
  'CLINICA',
  'EMPRESA'
);

-- Tenant Status
CREATE TYPE "TenantStatus" AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'CANCELLED',
  'PENDING_SETUP'
);

-- Subscription Status
CREATE TYPE "SubscriptionStatus" AS ENUM (
  'ACTIVE',
  'TRIALING',
  'PAST_DUE',
  'CANCELED',
  'UNPAID',
  'INCOMPLETE',
  'INCOMPLETE_EXPIRED',
  'INACTIVE'
);

-- Invitation Status
CREATE TYPE "InviteStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'EXPIRED',
  'REVOKED'
);

-- Treatment Types
CREATE TYPE "TreatmentType" AS ENUM (
  'VACCINATION',
  'DEWORMING',
  'FLEA_TICK',
  'OTHER_PREVENTATIVE'
);

-- Treatment Status
CREATE TYPE "TreatmentStatus" AS ENUM (
  'SCHEDULED',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
  'SKIPPED'
);

-- Vaccination Stage
CREATE TYPE "VaccinationStage" AS ENUM (
  'PUPPY_KITTEN',
  'ADULT',
  'SENIOR',
  'BOOSTER'
);

-- Deworming Type
CREATE TYPE "DewormingType" AS ENUM (
  'INTERNAL',
  'EXTERNAL',
  'BOTH'
);

-- Appointment Status
CREATE TYPE "AppointmentStatus" AS ENUM (
  'SCHEDULED',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_CLIENT',
  'CANCELLED_CLINIC',
  'NO_SHOW'
);

-- Appointment Request Status
CREATE TYPE "AppointmentRequestStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
  'CONVERTED_TO_APPOINTMENT'
);

-- Reminder Type
CREATE TYPE "ReminderType" AS ENUM (
  'APPOINTMENT',
  'TREATMENT',
  'MEDICATION',
  'FOOD_REORDER',
  'CHECKUP',
  'BIRTHDAY',
  'OTHER'
);

-- Reminder Status
CREATE TYPE "ReminderStatus" AS ENUM (
  'PENDING',
  'SENT',
  'ERROR',
  'DISMISSED'
);

-- Inventory Category
CREATE TYPE "InventoryCategory" AS ENUM (
  'MEDICINE',
  'VACCINE',
  'DEWORMER',
  'FLEA_TICK_PREVENTION',
  'FOOD_PRESCRIPTION',
  'FOOD_REGULAR',
  'SUPPLEMENT',
  'ACCESSORY',
  'CONSUMABLE_CLINIC',
  'SURGICAL_MATERIAL',
  'LAB_SUPPLIES',
  'HYGIENE_GROOMING',
  'OTHER'
);

-- Inventory Status
CREATE TYPE "InventoryStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'EXPIRED',
  'DISCONTINUED'
);

-- Movement Type
CREATE TYPE "MovementType" AS ENUM (
  'PURCHASE_IN',
  'SALE_OUT',
  'RETURN_IN',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'EXPIRY_OUT'
);

-- Medical Order Status
CREATE TYPE "MedicalOrderStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

-- Drawer Status
CREATE TYPE "DrawerStatus" AS ENUM (
  'OPEN',
  'CLOSED',
  'RECONCILED'
);

-- Transaction Type
CREATE TYPE "TransactionType" AS ENUM (
  'SALE_CASH',
  'REFUND_CASH',
  'DEPOSIT',
  'WITHDRAWAL',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT'
);

-- Payment Method
CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BANK_TRANSFER',
  'MOBILE_PAYMENT',
  'CHECK',
  'INSURANCE',
  'OTHER'
);

-- Sale Status
CREATE TYPE "SaleStatus" AS ENUM (
  'PENDING',
  'PAID',
  'PARTIALLY_PAID',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
  'PARTIALLY_REFUNDED'
);

-- Service Category
CREATE TYPE "ServiceCategory" AS ENUM (
  'CONSULTATION',
  'SURGERY',
  'VACCINATION',
  'DEWORMING',
  'PREVENTATIVE_CARE',
  'GROOMING',
  'BOARDING',
  'DENTAL_CARE',
  'LABORATORY_TEST',
  'IMAGING_RADIOLOGY',
  'HOSPITALIZATION',
  'EMERGENCY_CARE',
  'EUTHANASIA',
  'OTHER'
);

-- Admin Action
CREATE TYPE "AdminAction" AS ENUM (
  'ASSIGNED',
  'REMOVED',
  'SETUP_COMPLETED'
);

COMMENT ON TYPE "PlanType" IS 'Subscription plan types for tenants';
COMMENT ON TYPE "TenantStatus" IS 'Current status of a tenant account';
COMMENT ON TYPE "SubscriptionStatus" IS 'Status of subscription in Stripe';
