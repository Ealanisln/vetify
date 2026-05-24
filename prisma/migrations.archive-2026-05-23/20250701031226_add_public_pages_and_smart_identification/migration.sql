-- CreateEnum
CREATE TYPE "AppointmentRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'CONVERTED_TO_APPOINTMENT');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "mergedFrom" TEXT[],
ADD COLUMN     "needsReview" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "source" TEXT DEFAULT 'MANUAL',
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "publicAddress" TEXT,
ADD COLUMN     "publicBookingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publicDescription" TEXT,
ADD COLUMN     "publicEmail" TEXT,
ADD COLUMN     "publicHours" JSONB,
ADD COLUMN     "publicImages" JSONB,
ADD COLUMN     "publicPageEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicPhone" TEXT,
ADD COLUMN     "publicServices" JSONB,
ADD COLUMN     "publicSocialMedia" JSONB,
ADD COLUMN     "publicThemeColor" TEXT DEFAULT '#75a99c';

-- CreateTable
CREATE TABLE "AppointmentRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "petName" TEXT NOT NULL,
    "service" TEXT,
    "preferredDate" TIMESTAMP(3),
    "preferredTime" TEXT,
    "notes" TEXT,
    "status" "AppointmentRequestStatus" NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL DEFAULT 'PUBLIC_BOOKING',
    "identificationStatus" TEXT,
    "similarCustomerIds" TEXT[],
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentRequest_tenantId_status_idx" ON "AppointmentRequest"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AppointmentRequest_tenantId_createdAt_idx" ON "AppointmentRequest"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentRequest_tenantId_identificationStatus_idx" ON "AppointmentRequest"("tenantId", "identificationStatus");

-- CreateIndex
CREATE INDEX "Customer_tenantId_needsReview_idx" ON "Customer"("tenantId", "needsReview");

-- CreateIndex
CREATE INDEX "Customer_tenantId_source_idx" ON "Customer"("tenantId", "source");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRequest" ADD CONSTRAINT "AppointmentRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
