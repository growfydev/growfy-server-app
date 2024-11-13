/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `Profile` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_teamId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "userId" INTEGER,
ALTER COLUMN "teamId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_userId_key" ON "Profile"("name", "userId");

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
