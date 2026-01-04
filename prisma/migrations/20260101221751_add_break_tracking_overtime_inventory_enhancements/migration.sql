-- AlterTable
ALTER TABLE "inventory_requests" ADD COLUMN     "inventoryItemId" TEXT;

-- AlterTable
ALTER TABLE "shop_settings" ADD COLUMN     "gpsRadiusMeters" INTEGER DEFAULT 100,
ADD COLUMN     "gpsVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "monthlyPayrollBudget" DOUBLE PRECISION,
ADD COLUMN     "overtimeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "shopLatitude" DOUBLE PRECISION,
ADD COLUMN     "shopLongitude" DOUBLE PRECISION,
ADD COLUMN     "weeklyPayrollBudget" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "breakDuration" DOUBLE PRECISION,
ADD COLUMN     "breakEnd" TIMESTAMP(3),
ADD COLUMN     "breakStart" TIMESTAMP(3),
ADD COLUMN     "clockInPhoto" TEXT,
ADD COLUMN     "clockOutPhoto" TEXT;

-- CreateTable
CREATE TABLE "inventory_stock" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "sku" TEXT,
    "category" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unitCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sellingPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorderPoint" INTEGER NOT NULL DEFAULT 10,
    "reorderQuantity" INTEGER NOT NULL DEFAULT 50,
    "supplier" TEXT,
    "supplierSKU" TEXT,
    "location" TEXT,
    "lastRestocked" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inventory_stock_shopId_idx" ON "inventory_stock"("shopId");

-- CreateIndex
CREATE INDEX "inventory_stock_category_idx" ON "inventory_stock"("category");

-- CreateIndex
CREATE INDEX "inventory_stock_quantity_idx" ON "inventory_stock"("quantity");
