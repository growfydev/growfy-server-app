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
	for (let i = 0; i < permissionNames.length; i++) {
		await prisma.permission.upsert({
			where: { id: i + 1 },
			update: {},
			create: { id: i + 1, name: permissionNames[i] },
		});
	}

	const profileRolePermissions: Record<
		ProfileMemberRoles,
		PermissionFlags[]
	> = {
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
		CONTENT_CREATOR: [
			PermissionFlags.VIEW,
			PermissionFlags.PLAN_AND_PUBLISH,
		],
		CLIENT: [PermissionFlags.VIEW],
		GUEST: [],
	};

	for (const [role, permissions] of Object.entries(profileRolePermissions)) {
		const profileRole = role as ProfileMemberRoles;
		for (const permission of permissions) {
			const perm = await prisma.permission.findFirst({
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
	console.log('Example user upserted:', exampleUser);

	await fillProvidersAndSocials();
	await seedPostTypesAndRelations();
	await seedFormatExportPost();
}

async function createExampleUser() {
	const user = await prisma.user.upsert({
		where: { email: 'johndoe@example.com' },
		update: {},
		create: {
			id: 1,
			name: 'John Doe',
			email: 'johndoe@example.com',
			phone: '123-456-7890',
			password: await hashPassword('123456'),
		},
	});

	const profiles = [
		{
			id: 1,
			name: 'John Company',
			roles: [ProfileMemberRoles.OWNER, ProfileMemberRoles.MANAGER],
		},
		{ id: 2, name: 'Jane Consultancy', roles: [ProfileMemberRoles.OWNER] },
		{
			id: 3,
			name: 'Doe Ventures',
			roles: [ProfileMemberRoles.MANAGER, ProfileMemberRoles.EDITOR],
		},
	];

	const createdProfiles = await Promise.all(
		profiles.map(async (profileData) => {
			const profile = await prisma.profile.upsert({
				where: { id: profileData.id },
				update: {},
				create: {
					id: profileData.id,
					name: profileData.name,
					userId: user.id,
				},
			});

			const member = await prisma.member.upsert({
				where: {
					userId_profileId: {
						userId: user.id,
						profileId: profile.id,
					},
				},
				update: {},
				create: {
					userId: user.id,
					profileId: profile.id,
				},
			});

			await Promise.all(
				profileData.roles.map(async (role: any, index: number) => {
					const memberRoleId = member.id * 10 + index + 1;

					await prisma.memberRole.upsert({
						where: { id: memberRoleId },
						update: {},
						create: {
							id: memberRoleId,
							memberId: member.id,
							role,
						},
					});
				}),
			);
			return { profile, member };
		}),
	);

	return { user, profiles: createdProfiles.map(({ profile }) => profile) };
}

async function fillProvidersAndSocials() {
	const socialNetworks = Object.values(ProviderNames);

	for (let i = 0; i < socialNetworks.length; i++) {
		await prisma.provider.upsert({
			where: { id: i + 1 },
			update: {},
			create: { id: i + 1, name: socialNetworks[i] },
		});
	}

	console.log('Providers upserted successfully.');

	const profile = await prisma.profile.findFirst();
	if (!profile) {
		console.warn('No profile found to associate with socials.');
		return;
	}

	const socials = [
		{
			id: 1,
			access_token: 'facebook-token-example',
			accountId: 'facebook-account-123',
			providerId: 1,
			profileId: profile.id,
		},
		{
			id: 2,
			access_token: 'youtube-token-example',
			accountId: 'youtube-account-456',
			providerId: 2,
			profileId: profile.id,
		},
		{
			id: 3,
			access_token: 'instagram-token-example',
			accountId: 'instagram-account-789',
			providerId: 3,
			profileId: profile.id,
		},
	];

	for (const social of socials) {
		await prisma.social.upsert({
			where: { id: social.id },
			update: {},
			create: social,
		});
	}

	console.log('Socials upserted successfully.');
}

async function seedPostTypesAndRelations() {
	const postTypes = [
		{ id: 1, name: 'message' },
		{ id: 2, name: 'short_video' },
		{ id: 3, name: 'image' },
	];

	for (const postType of postTypes) {
		await prisma.postType.upsert({
			where: { id: postType.id },
			update: {},
			create: postType,
		});
	}

	console.log('PostTypes upserted successfully.');
}

async function seedFormatExportPost() {
	const formats = [
		{ id: 1, format: 'PDF' },
		{ id: 2, format: 'EXCEL' },
	];

	for (const format of formats) {
		await prisma.exportFormat.upsert({
			where: { id: format.id },
			update: {},
			create: format,
		});
	}

	console.log('Export formats upserted successfully.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
