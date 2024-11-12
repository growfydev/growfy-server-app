/*
  Warnings:

  - A unique constraint covering the columns `[provider,userId]` on the table `SocialAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_provider_userId_key" ON "SocialAccount"("provider", "userId");
