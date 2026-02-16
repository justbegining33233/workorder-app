-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "canceledAt" DATETIME;
ALTER TABLE "subscriptions" ADD COLUMN "lastPaymentAmount" REAL;
ALTER TABLE "subscriptions" ADD COLUMN "lastPaymentDate" DATETIME;
ALTER TABLE "subscriptions" ADD COLUMN "trialEnd" DATETIME;
ALTER TABLE "subscriptions" ADD COLUMN "trialStart" DATETIME;

-- CreateTable
CREATE TABLE "shop_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shop_schedules_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "shop_blocked_dates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_blocked_dates_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "vendor" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ordered',
    "expectedDate" DATETIME,
    "notes" TEXT,
    "createdById" TEXT,
    "totalCost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_orders_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchaseOrderId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "inventoryStockId" TEXT,
    "itemName" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitCost" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ordered',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "purchase_order_items_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "purchase_order_items_inventoryStockId_fkey" FOREIGN KEY ("inventoryStockId") REFERENCES "inventory_stock" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriptionId" TEXT,
    "stripeInvoiceId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" TEXT NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "sessionId" TEXT,
    "referrer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "workOrderId" TEXT,
    "appointmentId" TEXT,
    "from" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "customer_messages_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_messages_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "customer_messages_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customer_messages" ("content", "customerId", "from", "id", "read", "sentAt", "workOrderId") SELECT "content", "customerId", "from", "id", "read", "sentAt", "workOrderId" FROM "customer_messages";
DROP TABLE "customer_messages";
ALTER TABLE "new_customer_messages" RENAME TO "customer_messages";
CREATE INDEX "customer_messages_customerId_idx" ON "customer_messages"("customerId");
CREATE INDEX "customer_messages_workOrderId_idx" ON "customer_messages"("workOrderId");
CREATE INDEX "customer_messages_appointmentId_idx" ON "customer_messages"("appointmentId");
CREATE INDEX "customer_messages_read_idx" ON "customer_messages"("read");
CREATE TABLE "new_shops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "shopName" TEXT NOT NULL,
    "ownerName" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "businessLicense" TEXT,
    "insurancePolicy" TEXT,
    "shopType" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "approvedAt" DATETIME
);
INSERT INTO "new_shops" ("address", "approvedAt", "businessLicense", "city", "createdAt", "email", "id", "insurancePolicy", "ownerName", "password", "phone", "profileComplete", "shopName", "shopType", "state", "status", "updatedAt", "username", "zipCode") SELECT "address", "approvedAt", "businessLicense", "city", "createdAt", "email", "id", "insurancePolicy", "ownerName", "password", "phone", "profileComplete", "shopName", "shopType", "state", "status", "updatedAt", "username", "zipCode" FROM "shops";
DROP TABLE "shops";
ALTER TABLE "new_shops" RENAME TO "shops";
CREATE UNIQUE INDEX "shops_username_key" ON "shops"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "shop_schedules_shopId_idx" ON "shop_schedules"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "shop_schedules_shopId_dayOfWeek_key" ON "shop_schedules"("shopId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "shop_blocked_dates_shopId_idx" ON "shop_blocked_dates"("shopId");

-- CreateIndex
CREATE INDEX "shop_blocked_dates_date_idx" ON "shop_blocked_dates"("date");

-- CreateIndex
CREATE UNIQUE INDEX "shop_blocked_dates_shopId_date_key" ON "shop_blocked_dates"("shopId", "date");

-- CreateIndex
CREATE INDEX "purchase_orders_shopId_idx" ON "purchase_orders"("shopId");

-- CreateIndex
CREATE INDEX "purchase_order_items_purchaseOrderId_idx" ON "purchase_order_items"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_workOrderId_idx" ON "purchase_order_items"("workOrderId");

-- CreateIndex
CREATE INDEX "purchase_order_items_inventoryStockId_idx" ON "purchase_order_items"("inventoryStockId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_history_stripeInvoiceId_key" ON "payment_history"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "payment_history_subscriptionId_idx" ON "payment_history"("subscriptionId");

-- CreateIndex
CREATE INDEX "payment_history_stripeInvoiceId_idx" ON "payment_history"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "page_views_createdAt_idx" ON "page_views"("createdAt");

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "subscriptions_stripeCustomerId_idx" ON "subscriptions"("stripeCustomerId");
