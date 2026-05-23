-- AlterEnum
-- Add new email template types for user registration and subscription notifications
ALTER TYPE "EmailTemplate" ADD VALUE IF NOT EXISTS 'NEW_USER_REGISTRATION';
ALTER TYPE "EmailTemplate" ADD VALUE IF NOT EXISTS 'NEW_SUBSCRIPTION_PAYMENT';
