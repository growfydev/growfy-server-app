-- CreateEnum
CREATE TYPE "PermissionFlags" AS ENUM ('VIEW', 'VIEW_ANALYTICS', 'VIEW_INBOX', 'VIEW_PLANNER', 'VIEW_ADS', 'SMARTLINKS', 'EDIT', 'REPORTS', 'INBOX', 'ADS', 'HASHTAG_TRACKER', 'PLANNER', 'PLAN_AND_PUBLISH', 'PLAN_PENDING_REVIEW', 'REVIEW_POSTS', 'MANAGEMENT', 'BRAND');

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "role" SET DEFAULT 'TEAM_OWNER';

-- DropEnum
DROP TYPE "PermissionFlagsBits";

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
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CoreRolePermission_coreRole_permissionId_key" ON "CoreRolePermission"("coreRole", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRolePermission_teamRole_permissionId_key" ON "TeamRolePermission"("teamRole", "permissionId");

-- AddForeignKey
ALTER TABLE "CoreRolePermission" ADD CONSTRAINT "CoreRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRolePermission" ADD CONSTRAINT "TeamRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
