import {
  PermissionFlags,
  PrismaClient,
  ProfileMemberRoles,
  ProviderNames,
} from '@prisma/client';
import { hashPassword } from '../src/modules/auth/utils/crypt';

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

  const profileRolePermissions: Record<ProfileMemberRoles, PermissionFlags[]> =
  {
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
      const perm = await prisma.permission.findUnique({
        where: { name: permission },
      });
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

  const exampleUser = await createExampleUser();
  console.log('Example user created:', exampleUser);
  await fillProvidersAndSocials();
  await seedPostTypesAndRelations();
  await seedFormatExportPost();
}

async function createExampleUser() {
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '123-456-7890',
      password: await hashPassword('123456'),
    },
  });

  const profile = await prisma.profile.create({
    data: {
      name: 'John Company',
      userId: user.id,
    },
  });

  const member = await prisma.member.create({
    data: {
      userId: user.id,
      profileId: profile.id,
      role: ProfileMemberRoles.MANAGER,
    },
  });

  return { user, profile, member };
}

async function fillProvidersAndSocials() {
  const socialNetworks = Object.values(ProviderNames);

  const p = socialNetworks.map((network) => ({
    name: network,
  }));

  const providers = await prisma.provider.createMany({
    data: p,
    skipDuplicates: true,
  });

  console.log('Providers seeded successfully.');

  const profile = await prisma.profile.findFirst();
  if (!profile) {
    console.warn('No profile found to associate with socials.');
    return;
  }

  const socials = [
    {
      access_token: 'facebook-token-example',
      accountId: 'facebook-account-123',
      providerId: 1,
      profileId: profile.id,
    },
    {
      access_token: 'youtube-token-example',
      accountId: 'youtube-account-456',
      providerId: 2,
      profileId: profile.id,
    },
  ];

  await prisma.social.createMany({
    data: socials,
    skipDuplicates: true,
  });

  console.log('Socials seeded successfully.');
}

async function seedPostTypesAndRelations() {
  // Definir los tipos de publicación
  const postTypes = [{ name: 'message' }, { name: 'short_video' }, { name: 'image' }];

  // Crear los postTypes si no existen
  await prisma.postType.createMany({ data: postTypes, skipDuplicates: true });
  console.log('PostTypes seeded successfully.');

  // Obtener todos los proveedores y tipos de publicación
  const providers = await prisma.provider.findMany();
  const postTypeIds = await prisma.postType.findMany({
    select: { id: true, name: true },
  });

  // Diccionario de configuraciones por proveedor
  const providerConfig = {
    FACEBOOK: [
      {
        characterLimit: 63206,
        characterKey: 'message',
        fields: {
          message: 'string',
        },
        postTypeName: 'message',
        providerPostTypeName: 'Facebook message',
      },
      {
        characterLimit: 63206,
        characterKey: 'message',
        fields: {
          message: 'string',
          url: 'string',
        },
        postTypeName: 'image',
        providerPostTypeName: 'Facebook image',
      },
    ],
    YOUTUBE: [
      {
        characterLimit: 5000,
        characterKey: 'snippet.description',
        fields: {
          snippet: {
            title: 'string',
            description: 'string',
            tags: 'string[]',
            categoryId: 'string',
          },
          status: {
            privacyStatus: 'string',
          },
          media: {
            url: 'string',
          },
        },
        postTypeName: 'short_video',
        providerPostTypeName: 'YouTube short',
      },
    ],
  };

  // Crear las relaciones correctas
  const providerPostTypes = providers.flatMap((provider) => {
    const configs = providerConfig[provider.name] || [];
    return configs.flatMap((config) => {
      const postType = postTypeIds.find((pt) => pt.name === config.postTypeName);
      if (postType) {
        return {
          providerId: provider.id,
          posttypeId: postType.id,
          name: config.providerPostTypeName,
          characterLimit: config.characterLimit,
          characterKey: config.characterKey,
          fields: config.fields,
        };
      }
      return [];
    });
  });

  // Insertar las relaciones únicas
  await prisma.providerPostType.createMany({
    data: providerPostTypes,
    skipDuplicates: true,
  });

  console.log('ProviderPostTypes seeded with character limits.');
}

async function seedFormatExportPost() {
  await prisma.exportFormat.createMany({
    data: [
      {
        format: 'PDF',
      },
      {
        format: 'EXCEL',
      },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
