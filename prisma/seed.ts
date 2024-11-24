import { PrismaClient, ProfileMemberRoles, PermissionFlags } from '@prisma/client';

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

    const profileRolePermissions: Record<ProfileMemberRoles, PermissionFlags[]> = {
        OWNER: [
            PermissionFlags.VIEW,
            PermissionFlags.MANAGEMENT,
            PermissionFlags.EDIT,
        ],
        MEMBER: [PermissionFlags.VIEW],
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

    for (const [role, permissions] of Object.entries(profileRolePermissions)) {
        const profileRole = role as ProfileMemberRoles;
        for (const permission of permissions) {
            const perm = await prisma.permission.findUnique({ where: { name: permission } });
            if (perm) {
                await prisma.profileRolePermission.upsert({
                    where: {
                        profileRoles_permissionId: {
                            profileRoles: profileRole,
                            permissionId: perm.id,
                        },
                    },
                    update: {},
                    create: {
                        profileRoles: profileRole,
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
