/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_username_key" ON "customers"("username");
