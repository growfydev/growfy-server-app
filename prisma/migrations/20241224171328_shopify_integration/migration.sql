-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "shopifyIntegrationId" INTEGER;

-- CreateTable
CREATE TABLE "ShopifyIntegration" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "shopName" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isAuth" BOOLEAN NOT NULL DEFAULT false,
    "globalStatus" "GlobalStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ShopifyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyIntegration_profileId_key" ON "ShopifyIntegration"("profileId");

-- AddForeignKey
ALTER TABLE "ShopifyIntegration" ADD CONSTRAINT "ShopifyIntegration_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
