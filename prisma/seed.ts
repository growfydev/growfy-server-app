import {
  PermissionFlags,
  PrismaClient,
  ProfileMemberRoles,
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
}

async function fillProvidersAndSocials() {
  // Lista de nombres de redes sociales
  const socialNetworks = [
    'facebook',
    'instagram',
    'twitter',
    'linterest',
    'linkedIn',
    'youTube',
    'tikTok',
  ];

  // Construir los objetos con datos para insertar
  const providers = socialNetworks.map((network) => ({
    name: network,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  // Insertar los registros en la base de datos
  await prisma.provider.createMany({
    data: providers,
    skipDuplicates: true, // Evita errores si ya existen registros duplicados
  });

  console.log('Providers seeded successfully with social network names.');
}
async function seedPostTypesAndRelations() {
  // Definir los tipos de post
  const postTypes = [
    {
      name: 'text',
      fields: { title: 'string', content: 'string' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'image',
      fields: { caption: 'string', imgUrl: 'string' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'message',
      fields: { message: 'string' },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Crear los tipos de post en la base de datos
  await prisma.postType.createMany({
    data: postTypes,
    skipDuplicates: true,
  });

  console.log('PostTypes seeded successfully.');

  // Obtener todos los proveedores y tipos de post
  const providers = await prisma.provider.findMany();
  const postTypeIds = await prisma.postType.findMany({ select: { id: true } });

  // Relacionar los proveedores con los tipos de post
  const providerPostTypes = providers.flatMap((provider) =>
    postTypeIds.map((postType) => ({
      providerId: provider.id,
      posttypeId: postType.id,
    })),
  );

  await prisma.providerPostType.createMany({
    data: providerPostTypes,
    skipDuplicates: true,
  });

  console.log('ProviderPostTypes linked successfully.');

  const providerNameToSearch = 'facebook';
  const provider = await prisma.provider.findFirst({
    where: { name: providerNameToSearch },
  });

  // Obtener un perfil para asociarlo con la red social
  const profile = await prisma.profile.findFirst();

  if (provider && profile) {
    // Crear la relación Social
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

    console.log('Social linked successfully.');
  } else {
    console.warn(
      'No provider or profile found to link Social, Post, and Task.',
    );
  }
}

async function createExampleUser() {
  const user = await prisma.user.create({
    data: {
      name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '123-456-7890',
      password: await hashPassword('123456'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const profile = await prisma.profile.create({
    data: {
      name: 'John Doe Profile',
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  const member = await prisma.member.create({
    data: {
      userId: user.id,
      profileId: profile.id,
      role: ProfileMemberRoles.MANAGER,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return { user, profile, member };
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
