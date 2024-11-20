-- CreateEnum
CREATE TYPE "CoreRole" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('TEAM_OWNER', 'TEAM_MEMBER', 'ANALYST', 'EDITOR', 'MANAGER', 'CONTENT_CREATOR', 'CLIENT', 'GUEST');

-- CreateEnum
CREATE TYPE "PermissionFlags" AS ENUM ('VIEW', 'VIEW_ANALYTICS', 'VIEW_INBOX', 'VIEW_PLANNER', 'VIEW_ADS', 'SMARTLINKS', 'EDIT', 'REPORTS', 'INBOX', 'ADS', 'HASHTAG_TRACKER', 'PLANNER', 'PLAN_AND_PUBLISH', 'PLAN_PENDING_REVIEW', 'REVIEW_POSTS', 'MANAGEMENT', 'BRAND');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" "CoreRole" NOT NULL DEFAULT 'USER',
    "otpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "otpVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpSecret" TEXT,
    "otpAuthURI" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'TEAM_OWNER',

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Social" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "providerId" INTEGER NOT NULL,
    "profileId" INTEGER NOT NULL,

    CONSTRAINT "Social_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Provider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "status" TEXT,
    "body" TEXT,
    "postTypeId" INTEGER,
    "taskId" INTEGER NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,
    "unix" TEXT NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PostType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" "PermissionFlags" NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoreRolePermission" (
    "id" SERIAL NOT NULL,
    "coreRole" "CoreRole" NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "CoreRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRolePermission" (
    "id" SERIAL NOT NULL,
    "teamRole" "TeamRole" NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "TeamRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_profileId_key" ON "Member"("userId", "profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Post_taskId_key" ON "Post"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "Task_postId_key" ON "Task"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoreRolePermission_coreRole_permissionId_key" ON "CoreRolePermission"("coreRole", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRolePermission_teamRole_permissionId_key" ON "TeamRolePermission"("teamRole", "permissionId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Social" ADD CONSTRAINT "Social_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_postTypeId_fkey" FOREIGN KEY ("postTypeId") REFERENCES "PostType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoreRolePermission" ADD CONSTRAINT "CoreRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRolePermission" ADD CONSTRAINT "TeamRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
