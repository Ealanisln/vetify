/*
  Warnings:

  - The values [CANCELLED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `userId` on the `Pet` table. All the data in the column will be lost.
  - You are about to drop the column `reminderType` on the `Reminder` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `discountAmount` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `receiptNumber` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `Sale` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[saleNumber]` on the table `Sale` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `Tenant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Made the column `duration` on table `Appointment` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `customerId` to the `Pet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerId` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Made the column `message` on table `Reminder` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `customerId` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `saleNumber` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'UNPAID', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'INACTIVE');
ALTER TABLE "TenantSubscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TenantSubscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "TenantSubscription" ALTER COLUMN "status" SET DEFAULT 'TRIALING';
COMMIT;

-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Pet" DROP CONSTRAINT "Pet_userId_fkey";

-- DropForeignKey
ALTER TABLE "Reminder" DROP CONSTRAINT "Reminder_userId_fkey";

-- DropIndex
DROP INDEX "Pet_tenantId_userId_idx";

-- DropIndex
DROP INDEX "Pet_userId_idx";

-- DropIndex
DROP INDEX "Reminder_dueDate_status_idx";

-- DropIndex
DROP INDEX "Sale_date_idx";

-- DropIndex
DROP INDEX "Sale_tenantId_receiptNumber_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "customerId" TEXT NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "duration" SET NOT NULL,
ALTER COLUMN "duration" SET DEFAULT 30,
ALTER COLUMN "status" SET DEFAULT 'SCHEDULED';

-- AlterTable
ALTER TABLE "Pet" DROP COLUMN "userId",
ADD COLUMN     "customerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reminder" DROP COLUMN "reminderType",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "type" "ReminderType" NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL,
ALTER COLUMN "message" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "date",
DROP COLUMN "discountAmount",
DROP COLUMN "receiptNumber",
DROP COLUMN "taxRate",
ADD COLUMN     "customerId" TEXT NOT NULL,
ADD COLUMN     "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "saleNumber" TEXT NOT NULL,
ALTER COLUMN "tax" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "planName" TEXT,
ADD COLUMN     "stripeProductId" TEXT,
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TenantSettings" ADD COLUMN     "defaultEndTime" TEXT NOT NULL DEFAULT '18:00',
ADD COLUMN     "defaultLunchEnd" TEXT DEFAULT '14:00',
ADD COLUMN     "defaultLunchStart" TEXT DEFAULT '13:00',
ADD COLUMN     "defaultSlotDuration" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "defaultStartTime" TEXT NOT NULL DEFAULT '08:00';

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "preferredContactMethod" TEXT DEFAULT 'phone',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHours" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tenantSettingsId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL DEFAULT '08:00',
    "endTime" TEXT NOT NULL DEFAULT '18:00',
    "lunchStart" TEXT DEFAULT '13:00',
    "lunchEnd" TEXT DEFAULT '14:00',
    "slotDuration" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessHours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowType" TEXT NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "executionId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AutomationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "Customer_tenantId_name_idx" ON "Customer"("tenantId", "name");

-- CreateIndex
CREATE INDEX "BusinessHours_tenantId_idx" ON "BusinessHours"("tenantId");

-- CreateIndex
CREATE INDEX "BusinessHours_dayOfWeek_idx" ON "BusinessHours"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessHours_tenantId_dayOfWeek_key" ON "BusinessHours"("tenantId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "AutomationLog_tenantId_idx" ON "AutomationLog"("tenantId");

-- CreateIndex
CREATE INDEX "AutomationLog_workflowType_idx" ON "AutomationLog"("workflowType");

-- CreateIndex
CREATE INDEX "AutomationLog_status_idx" ON "AutomationLog"("status");

-- CreateIndex
CREATE INDEX "Appointment_customerId_idx" ON "Appointment"("customerId");

-- CreateIndex
CREATE INDEX "Pet_customerId_idx" ON "Pet"("customerId");

-- CreateIndex
CREATE INDEX "Pet_tenantId_customerId_idx" ON "Pet"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Reminder_customerId_idx" ON "Reminder"("customerId");

-- CreateIndex
CREATE INDEX "Reminder_dueDate_idx" ON "Reminder"("dueDate");

-- CreateIndex
CREATE INDEX "Reminder_status_idx" ON "Reminder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Sale_saleNumber_key" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Sale_saleNumber_idx" ON "Sale"("saleNumber");

-- CreateIndex
CREATE INDEX "Sale_createdAt_idx" ON "Sale"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeSubscriptionId_key" ON "Tenant"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessHours" ADD CONSTRAINT "BusinessHours_tenantSettingsId_fkey" FOREIGN KEY ("tenantSettingsId") REFERENCES "TenantSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationLog" ADD CONSTRAINT "AutomationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
