/*
  Warnings:

  - A unique constraint covering the columns `[shopifyCustomerId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "shopifyCustomerId" TEXT;

-- AlterTable
ALTER TABLE "ShopifyIntegration" ALTER COLUMN "hasDiscounts" SET DEFAULT false,
ALTER COLUMN "hasGiftCards" SET DEFAULT false;

-- CreateTable
CREATE TABLE "ShopifyOrder" (
    "id" SERIAL NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT,
    "financialStatus" TEXT,
    "currency" TEXT,
    "subTotal" DECIMAL(65,30),
    "totalPrice" DECIMAL(65,30),
    "shopifyCreatedAt" TIMESTAMP(3),
    "paymentMethods" TEXT[],
    "shippingAddress" TEXT,
    "shippingLat" DECIMAL(65,30),
    "shippingLong" DECIMAL(65,30),
    "statusPageUrl" TEXT,
    "shopifyCustomerId" TEXT,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "hasDiscounts" BOOLEAN DEFAULT false,
    "hasGiftCards" BOOLEAN DEFAULT false,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyLineItem" (
    "id" SERIAL NOT NULL,
    "shopifyOrderId" TEXT NOT NULL,
    "lineItemId" TEXT NOT NULL,
    "shopifyProductId" TEXT,
    "quantity" INTEGER,
    "price" DECIMAL(65,30),
    "originalUnitPrice" DECIMAL(65,30),
    "discountedUnitPrice" DECIMAL(65,30),
    "originalTotal" DECIMAL(65,30),
    "discountedTotal" DECIMAL(65,30),
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyProduct" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "title" TEXT,
    "totalInventory" INTEGER,
    "vendor" TEXT,
    "featuredImage" TEXT,
    "featuredImageAltText" TEXT,
    "minPrice" DECIMAL(65,30),
    "maxPrice" DECIMAL(65,30),
    "currency" TEXT,
    "collections" TEXT[],
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyDailyStats" (
    "id" SERIAL NOT NULL,
    "shopifyIntegrationId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "avgOrderValue" DOUBLE PRECISION NOT NULL,
    "products" JSONB NOT NULL,
    "customers" JSONB NOT NULL,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyDailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyOrder_orderId_key" ON "ShopifyOrder"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyLineItem_lineItemId_key" ON "ShopifyLineItem"("lineItemId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProduct_productId_key" ON "ShopifyProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyDailyStats_shopifyIntegrationId_date_key" ON "ShopifyDailyStats"("shopifyIntegrationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shopifyCustomerId_key" ON "Customer"("shopifyCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyCustomerId_fkey" FOREIGN KEY ("shopifyCustomerId") REFERENCES "Customer"("shopifyCustomerId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyOrder" ADD CONSTRAINT "ShopifyOrder_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "ShopifyOrder"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyLineItem" ADD CONSTRAINT "ShopifyLineItem_shopifyProductId_fkey" FOREIGN KEY ("shopifyProductId") REFERENCES "ShopifyProduct"("productId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyProduct" ADD CONSTRAINT "ShopifyProduct_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyDailyStats" ADD CONSTRAINT "ShopifyDailyStats_shopifyIntegrationId_fkey" FOREIGN KEY ("shopifyIntegrationId") REFERENCES "ShopifyIntegration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
