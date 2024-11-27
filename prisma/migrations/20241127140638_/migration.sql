/*
  Warnings:

  - Changed the type of `name` on the `Provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "providerPostTypeId" INTEGER;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "name",
ADD COLUMN     "name" "ProviderNames" NOT NULL;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_providerPostTypeId_fkey" FOREIGN KEY ("providerPostTypeId") REFERENCES "ProviderPostType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
