-- AlterTable
ALTER TABLE "techs" ADD COLUMN     "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "techId" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "clockIn" TIMESTAMP(3) NOT NULL,
    "clockOut" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION,
    "notes" TEXT,
    "location" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_settings" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "defaultLaborRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "defaultProfitMargin" DOUBLE PRECISION NOT NULL DEFAULT 0.30,
    "businessHours" JSONB,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowTimeTracking" BOOLEAN NOT NULL DEFAULT true,
    "requireClockInOut" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_requests" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "orderDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "time_entries_techId_idx" ON "time_entries"("techId");

-- CreateIndex
CREATE INDEX "time_entries_shopId_idx" ON "time_entries"("shopId");

-- CreateIndex
CREATE INDEX "time_entries_clockIn_idx" ON "time_entries"("clockIn");

-- CreateIndex
CREATE UNIQUE INDEX "shop_settings_shopId_key" ON "shop_settings"("shopId");

-- CreateIndex
CREATE INDEX "inventory_requests_shopId_idx" ON "inventory_requests"("shopId");

-- CreateIndex
CREATE INDEX "inventory_requests_requestedById_idx" ON "inventory_requests"("requestedById");

-- CreateIndex
CREATE INDEX "inventory_requests_status_idx" ON "inventory_requests"("status");

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_techId_fkey" FOREIGN KEY ("techId") REFERENCES "techs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
