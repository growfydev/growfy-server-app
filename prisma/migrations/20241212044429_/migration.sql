-- CreateEnum
CREATE TYPE "StorageService" AS ENUM ('GOOGLE_DRIVE', 'DROPBOX');

-- CreateTable
CREATE TABLE "StorageProfile" (
    "id" SERIAL NOT NULL,
    "profileId" INTEGER NOT NULL,
    "service" "StorageService" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "StorageProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageProfile_profileId_service_key" ON "StorageProfile"("profileId", "service");

-- AddForeignKey
ALTER TABLE "StorageProfile" ADD CONSTRAINT "StorageProfile_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
