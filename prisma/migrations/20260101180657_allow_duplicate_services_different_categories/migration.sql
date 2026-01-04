/*
  Warnings:

  - You are about to drop the column `username` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[shopId,serviceName,category]` on the table `shop_services` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "customers_username_key";

-- DropIndex
DROP INDEX "shop_services_shopId_serviceName_key";

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "username";

-- CreateIndex
CREATE UNIQUE INDEX "shop_services_shopId_serviceName_category_key" ON "shop_services"("shopId", "serviceName", "category");
