/*
  Warnings:

  - The values [BASIC,STANDARD,PREMIUM,ENTERPRISE] on the enum `PlanType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AdminAction" AS ENUM ('ASSIGNED', 'REMOVED', 'SETUP_COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "PlanType_new" AS ENUM ('PROFESIONAL', 'CLINICA', 'EMPRESA');
ALTER TABLE "Tenant" ALTER COLUMN "planType" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "planType" TYPE "PlanType_new" USING ("planType"::text::"PlanType_new");
ALTER TYPE "PlanType" RENAME TO "PlanType_old";
ALTER TYPE "PlanType_new" RENAME TO "PlanType";
DROP TYPE "PlanType_old";
ALTER TABLE "Tenant" ALTER COLUMN "planType" SET DEFAULT 'PROFESIONAL';
COMMIT;

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "planType" SET DEFAULT 'PROFESIONAL';

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "action" "AdminAction" NOT NULL,
    "performedBy" TEXT,
    "targetUserId" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "usedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminAuditLog_action_idx" ON "AdminAuditLog"("action");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetUserId_idx" ON "AdminAuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SetupToken_token_key" ON "SetupToken"("token");

-- CreateIndex
CREATE INDEX "SetupToken_token_idx" ON "SetupToken"("token");

-- CreateIndex
CREATE INDEX "SetupToken_email_idx" ON "SetupToken"("email");

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupToken" ADD CONSTRAINT "SetupToken_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
