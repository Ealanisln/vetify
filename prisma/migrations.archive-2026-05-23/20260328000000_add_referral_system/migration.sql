-- CreateEnum
CREATE TYPE "ReferralConversionStatus" AS ENUM ('SIGNUP', 'CONVERTED', 'CHURNED');

-- CreateEnum
CREATE TYPE "ReferralPayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'VOID');

-- CreateTable
CREATE TABLE "ReferralPartner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "discountPercent" INTEGER,
    "discountMonths" INTEGER,
    "stripeCouponId" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralConversion" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "codeId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "ReferralConversionStatus" NOT NULL DEFAULT 'SIGNUP',
    "signedUpAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "planKey" TEXT,
    "subscriptionAmount" DECIMAL(10,2),
    "commissionPercent" DECIMAL(5,2),
    "commissionAmount" DECIMAL(10,2),
    "payoutStatus" "ReferralPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "paidBy" TEXT,
    "payoutNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralPartner_email_key" ON "ReferralPartner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralConversion_codeId_tenantId_key" ON "ReferralConversion"("codeId", "tenantId");

-- CreateIndex
CREATE INDEX "ReferralPartner_email_idx" ON "ReferralPartner"("email");

-- CreateIndex
CREATE INDEX "ReferralPartner_isActive_idx" ON "ReferralPartner"("isActive");

-- CreateIndex
CREATE INDEX "ReferralCode_code_idx" ON "ReferralCode"("code");

-- CreateIndex
CREATE INDEX "ReferralCode_partnerId_idx" ON "ReferralCode"("partnerId");

-- CreateIndex
CREATE INDEX "ReferralCode_isActive_idx" ON "ReferralCode"("isActive");

-- CreateIndex
CREATE INDEX "ReferralConversion_partnerId_idx" ON "ReferralConversion"("partnerId");

-- CreateIndex
CREATE INDEX "ReferralConversion_codeId_idx" ON "ReferralConversion"("codeId");

-- CreateIndex
CREATE INDEX "ReferralConversion_tenantId_idx" ON "ReferralConversion"("tenantId");

-- CreateIndex
CREATE INDEX "ReferralConversion_status_idx" ON "ReferralConversion"("status");

-- CreateIndex
CREATE INDEX "ReferralConversion_payoutStatus_idx" ON "ReferralConversion"("payoutStatus");

-- CreateIndex
CREATE INDEX "ReferralConversion_convertedAt_idx" ON "ReferralConversion"("convertedAt");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "ReferralPartner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "ReferralCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
