import { Injectable } from '@nestjs/common';
import { ProfileMemberRoles } from '@prisma/client';
import { PrismaService } from 'src/core/prisma.service';

@Injectable()
export class MemberService {
  constructor(private prisma: PrismaService) { }

  async createMember(
    userId: number,
    profileId: number,
    role: ProfileMemberRoles,
  ): Promise<any> {
    return this.prisma.member.create({ data: { userId, profileId, role } });
  }

  async getRolePermissions(role: ProfileMemberRoles): Promise<string[]> {
    const permissions = await this.prisma.profileRolePermission.findMany({
      where: { profileRoles: role },
      select: { permission: { select: { name: true } } },
    });
    return permissions.map((p) => p.permission.name);
  }

  async getUserProfilesAndRoles(
    userId: number,
  ): Promise<
    {
      id: number;
      name: string;
      roles: ProfileMemberRoles[];
      permissions: string[];
    }[]
  > {
    // Fetch all memberships for the user, including the profiles
    const members = await this.prisma.member.findMany({
      where: { userId, globalStatus: 'ACTIVE' },
      include: {
        profile: true,
      },
    });

    if (members.length === 0) return [];

    // Fetch all unique roles from the memberships
    const roles = members.map((member) => member.role);

    // Fetch all permissions for these roles in one query
    const permissionsByRole = await this.prisma.profileRolePermission.findMany({
      where: { profileRoles: { in: roles } },
      select: { profileRoles: true, permission: { select: { name: true } } },
    });

    // Map role to its permissions
    const rolePermissionsMap = permissionsByRole.reduce((map, item) => {
      const role = item.profileRoles;
      if (!map[role]) {
        map[role] = [];
      }
      map[role].push(item.permission.name);
      return map;
    }, {} as Record<ProfileMemberRoles, string[]>);

    // Build the profiles and roles result
    return members.map((member) => ({
      id: member.profile.id,
      name: member.profile.name,
      roles: [member.role], // Adjust if multiple roles per member
      permissions: rolePermissionsMap[member.role] || [],
    }));
  }
}
