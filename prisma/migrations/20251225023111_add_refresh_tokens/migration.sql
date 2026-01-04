/*
  Warnings:

  - You are about to drop the `shop_labor_rates` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "shop_labor_rates" DROP CONSTRAINT "shop_labor_rates_shopId_fkey";

-- DropTable
DROP TABLE "shop_labor_rates";

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;
