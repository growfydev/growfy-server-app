import { PrismaClient, TeamRole, PermissionFlags } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const permissionNames = Object.values(PermissionFlags);
    for (const permission of permissionNames) {
        await prisma.permission.upsert({
            where: { name: permission },
            update: {},
            create: { name: permission },
        });
    }

    const teamRolePermissions: Record<TeamRole, PermissionFlags[]> = {
        TEAM_OWNER: [
            PermissionFlags.VIEW,
            PermissionFlags.MANAGEMENT,
            PermissionFlags.EDIT,
        ],
        TEAM_MEMBER: [PermissionFlags.VIEW],
        ANALYST: [PermissionFlags.VIEW_ANALYTICS],
        EDITOR: [PermissionFlags.EDIT],
        MANAGER: [
            PermissionFlags.VIEW,
            PermissionFlags.MANAGEMENT,
            PermissionFlags.REVIEW_POSTS,
        ],
        CONTENT_CREATOR: [PermissionFlags.VIEW, PermissionFlags.PLAN_AND_PUBLISH],
        CLIENT: [PermissionFlags.VIEW],
        GUEST: [],
    };

    for (const [role, permissions] of Object.entries(teamRolePermissions)) {
        const teamRole = role as TeamRole;
        for (const permission of permissions) {
            const perm = await prisma.permission.findUnique({ where: { name: permission } });
            if (perm) {
                await prisma.teamRolePermission.upsert({
                    where: {
                        teamRole_permissionId: {
                            teamRole: teamRole,
                            permissionId: perm.id,
                        },
                    },
                    update: {},
                    create: {
                        teamRole,
                        permissionId: perm.id,
                    },
                });
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });