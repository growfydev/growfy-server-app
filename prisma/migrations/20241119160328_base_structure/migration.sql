/*
  Warnings:

  - You are about to drop the column `relatedUserId` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Profile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,profileId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `profileId` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `role` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "Member_relatedUserId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "relatedUserId",
ADD COLUMN     "profileId" INTEGER NOT NULL,
ADD COLUMN     "role" "TeamRole" NOT NULL;

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_profileId_key" ON "Member"("userId", "profileId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
