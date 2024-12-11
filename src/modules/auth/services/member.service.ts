import { Injectable } from '@nestjs/common';
import { GlobalStatus, Member, ProfileMemberRoles } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class MemberService {
	constructor(private prisma: PrismaService) {}

	/**
	 * Creates a new member with a role in a specific profile.
	 * @param userId - ID of the user.
	 * @param profileId - ID of the profile.
	 * @param role - Role assigned to the user in the profile.
	 * @returns The created member record.
	 */
	async createMember(userId: number, profileId: number): Promise<Member> {
		return this.prisma.member.create({
			data: {
				userId,
				profileId,
			},
		});
	}

	/**
	 * Retrieves permissions associated with a specific role.
	 * @param role - Role for which permissions are required.
	 * @returns A list of permission names.
	 */
	async getRolePermissions(role: ProfileMemberRoles): Promise<string[]> {
		const permissions = await this.prisma.profileRolePermission.findMany({
			where: { profileRoles: role },
			select: { permission: { select: { name: true } } },
		});
		return permissions.map((p) => p.permission.name);
	}

	/**
	 * Fetches active profiles and their roles for a specific user.
	 * @param userId - ID of the user.
	 * @returns A list of profiles with roles and permissions.
	 */
	async getUserProfilesAndRoles(userId: number): Promise<
		{
			id: number;
			name: string;
			roles: ProfileMemberRoles[];
			permissions: string[];
		}[]
	> {
		const members = await this.prisma.member.findMany({
			where: { userId, globalStatus: GlobalStatus.ACTIVE },
			include: { profile: true, roles: true },
		});

		if (!members.length) return [];

		const rolesByMember = members.flatMap((member) =>
			member.roles.map((role) => ({
				memberId: member.id,
				role: role.role,
			})),
		);

		const rolePermissions =
			await this.prisma.profileRolePermission.findMany({
				where: {
					profileRoles: {
						in: rolesByMember.map((rm) => rm.role),
					},
				},
				select: {
					profileRoles: true,
					permission: { select: { name: true } },
				},
			});

		const rolePermissionsMap = rolePermissions.reduce(
			(map, item) => {
				const role = item.profileRoles;
				if (!map[role]) {
					map[role] = [];
				}
				map[role].push(item.permission.name);
				return map;
			},
			{} as Record<ProfileMemberRoles, string[]>,
		);

		return members.map((member) => {
			const memberRoles = rolesByMember
				.filter((rm) => rm.memberId === member.id)
				.map((rm) => rm.role);

			const permissions = memberRoles.flatMap(
				(role) => rolePermissionsMap[role] || [],
			);

			return {
				id: member.profile.id,
				name: member.profile.name,
				roles: memberRoles,
				permissions: [...new Set(permissions)],
			};
		});
	}

	async assignRole(
		memberId: number,
		role: ProfileMemberRoles,
	): Promise<void> {
		await this.prisma.memberRole.create({
			data: {
				memberId,
				role,
			},
		});
	}
}
