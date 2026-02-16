-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_shop_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shopId" TEXT NOT NULL,
    "defaultLaborRate" REAL NOT NULL DEFAULT 0,
    "overtimeMultiplier" REAL NOT NULL DEFAULT 1.5,
    "inventoryMarkup" REAL NOT NULL DEFAULT 0.30,
    "businessHours" TEXT,
    "taxRate" REAL NOT NULL DEFAULT 0,
    "allowTimeTracking" BOOLEAN NOT NULL DEFAULT true,
    "requireClockInOut" BOOLEAN NOT NULL DEFAULT false,
    "gpsVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "shopLatitude" REAL,
    "shopLongitude" REAL,
    "gpsRadiusMeters" INTEGER DEFAULT 100,
    "weeklyPayrollBudget" REAL,
    "monthlyPayrollBudget" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shop_settings_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_shop_settings" ("allowTimeTracking", "businessHours", "createdAt", "defaultLaborRate", "gpsRadiusMeters", "gpsVerificationEnabled", "id", "monthlyPayrollBudget", "overtimeMultiplier", "requireClockInOut", "shopId", "shopLatitude", "shopLongitude", "taxRate", "updatedAt", "weeklyPayrollBudget") SELECT "allowTimeTracking", "businessHours", "createdAt", "defaultLaborRate", "gpsRadiusMeters", "gpsVerificationEnabled", "id", "monthlyPayrollBudget", "overtimeMultiplier", "requireClockInOut", "shopId", "shopLatitude", "shopLongitude", "taxRate", "updatedAt", "weeklyPayrollBudget" FROM "shop_settings";
DROP TABLE "shop_settings";
ALTER TABLE "new_shop_settings" RENAME TO "shop_settings";
CREATE UNIQUE INDEX "shop_settings_shopId_key" ON "shop_settings"("shopId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
