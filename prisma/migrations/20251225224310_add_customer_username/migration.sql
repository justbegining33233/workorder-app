/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "username" TEXT;

-- CreateTable
CREATE TABLE "shop_labor_rates" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_labor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "shop_labor_rates_shopId_idx" ON "shop_labor_rates"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "customers_username_key" ON "customers"("username");

-- AddForeignKey
ALTER TABLE "shop_labor_rates" ADD CONSTRAINT "shop_labor_rates_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
