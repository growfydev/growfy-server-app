/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `name` on the `Provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProviderNames" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'PINTEREST');

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "name",
ADD COLUMN     "name" "ProviderNames" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");
