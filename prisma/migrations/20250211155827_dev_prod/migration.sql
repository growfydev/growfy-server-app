/*
  Warnings:

  - Added the required column `abandonedCheckouts` to the `ShopifyDailyStats` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ShopifyCheckoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'ABANDONED');

-- DropForeignKey
ALTER TABLE "ShopifyIntegration" DROP CONSTRAINT "ShopifyIntegration_profileId_fkey";

-- DropForeignKey
ALTER TABLE "ShopifyLineItem" DROP CONSTRAINT "ShopifyLineItem_shopifyOrderId_fkey";

-- AlterTable
ALTER TABLE "ShopifyDailyStats" ADD COLUMN     "abandonedCheckouts" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ShopifyIntegration" ALTER COLUMN "profileId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ShopifyLineItem" ADD COLUMN     "shopifyCheckoutId" TEXT,
ALTER COLUMN "shopifyOrderId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ShopifyOrder" ADD COLUMN     "shopifyCheckoutId" TEXT;

-- CreateTable
CREATE TABLE "ShopifyCheckout" (
    "id" SERIAL NOT NULL,
    "checkoutId" TEXT NOT NULL,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "currency" TEXT,
    "totalPrice" DECIMAL(65,30),
    "status" "ShopifyCheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "shopifyCreatedAt" TIMESTAMP(3),
    "shopifyCustomerId" TEXT,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCheckout_checkoutId_key" ON "ShopifyCheckout"("checkoutId");

-- AddForeignKey
ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyCheckoutId_fkey" FOREIGN KEY ("shopifyCheckoutId") REFERENCES "ShopifyCheckout"("checkoutId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("orderId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyCheckoutId_fkey" FOREIGN KEY ("shopifyCheckoutId") REFERENCES "ShopifyCheckout"("checkoutId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyCheckout" ADD CONSTRAINT "ShopifyCheckout_shopifyCustomerId_fkey" FOREIGN KEY ("shopifyCustomerId") REFERENCES "Customer"("shopifyCustomerId") ON DELETE SET NULL ON UPDATE CASCADE;
