import { PermissionFlags, PostStatus, PrismaClient, ProfileMemberRoles, ProviderNames } from '@prisma/client';

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

    await fillProvidersAndSocials();
    await seedPostTypesAndRelations();
}

async function fillProvidersAndSocials() {
    const providers = Object.values(ProviderNames).map((provider) => ({
        name: provider,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await prisma.provider.createMany({
        data: providers,
        skipDuplicates: true,
    });

    console.log('Providers seeded successfully.');
}

async function seedPostTypesAndRelations() {
    // Add PostTypes
    const postTypes = [
        {
            name: 'text',
            fields: { title: "string", content: "string" },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'image',
            fields: { caption: "string", imgUrl: "string" },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'message',
            fields: { message: "string" },
            createdAt: new Date(),
            updatedAt: new Date(),
        },
    ];

    await prisma.postType.createMany({
        data: postTypes,
        skipDuplicates: true
    });

    console.log('PostTypes seeded successfully.');

    const providers = await prisma.provider.findMany();
    const postTypeIds = await prisma.postType.findMany({ select: { id: true } });

    const providerPostTypes = providers.flatMap((provider) =>
        postTypeIds.map((postType) => ({
            providerId: provider.id,
            posttypeId: postType.id,
        }))
    );

    await prisma.providerPostType.createMany({
        data: providerPostTypes,
        skipDuplicates: true,
    });

    console.log('ProviderPostTypes linked successfully.');

    const provider = await prisma.provider.findFirst({ where: { name: ProviderNames.FACEBOOK } });
    const profile = await prisma.profile.findFirst();

    if (provider && profile) {
        await prisma.social.createMany({
            data: [
                {
                    token: 'sample-token',
                    providerId: provider.id,
                    profileId: profile.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            skipDuplicates: true,
        });

        const post = await prisma.post.create({
            data: {
                status: PostStatus.QUEUED,
                profileId: profile.id,
                fields: { message: "Sample message", imgUrl: "http://example.com/image.jpg" },
                createdAt: new Date(),
            },
        });

        await prisma.task.create({
            data: {
                status: 'PENDING',
                unix: Math.floor(Date.now() / 1000),
                postId: post.id,
                createdAt: new Date(),
            },
        });

        console.log('Sample Social, Post, and Task seeded successfully.');
    } else {
        console.warn('No provider or profile found to link Social, Post, and Task.');
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
