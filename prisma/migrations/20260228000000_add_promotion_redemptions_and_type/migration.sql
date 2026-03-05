-- AlterTable
ALTER TABLE "SystemPromotion" ADD COLUMN     "currentRedemptions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "maxRedemptions" INTEGER,
ADD COLUMN     "promotionType" TEXT NOT NULL DEFAULT 'DISCOUNT',
ADD COLUMN     "trialDays" INTEGER;
