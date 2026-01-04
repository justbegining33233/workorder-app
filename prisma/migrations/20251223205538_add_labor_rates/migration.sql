-- AlterTable
ALTER TABLE "shop_services" ALTER COLUMN "price" DROP NOT NULL,
ALTER COLUMN "price" DROP DEFAULT;

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
CREATE UNIQUE INDEX "shop_labor_rates_shopId_name_key" ON "shop_labor_rates"("shopId", "name");

-- AddForeignKey
ALTER TABLE "shop_labor_rates" ADD CONSTRAINT "shop_labor_rates_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
