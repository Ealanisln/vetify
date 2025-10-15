-- DropForeignKey
ALTER TABLE "CashDrawer" DROP CONSTRAINT "CashDrawer_openedById_fkey";

-- AddForeignKey
ALTER TABLE "CashDrawer" ADD CONSTRAINT "CashDrawer_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

