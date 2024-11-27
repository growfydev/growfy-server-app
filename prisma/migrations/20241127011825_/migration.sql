/*
  Warnings:

  - Changed the type of `name` on the `Provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "Provider_name_key";

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "name",
ADD COLUMN     "name" TEXT NOT NULL;
