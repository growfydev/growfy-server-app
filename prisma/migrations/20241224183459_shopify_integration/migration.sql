-- AlterTable
ALTER TABLE "ShopifyIntegration" ADD COLUMN     "hasDiscounts" BOOLEAN,
ADD COLUMN     "hasGiftCards" BOOLEAN,
ADD COLUMN     "shopCountry" TEXT,
ADD COLUMN     "shopCurrency" TEXT,
ADD COLUMN     "shopEmail" TEXT,
ADD COLUMN     "shopId" INTEGER,
ADD COLUMN     "shopOwner" TEXT,
ADD COLUMN     "shopPlan" TEXT,
ALTER COLUMN "shopDomain" DROP NOT NULL;
