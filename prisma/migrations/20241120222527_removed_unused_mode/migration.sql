/*
  Warnings:

  - You are about to drop the `CoreRolePermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CoreRolePermission" DROP CONSTRAINT "CoreRolePermission_permissionId_fkey";

-- DropTable
DROP TABLE "CoreRolePermission";
